import type { FactionId } from "@/lib/gameState";

const PREFIX = "galia-guided-flight-v1";

export function hasSeenGuidedFlight(faction: FactionId | null) {
  if (!faction) return true;
  try { return localStorage.getItem(`${PREFIX}:${faction}`) === "done"; } catch { return false; }
}

export function markGuidedFlightSeen(faction: FactionId | null) {
  if (!faction) return;
  try { localStorage.setItem(`${PREFIX}:${faction}`, "done"); } catch { /* Device storage is optional. */ }
}
