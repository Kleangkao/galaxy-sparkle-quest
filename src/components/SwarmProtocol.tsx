import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Crosshair, Heart, Pause, Play, Sparkles, Zap } from "lucide-react";
import { GameState, getGameplayModifiers } from "@/lib/gameState";
import { getPilot, getTool, getToolModeSummary } from "@/lib/loadouts";
import { getPuriBonuses } from "@/lib/puriBond";
import { useCombatInput } from "@/hooks/useCombatInput";
import { playBossWarningSound, playEnemyBreakSound, playFailSound, playImpactSound, playPerkSound, playPickupSound, playVictorySound, pulseGamepad } from "@/lib/sounds";
import { getSwarmRunVariant, getSwarmSpawnDelay, hasMeaningfulSwarmParticipation, SWARM_BALANCE, SWARM_PARTICIPATION } from "@/lib/swarmBalance";
import { useI18n } from "@/lib/i18n";
import ModeStartOverlay from "@/components/ModeStartOverlay";

type Point = { x: number; y: number };
type EnemyKind = "chaser" | "dasher" | "orbiter" | "elite" | "boss";
type Enemy = Point & { id: number; hp: number; maxHp: number; speed: number; size: number; kind: EnemyKind; timer: number; phase: number };
type Shot = Point & { id: number; vx: number; vy: number; damage: number };
type Hazard = Point & { id: number; vx: number; vy: number; size: number; life: number };
type Drop = Point & { id: number; value: number };

interface Props {
  gameState: GameState;
  suspended?: boolean;
  onActiveChange?: (active: boolean) => void;
  onBack: () => void;
  onComplete: (result: { score: number; crystals: number; xp: number; won: boolean; variant: "swarm"; evolutions: number; participated: boolean }) => void;
}

interface ArenaState {
  player: Point; hp: number; maxHp: number; enemies: Enemy[]; shots: Shot[]; hazards: Hazard[]; drops: Drop[];
  score: number; energy: number; level: number; elapsed: number; movementDistance: number; nextId: number; fireTimer: number; spawnTimer: number;
  invulnerable: number; pulseCooldown: number; bossSpawned: boolean; bossDefeated: boolean; bossWarning: number; bossIntro: number;
  bossAttackTimer: number; bossAttackPhaseTwo: boolean; bossAttackPending: boolean;
}

const WIDTH = 920;
const HEIGHT = 520;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const makeArena = (bonusHull = 0): ArenaState => ({
  player: { x: WIDTH / 2, y: HEIGHT / 2 }, hp: 100 + bonusHull, maxHp: 100 + bonusHull, enemies: [], shots: [], hazards: [], drops: [], score: 0,
  energy: 0, level: 1, elapsed: 0, movementDistance: 0, nextId: 1, fireTimer: 0, spawnTimer: 0, invulnerable: 0, pulseCooldown: 0,
  bossSpawned: false, bossDefeated: false, bossWarning: 0, bossIntro: 0,
  bossAttackTimer: 0, bossAttackPhaseTwo: false, bossAttackPending: false,
});

export default function SwarmProtocol({ gameState, suspended = false, onActiveChange, onBack, onComplete }: Props) {
  const { lang, tr } = useI18n();
  const pilot = getPilot(gameState.activePilot);
  const tool = getTool(gameState.activeTool);
  const modifiers = getGameplayModifiers(gameState);
  const puri = getPuriBonuses(gameState.modeRecords.puriBond);
  const duration = SWARM_BALANCE.duration + modifiers.missionTimeBonus;
  const bossTime = SWARM_BALANCE.bossTime;
  const runVariant = getSwarmRunVariant(gameState.modeRecords.swarmRuns);
  const objectiveText = tr(`Build perks and defeat Ahr · ${runVariant.name}`, `เลือกพลังและกำจัด Ahr · ${runVariant.nameTh}`);
  const aimBonus = gameState.accessibility.aimHelp === "wide" ? 9 : 0;
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [won, setWon] = useState(false);
  const [upgradeLevel, setUpgradeLevel] = useState<number | null>(null);
  const startingHullBonus = 20 + puri.combatHull + modifiers.combatHullBonus;
  const arena = useRef<ArenaState>(makeArena(startingHullBonus));
  const completedRef = useRef(false);
  const [frame, setFrame] = useState(() => ({ ...arena.current }));
  const lastTickRef = useRef(0);
  const upgrades = useRef({ damage: 1, speed: 1, fireRate: 1, magnet: 1, pulseCooldown: 1, repairCount: 0, overdrive: false, phaseDrive: false, guardianCore: false });
  const effectivePaused = paused || suspended;

  useEffect(() => {
    onActiveChange?.(running);
    return () => onActiveChange?.(false);
  }, [onActiveChange, running]);

  const reset = useCallback(() => {
    arena.current = makeArena(startingHullBonus);
    upgrades.current = { damage: 1, speed: 1, fireRate: 1, magnet: 1, pulseCooldown: 1, repairCount: 0, overdrive: false, phaseDrive: false, guardianCore: false };
    completedRef.current = false;
    setFrame({ ...arena.current }); setEnded(false); setWon(false); setUpgradeLevel(null); setPaused(false); setRunning(true);
  }, [startingHullBonus]);

  const finish = useCallback((success: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    setRunning(false); setEnded(true); setWon(success);
    if (success) playVictorySound(); else playFailSound();
    const state = arena.current;
    const participated = hasMeaningfulSwarmParticipation({
      won: success,
      movementDistance: state.movementDistance,
      energy: state.energy,
      perkLevel: state.level,
    });
    const crystals = participated ? Math.ceil(Math.max(3, Math.floor(state.score / 420) + (success ? 10 : 3)) * puri.rewardMultiplier * modifiers.crystalMultiplier) : 0;
    const xp = participated ? Math.max(3, Math.floor(state.elapsed / 6) + (success ? 12 : 3)) : 0;
    const evolutions = [upgrades.current.overdrive, upgrades.current.phaseDrive, upgrades.current.guardianCore].filter(Boolean).length;
    onComplete({ score: state.score, crystals, xp, won: success, variant: "swarm", evolutions, participated });
  }, [modifiers.crystalMultiplier, onComplete, puri.rewardMultiplier]);

  const activatePulse = useCallback(() => {
    const state = arena.current;
    if (!running || effectivePaused || state.pulseCooldown > 0) return;
    const radius = 150 + (gameState.accessibility.aimHelp === "wide" ? 25 : 0);
    state.enemies = state.enemies.map((enemy) => distance(enemy, state.player) < radius ? { ...enemy, hp: enemy.hp - 45 } : enemy);
    state.hazards = state.hazards.filter((hazard) => distance(hazard, state.player) >= radius);
    state.pulseCooldown = 9 * upgrades.current.pulseCooldown;
    playImpactSound();
  }, [gameState.accessibility.aimHelp, effectivePaused, running]);
  const combatInput = useCombatInput(activatePulse);
  const inputVector = combatInput.vector;

  useEffect(() => {
    if (!running || effectivePaused || upgradeLevel !== null) return;
    const tickMs = 33;
    lastTickRef.current = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const wallDelta = Math.min(0.1, Math.max(0, (now - lastTickRef.current) / 1000));
      lastTickRef.current = now;
      const dt = wallDelta * gameState.accessibility.combatSpeed;
      const state = arena.current;
      state.elapsed += dt; state.fireTimer -= dt; state.spawnTimer -= dt; state.invulnerable -= dt; state.pulseCooldown -= dt; state.bossWarning -= dt; state.bossIntro -= dt; state.bossAttackTimer -= dt;

      const { x: dx, y: dy } = inputVector.current;
      if (dx || dy) {
        const magnitude = Math.hypot(dx, dy);
        const speed = 185 * upgrades.current.speed;
        const previousX = state.player.x;
        const previousY = state.player.y;
        state.player.x = clamp(state.player.x + dx / magnitude * speed * dt, 20, WIDTH - 20);
        state.player.y = clamp(state.player.y + dy / magnitude * speed * dt, 20, HEIGHT - 20);
        state.movementDistance += Math.hypot(state.player.x - previousX, state.player.y - previousY);
      }

      const spawnRate = getSwarmSpawnDelay(state.elapsed, state.bossSpawned) * runVariant.spawnDelayMultiplier;
      if (state.spawnTimer <= 0) {
        const edge = Math.floor(Math.random() * 4); let x = 0; let y = 0;
        if (edge === 0) { x = Math.random() * WIDTH; y = -20; } if (edge === 1) { x = WIDTH + 20; y = Math.random() * HEIGHT; }
        if (edge === 2) { x = Math.random() * WIDTH; y = HEIGHT + 20; } if (edge === 3) { x = -20; y = Math.random() * HEIGHT; }
        const roll = Math.random();
        const eliteUnlocked = gameState.modeRecords.swarmRuns >= 2 && state.elapsed > 20;
        const kind: EnemyKind = eliteUnlocked && roll > 0.93 ? "elite" : state.elapsed > 16 && roll > 0.72 ? "orbiter" : state.elapsed > 8 && roll > 0.46 ? "dasher" : "chaser";
        const kindHp = kind === "elite" ? 2.2 : kind === "orbiter" ? 1.35 : kind === "dasher" ? 0.8 : 1;
        const hp = (15 + Math.floor(state.elapsed / 15) * 4) * kindHp * runVariant.enemyHpMultiplier;
        const speed = kind === "elite" ? 34 : kind === "dasher" ? 50 : kind === "orbiter" ? 42 : 36 + state.elapsed * 0.34;
        state.enemies.push({ id: state.nextId++, x, y, hp, maxHp: hp, speed, size: kind === "elite" ? 18 : kind === "orbiter" ? 15 : 12, kind, timer: 1.8 + Math.random() * 1.5, phase: Math.random() * Math.PI * 2 });
        state.spawnTimer = spawnRate;
      }

      if (!state.bossSpawned && state.elapsed >= bossTime) {
        state.bossSpawned = true;
        state.bossIntro = 1.8;
        state.enemies.push({ id: state.nextId++, x: WIDTH / 2, y: -55, hp: SWARM_BALANCE.bossHp, maxHp: SWARM_BALANCE.bossHp, speed: SWARM_BALANCE.bossSpeed, size: 42, kind: "boss", timer: SWARM_BALANCE.bossAttackCooldown, phase: 0 });
        playBossWarningSound();
      }

      const target = state.enemies.reduce<Enemy | null>((best, enemy) => !best || distance(enemy, state.player) < distance(best, state.player) ? enemy : best, null);
      if (target && state.fireTimer <= 0) { const angle = Math.atan2(target.y - state.player.y, target.x - state.player.x); state.shots.push({ id: state.nextId++, x: state.player.x, y: state.player.y, vx: Math.cos(angle) * 430, vy: Math.sin(angle) * 430, damage: 13 * upgrades.current.damage * modifiers.combatDamage * puri.combatDamageMultiplier }); state.fireTimer = 0.58 / (upgrades.current.fireRate * modifiers.combatFireRate); }
      state.shots.forEach((shot) => { shot.x += shot.vx * dt; shot.y += shot.vy * dt; });
      state.shots = state.shots.filter((shot) => shot.x > -30 && shot.x < WIDTH + 30 && shot.y > -30 && shot.y < HEIGHT + 30);

      state.enemies.forEach((enemy) => {
        enemy.timer -= dt; const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
        if (enemy.kind === "orbiter") { enemy.phase += dt * 1.7; enemy.x += (Math.cos(angle) * 0.45 + Math.cos(angle + Math.PI / 2) * Math.sin(enemy.phase)) * enemy.speed * dt; enemy.y += (Math.sin(angle) * 0.45 + Math.sin(angle + Math.PI / 2) * Math.sin(enemy.phase)) * enemy.speed * dt; }
        else { const dash = enemy.kind === "dasher" && enemy.timer < 0 ? 3.5 : 1; enemy.x += Math.cos(angle) * enemy.speed * dash * dt; enemy.y += Math.sin(angle) * enemy.speed * dash * dt; if (enemy.kind === "dasher" && enemy.timer < -0.35) enemy.timer = 2.3; }
        if (enemy.kind === "boss" && enemy.timer <= 0 && state.bossAttackTimer <= 0) {
          const phaseTwo = enemy.hp <= enemy.maxHp * 0.5;
          state.bossWarning = SWARM_BALANCE.bossTelegraphSeconds;
          state.bossAttackTimer = SWARM_BALANCE.bossTelegraphSeconds;
          state.bossAttackPhaseTwo = phaseTwo;
          state.bossAttackPending = true;
          enemy.timer = SWARM_BALANCE.bossAttackCooldown * (phaseTwo ? 0.78 : 1);
          playBossWarningSound();
        }
      });

      if (state.bossAttackTimer <= 0 && state.bossAttackPending) {
        const bossEnemy = state.enemies.find((enemy) => enemy.kind === "boss");
        state.bossAttackPending = false;
        state.bossWarning = 0;
        if (bossEnemy && !state.bossDefeated) {
          const phaseTwo = state.bossAttackPhaseTwo;
          const projectileCount = runVariant.bossPattern === "aimed-fan" ? (phaseTwo ? 11 : 7) : SWARM_BALANCE.bossProjectileCount + (phaseTwo ? 4 : 0);
          const aimedAngle = Math.atan2(state.player.y - bossEnemy.y, state.player.x - bossEnemy.x);
          for (let i = 0; i < projectileCount; i++) {
            const alternatingSpiral = phaseTwo && Math.floor(bossEnemy.phase) % 2 ? Math.PI / projectileCount : 0;
            const fanOffset = projectileCount <= 1 ? 0 : (i / (projectileCount - 1) - 0.5) * Math.PI * 0.9;
            const angle = runVariant.bossPattern === "aimed-fan"
              ? aimedAngle + fanOffset
              : i / projectileCount * Math.PI * 2 + alternatingSpiral;
            state.hazards.push({ id: state.nextId++, x: bossEnemy.x, y: bossEnemy.y, vx: Math.cos(angle) * SWARM_BALANCE.bossProjectileSpeed, vy: Math.sin(angle) * SWARM_BALANCE.bossProjectileSpeed, size: phaseTwo ? 8 : 7, life: 4 });
          }
          bossEnemy.phase += 1;
        }
      }

      state.hazards.forEach((hazard) => { hazard.x += hazard.vx * dt; hazard.y += hazard.vy * dt; hazard.life -= dt; });
      state.hazards = state.hazards.filter((hazard) => hazard.life > 0 && hazard.x > -40 && hazard.x < WIDTH + 40 && hazard.y > -40 && hazard.y < HEIGHT + 40);
      const hitShots = new Set<number>(); state.enemies.forEach((enemy) => state.shots.forEach((shot) => { if (!hitShots.has(shot.id) && distance(enemy, shot) < enemy.size + 5 + aimBonus) { enemy.hp -= shot.damage; hitShots.add(shot.id); } })); state.shots = state.shots.filter((shot) => !hitShots.has(shot.id));
      const defeated = state.enemies.filter((enemy) => enemy.hp <= 0);
      defeated.forEach((enemy) => {
        const baseScore = enemy.kind === "boss" ? 2500 : enemy.kind === "elite" ? 260 : enemy.kind === "orbiter" ? 130 : enemy.kind === "dasher" ? 110 : 80;
        state.score += Math.round(baseScore * runVariant.scoreMultiplier);
        if (enemy.kind === "boss") state.bossDefeated = true;
        const extraDrop = enemy.kind !== "boss" && Math.random() < runVariant.dropMultiplier - 1 ? 1 : 0;
        const drops = enemy.kind === "boss" ? 10 : enemy.kind === "elite" ? 3 : 1 + extraDrop;
        for (let i = 0; i < drops; i++) state.drops.push({ id: state.nextId++, x: enemy.x + (Math.random() - 0.5) * 55, y: enemy.y + (Math.random() - 0.5) * 55, value: enemy.kind === "boss" ? 4 : 1 });
      });
      if (defeated.length > 0) playEnemyBreakSound();
      state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);

      const enemyHit = state.enemies.some((enemy) => distance(enemy, state.player) < enemy.size + 14); const hazardHit = state.hazards.some((hazard) => distance(hazard, state.player) < hazard.size + 11);
      if (state.invulnerable <= 0 && (enemyHit || hazardHit)) { state.hp -= hazardHit ? 10 : 9; state.invulnerable = 0.95; playImpactSound(); }
      const magnetRadius = 55 * upgrades.current.magnet * puri.combatMagnet; state.drops.forEach((drop) => { const d = distance(drop, state.player); if (d < magnetRadius * 2 && d > 1) { drop.x += (state.player.x - drop.x) / d * 180 * dt; drop.y += (state.player.y - drop.y) / d * 180 * dt; } });
      const collected = state.drops.filter((drop) => distance(drop, state.player) < 22); collected.forEach((drop) => { state.energy += drop.value; state.score += drop.value * 15; }); const collectedIds = new Set(collected.map((drop) => drop.id)); state.drops = state.drops.filter((drop) => !collectedIds.has(drop.id));
      if (collected.length > 0) playPickupSound();
      const thresholds = [0, 5, 13, 24, 38, 56]; const nextLevel = thresholds.reduce((level, threshold, index) => state.energy >= threshold ? index + 1 : level, 1); if (nextLevel > state.level) { state.level = nextLevel; setUpgradeLevel(nextLevel); }
      setFrame({ ...state, enemies: [...state.enemies], shots: [...state.shots], hazards: [...state.hazards], drops: [...state.drops], player: { ...state.player } });
      const success = state.bossDefeated;
      if (state.hp <= 0) finish(false); else if (success) finish(true); else if (state.elapsed >= duration) finish(false);
    }, tickMs);
    return () => window.clearInterval(timer);
  }, [aimBonus, bossTime, duration, effectivePaused, finish, gameState.accessibility.combatSpeed, gameState.modeRecords.swarmRuns, inputVector, modifiers.combatDamage, modifiers.combatFireRate, puri.combatDamageMultiplier, puri.combatMagnet, runVariant.bossPattern, runVariant.dropMultiplier, runVariant.enemyHpMultiplier, runVariant.scoreMultiplier, runVariant.spawnDelayMultiplier, running, upgradeLevel]);

  const chooseUpgrade = (kind: "damage" | "speed" | "fireRate" | "magnet" | "pulse" | "repair") => {
    if (kind === "repair") { arena.current.hp = Math.min(arena.current.maxHp, arena.current.hp + 32); upgrades.current.repairCount += 1; }
    else if (kind === "pulse") upgrades.current.pulseCooldown *= 0.82;
    else upgrades.current[kind] *= kind === "damage" ? 1.3 : kind === "fireRate" ? 1.2 : 1.22;
    if (!upgrades.current.overdrive && upgrades.current.damage > 1 && upgrades.current.fireRate > 1) {
      upgrades.current.overdrive = true;
      upgrades.current.damage *= 1.08;
      upgrades.current.fireRate *= 1.08;
    }
    if (!upgrades.current.phaseDrive && upgrades.current.speed > 1 && upgrades.current.magnet > 1) {
      upgrades.current.phaseDrive = true; upgrades.current.speed *= 1.08; upgrades.current.magnet *= 1.18;
    }
    if (!upgrades.current.guardianCore && upgrades.current.pulseCooldown < 1 && upgrades.current.repairCount > 0) {
      upgrades.current.guardianCore = true; arena.current.maxHp += 12; arena.current.hp = Math.min(arena.current.maxHp, arena.current.hp + 12);
    }
    setUpgradeLevel(null);
    playPerkSound();
    pulseGamepad(70, 0.3);
  };
  const boss = frame.enemies.find((enemy) => enemy.kind === "boss");
  const bossStatus = frame.bossSpawned ? tr("Boss active", "บอสมาแล้ว") : tr(`Boss in ${Math.max(0, Math.ceil(bossTime - frame.elapsed))}s`, `บอสมาใน ${Math.max(0, Math.ceil(bossTime - frame.elapsed))} วิ`);

  const nextPerkAt = [5, 13, 24, 38, 56].find((threshold) => threshold > frame.energy);
  const perkChoices = [
    {
      kind: "damage" as const,
      name: tr("Heavy Shots", "กระสุนหนัก"),
      effect: tr("Damage +30%", "โจมตีแรงขึ้น 30%"),
      pair: tr("Pair with Rapid Fire → Overdrive", "จับคู่กับ ยิงถี่ → โอเวอร์ไดรฟ์"),
    },
    {
      kind: "fireRate" as const,
      name: tr("Rapid Fire", "ยิงถี่"),
      effect: tr("Fire 20% faster", "ยิงเร็วขึ้น 20%"),
      pair: tr("Pair with Heavy Shots → Overdrive", "จับคู่กับ กระสุนหนัก → โอเวอร์ไดรฟ์"),
    },
    {
      kind: "speed" as const,
      name: tr("Thrusters", "เครื่องยนต์เร่ง"),
      effect: tr("Move 22% faster", "เคลื่อนที่เร็วขึ้น 22%"),
      pair: tr("Pair with Energy Pull → Phase Drive", "จับคู่กับ แรงดูดพลัง → เฟสไดรฟ์"),
    },
    {
      kind: "magnet" as const,
      name: tr("Energy Pull", "แรงดูดพลัง"),
      effect: tr("Pickup radius +22%", "ระยะเก็บพลังเพิ่ม 22%"),
      pair: tr("Pair with Thrusters → Phase Drive", "จับคู่กับ เครื่องยนต์เร่ง → เฟสไดรฟ์"),
    },
    {
      kind: "pulse" as const,
      name: tr("Pulse Recharge", "ชาร์จคลื่นไว"),
      effect: tr("Pulse cooldown 9s → 7.4s", "รอใช้คลื่นจาก 9 วิ เหลือ 7.4 วิ"),
      pair: tr("Pair with Field Repair → Guardian Core", "จับคู่กับ ซ่อมฉุกเฉิน → แกนพิทักษ์"),
    },
    {
      kind: "repair" as const,
      name: tr("Field Repair", "ซ่อมฉุกเฉิน"),
      effect: tr("Recover 32 hull now", "ฟื้นพลังยาน 32 หน่วยทันที"),
      pair: tr("Pair with Pulse Recharge → Guardian Core", "จับคู่กับ ชาร์จคลื่นไว → แกนพิทักษ์"),
    },
  ];

  return <main className={`combat-mode relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8 ${running || ended ? "is-active" : ""} ${gameState.accessibility.effects === "reduced" ? "effects-reduced" : ""}`}>
    <h1 className="sr-only">{tr("Swarm Protocol survival mission", "ภารกิจฝ่าฝูงศัตรู")}</h1>
    <header className="combat-header"><button onClick={onBack}><ArrowLeft className="h-4 w-4" /> {tr("Modes", "โหมด")}</button><div><span>{tr("Swarm Protocol · Survival", "ฝ่าฝูงศัตรู · เอาตัวรอด")}</span><strong>AHR INCURSION</strong></div><div className="combat-header__loadout"><span>{pilot.name}</span><span>{tool.name}</span></div></header>
    <div className="combat-objective"><Crosshair className="h-4 w-4" /><span>{tr("Mission objective", "เป้าหมายภารกิจ")}</span><strong>{objectiveText}</strong><small>{tool.name}: {getToolModeSummary(tool, "swarm", lang)}</small>{startingHullBonus > 20 && <small>{tr(`Total loadout hull +${startingHullBonus}`, `พลังยานจากชุด +${startingHullBonus}`)}</small>}{aimBonus > 0 && <small>{tr("Wide aim active", "เปิดช่วยเล็งแบบกว้าง")}</small>}</div>
    <section className="combat-hud"><div><Heart className="h-4 w-4" /><span>{tr("Hull", "พลังยาน")}</span><strong>{Math.max(0, Math.ceil(frame.hp))}</strong><i><b style={{ width: `${Math.max(0, Math.min(100, frame.hp / frame.maxHp * 100))}%` }} /></i></div><div><Sparkles className="h-4 w-4" /><span>{tr("Perk level", "ระดับพลัง")}</span><strong>{frame.level}</strong><small>{nextPerkAt ? tr(`${frame.energy}/${nextPerkAt} to next perk`, `${frame.energy}/${nextPerkAt} ถึงพลังถัดไป`) : tr("All perks reached", "ได้พลังครบแล้ว")}</small></div><div><Crosshair className="h-4 w-4" /><span>{tr("Score", "คะแนน")}</span><strong>{frame.score.toLocaleString()}</strong><small>{tr(`${frame.enemies.length} contacts`, `ศัตรู ${frame.enemies.length} ตัว`)}</small></div><div><Zap className="h-4 w-4" /><span>{tr("Time", "เวลา")}</span><strong>{Math.max(0, Math.ceil(duration - frame.elapsed))}{lang === "th" ? " วิ" : "s"}</strong><small>{bossStatus}</small></div></section>
    <div className="combat-arena-wrap"><div className={`combat-arena ${frame.invulnerable > 0 ? "is-hit" : ""} ${frame.bossWarning > 0 ? "boss-warning" : ""} ${frame.bossIntro > 0 ? "boss-arrival" : ""}`} style={{ aspectRatio: `${WIDTH}/${HEIGHT}` }}><div className="combat-grid" />
      {frame.bossWarning > 0 && <div className="boss-message is-warning">{tr("AHR WAVE INCOMING", "คลื่นโจมตี AHR กำลังมา")}</div>}
      {frame.bossIntro > 0 && <div className="boss-message is-arrival">{tr("AHR CORE ENTERING · FOCUS FIRE", "แกน AHR เข้าสนาม · ยิงที่บอส")}</div>}
      {frame.drops.map((drop) => <span key={drop.id} className="combat-drop" style={{ left: `${drop.x / WIDTH * 100}%`, top: `${drop.y / HEIGHT * 100}%` }}>◆</span>)}
      {frame.shots.map((shot) => <span key={shot.id} className="combat-shot" style={{ left: `${shot.x / WIDTH * 100}%`, top: `${shot.y / HEIGHT * 100}%` }} />)}
      {frame.hazards.map((hazard) => <span key={hazard.id} className="combat-hazard" style={{ left: `${hazard.x / WIDTH * 100}%`, top: `${hazard.y / HEIGHT * 100}%` }} />)}
      {frame.enemies.map((enemy) => <span key={enemy.id} className={`combat-enemy is-${enemy.kind} ${enemy.kind === "dasher" && enemy.timer < 0.35 && enemy.timer >= 0 ? "is-telegraph" : ""} ${enemy.kind === "boss" && frame.bossWarning > 0 ? "is-casting" : ""}`} style={{ left: `${enemy.x / WIDTH * 100}%`, top: `${enemy.y / HEIGHT * 100}%`, width: enemy.size * 2, height: enemy.size * 2 }}>{enemy.kind === "boss" ? <img src="/assets/galia-current/ahr-boss-master-v3.webp" alt="Ahr boss" /> : <b>{enemy.kind === "dasher" ? "›" : enemy.kind === "orbiter" ? "◎" : enemy.kind === "elite" ? "◆" : ""}</b>}{enemy.kind === "boss" && <i><b style={{ width: `${enemy.hp / enemy.maxHp * 100}%` }} /></i>}</span>)}
      <span className="combat-player" style={{ left: `${frame.player.x / WIDTH * 100}%`, top: `${frame.player.y / HEIGHT * 100}%` }}><img src={pilot.image} alt="" /></span>
      {!running && !ended && (
        <ModeStartOverlay
          mode="swarm"
          icon={<Sparkles className="h-7 w-7" />}
          kicker={tr(`${duration}-second survival · ${runVariant.name}`, `เอาตัวรอด ${duration} วินาที · ${runVariant.nameTh}`)}
          title={tr("Swarm Protocol", "ฝ่าฝูงศัตรู")}
          summary={objectiveText}
          steps={[
            tr("Move and collect energy", "ขยับหลบและเก็บพลัง"),
            tr("Choose a perk when the action pauses", "เลือกพลังเมื่อเกมหยุด"),
            tr("Defeat Ahr before time runs out", "กำจัด Ahr ก่อนหมดเวลา"),
          ]}
          note={tr(`Space / controller A · Shock Pulse deals 45 damage and clears nearby hazards. Rewards count after active movement or ${SWARM_PARTICIPATION.energyCollected} energy.`, `Space / ปุ่ม A บนจอย · คลื่นกระแทก ทำดาเมจ 45 และลบลูกพลังอันตรายรอบตัว รอบจะนับเมื่อขยับจริงจังหรือเก็บพลัง ${SWARM_PARTICIPATION.energyCollected} ชิ้น`)}
          primaryLabel={tr("Begin run", "เริ่มเล่น")}
          onStart={reset}
        />
      )}
      {upgradeLevel !== null && <div className="combat-overlay"><div className="command-kicker">{tr(`Perk level ${upgradeLevel}`, `ความสามารถระดับ ${upgradeLevel}`)}</div><h2>{tr("Choose one upgrade", "เลือกอัปเกรด 1 อย่าง")}</h2><p>{tr("Green text is the immediate effect. The smaller line shows which second perk creates an evolution.", "ตัวหนังสือสีเขียวคือผลที่ได้ทันที บรรทัดเล็กบอกว่าต้องจับคู่กับอะไรเพื่อปลดพลังผสม")}</p><div className="combat-upgrades">{perkChoices.map((perk) => <button key={perk.kind} onClick={() => chooseUpgrade(perk.kind)}><span>{perk.name}</span><strong>{perk.effect}</strong><small>{perk.pair}</small></button>)}</div></div>}
      {ended && <div className="combat-run-finished" aria-hidden="true">{won ? tr("AHR CORE CLEARED", "ทำลายแกน AHR แล้ว") : tr("RUN COMPLETE", "จบรอบแล้ว")}</div>}
    </div></div>
    <div className="combat-touch" aria-label={tr("Movement controls", "ปุ่มเคลื่อนที่")}><button {...combatInput.directionHandlers("up")} aria-label={tr("Move up", "ขึ้น")}>▲</button><button {...combatInput.directionHandlers("left")} aria-label={tr("Move left", "ซ้าย")}>◀</button><button {...combatInput.directionHandlers("down")} aria-label={tr("Move down", "ลง")}>▼</button><button {...combatInput.directionHandlers("right")} aria-label={tr("Move right", "ขวา")}>▶</button></div>
    <footer className="combat-controls"><span>{combatInput.source === "controller" ? tr("Controller connected · Left stick moves", "เชื่อมต่อจอยแล้ว · ใช้อนาล็อกซ้าย") : combatInput.source === "touch" ? tr("Touch controls active", "ใช้ปุ่มสัมผัสอยู่") : tr("WASD / arrows · Move", "WASD / ปุ่มลูกศร · เคลื่อนที่")}</span><button className="combat-pulse-control" onClick={activatePulse} disabled={!running || effectivePaused || frame.pulseCooldown > 0} title={tr("45 damage and clears nearby hazard shots", "ทำดาเมจ 45 และลบลูกพลังอันตรายรอบตัว")}><strong>Space / A · {tr("Shock Pulse", "คลื่นกระแทก")}</strong><small>{frame.pulseCooldown > 0 ? tr(`Ready in ${Math.ceil(frame.pulseCooldown)}s`, `พร้อมอีกครั้งใน ${Math.ceil(frame.pulseCooldown)} วิ`) : tr("45 damage · clears nearby hazards", "ดาเมจ 45 · ลบลูกพลังรอบตัว")}</small></button><button onClick={() => setPaused((value) => !value)} disabled={!running || suspended}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{paused ? tr("Resume", "เล่นต่อ") : tr("Pause", "หยุด")}</button></footer>
    {boss && <div className="boss-banner">AHR · {tr(runVariant.bossPattern === "aimed-fan" ? "FAN BURST" : "NOVA RING", runVariant.bossPattern === "aimed-fan" ? "ยิงพัดกว้าง" : "คลื่นวงแหวน")} · {tr(`${Math.ceil(boss.hp)} integrity`, `พลัง ${Math.ceil(boss.hp)}`)}{boss.hp <= boss.maxHp * 0.5 ? tr(" · PHASE 2", " · ช่วงที่ 2") : ""}{frame.bossWarning > 0 ? tr(" · ATTACK INCOMING", " · กำลังโจมตี") : ""}</div>}
  </main>;
}
