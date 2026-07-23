import { useEffect, useState } from "react";
import { MessageCircleHeart, ShieldCheck, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FeedbackMode, savePlaytestFeedback } from "@/lib/playtestFeedback";

interface Props { open: boolean; mode: FeedbackMode; onOpenChange: (open: boolean) => void; onSubmitted: () => void; }

const MODE_NAMES: Record<FeedbackMode, string> = { story: "Story Expeditions", swarm: "Swarm Protocol", arcade: "Arcade Ops", discovery: "Discovery Runs", strategy: "Frontier Control", overall: "Guardians of Galia" };

export default function PlaytestFeedback({ open, mode, onOpenChange, onSubmitted }: Props) {
  const [fun, setFun] = useState(0);
  const [difficulty, setDifficulty] = useState<"easy" | "right" | "hard">("right");
  const [note, setNote] = useState("");
  useEffect(() => { if (open) { setFun(0); setDifficulty("right"); setNote(""); } }, [open, mode]);
  const submit = () => {
    if (!fun) return;
    savePlaytestFeedback(mode, fun, difficulty, note);
    onSubmitted();
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(event) => event.preventDefault()} className="playtest-feedback max-w-lg border-border/70 bg-card/95 p-0 text-foreground backdrop-blur-xl">
        <DialogHeader className="playtest-feedback__header"><span><MessageCircleHeart /></span><div><DialogTitle>Help tune {MODE_NAMES[mode]}</DialogTitle><DialogDescription>Three quick answers help us improve the next build.</DialogDescription></div></DialogHeader>
        <div className="playtest-feedback__body">
          <fieldset><legend>How fun was it?</legend><div className="feedback-stars">{[1,2,3,4,5].map((rating) => <button key={rating} className={fun >= rating ? "is-active" : ""} onClick={() => setFun(rating)} aria-label={`${rating} out of 5 fun`} aria-pressed={fun === rating}><Sparkles /></button>)}</div></fieldset>
          <fieldset><legend>How did the difficulty feel?</legend><div className="feedback-difficulty">{([['easy','Too easy'],['right','Just right'],['hard','Too hard']] as const).map(([value,label]) => <button key={value} className={difficulty === value ? "is-active" : ""} onClick={() => setDifficulty(value)} aria-pressed={difficulty === value}>{label}</button>)}</div></fieldset>
          <label><span>What felt confusing? <small>Optional</small></span><textarea value={note} maxLength={240} onChange={(event) => setNote(event.target.value)} placeholder="Example: I did not know where to upgrade..." /><small>{note.length}/240</small></label>
          <div className="playtest-feedback__privacy"><ShieldCheck /><span>Anonymous mode counts and submitted ratings help balance the shared test build. No name, email, account, device identifier, or personal details are collected. A local copy stays in this browser.</span></div>
          <button className="playtest-feedback__submit" disabled={!fun} onClick={submit}>Save feedback</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
