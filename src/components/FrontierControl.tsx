import { useMemo, useState } from "react";
import { ArrowLeft, Eye, Flag, Radio, ShieldPlus, Waves } from "lucide-react";
import { FACTIONS, GameState, PLANETS, getFaction, getPlanetController, getSectorLore } from "@/lib/gameState";
import { getPuriBonuses } from "@/lib/puriBond";
import { SECTOR_TRAITS, StrategyAction, getStrategyActionValues, getStrategyObjective, isStrategyObjectiveComplete } from "@/lib/strategyMissions";

interface Props {
  gameState: GameState;
  onBack: () => void;
  onAction: (planetId: string, action: StrategyAction) => void;
  onComplete: (result: { captures: number; objectiveComplete: boolean }) => void;
}

const LEADERS = {
  mud: "/assets/star-atlas/K3DZAR/01-joao-lira-mud-leader-vertical.webp",
  oni: "/assets/star-atlas/8BqDQn/01-joao-lira-oni-leader-vertical.webp",
  ustur: "/assets/star-atlas/JrKGXR/01-joao-lira-ust-leader-vertical.webp",
};

export default function FrontierControl({ gameState, onBack, onAction, onComplete }: Props) {
  const puri = getPuriBonuses(gameState.modeRecords.puriBond);
  const startingActions = 4 + puri.strategyActions;
  const [cycle] = useState(gameState.modeRecords.strategyCycles);
  const [objective] = useState(() => getStrategyObjective(cycle));
  const [selectedId, setSelectedId] = useState(objective.targetPlanetId);
  const [actions, setActions] = useState(startingActions);
  const [touched, setTouched] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [startControlled] = useState(() => Object.values(gameState.influence).filter((inf) => getPlanetController(inf) === gameState.faction).length);
  const [claimed, setClaimed] = useState(false);
  const selected = PLANETS.find((planet) => planet.id === selectedId) ?? PLANETS[0];
  const lore = getSectorLore(selected.id);
  const trait = SECTOR_TRAITS[selected.id];
  const values = getStrategyActionValues(selected.id);
  const inf = gameState.influence[selected.id];
  const controller = getPlanetController(inf);
  const playerFaction = gameState.faction ?? "mud";
  const faction = getFaction(playerFaction)!;
  const controlledNow = Object.values(gameState.influence).filter((sector) => getPlanetController(sector) === playerFaction).length;
  const captures = Math.max(0, controlledNow - startControlled);
  const objectiveComplete = isStrategyObjectiveComplete(objective, gameState, startControlled, touched);
  const baseReward = 6 + captures * 5 + (objectiveComplete ? 5 : 0);
  const crystalReward = Math.ceil(baseReward * puri.rewardMultiplier);
  const xpReward = 6 + (objectiveComplete ? 4 : 0);
  const sortedInfluence = useMemo(() => FACTIONS.map((item) => ({ ...item, value: inf[item.id] })).sort((a, b) => b.value - a.value), [inf]);

  const act = (action: StrategyAction) => {
    if (actions <= 0) return;
    onAction(selected.id, action);
    setTouched((current) => current.includes(selected.id) ? current : [...current, selected.id]);
    const label = action === "scan" ? `Scouted ${lore.name} (+${values.scan})` : action === "reinforce" ? `Reinforced ${lore.name} (+${values.reinforce})` : `Disrupted rival signal (-${values.disrupt})`;
    setHistory((current) => [label, ...current].slice(0, 3));
    setActions((value) => value - 1);
  };

  const claim = () => { if (claimed || actions > 0) return; setClaimed(true); onComplete({ captures, objectiveComplete }); };

  return (
    <main className="strategy-mode relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-24 lg:px-8">
      <header className="strategy-header"><button onClick={onBack}><ArrowLeft className="h-4 w-4" /> Modes</button><div><div className="command-kicker">Strategy-lite · Command cycle {cycle + 1}</div><h1>Frontier Control</h1><p>Spend {startingActions} actions. Read sector traits, manage rival pressure, and complete the command objective.</p></div><div className="strategy-actions"><span>Actions remaining</span><strong>{actions}</strong></div></header>
      <section className={`strategy-objective ${objectiveComplete ? "is-complete" : ""}`}><Radio className="h-5 w-5" /><div><span>Command objective</span><strong>{objective.name}</strong><p>{objective.description}</p></div><b>{objectiveComplete ? "Complete · bonus secured" : objective.id === "survey" ? `${new Set(touched).size}/3 sectors` : "In progress"}</b></section>
      <section className="strategy-layout">
        <div className="strategy-map"><div className="strategy-map__header"><span>Galia tactical grid</span><small>{controlledNow}/10 under {faction.name} control</small></div><div className="strategy-sector-grid">
          {PLANETS.map((planet, index) => { const sectorController = getPlanetController(gameState.influence[planet.id]); const leader = FACTIONS.find((item) => item.id === sectorController); const target = objective.targetPlanetId === planet.id && objective.id === "focus"; return <button key={planet.id} onClick={() => setSelectedId(planet.id)} className={`${selected.id === planet.id ? "is-selected" : ""} ${sectorController ? `is-${sectorController}` : ""} ${target ? "is-objective" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{planet.emoji} {getSectorLore(planet.id).name}</strong><small>{leader ? `${leader.name} control` : SECTOR_TRAITS[planet.id].name}</small></button>; })}
        </div>{history.length > 0 && <div className="strategy-history"><span>Command log</span>{history.map((entry, index) => <small key={`${entry}-${index}`}>{entry}</small>)}</div>}</div>
        <aside className="strategy-dossier"><div className="strategy-dossier__leader"><img src={LEADERS[playerFaction]} alt="" /><div><span>{faction.name} command</span><strong>{lore.name}</strong><small>{lore.threat}</small></div></div><p>{lore.story}</p>
          <div className="sector-trait"><Waves className="h-4 w-4" /><span>Sector trait<strong>{trait.name}</strong><small>{trait.effect}</small></span></div>
          <div className="strategy-bars">{sortedInfluence.map((item) => <div key={item.id}><span>{item.name}<b>{item.value}</b></span><i><em className={`bar-${item.id}`} style={{ width: `${item.value}%` }} /></i></div>)}</div>
          <div className="strategy-status"><Flag className="h-4 w-4" /><span>Current status</span><strong>{controller ? `${controller.toUpperCase()} secured` : "Contested / neutral"}</strong></div>
          <div className="strategy-choices"><button onClick={() => act("scan")} disabled={actions <= 0}><Eye className="h-5 w-5" /><span><strong>Scout signal</strong><small>+{values.scan} influence · no rival response</small></span></button><button onClick={() => act("reinforce")} disabled={actions <= 0}><ShieldPlus className="h-5 w-5" /><span><strong>Reinforce sector</strong><small>+{values.reinforce} influence · rivals react</small></span></button><button onClick={() => act("disrupt")} disabled={actions <= 0}><Waves className="h-5 w-5" /><span><strong>Disrupt rivals</strong><small>-{values.disrupt} leading rival · +8 influence</small></span></button></div>
          {actions <= 0 && !claimed && <button className="strategy-complete" onClick={claim}><Radio className="h-4 w-4" /> End command cycle</button>}
          {claimed && <div className="strategy-reward">Cycle saved · +{crystalReward} crystals · +{xpReward} XP · PURI +{objectiveComplete ? 2 : 1}</div>}
        </aside>
      </section>
    </main>
  );
}
