import { ArrowRight, CheckCircle2, Map, PawPrint, Rocket, Sparkles, Users, X } from "lucide-react";
import { GameState, getFaction } from "@/lib/gameState";
import { getPilot } from "@/lib/loadouts";

interface Props {
  gameState: GameState;
  onStartStory: () => void;
  onOpenCrew: () => void;
  onDismiss: () => void;
}

export default function GuidedFlight({ gameState, onStartStory, onOpenCrew, onDismiss }: Props) {
  const faction = getFaction(gameState.faction);
  const pilot = getPilot(gameState.activePilot);
  const storyDone = gameState.visitedPlanets.length > 0;
  const upgradeDone = gameState.upgrades.length > 0;
  const primary = !storyDone ? { label: "Start Story Chapter 1", action: onStartStory, icon: Map } : !upgradeDone ? { label: "Install your first upgrade", action: onOpenCrew, icon: Users } : { label: "Choose today’s activity", action: onDismiss, icon: Sparkles };
  const PrimaryIcon = primary.icon;

  return (
    <div className="guided-flight" role="dialog" aria-modal="true" aria-labelledby="guided-flight-title">
      <div className="guided-flight__panel">
        <button className="guided-flight__close" onClick={onDismiss} aria-label="Skip guided flight"><X /></button>
        <div className="guided-flight__visual"><img src={pilot.image} alt="" /><span><PawPrint /> PURI online</span></div>
        <div className="guided-flight__copy">
          <div className="command-kicker"><Rocket className="h-3.5 w-3.5" /> First flight · about 3 minutes</div>
          <h1 id="guided-flight-title">Welcome to {faction?.name}, Captain.</h1>
          <p>You are {pilot.name}. PURI will travel with you, collect bond, and unlock helpful abilities across every game mode.</p>
          <div className="guided-flight__steps">
            <Step done label="Choose a faction" detail={`${faction?.name} progress now saves separately.`} />
            <Step done label="Meet your crew" detail={`${pilot.name} and PURI are ready.`} />
            <Step done={storyDone} label="Clear Story Chapter 1" detail="Learn movement, collect crystals, and trace the first signal." />
            <Step done={upgradeDone} label="Install one Crew upgrade" detail="Use mission crystals for a permanent improvement." />
            <Step done={upgradeDone && storyDone} label="Choose what to play next" detail="Story, Swarm, Arcade, Discovery, and Control share progression." />
          </div>
          <button className="guided-flight__primary" onClick={primary.action}><PrimaryIcon /> {primary.label} <ArrowRight /></button>
          <button className="guided-flight__skip" onClick={onDismiss}>Skip for now · replay anytime in Settings</button>
        </div>
      </div>
    </div>
  );
}

function Step({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return <div className={done ? "is-done" : ""}><span>{done ? <CheckCircle2 /> : <Sparkles />}</span><p><strong>{label}</strong><small>{detail}</small></p></div>;
}
