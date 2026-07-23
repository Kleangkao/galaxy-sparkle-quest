import { ArrowRight, Crosshair, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { GameState, PLANETS, getFaction, getRank, getSectorLore, isPlanetUnlocked } from "@/lib/gameState";
import { getPilot, getTool } from "@/lib/loadouts";

const LEADER_TRANSMISSIONS = {
  mud: { name: "Commander Charon", image: "/assets/galia-current/mud-leader-charon-master-v2.webp" },
  oni: { name: "Pathfinder Vaor", image: "/assets/galia-plush-tech/canonical/oni-leader-master-v1.jpg" },
  ustur: { name: "Elder Opos", image: "/assets/galia-plush-tech/canonical/ustur-leader-master-v1.jpg" },
};

interface Props {
  gameState: GameState;
  controlledCount: number;
  activeIntelCount: number;
  onLaunch: (planetId: string) => void;
}

export default function CommandBriefing({ gameState, controlledCount, activeIntelCount, onLaunch }: Props) {
  const faction = getFaction(gameState.faction);
  const nextMission = PLANETS.find((planet) => isPlanetUnlocked(planet, gameState.level, gameState.faction) && !gameState.visitedPlanets.includes(planet.id))
    ?? PLANETS.filter((planet) => isPlanetUnlocked(planet, gameState.level, gameState.faction)).at(-1)
    ?? PLANETS[0];
  const lore = getSectorLore(nextMission.id);
  const rank = getRank(gameState.level);
  const campaignProgress = Math.round((gameState.visitedPlanets.length / PLANETS.length) * 100);
  const leader = gameState.faction ? LEADER_TRANSMISSIONS[gameState.faction] : LEADER_TRANSMISSIONS.mud;
  const activePilot = getPilot(gameState.activePilot);
  const activeTool = getTool(gameState.activeTool);

  return (
    <section className="command-briefing" aria-labelledby="command-briefing-title">
      <div className="command-briefing__signal" aria-hidden="true">
        <img src={leader.image} alt="" />
        <span className="command-briefing__signal-ring" />
      </div>

      <div className="command-briefing__copy">
        <div className="command-kicker"><Radio className="inline h-3 w-3" /> {leader.name} · {lore.chapter}</div>
        <h2 id="command-briefing-title">Captain, the frontier is calling.</h2>
        <p>{lore.story}</p>
        <div className="command-briefing__chips">
          <span><Crosshair className="h-3.5 w-3.5" /> {lore.threat}</span>
          <span><ShieldCheck className="h-3.5 w-3.5" /> {faction?.name} expedition</span>
          <span><Sparkles className="h-3.5 w-3.5" /> {rank.name}</span>
          <span>🧑‍🚀 {activePilot.name}</span>
          <span>🛠️ {activeTool.name}</span>
        </div>
      </div>

      <div className="command-briefing__mission">
        <div className="command-briefing__mission-topline">
          <span>Recommended mission</span>
          <span>{campaignProgress}% charted</span>
        </div>
        <div className="command-briefing__mission-title">
          <span className="text-3xl" aria-hidden="true">{nextMission.emoji}</span>
          <div>
            <strong>{lore.name}</strong>
            <small>{lore.mission}</small>
          </div>
        </div>
        <button onClick={() => onLaunch(nextMission.id)}>
          Launch expedition <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="command-briefing__telemetry" aria-label="Campaign telemetry">
        <div><strong>{gameState.visitedPlanets.length}/10</strong><span>signals traced</span></div>
        <div><strong>{controlledCount}</strong><span>sectors secured</span></div>
        <div><strong>{activeIntelCount}</strong><span>rival contacts</span></div>
      </div>
    </section>
  );
}
