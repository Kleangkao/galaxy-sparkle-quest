import { ArrowRight, Binoculars, Crosshair, Gamepad2, Map, Sparkles, Swords, Trophy, Users } from "lucide-react";
import { GameState } from "@/lib/gameState";
import { getPilot } from "@/lib/loadouts";
import PuriBondPanel from "@/components/PuriBondPanel";
import { useI18n } from "@/lib/i18n";

export type PlayMode = "story" | "arcade" | "discovery" | "strategy" | "swarm";

interface Props {
  gameState: GameState;
  onChoose: (mode: PlayMode) => void;
  onOpenProgress: () => void;
  onOpenCrew: () => void;
}

const MODES: Array<{
  id: PlayMode;
  name: string;
  label: string;
  description: string;
  image: string;
  icon: typeof Gamepad2;
  color: string;
  status: string;
  play: string;
  progress: string;
  th: { name: string; label: string; description: string; status: string; play: string; progress: string };
}> = [
  {
    id: "story", name: "Story Expeditions", label: "Campaign", icon: Map,
    description: "Trace the lost signal across ten connected chapters. Explore, upgrade, and shape the frontier.",
    image: "/assets/galia-current/nova-reyes-mud-pilot-v2.webp", color: "cyan", status: "10 chapters",
    play: "Choose route · complete short missions", progress: "XP · crystals · pets · sector control",
    th: { name: "ผจญภัยตามเนื้อเรื่อง", label: "เนื้อเรื่อง", description: "ตามหาต้นตอของสัญญาณลึกลับผ่าน 10 บท ออกสำรวจ อัปเกรดทีม และช่วยเปลี่ยนอนาคตของกาเลีย", status: "10 บท", play: "เลือกเส้นทาง · ทำภารกิจสั้น ๆ", progress: "XP · คริสตัล · เพื่อนใหม่ · คะแนนพื้นที่" },
  },
  {
    id: "swarm", name: "Swarm Protocol", label: "Survival", icon: Swords,
    description: "A gentler 60-second survival run. Dodge, auto-fire, collect energy, and choose perks before the Ahr boss.",
    image: "/assets/galia-current/ahr-boss-master-v3.webp", color: "pink", status: "Run perks",
    play: "Move · auto-fire · build perks", progress: "Crystals · XP · PURI bond every run",
    th: { name: "ฝ่าฝูงศัตรู", label: "เอาตัวรอด", description: "ขยับหลบ ยิงอัตโนมัติ เก็บพลัง และเลือกความสามารถใหม่ ก่อนสู้กับ Ahr", status: "เลือกพลังระหว่างเล่น", play: "ขยับ · ยิงอัตโนมัติ · เลือกพลัง", progress: "คริสตัล · XP · ความสนิทกับ PURI" },
  },
  {
    id: "arcade", name: "Arcade Ops", label: "Action", icon: Crosshair,
    description: "Real mouse-aim shooting assignments with moving targets, reload timing, decoys, combos, and boss weak points.",
    image: "/assets/galia-current/arcade-frontier-gunner-v1.webp", color: "orange", status: "Aim & shoot",
    play: "Mouse aim · click fire · R reload", progress: "Contract records · crystals · XP",
    th: { name: "ยิงเป้าอาร์เคด", label: "แอ็กชัน", description: "เล็งด้วยเมาส์ ยิงเป้าที่เคลื่อนที่ หลบเป้าหลอก ต่อคอมโบ และยิงจุดอ่อนของบอส", status: "เล็งและยิง", play: "เล็งเมาส์ · คลิกยิง · กด R เติมกระสุน", progress: "สถิติ · คริสตัล · XP" },
  },
  {
    id: "discovery", name: "Discovery Runs", label: "Relax", icon: Binoculars,
    description: "A relaxed hidden-object hunt. Click six pulsing signals, reveal their stories, and complete a field journal.",
    image: "/assets/galia-current/discovery-scout-v1.webp", color: "green", status: "Hidden objects",
    play: "Pick biome · find signals · claim journal", progress: "Biome mastery · lore · crystals",
    th: { name: "ออกสำรวจ", label: "เล่นสบาย ๆ", description: "เลือกพื้นที่ มองหาสัญญาณที่ซ่อนอยู่ เปิดเรื่องราว และเติมสมุดสำรวจให้ครบ", status: "ค้นหาของ", play: "เลือกพื้นที่ · หาสัญญาณ · รับรางวัล", progress: "ความชำนาญ · เรื่องราว · คริสตัล" },
  },
  {
    id: "strategy", name: "Frontier Control", label: "Strategy-lite", icon: Sparkles,
    description: "A four-turn map puzzle. Pick sectors, spend simple actions, and complete one clear objective for a bonus.",
    image: "/assets/galia-current/mud-leader-charon-master-v2.webp", color: "yellow", status: "4-turn puzzle",
    play: "Pick sector · spend four moves", progress: "Influence · captures · command rewards",
    th: { name: "วางแผนยึดพื้นที่", label: "วางแผน", description: "เกมวางแผนสั้น ๆ เลือกพื้นที่ ใช้คำสั่งให้ครบ และทำเป้าหมายประจำรอบ", status: "4 คำสั่ง", play: "เลือกพื้นที่ · ใช้ 4 คำสั่ง", progress: "คะแนนพื้นที่ · การยึดครอง · รางวัล" },
  },
];

export default function ModeHub({ gameState, onChoose, onOpenProgress, onOpenCrew }: Props) {
  const { lang, tr } = useI18n();
  const pilot = getPilot(gameState.activePilot);
  const records = gameState.modeRecords;

  return (
    <main className="mode-hub relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <header className="mode-hub__header">
        <div>
          <div className="command-kicker"><Sparkles className="h-3.5 w-3.5" /> {tr("Galia operations network", "ศูนย์ภารกิจแห่งกาเลีย")}</div>
          <h1>{tr("Choose today’s", "วันนี้อยากออกไป")}<br /><span>{tr("frontier operation.", "ผจญภัยแบบไหน?")}</span></h1>
          <p>{tr("Build your Guardian crew, trace the living signal, and prepare for the Aurora Crown. Every operation advances the same campaign.", "รวมทีม Guardian ออกตามหาที่มาของสัญญาณปริศนา และเตรียมพร้อมก่อนเดินทางสู่ Aurora Crown ไม่ว่าจะเลือกเล่นโหมดไหน ทีมของคุณก็แข็งแกร่งขึ้น")}</p>
        </div>
        <div className="mode-hub__aside">
          <div className="mode-hub__captain">
            <img src={pilot.image} alt="" />
            <div><span>{tr("Ready pilot", "นักบินพร้อมลุย")}</span><strong>{pilot.name}</strong><small>{tr(`${pilot.callsign} loadout`, `ชุดประจำตัว ${pilot.callsign}`)}</small></div>
          </div>
          <div className="mode-hub__utility">
            <button onClick={onOpenProgress}><Trophy className="h-4 w-4" /> {tr("Progress", "ความคืบหน้า")}</button>
            <button onClick={onOpenCrew}><Users className="h-4 w-4" /> {tr("Crew", "จัดทีม")}</button>
          </div>
        </div>
      </header>

      <PuriBondPanel bond={records.puriBond} />

      <section className="mode-grid" aria-label={tr("Game modes", "โหมดเกม")}>
        {MODES.map((mode, index) => {
          const Icon = mode.icon;
          const copy = lang === "th" ? mode.th : mode;
          return (
            <button key={mode.id} className={`mode-card mode-card--${mode.color} mode-card--${mode.id} ${index === 0 ? "mode-card--feature" : ""}`} onClick={() => onChoose(mode.id)}>
              <div className="mode-card__shade" />
              <div className="mode-card__topline"><span><Icon className="h-4 w-4" />{copy.label}</span><small>{copy.status}</small></div>
              <div className="mode-card__body">
                <div className="mode-card__copy">
                  <h2>{copy.name}</h2>
                  <p>{copy.description}</p>
                  <div className="mode-card__facts">
                    <span><b>{tr("Play", "วิธีเล่น")}</b>{copy.play}</span>
                    <span><b>{tr("Earn", "รางวัล")}</b>{copy.progress}</span>
                  </div>
                  <strong>{tr("Deploy", "เริ่มเล่น")} <ArrowRight className="h-4 w-4" /></strong>
                </div>
                <div className="mode-card__art" aria-hidden="true"><img src={mode.image} alt="" /></div>
              </div>
            </button>
          );
        })}
      </section>
    </main>
  );
}
