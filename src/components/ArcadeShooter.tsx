import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Crosshair, MousePointer2, Pause, Play, RotateCcw } from "lucide-react";
import { GameState, getGameplayModifiers } from "@/lib/gameState";
import { getArcadeContract, getArcadeRunOutcome } from "@/lib/arcadeContracts";
import { getPilot, getTool } from "@/lib/loadouts";
import { getPuriBonuses } from "@/lib/puriBond";
import { playEnemyBreakSound, playFailSound, playImpactSound, playLaserSound, playPickupSound, playReloadSound, playVictorySound, pulseGamepad } from "@/lib/sounds";
import { useI18n } from "@/lib/i18n";
import ModeStartOverlay from "@/components/ModeStartOverlay";

type TargetKind = "drone" | "crystal" | "decoy" | "boss";
type ShooterTarget = { id: number; x: number; y: number; vx: number; vy: number; size: number; hp: number; maxHp: number; life: number; kind: TargetKind };
type ShooterState = { elapsed: number; score: number; combo: number; bestCombo: number; shotsFired: number; hits: number; energy: number; ammo: number; reloading: number; targets: ShooterTarget[]; nextId: number; spawnTimer: number; bossDefeated: boolean };
type ShotFeedback = { id: number; x: number; y: number; text: string; tone: "hit" | "miss" | "bonus" | "danger" };

interface Props {
  gameState: GameState;
  contractId?: string;
  suspended?: boolean;
  onActiveChange?: (active: boolean) => void;
  onBack: () => void;
  onComplete: (result: { score: number; crystals: number; xp: number; won: boolean; variant: "arcade"; contractId: string; accuracy: number; grade: string; participated: boolean }) => void;
}

const WIDTH = 920;
const HEIGHT = 520;
const BASE_MAGAZINE = 6;

const makeState = (magazine = BASE_MAGAZINE): ShooterState => ({
  elapsed: 0,
  score: 0,
  combo: 0,
  bestCombo: 0,
  shotsFired: 0,
  hits: 0,
  energy: 0,
  ammo: magazine,
  reloading: 0,
  targets: [],
  nextId: 1,
  spawnTimer: 0,
  bossDefeated: false,
});

export default function ArcadeShooter({ gameState, contractId, suspended = false, onActiveChange, onBack, onComplete }: Props) {
  const { lang, tr } = useI18n();
  const contract = getArcadeContract(contractId);
  const pilot = getPilot(gameState.activePilot);
  const tool = getTool(gameState.activeTool);
  const modifiers = getGameplayModifiers(gameState);
  const puri = getPuriBonuses(gameState.modeRecords.puriBond);
  const magazine = BASE_MAGAZINE + modifiers.arcadeMagazineBonus;
  const reloadDuration = 1.05 * modifiers.arcadeReloadMultiplier * puri.arcadeReloadMultiplier;
  const duration = contract.duration + modifiers.missionTimeBonus;
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [won, setWon] = useState(false);
  const aimRef = useRef({ x: WIDTH / 2, y: HEIGHT / 2 });
  const reticleRef = useRef<HTMLSpanElement>(null);
  const aimFrameRef = useRef<number | null>(null);
  const pendingReticleRef = useRef({ x: 0, y: 0 });
  const [shotFeedback, setShotFeedback] = useState<ShotFeedback[]>([]);
  const feedbackId = useRef(0);
  const stateRef = useRef<ShooterState>(makeState(magazine));
  const completedRef = useRef(false);
  const [frame, setFrame] = useState(() => ({ ...stateRef.current }));
  const lastTickRef = useRef(0);
  const effectivePaused = paused || suspended;

  useEffect(() => {
    onActiveChange?.(running);
    return () => onActiveChange?.(false);
  }, [onActiveChange, running]);

  const objectiveText = contract.objective === "boss"
    ? tr("Break the Ahr core", "ทำลายแกนพลัง Ahr")
    : contract.objective === "energy"
      ? tr(`Tag ${contract.target} crystal signals`, `ยิงสัญญาณคริสตัล ${contract.target} จุด`)
      : tr(`Score ${contract.target.toLocaleString()} points`, `ทำคะแนน ${contract.target.toLocaleString()}`);

  const finish = useCallback((success: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    setRunning(false);
    setEnded(true);
    setWon(success);
    if (success) playVictorySound(); else playFailSound();
    const current = stateRef.current;
    const outcome = getArcadeRunOutcome({
      score: current.score,
      shotsFired: current.shotsFired,
      hits: current.hits,
      bestCombo: current.bestCombo,
      cleared: success,
      rewardMultiplier: puri.rewardMultiplier,
      crystalMultiplier: modifiers.crystalMultiplier,
    });
    onComplete({
      score: current.score,
      crystals: outcome.crystals,
      xp: outcome.xp,
      won: success,
      variant: "arcade",
      contractId: contract.id,
      accuracy: outcome.accuracy,
      grade: outcome.grade,
      participated: outcome.participated,
    });
  }, [contract.id, modifiers.crystalMultiplier, onComplete, puri.rewardMultiplier]);

  const reset = useCallback(() => {
    const next = makeState(magazine);
    if (contract.objective === "boss") {
      next.targets.push({ id: next.nextId++, x: WIDTH * 0.72, y: HEIGHT * 0.44, vx: 78, vy: 56, size: 46, hp: 14, maxHp: 14, life: 999, kind: "boss" });
    }
    stateRef.current = next;
    completedRef.current = false;
    setFrame({ ...next, targets: [...next.targets] });
    setEnded(false);
    setWon(false);
    setPaused(false);
    setShotFeedback([]);
    setRunning(true);
  }, [contract.objective, magazine]);

  const reload = useCallback(() => {
    const state = stateRef.current;
    if (!running || effectivePaused || state.reloading > 0 || state.ammo === magazine) return;
    state.reloading = reloadDuration;
    playReloadSound();
    setFrame({ ...state, targets: [...state.targets] });
  }, [effectivePaused, magazine, reloadDuration, running]);

  const shootTarget = useCallback((targetId?: number) => {
    const state = stateRef.current;
    if (!running || effectivePaused || state.reloading > 0) return;
    if (state.ammo <= 0) { reload(); return; }
    state.ammo -= 1;
    state.shotsFired += 1;
    playLaserSound();
    const target = targetId === undefined ? null : state.targets.find((item) => item.id === targetId) ?? null;
    const addFeedback = (x: number, y: number, text: string, tone: ShotFeedback["tone"]) => {
      const id = ++feedbackId.current;
      setShotFeedback((current) => [...current.slice(-5), { id, x, y, text, tone }]);
      window.setTimeout(() => setShotFeedback((current) => current.filter((item) => item.id !== id)), 520);
    };
    if (!target) {
      state.combo = 0;
      addFeedback(aimRef.current.x, aimRef.current.y, tr("MISS", "พลาด"), "miss");
    } else if (target.kind === "decoy") {
      state.score = Math.max(0, state.score - 75);
      state.combo = 0;
      state.targets = state.targets.filter((item) => item.id !== target.id);
      pulseGamepad(80, 0.35);
      addFeedback(target.x, target.y, tr("-75 DECOY", "-75 เป้าหลอก"), "danger");
    } else {
      state.hits += 1;
      playImpactSound();
      const weakPointHit = target.kind === "boss" && (state.combo + 1) % 4 === 0;
      target.hp -= modifiers.combatDamage * puri.combatDamageMultiplier * (weakPointHit ? 2 : 1);
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      if (target.kind === "crystal") {
        playPickupSound();
        state.energy += 1;
        state.score += 90 + Math.min(100, state.combo * 10);
        state.targets = state.targets.filter((item) => item.id !== target.id);
        addFeedback(target.x, target.y, tr(`SIGNAL +${state.combo}`, `สัญญาณ +${state.combo}`), "bonus");
      } else if (target.hp <= 0) {
        playEnemyBreakSound();
        state.score += target.kind === "boss" ? 1800 : 140 + Math.min(160, state.combo * 12);
        if (target.kind === "boss") state.bossDefeated = true;
        state.targets = state.targets.filter((item) => item.id !== target.id);
        addFeedback(target.x, target.y, target.kind === "boss" ? tr("CORE BROKEN", "ทำลายแกนแล้ว") : tr(`BREAK x${state.combo}`, `ทำลาย x${state.combo}`), "bonus");
      } else {
        state.score += target.kind === "boss" ? 90 : 35;
        addFeedback(target.x, target.y, weakPointHit ? tr("WEAK POINT x2", "จุดอ่อน x2") : target.kind === "boss" ? tr(`CORE ${Math.max(0, Math.ceil(target.hp))}`, `แกน ${Math.max(0, Math.ceil(target.hp))}`) : tr(`HIT x${state.combo}`, `โดน x${state.combo}`), weakPointHit ? "bonus" : "hit");
      }
    }
    if (state.ammo <= 0) state.reloading = reloadDuration;
    setFrame({ ...state, targets: [...state.targets] });
  }, [effectivePaused, modifiers.combatDamage, puri.combatDamageMultiplier, reload, reloadDuration, running, tr]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "r") reload();
      if (event.key === "Escape" && running && !suspended) setPaused((value) => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reload, running, suspended]);

  useEffect(() => {
    if (!running || effectivePaused) return;
    lastTickRef.current = performance.now();
    const timer = window.setInterval(() => {
      const state = stateRef.current;
      const now = performance.now();
      const wallDelta = Math.min(0.1, Math.max(0, (now - lastTickRef.current) / 1000));
      lastTickRef.current = now;
      const dt = wallDelta * gameState.accessibility.combatSpeed;
      state.elapsed += dt;
      state.spawnTimer -= dt;
      state.reloading -= dt;
      if (state.reloading <= 0 && state.ammo === 0) state.ammo = magazine;

      for (const target of state.targets) {
        if (target.kind === "boss") {
          // Ahr follows a deliberate figure-eight attack path. The previous
          // edge-bounce made the whole body look like a loose pendulum.
          target.x = WIDTH * 0.62 + Math.sin(state.elapsed * 0.92) * WIDTH * 0.24;
          target.y = HEIGHT * 0.46 + Math.sin(state.elapsed * 1.84) * HEIGHT * 0.16;
        } else {
          target.x += target.vx * dt;
          target.y += target.vy * dt;
        }
        target.life -= dt;
        if (target.kind !== "boss") {
          if (target.x < target.size || target.x > WIDTH - target.size) target.vx *= -1;
          if (target.y < target.size || target.y > HEIGHT - target.size) target.vy *= -1;
        }
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
        const baseSpawnDelay = contract.objective === "score" ? 0.72 : 0.9;
        state.spawnTimer = baseSpawnDelay / contract.spawnMultiplier;
      }

      const success = contract.objective === "boss"
        ? state.bossDefeated
        : contract.objective === "energy"
          ? state.energy >= contract.target
          : state.score >= contract.target;
      setFrame({ ...state, targets: [...state.targets] });
      if (success) finish(true);
      else if (state.elapsed >= duration) finish(false);
    }, 33);
    return () => window.clearInterval(timer);
  }, [contract.objective, contract.spawnMultiplier, contract.target, duration, effectivePaused, finish, gameState.accessibility.combatSpeed, magazine, running]);

  useEffect(() => () => {
    if (aimFrameRef.current !== null) cancelAnimationFrame(aimFrameRef.current);
  }, []);

  const updateAim = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const localX = Math.max(0, Math.min(bounds.width, event.clientX - bounds.left));
    const localY = Math.max(0, Math.min(bounds.height, event.clientY - bounds.top));
    aimRef.current = {
      x: bounds.width > 0 ? localX / bounds.width * WIDTH : WIDTH / 2,
      y: bounds.height > 0 ? localY / bounds.height * HEIGHT : HEIGHT / 2,
    };
    pendingReticleRef.current = { x: localX, y: localY };
    if (aimFrameRef.current !== null) return;
    aimFrameRef.current = requestAnimationFrame(() => {
      aimFrameRef.current = null;
      const reticle = reticleRef.current;
      if (!reticle) return;
      const next = pendingReticleRef.current;
      reticle.style.transform = `translate3d(${next.x}px, ${next.y}px, 0) translate(-50%, -50%)`;
    });
  };

  const fireAtPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    updateAim(event);
    shootTarget();
  };

  const progress = contract.objective === "boss"
    ? (frame.bossDefeated ? 1 : 0)
    : contract.objective === "energy"
      ? Math.min(1, frame.energy / contract.target)
      : Math.min(1, frame.score / contract.target);
  const isReloading = frame.reloading > 0;
  const reloadProgress = isReloading ? Math.max(0, Math.min(1, 1 - frame.reloading / reloadDuration)) : 1;
  const reloadSeconds = Math.max(0.1, Math.ceil(frame.reloading * 10) / 10);

  return (
    <main className={`arcade-shooter relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-24 pt-28 lg:px-8 ${running || ended ? "is-active" : ""} ${gameState.accessibility.effects === "reduced" ? "effects-reduced" : ""}`}>
      <header className="arcade-shooter__header">
        <button onClick={onBack}><ArrowLeft className="h-4 w-4" /> {tr("Assignments", "เลือกภารกิจ")}</button>
        <div><div className="command-kicker">{tr("Arcade Ops · Mouse or touch aim", "ยิงเป้า · ใช้เมาส์หรือแตะจอ")}</div><h1>{contract.name}</h1><p>{objectiveText}</p></div>
        <div className="arcade-shooter__loadout"><span>{pilot.name}</span><strong>{tool.name}</strong></div>
      </header>

      <section className="arcade-shooter__hud">
        <div><span>{tr("Time", "เวลา")}</span><strong>{Math.max(0, Math.ceil(duration - frame.elapsed))}{lang === "th" ? " วิ" : "s"}</strong></div>
        <div><span>{tr("Score", "คะแนน")}</span><strong>{frame.score.toLocaleString()}</strong></div>
        <div><span>{tr("Accuracy", "ความแม่น")}</span><strong>{frame.shotsFired ? `${Math.round(frame.hits / frame.shotsFired * 100)}%` : "—"}</strong></div>
        <div className={isReloading ? "arcade-ammo-card is-reloading" : "arcade-ammo-card"}>
          <span>{tr("Ammo", "กระสุน")}</span>
          <strong>{frame.ammo}/{magazine}</strong>
          {contract.objective === "energy" && <small>{tr("Signals", "สัญญาณ")} {frame.energy}/{contract.target}</small>}
        </div>
        <i><b style={{ width: `${progress * 100}%` }} /></i>
      </section>

      <div className="arcade-range-wrap">
        <div
          className="arcade-range"
          onPointerMove={updateAim}
          onPointerDown={fireAtPointer}
          style={{ aspectRatio: `${WIDTH}/${HEIGHT}` }}
        >
          <div className="arcade-range__grid" />
          {isReloading && running && !effectivePaused && (
            <div className="arcade-reload-banner" role="status" aria-live="assertive">
              <RotateCcw className="h-5 w-5" />
              <div>
                <strong>{tr("RELOADING", "กำลังเติมกระสุน")}</strong>
                <span>{reloadSeconds}{lang === "th" ? " วิ" : "s"}</span>
                <i><b style={{ width: `${reloadProgress * 100}%` }} /></i>
              </div>
            </div>
          )}
          {frame.targets.map((target) => (
            <button
              key={target.id}
              className={`arcade-target is-${target.kind}`}
              style={{ left: `${target.x / WIDTH * 100}%`, top: `${target.y / HEIGHT * 100}%`, width: target.size * 2 + (gameState.accessibility.aimHelp === "wide" ? 14 : 0), height: target.size * 2 + (gameState.accessibility.aimHelp === "wide" ? 14 : 0) }}
              onPointerDown={(event) => { event.stopPropagation(); shootTarget(target.id); }}
              aria-label={target.kind === "decoy" ? tr("Do not shoot decoy", "ห้ามยิงเป้าหลอก") : tr(`Shoot ${target.kind}`, "ยิงเป้าหมาย")}
            >
              {target.kind === "boss" ? <><img src="/assets/galia-current/ahr-boss-master-v3.webp" alt="" /><span className="arcade-target__weakpoint" /></> : target.kind === "crystal" ? "◆" : target.kind === "decoy" ? "!" : ""}
              {target.kind === "boss" && <i><b style={{ width: `${target.hp / target.maxHp * 100}%` }} /></i>}
            </button>
          ))}
          {shotFeedback.map((feedback) => <span key={feedback.id} className={`arcade-hit-feedback is-${feedback.tone}`} style={{ left: `${feedback.x / WIDTH * 100}%`, top: `${feedback.y / HEIGHT * 100}%` }}>{feedback.text}</span>)}
          <span ref={reticleRef} className={`arcade-reticle ${isReloading ? "is-reloading" : ""}`}><Crosshair /></span>

          {!running && !ended && (
            <ModeStartOverlay
              mode="arcade"
              icon={<MousePointer2 className="h-7 w-7" />}
              kicker={tr("Manual shooting challenge", "ภารกิจยิงด้วยตัวเอง")}
              title={tr("You aim. You shoot.", "คุณเป็นคนเล็งและยิง")}
              summary={objectiveText}
              steps={[
                tr("Aim with the mouse or tap a target to fire", "เล็งด้วยเมาส์หรือแตะเป้าหมายเพื่อยิง"),
                tr("Avoid red decoys", "อย่ายิงเป้าหลอกสีแดง"),
                tr("Press R when the magazine is empty", "กด R เมื่อกระสุนหมด"),
              ]}
              note={tr(`Your current magazine holds ${magazine} rounds. A run counts after 3 shots and at least one hit.`, `แม็กกาซีนตอนนี้มี ${magazine} นัด รอบจะนับเมื่อยิงอย่างน้อย 3 นัดและโดนเป้า 1 ครั้ง`)}
              primaryLabel={tr("Start assignment", "เริ่มภารกิจ")}
              onStart={reset}
            />
          )}
          {paused && !suspended && <div className="arcade-overlay"><h2>{tr("Paused", "หยุดชั่วคราว")}</h2><button onClick={(event) => { event.stopPropagation(); setPaused(false); }}><Play className="h-4 w-4" /> {tr("Resume", "เล่นต่อ")}</button></div>}
          {ended && <div className="combat-run-finished" aria-hidden="true">{won ? tr("CONTRACT CLEARED", "ผ่านภารกิจแล้ว") : tr("ASSIGNMENT COMPLETE", "จบภารกิจแล้ว")}</div>}
        </div>
      </div>

      <footer className="arcade-shooter__controls">
        <span className={isReloading ? "is-reloading" : ""}>{isReloading ? tr(`RELOADING · ${reloadSeconds}s`, `กำลังเติมกระสุน · ${reloadSeconds} วิ`) : tr("Mouse or touch · aim and fire", "เมาส์หรือแตะจอ · เล็งและยิง")}</span>
        <button onClick={reload} disabled={!running || effectivePaused || frame.reloading > 0 || frame.ammo === magazine}><RotateCcw className="h-4 w-4" /> R · {tr("Reload", "เติมกระสุน")}</button>
        <button onClick={() => setPaused((value) => !value)} disabled={!running || suspended}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{paused ? tr("Resume", "เล่นต่อ") : tr("Pause", "หยุด")}</button>
      </footer>
    </main>
  );
}
