import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Crosshair, MousePointer2, Pause, Play, RotateCcw, Sparkles, Target, Trophy, Zap } from "lucide-react";
import { GameState } from "@/lib/gameState";
import { getArcadeContract } from "@/lib/arcadeContracts";
import { getPilot, getTool } from "@/lib/loadouts";
import { getPuriBonuses } from "@/lib/puriBond";

type TargetKind = "drone" | "crystal" | "decoy" | "boss";
type ShooterTarget = { id: number; x: number; y: number; vx: number; vy: number; size: number; hp: number; maxHp: number; life: number; kind: TargetKind };
type ShooterState = { elapsed: number; score: number; combo: number; bestCombo: number; energy: number; ammo: number; reloading: number; targets: ShooterTarget[]; nextId: number; spawnTimer: number; bossDefeated: boolean };

interface Props {
  gameState: GameState;
  contractId?: string;
  onBack: () => void;
  onComplete: (result: { score: number; crystals: number; xp: number; won: boolean; variant: "arcade"; contractId: string }) => void;
}

const WIDTH = 920;
const HEIGHT = 520;
const MAGAZINE = 6;

const makeState = (): ShooterState => ({
  elapsed: 0,
  score: 0,
  combo: 0,
  bestCombo: 0,
  energy: 0,
  ammo: MAGAZINE,
  reloading: 0,
  targets: [],
  nextId: 1,
  spawnTimer: 0,
  bossDefeated: false,
});

export default function ArcadeShooter({ gameState, contractId, onBack, onComplete }: Props) {
  const contract = getArcadeContract(contractId);
  const pilot = getPilot(gameState.activePilot);
  const tool = getTool(gameState.activeTool);
  const puri = getPuriBonuses(gameState.modeRecords.puriBond);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [won, setWon] = useState(false);
  const [aim, setAim] = useState({ x: WIDTH / 2, y: HEIGHT / 2 });
  const stateRef = useRef<ShooterState>(makeState());
  const completedRef = useRef(false);
  const [frame, setFrame] = useState(() => ({ ...stateRef.current }));

  const objectiveText = contract.objective === "boss"
    ? "Break the Ahr core"
    : contract.objective === "energy"
      ? `Tag ${contract.target} crystal signals`
      : `Score ${contract.target.toLocaleString()} points`;

  const rewards = useMemo(() => ({
    crystals: Math.ceil((4 + Math.floor(frame.score / 450) + (won ? 8 : 0)) * puri.rewardMultiplier),
    xp: 4 + Math.floor(frame.score / 500) + (won ? 8 : 0),
  }), [frame.score, puri.rewardMultiplier, won]);

  const finish = useCallback((success: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    setRunning(false);
    setEnded(true);
    setWon(success);
    const current = stateRef.current;
    const crystals = Math.ceil((4 + Math.floor(current.score / 450) + (success ? 8 : 0)) * puri.rewardMultiplier);
    const xp = 4 + Math.floor(current.score / 500) + (success ? 8 : 0);
    onComplete({ score: current.score, crystals, xp, won: success, variant: "arcade", contractId: contract.id });
  }, [contract.id, onComplete, puri.rewardMultiplier]);

  const reset = useCallback(() => {
    const next = makeState();
    if (contract.objective === "boss") {
      next.targets.push({ id: next.nextId++, x: WIDTH * 0.72, y: HEIGHT * 0.44, vx: 78, vy: 56, size: 46, hp: 14, maxHp: 14, life: 999, kind: "boss" });
    }
    stateRef.current = next;
    completedRef.current = false;
    setFrame({ ...next, targets: [...next.targets] });
    setEnded(false);
    setWon(false);
    setPaused(false);
    setRunning(true);
  }, [contract.objective]);

  const reload = useCallback(() => {
    const state = stateRef.current;
    if (!running || paused || state.reloading > 0 || state.ammo === MAGAZINE) return;
    state.reloading = 1.05;
    setFrame({ ...state, targets: [...state.targets] });
  }, [paused, running]);

  const shootTarget = useCallback((targetId?: number) => {
    const state = stateRef.current;
    if (!running || paused || state.reloading > 0) return;
    if (state.ammo <= 0) { reload(); return; }
    state.ammo -= 1;
    const target = targetId === undefined ? null : state.targets.find((item) => item.id === targetId) ?? null;
    if (!target) {
      state.combo = 0;
    } else if (target.kind === "decoy") {
      state.score = Math.max(0, state.score - 75);
      state.combo = 0;
      state.targets = state.targets.filter((item) => item.id !== target.id);
    } else {
      target.hp -= 1;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      if (target.kind === "crystal") {
        state.energy += 1;
        state.score += 90 + Math.min(100, state.combo * 10);
        state.targets = state.targets.filter((item) => item.id !== target.id);
      } else if (target.hp <= 0) {
        state.score += target.kind === "boss" ? 1800 : 140 + Math.min(160, state.combo * 12);
        if (target.kind === "boss") state.bossDefeated = true;
        state.targets = state.targets.filter((item) => item.id !== target.id);
      } else {
        state.score += target.kind === "boss" ? 90 : 35;
      }
    }
    if (state.ammo <= 0) state.reloading = 1.05;
    setFrame({ ...state, targets: [...state.targets] });
  }, [paused, reload, running]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "r") reload();
      if (event.key === "Escape" && running) setPaused((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reload, running]);

  useEffect(() => {
    if (!running || paused) return;
    const timer = window.setInterval(() => {
      const state = stateRef.current;
      const dt = 0.033 * gameState.accessibility.combatSpeed;
      state.elapsed += dt;
      state.spawnTimer -= dt;
      state.reloading -= dt;
      if (state.reloading <= 0 && state.ammo === 0) state.ammo = MAGAZINE;

      for (const target of state.targets) {
        target.x += target.vx * dt;
        target.y += target.vy * dt;
        target.life -= dt;
        if (target.x < target.size || target.x > WIDTH - target.size) target.vx *= -1;
        if (target.y < target.size || target.y > HEIGHT - target.size) target.vy *= -1;
      }
      state.targets = state.targets.filter((target) => target.life > 0 || target.kind === "boss");

      if (state.spawnTimer <= 0) {
        const roll = Math.random();
        const kind: TargetKind = contract.objective === "energy"
          ? (roll < 0.68 ? "crystal" : roll < 0.86 ? "drone" : "decoy")
          : (roll < 0.78 ? "drone" : "decoy");
        const speed = kind === "crystal" ? 42 : 60 + state.elapsed * 0.5;
        state.targets.push({
          id: state.nextId++,
          x: 80 + Math.random() * (WIDTH - 160),
          y: 70 + Math.random() * (HEIGHT - 140),
          vx: (Math.random() > 0.5 ? 1 : -1) * speed,
          vy: (Math.random() > 0.5 ? 1 : -1) * speed * 0.7,
          size: kind === "crystal" ? 24 : 28,
          hp: 1,
          maxHp: 1,
          life: kind === "crystal" ? 3.8 : 3,
          kind,
        });
        state.spawnTimer = contract.objective === "score" ? 0.58 : 0.8;
      }

      const success = contract.objective === "boss"
        ? state.bossDefeated
        : contract.objective === "energy"
          ? state.energy >= contract.target
          : state.score >= contract.target;
      setFrame({ ...state, targets: [...state.targets] });
      if (success) finish(true);
      else if (state.elapsed >= contract.duration) finish(false);
    }, 33);
    return () => window.clearInterval(timer);
  }, [contract.duration, contract.objective, contract.target, finish, gameState.accessibility.combatSpeed, paused, running]);

  const updateAim = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setAim({ x: (event.clientX - bounds.left) / bounds.width * WIDTH, y: (event.clientY - bounds.top) / bounds.height * HEIGHT });
  };

  const progress = contract.objective === "boss"
    ? (frame.bossDefeated ? 1 : 0)
    : contract.objective === "energy"
      ? Math.min(1, frame.energy / contract.target)
      : Math.min(1, frame.score / contract.target);

  return (
    <main className="arcade-shooter relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-24 pt-28 lg:px-8">
      <header className="arcade-shooter__header">
        <button onClick={onBack}><ArrowLeft className="h-4 w-4" /> Assignments</button>
        <div><div className="command-kicker">Arcade Ops · Mouse aim challenge</div><h1>{contract.name}</h1><p>{objectiveText}. Move the reticle, click to fire, and press R to reload.</p></div>
        <div className="arcade-shooter__loadout"><span>{pilot.name}</span><strong>{tool.name}</strong></div>
      </header>

      <section className="arcade-mission-strip">
        <div><Target className="h-4 w-4" /><span>Objective<strong>{objectiveText}</strong></span></div>
        <div><Trophy className="h-4 w-4" /><span>Reward route<strong>4+ crystals · 4+ XP · clear bonus</strong></span></div>
        <div><Zap className="h-4 w-4" /><span>Skill<strong>Aim · timing · reload</strong></span></div>
      </section>

      <section className="arcade-shooter__hud">
        <div><span>Time</span><strong>{Math.max(0, Math.ceil(contract.duration - frame.elapsed))}s</strong></div>
        <div><span>Score</span><strong>{frame.score.toLocaleString()}</strong></div>
        <div><span>Combo</span><strong>x{frame.combo}</strong></div>
        <div><span>{contract.objective === "energy" ? "Signals" : "Ammo"}</span><strong>{contract.objective === "energy" ? `${frame.energy}/${contract.target}` : `${frame.ammo}/${MAGAZINE}`}</strong></div>
        <i><b style={{ width: `${progress * 100}%` }} /></i>
      </section>

      <div className="arcade-range-wrap">
        <div
          className="arcade-range"
          onPointerMove={updateAim}
          onPointerDown={() => shootTarget()}
          style={{ aspectRatio: `${WIDTH}/${HEIGHT}` }}
        >
          <div className="arcade-range__grid" />
          {frame.targets.map((target) => (
            <button
              key={target.id}
              className={`arcade-target is-${target.kind}`}
              style={{ left: `${target.x / WIDTH * 100}%`, top: `${target.y / HEIGHT * 100}%`, width: target.size * 2 + (gameState.accessibility.aimHelp === "wide" ? 14 : 0), height: target.size * 2 + (gameState.accessibility.aimHelp === "wide" ? 14 : 0) }}
              onPointerDown={(event) => { event.stopPropagation(); shootTarget(target.id); }}
              aria-label={target.kind === "decoy" ? "Do not shoot decoy" : `Shoot ${target.kind}`}
            >
              {target.kind === "boss" ? <img src="/assets/star-atlas/14NRqo/01-joao-lira-ahr.webp" alt="" /> : target.kind === "crystal" ? "◆" : target.kind === "decoy" ? "!" : ""}
              {target.kind === "boss" && <i><b style={{ width: `${target.hp / target.maxHp * 100}%` }} /></i>}
            </button>
          ))}
          <span className="arcade-reticle" style={{ left: `${aim.x / WIDTH * 100}%`, top: `${aim.y / HEIGHT * 100}%` }}><Crosshair /></span>

          {!running && !ended && (
            <div className="arcade-overlay">
              <MousePointer2 className="h-8 w-8 text-cosmic-orange" />
              <div className="command-kicker">Different from Swarm</div>
              <h2>You aim. You shoot.</h2>
              <p>Track moving targets with your mouse. Click to fire, avoid red decoys, and reload after six shots.</p>
              <button onClick={(event) => { event.stopPropagation(); reset(); }}><Play className="h-4 w-4" /> Start assignment</button>
            </div>
          )}
          {paused && <div className="arcade-overlay"><h2>Paused</h2><button onClick={(event) => { event.stopPropagation(); setPaused(false); }}><Play className="h-4 w-4" /> Resume</button></div>}
          {ended && (
            <div className="arcade-overlay">
              <Sparkles className="h-8 w-8 text-cosmic-yellow" />
              <div className="command-kicker">Assignment complete</div>
              <h2>{won ? "Target secured!" : "Extraction called"}</h2>
              <p>{frame.score.toLocaleString()} points · best combo x{frame.bestCombo} · +{rewards.crystals} crystals · +{rewards.xp} XP</p>
              <div className="arcade-overlay__actions">
                <button onClick={(event) => { event.stopPropagation(); reset(); }}><RotateCcw className="h-4 w-4" /> Play again</button>
                <button onClick={(event) => { event.stopPropagation(); onBack(); }}>Assignments</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="arcade-shooter__controls">
        <span>{frame.reloading > 0 ? `Reloading ${Math.ceil(frame.reloading * 10) / 10}s` : "Mouse · aim and fire"}</span>
        <button onClick={reload} disabled={!running || frame.reloading > 0 || frame.ammo === MAGAZINE}><RotateCcw className="h-4 w-4" /> R · Reload</button>
        <button onClick={() => setPaused((value) => !value)} disabled={!running}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{paused ? "Resume" : "Pause"}</button>
      </footer>
    </main>
  );
}
