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

interface Props {
  gameState: GameState;
  onBack: () => void;
  onComplete: (result: { captures: number; objectiveComplete: boolean; influence: GameState["influence"] }) => void;
}

const LEADERS = {
  mud: "/assets/galia-plush-tech/canonical/mud-leader-master-v1.jpg",
  oni: "/assets/galia-plush-tech/canonical/oni-leader-master-v1.jpg",
  ustur: "/assets/galia-plush-tech/canonical/ustur-leader-master-v1.jpg",
};

const cloneInfluence = (influence: GameState["influence"]): GameState["influence"] => Object.fromEntries(
  Object.entries(influence).map(([planetId, values]) => [planetId, { ...values }]),
);

export default function FrontierControl({ gameState, onBack, onComplete }: Props) {
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
  const recommendedLabel = recommendedAction === "scan" ? "Deploy a safe signal relay" : recommendedAction === "reinforce" ? "Reinforce this sector" : "Disrupt the leading rival";

  if (!started) {
    return (
      <main className="strategy-mode strategy-intro relative z-10 mx-auto min-h-screen max-w-5xl px-5 pb-28 pt-28 lg:px-8">
        <button className="strategy-intro__back" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Modes</button>
        <div className="command-kicker">Frontier Control · Four-turn map puzzle</div>
        <h1>Win the objective in {startingActions} moves.</h1>
        <p>This is a short turn-based puzzle, not real-time combat. Complete the single objective shown below using all your command moves, then bank the cycle.</p>
        <section className="strategy-how">
          <div><strong>1</strong><Flag className="h-5 w-5" /><span>Pick a sector<small>Yellow outline marks the objective target.</small></span></div>
          <div><strong>2</strong><Gamepad2 className="h-5 w-5" /><span>Spend {startingActions} actions<small>Relay is safe, Reinforce is strong, Disrupt slows a rival.</small></span></div>
          <div><strong>3</strong><Gift className="h-5 w-5" /><span>Bank the cycle<small>Earn 6+ crystals, 6+ XP, PURI bond, and capture bonuses.</small></span></div>
        </section>
        <section className="strategy-intro__mission"><Radio className="h-6 w-6" /><div><span>This cycle’s objective</span><h2>{objective.name}</h2><p>{objective.description}</p></div><b>{startingActions} moves</b></section>
        <section className="strategy-intro__mission"><Gift className="h-6 w-6" /><div><span>Why play Frontier Control?</span><h2>Turn Story influence into a strategic advantage</h2><p>Every cycle gives crystals, XP, and PURI bond. Complete 2 objectives to permanently earn +10% crystals in every mode.</p></div><b>{Math.min(gameState.modeRecords.strategyObjectives, 2)}/2</b></section>
        <button className="strategy-intro__start" onClick={() => setStarted(true)}><Sparkles className="h-4 w-4" /> Start command cycle</button>
      </main>
    );
  }

  return (
    <main className="strategy-mode relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <header className="strategy-header"><button onClick={onBack}><ArrowLeft className="h-4 w-4" /> Modes</button><div><div className="command-kicker">Four-turn map puzzle · Cycle {cycle + 1}</div><h1>Frontier Control</h1><p>Turn {Math.min(turn, startingActions)} of {startingActions}: select a sector, then choose one action.</p></div><div className="strategy-actions"><span>Moves left</span><strong>{actions}</strong></div></header>
      <section className={`strategy-objective ${objectiveComplete ? "is-complete" : ""}`}><Radio className="h-5 w-5" /><div><span>Your win condition this cycle</span><strong>{objective.name}</strong><p>{objective.description} Spend every move, then bank the cycle. After the training cycles, tactical hints are optional.</p></div><b>{objectiveComplete ? "Complete · bonus secured" : objective.id === "survey" ? `${new Set(touched).size}/3 sectors` : "In progress"}</b></section>
      <section className="strategy-layout">
        <div className="strategy-map"><div className="strategy-map__header"><span>Choose a sector</span><small>{controlledNow}/10 under {faction.name} control</small></div><div className="strategy-sector-grid">
          {PLANETS.map((planet, index) => { const sectorController = getPlanetController(workingInfluence[planet.id]); const leader = FACTIONS.find((item) => item.id === sectorController); const target = objective.targetPlanetId === planet.id && objective.id === "focus"; return <button key={planet.id} onClick={() => setSelectedId(planet.id)} className={`${selected.id === planet.id ? "is-selected" : ""} ${sectorController ? `is-${sectorController}` : ""} ${target ? "is-objective" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{planet.emoji} {getSectorLore(planet.id).name}</strong><small>{leader ? `${leader.name} control` : SECTOR_TRAITS[planet.id].name}</small></button>; })}
        </div>{history.length > 0 && <div className="strategy-history"><span>Your moves</span>{history.map((entry, index) => <small key={`${entry}-${index}`}>{entry}</small>)}</div>}</div>
        <aside className="strategy-dossier"><div className="strategy-dossier__leader"><img src={LEADERS[playerFaction]} alt="" /><div><span>{faction.name} command</span><strong>{lore.name}</strong><small>{lore.threat}</small></div></div><p>{lore.story}</p>
          {showHint ? <div className="strategy-recommendation"><Lightbulb className="h-4 w-4" /><span>Tactical hint<strong>{recommendedLabel}</strong></span></div> : <button className="strategy-recommendation" onClick={() => setShowHint(true)}><Lightbulb className="h-4 w-4" /><span>Need a tactical hint?<strong>Reveal one recommendation</strong></span></button>}
          <div className="sector-trait"><Waves className="h-4 w-4" /><span>Sector rule<strong>{trait.name}</strong><small>{trait.effect}</small></span></div>
          <div className="strategy-bars">{sortedInfluence.map((item) => <div key={item.id}><span>{item.name}<b>{item.value}/100</b></span><i><em className={`bar-${item.id}`} style={{ width: `${item.value}%` }} /></i></div>)}</div>
          <div className="strategy-status"><Flag className="h-4 w-4" /><span>Current status</span><strong>{controller ? `${controller.toUpperCase()} secured` : "Contested / neutral"}</strong></div>
          <div className="strategy-choices"><button className={showHint && recommendedAction === "scan" ? "is-recommended" : ""} onClick={() => act("scan")} disabled={actions <= 0}><Eye className="h-5 w-5" /><span><strong>Deploy relay safely</strong><small>+{values.scan} influence · rivals do not react</small></span></button><button className={showHint && recommendedAction === "reinforce" ? "is-recommended" : ""} onClick={() => act("reinforce")} disabled={actions <= 0}><ShieldPlus className="h-5 w-5" /><span><strong>Reinforce strongly</strong><small>+{values.reinforce} influence · rivals also move</small></span></button><button className={showHint && recommendedAction === "disrupt" ? "is-recommended" : ""} onClick={() => act("disrupt")} disabled={actions <= 0}><Waves className="h-5 w-5" /><span><strong>Disrupt rival</strong><small>-{values.disrupt} rival · +8 friendly influence</small></span></button></div>
          {actions <= 0 && !claimed && <button className="strategy-complete" onClick={claim}><CheckCircle2 className="h-4 w-4" /> Bank this command cycle</button>}
          {claimed && <div className="strategy-reward">Cycle saved · +{crystalReward} crystals · +{xpReward} XP · PURI +{objectiveComplete ? 2 : 1}</div>}
        </aside>
      </section>
    </main>
  );
}
