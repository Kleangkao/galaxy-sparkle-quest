import { ArrowRight, CheckCircle2, Map, PawPrint, Rocket, Sparkles, Users, X } from "lucide-react";
import { GameState, getFaction } from "@/lib/gameState";
import { getPilot } from "@/lib/loadouts";
import { useI18n } from "@/lib/i18n";

interface Props {
  gameState: GameState;
  onStartStory: () => void;
  onOpenCrew: () => void;
  onDismiss: () => void;
}

export default function GuidedFlight({ gameState, onStartStory, onOpenCrew, onDismiss }: Props) {
  const { tr } = useI18n();
  const faction = getFaction(gameState.faction);
  const pilot = getPilot(gameState.activePilot);
  const storyDone = gameState.visitedPlanets.length > 0;
  const upgradeDone = gameState.upgrades.length > 0;
  const primary = !storyDone ? { label: tr("Start Story Chapter 1", "เริ่มเนื้อเรื่องบทที่ 1"), action: onStartStory, icon: Map } : !upgradeDone ? { label: tr("Install your first upgrade", "ติดตั้งอัปเกรดชิ้นแรก"), action: onOpenCrew, icon: Users } : { label: tr("Choose today’s activity", "เลือกโหมดที่อยากเล่น"), action: onDismiss, icon: Sparkles };
  const PrimaryIcon = primary.icon;

  return (
    <div className="guided-flight" role="dialog" aria-modal="true" aria-labelledby="guided-flight-title">
      <div className="guided-flight__panel">
        <button className="guided-flight__close" onClick={onDismiss} aria-label={tr("Skip guided flight", "ข้ามคำแนะนำ")}><X /></button>
        <div className="guided-flight__visual"><img src={pilot.image} alt={pilot.name} /><span><PawPrint /> {tr("PURI online", "PURI พร้อมแล้ว")}</span></div>
        <div className="guided-flight__copy">
          <div className="command-kicker"><Rocket className="h-3.5 w-3.5" /> {tr("First flight · about 3 minutes", "เที่ยวบินแรก · ประมาณ 3 นาที")}</div>
          <h1 id="guided-flight-title">{tr(`Welcome to ${faction?.name}, Captain.`, `ยินดีต้อนรับสู่ฝ่าย ${faction?.name}`)}</h1>
          <p>{tr(`You are ${pilot.name}. PURI will travel with you and unlock helpful abilities across every mode.`, `คุณคือ ${pilot.name} และ PURI จะเดินทางไปด้วยกัน พร้อมปลดล็อกความสามารถใหม่ในทุกโหมด`)}</p>
          <p className="guided-flight__save-note">{tr("Progress saves in this browser on this device. Download a backup from Settings before changing devices or clearing browser data.", "เซฟเกมจะอยู่ในเบราว์เซอร์ของเครื่องนี้ ควรดาวน์โหลดไฟล์สำรองจากหน้าตั้งค่าก่อนเปลี่ยนเครื่องหรือล้างข้อมูลเบราว์เซอร์")}</p>
          <div className="guided-flight__steps">
            <Step done label={tr("Choose a faction", "เลือกฝ่าย")} detail={tr(`${faction?.name} progress now saves separately.`, `เซฟของฝ่าย ${faction?.name} จะแยกจากฝ่ายอื่น`)} />
            <Step done label={tr("Meet your crew", "พบกับทีมของคุณ")} detail={tr(`${pilot.name} and PURI are ready.`, `${pilot.name} และ PURI พร้อมแล้ว`)} />
            <Step done={storyDone} label={tr("Clear Story Chapter 1", "ผ่านเนื้อเรื่องบทที่ 1")} detail={tr("Learn movement, collect crystals, and trace the first signal.", "เรียนรู้การขยับ เก็บคริสตัล และตามรอยสัญญาณแรก")} />
            <Step done={upgradeDone} label={tr("Install one Crew upgrade", "ติดตั้งอัปเกรด 1 ชิ้น")} detail={tr("Use mission crystals for a permanent improvement.", "ใช้คริสตัลจากภารกิจเพื่อเพิ่มความสามารถถาวร")} />
            <Step done={upgradeDone && storyDone} label={tr("Choose what to play next", "เลือกโหมดต่อไป")} detail={tr("Every mode contributes to the same progression.", "ทุกโหมดช่วยเพิ่มความคืบหน้าร่วมกัน")} />
          </div>
          <button className="guided-flight__primary" onClick={primary.action}><PrimaryIcon /> {primary.label} <ArrowRight /></button>
          <button className="guided-flight__skip" onClick={onDismiss}>{tr("Skip for now · replay anytime in Settings", "ข้ามก่อน · เปิดดูใหม่ได้ทุกเมื่อในหน้าตั้งค่า")}</button>
        </div>
      </div>
    </div>
  );
}

function Step({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return <div className={done ? "is-done" : ""}><span>{done ? <CheckCircle2 /> : <Sparkles />}</span><p><strong>{label}</strong><small>{detail}</small></p></div>;
}
