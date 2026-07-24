import { ArrowRight, CheckCircle2, Gem, Medal, Sparkles, Star, Users, X } from "lucide-react";
import type { PlayMode } from "@/components/ModeHub";
import { GameState } from "@/lib/gameState";
import { getFreshUnlocks, getProgressGoal } from "@/lib/progressionGuidance";
import { useI18n } from "@/lib/i18n";

export interface RunResultData {
  mode: PlayMode;
  title: string;
  outcome: string;
  crystals: number;
  xp: number;
  score?: number;
  mastery?: string;
  masteryTh?: string;
  improvements?: string[];
  improvementsTh?: string[];
}

export default function UnifiedRunResults({ result, gameState, onClose, onNext, onCrew }: { result: RunResultData; gameState: GameState; onClose: () => void; onNext: (mode: PlayMode) => void; onCrew: () => void }) {
  const { tr } = useI18n();
  const goal = getProgressGoal(gameState);
  const unlocks = getFreshUnlocks(gameState);
  const improvements = result.improvements?.length
    ? result.improvements.map((item, index) => tr(item, result.improvementsTh?.[index] ?? item))
    : unlocks;
  return <div className="unified-results-backdrop" role="dialog" aria-modal="true" aria-label={`${result.title} results`}>
    <section className="unified-results">
      <button className="unified-results__close" onClick={onClose} aria-label={tr("Close results", "ปิดหน้ารางวัล")}><X /></button>
      <div className="unified-results__badge"><CheckCircle2 /></div>
      <div className="command-kicker">{tr("Run complete · rewards banked", "จบรอบแล้ว · รับรางวัลเรียบร้อย")}</div>
      <h2>{result.title}</h2><p>{result.outcome}</p>
      <div className="unified-results__rewards"><div><Gem /><span>{tr("Crystals", "คริสตัล")}<strong>+{result.crystals}</strong></span></div><div><Star /><span>{tr("Captain XP", "XP นักบิน")}<strong>+{result.xp}</strong></span></div>{result.score !== undefined && <div><Medal /><span>{tr("Run score", "คะแนนรอบนี้")}<strong>{result.score.toLocaleString()}</strong></span></div>}{result.mastery && <div><Sparkles /><span>{tr("Progress", "ความคืบหน้า")}<strong>{tr(result.mastery, result.masteryTh ?? result.mastery)}</strong></span></div>}</div>
      <div className="unified-results__section"><span>{tr("What improved", "รอบนี้ช่วยอะไร")}</span>{improvements.length ? improvements.map((item) => <p key={item}><CheckCircle2 /> {item}</p>) : <p><Sparkles /> {tr("Captain XP and your upgrade fund increased.", "XP นักบินและคริสตัลสำหรับอัปเกรดเพิ่มขึ้น")}</p>}</div>
      <div className="unified-results__next"><div><span>{tr("Best next step", "แนะนำให้เล่นต่อ")}</span><strong>{tr(goal.title, goal.titleTh)}</strong><p>{tr(goal.detail, goal.detailTh)}</p><i><b style={{ width: `${Math.round(goal.progress * 100)}%` }} /></i></div><button onClick={() => onNext(goal.mode)}>{tr("Play next", "ไปเล่นต่อ")} <ArrowRight /></button></div>
      <div className="unified-results__actions"><button onClick={onCrew}><Users /> {tr("Crew Hangar", "จัดทีมและอัปเกรด")}</button><button onClick={onClose}>{tr("Stay here", "อยู่หน้านี้")}</button></div>
    </section>
  </div>;
}
