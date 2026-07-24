import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Gem,
  LockKeyhole,
  Map,
  PawPrint,
  Radio,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import {
  GameState,
  PLANETS,
  Planet,
  SectorLore,
  countControlled,
  getCrystalBonus,
  getGameplayModifiers,
  getPlanetController,
  getPlanetDisplayName,
  getSectorLore,
  isStoryChapterUnlocked,
} from "@/lib/gameState";
import { getStoryReplayMultiplier } from "@/lib/progressionGuidance";
import { useI18n } from "@/lib/i18n";

interface Props {
  gameState: GameState;
  onHome: () => void;
  onLaunch: (planet: Planet) => void;
}

const BIOME_LABELS: Record<Planet["biome"], string> = {
  crystal: "Crystal caverns",
  candy: "Coral wilds",
  ice: "Frozen slipstream",
  jungle: "Ancient canopy",
  nebula: "Ion archipelago",
  ocean: "Alien ocean",
  crater: "Volcanic basin",
  shore: "Starlight coast",
  cave: "Deep crystal vault",
  legendary: "Golden frontier",
};

const BIOME_LABELS_TH: Record<Planet["biome"], string> = {
  crystal: "ถ้ำคริสตัล",
  candy: "ป่าปะการัง",
  ice: "เส้นทางน้ำแข็ง",
  jungle: "พงไพรโบราณ",
  nebula: "หมู่เกาะไอออน",
  ocean: "มหาสมุทรต่างดาว",
  crater: "แอ่งภูเขาไฟ",
  shore: "ชายฝั่งแสงดาว",
  cave: "คลังคริสตัลใต้พิภพ",
  legendary: "พรมแดนสีทอง",
};

const STORY_LORE_TH: Record<string, SectorLore> = {
  "sparkle-moon": { name: "Luma Outpost", chapter: "01 · แสงแรก", threat: "คริสตัลปะทุ", story: "สัญญาณขอความช่วยเหลือเก่าแก่กำลังส่งรหัสประจำตัวของกัปตันซ้ำไปมา", mission: "เปิดเครื่องส่งสัญญาณในอุโมงค์คริสตัลของดวงจันทร์ให้กลับมาทำงาน" },
  "candy-planet": { name: "Kora Wilds", chapter: "02 · สัญญาณที่มีชีวิต", threat: "สปอร์จำแลง", story: "สัญญาณนี้มีชีวิต และกำลังชวนให้คุณตามไป", mission: "ตามรอยสิ่งมีชีวิตจอมซนผ่านป่าปะการังเรืองแสง" },
  "frosty-star": { name: "Vesper Drift", chapter: "03 · ร่องรอยเยือกแข็ง", threat: "ธารน้ำแข็งลื่นไหล", story: "แกนนำทางที่สูญหายเก็บแผนที่ซึ่งถูกลบออกจากทุกคลังข้อมูล", mission: "ฝ่าธารน้ำแข็งที่แปรปรวนและนำแกนนำทางกลับมา" },
  "jungle-world": { name: "Verdant Vault", chapter: "04 · ผู้เฝ้ามอง", threat: "โดรนพิทักษ์", story: "มีใครบางคนคุ้มครองเส้นทางนี้มาตั้งแต่ก่อนสามฝ่ายจะมาถึง", mission: "หลบหลีกผู้พิทักษ์ที่ลาดตระเวนอยู่ใต้พงไพรโบราณ" },
  "rainbow-nebula": { name: "Prism Reach", chapter: "05 · ฟ้าที่แตกสลาย", threat: "พายุไอออน", story: "หน่วยสำรวจคู่แข่งกำลังแย่งชิงกุญแจดวงดาวชิ้นเดียวกัน", mission: "พุ่งข้ามเกาะที่แตกกระจายก่อนพายุจะปิดเส้นทาง" },
  "bubbly-bay": { name: "Pelagos Deep", chapter: "06 · ใต้หมู่ดาว", threat: "แรงดันใต้สมุทร", story: "หอดูดาวที่จมอยู่ชี้ไปยังพื้นที่นอกแผนที่จักรวาล", mission: "จ่ายพลังให้หอดูดาวใต้มหาสมุทรต่างดาว" },
  "cookie-crater": { name: "Cinder Hollow", chapter: "07 · เพลิงจากฟ้า", threat: "ฝนดาวตก", story: "กุญแจดวงดาวปลุกเครื่องจักรที่ซ่อนอยู่ภายในดวงจันทร์", mission: "เก็บเซลล์พลังงานขณะที่พื้นปล่องภูเขาไฟกำลังแตกออก" },
  "starlight-shore": { name: "Astra Shoals", chapter: "08 · ส่งเมล็ดดวงดาว", threat: "กระแสแสง", story: "เมล็ดเหล่านี้อาจรักษาพรมแดน หรือเปิดประตูสุดท้าย", mission: "นำเมล็ดดวงดาวสองชิ้นข้ามทุ่งแสงที่ไม่หยุดนิ่ง" },
  "crystal-cave": { name: "Nullspire", chapter: "09 · สามคู่แข่ง", threat: "ผู้พิทักษ์แห่งความว่างเปล่า", story: "ทั้งสามฝ่ายต้องเลือกว่าจะแย่งประตู หรือร่วมมือกันเปิดมัน", mission: "ผ่านป้อมปราการที่เปลี่ยนรูปและถูกแย่งชิงโดยทุกฝ่าย" },
  "golden-galaxy": { name: "The Aurora Crown", chapter: "10 · เหนือขอบแผนที่", threat: "ผู้พิทักษ์มงกุฎ", story: "สัญญาณที่สูญหายเฝ้ารอ Guardian คนใหม่มาตลอด", mission: "เข้าสู่ Aurora Crown และค้นหาคำตอบใจกลางกาเลีย" },
};

export default function StoryExpeditionConsole({ gameState, onHome, onLaunch }: Props) {
  const { lang, tr } = useI18n();
  const unlocked = PLANETS.filter((planet) => isStoryChapterUnlocked(planet, gameState));
  const recommended = unlocked.find((planet) => !gameState.visitedPlanets.includes(planet.id)) ?? unlocked.at(-1) ?? PLANETS[0];
  const [selectedId, setSelectedId] = useState(recommended.id);
  const selected = PLANETS.find((planet) => planet.id === selectedId) ?? recommended;
  const selectedIndex = PLANETS.findIndex((planet) => planet.id === selected.id);
  const selectedUnlocked = isStoryChapterUnlocked(selected, gameState);
  const selectedVisited = gameState.visitedPlanets.includes(selected.id);
  const lore = lang === "th" ? STORY_LORE_TH[selected.id] ?? getSectorLore(selected.id) : getSectorLore(selected.id);
  const influence = gameState.influence[selected.id];
  const controller = getPlanetController(influence);
  const controlledCount = gameState.faction ? countControlled(gameState.influence, gameState.faction) : 0;
  const campaignProgress = Math.round((gameState.visitedPlanets.length / PLANETS.length) * 100);
  const totalInfluence = Math.max(1, influence.mud + influence.oni + influence.ustur);
  const nextUnlock = PLANETS.find((planet) => !isStoryChapterUnlocked(planet, gameState));
  const modifiers = getGameplayModifiers(gameState);
  const estimatedCrystals = Math.floor(
    getCrystalBonus(
      Math.floor(selected.crystals * getStoryReplayMultiplier(selectedVisited)),
      gameState.faction,
    ) * modifiers.crystalMultiplier,
  );

  const status = useMemo(() => {
    if (!selectedUnlocked) return { label: tr(`Clear Chapter ${selectedIndex}`, `ผ่านบท ${selectedIndex} ก่อน`), tone: "locked" };
    if (selectedVisited) return { label: tr("Chapter cleared", "ผ่านบทนี้แล้ว"), tone: "complete" };
    return { label: tr("Ready to deploy", "พร้อมออกเดินทาง"), tone: "ready" };
  }, [selectedIndex, selectedUnlocked, selectedVisited, tr]);

  return (
    <main className="story-console relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <header className="story-console__hero">
        <img src="/assets/galia-current/nova-reyes-mud-pilot-v2.webp" alt="" />
        <div className="story-console__hero-shade" />
        <div className="story-console__hero-copy">
          <button className="story-console__back" onClick={onHome}><ArrowLeft className="h-4 w-4" /> {tr("All modes", "กลับไปเลือกโหมด")}</button>
          <div className="command-kicker"><Radio className="h-3.5 w-3.5" /> {tr("Campaign signal online", "เชื่อมต่อสัญญาณเนื้อเรื่องแล้ว")}</div>
          <h1>{tr("Story Expeditions", "ผจญภัยตามเนื้อเรื่อง")}</h1>
          <p>{tr("Trace one living signal across ten chapters. Choose a route, complete a short mission, and change who controls the frontier.", "ตามหาความจริงของสัญญาณลึกลับผ่าน 10 บท เลือกเส้นทาง ทำภารกิจ และช่วยฝ่ายของเราดูแลพื้นที่")}</p>
          <button className="story-console__continue" onClick={() => onLaunch(recommended)}>
            <Compass className="h-4 w-4" /> {gameState.visitedPlanets.length ? tr("Continue campaign", "เล่นเนื้อเรื่องต่อ") : tr("Begin chapter one", "เริ่มบทแรก")} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="story-console__hero-stats" aria-label={tr("Campaign progress", "ความคืบหน้าของเนื้อเรื่อง")}>
          <div><strong>{gameState.visitedPlanets.length}/10</strong><span>{tr("chapters cleared", "บทที่ผ่านแล้ว")}</span></div>
          <div><strong>{campaignProgress}%</strong><span>{tr("signal traced", "ตามรอยสัญญาณ")}</span></div>
          <div><strong>{controlledCount}</strong><span>{tr("sectors secured", "พื้นที่ที่ดูแล")}</span></div>
        </div>
      </header>

      <section className="story-console__workspace">
        <aside className="story-chapters" aria-label={tr("Campaign chapters", "บทของเนื้อเรื่อง")}>
          <div className="story-chapters__header">
            <div><span>{tr("Signal trail", "เส้นทางสัญญาณ")}</span><strong>{tr("Select a chapter", "เลือกบทที่ต้องการเล่น")}</strong></div>
            <Map className="h-5 w-5" />
          </div>
          <div className="story-chapters__list hide-scrollbar">
            {PLANETS.map((planet, index) => {
              const chapterUnlocked = isStoryChapterUnlocked(planet, gameState);
              const visited = gameState.visitedPlanets.includes(planet.id);
              const isSelected = planet.id === selected.id;
              const planetLore = lang === "th" ? STORY_LORE_TH[planet.id] ?? getSectorLore(planet.id) : getSectorLore(planet.id);
              return (
                <button
                  key={planet.id}
                  className={`${isSelected ? "is-selected" : ""} ${visited ? "is-complete" : ""}`}
                  onClick={() => setSelectedId(planet.id)}
                  aria-pressed={isSelected}
                >
                  <span className="story-chapters__number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="story-chapters__node">{visited ? <CheckCircle2 /> : chapterUnlocked ? <span>{planet.emoji}</span> : <LockKeyhole />}</span>
                  <span className="story-chapters__copy"><strong>{planetLore.name}</strong><small>{chapterUnlocked ? planetLore.chapter.split("·").at(-1)?.trim() : tr(`Clear Chapter ${index}`, `ผ่านบท ${index} ก่อน`)}</small></span>
                  <ArrowRight className="story-chapters__arrow h-4 w-4" />
                </button>
              );
            })}
          </div>
          <div className="story-chapters__footer">
            <Sparkles className="h-4 w-4" />
            <span>{nextUnlock ? tr(`Clear the current chapter to open ${getSectorLore(nextUnlock.id).name}`, `ผ่านบทปัจจุบันเพื่อเปิด ${getSectorLore(nextUnlock.id).name}`) : tr("Every chapter is open", "เปิดครบทุกบทแล้ว")}</span>
          </div>
        </aside>

        <article className="story-dossier">
          <div className="story-dossier__topline">
            <span className={`story-dossier__status is-${status.tone}`}>{status.label}</span>
            <span>{tr("Chapter", "บทที่")} {String(selectedIndex + 1).padStart(2, "0")} / 10</span>
          </div>

          <div className="story-dossier__title">
            <span>{selected.emoji}</span>
            <div><div className="command-kicker">{lore.chapter}</div><h2>{lore.name}</h2><p>{lang === "th" ? BIOME_LABELS_TH[selected.biome] : BIOME_LABELS[selected.biome]}</p></div>
          </div>

          <div className="story-dossier__narrative">
            <div><Radio className="h-4 w-4" /><span>{tr("Signal fragment", "ข้อมูลจากสัญญาณ")}</span></div>
            <p>{lore.story}</p>
          </div>

          <div className="story-dossier__objective">
            <Target className="h-5 w-5" />
            <div><span>{tr("Mission objective", "เป้าหมายภารกิจ")}</span><strong>{lore.mission}</strong><small>{tr("Threat detected", "สิ่งที่ต้องระวัง")}: {lore.threat}</small></div>
          </div>

          <div className="story-dossier__rewards" aria-label={tr("Mission rewards", "รางวัลภารกิจ")}>
            <div><Gem className="h-4 w-4" /><span>{tr("Estimated crystals", "คริสตัลที่คาดว่าจะได้")}<strong>{estimatedCrystals}</strong><small>{tr("Balanced route · current bonuses", "เส้นทางปกติ · รวมโบนัสปัจจุบัน")}</small></span></div>
            <div><Sparkles className="h-4 w-4" /><span>{tr("Captain XP", "XP กัปตัน")}<strong>{selectedVisited ? Math.floor(selected.xp / 2) : selected.xp}</strong></span></div>
            <div><PawPrint className="h-4 w-4" /><span>{tr("Companion intel", "ข้อมูลเพื่อนร่วมทาง")}<strong>{selected.pet?.name ?? tr("None", "ไม่มี")}</strong></span></div>
          </div>

          <div className="story-dossier__influence">
            <div><span><Shield className="h-4 w-4" /> {tr("Sector influence", "คะแนนพื้นที่")}</span><strong>{controller ? tr(`${controller.toUpperCase()} controlled`, `${controller.toUpperCase()} ดูแลอยู่`) : tr("Contested frontier", "พื้นที่กำลังแข่งขัน")}</strong></div>
            <i role="img" aria-label={`MUD ${influence.mud}, ONI ${influence.oni}, USTUR ${influence.ustur}`}>
              <b className="is-mud" style={{ width: `${influence.mud / totalInfluence * 100}%` }} />
              <b className="is-oni" style={{ width: `${influence.oni / totalInfluence * 100}%` }} />
              <b className="is-ustur" style={{ width: `${influence.ustur / totalInfluence * 100}%` }} />
            </i>
            <small>{tr("Every completed expedition adds influence for your active faction.", "เมื่อทำภารกิจสำเร็จ ฝ่ายของคุณจะได้คะแนนพื้นที่เพิ่ม")}</small>
          </div>

          <button className="story-dossier__launch" disabled={!selectedUnlocked} onClick={() => onLaunch(selected)}>
            {selectedUnlocked ? <><Compass className="h-4 w-4" /> {selectedVisited ? tr("Replay survey", "เล่นบทนี้อีกครั้ง") : tr("Choose route and deploy", "เลือกเส้นทางแล้วออกเดินทาง")} <ArrowRight className="h-4 w-4" /></> : <><LockKeyhole className="h-4 w-4" /> {tr(`Clear Chapter ${selectedIndex}`, `ผ่านบท ${selectedIndex} ก่อน`)}</>}
          </button>
        </article>
      </section>

      <section className="story-flow" aria-label={tr("Story mission flow", "ขั้นตอนเล่นเนื้อเรื่อง")}>
        <div><strong>1</strong><span>{tr("Choose chapter", "เลือกบท")}<small>{tr("Follow the signal trail", "ตามเส้นทางของสัญญาณ")}</small></span></div>
        <ArrowRight />
        <div><strong>2</strong><span>{tr("Pick your route", "เลือกเส้นทาง")}<small>{tr("Scout, Steady, or Salvage", "สำรวจ ปกติ หรือเก็บกู้")}</small></span></div>
        <ArrowRight />
        <div><strong>3</strong><span>{tr("Complete objective", "ทำเป้าหมายให้สำเร็จ")}<small>{tr("Earn rewards and influence", "รับรางวัลและคะแนนพื้นที่")}</small></span></div>
      </section>
    </main>
  );
}
