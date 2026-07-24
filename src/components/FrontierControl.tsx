import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, Flag, Gamepad2, Gift, Lightbulb, Radio, ShieldPlus, Sparkles, Waves } from "lucide-react";
import {
  FACTIONS,
  FactionId,
  GameState,
  INFLUENCE_TO_CAPTURE,
  PLANETS,
  getFaction,
  getPlanetController,
  getSectorLore,
  simulateRivalInfluence,
  getGameplayModifiers,
} from "@/lib/gameState";
import { getPuriBonuses } from "@/lib/puriBond";
import { SECTOR_TRAITS, StrategyAction, getStrategyActionValues, getStrategyObjective, isStrategyObjectiveComplete } from "@/lib/strategyMissions";
import { useI18n } from "@/lib/i18n";

interface Props {
  gameState: GameState;
  onBack: () => void;
  onComplete: (result: { captures: number; objectiveComplete: boolean; influence: GameState["influence"] }) => void;
}

const LEADERS = {
  mud: "/assets/galia-current/mud-leader-charon-master-v2.webp",
  oni: "/assets/galia-plush-tech/canonical/oni-leader-master-v1.jpg",
  ustur: "/assets/galia-plush-tech/canonical/ustur-leader-master-v1.jpg",
};

const cloneInfluence = (influence: GameState["influence"]): GameState["influence"] => Object.fromEntries(
  Object.entries(influence).map(([planetId, values]) => [planetId, { ...values }]),
);

export default function FrontierControl({ gameState, onBack, onComplete }: Props) {
  const { tr } = useI18n();
  const puri = getPuriBonuses(gameState.modeRecords.puriBond);
  const modifiers = getGameplayModifiers(gameState);
  const startingActions = 4 + puri.strategyActions;
  const [cycle] = useState(gameState.modeRecords.strategyCycles);
  const [objective] = useState(() => getStrategyObjective(cycle));
  const [selectedId, setSelectedId] = useState(objective.targetPlanetId);
  const [actions, setActions] = useState(startingActions);
  const [touched, setTouched] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [showHint, setShowHint] = useState(cycle < 2);
  const [claimed, setClaimed] = useState(false);
  const [workingInfluence, setWorkingInfluence] = useState<GameState["influence"]>(() => cloneInfluence(gameState.influence));
  const [startControlled] = useState(() => Object.values(gameState.influence).filter((inf) => getPlanetController(inf) === gameState.faction).length);

  const selected = PLANETS.find((planet) => planet.id === selectedId) ?? PLANETS[0];
  const lore = getSectorLore(selected.id);
  const trait = SECTOR_TRAITS[selected.id];
  const values = getStrategyActionValues(selected.id);
  const inf = workingInfluence[selected.id];
  const controller = getPlanetController(inf);
  const playerFaction = gameState.faction ?? "mud";
  const faction = getFaction(playerFaction)!;
  const controlledNow = Object.values(workingInfluence).filter((sector) => getPlanetController(sector) === playerFaction).length;
  const captures = Math.max(0, controlledNow - startControlled);
  const previewState = { ...gameState, influence: workingInfluence };
  const objectiveComplete = isStrategyObjectiveComplete(objective, previewState, startControlled, touched);
  const baseReward = 6 + captures * 5 + (objectiveComplete ? 5 : 0);
  const crystalReward = Math.ceil(baseReward * puri.rewardMultiplier * modifiers.crystalMultiplier);
  const xpReward = 6 + (objectiveComplete ? 4 : 0);
  const sortedInfluence = useMemo(() => FACTIONS.map((item) => ({ ...item, value: inf[item.id] })).sort((a, b) => b.value - a.value), [inf]);
  const turn = startingActions - actions + 1;
  const objectiveName = objective.id === "secure" ? tr("Secure a sector", "ยึดพื้นที่ 1 แห่ง")
    : objective.id === "survey" ? tr("Map three sectors", "สำรวจ 3 พื้นที่")
      : objective.id === "focus" ? tr(objective.name, `เพิ่มคะแนนใน ${getSectorLore(objective.targetPlanetId).name}`)
        : tr(objective.name, `หยุดคู่แข่งที่ ${getSectorLore(objective.targetPlanetId).name}`);
  const objectiveDescription = objective.id === "secure" ? tr(objective.description, "เพิ่มคะแนนพื้นที่ว่างหรือพื้นที่คู่แข่งให้ถึง 100")
    : objective.id === "survey" ? tr(objective.description, "ใช้คำสั่งในพื้นที่ต่างกันให้ครบ 3 แห่ง")
      : objective.id === "focus" ? tr(objective.description, "เพิ่มคะแนนฝ่ายเราในพื้นที่ที่มีกรอบสีเหลืองให้ถึง 65")
        : tr(objective.description, "เพิ่มคะแนนฝ่ายเราให้ถึง 50 และกดคู่แข่งทุกฝ่ายให้ต่ำกว่า 40");

  const act = (action: StrategyAction) => {
    if (!started || actions <= 0 || claimed) return;
    const planet = PLANETS.find((candidate) => candidate.id === selected.id);
    if (!planet) return;
    setWorkingInfluence((currentInfluence) => {
      const current = currentInfluence[selected.id] || { mud: 0, oni: 0, ustur: 0 };
      let next = { ...current };
      if (action === "disrupt") {
        const rival = (["mud", "oni", "ustur"] as FactionId[]).filter((id) => id !== playerFaction).sort((a, b) => next[b] - next[a])[0];
        next[rival] = Math.max(0, next[rival] - values.disrupt);
        next[playerFaction] = Math.min(INFLUENCE_TO_CAPTURE, next[playerFaction] + 8);
      } else {
        next[playerFaction] = Math.min(INFLUENCE_TO_CAPTURE, next[playerFaction] + values[action]);
        if (action === "reinforce") {
          next = simulateRivalInfluence(next, playerFaction, planet);
          if (values.rivalPressure > 1) {
            const rival = (["mud", "oni", "ustur"] as FactionId[]).filter((id) => id !== playerFaction).sort((a, b) => next[b] - next[a])[0];
            next[rival] = Math.min(INFLUENCE_TO_CAPTURE - 1, next[rival] + 5);
          }
        }
      }
      return { ...currentInfluence, [selected.id]: next };
    });
    setTouched((current) => current.includes(selected.id) ? current : [...current, selected.id]);
    const label = action === "scan" ? `Deployed relay at ${lore.name} (+${values.scan})` : action === "reinforce" ? `Reinforced ${lore.name} (+${values.reinforce})` : `Disrupted rival at ${lore.name}`;
    setHistory((current) => [label, ...current].slice(0, 4));
    setActions((value) => value - 1);
  };

  const claim = () => {
    if (claimed || actions > 0) return;
    setClaimed(true);
    onComplete({ captures, objectiveComplete, influence: workingInfluence });
  };

  const recommendedAction: StrategyAction = objective.id === "survey" ? "scan" : inf[playerFaction] < 65 ? "reinforce" : "disrupt";
  const recommendedLabel = recommendedAction === "scan" ? tr("Deploy a safe signal relay", "วางเครื่องส่งสัญญาณแบบปลอดภัย") : recommendedAction === "reinforce" ? tr("Reinforce this sector", "เพิ่มกำลังในพื้นที่นี้") : tr("Disrupt the leading rival", "ขัดขวางฝ่ายคู่แข่งที่นำอยู่");
  const leadingRival = sortedInfluence.find((item) => item.id !== playerFaction);
  const opponentPlan = actions > 0 && leadingRival
    ? `${leadingRival.name} ${trait.trait === "volatile" ? tr("will push hard here", "จะเพิ่มกำลังในพื้นที่นี้") : tr("is watching this sector", "กำลังจับตาพื้นที่นี้")}`
    : tr("No rival move remains this cycle", "รอบนี้ฝ่ายคู่แข่งจะไม่ขยับแล้ว");

  if (!started) {
    return (
      <main className="strategy-mode strategy-intro relative z-10 mx-auto min-h-screen max-w-5xl px-5 pb-28 pt-28 lg:px-8">
        <button className="strategy-intro__back" onClick={onBack}><ArrowLeft className="h-4 w-4" /> {tr("Modes", "โหมด")}</button>
        <div className="command-kicker">{tr("Frontier Control · Four-turn map puzzle", "วางแผนยึดพื้นที่ · ใช้คำสั่ง 4 ครั้ง")}</div>
        <h1>{tr(`Win the objective in ${startingActions} moves.`, `ทำเป้าหมายให้สำเร็จใน ${startingActions} คำสั่ง`)}</h1>
        <p>{tr("This is a short turn-based puzzle, not real-time combat. Complete the objective, use every move, then bank the cycle.", "โหมดนี้เป็นเกมวางแผนสั้น ๆ ไม่ต้องรีบ ทำเป้าหมาย ใช้คำสั่งให้ครบ แล้วรับรางวัล")}</p>
        <section className="strategy-how">
          <div><strong>1</strong><Flag className="h-5 w-5" /><span>{tr("Pick a sector", "เลือกพื้นที่")}<small>{tr("Yellow outline marks the objective target.", "กรอบสีเหลืองคือพื้นที่เป้าหมาย")}</small></span></div>
          <div><strong>2</strong><Gamepad2 className="h-5 w-5" /><span>{tr(`Spend ${startingActions} actions`, `ใช้คำสั่ง ${startingActions} ครั้ง`)}<small>{tr("Relay is safe, Reinforce is strong, Disrupt slows a rival.", "ส่งสัญญาณปลอดภัย เพิ่มกำลังได้คะแนนมาก ขัดขวางช่วยลดคะแนนคู่แข่ง")}</small></span></div>
          <div><strong>3</strong><Gift className="h-5 w-5" /><span>{tr("Bank the cycle", "จบรอบและรับรางวัล")}<small>{tr("Earn crystals, XP, PURI bond, and capture bonuses.", "รับคริสตัล XP ความสนิทกับ PURI และโบนัสยึดพื้นที่")}</small></span></div>
        </section>
        <section className="strategy-intro__mission"><Radio className="h-6 w-6" /><div><span>{tr("This cycle’s objective", "เป้าหมายรอบนี้")}</span><h2>{objectiveName}</h2><p>{objectiveDescription}</p></div><b>{tr(`${startingActions} moves`, `${startingActions} คำสั่ง`)}</b></section>
        <section className="strategy-intro__mission"><Gift className="h-6 w-6" /><div><span>{tr("Why play Frontier Control?", "เล่นโหมดวางแผนแล้วได้อะไร?")}</span><h2>{tr("Turn Story influence into a strategic advantage", "ใช้คะแนนพื้นที่ช่วยให้ทุกโหมดได้รางวัลดีขึ้น")}</h2><p>{tr("Every cycle gives crystals, XP, and PURI bond. Complete 2 objectives to permanently earn +10% crystals in every mode.", "ทุกรอบได้คริสตัล XP และเพิ่มความสนิทกับ PURI ทำเป้าหมายครบ 2 รอบ รับคริสตัลเพิ่ม 10% ในทุกโหมดแบบถาวร")}</p></div><b>{Math.min(gameState.modeRecords.strategyObjectives, 2)}/2</b></section>
        <button className="strategy-intro__start" onClick={() => setStarted(true)}><Sparkles className="h-4 w-4" /> {tr("Start command cycle", "เริ่มรอบวางแผน")}</button>
      </main>
    );
  }

  return (
    <main className="strategy-mode relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <header className="strategy-header"><button onClick={onBack}><ArrowLeft className="h-4 w-4" /> {tr("Modes", "โหมด")}</button><div><div className="command-kicker">{tr(`Four-turn map puzzle · Cycle ${cycle + 1}`, `เกมวางแผน 4 คำสั่ง · รอบ ${cycle + 1}`)}</div><h1>{tr("Frontier Control", "วางแผนยึดพื้นที่")}</h1><p>{tr(`Turn ${Math.min(turn, startingActions)} of ${startingActions}: select a sector, then choose one action.`, `คำสั่ง ${Math.min(turn, startingActions)} จาก ${startingActions}: เลือกพื้นที่ แล้วเลือกคำสั่ง`)}</p></div><div className="strategy-actions"><span>{tr("Moves left", "เหลือคำสั่ง")}</span><strong>{actions}</strong></div></header>
      <section className={`strategy-objective ${objectiveComplete ? "is-complete" : ""}`}><Radio className="h-5 w-5" /><div><span>{tr("Your win condition this cycle", "เงื่อนไขผ่านรอบนี้")}</span><strong>{objectiveName}</strong><p>{objectiveDescription} {tr("Use every move, then bank the cycle.", "ใช้คำสั่งให้ครบ แล้วจบรอบเพื่อรับรางวัล")}</p></div><b>{objectiveComplete ? tr("Complete · bonus secured", "สำเร็จ · ได้โบนัส") : objective.id === "survey" ? tr(`${new Set(touched).size}/3 sectors`, `${new Set(touched).size}/3 พื้นที่`) : tr("In progress", "กำลังทำ")}</b></section>
      <section className="strategy-layout">
        <div className="strategy-map"><div className="strategy-map__header"><span>{tr("Choose a sector", "เลือกพื้นที่")}</span><small>{tr(`${controlledNow}/10 under ${faction.name} control`, `${faction.name} ควบคุม ${controlledNow}/10 พื้นที่`)}</small></div><div className="strategy-sector-grid">
          {PLANETS.map((planet, index) => { const sectorController = getPlanetController(workingInfluence[planet.id]); const leader = FACTIONS.find((item) => item.id === sectorController); const target = objective.targetPlanetId === planet.id && objective.id === "focus"; return <button key={planet.id} onClick={() => setSelectedId(planet.id)} className={`${selected.id === planet.id ? "is-selected" : ""} ${sectorController ? `is-${sectorController}` : ""} ${target ? "is-objective" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{planet.emoji} {getSectorLore(planet.id).name}</strong><small>{leader ? `${leader.name} control` : SECTOR_TRAITS[planet.id].name}</small></button>; })}
        </div>{history.length > 0 && <div className="strategy-history"><span>{tr("Your moves", "คำสั่งที่ใช้")}</span>{history.map((entry, index) => <small key={`${entry}-${index}`}>{entry}</small>)}</div>}</div>
        <aside className="strategy-dossier"><div className="strategy-dossier__leader"><img src={LEADERS[playerFaction]} alt="" /><div><span>{faction.name} command</span><strong>{lore.name}</strong><small>{lore.threat}</small></div></div><p>{lore.story}</p>
          {showHint ? <div className="strategy-recommendation"><Lightbulb className="h-4 w-4" /><span>{tr("Tactical hint", "คำแนะนำ")}<strong>{recommendedLabel}</strong></span></div> : <button className="strategy-recommendation" onClick={() => setShowHint(true)}><Lightbulb className="h-4 w-4" /><span>{tr("Need a tactical hint?", "ต้องการคำแนะนำไหม?")}<strong>{tr("Reveal one recommendation", "ดูคำแนะนำ 1 ข้อ")}</strong></span></button>}
          <div className="strategy-recommendation"><Radio className="h-4 w-4" /><span>{tr("Opponent plan", "แผนของฝ่ายคู่แข่ง")}<strong>{opponentPlan}</strong></span></div>
          <div className="sector-trait"><Waves className="h-4 w-4" /><span>{tr("Sector rule", "กติกาพื้นที่")}<strong>{trait.name}</strong><small>{trait.effect}</small></span></div>
          <div className="strategy-bars">{sortedInfluence.map((item) => <div key={item.id}><span>{item.name}<b>{item.value}/100</b></span><i><em className={`bar-${item.id}`} style={{ width: `${item.value}%` }} /></i></div>)}</div>
          <div className="strategy-status"><Flag className="h-4 w-4" /><span>{tr("Current status", "สถานะตอนนี้")}</span><strong>{controller ? tr(`${controller.toUpperCase()} secured`, `${controller.toUpperCase()} ควบคุม`) : tr("Contested / neutral", "กำลังแข่งขัน / ยังไม่มีฝ่ายคุม")}</strong></div>
          <div className="strategy-choices"><button className={showHint && recommendedAction === "scan" ? "is-recommended" : ""} onClick={() => act("scan")} disabled={actions <= 0}><Eye className="h-5 w-5" /><span><strong>{tr("Deploy relay safely", "ส่งสัญญาณแบบปลอดภัย")}</strong><small>{tr(`+${values.scan} influence · rivals do not react`, `คะแนน +${values.scan} · คู่แข่งไม่ขยับ`)}</small></span></button><button className={showHint && recommendedAction === "reinforce" ? "is-recommended" : ""} onClick={() => act("reinforce")} disabled={actions <= 0}><ShieldPlus className="h-5 w-5" /><span><strong>{tr("Reinforce strongly", "เพิ่มกำลังเต็มที่")}</strong><small>{tr(`+${values.reinforce} influence · rivals also move`, `คะแนน +${values.reinforce} · คู่แข่งขยับด้วย`)}</small></span></button><button className={showHint && recommendedAction === "disrupt" ? "is-recommended" : ""} onClick={() => act("disrupt")} disabled={actions <= 0}><Waves className="h-5 w-5" /><span><strong>{tr("Disrupt rival", "ขัดขวางคู่แข่ง")}</strong><small>{tr(`-${values.disrupt} rival · +8 friendly influence`, `คู่แข่ง -${values.disrupt} · ฝ่ายเรา +8`)}</small></span></button></div>
          {actions <= 0 && !claimed && <button className="strategy-complete" onClick={claim}><CheckCircle2 className="h-4 w-4" /> {tr("Bank this command cycle", "จบรอบและรับรางวัล")}</button>}
          {claimed && <div className="strategy-reward">{tr(`Cycle saved · +${crystalReward} crystals · +${xpReward} XP · PURI +${objectiveComplete ? 2 : 1}`, `จบรอบแล้ว · คริสตัล +${crystalReward} · XP +${xpReward} · PURI +${objectiveComplete ? 2 : 1}`)}</div>}
        </aside>
      </section>
    </main>
  );
}
