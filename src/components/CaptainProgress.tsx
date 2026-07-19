import { ArrowLeft, ArrowRight, Binoculars, CheckCircle2, Gem, Map, Medal, PawPrint, Shield, Sparkles, Swords, Target, Trophy, Users, Zap } from "lucide-react";
import { GameState, PLANETS, SHIP_UPGRADES, getRank, getXPProgress, countControlled } from "@/lib/gameState";
import { getPilot, getTool } from "@/lib/loadouts";
import { getPuriProgress } from "@/lib/puriBond";
import type { PlayMode } from "@/components/ModeHub";

interface Props {
  gameState: GameState;
  onBack: () => void;
  onOpenCrew: () => void;
  onPlay: (mode: PlayMode) => void;
}

export default function CaptainProgress({ gameState, onBack, onOpenCrew, onPlay }: Props) {
  const rank = getRank(gameState.level);
  const xp = getXPProgress(gameState.xp, gameState.level);
  const pilot = getPilot(gameState.activePilot);
  const tool = getTool(gameState.activeTool);
  const puri = getPuriProgress(gameState.modeRecords.puriBond);
  const controlled = gameState.faction ? countControlled(gameState.influence, gameState.faction) : 0;
  const nextUpgrade = SHIP_UPGRADES.find((upgrade) => !gameState.upgrades.includes(upgrade.id));
  const campaignPercent = Math.round(gameState.visitedPlanets.length / PLANETS.length * 100);
  const medals = [
    { name: "First Signal", detail: "Clear one Story chapter", earned: gameState.visitedPlanets.length >= 1, icon: Map },
    { name: "Perk Pilot", detail: "Install your first Crew upgrade", earned: gameState.upgrades.length >= 1, icon: Zap },
    { name: "Swarm Rider", detail: "Score 1,500 in Swarm", earned: gameState.modeRecords.swarmHighScore >= 1500, icon: Swords },
    { name: "Sharp Shooter", detail: "Clear one Arcade contract", earned: Object.values(gameState.modeRecords.arcadeContracts).some((record) => record.clears > 0), icon: Target },
    { name: "Field Scholar", detail: "Log twelve discoveries", earned: gameState.modeRecords.discoveryFinds >= 12, icon: Binoculars },
    { name: "Frontier Voice", detail: "Secure one sector", earned: controlled >= 1, icon: Shield },
  ];
  const earnedMedals = medals.filter((medal) => medal.earned).length;
  const recommendations: Array<{ title: string; detail: string; mode: PlayMode; icon: typeof Map }> = [];
  if (gameState.visitedPlanets.length === 0) recommendations.push({ title: "Trace the first signal", detail: "Begin Story Chapter 1 and learn the expedition controls.", mode: "story", icon: Map });
  if (gameState.upgrades.length === 0) recommendations.push({ title: "Install a first upgrade", detail: nextUpgrade ? `${nextUpgrade.name} costs ${nextUpgrade.cost} crystals.` : "Visit the Crew Hangar.", mode: "story", icon: Zap });
  if (gameState.modeRecords.discoveryFinds < 6) recommendations.push({ title: "Complete a field journal", detail: "Discovery is the calmest way to earn mastery and lore.", mode: "discovery", icon: Binoculars });
  if (recommendations.length < 2) recommendations.push({ title: "Raise a mode record", detail: "Choose a favorite activity and push its mastery higher.", mode: "swarm", icon: Trophy });

  return (
    <main className="captain-progress relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <header className="captain-progress__hero">
        <button onClick={onBack}><ArrowLeft className="h-4 w-4" /> All modes</button>
        <div className="captain-progress__identity">
          <img src={pilot.image} alt="" />
          <div><div className="command-kicker">Captain progression network</div><h1>{pilot.name}</h1><p>{rank.name} · {pilot.callsign} · {tool.name}</p></div>
        </div>
        <div className="captain-progress__rank">
          <span>Rank {gameState.level}</span><strong>{rank.name}</strong><small>{gameState.xp}/{xp.next} XP</small>
          <i aria-label={`${Math.round(xp.progress)}% toward next rank`}><b style={{ width: `${xp.progress}%` }} /></i>
        </div>
      </header>

      <section className="captain-progress__summary" aria-label="Progress summary">
        <div><Map /><span>Story<strong>{gameState.visitedPlanets.length}/10 chapters</strong></span><b>{campaignPercent}%</b></div>
        <div><Medal /><span>Captain medals<strong>{earnedMedals}/{medals.length} earned</strong></span><b>{earnedMedals}</b></div>
        <div><PawPrint /><span>Companions<strong>{gameState.pets.length} archived</strong></span><b>{gameState.modeRecords.puriBond}</b></div>
        <div><Gem /><span>Upgrade fund<strong>{gameState.crystals} crystals ready</strong></span><b>{gameState.upgrades.length}</b></div>
      </section>

      <div className="captain-progress__grid">
        <section className="progress-panel progress-panel--next">
          <div className="progress-panel__heading"><Sparkles /><div><span>Recommended next</span><h2>Keep momentum</h2></div></div>
          <div className="progress-recommendations">
            {recommendations.slice(0, 3).map((item) => {
              const Icon = item.icon;
              return <button key={item.title} onClick={() => item.title.includes("upgrade") ? onOpenCrew() : onPlay(item.mode)}><Icon /><span><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowRight /></button>;
            })}
          </div>
          <button className="progress-crew-button" onClick={onOpenCrew}><Users /> Open Crew Hangar <ArrowRight /></button>
        </section>

        <section className="progress-panel">
          <div className="progress-panel__heading"><Medal /><div><span>Collectible perks</span><h2>Captain medals</h2></div><b>{earnedMedals}/{medals.length}</b></div>
          <div className="captain-medals">
            {medals.map((medal) => { const Icon = medal.icon; return <div key={medal.name} className={medal.earned ? "is-earned" : ""}><span>{medal.earned ? <CheckCircle2 /> : <Icon />}</span><strong>{medal.name}</strong><small>{medal.detail}</small></div>; })}
          </div>
        </section>

        <section className="progress-panel progress-panel--mastery">
          <div className="progress-panel__heading"><Trophy /><div><span>Every mode matters</span><h2>Activity mastery</h2></div></div>
          <MasteryRow icon={Map} label="Story Expeditions" value={gameState.visitedPlanets.length} target={10} action={() => onPlay("story")} />
          <MasteryRow icon={Swords} label="Swarm record" value={Math.min(gameState.modeRecords.swarmHighScore, 5000)} target={5000} display={gameState.modeRecords.swarmHighScore.toLocaleString()} action={() => onPlay("swarm")} />
          <MasteryRow icon={Target} label="Arcade record" value={Math.min(gameState.modeRecords.arcadeHighScore, 3000)} target={3000} display={gameState.modeRecords.arcadeHighScore.toLocaleString()} action={() => onPlay("arcade")} />
          <MasteryRow icon={Binoculars} label="Discoveries" value={Math.min(gameState.modeRecords.discoveryFinds, 30)} target={30} action={() => onPlay("discovery")} />
          <MasteryRow icon={Shield} label="Control objectives" value={Math.min(gameState.modeRecords.strategyObjectives, 10)} target={10} action={() => onPlay("strategy")} />
        </section>

        <section className="progress-panel progress-panel--puri">
          <div className="progress-panel__heading"><PawPrint /><div><span>Adventure companion</span><h2>PURI · {puri.current.name}</h2></div></div>
          <div className="progress-puri"><img src="/assets/galia-soft-tech/puri-companion-v1.png" alt="PURI" /><div><strong>{puri.current.ability}</strong><p>{puri.current.description}</p><i><b style={{ width: `${puri.bond}%` }} /></i><small>{puri.next ? `${puri.next.bond - puri.bond} bond until ${puri.next.ability}` : "Every PURI ability is unlocked"}</small></div></div>
        </section>
      </div>
    </main>
  );
}

function MasteryRow({ icon: Icon, label, value, target, display, action }: { icon: typeof Map; label: string; value: number; target: number; display?: string; action: () => void }) {
  const progress = Math.min(100, Math.round(value / target * 100));
  return <button className="mastery-row" onClick={action}><Icon /><span><strong>{label}</strong><i><b style={{ width: `${progress}%` }} /></i></span><em>{display ?? `${value}/${target}`}</em><ArrowRight /></button>;
}
