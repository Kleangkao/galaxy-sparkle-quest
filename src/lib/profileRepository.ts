import { FactionId, GameState, getLastPlayedFaction, loadGame, resetGame, saveGame, setLastPlayedFaction } from "@/lib/gameState";

export interface ProfileRepository {
  readonly kind: "local" | "cloud";
  readonly supportsAccounts: boolean;
  load(faction?: FactionId | null): GameState;
  save(state: GameState): void;
  reset(faction?: FactionId | null): GameState;
  getActiveFaction(): FactionId | null;
  setActiveFaction(faction: FactionId | null): void;
}

export class LocalProfileRepository implements ProfileRepository {
  readonly kind = "local" as const;
  readonly supportsAccounts = false;
  load(faction: FactionId | null = null) { return loadGame(faction); }
  save(state: GameState) { saveGame(state); }
  reset(faction: FactionId | null = null) { return resetGame(faction); }
  getActiveFaction() { return getLastPlayedFaction(); }
  setActiveFaction(faction: FactionId | null) { setLastPlayedFaction(faction); }
}

export const profileRepository: ProfileRepository = new LocalProfileRepository();
