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
  const { tr } = useI18n();
  const magazine = 6 + getGameplayModifiers(gameState).arcadeMagazineBonus;
  return (
    <main className="arcade-contracts relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-24 lg:px-8">
      <header className="arcade-contracts__header">
        <button onClick={onBack}><ArrowLeft className="h-4 w-4" /> {tr("Modes", "โหมด")}</button>
        <div><div className="command-kicker">{tr("Arcade operations · Aim & shoot", "ภารกิจยิงเป้า · เล็งและยิง")}</div><h1>{tr("Pick your shooting challenge.", "เลือกภารกิจยิงเป้า")}</h1><p>{tr(`Aim with the mouse, click to fire, and build accuracy combos. Your current loadout carries ${magazine} rounds.`, `เล็งด้วยเมาส์ คลิกเพื่อยิง และต่อคอมโบความแม่น ชุดปัจจุบันมีกระสุน ${magazine} นัด`)}</p></div>
        <div className="arcade-contracts__bond"><img src="/assets/galia-plush-tech/canonical/pink-companion-master-v1.jpg" alt="PURI" /><span>{tr("PURI bond", "ความสนิท PURI")}<strong>{gameState.modeRecords.puriBond}</strong></span></div>
      </header>

      <section className="arcade-contract-grid">
        {ARCADE_CONTRACTS.map((contract) => {
          const record = gameState.modeRecords.arcadeContracts[contract.id] ?? { bestScore: 0, clears: 0 };
          const objective = contract.objective === "boss" ? tr("Break the Ahr core", "ทำลายแกนพลัง Ahr") : contract.objective === "energy" ? tr(`Tag ${contract.target} crystal signals`, `ยิงสัญญาณคริสตัล ${contract.target} จุด`) : tr(`Reach ${contract.target.toLocaleString()} points`, `ทำคะแนนให้ถึง ${contract.target.toLocaleString()}`);
          return (
            <article key={contract.id} className={`arcade-contract arcade-contract--${contract.accent}`}>
              <div className="arcade-contract__art"><img src={contract.image} alt={contract.name} /><span>{tr(contract.subtitle, contract.objective === "boss" ? "บุกสู้บอส" : contract.objective === "energy" ? "เก็บสัญญาณ" : "ทำคะแนนสูง")}</span></div>
              <div className="arcade-contract__copy">
                <h2>{contract.name}</h2><p>{tr(contract.briefing, contract.objective === "boss" ? "เล็งแกนพลังของ Ahr ที่กำลังขยับ เติมกระสุนให้ทัน และทำลายเกราะก่อนหมดเวลา" : contract.objective === "energy" ? "ยิงสัญญาณคริสตัลที่ลอยอยู่ หลีกเลี่ยงเป้าหลอกสีแดง และรักษาความแม่น" : "ยิงโดรนให้เร็ว หลีกเลี่ยงเป้าหลอก ต่อคอมโบ และเติมกระสุนให้ถูกจังหวะ")}</p>
                <div className="arcade-contract__objective"><Crosshair className="h-4 w-4" /><span>{tr("Objective", "เป้าหมาย")}<strong>{objective}</strong></span></div>
                <div className="arcade-contract__stats"><span><Clock className="h-3.5 w-3.5" />{tr(`Time ${contract.duration}s`, `เวลา ${contract.duration} วิ`)}</span><span><Trophy className="h-3.5 w-3.5" />{tr(`Best ${record.bestScore.toLocaleString()}`, `สูงสุด ${record.bestScore.toLocaleString()}`)}</span><span><Sparkles className="h-3.5 w-3.5" />{tr(`${record.clears} clears`, `ผ่าน ${record.clears} ครั้ง`)}</span></div>
                <button onClick={() => onStart(contract)}>{tr("Start challenge", "เริ่มภารกิจ")} <ArrowRight className="h-4 w-4" /></button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
