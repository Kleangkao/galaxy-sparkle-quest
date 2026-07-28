import { Profiler, useState } from "react";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  canClaimDaily,
  createNewGameState,
  getGameplayModifiers,
  loadGame,
  PLANETS,
  resetGame,
  saveGame,
  SHIP_UPGRADES,
} from "@/lib/gameState";
import { useCombatInput } from "@/hooks/useCombatInput";
import { getStoryStepCount, isOrthogonallyAdjacent } from "@/lib/storyMovement";
import FrontierControl from "@/components/FrontierControl";
import StoryExpeditionConsole from "@/components/StoryExpeditionConsole";
import PlanetExplore from "@/components/PlanetExplore";
import PlanetExploration from "@/components/PlanetExploration";
import { getReachableStoryCellKeys } from "@/lib/storyMap";
import CrewHangar from "@/components/CrewHangar";
import { MISSION_BRIEFS } from "@/lib/missionBriefs";
import UnifiedRunResults from "@/components/UnifiedRunResults";
import ArcadeShooter from "@/components/ArcadeShooter";
import SwarmProtocol from "@/components/SwarmProtocol";
import CelebrationScreen from "@/components/CelebrationScreen";
import DiscoveryRun from "@/components/DiscoveryRun";
import { I18nProvider } from "@/lib/i18n";

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

  it("keeps a completed Frontier Relay result visible after the parent saves it", () => {
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
    fireEvent.click(screen.getByRole("button", { name: "Launch relay ship" }));
    fireEvent.click(screen.getByRole("button", { name: /Risk route/ }));
    fireEvent.click(screen.getByRole("button", { name: /Risk route/ }));
    fireEvent.click(screen.getByRole("button", { name: /Safe route/ }));
    fireEvent.click(screen.getByRole("button", { name: /Safe route/ }));
    fireEvent.click(screen.getByRole("button", { name: "Bank flight rewards" }));

    expect(screen.getByRole("heading", { name: "Signal delivered" })).toBeInTheDocument();
    expect(screen.getByText("Flight saved · results ready")).toBeInTheDocument();
  });

  it("lets players preview locked Story chapters without launching them", () => {
    render(
      <StoryExpeditionConsole
        gameState={createNewGameState("mud")}
        onHome={() => undefined}
        onLaunch={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "04 Verdant Vault Clear Chapter 3" }));

    expect(screen.getByRole("heading", { name: "Verdant Vault" })).toBeInTheDocument();
    expect(screen.getByText(/Story goal:.*Threat: Guardian drones/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear Chapter 3" })).toBeDisabled();
  });

  it("launches an actual Story grid without colliding with the map icon", () => {
    render(
      <PlanetExplore
        planet={PLANETS[0]}
        gameState={createNewGameState("mud")}
        onCollect={() => undefined}
        onFailureCollect={() => undefined}
        onBack={() => undefined}
        onContinue={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Launch Balanced route" }));

    expect(screen.getByText(/Live mission/)).toBeInTheDocument();
    expect(screen.getByText(/Crystal Flight School/)).toBeInTheDocument();
  });

  it("reports a timed-out Story run as failure instead of banking a chapter clear", async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    try {
      render(
        <PlanetExploration
          planetId="sparkle-moon"
          missionTimeBonus={-49}
          onComplete={onComplete}
        />,
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_600);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_200);
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3_000);
      });

      expect(onComplete).toHaveBeenCalledWith({
        success: false,
        bonus: 0,
        reason: "timeout",
        salvageRecovered: false,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders the complete Story briefing in Thai when Thai is selected", () => {
    localStorage.setItem("galaxy-lang", "th");
    render(
      <I18nProvider>
        <PlanetExplore
          planet={PLANETS[0]}
          gameState={createNewGameState("mud")}
          onCollect={() => undefined}
          onFailureCollect={() => undefined}
          onBack={() => undefined}
          onContinue={() => undefined}
        />
      </I18nProvider>,
    );

    expect(screen.getByText("รางวัลผ่านครั้งแรก")).toBeInTheDocument();
    expect(screen.getByText("ข้อมูลเพื่อนร่วมทาง")).toBeInTheDocument();
    expect(screen.getByText("เป้าหมายภารกิจ")).toBeInTheDocument();
    expect(screen.getByText(/เก็บคริสตัล 5 ชิ้น แล้วเดินกลับมาที่ช่องยาน/)).toBeInTheDocument();
    expect(screen.queryByText("Choose how to play this chapter")).not.toBeInTheDocument();
  });

  it("keeps every Chapter 2 signal crystal on a cell reachable from the ship", () => {
    const reachable = getReachableStoryCellKeys([
      [1, 2], [1, 3], [1, 4], [1, 5],
      [3, 1], [3, 2], [3, 4], [3, 5],
      [5, 2], [5, 3], [5, 4],
    ]);

    expect(reachable.has("7,4")).toBe(true);
    expect(reachable.size).toBeGreaterThan(20);
    expect(reachable.has("1,3")).toBe(false);
  });

  it("spawns enough real signal crystals to complete Chapter 2 on every route", () => {
    const state = createNewGameState("mud");
    state.visitedPlanets = [PLANETS[0].id];
    const { container } = render(
      <PlanetExplore
        planet={PLANETS[1]}
        gameState={state}
        onCollect={() => undefined}
        onFailureCollect={() => undefined}
        onBack={() => undefined}
        onContinue={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Launch Balanced route/ }));
    expect(container.querySelectorAll('[data-story-item-type="crystal"]')).toHaveLength(7);
    expect(container.querySelectorAll(".is-trail-target")).toHaveLength(1);
    expect(container.querySelectorAll(".is-trail-target-cell")).toHaveLength(0);
  });

  it("localizes the live Story tracking marker instead of generating English from CSS", () => {
    localStorage.setItem("galaxy-lang", "th");
    const state = createNewGameState("mud");
    state.visitedPlanets = [PLANETS[0].id];
    render(
      <I18nProvider>
        <PlanetExplore
          planet={PLANETS[1]}
          gameState={state}
          onCollect={() => undefined}
          onFailureCollect={() => undefined}
          onBack={() => undefined}
          onContinue={() => undefined}
        />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "เริ่ม เส้นทางปกติ" }));
    expect(screen.getByText("ตามรอย")).toBeInTheDocument();
    expect(screen.queryByText("TRACK")).not.toBeInTheDocument();
  });

  it("localizes Crew roles, descriptions, abilities, and locked requirements as one data system", () => {
    localStorage.setItem("galaxy-lang", "th");
    render(
      <I18nProvider>
        <CrewHangar
          gameState={createNewGameState("mud")}
          onSetPilot={() => undefined}
          onSetTool={() => undefined}
          onBuyUpgrade={() => undefined}
          onBuySkin={() => undefined}
          onEquipSkin={() => undefined}
          onOpenPets={() => undefined}
          onBack={() => undefined}
        />
      </I18nProvider>,
    );

    expect(screen.getByText("นักสำรวจ")).toBeInTheDocument();
    expect(screen.getAllByText("รับคริสตัลเพิ่ม 10% จากทุกโหมด").length).toBeGreaterThan(0);
    expect(screen.getByText("ความแรงอาวุธ +20% ในฝ่าฝูงศัตรูและยิงเป้า")).toBeInTheDocument();
    expect(screen.getByText(/ผ่านเนื้อเรื่องบท 2 หรือภารกิจยิงเป้า 1 ภารกิจ/)).toBeInTheDocument();
    expect(screen.queryByText("+6 seconds in Story, Swarm, and Arcade")).not.toBeInTheDocument();
  });

  it("uses the equipped ship artwork consistently and returns to Crew from ship systems", () => {
    const { container } = render(
      <CrewHangar
        gameState={{ ...createNewGameState("mud"), activeSkin: "candy-ship", ownedSkins: ["red-rocket", "candy-ship"] }}
        onSetPilot={() => undefined}
        onSetTool={() => undefined}
        onBuyUpgrade={() => undefined}
        onBuySkin={() => undefined}
        onEquipSkin={() => undefined}
        onOpenPets={() => undefined}
        onBack={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Ship systems/ }));

    const currentMark = container.querySelector(".ship-hangar-current-mark") as HTMLElement;
    const activeCard = screen.getByRole("button", { name: /Coral Pulse/ });
    const cardMark = activeCard.querySelector(".galia-hangar-sprite") as HTMLElement;
    expect(currentMark).toHaveClass("galia-hangar-sprite");
    expect(currentMark.style.backgroundPosition).toBe(cardMark.style.backgroundPosition);
    expect(screen.getByRole("button", { name: "Crew Hangar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Galaxy Map" })).not.toBeInTheDocument();
  });

  it("places the required glow node in Story chapter 8", () => {
    render(
      <PlanetExplore
        planet={PLANETS[7]}
        gameState={createNewGameState("mud")}
        onCollect={() => undefined}
        onFailureCollect={() => undefined}
        onBack={() => undefined}
        onContinue={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Launch Balanced route" }));

    expect(screen.getAllByText(/Glow nodes 0\/1/).length).toBeGreaterThan(0);
    expect(screen.getByText("NODE")).toBeInTheDocument();
  });

  it("keeps the fully upgraded crystal economy within a controlled multiplier", () => {
    const base = createNewGameState("mud");
    const maximized = {
      ...base,
      activePilot: "nova-reyes",
      upgrades: SHIP_UPGRADES.map((upgrade) => upgrade.id),
      upgradeTiers: Object.fromEntries(SHIP_UPGRADES.map((upgrade) => [upgrade.id, 3])),
      modeRecords: { ...base.modeRecords, strategyObjectives: 2 },
    };
    const multiplier = getGameplayModifiers(maximized).crystalMultiplier;

    expect(multiplier).toBeGreaterThan(1);
    expect(multiplier).toBeLessThanOrEqual(4);
    expect(Number.isFinite(multiplier)).toBe(true);
  });

  it("ships a ten-chapter campaign with a complete final extraction brief", () => {
    expect(PLANETS).toHaveLength(10);
    const finale = PLANETS[9];
    const brief = MISSION_BRIEFS[finale.id];

    expect(finale.id).toBe("golden-galaxy");
    expect(brief.encounters).toMatch(/enemies|hazards/i);
    expect(brief.completion).toMatch(/every counter/i);
    expect(brief.transmission).toMatch(/ends here/i);
  });

  it("always exits a completed run to a usable mode menu", () => {
    const onExit = vi.fn();
    const onReplay = vi.fn();
    render(
      <UnifiedRunResults
        result={{ mode: "arcade", title: "Contract cleared", outcome: "Saved", crystals: 10, xp: 8 }}
        gameState={createNewGameState("mud")}
        onExit={onExit}
        onReplay={onReplay}
      />,
    );

    expect(screen.queryByText("Stay here")).not.toBeInTheDocument();
    expect(screen.queryByText("Play next")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expect(onReplay).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Assignments" }));
    expect(onExit).toHaveBeenCalledOnce();
  });

  it("labels a zero-action Arcade result honestly and lets Escape leave the completed run", () => {
    const onExit = vi.fn();
    render(
      <UnifiedRunResults
        result={{ mode: "arcade", status: "no-reward", title: "Assignment incomplete", outcome: "No target was hit.", crystals: 0, xp: 0 }}
        gameState={createNewGameState("mud")}
        onExit={onExit}
        onReplay={() => undefined}
      />,
    );

    expect(screen.getByText("Run ended · no reward earned")).toBeInTheDocument();
    expect(screen.queryByText("Run complete · rewards banked")).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExit).toHaveBeenCalledOnce();
  });

  it("moves the Arcade reticle without rerendering React on every pointer event", () => {
    let commits = 0;
    const { container } = render(
      <Profiler id="arcade-pointer" onRender={() => { commits += 1; }}>
        <ArcadeShooter
          gameState={createNewGameState("mud")}
          onBack={() => undefined}
          onComplete={() => undefined}
        />
      </Profiler>,
    );
    const range = container.querySelector(".arcade-range") as HTMLDivElement;
    vi.spyOn(range, "getBoundingClientRect").mockReturnValue({
      x: 10, y: 20, left: 10, top: 20, right: 930, bottom: 540,
      width: 920, height: 520, toJSON: () => ({}),
    });
    const commitsBeforeMovement = commits;

    for (let index = 0; index < 30; index += 1) {
      fireEvent.pointerMove(range, { clientX: 20 + index * 10, clientY: 40 + index * 5 });
    }

    expect(commits).toBe(commitsBeforeMovement);
  });

  it("makes an active Arcade reload visible in the arena, HUD, and controls", () => {
    const { container } = render(
      <ArcadeShooter
        gameState={createNewGameState("mud")}
        onBack={() => undefined}
        onComplete={() => undefined}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Start assignment" }));
    const range = container.querySelector(".arcade-range") as HTMLDivElement;
    fireEvent.pointerDown(range, { clientX: 80, clientY: 80 });
    fireEvent.click(screen.getByRole("button", { name: /R · Reload/ }));

    expect(screen.getByRole("status")).toHaveTextContent("RELOADING");
    expect(container.querySelector(".arcade-ammo-card")).toHaveClass("is-reloading");
    expect(container.querySelector(".arcade-reticle")).toHaveClass("is-reloading");
    expect(container.querySelector(".arcade-shooter__controls > span")).toHaveClass("is-reloading");
  });

  it("suspends Story countdowns while a global modal or hidden tab is active", async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    try {
      const view = render(
        <PlanetExploration planetId="sparkle-moon" missionTimeBonus={-49} suspended onComplete={onComplete} />,
      );
      await act(async () => vi.advanceTimersByTimeAsync(5_000));
      expect(onComplete).not.toHaveBeenCalled();

      view.rerender(
        <PlanetExploration planetId="sparkle-moon" missionTimeBonus={-49} suspended={false} onComplete={onComplete} />,
      );
      await act(async () => vi.advanceTimersByTimeAsync(5_000));
      await act(async () => vi.advanceTimersByTimeAsync(3_000));
      expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ success: false, reason: "timeout" }));
    } finally {
      vi.useRealTimers();
    }
  });

  it("resumes a Story countdown from the exact remaining time instead of resetting it", async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    try {
      const view = render(
        <PlanetExploration planetId="sparkle-moon" missionTimeBonus={-45} suspended={false} onComplete={onComplete} />,
      );
      await act(async () => vi.advanceTimersByTimeAsync(1_600));
      await act(async () => vi.advanceTimersByTimeAsync(1_200));
      const beforePause = Number.parseInt(screen.getByLabelText("Time remaining").textContent ?? "0", 10);

      view.rerender(
        <PlanetExploration planetId="sparkle-moon" missionTimeBonus={-45} suspended onComplete={onComplete} />,
      );
      await act(async () => vi.advanceTimersByTimeAsync(5_000));
      expect(onComplete).not.toHaveBeenCalled();
      expect(Number.parseInt(screen.getByLabelText("Time remaining").textContent ?? "0", 10)).toBe(beforePause);

      view.rerender(
        <PlanetExploration planetId="sparkle-moon" missionTimeBonus={-45} suspended={false} onComplete={onComplete} />,
      );
      await act(async () => vi.advanceTimersByTimeAsync(1_200));
      const afterResume = Number.parseInt(screen.getByLabelText("Time remaining").textContent ?? "0", 10);
      expect(afterResume).toBeLessThan(beforePause);
      expect(afterResume).toBeGreaterThanOrEqual(beforePause - 2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("suspends both real-time combat simulations when the app is suspended", async () => {
    vi.useFakeTimers();
    try {
      const state = createNewGameState("mud");
      const swarm = render(
        <SwarmProtocol gameState={state} suspended={false} onBack={() => undefined} onComplete={() => undefined} />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Begin run" }));
      await act(async () => vi.advanceTimersByTimeAsync(1_100));
      const swarmTime = swarm.container.querySelector(".combat-hud > div:last-child strong")?.textContent;
      swarm.rerender(
        <SwarmProtocol gameState={state} suspended onBack={() => undefined} onComplete={() => undefined} />,
      );
      await act(async () => vi.advanceTimersByTimeAsync(2_000));
      expect(swarm.container.querySelector(".combat-hud > div:last-child strong")?.textContent).toBe(swarmTime);
      swarm.unmount();

      const arcade = render(
        <ArcadeShooter gameState={state} suspended={false} onBack={() => undefined} onComplete={() => undefined} />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Start assignment" }));
      await act(async () => vi.advanceTimersByTimeAsync(1_100));
      const arcadeTime = arcade.container.querySelector(".arcade-shooter__hud > div:first-child strong")?.textContent;
      arcade.rerender(
        <ArcadeShooter gameState={state} suspended onBack={() => undefined} onComplete={() => undefined} />,
      );
      await act(async () => vi.advanceTimersByTimeAsync(2_000));
      expect(arcade.container.querySelector(".arcade-shooter__hud > div:first-child strong")?.textContent).toBe(arcadeTime);
    } finally {
      vi.useRealTimers();
    }
  });

  it("offers Story continuation only when a next chapter actually exists", async () => {
    vi.useFakeTimers();
    try {
      const onContinue = vi.fn();
      const withNext = render(
        <I18nProvider>
          <CelebrationScreen
            xp={10}
            crystals={5}
            petName={null}
            petEmoji={null}
            faction="mud"
            onDone={() => undefined}
            onContinue={onContinue}
          />
        </I18nProvider>,
      );
      await act(async () => vi.advanceTimersByTimeAsync(2_100));
      fireEvent.click(screen.getByRole("button", { name: "Continue to next chapter →" }));
      expect(onContinue).toHaveBeenCalledOnce();
      withNext.unmount();

      render(
        <I18nProvider>
          <CelebrationScreen
            xp={10}
            crystals={5}
            petName={null}
            petEmoji={null}
            faction="mud"
            onDone={() => undefined}
          />
        </I18nProvider>,
      );
      await act(async () => vi.advanceTimersByTimeAsync(2_100));
      expect(screen.queryByRole("button", { name: "Continue to next chapter →" })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("warns before discarding an unfinished Discovery journal", () => {
    render(
      <DiscoveryRun
        gameState={createNewGameState("mud")}
        onBack={() => undefined}
        onComplete={() => undefined}
      />,
    );
    fireEvent.click(screen.getAllByRole("button", { name: /Explore this area/ })[0]);
    fireEvent.click(document.querySelector(".discovery-point:not([disabled])") as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Biomes" }));

    expect(screen.getByRole("alertdialog", { name: "Leave this unfinished journal?" })).toBeInTheDocument();
  });

  it("restores the top of the page when Discovery changes internal views", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    render(
      <DiscoveryRun
        gameState={createNewGameState("mud")}
        onBack={() => undefined}
        onComplete={() => undefined}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /Explore this area/ })[2]);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: "auto" });
    scrollTo.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Biomes" }));
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: "auto" });
  });
});
