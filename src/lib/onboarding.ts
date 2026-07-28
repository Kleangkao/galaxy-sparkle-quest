import type { FactionId } from "@/lib/gameState";

const PREFIX = "galia-guided-flight-v1";
const MODE_GUIDE_PREFIX = "galia-mode-guide-v1";

export type ModeGuide = "swarm" | "arcade";

export function hasSeenGuidedFlight(faction: FactionId | null) {
  if (!faction) return true;
  try { return localStorage.getItem(`${PREFIX}:${faction}`) === "done"; } catch { return false; }
}

export function markGuidedFlightSeen(faction: FactionId | null) {
  if (!faction) return;
  try { localStorage.setItem(`${PREFIX}:${faction}`, "done"); } catch { /* Device storage is optional. */ }
}

export function hasSeenModeGuide(mode: ModeGuide) {
  try { return localStorage.getItem(`${MODE_GUIDE_PREFIX}:${mode}`) === "done"; } catch { return false; }
}

export function markModeGuideSeen(mode: ModeGuide) {
  try { localStorage.setItem(`${MODE_GUIDE_PREFIX}:${mode}`, "done"); } catch { /* Device storage is optional. */ }
}
