import { ArrowRight, Binoculars, Crosshair, Gamepad2, Heart, Map, Sparkles, Swords, WandSparkles } from "lucide-react";
import { GameState } from "@/lib/gameState";
import { getPilot } from "@/lib/loadouts";
import PuriBondPanel from "@/components/PuriBondPanel";

export type PlayMode = "story" | "arcade" | "discovery" | "strategy" | "swarm";

interface Props {
  gameState: GameState;
  onChoose: (mode: PlayMode) => void;
}

const MODES: Array<{
  id: PlayMode;
  name: string;
  label: string;
  description: string;
  image: string;
  icon: typeof Gamepad2;
  color: string;
  status: string;
  play: string;
  progress: string;
}> = [
  {
    id: "story", name: "Story Expeditions", label: "Campaign", icon: Map,
    description: "Trace the lost signal across ten connected chapters. Explore, upgrade, and shape the frontier.",
    image: "/assets/star-atlas/kQLooz/01-vitaly-tyukin-sand-punaab-fire3.webp", color: "cyan", status: "10 chapters",
    play: "Choose route · complete short missions", progress: "XP · crystals · pets · sector control",
  },
  {
    id: "swarm", name: "Swarm Protocol", label: "Survival", icon: Swords,
    description: "A gentler 60-second survival run. Dodge, auto-fire, collect energy, and choose perks before the Ahr boss.",
    image: "/assets/galia-cute-tech/ahr-boss-v2.png", color: "pink", status: "Run perks",
    play: "Move · auto-fire · build perks", progress: "Crystals · XP · PURI bond every run",
  },
  {
    id: "arcade", name: "Arcade Ops", label: "Action", icon: Crosshair,
    description: "Real mouse-aim shooting assignments with moving targets, reload timing, decoys, combos, and boss weak points.",
    image: "/assets/star-atlas/bgenAm/01-joao-lira-cc-ust-m-combat-001.webp", color: "orange", status: "Aim & shoot",
    play: "Mouse aim · click fire · R reload", progress: "Contract records · crystals · XP",
  },
  {
    id: "discovery", name: "Discovery Runs", label: "Relax", icon: Binoculars,
    description: "A relaxed hidden-object hunt. Click six pulsing signals, reveal their stories, and complete a field journal.",
    image: "/assets/galia-cute-tech/verdant-tree-biome-v2.png", color: "green", status: "Hidden objects",
    play: "Pick biome · find signals · claim journal", progress: "Biome mastery · lore · crystals",
  },
  {
    id: "strategy", name: "Frontier Control", label: "Strategy-lite", icon: Sparkles,
    description: "A four-turn map puzzle. Pick sectors, spend simple actions, and complete one clear objective for a bonus.",
    image: "/assets/star-atlas/1NvkdG/01-joao-lira-old-leaders1.webp", color: "yellow", status: "4-turn puzzle",
    play: "Pick sector · spend four moves", progress: "Influence · captures · command rewards",
  },
];

export default function ModeHub({ gameState, onChoose }: Props) {
  const pilot = getPilot(gameState.activePilot);
  const records = gameState.modeRecords;
  const autoMode = (["discovery", "arcade", "swarm", "strategy"] as PlayMode[])[new Date().getDay() % 4];

  return (
    <main className="mode-hub relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <header className="mode-hub__header">
        <div>
          <div className="command-kicker"><Sparkles className="h-3.5 w-3.5" /> Galia play garden</div>
          <h1>Pick your next<br /><span>tiny-big adventure!</span></h1>
          <p>One captain, five ways to play. Every trip earns something useful.</p>
          <div className="mode-mood-picker" aria-label="Choose by mood">
            <span><Heart className="h-3.5 w-3.5" /> Choose by mood</span>
            <button onClick={() => onChoose("discovery")}>I want to chill</button>
            <button onClick={() => onChoose("arcade")}>I want action</button>
            <button onClick={() => onChoose("story")}>I want a story</button>
          </div>
        </div>
        <div className="mode-hub__aside">
          <div className="mode-hub__captain">
            <img src={pilot.image} alt="" />
            <div><span>Ready pilot</span><strong>{pilot.name}</strong><small>{pilot.callsign} loadout</small></div>
          </div>
          <button onClick={() => onChoose(autoMode)}><WandSparkles className="h-4 w-4" /> Pick a surprise for me!</button>
        </div>
      </header>

      <section className="mode-records" aria-label="Mode records">
        <div><span>Swarm best</span><strong>{records.swarmHighScore.toLocaleString()}</strong></div>
        <div><span>Discoveries</span><strong>{records.discoveryFinds}</strong></div>
        <div><span>Control wins</span><strong>{records.strategyWins}</strong></div>
        <div><span>Arcade best</span><strong>{records.arcadeHighScore.toLocaleString()}</strong></div>
      </section>

      <PuriBondPanel bond={records.puriBond} />

      <section className="mode-grid" aria-label="Game modes">
        {MODES.map((mode, index) => {
          const Icon = mode.icon;
          return (
            <button key={mode.id} className={`mode-card mode-card--${mode.color} ${index === 0 ? "mode-card--feature" : ""}`} onClick={() => onChoose(mode.id)}>
              <div className="mode-card__art" aria-hidden="true"><img src={mode.image} alt="" /></div>
              <div className="mode-card__shade" />
              <div className="mode-card__topline"><span><Icon className="h-4 w-4" />{mode.label}</span><small>{mode.status}</small></div>
              <div className="mode-card__copy"><h2>{mode.name}</h2><p>{mode.description}</p><div className="mode-card__facts"><span>How: {mode.play}</span><span>Goodies: {mode.progress}</span></div><strong>Let’s play <ArrowRight className="h-4 w-4" /></strong></div>
            </button>
          );
        })}
      </section>
    </main>
  );
}
