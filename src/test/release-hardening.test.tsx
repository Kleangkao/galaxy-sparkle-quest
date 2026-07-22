import { useState } from "react";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  canClaimDaily,
  createNewGameState,
  loadGame,
  resetGame,
  saveGame,
} from "@/lib/gameState";
import { useCombatInput } from "@/hooks/useCombatInput";
import { getStoryStepCount, isOrthogonallyAdjacent } from "@/lib/storyMovement";
import FrontierControl from "@/components/FrontierControl";
import StoryExpeditionConsole from "@/components/StoryExpeditionConsole";

const MUD_SAVE_KEY = "cosmic-explorer-save-v2:mud";
const ONI_SAVE_KEY = "cosmic-explorer-save-v2:oni";

describe("public test release hardening", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("treats an invalid daily timestamp as recoverable and honors the exact 24-hour boundary", () => {
    const now = new Date("2026-07-19T08:00:00.000Z");
    expect(canClaimDaily("not-a-date", now)).toBe(true);
    expect(canClaimDaily("2026-07-18T08:00:00.000Z", now)).toBe(true);
    expect(canClaimDaily("2026-07-18T08:00:00.001Z", now)).toBe(false);
  });

  it("repairs hostile or outdated local save values without losing the faction slot", () => {
    localStorage.setItem(MUD_SAVE_KEY, JSON.stringify({
      faction: "oni",
      xp: 55.8,
      level: -4,
      crystals: Number.POSITIVE_INFINITY,
      pets: ["Aneko", "aneko", "Unknown"],
      visitedPlanets: ["sparkle-moon", "fake-sector"],
      upgrades: ["shield", "not-real"],
      ownedSkins: ["not-real"],
      activeSkin: "not-real",
      activePet: "aneko",
      eggs: [
        { id: "valid", rarity: "common", foundAt: "sparkle-moon" },
        { id: "bad", rarity: "mythic", foundAt: "nowhere" },
      ],
      influence: { "sparkle-moon": { mud: 999, oni: -20, ustur: "bad" } },
      activePilot: "missing",
      activeTool: "missing",
      lastDailyReward: "invalid",
      modeRecords: { puriBond: 999, discoveryMastery: { "verdant-vault": 400 } },
    }));

    const state = loadGame("mud");
    expect(state.faction).toBe("mud");
    expect(state.level).toBe(4);
    expect(state.xp).toBe(55);
    expect(state.crystals).toBe(0);
    expect(state.pets).toEqual(["Aneko"]);
    expect(state.visitedPlanets).toEqual(["sparkle-moon"]);
    expect(state.upgrades).toEqual(["shield"]);
    expect(state.ownedSkins).toEqual(["red-rocket"]);
    expect(state.activeSkin).toBe("red-rocket");
    expect(state.activePet).toBe("aneko");
    expect(state.eggs).toHaveLength(1);
    expect(state.influence["sparkle-moon"]).toEqual({ mud: 100, oni: 0, ustur: 0 });
    expect(state.influence["candy-planet"]).toEqual({ mud: 0, oni: 0, ustur: 0 });
    expect(state.activePilot).toBe("nova-reyes");
    expect(state.activeTool).toBe("echo-scanner");
    expect(state.lastDailyReward).toBeNull();
    expect(state.modeRecords.puriBond).toBe(100);
    expect(state.modeRecords.discoveryMastery["verdant-vault"]).toBe(100);
  });

  it("keeps faction saves isolated when one slot is reset", () => {
    saveGame({ ...createNewGameState("mud"), crystals: 12 });
    saveGame({ ...createNewGameState("oni"), crystals: 44 });

    resetGame("mud");

    expect(loadGame("mud").crystals).toBe(0);
    expect(loadGame("oni").crystals).toBe(44);
    expect(localStorage.getItem(ONI_SAVE_KEY)).not.toBeNull();
  });

  it("continues in memory when browser storage rejects a save", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "QuotaExceededError");
    });
    expect(() => saveGame(createNewGameState("mud"))).not.toThrow();
  });

  it("does not let an idle connected controller cancel keyboard movement", () => {
    let animationFrame: FrameRequestCallback | null = null;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      animationFrame = callback;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const pad = { axes: [0, 0], buttons: [{ pressed: false }] } as unknown as Gamepad;
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [pad],
    });

    const { result, unmount } = renderHook(() => useCombatInput(vi.fn()));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }));
    });
    expect(result.current.vector.current).toEqual({ x: 1, y: 0 });

    act(() => {
      animationFrame?.(0);
    });
    expect(result.current.vector.current).toEqual({ x: 1, y: 0 });
    unmount();
  });

  it("supports physical WASD keys on non-Latin keyboard layouts", () => {
    const { result, unmount } = renderHook(() => useCombatInput(vi.fn()));
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "ไ", code: "KeyW" })));
    expect(result.current.vector.current).toEqual({ x: 0, y: -1 });
    act(() => window.dispatchEvent(new KeyboardEvent("keyup", { key: "ไ", code: "KeyW" })));
    expect(result.current.vector.current).toEqual({ x: 0, y: 0 });
    unmount();
  });

  it("keeps Story movement to one tile unless the player deliberately requests a charged dash", () => {
    expect(getStoryStepCount(false, false)).toBe(1);
    expect(getStoryStepCount(true, false)).toBe(1);
    expect(getStoryStepCount(true, true)).toBe(2);
    expect(isOrthogonallyAdjacent(2, 2, 2, 3)).toBe(true);
    expect(isOrthogonallyAdjacent(2, 2, 3, 3)).toBe(false);
  });

  it("keeps the completed Strategy objective visible after the parent advances the cycle", () => {
    function Harness() {
      const [state, setState] = useState(createNewGameState("oni"));
      return (
        <FrontierControl
          gameState={state}
          onBack={() => undefined}
          onComplete={({ influence }) => setState((current) => ({
            ...current,
            influence,
            modeRecords: { ...current.modeRecords, strategyCycles: current.modeRecords.strategyCycles + 1 },
          }))}
        />
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Start command cycle" }));
    const reinforce = screen.getByRole("button", { name: /Reinforce strongly/ });
    for (let index = 0; index < 4; index += 1) fireEvent.click(reinforce);
    fireEvent.click(screen.getByRole("button", { name: "Bank this command cycle" }));

    expect(screen.getByText("Secure a sector")).toBeInTheDocument();
    expect(screen.getByText(/Complete.*bonus secured/)).toBeInTheDocument();
    expect(screen.queryByText("Stabilize Prism Reach")).not.toBeInTheDocument();
  });

  it("lets players preview locked Story chapters without launching them", () => {
    render(
      <StoryExpeditionConsole
        gameState={createNewGameState("mud")}
        onHome={() => undefined}
        onLaunch={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "04 Verdant Vault Level 4" }));

    expect(screen.getByRole("heading", { name: "Verdant Vault" })).toBeInTheDocument();
    expect(screen.getByText("Threat detected: Guardian drones")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reach level 4" })).toBeDisabled();
  });
});
