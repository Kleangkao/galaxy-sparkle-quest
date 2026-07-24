import { ArrowLeft, ArrowRight, Binoculars, CheckCircle2, Gem, Map, Medal, PawPrint, Shield, Sparkles, Swords, Target, Trophy, Users, Zap } from "lucide-react";
import { GameState, PLANETS, SHIP_UPGRADES, getRank, getXPProgress, countControlled } from "@/lib/gameState";
import { getPilot, getTool } from "@/lib/loadouts";
import { getPuriProgress } from "@/lib/puriBond";
import type { PlayMode } from "@/components/ModeHub";
import { useI18n } from "@/lib/i18n";

interface Props {
  gameState: GameState;
  onBack: () => void;
  onOpenCrew: () => void;
  onPlay: (mode: PlayMode) => void;
}

export default function CaptainProgress({ gameState, onBack, onOpenCrew, onPlay }: Props) {
  const { tr } = useI18n();
  const rank = getRank(gameState.level);
  const xp = getXPProgress(gameState.xp, gameState.level);
  const pilot = getPilot(gameState.activePilot);
  const tool = getTool(gameState.activeTool);
  const puri = getPuriProgress(gameState.modeRecords.puriBond);
  const controlled = gameState.faction ? countControlled(gameState.influence, gameState.faction) : 0;
  const nextUpgrade = SHIP_UPGRADES.find((upgrade) => !gameState.upgrades.includes(upgrade.id));
  const campaignPercent = Math.round(gameState.visitedPlanets.length / PLANETS.length * 100);
  const supportPerks = [
    { name: tr("Swarm Hull", "เกราะฝ่าฝูงศัตรู"), detail: tr("+1 Story HP", "HP เนื้อเรื่อง +1"), earned: gameState.modeRecords.swarmHighScore >= 1500, progress: `${Math.min(gameState.modeRecords.swarmHighScore, 1500).toLocaleString()}/1,500`, mode: "swarm" as PlayMode },
    { name: tr("Arcade Dash", "พุ่งจากโหมดยิงเป้า"), detail: tr("Start Story with one dash", "เริ่มเนื้อเรื่องพร้อมพุ่ง 1 ครั้ง"), earned: Object.values(gameState.modeRecords.arcadeContracts).some((record) => record.clears > 0), progress: tr("Clear one contract", "ผ่านภารกิจยิงเป้า 1 ครั้ง"), mode: "arcade" as PlayMode },
    { name: tr("Field Scanner", "เครื่องสแกนพื้นที่"), detail: tr("+10% Story pet chance", "โอกาสเจอเพื่อนในเนื้อเรื่อง +10%"), earned: gameState.modeRecords.discoveryFinds >= 18, progress: tr(`${Math.min(gameState.modeRecords.discoveryFinds, 18)}/18 finds`, `พบ ${Math.min(gameState.modeRecords.discoveryFinds, 18)}/18 จุด`), mode: "discovery" as PlayMode },
    { name: tr("Frontier Network", "เครือข่ายพื้นที่"), detail: tr("+10% crystals everywhere", "คริสตัลทุกโหมด +10%"), earned: gameState.modeRecords.strategyObjectives >= 2, progress: tr(`${Math.min(gameState.modeRecords.strategyObjectives, 2)}/2 objectives`, `เป้าหมาย ${Math.min(gameState.modeRecords.strategyObjectives, 2)}/2`), mode: "strategy" as PlayMode },
  ];
  const medals = [
    { name: tr("First Signal", "สัญญาณแรก"), detail: tr("Clear one Story chapter", "ผ่านเนื้อเรื่อง 1 บท"), earned: gameState.visitedPlanets.length >= 1, icon: Map },
    { name: tr("Perk Pilot", "นักบินอัปเกรด"), detail: tr("Install your first Crew upgrade", "ติดตั้งอัปเกรดชิ้นแรก"), earned: gameState.upgrades.length >= 1, icon: Zap },
    { name: tr("Swarm Rider", "ผู้ฝ่าฝูงศัตรู"), detail: tr("Score 1,500 in Swarm", "ทำคะแนนฝ่าฝูงศัตรู 1,500"), earned: gameState.modeRecords.swarmHighScore >= 1500, icon: Swords },
    { name: tr("Sharp Shooter", "มือยิงแม่น"), detail: tr("Clear one Arcade contract", "ผ่านภารกิจยิงเป้า 1 ครั้ง"), earned: Object.values(gameState.modeRecords.arcadeContracts).some((record) => record.clears > 0), icon: Target },
    { name: tr("Field Scholar", "นักสำรวจข้อมูล"), detail: tr("Log twelve discoveries", "ค้นพบ 12 จุด"), earned: gameState.modeRecords.discoveryFinds >= 12, icon: Binoculars },
    { name: tr("Frontier Voice", "ผู้ยึดพื้นที่"), detail: tr("Secure one sector", "ยึดพื้นที่ 1 แห่ง"), earned: controlled >= 1, icon: Shield },
  ];
  const earnedMedals = medals.filter((medal) => medal.earned).length;
  const recommendations: Array<{ title: string; detail: string; mode: PlayMode; icon: typeof Map }> = [];
  if (gameState.visitedPlanets.length === 0) recommendations.push({ title: tr("Trace the first signal", "ตามรอยสัญญาณแรก"), detail: tr("Begin Story Chapter 1 and learn the controls.", "เริ่มเนื้อเรื่องบทที่ 1 และเรียนรู้การควบคุม"), mode: "story", icon: Map });
  if (gameState.upgrades.length === 0) recommendations.push({ title: tr("Install a first upgrade", "ติดตั้งอัปเกรดชิ้นแรก"), detail: nextUpgrade ? tr(`${nextUpgrade.name} costs ${nextUpgrade.cost} crystals.`, `${nextUpgrade.name} ใช้ ${nextUpgrade.cost} คริสตัล`) : tr("Visit the Crew Hangar.", "ไปที่หน้าจัดทีม"), mode: "story", icon: Zap });
  if (gameState.modeRecords.discoveryFinds < 6) recommendations.push({ title: tr("Complete a field journal", "ทำสมุดสำรวจให้ครบ"), detail: tr("Discovery is the calmest way to earn mastery and lore.", "โหมดสำรวจเล่นสบายและช่วยเพิ่มความชำนาญ"), mode: "discovery", icon: Binoculars });
  if (recommendations.length < 2) recommendations.push({ title: tr("Raise a mode record", "เพิ่มสถิติโหมดที่ชอบ"), detail: tr("Choose a favorite activity and improve its mastery.", "เลือกโหมดที่ชอบแล้วเพิ่มความชำนาญ"), mode: "swarm", icon: Trophy });

  return (
    <main className="captain-progress relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <header className="captain-progress__hero">
        <button onClick={onBack}><ArrowLeft className="h-4 w-4" /> {tr("All modes", "ทุกโหมด")}</button>
        <div className="captain-progress__identity">
          <img src={pilot.image} alt={pilot.name} />
          <div><div className="command-kicker">{tr("Captain progression network", "ความคืบหน้านักบิน")}</div><h1>{pilot.name}</h1><p>{rank.name} · {pilot.callsign} · {tool.name}</p></div>
        </div>
        <div className="captain-progress__rank">
          <span>{tr(`Rank ${gameState.level}`, `แรงก์ ${gameState.level}`)}</span><strong>{rank.name}</strong><small>{gameState.xp}/{xp.next} XP</small>
          <i role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(xp.progress)} aria-label={`${Math.round(xp.progress)}% toward next rank`}><b style={{ width: `${xp.progress}%` }} /></i>
        </div>
      </header>

      <section className="captain-progress__summary" aria-label="Progress summary">
        <div><Map /><span>{tr("Story", "เนื้อเรื่อง")}<strong>{tr(`${gameState.visitedPlanets.length}/10 chapters`, `${gameState.visitedPlanets.length}/10 บท`)}</strong></span><b>{campaignPercent}%</b></div>
        <div><Medal /><span>{tr("Captain medals", "เหรียญนักบิน")}<strong>{tr(`${earnedMedals}/${medals.length} earned`, `ได้ ${earnedMedals}/${medals.length}`)}</strong></span><b>{earnedMedals}</b></div>
        <div><PawPrint /><span>{tr("Companions", "เพื่อนร่วมทีม")}<strong>{tr(`${gameState.pets.length} archived`, `มี ${gameState.pets.length} ตัว`)}</strong></span><b>{gameState.modeRecords.puriBond}</b></div>
        <div><Gem /><span>{tr("Upgrade fund", "คริสตัลอัปเกรด")}<strong>{tr(`${gameState.crystals} crystals ready`, `มี ${gameState.crystals} คริสตัล`)}</strong></span><b>{gameState.upgrades.length}</b></div>
      </section>

      <div className="captain-progress__grid">
        <section className="progress-panel progress-panel--next">
          <div className="progress-panel__heading"><Sparkles /><div><span>{tr("Recommended next", "แนะนำให้ทำต่อ")}</span><h2>{tr("Keep momentum", "ไปต่อได้เลย")}</h2></div></div>
          <div className="progress-recommendations">
            {recommendations.slice(0, 3).map((item) => {
              const Icon = item.icon;
              return <button key={item.title} onClick={() => item.title.includes("upgrade") ? onOpenCrew() : onPlay(item.mode)}><Icon /><span><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowRight /></button>;
            })}
          </div>
          <button className="progress-crew-button" onClick={onOpenCrew}><Users /> {tr("Open Crew Hangar", "เปิดหน้าจัดทีม")} <ArrowRight /></button>
        </section>

        <section className="progress-panel">
          <div className="progress-panel__heading"><Medal /><div><span>{tr("Collectible perks", "รางวัลสะสม")}</span><h2>{tr("Captain medals", "เหรียญนักบิน")}</h2></div><b>{earnedMedals}/{medals.length}</b></div>
          <div className="captain-medals">
            {medals.map((medal) => { const Icon = medal.icon; return <div key={medal.name} className={medal.earned ? "is-earned" : ""}><span>{medal.earned ? <CheckCircle2 /> : <Icon />}</span><strong>{medal.name}</strong><small>{medal.detail}</small></div>; })}
          </div>
        </section>

        <section className="progress-panel progress-panel--mastery">
          <div className="progress-panel__heading"><Trophy /><div><span>{tr("Every mode matters", "ทุกโหมดมีประโยชน์")}</span><h2>{tr("Activity mastery", "ความชำนาญแต่ละโหมด")}</h2></div></div>
          <MasteryRow icon={Map} label={tr("Story Expeditions", "เนื้อเรื่อง")} value={gameState.visitedPlanets.length} target={10} action={() => onPlay("story")} />
          <MasteryRow icon={Swords} label={tr("Swarm record", "สถิติฝ่าฝูงศัตรู")} value={Math.min(gameState.modeRecords.swarmHighScore, 5000)} target={5000} display={gameState.modeRecords.swarmHighScore.toLocaleString()} action={() => onPlay("swarm")} />
          <MasteryRow icon={Target} label={tr("Arcade record", "สถิติยิงเป้า")} value={Math.min(gameState.modeRecords.arcadeHighScore, 3000)} target={3000} display={gameState.modeRecords.arcadeHighScore.toLocaleString()} action={() => onPlay("arcade")} />
          <MasteryRow icon={Binoculars} label={tr("Discoveries", "สิ่งที่ค้นพบ")} value={Math.min(gameState.modeRecords.discoveryFinds, 30)} target={30} action={() => onPlay("discovery")} />
          <MasteryRow icon={Shield} label={tr("Control objectives", "เป้าหมายวางแผน")} value={Math.min(gameState.modeRecords.strategyObjectives, 10)} target={10} action={() => onPlay("strategy")} />
        </section>

        <section className="progress-panel progress-panel--puri">
          <div className="progress-panel__heading"><PawPrint /><div><span>{tr("Adventure companion", "คู่หูผจญภัย")}</span><h2>PURI · {puri.current.name}</h2></div></div>
          <div className="progress-puri"><img src="/assets/galia-plush-tech/canonical/pink-companion-master-v1.jpg" alt="PURI" /><div><strong>{puri.current.ability}</strong><p>{puri.current.description}</p><i><b style={{ width: `${puri.bond}%` }} /></i><small>{puri.next ? `${puri.next.bond - puri.bond} bond until ${puri.next.ability}` : "Every PURI ability is unlocked"}</small></div></div>
        </section>

        <section className="progress-panel">
          <div className="progress-panel__heading"><Zap /><div><span>{tr("Side modes strengthen Story", "โหมดอื่นช่วยเนื้อเรื่อง")}</span><h2>{tr("Campaign support", "พลังช่วยเนื้อเรื่อง")}</h2></div><b>{supportPerks.filter((perk) => perk.earned).length}/4</b></div>
          <div className="captain-medals">
            {supportPerks.map((perk) => <button key={perk.name} className={perk.earned ? "is-earned" : ""} onClick={() => onPlay(perk.mode)}><span>{perk.earned ? <CheckCircle2 /> : <Zap />}</span><strong>{perk.name}</strong><small>{perk.earned ? perk.detail : perk.progress}</small></button>)}
          </div>
        </section>
      </div>
    </main>
  );
}

function MasteryRow({ icon: Icon, label, value, target, display, action }: { icon: typeof Map; label: string; value: number; target: number; display?: string; action: () => void }) {
  const progress = Math.min(100, Math.round(value / target * 100));
  return <button className="mastery-row" onClick={action}><Icon /><span><strong>{label}</strong><i><b style={{ width: `${progress}%` }} /></i></span><em>{display ?? `${value}/${target}`}</em><ArrowRight /></button>;
}
