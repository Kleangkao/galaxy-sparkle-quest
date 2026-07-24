import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Compass, Gift, Leaf, MousePointerClick, RotateCcw, ScanLine, Sparkles } from "lucide-react";
import { GameState, getGameplayModifiers } from "@/lib/gameState";
import { getPilot } from "@/lib/loadouts";
import { getPuriBonuses } from "@/lib/puriBond";
import { DISCOVERY_BIOMES, DiscoveryBiome, getDiscoveryRotation, getMasteryTier } from "@/lib/discoveryBiomes";
import ConfirmActionDialog, { ConfirmAction } from "@/components/ConfirmActionDialog";
import { useI18n } from "@/lib/i18n";

interface Props {
  gameState: GameState;
  onBack: () => void;
  onComplete: (result: { biomeId: string; finds: number; mastery: number }) => void;
}

export default function DiscoveryRun({ gameState, onBack, onComplete }: Props) {
  const { tr } = useI18n();
  const pilot = getPilot(gameState.activePilot);
  const puri = getPuriBonuses(gameState.modeRecords.puriBond);
  const modifiers = getGameplayModifiers(gameState);
  const [biome, setBiome] = useState<DiscoveryBiome | null>(null);
  const [runNumber, setRunNumber] = useState(gameState.modeRecords.discoveryRuns);
  const rareSignalActive = Boolean(biome && (runNumber + DISCOVERY_BIOMES.findIndex((item) => item.id === biome.id)) % 3 === 2);
  const finds = useMemo(() => biome ? getDiscoveryRotation(biome, runNumber, rareSignalActive ? 7 : 6) : [], [biome, rareSignalActive, runNumber]);
  const points = useMemo(() => finds.map((item, index) => ({ ...item, id: index, x: 9 + ((index * 31 + runNumber * 7 + 11) % 81), y: 15 + ((index * 37 + runNumber * 5 + 5) % 66) })), [finds, runNumber]);
  const [found, setFound] = useState<number[]>([]);
  const [selected, setSelected] = useState<(typeof points)[number] | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [scanCharges, setScanCharges] = useState(3);
  const [scanActive, setScanActive] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const scanTimer = useRef<number | null>(null);
  const requiredFinds = Math.min(6, points.length);
  const complete = requiredFinds > 0 && found.filter((id) => id < requiredFinds).length === requiredFinds;
  const guidedId = puri.discoveryHint ? points.find((item) => !found.includes(item.id))?.id : undefined;
  const crystalReward = Math.ceil(found.length * puri.rewardMultiplier * modifiers.crystalMultiplier);
  const masteryGain = complete ? 20 : found.length;

  useEffect(() => () => { if (scanTimer.current !== null) window.clearTimeout(scanTimer.current); }, []);

  const chooseBiome = (next: DiscoveryBiome) => { setBiome(next); setFound([]); setSelected(null); setClaimed(false); setScanCharges(3); };
  const find = (item: (typeof points)[number]) => { if (!found.includes(item.id)) setFound((current) => [...current, item.id]); setSelected(item); };
  const claim = () => { if (claimed || !biome || !complete) return; setClaimed(true); onComplete({ biomeId: biome.id, finds: found.length, mastery: masteryGain }); };
  const performReset = () => {
    setRunNumber((value) => value + 1); setFound([]); setSelected(null); setClaimed(false); setScanCharges(3);
  };
  const reset = () => {
    if (found.length === 0 || claimed) return performReset();
    setConfirmAction({
      title: "Leave this unfinished journal?",
      description: `${found.length}/${requiredFinds} required signals are logged. Unclaimed progress from this layout will be cleared.`,
      confirmLabel: "Start new layout",
      tone: "danger",
      onConfirm: performReset,
    });
  };
  const scan = () => {
    if (scanCharges <= 0 || scanActive) return;
    setScanCharges((value) => value - 1);
    setScanActive(true);
    if (scanTimer.current !== null) window.clearTimeout(scanTimer.current);
    scanTimer.current = window.setTimeout(() => setScanActive(false), 1800);
  };

  if (!biome) return (
    <main className="discovery-mode discovery-select relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-24 lg:px-8">
      <header className="discovery-header"><button onClick={onBack}><ArrowLeft className="h-4 w-4" /> {tr("Modes", "โหมด")}</button><div><div className="command-kicker">{tr("Discovery network · Relaxed hidden-object mode", "เครือข่ายสำรวจ · เล่นสบาย ๆ")}</div><h1>{tr("Explore, spot signals, fill your journal.", "ออกสำรวจ หาสัญญาณ และเติมสมุดบันทึก")}</h1><p>{tr("There is no timer and no failure. Pick a biome, click six glowing signal markers, then claim the journal rewards.", "ไม่มีเวลาและไม่มีแพ้ เลือกพื้นที่ กดหาสัญญาณเรืองแสงให้ครบ 6 จุด แล้วรับรางวัล")}</p></div><div className="discovery-pilot"><img src={pilot.image} alt="" /><span>{pilot.name}<small>{gameState.modeRecords.discoveryFinds} {tr("total finds", "สิ่งที่พบ")}</small></span></div></header>
      <section className="discovery-how"><span><strong>1</strong><Compass className="h-4 w-4" /> {tr("Pick any biome", "เลือกพื้นที่")}</span><span><strong>2</strong><MousePointerClick className="h-4 w-4" /> {tr("Find all 6 glowing markers", "หาจุดเรืองแสงให้ครบ 6 จุด")}</span><span><strong>3</strong><Gift className="h-4 w-4" /> {tr("Claim journal rewards", "รับรางวัลจากสมุดบันทึก")}</span></section>
      <section className="discovery-run-guide"><div><BookOpen className="h-4 w-4" /><span>Why play Discovery?<strong>Learn Galia lore and earn crystals, XP, biome mastery, and PURI bond—with no timer or failure.</strong></span></div><div><Gift className="h-4 w-4" /><span>Campaign benefit<strong>{gameState.modeRecords.discoveryFinds >= 18 ? "Field Scanner unlocked: +10% Story companion chance" : `${gameState.modeRecords.discoveryFinds}/18 finds toward +10% Story companion chance`}</strong></span></div></section>
      <section className="discovery-biome-grid">
        {DISCOVERY_BIOMES.map((item) => { const mastery = gameState.modeRecords.discoveryMastery[item.id] || 0; return <button key={item.id} className={`discovery-biome discovery-biome--${item.accent}`} onClick={() => chooseBiome(item)}><img src={item.backdrop} alt="" /><i /><div><span>{item.subtitle}</span><h2>{item.name}</h2><p>{item.description}</p><strong><Compass className="h-4 w-4" /> Explore rotation</strong><small>{getMasteryTier(mastery)} · {mastery}/100 mastery</small></div></button>; })}
      </section>
    </main>
  );

  const currentMastery = gameState.modeRecords.discoveryMastery[biome.id] || 0;
  return (
    <main className="discovery-mode relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-24 lg:px-8">
      <header className="discovery-header"><button onClick={() => setBiome(null)}><ArrowLeft className="h-4 w-4" /> Biomes</button><div><div className="command-kicker">Discovery Run · {biome.name}</div><h1>Trace six signals{rareSignalActive ? " and a rare anomaly" : ""}.</h1><p>Each discovery reveals a fragment of the biome’s story. Scan charges expose difficult signals; rare anomalies are optional bonuses.</p></div><div className="discovery-pilot"><img src={pilot.image} alt="" /><span>{getMasteryTier(currentMastery)}<small>{found.length}/{points.length} discoveries</small></span></div></header>
      <section className="discovery-run-guide"><div><MousePointerClick className="h-4 w-4" /><span>Current task<strong>Log {Math.max(0, requiredFinds - found.filter((id) => id < requiredFinds).length)} more required signals{rareSignalActive && !found.includes(6) ? " · rare anomaly remains" : ""}</strong></span></div><div><Gift className="h-4 w-4" /><span>Journal reward<strong>+{Math.ceil(requiredFinds * puri.rewardMultiplier * modifiers.crystalMultiplier)} crystals · rare anomaly adds +{Math.ceil(puri.rewardMultiplier * modifiers.crystalMultiplier)}</strong></span></div><button onClick={scan} disabled={scanCharges <= 0 || scanActive}><ScanLine className="h-4 w-4" /> Scan field · {scanCharges} left</button></section>
      <section className="discovery-layout">
        <div className="discovery-scene"><img className="discovery-scene__backdrop" src={biome.backdrop} alt={`${biome.name} landscape`} /><div className="discovery-scene__wash" /><div className="discovery-scene__hint"><Leaf className="h-4 w-4" /> {puri.discoveryHint ? "PURI found a warm signal. Look for the pulsing marker!" : "Search the scene. Signals glow gently when you move near them."}</div>
          {points.map((item) => { const isFound = found.includes(item.id); const isRare = item.id >= requiredFinds; return <button key={item.id} aria-label={`Discover ${isRare ? "rare anomaly " : ""}${item.name}`} onClick={() => find(item)} className={`discovery-point ${isFound ? "is-found" : ""} ${isRare ? "is-rare" : ""} ${guidedId === item.id || (scanActive && !isFound) ? "is-guided" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%` }}>{isFound ? item.icon : isRare ? "✦" : "?"}</button>; })}
          {complete && <div className="discovery-complete"><Sparkles className="h-5 w-5" /> Rotation complete · +{masteryGain} mastery</div>}
        </div>
        <aside className="discovery-journal"><div className="discovery-journal__title"><BookOpen className="h-5 w-5" /><div><span>Field journal</span><strong>{biome.name} · Rotation {runNumber + 1}</strong></div></div>
          {selected ? <div className="discovery-journal__entry"><span>{selected.icon}</span><div className="command-kicker">Discovery logged</div><h2>{selected.name}</h2><p>{selected.lore}</p></div> : <div className="discovery-journal__empty"><span>✧</span><p>Select a glowing signal to record its story.</p></div>}
          <div className="discovery-journal__list">{points.map((item) => <div key={item.id} className={found.includes(item.id) ? "is-found" : ""}><span>{found.includes(item.id) ? item.icon : "?"}</span><strong>{found.includes(item.id) ? item.name : "Undiscovered"}</strong></div>)}</div>
          {complete && !claimed && <button className="discovery-claim" onClick={claim}>Claim journal rewards</button>}
          {claimed && <div className="discovery-claimed">+{crystalReward} crystals · +{found.length} XP · +{masteryGain} mastery</div>}
          <button className="discovery-reset" onClick={reset}><RotateCcw className="h-4 w-4" /> Start a new signal layout</button>
        </aside>
      </section>
      <ConfirmActionDialog action={confirmAction} onClose={() => setConfirmAction(null)} />
    </main>
  );
}
