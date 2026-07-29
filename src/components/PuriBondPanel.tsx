import { Lock, Sparkles } from "lucide-react";
import { PURI_MILESTONES, getPuriProgress } from "@/lib/puriBond";
import { useI18n } from "@/lib/i18n";

export default function PuriBondPanel({ bond }: { bond: number }) {
  const { tr, lang } = useI18n();
  const progress = getPuriProgress(bond);
  const currentAbility = lang === "th" ? progress.current.abilityTh : progress.current.ability;

  return (
    <section className="puri-panel" aria-label={tr("PURI bond progression", "ระดับความสนิทกับ PURI")}>
      <div className="puri-panel__companion">
        <img src="/assets/galia-plush-tech/canonical/pink-companion-master-v1.jpg" alt="PURI" />
        <div>
          <span>{tr("Your adventure buddy", "คู่หูประจำทีม")}</span>
          <h2>PURI · {lang === "th" ? progress.current.nameTh : progress.current.name}</h2>
          <p>{currentAbility}: {lang === "th" ? progress.current.descriptionTh : progress.current.description}</p>
        </div>
      </div>
      <div className="puri-panel__progress">
        <div>
          <span>{tr("Bond", "ความสนิท")} {progress.bond}/100</span>
          <strong>{progress.next
            ? tr(`${progress.next.bond - progress.bond} until ${progress.next.ability}`, `อีก ${progress.next.bond - progress.bond} แต้ม ปลดล็อก${progress.next.abilityTh}`)
            : tr("All abilities unlocked", "ปลดล็อกครบแล้ว")}</strong>
        </div>
        <i><b style={{ width: `${progress.bond}%` }} /></i>
      </div>
      <div className="puri-milestones">
        {PURI_MILESTONES.slice(1).map((milestone) => {
          const unlocked = progress.bond >= milestone.bond;
          return (
            <div key={milestone.bond} className={unlocked ? "is-unlocked" : ""}>
              {unlocked ? <Sparkles className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              <span>{milestone.bond}<strong>{lang === "th" ? milestone.abilityTh : milestone.ability}</strong></span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
