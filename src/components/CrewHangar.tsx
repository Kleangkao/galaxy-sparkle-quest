import { useState } from "react";
import { ArrowLeft, Check, Crosshair, Gauge, Radar, Shield, UserRound, Zap } from "lucide-react";
import { GameState } from "@/lib/gameState";
import { PILOTS, TOOLS } from "@/lib/loadouts";
import ShipUpgradeShop from "@/components/ShipUpgradeShop";

interface Props {
  gameState: GameState;
  onSetPilot: (id: string) => void;
  onSetTool: (id: string) => void;
  onBuyUpgrade: (id: string, cost: number) => void;
  onBuySkin: (id: string, cost: number) => void;
  onEquipSkin: (id: string) => void;
  onBack: () => void;
}

export default function CrewHangar(props: Props) {
  const [view, setView] = useState<"crew" | "ship">("crew");

  if (view === "ship") {
    return (
      <ShipUpgradeShop
        gameState={props.gameState}
        onBuyUpgrade={props.onBuyUpgrade}
        onBuySkin={props.onBuySkin}
        onEquipSkin={props.onEquipSkin}
        onBack={() => setView("crew")}
      />
    );
  }

  const activePilot = PILOTS.find((pilot) => pilot.id === props.gameState.activePilot) ?? PILOTS[0];
  const activeTool = TOOLS.find((tool) => tool.id === props.gameState.activeTool) ?? TOOLS[0];

  return (
    <main className="relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <button onClick={props.onBack} className="hangar-back">
        <ArrowLeft className="h-4 w-4" /> Frontier
      </button>

      <header className="hangar-header">
        <div>
          <div className="command-kicker">Crew deck · Loadout online</div>
          <h1>Crew & Hangar</h1>
          <p>Choose one pilot for your overall play style and one weapon for combat. Every listed effect is active in the modes it names.</p>
        </div>
        <button className="hangar-ship-link" onClick={() => setView("ship")}>Ship systems →</button>
      </header>

      <section className="loadout-summary" aria-label="Active expedition loadout">
        <div><UserRound /><span>Active pilot</span><strong>{activePilot.name}</strong><small>{activePilot.effect}</small></div>
        <div><Radar /><span>Equipped tool</span><strong>{activeTool.name}</strong><small>{activeTool.effect}</small></div>
        <div><Gauge /><span>Play style</span><strong>{activePilot.callsign}</strong><small>Change this loadout between missions</small></div>
      </section>

      <section className="hangar-section" aria-labelledby="pilot-roster-title">
        <div className="hangar-section__heading">
          <div><span>01</span><div><h2 id="pilot-roster-title">Pilot roster</h2><p>Your pilot sets the expedition's main strength.</p></div></div>
          <small>All starter pilots unlocked</small>
        </div>
        <div className="pilot-grid">
          {PILOTS.map((pilot) => {
            const active = pilot.id === activePilot.id;
            return (
              <button key={pilot.id} className={`pilot-card ${active ? "is-active" : ""}`} onClick={() => props.onSetPilot(pilot.id)}>
                <img src={pilot.image} alt="" />
                <span className="pilot-card__role">{pilot.role}</span>
                <div className="pilot-card__content">
                  <div><small>{pilot.callsign}</small><h3>{pilot.name}</h3></div>
                  {active && <span className="pilot-card__check"><Check className="h-4 w-4" /> Active</span>}
                  <p>{pilot.tagline}</p>
                  <strong>{pilot.effect}</strong>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="hangar-section" aria-labelledby="tool-rack-title">
        <div className="hangar-section__heading">
          <div><span>02</span><div><h2 id="tool-rack-title">Combat weapons</h2><p>Weapons affect Swarm or Arcade combat only. Story exploration is improved by pilots and ship systems.</p></div></div>
          <small>One tool equipped</small>
        </div>
        <div className="tool-grid">
          {TOOLS.map((tool) => {
            const active = tool.id === activeTool.id;
            const Icon = tool.effectType === "quickdraw" ? Zap : tool.effectType === "power" ? Crosshair : Shield;
            return (
              <button key={tool.id} className={`tool-card ${active ? "is-active" : ""}`} onClick={() => props.onSetTool(tool.id)}>
                <div className="tool-card__image"><img src={tool.image} alt="" /></div>
                <div className="tool-card__copy">
                  <span>{tool.family}</span><h3>{tool.name}</h3><p><Icon className="h-4 w-4" />{tool.effect}</p>
                </div>
                {active && <Check className="tool-card__check h-5 w-5" />}
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
