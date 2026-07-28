import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import SpaceBackground from "@/components/SpaceBackground";
import HUD from "@/components/HUD";
import type { AppScreen } from "@/components/HUD";
import ScreenErrorBoundary from "@/components/ScreenErrorBoundary";
import {
  PLANETS, Planet, GameState, FactionId, createNewGameState, getLevelFromXP,
  calcInfluenceGain, simulateRivalInfluence, getPlanetController, INFLUENCE_TO_CAPTURE, canClaimDaily,
} from "@/lib/gameState";
import { generateEgg, AlienEgg, AlienPet, ALIEN_PETS } from "@/lib/pets";
import { playClickSound, playTravelSound, setMusicMode, setSoundMode, startModeAmbience, stopModeAmbience } from "@/lib/sounds";
import {
  startAutoSave, stopAutoSave, startHealthCheck, stopHealthCheck,
  validateAndRepairState, logError,
} from "@/lib/selfHealing";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { PlayMode } from "@/components/ModeHub";
import type { ArcadeContract } from "@/lib/arcadeContracts";
import { profileRepository } from "@/lib/profileRepository";
import { hasSeenGuidedFlight, markGuidedFlightSeen } from "@/lib/onboarding";
import type { RunResultData } from "@/components/UnifiedRunResults";
import type { ConfirmAction } from "@/components/ConfirmActionDialog";

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
const StoryExpeditionConsole = lazy(() => import("@/components/StoryExpeditionConsole"));
const SettingsPanel = lazy(() => import("@/components/SettingsPanel"));
const CaptainProgress = lazy(() => import("@/components/CaptainProgress"));
const GuidedFlight = lazy(() => import("@/components/GuidedFlight"));
const UnifiedRunResults = lazy(() => import("@/components/UnifiedRunResults"));
const ConfirmActionDialog = lazy(() => import("@/components/ConfirmActionDialog"));

function ScreenLoadingFallback({ label, labelTh }: { label: string; labelTh: string }) {
  const { tr } = useI18n();
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-6 text-center">
      <div className="screen-loading">
        <span><Sparkles className="h-5 w-5" /></span>
        <strong>{tr(label, labelTh)}</strong>
      </div>
    </div>
  );
}

const screenTransition = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -3 },
  transition: { duration: 0.16, ease: "easeOut" as const },
};

export default function Index() {
  const { t, tr } = useI18n();
  const [gameState, setGameState] = useState<GameState>(() => validateAndRepairState(profileRepository.load(profileRepository.getActiveFaction())));
  const [activePlanet, setActivePlanet] = useState<Planet | null>(null);
  const [screen, setScreen] = useState<Screen>("hub");
  const [captureEvent, setCaptureEvent] = useState<CaptureEvent | null>(null);
  const [hatchingEgg, setHatchingEgg] = useState<AlienEgg | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [guidedOpen, setGuidedOpen] = useState(() => !hasSeenGuidedFlight(gameState.faction));
  const [activeArcadeContract, setActiveArcadeContract] = useState("ahr-blitz");
  const [runResult, setRunResult] = useState<RunResultData | null>(null);
  const [runReplayKey, setRunReplayKey] = useState(0);
  const [petsReturnScreen, setPetsReturnScreen] = useState<"map" | "shop">("map");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [activeRun, setActiveRun] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(() => typeof document !== "undefined" && document.hidden);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const gameSuspended = settingsOpen || Boolean(confirmAction) || Boolean(runResult) || documentHidden;


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
    setMusicMode(gameState.accessibility.music);
    const ambientMode = screen === "map" || screen === "planet" ? "story"
      : screen === "arcade" || screen === "arcade-select" ? "arcade"
        : screen === "progress" ? "progress"
          : screen === "swarm" ? "swarm" : "hub";
    startModeAmbience(ambientMode);
    return stopModeAmbience;
  }, [gameState.accessibility.music, gameState.accessibility.sound, screen]);

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

  useEffect(() => {
    const syncVisibility = () => setDocumentHidden(document.hidden);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  const handleResetProgress = useCallback(() => {
    if (!gameState.faction) return;
    const faction = gameState.faction;
    setConfirmAction({
      title: tr(`Reset ${faction.toUpperCase()} progress?`, `ล้างความคืบหน้าฝ่าย ${faction.toUpperCase()} ไหม?`),
      description: tr(
        "This clears this faction's Captain rank, rewards, chapters, crew systems, and records. Other faction saves stay safe.",
        "แรงก์ รางวัล เนื้อเรื่อง ทีม และสถิติของฝ่ายนี้จะถูกล้าง แต่เซฟของฝ่ายอื่นยังอยู่",
      ),
      confirmLabel: tr("Reset this faction", "ล้างเซฟฝ่ายนี้"),
      tone: "danger",
      onConfirm: () => {
        playClickSound();
        setActivePlanet(null);
        setCaptureEvent(null);
        setHatchingEgg(null);
        setSettingsOpen(false);
        setScreen("map");
        setGameState(validateAndRepairState(profileRepository.reset(faction)));
        toast(tr("Progress reset. You can start fresh now.", "ล้างความคืบหน้าแล้ว เริ่มเล่นใหม่ได้เลย"), { duration: 2500 });
      },
    });
  }, [gameState.faction, tr]);

  const handleExportSave = useCallback(() => {
    if (!gameState.faction) return;
    const blob = new Blob([JSON.stringify(gameState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `guardians-of-galia-${gameState.faction}-save.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast(tr("Save downloaded.", "ดาวน์โหลดเซฟแล้ว"));
  }, [gameState, tr]);

  const handleImportSave = useCallback(async (file: File) => {
    if (!gameState.faction) return;
    try {
      const parsed = JSON.parse(await file.text()) as Partial<GameState>;
      const repaired = validateAndRepairState({ ...gameState, ...parsed, faction: gameState.faction });
      profileRepository.save(repaired);
      setGameState(repaired);
      toast(tr("Save imported.", "นำเข้าเซฟแล้ว"));
    } catch {
      toast.error(tr("This save file could not be opened.", "เปิดไฟล์เซฟนี้ไม่ได้"));
    }
  }, [gameState, tr]);

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
            setTimeout(() => toast(tr(
              `Egg queue full. Converted to +${overflowCrystalBonus} crystals.`,
              `ช่องเก็บไข่เต็ม เปลี่ยนเป็นคริสตัล +${overflowCrystalBonus}`,
            ), { duration: 2600 }), 1200);
            eggCompensationCrystals += overflowCrystalBonus;
          }
        } else if (petCollectionComplete) {
          const completeCollectionBonus = 3;
          setTimeout(() => toast(tr(
            `Companion archive complete. +${completeCollectionBonus} crystals awarded.`,
            `เก็บเพื่อนร่วมทางครบแล้ว รับคริสตัล +${completeCollectionBonus}`,
          ), { duration: 2400 }), 1000);
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
    [activePlanet, t, tr, updateState]
  );

  const handleStoryFailureCollect = useCallback((crystals: number) => {
    if (crystals <= 0) return;
    updateState((prev) => ({ ...prev, crystals: prev.crystals + crystals }));
    toast(tr(`Recovery reward: +${crystals} crystals. Chapter progress was not saved.`, `รางวัลเก็บกลับมาได้ +${crystals} คริสตัล แต่ยังไม่ผ่านบทนี้`));
  }, [tr, updateState]);

  const handleBuyUpgrade = (id: string, cost: number) => {
    updateState((prev) => {
      const currentTier = prev.upgradeTiers[id] ?? (prev.upgrades.includes(id) ? 1 : 0);
      if (prev.crystals < cost || currentTier >= 3) return prev;
      playClickSound();
      toast(currentTier
        ? tr(`System upgraded to Tier ${currentTier + 1}.`, `อัปเกรดระบบเป็นขั้น ${currentTier + 1} แล้ว`)
        : t("upgradeInstalled"));
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
    toast(tr("Pilot assigned to your next expedition.", "เลือกนักบินสำหรับภารกิจถัดไปแล้ว"));
  };

  const handleSetTool = (id: string) => {
    playClickSound();
    updateState((prev) => ({ ...prev, activeTool: id }));
    toast(tr("Expedition tool equipped.", "ติดตั้งอุปกรณ์ภารกิจแล้ว"));
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
    if (mode === "story") setScreen("map");
    else if (mode === "arcade") setScreen("arcade-select");
    else setScreen("swarm");
  };

  const handleCombatComplete = (result: { score: number; crystals: number; xp: number; won: boolean; variant: "swarm" | "arcade"; contractId?: string; accuracy?: number; grade?: string; evolutions?: number; participated?: boolean }) => {
    setActiveRun(false);
    setSettingsOpen(false);
    setConfirmAction(null);
    const participated = result.participated !== false;
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
          swarmHighScore: result.variant === "swarm" && participated ? Math.max(prev.modeRecords.swarmHighScore, result.score) : prev.modeRecords.swarmHighScore,
          swarmRuns: result.variant === "swarm" && participated ? prev.modeRecords.swarmRuns + 1 : prev.modeRecords.swarmRuns,
          swarmClears: result.variant === "swarm" && result.won && participated ? prev.modeRecords.swarmClears + 1 : prev.modeRecords.swarmClears,
          swarmEvolutions: result.variant === "swarm" && participated ? prev.modeRecords.swarmEvolutions + (result.evolutions ?? 0) : prev.modeRecords.swarmEvolutions,
          arcadeHighScore: result.variant === "arcade" ? Math.max(prev.modeRecords.arcadeHighScore, result.score) : prev.modeRecords.arcadeHighScore,
          puriBond: Math.min(100, prev.modeRecords.puriBond + (result.participated === false ? 0 : result.won ? 3 : 1)),
          arcadeContracts: result.contractId && previousContract ? {
            ...prev.modeRecords.arcadeContracts,
            [result.contractId]: { bestScore: Math.max(previousContract.bestScore, result.score), clears: previousContract.clears + (result.won ? 1 : 0) },
          } : prev.modeRecords.arcadeContracts,
        },
      };
    });
    const isSwarm = result.variant === "swarm";
    setRunResult({
      mode: result.variant,
      status: result.participated === false ? "no-reward" : result.won ? "cleared" : "partial",
      title: result.won
        ? isSwarm ? tr("Ahr defeated", "กำจัด Ahr สำเร็จ") : tr(`Contract cleared · Grade ${result.grade ?? "B"}`, `ผ่านภารกิจยิงเป้า · ระดับ ${result.grade ?? "B"}`)
        : result.participated === false
          ? isSwarm ? tr("Run not counted", "รอบนี้ไม่นับ") : tr("Assignment incomplete", "ภารกิจยังไม่สำเร็จ")
          : tr("Rewards secured", "รับรางวัลแล้ว"),
      outcome: result.variant === "arcade" && result.accuracy !== undefined
        ? result.participated === false
          ? tr("No reward was issued because no target was hit with meaningful participation.", "ยังไม่ได้รางวัล เพราะต้องยิงอย่างน้อย 3 นัดและโดนเป้า 1 ครั้ง")
          : tr(`${Math.round(result.accuracy * 100)}% accuracy · ${result.won ? "contract record banked." : "partial rewards banked; try again when ready."}`, `ยิงแม่น ${Math.round(result.accuracy * 100)}% · ${result.won ? "บันทึกสถิติภารกิจแล้ว" : "ได้รับรางวัลบางส่วน พร้อมแล้วค่อยลองใหม่"}`)
        : isSwarm && result.participated === false
          ? tr("Move actively or collect at least 3 energy so the run counts toward rewards and mastery.", "ขยับหลบอย่างจริงจัง หรือเก็บพลังอย่างน้อย 3 ชิ้น เพื่อให้รอบนี้นับรางวัลและความชำนาญ")
        : result.won ? tr("Full clear rewards and mastery were banked.", "ได้รับรางวัลชนะและความชำนาญครบแล้ว") : tr("Partial rewards were banked. Upgrade or try a different build.", "ได้รับรางวัลบางส่วน ลองอัปเกรดหรือเลือกพลังแบบใหม่ได้"),
      crystals: result.crystals,
      xp: result.xp,
      score: result.score,
      mastery: result.grade ? `Grade ${result.grade}` : undefined,
      masteryTh: result.grade ? `ระดับ ${result.grade}` : undefined,
      improvements: isSwarm
        ? result.participated === false
          ? ["No currency, mastery, or PURI bond was awarded", "Move actively or collect 3 energy next time"]
          : ["Swarm record and PURI bond increased", result.won ? "Ahr clear counts toward combat mastery" : "Crystals for permanent upgrades increased"]
        : result.participated === false
          ? ["No currency or PURI bond was awarded", "Fire 3+ shots and hit at least one target next time"]
          : ["Arcade record and PURI bond increased", result.won ? "This contract clear was saved" : "Accuracy practice and upgrade fund increased"],
      improvementsTh: isSwarm
        ? result.participated === false
          ? ["ไม่ได้รับคริสตัล ความชำนาญ หรือความสนิทกับ PURI", "ครั้งหน้าขยับหลบอย่างจริงจัง หรือเก็บพลัง 3 ชิ้น"]
          : ["สถิติโหมดฝ่าฝูงศัตรูและความสนิทกับ PURI เพิ่มขึ้น", result.won ? "การกำจัด Ahr เพิ่มความชำนาญการต่อสู้" : "มีคริสตัลสำหรับอัปเกรดเพิ่มขึ้น"]
        : result.participated === false
          ? ["ไม่ได้รับคริสตัลหรือความสนิทกับ PURI", "ครั้งหน้าลองยิงอย่างน้อย 3 นัดและโดนเป้า 1 ครั้ง"]
          : ["สถิติโหมดยิงเป้าและความสนิทกับ PURI เพิ่มขึ้น", result.won ? "บันทึกการผ่านภารกิจนี้แล้ว" : "ได้ฝึกความแม่นและมีคริสตัลอัปเกรดเพิ่มขึ้น"],
    });
  };

  const dismissGuidedFlight = () => {
    markGuidedFlightSeen(gameState.faction);
    setGuidedOpen(false);
  };

  const performNavigation = (next: Screen) => {
    playClickSound();
    setActiveRun(false);
    setActivePlanet(null);
    setScreen(next);
  };

  const requestNavigation = (next: Screen) => {
    if (next === screen) return;
    if (!activeRun) {
      performNavigation(next);
      return;
    }
    setConfirmAction({
      title: tr("Leave the active run?", "ออกจากรอบที่กำลังเล่นไหม?"),
      description: tr(
        "This run is paused. Leaving now discards its current progress and rewards.",
        "เกมหยุดไว้แล้ว ถ้าออกตอนนี้ ความคืบหน้าและรางวัลของรอบนี้จะหายไป",
      ),
      confirmLabel: tr("Leave run", "ออกจากรอบ"),
      tone: "danger",
      onConfirm: () => performNavigation(next),
    });
  };

  const requestFactionSwitch = () => {
    if (!activeRun) {
      handleReturnToFactionSelect();
      return;
    }
    setSettingsOpen(false);
    setConfirmAction({
      title: tr("Leave this run and switch faction?", "ออกจากรอบแล้วเปลี่ยนฝ่ายไหม?"),
      description: tr(
        "This run is paused. Its current progress and rewards will not be saved.",
        "เกมหยุดไว้แล้ว ความคืบหน้าและรางวัลของรอบนี้จะไม่ถูกบันทึก",
      ),
      confirmLabel: tr("Switch faction", "เปลี่ยนฝ่าย"),
      tone: "danger",
      onConfirm: () => {
        setActiveRun(false);
        handleReturnToFactionSelect();
      },
    });
  };

  const exitRunResults = () => {
    if (!runResult) return;
    const completedMode = runResult.mode;
    setRunResult(null);
    setScreen(completedMode === "arcade" ? "arcade-select" : "hub");
  };

  const replayRun = () => {
    if (!runResult) return;
    const completedMode = runResult.mode;
    setRunResult(null);
    setRunReplayKey((value) => value + 1);
    setScreen(completedMode === "arcade" ? "arcade" : "swarm");
  };

  if (!gameState.faction) {
    return (
      <div className="relative">
        <SpaceBackground />
        <Suspense fallback={<ScreenLoadingFallback label="Loading faction command..." labelTh="กำลังเปิดหน้าฝ่าย..." />}>
          <FactionSelect onSelect={handleFactionSelect} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className={`space-bg screen-${screen} min-h-screen relative ${gameState.accessibility.contrast === "high" ? "contrast-high" : ""} ${gameState.accessibility.effects === "reduced" ? "effects-reduced" : ""} ${gameState.accessibility.screenShake === "off" ? "no-screen-shake" : ""}`}>
      <SpaceBackground />
      <HUD
        gameState={gameState}
        activeScreen={screen}
        onNavigate={(next) => {
          if (next === "pets") setPetsReturnScreen(screen === "shop" ? "shop" : "map");
          requestNavigation(next);
        }}
        onClaimDaily={screen === "map" ? handleClaimDaily : undefined}
        onLogoClick={requestFactionSwitch}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <AnimatePresence mode="wait">
      {screen === "hub" && (
        <motion.div key="mode-hub" {...screenTransition}>
          <ScreenErrorBoundary screenName="mode-hub" onFallback={() => setScreen("map")}>
            <Suspense fallback={<ScreenLoadingFallback label="Opening activity network..." labelTh="กำลังเปิดหน้าเลือกโหมด..." />}>
              <ModeHub gameState={gameState} onChoose={handleChooseMode} />
            </Suspense>
          </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "map" && (
        <motion.div key="map-screen" {...screenTransition}>
        <ScreenErrorBoundary screenName="galaxy-map" onFallback={() => setScreen("map")}>
          <Suspense fallback={<ScreenLoadingFallback label="Opening expedition console..." labelTh="กำลังเปิดแผนที่เนื้อเรื่อง..." />}>
            <StoryExpeditionConsole
              gameState={gameState}
              onHome={() => setScreen("hub")}
              onLaunch={(planet) => { playTravelSound(); setActivePlanet(planet); setScreen("planet"); }}
            />
          </Suspense>
        </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "planet" && activePlanet && (
        <motion.div key={`planet-screen-${activePlanet.id}`} {...screenTransition}>
        <ScreenErrorBoundary screenName="planet-explore" onFallback={() => { setActivePlanet(null); setScreen("map"); }}>
          <Suspense fallback={<ScreenLoadingFallback label="Preparing sector..." labelTh="กำลังเตรียมพื้นที่ภารกิจ..." />}>
            <PlanetExplore planet={activePlanet} gameState={gameState} onCollect={handleCollect}
              onFailureCollect={handleStoryFailureCollect}
              suspended={gameSuspended}
              onActiveChange={setActiveRun}
              onBack={() => requestNavigation("map")}
              onContinue={(nextPlanet) => { playTravelSound(); setActivePlanet(nextPlanet); setScreen("planet"); }} />
          </Suspense>
        </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "shop" && (
        <motion.div key="shop-screen" {...screenTransition}>
        <ScreenErrorBoundary screenName="ship-shop" onFallback={() => setScreen("map")}>
          <Suspense fallback={<ScreenLoadingFallback label="Opening hangar..." labelTh="กำลังเปิดโรงเก็บยาน..." />}>
            <CrewHangar
              gameState={gameState}
              onSetPilot={handleSetPilot}
              onSetTool={handleSetTool}
              onBuyUpgrade={handleBuyUpgrade}
              onBuySkin={handleBuySkin}
              onEquipSkin={handleEquipSkin}
              onOpenPets={() => {
                setPetsReturnScreen("shop");
                setScreen("pets");
              }}
              onBack={() => setScreen("map")}
            />
          </Suspense>
        </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "pets" && (
        <motion.div key="pets-screen" {...screenTransition}>
        <ScreenErrorBoundary screenName="pet-collection" onFallback={() => setScreen("map")}>
          <Suspense fallback={<ScreenLoadingFallback label="Opening companion bay..." labelTh="กำลังเปิดห้องเพื่อนร่วมทาง..." />}>
            <PetCollection
              ownedPets={gameState.pets}
              activePet={gameState.activePet}
              eggs={gameState.eggs}
              backTarget={petsReturnScreen === "shop" ? "crew" : "map"}
              onBack={() => setScreen(petsReturnScreen)}
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
          <Suspense fallback={<ScreenLoadingFallback label="Opening system info..." labelTh="กำลังเปิดคู่มือเกม..." />}>
            <InfoScreen />
          </Suspense>
        </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "arcade-select" && (
        <motion.div key="arcade-select" {...screenTransition}>
          <ScreenErrorBoundary screenName="arcade-contracts" onFallback={() => setScreen("hub")}>
            <Suspense fallback={<ScreenLoadingFallback label="Loading Arcade assignments..." labelTh="กำลังเปิดภารกิจยิงเป้า..." />}>
              <ArcadeContracts
                gameState={gameState}
                onBack={() => setScreen("hub")}
                onStart={(contract: ArcadeContract) => { setActiveArcadeContract(contract.id); setScreen("arcade"); }}
              />
            </Suspense>
          </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "swarm" && (
        <motion.div key="swarm" {...screenTransition}>
          <ScreenErrorBoundary screenName="swarm" onFallback={() => setScreen("hub")}>
            <Suspense fallback={<ScreenLoadingFallback label="Loading survival simulation..." labelTh="กำลังเตรียมโหมดฝ่าฝูงศัตรู..." />}>
              <SwarmProtocol
                key={`swarm-${runReplayKey}`}
                gameState={gameState}
                suspended={gameSuspended}
                onActiveChange={setActiveRun}
                onBack={() => requestNavigation("hub")}
                onComplete={handleCombatComplete}
              />
            </Suspense>
          </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "arcade" && (
        <motion.div key="arcade" {...screenTransition}>
          <ScreenErrorBoundary screenName="arcade" onFallback={() => setScreen("arcade-select")}>
            <Suspense fallback={<ScreenLoadingFallback label="Loading shooting range..." labelTh="กำลังเตรียมสนามยิง..." />}>
              <ArcadeShooter
                key={`arcade-${activeArcadeContract}-${runReplayKey}`}
                gameState={gameState}
                contractId={activeArcadeContract}
                suspended={gameSuspended}
                onActiveChange={setActiveRun}
                onBack={() => requestNavigation("arcade-select")}
                onComplete={handleCombatComplete}
              />
            </Suspense>
          </ScreenErrorBoundary>
        </motion.div>
      )}

      {screen === "progress" && (
        <motion.div key="captain-progress" {...screenTransition}>
          <ScreenErrorBoundary screenName="captain-progress" onFallback={() => setScreen("hub")}>
            <Suspense fallback={<ScreenLoadingFallback label="Opening Captain progress..." labelTh="กำลังเปิดหน้าความคืบหน้า..." />}>
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
          onSwitchFaction={requestFactionSwitch}
          onResetProgress={handleResetProgress}
          onReplayOnboarding={() => { setSettingsOpen(false); setGuidedOpen(true); }}
          onExportSave={handleExportSave}
          onImportSave={handleImportSave}
        />
        <ConfirmActionDialog action={confirmAction} onClose={() => setConfirmAction(null)} />
      </Suspense>

      {runResult && (
        <Suspense fallback={null}>
          <UnifiedRunResults result={runResult} gameState={gameState} onExit={exitRunResults} onReplay={replayRun} />
        </Suspense>
      )}

      {guidedOpen && (
        <Suspense fallback={null}>
          <GuidedFlight
            gameState={gameState}
            onStartStory={() => { dismissGuidedFlight(); setScreen("map"); }}
            onOpenCrew={() => { dismissGuidedFlight(); setScreen("shop"); }}
            onDismiss={dismissGuidedFlight}
          />
        </Suspense>
      )}

      {captureEvent && screen === "map" && (
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
