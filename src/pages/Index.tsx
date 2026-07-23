import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import SpaceBackground from "@/components/SpaceBackground";
import HUD from "@/components/HUD";
import type { AppScreen } from "@/components/HUD";
import ScreenErrorBoundary from "@/components/ScreenErrorBoundary";
import {
  PLANETS, Planet, GameState, FactionId, createNewGameState, getLevelFromXP,
  calcInfluenceGain, simulateRivalInfluence, getPlanetController, INFLUENCE_TO_CAPTURE, canClaimDaily,
  getGameplayModifiers,
} from "@/lib/gameState";
import { generateEgg, AlienEgg, AlienPet, ALIEN_PETS } from "@/lib/pets";
import { playClickSound, playTravelSound, setSoundMode, startModeAmbience, stopModeAmbience } from "@/lib/sounds";
import {
  startAutoSave, stopAutoSave, startHealthCheck, stopHealthCheck,
  validateAndRepairState, logError,
} from "@/lib/selfHealing";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import type { PlayMode } from "@/components/ModeHub";
import type { ArcadeContract } from "@/lib/arcadeContracts";
import { getPuriBonuses } from "@/lib/puriBond";
import { profileRepository } from "@/lib/profileRepository";
import { hasSeenGuidedFlight, markGuidedFlightSeen } from "@/lib/onboarding";
import { FeedbackMode, trackModeComplete, trackModeStart } from "@/lib/playtestFeedback";
import type { RunResultData } from "@/components/UnifiedRunResults";

type Screen = AppScreen;

interface CaptureEvent {
  factionId: FactionId;
  planetName: string;
  planetEmoji: string;
}

const FactionSelect = lazy(() => import("@/components/FactionSelect"));
const PlanetExplore = lazy(() => import("@/components/PlanetExplore"));
const CrewHangar = lazy(() => import("@/components/CrewHangar"));
const PetCollection = lazy(() => import("@/components/PetCollection"));
const InfoScreen = lazy(() => import("@/components/InfoScreen"));
const PlanetCaptureAnimation = lazy(() => import("@/components/PlanetCaptureAnimation"));
const EggHatchOverlay = lazy(() => import("@/components/EggHatchOverlay"));
const ModeHub = lazy(() => import("@/components/ModeHub"));
const ArcadeContracts = lazy(() => import("@/components/ArcadeContracts"));
const SwarmProtocol = lazy(() => import("@/components/SwarmProtocol"));
const ArcadeShooter = lazy(() => import("@/components/ArcadeShooter"));
const DiscoveryRun = lazy(() => import("@/components/DiscoveryRun"));
const FrontierControl = lazy(() => import("@/components/FrontierControl"));
const StoryExpeditionConsole = lazy(() => import("@/components/StoryExpeditionConsole"));
const SettingsPanel = lazy(() => import("@/components/SettingsPanel"));
const CaptainProgress = lazy(() => import("@/components/CaptainProgress"));
const GuidedFlight = lazy(() => import("@/components/GuidedFlight"));
const PlaytestFeedback = lazy(() => import("@/components/PlaytestFeedback"));
const UnifiedRunResults = lazy(() => import("@/components/UnifiedRunResults"));

function ScreenLoadingFallback({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-6 text-center">
      <div className="rounded-2xl border border-border/60 bg-card/92 px-5 py-4 text-sm font-bold text-foreground shadow-lg">
        {label}
      </div>
    </div>
  );
}

const screenTransition = {
  initial: { opacity: 0, y: 10, scale: 0.992 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.992 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

export default function Index() {
  const { t } = useI18n();
  const [gameState, setGameState] = useState<GameState>(() => validateAndRepairState(profileRepository.load(profileRepository.getActiveFaction())));
  const [activePlanet, setActivePlanet] = useState<Planet | null>(null);
  const [screen, setScreen] = useState<Screen>("hub");
  const [captureEvent, setCaptureEvent] = useState<CaptureEvent | null>(null);
  const [hatchingEgg, setHatchingEgg] = useState<AlienEgg | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guidedOpen, setGuidedOpen] = useState(() => !hasSeenGuidedFlight(gameState.faction));
  const [feedback, setFeedback] = useState<{ open: boolean; mode: FeedbackMode }>({ open: false, mode: "overall" });
  const [activeArcadeContract, setActiveArcadeContract] = useState("ahr-blitz");
  const [runResult, setRunResult] = useState<RunResultData | null>(null);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;


  // Self-healing: auto-save, health check, performance detection
  useEffect(() => {
    startAutoSave(() => gameStateRef.current);
    startHealthCheck((issue) => {
      logError(new Error(`Health check: ${issue}`), "health-check");
      // Try to repair state
      setGameState((prev) => validateAndRepairState(prev));
    });
    return () => {
      stopAutoSave();
      stopHealthCheck();
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [screen]);

  useEffect(() => {
    setSoundMode(gameState.accessibility.sound);
    const ambientMode = screen === "map" || screen === "planet" ? "story"
      : screen === "arcade" || screen === "arcade-select" ? "arcade"
        : screen === "strategy" ? "strategy"
          : screen === "progress" ? "progress"
            : screen === "discovery" ? "discovery"
              : screen === "swarm" ? "swarm" : "hub";
    startModeAmbience(ambientMode);
    return stopModeAmbience;
  }, [gameState.accessibility.sound, screen]);

  const updateState = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState((prev) => {
      const next = updater(prev);
      if (next !== prev) profileRepository.save(next);
      return next;
    });
  }, []);

  const handleFactionSelect = (factionId: FactionId) => {
    playClickSound();
    profileRepository.setActiveFaction(factionId);
    setActivePlanet(null);
    setScreen("hub");
    setCaptureEvent(null);
    setHatchingEgg(null);
    setSettingsOpen(false);
    const nextState = validateAndRepairState(profileRepository.load(factionId));
    setGameState(nextState);
    setGuidedOpen(!hasSeenGuidedFlight(factionId));
  };

  const handleReturnToFactionSelect = useCallback(() => {
    setActivePlanet(null);
    setCaptureEvent(null);
    setHatchingEgg(null);
    setSettingsOpen(false);
    setGuidedOpen(false);
    profileRepository.setActiveFaction(null);
    setScreen("hub");
    setGameState(createNewGameState(null));
  }, []);

  const handleResetProgress = useCallback(() => {
    if (!gameState.faction) return;

    const confirmed = window.confirm(`Reset ${gameState.faction.toUpperCase()} progress and start from the beginning?`);
    if (!confirmed) return;

    playClickSound();
    setActivePlanet(null);
    setCaptureEvent(null);
    setHatchingEgg(null);
    setSettingsOpen(false);
    setScreen("map");
    setGameState(validateAndRepairState(profileRepository.reset(gameState.faction)));
    toast("Progress reset. You can start fresh now.", { duration: 2500 });
  }, [gameState.faction]);

  const handleCollect = useCallback(
    (crystals: number, xp: number, petName: string | null) => {
      updateState((prev) => {
        if (!prev.faction || !activePlanet) return prev;

        const newCrystals = prev.crystals + crystals;
        const newXP = prev.xp + xp;
        const newPets = petName && !prev.pets.includes(petName) ? [...prev.pets, petName] : prev.pets;
        const wasVisitedBefore = prev.visitedPlanets.includes(activePlanet.id);
        const newVisited = !wasVisitedBefore
          ? [...prev.visitedPlanets, activePlanet.id]
          : prev.visitedPlanets;
        const newLevel = getLevelFromXP(newXP);
        const newShipLevel = Math.max(prev.shipLevel, prev.upgrades.length + 1);

        if (newLevel > prev.level) {
          toast(`${t("levelUp")} ${newLevel}!`, { duration: 3000 });
        }

        // Egg drop system: avoid bloated queue when collection is complete.
        const petCollectionComplete = prev.pets.length >= ALIEN_PETS.length;
        const maxEggQueue = 8;
        let eggCompensationCrystals = 0;
        const petStillMissing = Boolean(activePlanet.pet && !prev.pets.includes(activePlanet.pet.name));
        const egg = petCollectionComplete ? null : generateEgg(activePlanet.unlockLevel, wasVisitedBefore, petStillMissing);
        const newEggs = [...prev.eggs];
        if (egg) {
          if (newEggs.length < maxEggQueue) {
            newEggs.push({ ...egg, foundAt: activePlanet.id });
            setTimeout(() => toast(t("foundEggToast"), { duration: 3000 }), 1500);
          } else {
            const overflowCrystalBonus = 4;
            setTimeout(() => toast(`Egg queue full. Converted to +${overflowCrystalBonus} crystals.`, { duration: 2600 }), 1200);
            eggCompensationCrystals += overflowCrystalBonus;
          }
        } else if (petCollectionComplete) {
          const completeCollectionBonus = 3;
          setTimeout(() => toast(`Pet archive complete. +${completeCollectionBonus} crystals awarded.`, { duration: 2400 }), 1000);
          eggCompensationCrystals += completeCollectionBonus;
        }

        // Async faction activity system
        const influenceGain = calcInfluenceGain(crystals, xp);
        const planetId = activePlanet.id;
        const oldInf = prev.influence[planetId] || { mud: 0, oni: 0, ustur: 0 };
        const wasCapturedBefore = getPlanetController(oldInf);

        let newInf = { ...oldInf };
        newInf[prev.faction] = Math.min(newInf[prev.faction] + influenceGain, INFLUENCE_TO_CAPTURE);
        newInf = simulateRivalInfluence(newInf, prev.faction, activePlanet);

        const newController = getPlanetController(newInf);
        const newInfluence = { ...prev.influence, [planetId]: newInf };

        if (newController && newController !== wasCapturedBefore) {
          const capturedPlanet = PLANETS.find(p => p.id === planetId);
          if (capturedPlanet) {
            setTimeout(() => {
              setCaptureEvent({
                factionId: newController,
                planetName: capturedPlanet.name,
                planetEmoji: capturedPlanet.emoji,
              });
            }, 2500);
          }
          const captureBonusCrystals = 5;
          toast(`${t("intelUpdate")} ${newController.toUpperCase()} ${t("captured")} ${capturedPlanet?.emoji} ${capturedPlanet?.name}. +${captureBonusCrystals} ${t("bonusCrystals")}`, { duration: 4000 });
          return {
            ...prev,
            crystals: newCrystals + captureBonusCrystals + eggCompensationCrystals,
            xp: newXP, pets: newPets, visitedPlanets: newVisited,
            level: newLevel, shipLevel: newShipLevel, influence: newInfluence, eggs: newEggs,
          };
        }

        toast(`${t("intelUpdate")} +${influenceGain} ${t("sectorInfluenceLogged")} ${prev.faction.toUpperCase()}. ${t("rivalExpeditionsAdvanced")}`, { duration: 2500 });

        return {
          ...prev,
          crystals: newCrystals + eggCompensationCrystals, xp: newXP, pets: newPets, visitedPlanets: newVisited,
          level: newLevel, shipLevel: newShipLevel, influence: newInfluence, eggs: newEggs,
        };
      });
      setRunResult({ mode: "story", title: activePlanet ? `${activePlanet.name} secured` : "Story expedition complete", outcome: petName ? `${petName} joined your archive and the signal trail advanced.` : "The signal trail advanced and your faction influence increased.", crystals, xp });
      trackModeComplete("story");
    },
    [activePlanet, t, updateState]
  );

  const handleBuyUpgrade = (id: string, cost: number) => {
    updateState((prev) => {
      const currentTier = prev.upgradeTiers[id] ?? (prev.upgrades.includes(id) ? 1 : 0);
      if (prev.crystals < cost || currentTier >= 3) return prev;
      playClickSound();
      toast(currentTier ? `System upgraded to Tier ${currentTier + 1}.` : t("upgradeInstalled"));
      return { ...prev, crystals: prev.crystals - cost, upgrades: prev.upgrades.includes(id) ? prev.upgrades : [...prev.upgrades, id], upgradeTiers: { ...prev.upgradeTiers, [id]: currentTier + 1 }, shipLevel: Math.max(prev.shipLevel, prev.upgrades.length + (currentTier ? 1 : 2)) };
    });
  };

  const handleBuySkin = (id: string, cost: number) => {
    updateState((prev) => {
      if (prev.crystals < cost || prev.ownedSkins.includes(id)) return prev;
      playClickSound();
      toast(t("newShipColor"));
      return { ...prev, crystals: prev.crystals - cost, ownedSkins: [...prev.ownedSkins, id], activeSkin: id };
    });
  };

  const handleEquipSkin = (id: string) => {
    playClickSound();
    updateState((prev) => ({ ...prev, activeSkin: id }));
  };

  const handleSetPilot = (id: string) => {
    playClickSound();
    updateState((prev) => ({ ...prev, activePilot: id }));
    toast("Pilot assigned to your next expedition.");
  };

  const handleSetTool = (id: string) => {
    playClickSound();
    updateState((prev) => ({ ...prev, activeTool: id }));
    toast("Expedition tool equipped.");
  };

  const handleSetActivePet = (petId: string) => {
    playClickSound();
    updateState((prev) => ({ ...prev, activePet: petId }));
  };

  const handleStartHatch = (egg: AlienEgg) => {
    setHatchingEgg(egg);
  };

  const handleEggResolved = (pet: AlienPet | null) => {
    updateState((prev) => {
      const newEggs = prev.eggs.filter(e => e.id !== hatchingEgg?.id);
      const newPets = pet && !prev.pets.includes(pet.name) ? [...prev.pets, pet.name] : prev.pets;
      return { ...prev, eggs: newEggs, pets: newPets };
    });
  };

  const handleClaimDaily = () => {
    updateState((prev) => {
      if (!canClaimDaily(prev.lastDailyReward)) return prev;
      const crystalReward = 10 + Math.floor(Math.random() * 10);
      const petChance = Math.random() < 0.15;
      const possiblePets = ["Aneko", "Tigu", "Vada", "Flynnie", "Little"];
      const newPet = petChance ? possiblePets.find((p) => !prev.pets.includes(p)) : null;

      playClickSound();
      toast(`${t("dailyReward")} +${crystalReward} ${t("plusCrystals")}${newPet ? ` ${t("plusNewPet")} ${newPet}!` : ""}`);

      return {
        ...prev,
        crystals: prev.crystals + crystalReward,
        pets: newPet ? [...prev.pets, newPet] : prev.pets,
        lastDailyReward: new Date().toISOString(),
      };
    });
  };

  const handleChooseMode = (mode: PlayMode) => {
    playClickSound();
    if (mode !== "arcade") trackModeStart(mode);
    if (mode === "story") setScreen("map");
    else if (mode === "arcade") setScreen("arcade-select");
    else setScreen(mode);
  };

  const handleCombatComplete = (result: { score: number; crystals: number; xp: number; won: boolean; variant: "swarm" | "arcade"; contractId?: string }) => {
    updateState((prev) => {
      const xp = prev.xp + result.xp;
      const previousContract = result.contractId ? prev.modeRecords.arcadeContracts[result.contractId] ?? { bestScore: 0, clears: 0 } : null;
      return {
        ...prev,
        crystals: prev.crystals + result.crystals,
        xp,
        level: getLevelFromXP(xp),
        modeRecords: {
          ...prev.modeRecords,
          swarmHighScore: result.variant === "swarm" ? Math.max(prev.modeRecords.swarmHighScore, result.score) : prev.modeRecords.swarmHighScore,
          arcadeHighScore: result.variant === "arcade" ? Math.max(prev.modeRecords.arcadeHighScore, result.score) : prev.modeRecords.arcadeHighScore,
          puriBond: Math.min(100, prev.modeRecords.puriBond + (result.won ? 3 : 1)),
          arcadeContracts: result.contractId && previousContract ? {
            ...prev.modeRecords.arcadeContracts,
            [result.contractId]: { bestScore: Math.max(previousContract.bestScore, result.score), clears: previousContract.clears + (result.won ? 1 : 0) },
          } : prev.modeRecords.arcadeContracts,
        },
      };
    });
    setRunResult({ mode: result.variant, title: result.won ? (result.variant === "swarm" ? "Ahr defeated" : "Contract cleared") : "Rewards secured", outcome: result.won ? "Full clear rewards and mastery were banked." : "Partial rewards were banked; upgrade and return stronger.", crystals: result.crystals, xp: result.xp, score: result.score });
    trackModeComplete(result.variant);
  };

  const handleDiscoveryComplete = ({ biomeId, finds, mastery }: { biomeId: string; finds: number; mastery: number }) => {
    const previewReward = Math.ceil(finds * getPuriBonuses(gameState.modeRecords.puriBond).rewardMultiplier * getGameplayModifiers(gameState).crystalMultiplier);
    updateState((prev) => {
      const xp = prev.xp + finds;
      const reward = Math.ceil(finds * getPuriBonuses(prev.modeRecords.puriBond).rewardMultiplier * getGameplayModifiers(prev).crystalMultiplier);
      const currentMastery = prev.modeRecords.discoveryMastery[biomeId] || 0;
      return { ...prev, crystals: prev.crystals + reward, xp, level: getLevelFromXP(xp), modeRecords: { ...prev.modeRecords, discoveryFinds: prev.modeRecords.discoveryFinds + finds, discoveryRuns: prev.modeRecords.discoveryRuns + 1, discoveryMastery: { ...prev.modeRecords.discoveryMastery, [biomeId]: Math.min(100, currentMastery + mastery) }, puriBond: Math.min(100, prev.modeRecords.puriBond + 2) } };
    });
    setRunResult({ mode: "discovery", title: "Field journal complete", outcome: "Six signals were recorded and this biome's research rank advanced.", crystals: previewReward, xp: finds, mastery: `+${mastery} biome mastery` });
    toast("Field journal saved. Discovery rewards added.");
    trackModeComplete("discovery");
  };

  const handleStrategyComplete = ({ captures, objectiveComplete, influence }: { captures: number; objectiveComplete: boolean; influence: GameState["influence"] }) => {
    const previewXp = 6 + (objectiveComplete ? 4 : 0);
    const previewReward = Math.ceil((6 + captures * 5 + (objectiveComplete ? 5 : 0)) * getPuriBonuses(gameState.modeRecords.puriBond).rewardMultiplier * getGameplayModifiers(gameState).crystalMultiplier);
    updateState((prev) => {
      const xpReward = 6 + (objectiveComplete ? 4 : 0);
      const xp = prev.xp + xpReward;
      const reward = Math.ceil((6 + captures * 5 + (objectiveComplete ? 5 : 0)) * getPuriBonuses(prev.modeRecords.puriBond).rewardMultiplier * getGameplayModifiers(prev).crystalMultiplier);
      return { ...prev, influence, crystals: prev.crystals + reward, xp, level: getLevelFromXP(xp), modeRecords: { ...prev.modeRecords, strategyWins: prev.modeRecords.strategyWins + captures, strategyCycles: prev.modeRecords.strategyCycles + 1, strategyObjectives: prev.modeRecords.strategyObjectives + (objectiveComplete ? 1 : 0), puriBond: Math.min(100, prev.modeRecords.puriBond + (objectiveComplete ? 2 : 1)) } };
    });
    setRunResult({ mode: "strategy", title: objectiveComplete ? "Command objective complete" : "Command cycle banked", outcome: objectiveComplete ? "Your faction secured the objective bonus and advanced its frontier network." : "Your influence was saved; the objective remains a target for the next cycle.", crystals: previewReward, xp: previewXp, mastery: captures ? `${captures} sector captured` : "+1 control cycle" });
    toast("Command cycle saved to the frontier.");
    trackModeComplete("strategy");
  };

  const dismissGuidedFlight = () => {
    markGuidedFlightSeen(gameState.faction);
    setGuidedOpen(false);
  };

  const navigateFromHud = (next: Screen) => {
    playClickSound();
    setActivePlanet(null);
    const mode: Partial<Record<Screen, FeedbackMode>> = { map: "story", swarm: "swarm", discovery: "discovery", strategy: "strategy" };
    if (mode[next]) trackModeStart(mode[next]!);
    setScreen(next);
  };

  if (!gameState.faction) {
    return (
      <div className="relative">
        <SpaceBackground />
        <Suspense fallback={<ScreenLoadingFallback label="Loading faction command..." />}>
          <FactionSelect onSelect={handleFactionSelect} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className={`space-bg min-h-screen relative ${gameState.accessibility.contrast === "high" ? "contrast-high" : ""} ${gameState.accessibility.effects === "reduced" ? "effects-reduced" : ""}`}>
      <SpaceBackground />
      <HUD
        gameState={gameState}
        activeScreen={screen}
        onNavigate={navigateFromHud}
        onClaimDaily={screen === "map" ? handleClaimDaily : undefined}
        onLogoClick={handleReturnToFactionSelect}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenFeedback={() => setFeedback({ open: true, mode: "overall" })}
      />

      <AnimatePresence mode="wait">
      {screen === "hub" && (
        <motion.div key="mode-hub" {...screenTransition}>
          <ScreenErrorBoundary screenName="mode-hub" onFallback={() => setScreen("map")}>
            <Suspense fallback={<ScreenLoadingFallback label="Opening activity network..." />}>
              <ModeHub gameState={gameState} onChoose={handleChooseMode} />
            </Suspense>
          </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "map" && (
        <motion.div key="map-screen" {...screenTransition}>
        <ScreenErrorBoundary screenName="galaxy-map" onFallback={() => setScreen("map")}>
          <Suspense fallback={<ScreenLoadingFallback label="Opening expedition console..." />}>
            <StoryExpeditionConsole
              gameState={gameState}
              onHome={() => setScreen("hub")}
              onLaunch={(planet) => { trackModeStart("story"); playTravelSound(); setActivePlanet(planet); setScreen("planet"); }}
            />
          </Suspense>
        </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "planet" && activePlanet && (
        <motion.div key={`planet-screen-${activePlanet.id}`} {...screenTransition}>
        <ScreenErrorBoundary screenName="planet-explore" onFallback={() => { setActivePlanet(null); setScreen("map"); }}>
          <Suspense fallback={<ScreenLoadingFallback label="Preparing sector..." />}>
            <PlanetExplore planet={activePlanet} gameState={gameState} onCollect={handleCollect}
              onBack={() => { setActivePlanet(null); setScreen("map"); }} />
          </Suspense>
        </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "shop" && (
        <motion.div key="shop-screen" {...screenTransition}>
        <ScreenErrorBoundary screenName="ship-shop" onFallback={() => setScreen("map")}>
          <Suspense fallback={<ScreenLoadingFallback label="Opening hangar..." />}>
            <CrewHangar
              gameState={gameState}
              onSetPilot={handleSetPilot}
              onSetTool={handleSetTool}
              onBuyUpgrade={handleBuyUpgrade}
              onBuySkin={handleBuySkin}
              onEquipSkin={handleEquipSkin}
              onBack={() => setScreen("map")}
            />
          </Suspense>
        </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "pets" && (
        <motion.div key="pets-screen" {...screenTransition}>
        <ScreenErrorBoundary screenName="pet-collection" onFallback={() => setScreen("map")}>
          <Suspense fallback={<ScreenLoadingFallback label="Opening companion bay..." />}>
            <PetCollection
              ownedPets={gameState.pets}
              activePet={gameState.activePet}
              eggs={gameState.eggs}
              onBack={() => setScreen("map")}
              onSetActivePet={handleSetActivePet}
              onHatchEgg={handleStartHatch}
            />
          </Suspense>
        </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "info" && (
        <motion.div key="info-screen" {...screenTransition}>
        <ScreenErrorBoundary screenName="info-screen" onFallback={() => setScreen("map")}>
          <Suspense fallback={<ScreenLoadingFallback label="Opening system info..." />}>
            <InfoScreen />
          </Suspense>
        </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "arcade-select" && (
        <motion.div key="arcade-select" {...screenTransition}>
          <ScreenErrorBoundary screenName="arcade-contracts" onFallback={() => setScreen("hub")}>
            <Suspense fallback={<ScreenLoadingFallback label="Loading Arcade assignments..." />}>
              <ArcadeContracts
                gameState={gameState}
                onBack={() => setScreen("hub")}
                onStart={(contract: ArcadeContract) => { trackModeStart("arcade"); setActiveArcadeContract(contract.id); setScreen("arcade"); }}
              />
            </Suspense>
          </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "swarm" && (
        <motion.div key="swarm" {...screenTransition}>
          <ScreenErrorBoundary screenName="swarm" onFallback={() => setScreen("hub")}>
            <Suspense fallback={<ScreenLoadingFallback label="Loading survival simulation..." />}>
              <SwarmProtocol
                gameState={gameState}
                onBack={() => setScreen("hub")}
                onOpenHangar={() => setScreen("shop")}
                onComplete={handleCombatComplete}
              />
            </Suspense>
          </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "arcade" && (
        <motion.div key="arcade" {...screenTransition}>
          <ScreenErrorBoundary screenName="arcade" onFallback={() => setScreen("arcade-select")}>
            <Suspense fallback={<ScreenLoadingFallback label="Loading shooting range..." />}>
              <ArcadeShooter
                gameState={gameState}
                contractId={activeArcadeContract}
                onBack={() => setScreen("arcade-select")}
                onComplete={handleCombatComplete}
              />
            </Suspense>
          </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "discovery" && (
        <motion.div key="discovery" {...screenTransition}>
          <ScreenErrorBoundary screenName="discovery" onFallback={() => setScreen("hub")}>
            <Suspense fallback={<ScreenLoadingFallback label="Preparing discovery field..." />}>
              <DiscoveryRun gameState={gameState} onBack={() => setScreen("hub")} onComplete={handleDiscoveryComplete} />
            </Suspense>
          </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "strategy" && (
        <motion.div key="strategy" {...screenTransition}>
          <ScreenErrorBoundary screenName="strategy" onFallback={() => setScreen("hub")}>
            <Suspense fallback={<ScreenLoadingFallback label="Opening tactical grid..." />}>
              <FrontierControl gameState={gameState} onBack={() => setScreen("hub")} onComplete={handleStrategyComplete} />
            </Suspense>
          </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "progress" && (
        <motion.div key="captain-progress" {...screenTransition}>
          <ScreenErrorBoundary screenName="captain-progress" onFallback={() => setScreen("hub")}>
            <Suspense fallback={<ScreenLoadingFallback label="Opening Captain progress..." />}>
              <CaptainProgress gameState={gameState} onBack={() => setScreen("hub")} onOpenCrew={() => setScreen("shop")} onPlay={handleChooseMode} />
            </Suspense>
          </ScreenErrorBoundary>
        </motion.div>
      )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <SettingsPanel
          open={settingsOpen}
          factionName={gameState.faction.toUpperCase()}
          settings={gameState.accessibility}
          onOpenChange={setSettingsOpen}
          onChange={(accessibility) => updateState((prev) => ({ ...prev, accessibility }))}
          onSwitchFaction={handleReturnToFactionSelect}
          onResetProgress={handleResetProgress}
          onReplayOnboarding={() => { setSettingsOpen(false); setGuidedOpen(true); }}
        />
        <PlaytestFeedback open={feedback.open} mode={feedback.mode} onOpenChange={(open) => setFeedback((current) => ({ ...current, open }))} onSubmitted={() => toast("Thanks! Your local playtest note was saved.")} />
      </Suspense>

      {runResult && (
        <Suspense fallback={null}>
          <UnifiedRunResults result={runResult} gameState={gameState} onClose={() => setRunResult(null)} onNext={(mode) => { setRunResult(null); handleChooseMode(mode); }} onCrew={() => { setRunResult(null); setScreen("shop"); }} />
        </Suspense>
      )}

      {guidedOpen && (
        <Suspense fallback={null}>
          <GuidedFlight
            gameState={gameState}
            onStartStory={() => { dismissGuidedFlight(); trackModeStart("story"); setScreen("map"); }}
            onOpenCrew={() => { dismissGuidedFlight(); setScreen("shop"); }}
            onDismiss={dismissGuidedFlight}
          />
        </Suspense>
      )}

      {captureEvent && (
        <Suspense fallback={null}>
          <PlanetCaptureAnimation
            factionId={captureEvent.factionId}
            planetName={captureEvent.planetName}
            planetEmoji={captureEvent.planetEmoji}
            onDone={() => setCaptureEvent(null)}
          />
        </Suspense>
      )}

      {/* Egg hatching overlay */}
      {hatchingEgg && (
        <Suspense fallback={null}>
          <EggHatchOverlay
            egg={hatchingEgg}
            ownedPets={gameState.pets}
            onResolved={handleEggResolved}
            onClose={() => setHatchingEgg(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
