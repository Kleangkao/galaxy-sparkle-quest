import { ArrowLeft, ArrowRight, Clock, Crosshair, Sparkles, Trophy } from "lucide-react";
import { GameState, getGameplayModifiers } from "@/lib/gameState";
import { ARCADE_CONTRACTS, ArcadeContract } from "@/lib/arcadeContracts";

interface Props {
  gameState: GameState;
  onBack: () => void;
  onStart: (contract: ArcadeContract) => void;
}

export default function ArcadeContracts({ gameState, onBack, onStart }: Props) {
  const magazine = 6 + getGameplayModifiers(gameState).arcadeMagazineBonus;
  return (
    <main className="arcade-contracts relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-24 lg:px-8">
      <header className="arcade-contracts__header">
        <button onClick={onBack}><ArrowLeft className="h-4 w-4" /> Modes</button>
        <div><div className="command-kicker">Arcade operations board · Aim & shoot</div><h1>Pick your shooting challenge.</h1><p>Mouse aim, click to fire, moving targets, and accuracy combos. Your current loadout carries {magazine} rounds.</p></div>
        <div className="arcade-contracts__bond"><img src="/assets/galia-plush-tech/canonical/pink-companion-master-v1.jpg" alt="PURI companion" /><span>PURI bond<strong>{gameState.modeRecords.puriBond}</strong></span></div>
      </header>

      <section className="arcade-contract-grid">
        {ARCADE_CONTRACTS.map((contract) => {
          const record = gameState.modeRecords.arcadeContracts[contract.id] ?? { bestScore: 0, clears: 0 };
          const objective = contract.objective === "boss" ? "Break the Ahr core" : contract.objective === "energy" ? `Tag ${contract.target} crystal signals` : `Reach ${contract.target.toLocaleString()} points`;
          return (
            <article key={contract.id} className={`arcade-contract arcade-contract--${contract.accent}`}>
              <div className="arcade-contract__art"><img src={contract.image} alt="" /><span>{contract.subtitle}</span></div>
              <div className="arcade-contract__copy">
                <h2>{contract.name}</h2><p>{contract.briefing}</p>
                <div className="arcade-contract__objective"><Crosshair className="h-4 w-4" /><span>Objective<strong>{objective}</strong></span></div>
                <div className="arcade-contract__stats"><span><Clock className="h-3.5 w-3.5" />Time {contract.duration}s</span><span><Trophy className="h-3.5 w-3.5" />Best {record.bestScore.toLocaleString()}</span><span><Sparkles className="h-3.5 w-3.5" />{record.clears} clears</span></div>
                <button onClick={() => onStart(contract)}>Launch assignment <ArrowRight className="h-4 w-4" /></button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
