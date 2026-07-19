import { GameState, loadGame, saveGame, PLANETS, FactionId } from "@/lib/gameState";

// ─── Error Logging ───────────────────────────────────────────────
interface ErrorLog {
  message: string;
  screen: string;
  time: string;
  device: string;
  stack?: string;
}

const ERROR_LOG_KEY = "cosmic-error-log";
const MAX_LOGS = 50;

export function logError(error: unknown, screen = "unknown") {
  try {
    const logs = getErrorLogs();
    const entry: ErrorLog = {
      message: error instanceof Error ? error.message : String(error),
      screen,
      time: new Date().toISOString(),
      device: navigator.userAgent.slice(0, 100),
      stack: error instanceof Error ? error.stack?.slice(0, 300) : undefined,
    };
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs));
  } catch {
    // Error reporting must never become a second failure when storage is blocked.
  }
}

export function getErrorLogs(): ErrorLog[] {
  try {
    return JSON.parse(localStorage.getItem(ERROR_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

// ─── Auto-Save ───────────────────────────────────────────────────
const AUTO_SAVE_INTERVAL = 30_000; // 30 seconds
let autoSaveTimer: ReturnType<typeof setInterval> | null = null;
let currentStateGetter: (() => GameState) | null = null;

export function startAutoSave(getState: () => GameState) {
  stopAutoSave();
  currentStateGetter = getState;
  autoSaveTimer = setInterval(() => {
    try {
      if (currentStateGetter) {
        saveGame(currentStateGetter());
      }
    } catch (e) {
      logError(e, "auto-save");
    }
  }, AUTO_SAVE_INTERVAL);
}

export function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
  currentStateGetter = null;
}

// ─── Game State Validation & Repair ──────────────────────────────
export function validateAndRepairState(state: GameState): GameState {
  try {
    const repaired = { ...state };

    // Ensure valid faction
    if (repaired.faction && !["mud", "oni", "ustur"].includes(repaired.faction)) {
      repaired.faction = null;
    }

    // Ensure numeric values
    if (typeof repaired.level !== "number" || repaired.level < 1 || !isFinite(repaired.level)) {
      repaired.level = 1;
    }
    if (typeof repaired.xp !== "number" || repaired.xp < 0 || !isFinite(repaired.xp)) {
      repaired.xp = 0;
    }
    if (typeof repaired.crystals !== "number" || repaired.crystals < 0 || !isFinite(repaired.crystals)) {
      repaired.crystals = 0;
    }
    if (typeof repaired.shipLevel !== "number" || repaired.shipLevel < 1) {
      repaired.shipLevel = 1;
    }

    // Ensure arrays
    if (!Array.isArray(repaired.pets)) repaired.pets = [];
    if (!Array.isArray(repaired.visitedPlanets)) repaired.visitedPlanets = [];
    if (!Array.isArray(repaired.upgrades)) repaired.upgrades = [];
    if (!Array.isArray(repaired.ownedSkins)) repaired.ownedSkins = ["red-rocket"];
    if (!Array.isArray(repaired.eggs)) repaired.eggs = [];

    // Ensure valid activeSkin
    if (!repaired.ownedSkins.includes(repaired.activeSkin || "")) {
      repaired.activeSkin = "red-rocket";
      if (!repaired.ownedSkins.includes("red-rocket")) {
        repaired.ownedSkins = ["red-rocket", ...repaired.ownedSkins];
      }
    }

    // Ensure valid influence
    if (!repaired.influence || typeof repaired.influence !== "object") {
      repaired.influence = {};
    }
    for (const p of PLANETS) {
      if (!repaired.influence[p.id] || typeof repaired.influence[p.id] !== "object") {
        repaired.influence[p.id] = { mud: 0, oni: 0, ustur: 0 };
      }
    }

    // Ensure valid visitedPlanets (only real planet ids)
    const validIds = new Set(PLANETS.map(p => p.id));
    repaired.visitedPlanets = repaired.visitedPlanets.filter(id => validIds.has(id));

    return repaired;
  } catch (e) {
    logError(e, "state-validation");
    return loadGame(state?.faction ?? null); // fallback to the current faction save when possible
  }
}

// ─── Performance Detection ───────────────────────────────────────
let isLowPerf: boolean | null = null;

export function detectLowPerformance(): boolean {
  if (isLowPerf !== null) return isLowPerf;
  try {
    // Check hardware concurrency
    const cores = navigator.hardwareConcurrency || 2;
    // Check device memory (Chrome only)
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
    // Check if mobile
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    isLowPerf = cores <= 2 || memory <= 2 || (isMobile && cores <= 4 && memory <= 3);
  } catch {
    isLowPerf = false;
  }
  return isLowPerf;
}

// ─── Health Check ────────────────────────────────────────────────
const HEALTH_CHECK_INTERVAL = 15_000; // 15 seconds
let healthTimer: ReturnType<typeof setInterval> | null = null;

export function startHealthCheck(onIssue: (issue: string) => void) {
  stopHealthCheck();
  healthTimer = setInterval(() => {
    try {
      // Check every supported save slot is loadable
      const states = [
        loadGame(null),
        ...(["mud", "oni", "ustur"] as FactionId[]).map((faction) => loadGame(faction)),
      ];
      if (states.some((state) => !state || typeof state !== "object")) {
        onIssue("corrupt-state");
        return;
      }

      // Check localStorage is accessible
      const testKey = "__health_check__";
      localStorage.setItem(testKey, "1");
      localStorage.removeItem(testKey);
    } catch (e) {
      logError(e, "health-check");
      onIssue("storage-error");
    }
  }, HEALTH_CHECK_INTERVAL);
}

export function stopHealthCheck() {
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
}

// ─── Global Error Handler ────────────────────────────────────────
let removeGlobalErrorHandlers: (() => void) | null = null;

export function installGlobalErrorHandlers() {
  if (removeGlobalErrorHandlers) return removeGlobalErrorHandlers;

  const handleError = (event: ErrorEvent) => {
    logError(event.error || event.message, "global");
  };

  const handleRejection = (event: PromiseRejectionEvent) => {
    logError(event.reason, "promise");
  };

  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleRejection);

  const cleanup = () => {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleRejection);
    if (removeGlobalErrorHandlers === cleanup) removeGlobalErrorHandlers = null;
  };
  removeGlobalErrorHandlers = cleanup;
  return cleanup;
}
