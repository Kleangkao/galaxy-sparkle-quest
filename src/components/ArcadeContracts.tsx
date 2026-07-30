import { ArrowLeft, ArrowRight, Clock, Crosshair, Sparkles, Trophy } from "lucide-react";
import { GameState, getGameplayModifiers } from "@/lib/gameState";
import { ARCADE_CONTRACTS, ArcadeContract } from "@/lib/arcadeContracts";
import { useI18n } from "@/lib/i18n";

interface Props {
  gameState: GameState;
  onBack: () => void;
  onStart: (contract: ArcadeContract) => void;
}

export default function ArcadeContracts({ gameState, onBack, onStart }: Props) {
  const { lang, tr } = useI18n();
  const modifiers = getGameplayModifiers(gameState);
  const magazine = 6 + modifiers.arcadeMagazineBonus;
  return (
    <main className="arcade-contracts relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-24 lg:px-8">
      <header className="arcade-contracts__header">
        <button onClick={onBack}><ArrowLeft className="h-4 w-4" /> {tr("Modes", "โหมด")}</button>
        <div><div className="command-kicker">{tr("Arcade operations · Aim & shoot", "ภารกิจยิงเป้า · เล็งและยิง")}</div><h1>{tr("Pick your shooting challenge.", "เลือกภารกิจที่อยากเล่น")}</h1><p>{tr(`Aim with a mouse or touch, fire, and build accuracy combos. Your current loadout carries ${magazine} rounds.`, `ใช้เมาส์หรือแตะหน้าจอเพื่อเล็ง ยิงให้แม่น และรักษาคอมโบ อาวุธที่ใช้อยู่บรรจุกระสุนได้ ${magazine} นัด`)}</p></div>
        <div className="arcade-contracts__bond"><img src="/assets/galia-plush-tech/canonical/pink-companion-master-v1.jpg" alt="PURI" /><span>{tr("PURI bond", "ความสนิทกับ PURI")}<strong>{gameState.modeRecords.puriBond}</strong></span></div>
      </header>

      <section className="arcade-contract-grid">
        {ARCADE_CONTRACTS.map((contract) => {
          const record = gameState.modeRecords.arcadeContracts[contract.id] ?? { bestScore: 0, clears: 0 };
          const objective = contract.objective === "boss" ? tr("Break the Ahr core", "ทำลายแกนพลัง Ahr") : contract.objective === "energy" ? tr(`Collect as many as possible · clear goal ${contract.target}`, `เก็บให้ได้มากที่สุด ผ่านด่านเมื่อได้ ${contract.target} จุด`) : tr(`Score as high as possible · clear goal ${contract.target.toLocaleString()}`, `ทำคะแนนให้ได้มากที่สุด ผ่านด่านเมื่อได้ ${contract.target.toLocaleString()} คะแนน`);
          const effectiveDuration = contract.duration + modifiers.missionTimeBonus;
          return (
            <article key={contract.id} className={`arcade-contract arcade-contract--${contract.accent}`}>
              <div className="arcade-contract__art"><img src={contract.image} alt={lang === "th" ? contract.nameTh : contract.name} /><span>{tr(contract.subtitle, contract.subtitleTh)}</span></div>
              <div className="arcade-contract__copy">
                <h2>{lang === "th" ? contract.nameTh : contract.name}</h2><p>{tr(contract.briefing, contract.briefingTh)}</p>
                <div className="arcade-contract__objective"><Crosshair className="h-4 w-4" /><span>{tr("Objective", "เป้าหมาย")}<strong>{objective}</strong></span></div>
                <div className="arcade-contract__stats"><span><Clock className="h-3.5 w-3.5" />{tr(`Time ${effectiveDuration}s`, `เวลา ${effectiveDuration} วิ`)}</span><span><Trophy className="h-3.5 w-3.5" />{tr(`Best ${record.bestScore.toLocaleString()}`, `สูงสุด ${record.bestScore.toLocaleString()}`)}</span><span><Sparkles className="h-3.5 w-3.5" />{tr(`${record.clears} clears`, `ผ่าน ${record.clears} ครั้ง`)}</span></div>
                <button onClick={() => onStart(contract)}>{tr("Start challenge", "เริ่มภารกิจ")} <ArrowRight className="h-4 w-4" /></button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
