import { Lock, Sparkles } from "lucide-react";
import { PURI_MILESTONES, getPuriProgress } from "@/lib/puriBond";

export default function PuriBondPanel({ bond }: { bond: number }) {
  const progress = getPuriProgress(bond);
  return (
    <section className="puri-panel" aria-label="PURI bond progression">
      <div className="puri-panel__companion"><img src="/assets/galia-plush-tech/canonical/pink-companion-master-v1.jpg" alt="PURI" /><div><span>Your adventure buddy</span><h2>PURI · {progress.current.name}</h2><p>{progress.current.ability}: {progress.current.description}</p></div></div>
      <div className="puri-panel__progress"><div><span>Bond {progress.bond}/100</span><strong>{progress.next ? `${progress.next.bond - progress.bond} until ${progress.next.ability}` : "All abilities unlocked"}</strong></div><i><b style={{ width: `${progress.bond}%` }} /></i></div>
      <div className="puri-milestones">
        {PURI_MILESTONES.slice(1).map((milestone) => {
          const unlocked = progress.bond >= milestone.bond;
          return <div key={milestone.bond} className={unlocked ? "is-unlocked" : ""}>{unlocked ? <Sparkles className="h-4 w-4" /> : <Lock className="h-4 w-4" />}<span>{milestone.bond}<strong>{milestone.ability}</strong></span></div>;
        })}
      </div>
    </section>
  );
}
