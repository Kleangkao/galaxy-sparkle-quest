import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import SpaceBackground from "@/components/SpaceBackground";
import SwipeableGalaxyMap from "@/components/SwipeableGalaxyMap";
import PlanetCard from "@/components/PlanetCard";
import HUD from "@/components/HUD";
import GalaxyMapNav from "@/components/GalaxyMapNav";
import ScreenErrorBoundary from "@/components/ScreenErrorBoundary";
import {
  PLANETS, Planet, GameState, FactionId, createNewGameState, loadGame, resetGame, saveGame, getLastPlayedFaction, setLastPlayedFaction, getLevelFromXP,
  calcInfluenceGain, simulateRivalInfluence, getPlanetController, INFLUENCE_TO_CAPTURE, countControlled, isPlanetUnlocked,
} from "@/lib/gameState";
import { generateEgg, AlienEgg, AlienPet, ALIEN_PETS } from "@/lib/pets";
import { playClickSound, playTravelSound } from "@/lib/sounds";
import {
  startAutoSave, stopAutoSave, startHealthCheck, stopHealthCheck,
  validateAndRepairState, detectLowPerformance, logError,
} from "@/lib/selfHealing";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

type Screen = "map" | "planet" | "shop" | "pets" | "info";

interface CaptureEvent {
  factionId: FactionId;
  planetName: string;
  planetEmoji: string;
}

const FactionSelect = lazy(() => import("@/components/FactionSelect"));
const PlanetExplore = lazy(() => import("@/components/PlanetExplore"));
const ShipUpgradeShop = lazy(() => import("@/components/ShipUpgradeShop"));
const PetCollection = lazy(() => import("@/components/PetCollection"));
const InfoScreen = lazy(() => import("@/components/InfoScreen"));
const PlanetCaptureAnimation = lazy(() => import("@/components/PlanetCaptureAnimation"));
const EggHatchOverlay = lazy(() => import("@/components/EggHatchOverlay"));

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
  const [gameState, setGameState] = useState<GameState>(() => validateAndRepairState(loadGame(getLastPlayedFaction())));
  const [activePlanet, setActivePlanet] = useState<Planet | null>(null);
  const [screen, setScreen] = useState<Screen>("map");
  const [captureEvent, setCaptureEvent] = useState<CaptureEvent | null>(null);
  const [hatchingEgg, setHatchingEgg] = useState<AlienEgg | null>(null);
  const [lowPerf, setLowPerf] = useState(false);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;


  // Self-healing: auto-save, health check, performance detection
  useEffect(() => {
    setLowPerf(detectLowPerformance());
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

  const updateState = useCallback((updater: (prev: GameState) => GameState) => {
    setGameState((prev) => {
      const next = updater(prev);
      saveGame(next);
      return next;
    });
  }, []);

  const handleFactionSelect = (factionId: FactionId) => {
    playClickSound();
    setLastPlayedFaction(factionId);
    setActivePlanet(null);
    setScreen("map");
    setCaptureEvent(null);
    setHatchingEgg(null);
    setGameState(validateAndRepairState(loadGame(factionId)));
  };

  const handleReturnToFactionSelect = useCallback(() => {
    setActivePlanet(null);
    setCaptureEvent(null);
    setHatchingEgg(null);
    setScreen("map");
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
    setScreen("map");
    setGameState(validateAndRepairState(resetGame(gameState.faction)));
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
        let newEggs = [...prev.eggs];
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
    },
    [activePlanet, updateState]
  );

  const handleBuyUpgrade = (id: string, cost: number) => {
    updateState((prev) => {
      if (prev.crystals < cost || prev.upgrades.includes(id)) return prev;
      playClickSound();
      toast(t("upgradeInstalled"));
      return { ...prev, crystals: prev.crystals - cost, upgrades: [...prev.upgrades, id], shipLevel: prev.upgrades.length + 2 };
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

  const unlockedPlanets = PLANETS.filter((planet) => isPlanetUnlocked(planet, gameState.level, gameState.faction));
  const lockedPlanets = PLANETS.filter((planet) => !isPlanetUnlocked(planet, gameState.level, gameState.faction));
  const nextLockedPlanet = lockedPlanets[0] ?? null;
  const activeIntelCount = Object.values(gameState.influence).filter((sector) => sector.mud + sector.oni + sector.ustur > 0).length;
  const controlledCount = gameState.faction ? countControlled(gameState.influence, gameState.faction) : 0;

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
    <div className="space-bg min-h-screen relative">
      <SpaceBackground />
      <HUD
        gameState={gameState}
        activeScreen={screen}
        onNavigate={(s) => { playClickSound(); setActivePlanet(null); setScreen(s); }}
        onClaimDaily={screen === "map" ? handleClaimDaily : undefined}
        onLogoClick={handleReturnToFactionSelect}
      />

      <AnimatePresence mode="wait">
      {screen === "map" && (
        <motion.div key="map-screen" {...screenTransition}>
        <ScreenErrorBoundary screenName="galaxy-map" onFallback={() => setScreen("map")}>
          <div className="relative z-10 pt-28 sm:pt-32 pb-24 sm:pb-28 px-3 sm:px-6 md:px-8 max-w-6xl mx-auto min-h-screen flex flex-col gap-4 sm:gap-6">
            <GalaxyMapNav
              onHome={handleReturnToFactionSelect}
            />
            {/* Title */}
            <div className="text-center animate-slide-up shrink-0">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-[-0.03em] text-white" style={{ fontFamily: "var(--font-hero)" }}>
                Galaxy Map
              </h1>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Select a sector above, then choose your next run from the mission board below.
              </p>
            </div>

            {/* Galaxy Map */}
            <div className="w-full max-w-5xl mx-auto">
              <SwipeableGalaxyMap
                level={gameState.level}
                faction={gameState.faction}
                visitedPlanets={gameState.visitedPlanets}
                onPlanetClick={(planet) => { playTravelSound(); setActivePlanet(planet); setScreen("planet"); }}
                influence={gameState.influence}
                activePet={gameState.activePet}
                reducedMotion={lowPerf}
              />
            </div>

            {/* Planet Cards */}
            <div className="w-full max-w-5xl mx-auto">
              <div className="rounded-[1.75rem] border border-border/50 bg-card/35 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-5">
                <div className="mb-4 flex flex-col gap-3 sm:mb-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-foreground/90" style={{ fontFamily: "var(--font-hero)" }}>
                        {t("missionBoard")}
                      </h2>
                    </div>
                    <button
                      onClick={handleResetProgress}
                      className="min-h-[44px] rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-destructive transition-colors hover:bg-destructive/15 active:scale-[0.98] sm:text-sm"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Reset Progress
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/5 px-4 py-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">{t("availableMissions")}</div>
                      <div className="mt-1 text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{unlockedPlanets.length}</div>
                    </div>
                    <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/5 px-4 py-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-100">Active Intel</div>
                      <div className="mt-1 text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{activeIntelCount}</div>
                    </div>
                    <div className="rounded-2xl border border-fuchsia-300/15 bg-fuchsia-400/5 px-4 py-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-fuchsia-100">Local Control</div>
                      <div className="mt-1 text-2xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{controlledCount}/{PLANETS.length}</div>
                    </div>
                    <div className="rounded-2xl border border-amber-300/15 bg-amber-400/5 px-4 py-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100">{t("nextUnlock")}</div>
                      <div className="mt-1 text-sm font-bold text-white sm:text-base" style={{ fontFamily: "var(--font-display)" }}>
                        {nextLockedPlanet ? `Level ${nextLockedPlanet.unlockLevel}` : "All sectors open"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <h3 className="text-base font-bold text-foreground/85 sm:text-lg" style={{ fontFamily: "var(--font-hero)" }}>
                      {t("availableMissions")}
                    </h3>
                    <span className="rounded-full border border-emerald-300/15 bg-emerald-400/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100">
                      {unlockedPlanets.length} ready now
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-5">
                    {unlockedPlanets.map((planet) => (
                      <PlanetCard
                        key={planet.id}
                        planet={planet}
                        level={gameState.level}
                        faction={gameState.faction}
                        visited={gameState.visitedPlanets.includes(planet.id)}
                        influence={gameState.influence[planet.id]}
                        hasUndiscoveredPet={Boolean(planet.pet && !gameState.pets.includes(planet.pet.name))}
                      />
                    ))}
                  </div>
                </div>

                {lockedPlanets.length > 0 && (
                  <div>
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <h3 className="text-base font-bold text-foreground/75 sm:text-lg" style={{ fontFamily: "var(--font-hero)" }}>
                        {t("lockedDossiers")}
                      </h3>
                      <span className="rounded-full border border-amber-300/15 bg-amber-400/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-100">
                        {lockedPlanets.length} still gated
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-5">
                      {lockedPlanets.map((planet) => (
                        <PlanetCard
                          key={planet.id}
                          planet={planet}
                          level={gameState.level}
                          faction={gameState.faction}
                          visited={gameState.visitedPlanets.includes(planet.id)}
                          influence={gameState.influence[planet.id]}
                          hasUndiscoveredPet={Boolean(planet.pet && !gameState.pets.includes(planet.pet.name))}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {lockedPlanets.length === 0 && (
                  <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/5 px-4 py-4 text-sm text-emerald-50/85">
                    All dossiers are open. Your progression loop is now about survey runs, pet completion, and expanding local control.
                  </div>
                )}
              </div>
            </div>
          </div>
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
            <ShipUpgradeShop gameState={gameState} onBuyUpgrade={handleBuyUpgrade}
              onBuySkin={handleBuySkin} onEquipSkin={handleEquipSkin}
              onBack={() => setScreen("map")} />
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
      </AnimatePresence>

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
