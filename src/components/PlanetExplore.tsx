import { useState, useCallback, useRef } from "react";
import { Planet, GameState, getActiveShipEmoji, getCrystalBonus, getGameplayModifiers, PLANETS, getPlanetDisplayName, getSectorLore } from "@/lib/gameState";
import { ArrowLeft, Clock3, Gem, Route, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlanetExploration from "@/components/PlanetExploration";
import CelebrationScreen from "@/components/CelebrationScreen";
import { useI18n } from "@/lib/i18n";
import { getMissionBrief } from "@/lib/missionBriefs";
import { getPilot } from "@/lib/loadouts";
import { getStoryReplayMultiplier } from "@/lib/progressionGuidance";

const STORY_LANDING_TH: Record<string, { description: string; story: string; title: string; transmission: string; encounters: string; tip: string; completion: string }> = {
  "sparkle-moon": { description: "สำรวจถ้ำคริสตัลและเก็บแสงพลังงาน", story: "สัญญาณขอความช่วยเหลือกำลังเรียกรหัสของนักบินซ้ำไปมา", title: "การติดต่อครั้งแรก", transmission: "PURI: สัญญาณนี้ตรงกับของเรา มาหาคำตอบกัน", encounters: "เส้นทางเปิด ไม่มีศัตรู เหมาะสำหรับฝึกเดินและเก็บของ", tip: "เดินตามทาง เก็บของให้ครบ แล้วดูจุดกลับยาน", completion: "เก็บคริสตัล 5 ชิ้น แล้วเดินกลับมาที่ช่องยาน" },
  "candy-planet": { description: "ตามหาสัญญาณมีชีวิตในป่าเรืองแสง", story: "สัญญาณนี้มีชีวิต และกำลังชวนให้เราตามไป", title: "รอยเท้ามีชีวิต", transmission: "PURI: มีบางอย่างวิ่งนำหน้าเราอยู่", encounters: "เก็บสัญญาณตามลำดับ จุดถัดไปจะถูกไฮไลต์", tip: "อย่าเก็บข้ามลำดับ มองหาป้าย TRACK", completion: "เก็บสัญญาณตามลำดับให้ครบ ระบบจะพากลับเอง" },
  "frosty-star": { description: "นำยานผ่านทางน้ำแข็งและเก็บชิ้นส่วนนำทาง", story: "ลมเย็นกำลังซ่อนเส้นทางเก่าของกองสำรวจ", title: "ทางลื่นแห่งเวสเปอร์", transmission: "PURI: ทุกก้าวสำคัญ เดินทีละช่องนะ", encounters: "กำแพงน้ำแข็งบังคับให้วางแผนเส้นทาง", tip: "ดูทางตันก่อนเดินและใช้พุ่งเมื่อจำเป็น", completion: "เก็บชิ้นส่วนนำทาง 8 ชิ้น ระบบจะพากลับเอง" },
  "jungle-world": { description: "ค้นหากุญแจในป่าและหลบหน่วยลาดตระเวน", story: "ผู้เฝ้าป่ากำลังปิดบังห้องนิรภัยเก่า", title: "เงาในพงไพร", transmission: "PURI: ระวังแนวสายตาสีแดง", encounters: "ศัตรูเดินเองตามเวลาและทำให้เสีย HP เมื่อชน", tip: "ดูตำแหน่งศัตรูก่อนขยับ ไม่จำเป็นต้องต่อสู้", completion: "เก็บกุญแจ 8 ชิ้น โดยไม่ให้ HP หมด" },
  "rainbow-nebula": { description: "เปิดโหนดปริซึมเพื่อทำลายเกราะผู้พิทักษ์", story: "คู่แข่งกำลังแข่งกับเราเพื่อชิงกุญแจแห่งดวงดาว", title: "เกราะปริซึม", transmission: "PURI: เปิดโหนดทุกจุดเพื่อหยุดผู้พิทักษ์", encounters: "โหนดเรืองแสงกระจายอยู่ทั่วแผนที่", tip: "เดินเหยียบโหนดแต่ละจุดให้ครบ", completion: "เปิดโหนด 5 จุด ระบบจะพากลับเอง" },
  "bubbly-bay": { description: "ขนส่งพลังให้สถานีใต้น้ำ", story: "แรงดันกำลังลดลง และถิ่นอาศัยต้องการพลังงาน", title: "ภารกิจแรงดัน", transmission: "PURI: เก็บพลังแล้วนำไปส่งที่วาล์ว", encounters: "ต้องมีพลังติดตัวก่อนเดินเข้าจุด DROP", tip: "เก็บของอย่างน้อย 2 ชิ้น แล้วส่งให้วาล์วทั้งสอง", completion: "เก็บพลัง 6 ชิ้น และส่งของที่จุด DROP 2 จุด" },
  "cookie-crater": { description: "ทำให้ปล่องดาวเสถียรและกลับยานให้ทัน", story: "พื้นผิวกำลังแตกตัวใต้เส้นทางของเรา", title: "ปล่องดาวไม่เสถียร", transmission: "PURI: หลีกเลี่ยงช่องอันตรายแล้วรีบกลับยาน", encounters: "พื้นที่สีแดงทำให้เสีย HP และมีศัตรูเดินลาดตระเวน", tip: "วางทางกลับไว้ล่วงหน้า อย่าเก็บของจนเวลาใกล้หมด", completion: "เก็บตัวปรับเสถียร 6 ชิ้น แล้วกลับช่องยาน" },
  "starlight-shore": { description: "ช่วยสัญญาณเพื่อนและเปิดทางออก", story: "เสียงเรียกเบา ๆ ซ่อนอยู่ใต้แสงดาวริมฝั่ง", title: "สัญญาณขอความช่วยเหลือ", transmission: "PURI: มีเพื่อนกำลังรอเราอยู่", encounters: "ต้องเก็บดาว พบเพื่อน และเปิดโหนดแสง", tip: "โหนดแสงอยู่มุมล่างซ้ายของแผนที่", completion: "พบเพื่อน เก็บดาว 7 ดวง และเหยียบโหนดแสง 1 จุด" },
  "crystal-cave": { description: "ชาร์จประตูแนวหน้าและเก็บแกนคริสตัล", story: "เส้นทางนี้จะกำหนดว่าใครควบคุมชายแดน", title: "การตัดสินใจแนวหน้า", transmission: "PURI: ส่งพลังให้ประตูทั้งสองก่อนออกไป", encounters: "มีจุด DROP สองแห่งและศัตรูลาดตระเวน", tip: "เก็บพลังแล้วส่งทีละประตู จากนั้นเก็บแกนให้ครบ", completion: "ส่งพลัง 2 จุด เปิดโหนด 2 จุด และเก็บแกน 6 ชิ้น" },
  "golden-galaxy": { description: "ฝ่าด่านสุดท้ายและนำข้อมูลกลับมา", story: "แกนออโรรากำลังตื่นขึ้น และทุกสัญญาณมาบรรจบที่นี่", title: "แกนออโรรา", transmission: "PURI: นี่คือบทสุดท้าย เราจะกลับไปด้วยกัน", encounters: "มีประตู วาร์ป ศัตรู และพื้นที่อันตรายหลายจุด", tip: "เปิดโหนด เก็บของ และเผื่อเวลาสำหรับกลับยาน", completion: "เปิดโหนด 2 จุด พบเพื่อน เก็บแกน 8 ชิ้น แล้วกลับยาน" },
};

interface Props {
  planet: Planet;
  gameState: GameState;
  onCollect: (crystals: number, xp: number, petName: string | null) => void;
  onBack: () => void;
  onContinue: (planet: Planet) => void;
}

export default function PlanetExplore({ planet, gameState, onCollect, onBack, onContinue }: Props) {
  const { t, tr } = useI18n();
  const planetIndex = PLANETS.findIndex(p => p.id === planet.id);
  const displayName = getPlanetDisplayName(planetIndex, gameState.faction);
  const [phase, setPhase] = useState<"landing" | "exploring" | "celebration">("landing");
  const [approachId, setApproachId] = useState<"scout" | "steady" | "salvage">("steady");
  const [bonusCrystals, setBonusCrystals] = useState(0);
  const rewardsClaimed = useRef(false);
  const alreadyVisited = gameState.visitedPlanets.includes(planet.id);
  const hasPet = planet.pet ? gameState.pets.includes(planet.pet.name) : false;
  const modifiers = getGameplayModifiers(gameState);
  const pilot = getPilot(gameState.activePilot);
  const shipEmoji = getActiveShipEmoji(gameState);
  const basePetChance = gameState.faction === "oni" ? 0.9 : (alreadyVisited ? (hasPet ? 0.18 : 0.42) : 0.8);
  const petChance = Math.min(0.98, basePetChance + modifiers.petDiscoveryBonus);
  const [willFindPet] = useState(() => Boolean(!hasPet && planet.pet && Math.random() < petChance));
  const missionBrief = getMissionBrief(planet.id);
  const lore = getSectorLore(planet.id);
  const approaches = {
    scout: { id: "scout" as const, name: tr("Scout route", "เส้นทางสำรวจ"), detail: tr("Reveal hidden items · fewer hazards · start with dash · -10% reward", "เห็นของซ่อน · อันตรายน้อยลง · เริ่มพร้อมพุ่ง · รางวัล -10%"), timeBonus: 8, crystalMultiplier: 0.9, icon: Clock3 },
    steady: { id: "steady" as const, name: tr("Balanced route", "เส้นทางปกติ"), detail: tr("Standard map, objective, pressure, and reward", "แผนที่ เป้าหมาย ความยาก และรางวัลแบบปกติ"), timeBonus: 0, crystalMultiplier: 1, icon: ShieldCheck },
    salvage: { id: "salvage" as const, name: tr("Salvage route", "เส้นทางเก็บกู้"), detail: tr("One extra resource · more patrols · +25% reward", "เก็บของเพิ่ม 1 ชิ้น · ศัตรูเพิ่ม · รางวัล +25%"), timeBonus: -4, crystalMultiplier: 1.25, icon: Gem },
  };
  const approach = approaches[approachId];

  const handleExplorationComplete = useCallback((bonus: number) => {
    setBonusCrystals(bonus);
    setPhase("celebration");
  }, []);

  const baseCrystals = Math.floor(planet.crystals * getStoryReplayMultiplier(alreadyVisited));
  const totalCrystals = Math.floor(
    getCrystalBonus(baseCrystals + bonusCrystals, gameState.faction) * modifiers.crystalMultiplier * approach.crystalMultiplier
  );
  const totalXP = alreadyVisited ? Math.floor(planet.xp / 2) : planet.xp;
  const factionBonusLabel = gameState.faction === "mud" ? tr("MUD salvage +20%", "โบนัสเก็บกู้ MUD +20%") : tr("No faction crystal bonus", "ไม่มีโบนัสคริสตัลจากฝ่าย");
  const pilotBonusLabel = pilot.crystalMultiplier ? `${pilot.name} +${Math.round((pilot.crystalMultiplier - 1) * 100)}%` : tr(`${pilot.name} utility`, `ความสามารถ ${pilot.name}`);
  const otherCrystalMultiplier = modifiers.crystalMultiplier / (pilot.crystalMultiplier ?? 1);
  const systemBonusLabel = otherCrystalMultiplier > 1.001 ? tr(`systems +${Math.round((otherCrystalMultiplier - 1) * 100)}%`, `ระบบยาน +${Math.round((otherCrystalMultiplier - 1) * 100)}%`) : tr("no other reward bonus", "ไม่มีโบนัสอื่น");
  const petToCollect = willFindPet && planet.pet ? planet.pet.name : null;
  const rewardLabel = alreadyVisited ? tr("Replay rewards", "รางวัลเล่นซ้ำ") : tr("First-clear rewards", "รางวัลผ่านครั้งแรก");
  const petStatusLabel = !planet.pet
    ? tr("No companion signal on file", "ไม่มีสัญญาณเพื่อนในพื้นที่นี้")
    : hasPet
      ? tr(`${planet.pet.name} already archived`, `พบ ${planet.pet.name} แล้ว`)
      : tr(`${planet.pet.name} can still be discovered`, `ยังมีโอกาสพบ ${planet.pet.name}`);

  const nextPlanet = PLANETS[planetIndex + 1];
  const canContinue = Boolean(nextPlanet && (!alreadyVisited || gameState.visitedPlanets.includes(planet.id)));

  const bankRewards = () => {
    if (rewardsClaimed.current) return;
    rewardsClaimed.current = true;
    onCollect(totalCrystals, totalXP, petToCollect);
  };
  const handleCelebrationDone = () => {
    bankRewards();
    onBack();
  };
  const handleContinue = () => {
    if (!nextPlanet || !canContinue) return;
    bankRewards();
    onContinue(nextPlanet);
  };

  return (
    <div className="story-mission-screen relative z-10 flex min-h-screen flex-col items-center justify-center overflow-visible px-3 pb-24 pt-28 sm:px-4 sm:pb-28 sm:pt-32">
      <button onClick={onBack}
        className="fixed left-4 top-28 z-[60] flex items-center justify-center min-h-[48px] gap-1.5 rounded-2xl border border-border/60 bg-card/92 px-4 py-2 text-foreground shadow-lg transition-all hover:bg-card">
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-xs sm:text-sm font-bold">{t("galaxyMap")}</span>
      </button>

      {phase === "landing" && (
        <div className="story-landing animate-slide-up">
          <div className="story-landing__hero">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full ${planet.color} ${planet.glowClass} flex items-center justify-center text-3xl sm:text-4xl md:text-5xl animate-float`}>
            {planet.emoji}
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold glow-text" style={{ fontFamily: "var(--font-display)" }}>
            {displayName}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">{tr(planet.description, STORY_LANDING_TH[planet.id]?.description ?? planet.description)}</p>
          <div className="command-kicker">{lore.chapter} · {tr("Threat", "ภัยที่พบ")}: {lore.threat}</div>
          <p className="max-w-md text-sm leading-relaxed text-cyan-50/80">{tr(lore.story, STORY_LANDING_TH[planet.id]?.story ?? lore.story)}</p>
          </div>
          <div className="story-landing__mission">
          <div className="w-full rounded-2xl border border-border/50 bg-card/35 px-4 py-3 text-left shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border/50 bg-background/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {alreadyVisited ? tr("Replay mission", "ภารกิจเล่นซ้ำ") : tr("Story mission", "ภารกิจเนื้อเรื่อง")}
              </span>
              <span className="rounded-full border border-cosmic-cyan/20 bg-cosmic-cyan/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cosmic-cyan">
                {rewardLabel}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-cosmic-yellow/15 bg-cosmic-yellow/5 px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-cosmic-yellow">XP</div>
                <div className="mt-1 text-sm font-bold text-white">{totalXP}</div>
              </div>
              <div className="rounded-xl border border-cosmic-cyan/15 bg-cosmic-cyan/5 px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-cosmic-cyan">{tr("Estimated crystals", "คริสตัลที่คาดว่าจะได้")}</div>
                <div className="mt-1 text-sm font-bold text-white">{totalCrystals}</div>
                <div className="mt-1 text-[10px] leading-relaxed text-cyan-50/65">{tr("Base", "พื้นฐาน")} {baseCrystals} · {factionBonusLabel} · {pilotBonusLabel} · {systemBonusLabel} · {approach.name}</div>
              </div>
              <div className="rounded-xl border border-cosmic-green/15 bg-cosmic-green/5 px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-cosmic-green">{tr("Companion intel", "ข้อมูลเพื่อนร่วมทาง")}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-emerald-50/85">{petStatusLabel}</div>
              </div>
            </div>
          </div>
          {missionBrief && (
            <div className="w-full rounded-2xl border border-cosmic-cyan/20 bg-cosmic-cyan/5 px-4 py-3 text-left">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cosmic-cyan sm:text-xs">
                {tr(missionBrief.title, STORY_LANDING_TH[planet.id]?.title ?? missionBrief.title)}
              </div>
              <p className="mt-1 text-xs font-semibold text-white/90">{tr(missionBrief.transmission, STORY_LANDING_TH[planet.id]?.transmission ?? missionBrief.transmission)}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-cyan-50/85 sm:text-xs">
                {tr(`${lore.mission} ${missionBrief.encounters}`, STORY_LANDING_TH[planet.id]?.encounters ?? `${lore.mission} ${missionBrief.encounters}`)}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-cosmic-green sm:text-xs">
                {tr("How to play", "วิธีเล่น")}: {tr(missionBrief.tip, STORY_LANDING_TH[planet.id]?.tip ?? missionBrief.tip)}
              </p>
              <p className="mt-2 rounded-lg border border-cosmic-yellow/20 bg-cosmic-yellow/5 px-3 py-2 text-[11px] font-bold leading-relaxed text-cosmic-yellow sm:text-xs">
                {tr("How to finish", "เงื่อนไขผ่าน")}: {tr(missionBrief.completion, STORY_LANDING_TH[planet.id]?.completion ?? missionBrief.completion)}
              </p>
            </div>
          )}
          <div className="story-approach" aria-label="Choose mission approach">
            <div className="story-approach__title"><Route className="h-4 w-4" /><span>{tr("Choose how to play this chapter", "เลือกเส้นทางของบทนี้")}</span></div>
            <div className="story-approach__grid">
              {Object.values(approaches).map((option) => {
                const Icon = option.icon;
                return (
                  <button key={option.id} className={approachId === option.id ? "is-active" : ""} onClick={() => setApproachId(option.id)}>
                    <Icon className="h-4 w-4" /><strong>{option.name}</strong><small>{option.detail}</small>
                  </button>
                );
              })}
            </div>
          </div>
          {alreadyVisited && (
            <div className="rounded-2xl border border-cosmic-cyan/20 bg-cosmic-cyan/5 px-4 py-3 text-left">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cosmic-cyan sm:text-xs">{t("surveyRun")}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-cyan-50/85 sm:text-xs">
                {t("replayFocus")}
              </p>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
            <span>⭐ {tr("Final", "รับ")} {totalXP} {t("xp")}</span>
            <span>💎 {tr("Estimated", "คาดว่าจะได้")} {totalCrystals} {t("crystals")}</span>
            {planet.pet && <span>🐾 {planet.pet.emoji} {planet.pet.name}</span>}
          </div>
          <Button onClick={() => setPhase("exploring")}
            className="story-mission-launch text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-bold"
            style={{ fontFamily: "var(--font-display)" }}>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            {tr("Launch", "เริ่ม")} {approach.name}
          </Button>
          </div>
        </div>
      )}

      {phase === "exploring" && (
        <div className="animate-slide-up flex flex-col items-center gap-2 sm:gap-3 w-full">
          <div className="w-full max-w-2xl rounded-2xl border border-border/50 bg-card/35 px-4 py-3 text-center shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
            <h2 className="text-sm sm:text-lg font-bold glow-text" style={{ fontFamily: "var(--font-display)" }}>
              {planet.emoji} {displayName}
            </h2>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
              {alreadyVisited ? tr("Replay active. Focus on missing companions and bonus rewards.", "กำลังเล่นซ้ำ มองหาเพื่อนที่ยังไม่พบและรางวัลพิเศษ") : tr("Story mission active. Complete the objective for full first-clear rewards.", "กำลังเล่นเนื้อเรื่อง ทำเป้าหมายให้ครบเพื่อรับรางวัลผ่านครั้งแรก")}
            </p>
          </div>
          <PlanetExploration
            planetId={planet.id}
            onComplete={handleExplorationComplete}
            missionTimeBonus={modifiers.missionTimeBonus + approach.timeBonus}
            failRewardMultiplier={modifiers.failRewardMultiplier}
            startingHpBonus={modifiers.storyStartingHpBonus}
            startDashReady={modifiers.storyDashReady}
            shipEmoji={shipEmoji}
            pilotImage={pilot.image}
            shipSkinId={gameState.activeSkin}
            routeMode={approachId}
          />
        </div>
      )}

      {phase === "celebration" && (
        <CelebrationScreen
          xp={totalXP} crystals={totalCrystals}
          petName={petToCollect}
          petEmoji={willFindPet && planet.pet ? planet.pet.emoji : null}
          faction={gameState.faction}
          onDone={handleCelebrationDone}
          onContinue={canContinue ? handleContinue : undefined}
        />
      )}
    </div>
  );
}
