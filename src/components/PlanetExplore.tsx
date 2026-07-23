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

interface Props {
  planet: Planet;
  gameState: GameState;
  onCollect: (crystals: number, xp: number, petName: string | null) => void;
  onBack: () => void;
}

export default function PlanetExplore({ planet, gameState, onCollect, onBack }: Props) {
  const { t } = useI18n();
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
    scout: { id: "scout" as const, name: "Scout route", detail: "Reveal hidden salvage · remove half the hazards · start with a dash · -10% reward", timeBonus: 8, crystalMultiplier: 0.9, icon: Clock3 },
    steady: { id: "steady" as const, name: "Balanced route", detail: "Standard map, pressure, objective, and reward", timeBonus: 0, crystalMultiplier: 1, icon: ShieldCheck },
    salvage: { id: "salvage" as const, name: "Salvage route", detail: "One extra resource target · extra patrols where present · +25% reward", timeBonus: -4, crystalMultiplier: 1.25, icon: Gem },
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
  const factionBonusLabel = gameState.faction === "mud" ? "MUD salvage +20%" : "No faction crystal bonus";
  const pilotBonusLabel = pilot.crystalMultiplier ? `${pilot.name} +${Math.round((pilot.crystalMultiplier - 1) * 100)}%` : `${pilot.name} utility`;
  const otherCrystalMultiplier = modifiers.crystalMultiplier / (pilot.crystalMultiplier ?? 1);
  const systemBonusLabel = otherCrystalMultiplier > 1.001 ? `systems +${Math.round((otherCrystalMultiplier - 1) * 100)}%` : "no other reward bonus";
  const petToCollect = willFindPet && planet.pet ? planet.pet.name : null;
  const rewardLabel = alreadyVisited ? "Survey rewards" : "First-clear rewards";
  const petStatusLabel = !planet.pet
    ? "No signature pet on file"
    : hasPet
      ? `${planet.pet.name} already archived`
      : `${planet.pet.name} can still be discovered`;

  const handleCelebrationDone = () => {
    if (rewardsClaimed.current) return;
    rewardsClaimed.current = true;
    onCollect(totalCrystals, totalXP, petToCollect);
    onBack();
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
          <p className="text-xs sm:text-sm text-muted-foreground">{planet.description}</p>
          <div className="command-kicker">{lore.chapter} · Threat: {lore.threat}</div>
          <p className="max-w-md text-sm leading-relaxed text-cyan-50/80">{lore.story}</p>
          </div>
          <div className="story-landing__mission">
          <div className="w-full rounded-2xl border border-border/50 bg-card/35 px-4 py-3 text-left shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border/50 bg-background/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {alreadyVisited ? "Survey Run" : "Story Mission"}
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
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-cosmic-cyan">Estimated crystals</div>
                <div className="mt-1 text-sm font-bold text-white">{totalCrystals}</div>
                <div className="mt-1 text-[10px] leading-relaxed text-cyan-50/65">Base {baseCrystals} · {factionBonusLabel} · {pilotBonusLabel} · {systemBonusLabel} · {approach.name}</div>
              </div>
              <div className="rounded-xl border border-cosmic-green/15 bg-cosmic-green/5 px-3 py-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-cosmic-green">Pet Intel</div>
                <div className="mt-1 text-[11px] leading-relaxed text-emerald-50/85">{petStatusLabel}</div>
              </div>
            </div>
          </div>
          {missionBrief && (
            <div className="w-full rounded-2xl border border-cosmic-cyan/20 bg-cosmic-cyan/5 px-4 py-3 text-left">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cosmic-cyan sm:text-xs">
                {missionBrief.title}
              </div>
              <p className="mt-1 text-xs font-semibold text-white/90">{missionBrief.transmission}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-cyan-50/85 sm:text-xs">
                {lore.mission} {missionBrief.encounters}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-cosmic-green sm:text-xs">
                How to handle: {missionBrief.tip}
              </p>
              <p className="mt-2 rounded-lg border border-cosmic-yellow/20 bg-cosmic-yellow/5 px-3 py-2 text-[11px] font-bold leading-relaxed text-cosmic-yellow sm:text-xs">
                How to finish: {missionBrief.completion}
              </p>
            </div>
          )}
          <div className="story-approach" aria-label="Choose mission approach">
            <div className="story-approach__title"><Route className="h-4 w-4" /><span>Choose how to play this chapter</span></div>
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
            <span>⭐ Final {totalXP} {t("xp")}</span>
            <span>💎 Estimated {totalCrystals} {t("crystals")}</span>
            {planet.pet && <span>🐾 {planet.pet.emoji} {planet.pet.name}</span>}
          </div>
          <Button onClick={() => setPhase("exploring")}
            className="story-mission-launch text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-bold"
            style={{ fontFamily: "var(--font-display)" }}>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Launch {approach.name}
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
              {alreadyVisited ? "Survey run active. Focus on egg scans, missing pets, and bonus control." : "Primary mission active. Clear the sector for full first-clear rewards."}
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
        />
      )}
    </div>
  );
}
