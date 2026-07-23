import { ArrowRight, CheckCircle2, Gem, Medal, Sparkles, Star, Users, X } from "lucide-react";
import type { PlayMode } from "@/components/ModeHub";
import { GameState } from "@/lib/gameState";
import { getFreshUnlocks, getProgressGoal } from "@/lib/progressionGuidance";

export interface RunResultData {
  mode: PlayMode;
  title: string;
  outcome: string;
  crystals: number;
  xp: number;
  score?: number;
  mastery?: string;
}

export default function UnifiedRunResults({ result, gameState, onClose, onNext, onCrew }: { result: RunResultData; gameState: GameState; onClose: () => void; onNext: (mode: PlayMode) => void; onCrew: () => void }) {
  const goal = getProgressGoal(gameState);
  const unlocks = getFreshUnlocks(gameState);
  return <div className="unified-results-backdrop" role="dialog" aria-modal="true" aria-label={`${result.title} results`}>
    <section className="unified-results">
      <button className="unified-results__close" onClick={onClose} aria-label="Close results"><X /></button>
      <div className="unified-results__badge"><CheckCircle2 /></div>
      <div className="command-kicker">Run complete · rewards banked</div>
      <h2>{result.title}</h2><p>{result.outcome}</p>
      <div className="unified-results__rewards"><div><Gem /><span>Crystals<strong>+{result.crystals}</strong></span></div><div><Star /><span>Captain XP<strong>+{result.xp}</strong></span></div>{result.score !== undefined && <div><Medal /><span>Run score<strong>{result.score.toLocaleString()}</strong></span></div>}{result.mastery && <div><Sparkles /><span>Progress<strong>{result.mastery}</strong></span></div>}</div>
      <div className="unified-results__section"><span>What improved</span>{unlocks.length ? unlocks.map((unlock) => <p key={unlock}><CheckCircle2 /> {unlock}</p>) : <p><Sparkles /> Your captain rank, upgrade fund, and mode mastery advanced.</p>}</div>
      <div className="unified-results__next"><div><span>Best next step</span><strong>{goal.title}</strong><p>{goal.detail}</p><i><b style={{ width: `${Math.round(goal.progress * 100)}%` }} /></i></div><button onClick={() => onNext(goal.mode)}>Play next <ArrowRight /></button></div>
      <div className="unified-results__actions"><button onClick={onCrew}><Users /> Crew Hangar</button><button onClick={onClose}>Stay here</button></div>
    </section>
  </div>;
}
