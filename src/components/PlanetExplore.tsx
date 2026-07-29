import { useState, useCallback, useEffect, useRef } from "react";
import { Planet, GameState, getActiveShipEmoji, getCrystalBonus, getGameplayModifiers, getUpgradeTier, PLANETS, getPlanetDisplayName, getSectorLore, SHIP_UPGRADES } from "@/lib/gameState";
import { ArrowLeft, ChevronDown, Clock3, Gem, RotateCcw, Route, ShieldCheck, Sparkles, Target, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlanetExploration, { ExplorationResult } from "@/components/PlanetExploration";
import CelebrationScreen from "@/components/CelebrationScreen";
import { useI18n } from "@/lib/i18n";
import { getMissionBrief } from "@/lib/missionBriefs";
import { getPilot } from "@/lib/loadouts";
import { getStoryReplayMultiplier } from "@/lib/progressionGuidance";
import GaliaHangarSprite from "@/components/GaliaHangarSprite";

const STORY_LANDING_TH: Record<string, { description: string; story: string; title: string; transmission: string; encounters: string; tip: string; completion: string }> = {
  "sparkle-moon": { description: "สำรวจถ้ำคริสตัลและเก็บแสงพลังงาน", story: "สัญญาณขอความช่วยเหลือกำลังเรียกรหัสของนักบินซ้ำไปมา", title: "การติดต่อครั้งแรก", transmission: "PURI: สัญญาณนี้ตรงกับของเรา มาหาคำตอบกัน", encounters: "เส้นทางเปิด ไม่มีศัตรู เหมาะสำหรับฝึกเดินและเก็บของ", tip: "เดินตามทาง เก็บของให้ครบ แล้วดูจุดกลับยาน", completion: "เก็บคริสตัล 5 ชิ้น แล้วเดินกลับมาที่ช่องยาน" },
  "candy-planet": { description: "ตามหาสัญญาณมีชีวิตในป่าเรืองแสง", story: "สัญญาณนี้มีชีวิต และกำลังชวนให้เราตามไป", title: "รอยเท้ามีชีวิต", transmission: "PURI: มีบางอย่างวิ่งนำหน้าเราอยู่", encounters: "เก็บสัญญาณตามลำดับ จุดถัดไปจะเรืองแสง", tip: "อย่าเก็บข้ามลำดับ มองหารอยที่กำลังเรืองแสง", completion: "เก็บสัญญาณตามลำดับให้ครบ ระบบจะพากลับเอง" },
  "frosty-star": { description: "นำยานผ่านทางน้ำแข็งและเก็บชิ้นส่วนนำทาง", story: "ลมเย็นกำลังซ่อนเส้นทางเก่าของกองสำรวจ", title: "ทางลื่นแห่งเวสเปอร์", transmission: "PURI: ทุกก้าวสำคัญ เดินทีละช่องนะ", encounters: "กำแพงน้ำแข็งบังคับให้วางแผนเส้นทาง", tip: "ดูทางตันก่อนเดินและใช้พุ่งเมื่อจำเป็น", completion: "เก็บชิ้นส่วนนำทาง 8 ชิ้น ระบบจะพากลับเอง" },
  "jungle-world": { description: "ค้นหากุญแจในป่าและหลบหน่วยลาดตระเวน", story: "ผู้เฝ้าป่ากำลังปิดบังห้องนิรภัยเก่า", title: "เงาในพงไพร", transmission: "PURI: ระวังแนวสายตาสีแดง", encounters: "ศัตรูเดินเองตามเวลาและทำให้เสีย HP เมื่อชน", tip: "ดูตำแหน่งศัตรูก่อนขยับ ไม่จำเป็นต้องต่อสู้", completion: "เก็บกุญแจ 8 ชิ้น โดยไม่ให้ HP หมด" },
  "rainbow-nebula": { description: "เปิดโหนดปริซึมเพื่อทำลายเกราะผู้พิทักษ์", story: "คู่แข่งกำลังแข่งกับเราเพื่อชิงกุญแจแห่งดวงดาว", title: "เกราะปริซึม", transmission: "PURI: เปิดโหนดทุกจุดเพื่อหยุดผู้พิทักษ์", encounters: "โหนดเรืองแสงกระจายอยู่ทั่วแผนที่", tip: "เดินเหยียบโหนดแต่ละจุดให้ครบ", completion: "เปิดโหนด 5 จุด ระบบจะพากลับเอง" },
  "bubbly-bay": { description: "ขนส่งพลังให้สถานีใต้น้ำ", story: "แรงดันกำลังลดลง และถิ่นอาศัยต้องการพลังงาน", title: "ภารกิจแรงดัน", transmission: "PURI: เก็บพลังแล้วนำไปส่งที่วาล์ว", encounters: "ต้องมีพลังติดตัวก่อนเดินเข้าจุดส่ง", tip: "เก็บพลังอย่างน้อย 2 ชิ้น แล้วส่งให้วาล์วทั้งสอง", completion: "เก็บพลัง 6 ชิ้น และส่งให้ครบ 2 จุด" },
  "cookie-crater": { description: "ทำให้ปล่องดาวเสถียรและกลับยานให้ทัน", story: "พื้นผิวกำลังแตกตัวใต้เส้นทางของเรา", title: "ปล่องดาวไม่เสถียร", transmission: "PURI: หลีกเลี่ยงช่องอันตรายแล้วรีบกลับยาน", encounters: "พื้นที่สีแดงทำให้เสีย HP และมีศัตรูเดินลาดตระเวน", tip: "วางทางกลับไว้ล่วงหน้า อย่าเก็บของจนเวลาใกล้หมด", completion: "เก็บตัวปรับเสถียร 6 ชิ้น แล้วกลับช่องยาน" },
  "starlight-shore": { description: "ช่วยสัญญาณเพื่อนและเปิดทางออก", story: "เสียงเรียกเบา ๆ ซ่อนอยู่ใต้แสงดาวริมฝั่ง", title: "สัญญาณขอความช่วยเหลือ", transmission: "PURI: มีเพื่อนกำลังรอเราอยู่", encounters: "ต้องเก็บดาว พบเพื่อน และเปิดโหนดแสง", tip: "โหนดแสงอยู่มุมล่างซ้ายของแผนที่", completion: "พบเพื่อน เก็บดาว 7 ดวง และเหยียบโหนดแสง 1 จุด" },
  "crystal-cave": { description: "ชาร์จประตูแนวหน้าและเก็บแกนคริสตัล", story: "เส้นทางนี้จะกำหนดว่าใครควบคุมชายแดน", title: "การตัดสินใจแนวหน้า", transmission: "PURI: ส่งพลังให้ประตูทั้งสองก่อนออกไป", encounters: "มีจุดส่งพลังสองแห่งและศัตรูลาดตระเวน", tip: "เก็บพลังแล้วส่งทีละประตู จากนั้นเก็บแกนให้ครบ", completion: "ส่งพลัง 2 จุด เปิดโหนด 2 จุด และเก็บแกน 6 ชิ้น" },
  "golden-galaxy": { description: "ฝ่าด่านสุดท้ายและนำข้อมูลกลับมา", story: "แกนออโรรากำลังตื่นขึ้น และทุกสัญญาณมาบรรจบที่นี่", title: "แกนออโรรา", transmission: "PURI: นี่คือบทสุดท้าย เราจะกลับไปด้วยกัน", encounters: "มีประตู วาร์ป ศัตรู และพื้นที่อันตรายหลายจุด", tip: "เปิดโหนด เก็บของ และเผื่อเวลาสำหรับกลับยาน", completion: "เปิดโหนด 2 จุด พบเพื่อน เก็บแกน 8 ชิ้น แล้วกลับยาน" },
};

const STORY_CHAPTER_TH: Record<string, string> = {
  "sparkle-moon": "01 · แสงแรก",
  "candy-planet": "02 · สัญญาณที่มีชีวิต",
  "frosty-star": "03 · รอยทางเยือกแข็ง",
  "jungle-world": "04 · ผู้เฝ้ามอง",
  "rainbow-nebula": "05 · ฟ้าที่แตกสลาย",
  "bubbly-bay": "06 · ใต้หมู่ดาว",
  "cookie-crater": "07 · ฝนเพลิง",
  "starlight-shore": "08 · เส้นทางเมล็ดดาว",
  "crystal-cave": "09 · สามคู่แข่ง",
  "golden-galaxy": "10 · พ้นขอบแผนที่",
};

const STORY_THREAT_TH: Record<string, string> = {
  "sparkle-moon": "คลื่นพลังคริสตัล",
  "candy-planet": "สปอร์จำแลง",
  "frosty-star": "น้ำแข็งความเร็วสูง",
  "jungle-world": "โดรนผู้พิทักษ์",
  "rainbow-nebula": "พายุไอออน",
  "bubbly-bay": "คลื่นแรงดัน",
  "cookie-crater": "ฝูงอุกกาบาต",
  "starlight-shore": "กระแสแสง",
  "crystal-cave": "ผู้พิทักษ์แห่งความว่าง",
  "golden-galaxy": "ผู้เฝ้ามงกุฎ",
};

interface Props {
  planet: Planet;
  gameState: GameState;
  onCollect: (crystals: number, xp: number, petName: string | null) => void;
  onFailureCollect: (crystals: number) => void;
  onBack: () => void;
  onContinue: (planet: Planet) => void;
  suspended?: boolean;
  onActiveChange?: (active: boolean) => void;
}

export default function PlanetExplore({ planet, gameState, onCollect, onFailureCollect, onBack, onContinue, suspended = false, onActiveChange }: Props) {
  const { t, tr } = useI18n();
  const planetIndex = PLANETS.findIndex(p => p.id === planet.id);
  const displayName = getPlanetDisplayName(planetIndex, gameState.faction);
  const [phase, setPhase] = useState<"landing" | "exploring" | "failed" | "celebration">("landing");
  const [briefingOpen, setBriefingOpen] = useState(() => !gameState.visitedPlanets.includes(planet.id));
  const [approachId, setApproachId] = useState<"scout" | "steady" | "salvage">("steady");
  const [bonusCrystals, setBonusCrystals] = useState(0);
  const [failureReason, setFailureReason] = useState<ExplorationResult["reason"]>("timeout");
  const [failureReward, setFailureReward] = useState(0);
  const [salvageRecovered, setSalvageRecovered] = useState(false);
  const rewardsClaimed = useRef(false);
  const alreadyVisited = gameState.visitedPlanets.includes(planet.id);
  const hasPet = planet.pet ? gameState.pets.includes(planet.pet.name) : false;
  const modifiers = getGameplayModifiers(gameState);
  const pilot = getPilot(gameState.activePilot);
  const shipEmoji = getActiveShipEmoji(gameState);
  const activeShipSystems = SHIP_UPGRADES
    .filter((system) => gameState.upgrades.includes(system.id))
    .map((system) => {
      const tier = getUpgradeTier(gameState, system.id);
      const name = system.id === "shield"
        ? tr(system.name, "โล่คอสมิก")
        : system.id === "booster"
          ? tr(system.name, "เทอร์โบบูสเตอร์")
          : system.id === "scanner"
            ? tr(system.name, "เครื่องสแกนคริสตัล")
            : system.id === "garden"
              ? tr(system.name, "ศูนย์เพาะเลี้ยงสิ่งมีชีวิตต่างดาว")
              : system.id === "wings"
                ? tr(system.name, "ปีกดวงดาว")
                : tr(system.name, "มงกุฎกาแล็กซี่");
      const summary = system.id === "shield"
        ? tr(`Keep ${50 + tier * 10}% of failed Story rewards`, `เก็บรางวัลไว้ ${50 + tier * 10}% เมื่อภารกิจพลาด`)
        : system.id === "booster"
          ? tr(`Story time +${tier * 5}s`, `เวลาเนื้อเรื่อง +${tier * 5} วินาที`)
          : system.id === "scanner"
            ? tr(`Crystals +${tier * 15}%`, `คริสตัล +${tier * 15}%`)
            : system.id === "garden"
              ? tr(`Companion chance +${tier * 15}%`, `โอกาสพบเพื่อน +${tier * 15}%`)
              : system.id === "wings"
                ? tr(`Story time +${tier * 8}s`, `เวลาเนื้อเรื่อง +${tier * 8} วินาที`)
                : tr(`Crystals +${tier * 20}%`, `คริสตัล +${tier * 20}%`);
      return { ...system, name, tier, summary };
    });
  const basePetChance = gameState.faction === "oni" ? 0.9 : (alreadyVisited ? (hasPet ? 0.18 : 0.42) : 0.8);
  const petChance = Math.min(0.98, basePetChance + modifiers.petDiscoveryBonus);
  const [willFindPet] = useState(() => Boolean(!hasPet && planet.pet && Math.random() < petChance));
  const missionBrief = getMissionBrief(planet.id);
  const lore = getSectorLore(planet.id);
  const approaches = {
    scout: { id: "scout" as const, name: tr("Scout route", "เส้นทางปลอดภัย"), detail: tr("Reveal hidden items · fewer hazards · start with dash · -10% reward", "มองเห็นของที่ซ่อนอยู่ อันตรายน้อยลง และเริ่มพร้อมพุ่ง แต่รางวัลลดลง 10%"), timeBonus: 8, crystalMultiplier: 0.9, icon: Clock3 },
    steady: { id: "steady" as const, name: tr("Balanced route", "เส้นทางปกติ"), detail: tr("Standard map, objective, pressure, and reward", "ใช้แผนที่ เป้าหมาย ความยาก และรางวัลตามปกติ"), timeBonus: 0, crystalMultiplier: 1, icon: ShieldCheck },
    salvage: { id: "salvage" as const, name: tr("Salvage route", "เส้นทางเก็บกู้"), detail: tr("Optional cargo · more patrols where present · up to +25% reward", "มีกล่องสินค้าให้เก็บเพิ่มและมีศัตรูมากขึ้น ถ้าเก็บกล่องได้จะรับรางวัลเพิ่มสูงสุด 25%"), timeBonus: -4, crystalMultiplier: 1.25, icon: Gem },
  };
  const approach = approaches[approachId];

  const handleExplorationComplete = useCallback((result: ExplorationResult) => {
    setSalvageRecovered(Boolean(result.salvageRecovered));
    if (!result.success) {
      setFailureReason(result.reason);
      setFailureReward(result.bonus);
      if (result.bonus > 0) onFailureCollect(result.bonus);
      setPhase("failed");
      return;
    }
    setBonusCrystals(result.bonus);
    setPhase("celebration");
  }, [onFailureCollect]);

  useEffect(() => {
    onActiveChange?.(phase === "exploring");
    return () => onActiveChange?.(false);
  }, [onActiveChange, phase]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
    return () => cancelAnimationFrame(frame);
  }, [phase, planet.id]);

  const baseCrystals = Math.floor(planet.crystals * getStoryReplayMultiplier(alreadyVisited));
  const routeRewardMultiplier = approachId === "salvage" && phase === "celebration"
    ? (salvageRecovered ? approach.crystalMultiplier : 1)
    : approach.crystalMultiplier;
  const rewardBeforeRoute = getCrystalBonus(baseCrystals + bonusCrystals, gameState.faction) * modifiers.crystalMultiplier;
  const totalCrystals = Math.floor(rewardBeforeRoute * routeRewardMultiplier);
  const guaranteedCrystals = Math.floor(rewardBeforeRoute * (approachId === "scout" ? approach.crystalMultiplier : 1));
  const salvageWithCargoCrystals = Math.floor(rewardBeforeRoute * approaches.salvage.crystalMultiplier);
  const estimatedCrystalLabel = approachId === "salvage" && phase !== "celebration"
    ? tr(`${guaranteedCrystals} guaranteed · ${salvageWithCargoCrystals} with cargo`, `${guaranteedCrystals} แน่นอน · ${salvageWithCargoCrystals} เมื่อเก็บกล่อง`)
    : totalCrystals.toString();
  const totalXP = alreadyVisited ? Math.floor(planet.xp / 2) : planet.xp;
  const factionBonusLabel = gameState.faction === "mud" ? tr("MUD faction bonus +20%", "โบนัสฝ่าย MUD +20%") : tr("No faction crystal bonus", "ไม่มีโบนัสคริสตัลจากฝ่าย");
  const pilotBonusLabel = pilot.crystalMultiplier ? `${pilot.name} +${Math.round((pilot.crystalMultiplier - 1) * 100)}%` : tr(`${pilot.name} utility`, `ความสามารถของ ${pilot.name}`);
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
    <main className="story-mission-screen relative z-10 flex min-h-screen flex-col items-center justify-center overflow-visible px-3 pb-24 pt-28 sm:px-4 sm:pb-28 sm:pt-32">
      <h1 className="sr-only">{tr(`Story mission: ${displayName}`, `ภารกิจเนื้อเรื่อง: ${displayName}`)}</h1>
      <button onClick={onBack}
        className="fixed left-4 top-28 z-[60] flex items-center justify-center min-h-[48px] gap-1.5 rounded-2xl border border-border/60 bg-card/92 px-4 py-2 text-foreground shadow-lg transition-all hover:bg-card">
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-xs sm:text-sm font-bold">{tr("Chapter map", "หน้าเลือกบท")}</span>
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
          <div className="command-kicker">
            {tr(lore.chapter, STORY_CHAPTER_TH[planet.id] ?? lore.chapter)} · {tr("Threat", "อันตราย")}: {tr(lore.threat, STORY_THREAT_TH[planet.id] ?? lore.threat)}
          </div>
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
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-cosmic-cyan">{tr("Estimated crystals", "คริสตัลที่จะได้รับ")}</div>
                <div className="mt-1 text-sm font-bold text-white">{estimatedCrystalLabel}</div>
                <div className="mt-1 text-[10px] leading-relaxed text-cyan-50/65">{tr("Base", "พื้นฐาน")} {baseCrystals} · {factionBonusLabel} · {pilotBonusLabel} · {systemBonusLabel} · {approach.name}</div>
              </div>
              <div className="rounded-xl border border-cosmic-green/15 bg-cosmic-green/5 px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-cosmic-green">{tr("Companion intel", "เพื่อนที่อาจพบ")}</div>
                <div className="mt-1 text-[11px] leading-relaxed text-emerald-50/85">{petStatusLabel}</div>
              </div>
            </div>
          </div>
          {missionBrief && (
            <details className="story-briefing-details" open={briefingOpen} onToggle={(event) => setBriefingOpen(event.currentTarget.open)}>
              <summary>
                <Target className="h-4 w-4" />
                <span>
                  <strong>{tr("Mission objective", "เป้าหมายภารกิจ")}</strong>
                  <small>{tr(missionBrief.completion, STORY_LANDING_TH[planet.id]?.completion ?? missionBrief.completion)}</small>
                </span>
                <ChevronDown className="story-details-chevron h-4 w-4" />
              </summary>
              <div className="story-briefing-details__body">
                <div className="command-kicker">{tr(missionBrief.title, STORY_LANDING_TH[planet.id]?.title ?? missionBrief.title)}</div>
                <p><strong>{tr(missionBrief.transmission, STORY_LANDING_TH[planet.id]?.transmission ?? missionBrief.transmission)}</strong></p>
                <p>{tr(`${lore.mission} ${missionBrief.encounters}`, STORY_LANDING_TH[planet.id]?.encounters ?? `${lore.mission} ${missionBrief.encounters}`)}</p>
                <p className="is-tip">{tr("Tip", "เคล็ดลับ")}: {tr(missionBrief.tip, STORY_LANDING_TH[planet.id]?.tip ?? missionBrief.tip)}</p>
              </div>
            </details>
          )}
          {activeShipSystems.length > 0 && (
            <details className="story-system-details">
              <summary>
                <span>{tr(`${activeShipSystems.length} ship system${activeShipSystems.length === 1 ? "" : "s"} active`, `ระบบยานทำงาน ${activeShipSystems.length} ระบบ`)}</span>
                <small>{tr("Applied automatically", "ทำงานอัตโนมัติ")}</small>
                <ChevronDown className="story-details-chevron h-4 w-4" />
              </summary>
              <div className="story-active-systems" aria-label={tr("Active ship systems", "ระบบยานที่ทำงานอยู่")}>
                {activeShipSystems.map((system) => (
                  <div key={system.id} className="story-active-system">
                    <GaliaHangarSprite id={system.id} className="h-8 w-8 shrink-0" />
                    <span><strong>{system.name}</strong><small>{system.summary}</small></span>
                    <b>T{system.tier}</b>
                  </div>
                ))}
              </div>
            </details>
          )}
          <div className="story-approach" aria-label={tr("Choose mission approach", "เลือกเส้นทางภารกิจ")}>
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
              {alreadyVisited ? tr("Replay active. Focus on missing companions and bonus rewards.", "รอบนี้เป็นการเล่นซ้ำ ลองตามหาเพื่อนที่ยังไม่พบและเก็บรางวัลเสริม") : tr("Story mission active. Complete the objective for full first-clear rewards.", "ทำภารกิจให้ครบเพื่อรับรางวัลผ่านครั้งแรก")}
            </p>
            {activeShipSystems.length > 0 && (
              <div className="story-live-systems">
                {activeShipSystems.map((system) => (
                  <span key={system.id}><GaliaHangarSprite id={system.id} className="h-5 w-5" />{system.summary}</span>
                ))}
              </div>
            )}
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
            suspended={suspended}
          />
        </div>
      )}

      {phase === "failed" && (
        <section className="story-failure-panel" role="dialog" aria-labelledby="story-failure-title">
          <div className="story-failure-panel__icon"><TriangleAlert /></div>
          <div className="command-kicker">{tr("Mission incomplete", "ภารกิจยังไม่สำเร็จ")}</div>
          <h2 id="story-failure-title">{failureReason === "hull" ? tr("Your ship needs another approach.", "ยานเสียหายเกินไป ลองวางทางใหม่") : tr("The signal window closed.", "เวลารับสัญญาณหมดแล้ว")}</h2>
          <p>{tr("This chapter was not cleared and the next chapter remains locked. Retry the same route or return to choose another one.", "บทนี้ยังไม่ผ่าน และบทถัดไปยังไม่เปิด ลองเส้นทางเดิมอีกครั้ง หรือกลับไปเลือกเส้นทางใหม่")}</p>
          {failureReward > 0 && <div className="story-failure-panel__reward"><Gem /> {tr(`Recovery reward: ${failureReward} crystals`, `ยังได้รับคริสตัลกลับมา ${failureReward} ชิ้น`)}</div>}
          <div className="story-failure-panel__actions">
            <Button onClick={() => setPhase("exploring")}><RotateCcw className="mr-2 h-4 w-4" />{tr("Retry mission", "ลองใหม่")}</Button>
            <Button variant="outline" onClick={() => setPhase("landing")}><Route className="mr-2 h-4 w-4" />{tr("Change route", "เปลี่ยนเส้นทาง")}</Button>
            <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />{tr("Chapter map", "หน้าเลือกบท")}</Button>
          </div>
        </section>
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
    </main>
  );
}
