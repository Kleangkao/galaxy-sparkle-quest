import { CheckCircle2, CircleMinus, Gem, Medal, Sparkles, Star, TriangleAlert, Users } from "lucide-react";
import type { PlayMode } from "@/components/ModeHub";
import { GameState } from "@/lib/gameState";
import { getFreshUnlocks } from "@/lib/progressionGuidance";
import { useI18n } from "@/lib/i18n";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

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
  status?: "cleared" | "partial" | "failed" | "no-reward";
}

export default function UnifiedRunResults({ result, gameState, onExit, onCrew }: { result: RunResultData; gameState: GameState; onExit: () => void; onCrew: () => void }) {
  const { tr } = useI18n();
  const unlocks = getFreshUnlocks(gameState);
  const improvements = result.improvements?.length
    ? result.improvements.map((item, index) => tr(item, result.improvementsTh?.[index] ?? item))
    : unlocks;
  const status = result.status ?? "cleared";
  const StatusIcon = status === "cleared" ? CheckCircle2 : status === "no-reward" ? CircleMinus : TriangleAlert;
  const kicker = status === "cleared"
    ? tr("Run complete · rewards banked", "จบรอบแล้ว · รับรางวัลเรียบร้อย")
    : status === "partial"
      ? tr("Run complete · partial rewards banked", "จบรอบแล้ว · รับรางวัลบางส่วน")
      : status === "no-reward"
        ? tr("Run ended · no reward earned", "จบรอบแล้ว · ยังไม่ได้รางวัล")
        : tr("Run failed · progress not cleared", "ภารกิจไม่สำเร็จ · ยังไม่ผ่านด่าน");
  return <Dialog open onOpenChange={(open) => { if (!open) onExit(); }}>
    <DialogContent className={`unified-results is-${status}`} aria-label={tr(`${result.title} results`, `สรุปผล ${result.title}`)}>
      <div className="unified-results__badge"><StatusIcon /></div>
      <div className="command-kicker">{kicker}</div>
      <DialogTitle className="unified-results__title">{result.title}</DialogTitle>
      <DialogDescription className="unified-results__description">{result.outcome}</DialogDescription>
      <div className="unified-results__rewards"><div><Gem /><span>{tr("Crystals", "คริสตัล")}<strong>+{result.crystals}</strong></span></div><div><Star /><span>{tr("Captain XP", "XP นักบิน")}<strong>+{result.xp}</strong></span></div>{result.score !== undefined && <div><Medal /><span>{tr("Run score", "คะแนนรอบนี้")}<strong>{result.score.toLocaleString()}</strong></span></div>}{result.mastery && <div><Sparkles /><span>{tr("Progress", "ความคืบหน้า")}<strong>{tr(result.mastery, result.masteryTh ?? result.mastery)}</strong></span></div>}</div>
      <div className="unified-results__section"><span>{tr("What improved", "รอบนี้ช่วยอะไร")}</span>{improvements.length ? improvements.map((item) => <p key={item}><CheckCircle2 /> {item}</p>) : <p><Sparkles /> {tr("Captain XP and your upgrade fund increased.", "XP นักบินและคริสตัลสำหรับอัปเกรดเพิ่มขึ้น")}</p>}</div>
      <div className="unified-results__actions"><button onClick={onCrew}><Users /> {tr("Crew Hangar", "จัดทีมและอัปเกรด")}</button><button className="is-primary" onClick={onExit}>{result.mode === "arcade" ? tr("Back to assignments", "กลับไปเลือกภารกิจ") : tr("Back to modes", "กลับไปเลือกโหมด")}</button></div>
    </DialogContent>
  </Dialog>;
}
