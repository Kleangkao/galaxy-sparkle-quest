import { Lock, Sparkles } from "lucide-react";
import { PURI_MILESTONES, getPuriProgress } from "@/lib/puriBond";
import { useI18n } from "@/lib/i18n";

const ABILITY_THAI: Record<string, string> = {
  "Signal Chirp": "เสียงเรียกจาก PURI",
  "Pocket Magnet": "แม่เหล็กจิ๋ว",
  "Cushion Shield": "เกราะนุ่มนิ่ม",
  "Curious Nose": "จมูกนักสำรวจ",
  "Bright Idea": "ไอเดียปิ๊ง",
  "Fortune Link": "สายใยนำโชค",
};

const DESCRIPTION_THAI: Record<string, string> = {
  "Signal Chirp": "PURI จะร่วมเดินทางและฉลองทุกครั้งที่คุณค้นพบสิ่งใหม่",
  "Pocket Magnet": "เก็บพลังในโหมดต่อสู้ได้ไกลขึ้น 25%",
  "Cushion Shield": "เริ่มการต่อสู้ด้วยพลังยานเพิ่ม 15",
  "Curious Nose": "PURI จะบอกใบ้ว่าคุณอยู่ใกล้สัญญาณแค่ไหน",
  "Bright Idea": "ได้คำสั่งเพิ่ม 1 ครั้งในโหมดวางแผน",
  "Fortune Link": "ได้คริสตัลจากรางวัลเพิ่ม 15%",
};

const NAME_THAI: Record<string, string> = {
  "New Friend": "เพื่อนใหม่",
  "Trail Buddy": "คู่หูนักเดินทาง",
  "Brave Buddy": "คู่หูใจกล้า",
  "Clever Buddy": "คู่หูหัวไว",
  "Command Buddy": "คู่หูนักวางแผน",
  "Signal Synchronized": "ใจตรงกัน",
};

export default function PuriBondPanel({ bond }: { bond: number }) {
  const { tr } = useI18n();
  const progress = getPuriProgress(bond);
  const currentAbility = tr(progress.current.ability, ABILITY_THAI[progress.current.ability] ?? progress.current.ability);

  return (
    <section className="puri-panel" aria-label={tr("PURI bond progression", "ระดับความสนิทกับ PURI")}>
      <div className="puri-panel__companion">
        <img src="/assets/galia-plush-tech/canonical/pink-companion-master-v1.jpg" alt="PURI" />
        <div>
          <span>{tr("Your adventure buddy", "คู่หูประจำทีม")}</span>
          <h2>PURI · {tr(progress.current.name, NAME_THAI[progress.current.name] ?? progress.current.name)}</h2>
          <p>{currentAbility}: {tr(progress.current.description, DESCRIPTION_THAI[progress.current.ability] ?? progress.current.description)}</p>
        </div>
      </div>
      <div className="puri-panel__progress">
        <div>
          <span>{tr("Bond", "ความสนิท")} {progress.bond}/100</span>
          <strong>{progress.next
            ? tr(`${progress.next.bond - progress.bond} until ${progress.next.ability}`, `อีก ${progress.next.bond - progress.bond} แต้ม จะได้ ${ABILITY_THAI[progress.next.ability] ?? progress.next.ability}`)
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
              <span>{milestone.bond}<strong>{tr(milestone.ability, ABILITY_THAI[milestone.ability] ?? milestone.ability)}</strong></span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
