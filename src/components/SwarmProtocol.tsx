import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Crosshair, Heart, Pause, Play, Sparkles, Zap } from "lucide-react";
import { GameState, getGameplayModifiers } from "@/lib/gameState";
import { getPilot, getTool } from "@/lib/loadouts";
import { getPuriBonuses } from "@/lib/puriBond";
import { useCombatInput } from "@/hooks/useCombatInput";
import { playImpactSound, pulseGamepad } from "@/lib/sounds";

type Point = { x: number; y: number };
type EnemyKind = "chaser" | "dasher" | "orbiter" | "boss";
type Enemy = Point & { id: number; hp: number; maxHp: number; speed: number; size: number; kind: EnemyKind; timer: number; phase: number };
type Shot = Point & { id: number; vx: number; vy: number; damage: number };
type Hazard = Point & { id: number; vx: number; vy: number; size: number; life: number };
type Drop = Point & { id: number; value: number };

interface Props {
  gameState: GameState;
  onBack: () => void;
  onOpenHangar: () => void;
  onComplete: (result: { score: number; crystals: number; xp: number; won: boolean; variant: "swarm" }) => void;
}

interface ArenaState {
  player: Point; hp: number; maxHp: number; enemies: Enemy[]; shots: Shot[]; hazards: Hazard[]; drops: Drop[];
  score: number; energy: number; level: number; elapsed: number; nextId: number; fireTimer: number; spawnTimer: number;
  invulnerable: number; pulseCooldown: number; bossSpawned: boolean; bossDefeated: boolean; bossWarning: number;
}

const WIDTH = 920;
const HEIGHT = 520;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const makeArena = (bonusHull = 0): ArenaState => ({
  player: { x: WIDTH / 2, y: HEIGHT / 2 }, hp: 100 + bonusHull, maxHp: 100 + bonusHull, enemies: [], shots: [], hazards: [], drops: [], score: 0,
  energy: 0, level: 1, elapsed: 0, nextId: 1, fireTimer: 0, spawnTimer: 0, invulnerable: 0, pulseCooldown: 0,
  bossSpawned: false, bossDefeated: false, bossWarning: 0,
});

export default function SwarmProtocol({ gameState, onBack, onOpenHangar, onComplete }: Props) {
  const pilot = getPilot(gameState.activePilot);
  const tool = getTool(gameState.activeTool);
  const modifiers = getGameplayModifiers(gameState);
  const puri = getPuriBonuses(gameState.modeRecords.puriBond);
  const duration = 60 + modifiers.missionTimeBonus;
  const bossTime = 42;
  const objectiveText = "Survive, build perks, then defeat Ahr";
  const aimBonus = gameState.accessibility.aimHelp === "wide" ? 9 : 0;
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [won, setWon] = useState(false);
  const [upgradeLevel, setUpgradeLevel] = useState<number | null>(null);
  const arena = useRef<ArenaState>(makeArena(20 + puri.combatHull));
  const completedRef = useRef(false);
  const [frame, setFrame] = useState(() => ({ ...arena.current }));
  const upgrades = useRef({ damage: 1, speed: 1, fireRate: 1, magnet: 1 });

  const reset = useCallback(() => {
    arena.current = makeArena(20 + puri.combatHull);
    upgrades.current = { damage: 1, speed: 1, fireRate: 1, magnet: 1 };
    completedRef.current = false;
    setFrame({ ...arena.current }); setEnded(false); setWon(false); setUpgradeLevel(null); setPaused(false); setRunning(true);
  }, [puri.combatHull]);

  const finish = useCallback((success: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    setRunning(false); setEnded(true); setWon(success);
    const state = arena.current;
    const crystals = Math.ceil(Math.max(3, Math.floor(state.score / 420) + (success ? 10 : 3)) * puri.rewardMultiplier);
    const xp = Math.max(3, Math.floor(state.elapsed / 6) + (success ? 12 : 3));
    onComplete({ score: state.score, crystals, xp, won: success, variant: "swarm" });
  }, [onComplete, puri.rewardMultiplier]);

  const activatePulse = useCallback(() => {
    const state = arena.current;
    if (!running || paused || state.pulseCooldown > 0) return;
    const radius = 150 + (gameState.accessibility.aimHelp === "wide" ? 25 : 0);
    state.enemies = state.enemies.map((enemy) => distance(enemy, state.player) < radius ? { ...enemy, hp: enemy.hp - 45 } : enemy);
    state.hazards = state.hazards.filter((hazard) => distance(hazard, state.player) >= radius);
    state.pulseCooldown = 9;
    playImpactSound();
  }, [gameState.accessibility.aimHelp, paused, running]);
  const combatInput = useCombatInput(activatePulse);
  const inputVector = combatInput.vector;

  useEffect(() => {
    if (!running || paused || upgradeLevel !== null) return;
    const tickMs = 33;
    const timer = window.setInterval(() => {
      const dt = tickMs / 1000 * gameState.accessibility.combatSpeed;
      const state = arena.current;
      state.elapsed += dt; state.fireTimer -= dt; state.spawnTimer -= dt; state.invulnerable -= dt; state.pulseCooldown -= dt; state.bossWarning -= dt;

      const { x: dx, y: dy } = inputVector.current;
      if (dx || dy) { const magnitude = Math.hypot(dx, dy); const speed = 185 * upgrades.current.speed; state.player.x = clamp(state.player.x + dx / magnitude * speed * dt, 20, WIDTH - 20); state.player.y = clamp(state.player.y + dy / magnitude * speed * dt, 20, HEIGHT - 20); }

      const spawnRate = Math.max(0.46, 1.18 - state.elapsed * 0.009);
      if (state.spawnTimer <= 0) {
        const edge = Math.floor(Math.random() * 4); let x = 0; let y = 0;
        if (edge === 0) { x = Math.random() * WIDTH; y = -20; } if (edge === 1) { x = WIDTH + 20; y = Math.random() * HEIGHT; }
        if (edge === 2) { x = Math.random() * WIDTH; y = HEIGHT + 20; } if (edge === 3) { x = -20; y = Math.random() * HEIGHT; }
        const roll = Math.random(); const kind: EnemyKind = state.elapsed > 16 && roll > 0.72 ? "orbiter" : state.elapsed > 8 && roll > 0.46 ? "dasher" : "chaser";
        const hp = (15 + Math.floor(state.elapsed / 15) * 4) * (kind === "orbiter" ? 1.35 : kind === "dasher" ? 0.8 : 1);
        state.enemies.push({ id: state.nextId++, x, y, hp, maxHp: hp, speed: kind === "dasher" ? 50 : kind === "orbiter" ? 42 : 36 + state.elapsed * 0.34, size: kind === "orbiter" ? 15 : 12, kind, timer: 1.8 + Math.random() * 1.5, phase: Math.random() * Math.PI * 2 });
        state.spawnTimer = spawnRate;
      }

      if (!state.bossSpawned && state.elapsed >= bossTime) { state.bossSpawned = true; state.enemies.push({ id: state.nextId++, x: WIDTH / 2, y: -55, hp: 440, maxHp: 440, speed: 24, size: 42, kind: "boss", timer: 4.5, phase: 0 }); }

      const target = state.enemies.reduce<Enemy | null>((best, enemy) => !best || distance(enemy, state.player) < distance(best, state.player) ? enemy : best, null);
      if (target && state.fireTimer <= 0) { const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x); state.shots.push({ id: state.nextId++, x: state.player.x, y: state.player.y, vx: Math.cos(angle) * 430, vy: Math.sin(angle) * 430, damage: 13 * upgrades.current.damage }); state.fireTimer = 0.58 / upgrades.current.fireRate; }
      state.shots.forEach((shot) => { shot.x += shot.vx * dt; shot.y += shot.vy * dt; });
      state.shots = state.shots.filter((shot) => shot.x > -30 && shot.x < WIDTH + 30 && shot.y > -30 && shot.y < HEIGHT + 30);

      state.enemies.forEach((enemy) => {
        enemy.timer -= dt; const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
        if (enemy.kind === "orbiter") { enemy.phase += dt * 1.7; enemy.x += (Math.cos(angle) * 0.45 + Math.cos(angle + Math.PI / 2) * Math.sin(enemy.phase)) * enemy.speed * dt; enemy.y += (Math.sin(angle) * 0.45 + Math.sin(angle + Math.PI / 2) * Math.sin(enemy.phase)) * enemy.speed * dt; }
        else { const dash = enemy.kind === "dasher" && enemy.timer < 0 ? 3.5 : 1; enemy.x += Math.cos(angle) * enemy.speed * dash * dt; enemy.y += Math.sin(angle) * enemy.speed * dash * dt; if (enemy.kind === "dasher" && enemy.timer < -0.35) enemy.timer = 2.3; }
        if (enemy.kind === "boss" && enemy.timer <= 0) { state.bossWarning = 0.8; enemy.timer = 4.5; window.setTimeout(() => { if (!arena.current.bossSpawned || arena.current.bossDefeated) return; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; arena.current.hazards.push({ id: arena.current.nextId++, x: enemy.x, y: enemy.y, vx: Math.cos(a) * 135, vy: Math.sin(a) * 135, size: 7, life: 4 }); } }, 800 / gameState.accessibility.combatSpeed); }
      });

      state.hazards.forEach((hazard) => { hazard.x += hazard.vx * dt; hazard.y += hazard.vy * dt; hazard.life -= dt; });
      state.hazards = state.hazards.filter((hazard) => hazard.life > 0 && hazard.x > -40 && hazard.x < WIDTH + 40 && hazard.y > -40 && hazard.y < HEIGHT + 40);
      const hitShots = new Set<number>(); state.enemies.forEach((enemy) => state.shots.forEach((shot) => { if (!hitShots.has(shot.id) && distance(enemy, shot) < enemy.size + 5 + aimBonus) { enemy.hp -= shot.damage; hitShots.add(shot.id); } })); state.shots = state.shots.filter((shot) => !hitShots.has(shot.id));
      const defeated = state.enemies.filter((enemy) => enemy.hp <= 0);
      defeated.forEach((enemy) => { state.score += enemy.kind === "boss" ? 2500 : enemy.kind === "orbiter" ? 130 : enemy.kind === "dasher" ? 110 : 80; if (enemy.kind === "boss") state.bossDefeated = true; const drops = enemy.kind === "boss" ? 10 : 1; for (let i = 0; i < drops; i++) state.drops.push({ id: state.nextId++, x: enemy.x + (Math.random() - 0.5) * 55, y: enemy.y + (Math.random() - 0.5) * 55, value: enemy.kind === "boss" ? 4 : 1 }); });
      state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);

      const enemyHit = state.enemies.some((enemy) => distance(enemy, state.player) < enemy.size + 14); const hazardHit = state.hazards.some((hazard) => distance(hazard, state.player) < hazard.size + 11);
      if (state.invulnerable <= 0 && (enemyHit || hazardHit)) { state.hp -= hazardHit ? 12 : 9; state.invulnerable = 0.95; }
      const magnetRadius = 55 * upgrades.current.magnet * puri.combatMagnet; state.drops.forEach((drop) => { const d = distance(drop, state.player); if (d < magnetRadius * 2 && d > 1) { drop.x += (state.player.x - drop.x) / d * 180 * dt; drop.y += (state.player.y - drop.y) / d * 180 * dt; } });
      const collected = state.drops.filter((drop) => distance(drop, state.player) < 22); collected.forEach((drop) => { state.energy += drop.value; state.score += drop.value * 15; }); const collectedIds = new Set(collected.map((drop) => drop.id)); state.drops = state.drops.filter((drop) => !collectedIds.has(drop.id));
      const thresholds = [0, 5, 13, 24, 38, 56]; const nextLevel = thresholds.reduce((level, threshold, index) => state.energy >= threshold ? index + 1 : level, 1); if (nextLevel > state.level) { state.level = nextLevel; setUpgradeLevel(nextLevel); }
      setFrame({ ...state, enemies: [...state.enemies], shots: [...state.shots], hazards: [...state.hazards], drops: [...state.drops], player: { ...state.player } });
      const success = state.bossDefeated;
      if (state.hp <= 0) finish(false); else if (success) finish(true); else if (state.elapsed >= duration) finish(false);
    }, tickMs);
    return () => window.clearInterval(timer);
  }, [aimBonus, bossTime, duration, finish, gameState.accessibility.combatSpeed, inputVector, paused, puri.combatMagnet, running, upgradeLevel]);

  const chooseUpgrade = (kind: "damage" | "speed" | "fireRate" | "magnet" | "repair") => {
    if (kind === "repair") arena.current.hp = Math.min(arena.current.maxHp, arena.current.hp + 32);
    else upgrades.current[kind] *= kind === "damage" ? 1.3 : kind === "fireRate" ? 1.2 : 1.22;
    setUpgradeLevel(null);
    pulseGamepad(70, 0.3);
  };
  const boss = frame.enemies.find((enemy) => enemy.kind === "boss");
  const resultReward = useMemo(() => ({ crystals: Math.ceil(Math.max(3, Math.floor(frame.score / 420) + (won ? 10 : 3)) * puri.rewardMultiplier), xp: Math.max(3, Math.floor(frame.elapsed / 6) + (won ? 12 : 3)) }), [frame.elapsed, frame.score, puri.rewardMultiplier, won]);
  const bossStatus = frame.bossSpawned ? "Boss active" : `Boss in ${Math.max(0, Math.ceil(bossTime - frame.elapsed))}s`;

  const nextPerkAt = [5, 13, 24, 38, 56].find((threshold) => threshold > frame.energy);

  return <main className={`combat-mode relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8 ${gameState.accessibility.effects === "reduced" ? "effects-reduced" : ""}`}>
    <header className="combat-header"><button onClick={onBack}><ArrowLeft className="h-4 w-4" /> Modes</button><div><span>Swarm Protocol · Survival</span><strong>AHR INCURSION</strong></div><div className="combat-header__loadout"><span>{pilot.name}</span><span>{tool.name}</span></div></header>
    <div className="combat-objective"><Crosshair className="h-4 w-4" /><span>Mission objective</span><strong>{objectiveText}</strong>{puri.combatHull > 0 && <small>PURI shield +{puri.combatHull} hull</small>}{aimBonus > 0 && <small>Wide aim active</small>}</div>
    <section className="swarm-purpose"><span><Sparkles className="h-4 w-4" /> Collect energy to pause and choose run perks.</span><span><Zap className="h-4 w-4" /> Every run earns crystals, XP, and PURI bond—even on extraction.</span><button onClick={onOpenHangar}>Permanent upgrades · Crew Hangar</button></section>
    <section className="combat-hud"><div><Heart className="h-4 w-4" /><span>Hull</span><strong>{Math.max(0, Math.ceil(frame.hp))}</strong><i><b style={{ width: `${Math.max(0, Math.min(100, frame.hp / frame.maxHp * 100))}%` }} /></i></div><div><Sparkles className="h-4 w-4" /><span>Perk level</span><strong>{frame.level}</strong><small>{nextPerkAt ? `${frame.energy}/${nextPerkAt} to next perk` : "All perks reached"}</small></div><div><Crosshair className="h-4 w-4" /><span>Score</span><strong>{frame.score.toLocaleString()}</strong><small>{frame.enemies.length} contacts</small></div><div><Zap className="h-4 w-4" /><span>Time</span><strong>{Math.max(0, Math.ceil(duration - frame.elapsed))}s</strong><small>{bossStatus}</small></div></section>
    <div className="combat-arena-wrap"><div className={`combat-arena ${frame.invulnerable > 0 ? "is-hit" : ""} ${frame.bossWarning > 0 ? "boss-warning" : ""}`} style={{ aspectRatio: `${WIDTH}/${HEIGHT}` }}><div className="combat-grid" />
      {frame.drops.map((drop) => <span key={drop.id} className="combat-drop" style={{ left: `${drop.x / WIDTH * 100}%`, top: `${drop.y / HEIGHT * 100}%` }}>◆</span>)}
      {frame.shots.map((shot) => <span key={shot.id} className="combat-shot" style={{ left: `${shot.x / WIDTH * 100}%`, top: `${shot.y / HEIGHT * 100}%` }} />)}
      {frame.hazards.map((hazard) => <span key={hazard.id} className="combat-hazard" style={{ left: `${hazard.x / WIDTH * 100}%`, top: `${hazard.y / HEIGHT * 100}%` }} />)}
      {frame.enemies.map((enemy) => <span key={enemy.id} className={`combat-enemy is-${enemy.kind} ${enemy.kind === "dasher" && enemy.timer < 0.35 && enemy.timer >= 0 ? "is-telegraph" : ""}`} style={{ left: `${enemy.x / WIDTH * 100}%`, top: `${enemy.y / HEIGHT * 100}%`, width: enemy.size * 2, height: enemy.size * 2 }}>{enemy.kind === "boss" ? <img src="/assets/galia-cute-tech/ahr-boss-v2.png" alt="Ahr boss" /> : <b>{enemy.kind === "dasher" ? "›" : enemy.kind === "orbiter" ? "◎" : ""}</b>}{enemy.kind === "boss" && <i><b style={{ width: `${enemy.hp / enemy.maxHp * 100}%` }} /></i>}</span>)}
      <span className="combat-player" style={{ left: `${frame.player.x / WIDTH * 100}%`, top: `${frame.player.y / HEIGHT * 100}%` }}><img src={pilot.image} alt="" /></span>
      {!running && !ended && <div className="combat-overlay"><div className="command-kicker">60-second survival build</div><h1>Swarm Protocol</h1><p>Your weapon fires automatically. Move with WASD or arrows, collect enemy energy, and choose a perk whenever the action pauses. Space activates a safety pulse.</p><div className="swarm-start-summary"><span><strong>1</strong>Dodge & collect</span><span><strong>2</strong>Choose perks</span><span><strong>3</strong>Defeat Ahr</span></div><small>Guaranteed: crystals + XP + PURI bond · Clear adds a larger bonus</small><button onClick={reset}><Play className="h-4 w-4" /> Begin easier run</button></div>}
      {upgradeLevel !== null && <div className="combat-overlay"><div className="command-kicker">Perk level {upgradeLevel}</div><h2>Choose your build</h2><p>The run is paused. Pick one perk, then the swarm resumes.</p><div className="combat-upgrades"><button onClick={() => chooseUpgrade("damage")}>Power<strong>+30% damage</strong></button><button onClick={() => chooseUpgrade("fireRate")}>Rapid<strong>+20% fire rate</strong></button><button onClick={() => chooseUpgrade("speed")}>Boost<strong>+22% speed</strong></button><button onClick={() => chooseUpgrade("magnet")}>Magnet<strong>+22% pickup range</strong></button><button onClick={() => chooseUpgrade("repair")}>Repair<strong>Restore 32 hull</strong></button></div></div>}
      {ended && <div className="combat-overlay"><div className="command-kicker">Run rewards banked</div><h2>{won ? "Ahr defeated!" : "Safe extraction"}</h2><p>Score {frame.score.toLocaleString()} · +{resultReward.crystals} crystals · +{resultReward.xp} XP · PURI bond +{won ? 3 : 1}</p><small>Spend crystals in Crew Hangar for permanent upgrades. Run perks reset each game.</small><div className="combat-actions"><button onClick={reset}><Play className="h-4 w-4" /> Run again</button><button onClick={onOpenHangar}>Upgrade crew</button><button onClick={onBack}>Return to modes</button></div></div>}
    </div></div>
    <div className="combat-touch" aria-label="Movement controls"><button {...combatInput.directionHandlers("up")} aria-label="Move up">▲</button><button {...combatInput.directionHandlers("left")} aria-label="Move left">◀</button><button {...combatInput.directionHandlers("down")} aria-label="Move down">▼</button><button {...combatInput.directionHandlers("right")} aria-label="Move right">▶</button></div>
    <footer className="combat-controls"><span>{combatInput.source === "controller" ? "Controller connected · Left stick moves" : combatInput.source === "touch" ? "Touch controls active" : "WASD / arrows · Move"}</span><button onClick={activatePulse} disabled={!running || paused || frame.pulseCooldown > 0}>Space / A · Pulse {frame.pulseCooldown > 0 ? `${Math.ceil(frame.pulseCooldown)}s` : "Ready"}</button><button onClick={() => setPaused((value) => !value)} disabled={!running}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{paused ? "Resume" : "Pause"}</button></footer>
    {boss && <div className="boss-banner">AHR · {Math.ceil(boss.hp)} integrity{frame.bossWarning > 0 ? " · ATTACK INCOMING" : ""}</div>}
  </main>;
}
