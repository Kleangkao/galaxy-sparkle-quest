import { ArrowRight, Crosshair, Gamepad2, Map, Sparkles, Swords } from "lucide-react";
import { GameState } from "@/lib/gameState";
import { getPilot, getPilotCallsign } from "@/lib/loadouts";
import PuriBondPanel from "@/components/PuriBondPanel";
import { useI18n } from "@/lib/i18n";

export type PlayMode = "story" | "arcade" | "swarm";

interface Props {
  gameState: GameState;
  onChoose: (mode: PlayMode) => void;
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
    th: { name: "ผจญภัยตามเนื้อเรื่อง", label: "เนื้อเรื่อง", description: "ตามหาต้นตอของสัญญาณลึกลับตลอด 10 บท แต่ละบทมีแผนที่ เป้าหมาย และอันตรายต่างกัน", status: "มี 10 บท", play: "เลือกเส้นทาง แล้วทำภารกิจ", progress: "XP คริสตัล เพื่อนใหม่ และคะแนนพื้นที่" },
  },
  {
    id: "swarm", name: "Swarm Protocol", label: "Survival", icon: Swords,
    description: "A gentler survival run of about a minute, adjusted by your loadout. Dodge, auto-fire, collect energy, and choose perks before the Ahr boss.",
    image: "/assets/galia-current/ahr-boss-master-v3.webp", color: "pink", status: "Run perks",
    play: "Move · auto-fire · build perks", progress: "Crystals · XP · PURI bond every run",
    th: { name: "ฝ่าฝูงศัตรู", label: "เอาตัวรอด", description: "เล่นรอบละประมาณ 1 นาที ขยับหลบ เก็บพลัง และเลือกความสามารถ ปืนจะยิงอัตโนมัติ ก่อนจบรอบต้องกำจัด Ahr ให้ได้", status: "เลือกพลังระหว่างเล่น", play: "ขยับหลบ ยิงอัตโนมัติ และเลือกพลัง", progress: "คริสตัล XP และความสนิทกับ PURI" },
  },
  {
    id: "arcade", name: "Arcade Ops", label: "Action", icon: Crosshair,
    description: "Manual shooting assignments for mouse or touch, with moving targets, reload timing, decoys, combos, and boss weak points.",
    image: "/assets/galia-current/arcade-frontier-gunner-v1.webp", color: "orange", status: "Aim & shoot",
    play: "Mouse or touch aim · fire · reload", progress: "Contract records · crystals · XP",
    th: { name: "ภารกิจยิงเป้า", label: "ยิงแม่น", description: "ใช้เมาส์หรือแตะหน้าจอเพื่อยิงเป้าที่เคลื่อนที่ อย่ายิงเป้าหลอก รักษาคอมโบ และเล็งจุดอ่อนของบอส", status: "เล็งเอง ยิงเอง", play: "เล็ง ยิง และเติมกระสุน", progress: "สถิติ คริสตัล และ XP" },
  },
];

export default function ModeHub({ gameState, onChoose }: Props) {
  const { lang, tr } = useI18n();
  const pilot = getPilot(gameState.activePilot);
  const records = gameState.modeRecords;

  return (
    <main className="mode-hub relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <header className="mode-hub__header">
        <div>
          <div className="command-kicker"><Sparkles className="h-3.5 w-3.5" /> {tr("Galia operations network", "ศูนย์ภารกิจแห่งกาเลีย")}</div>
          <h1>{tr("Choose today’s", "วันนี้อยากออกไป")}<br /><span>{tr("frontier operation.", "ผจญภัยแบบไหน?")}</span></h1>
          <p>{tr("Build your Guardian crew, trace the living signal, and prepare for the Aurora Crown. Story, Swarm, and Arcade all strengthen the same crew.", "รวมทีมผู้พิทักษ์แล้วออกตามหาต้นตอของสัญญาณปริศนา ทั้งเนื้อเรื่อง ฝ่าฝูงศัตรู และยิงเป้าจะช่วยพัฒนาทีมเดียวกัน ก่อนเดินทางสู่ Aurora Crown")}</p>
        </div>
        <div className="mode-hub__aside">
          <div className="mode-hub__captain">
            <img src={pilot.image} alt="" />
            <div><span>{tr("Ready pilot", "นักบินที่เลือกไว้")}</span><strong>{pilot.name}</strong><small>{tr(`${pilot.callsign} loadout`, `สาย${getPilotCallsign(pilot, lang)}`)}</small></div>
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
                    <span><b>{tr("Earn", "ได้อะไร")}</b>{copy.progress}</span>
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
