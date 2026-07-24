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
  const nextRequiredId = points.find((item) => item.id < requiredFinds && !found.includes(item.id))?.id;
  const guidedId = puri.discoveryHint ? points.find((item) => !found.includes(item.id))?.id : undefined;
  const crystalReward = Math.ceil(found.length * puri.rewardMultiplier * modifiers.crystalMultiplier);
  const masteryGain = complete ? 20 : found.length;

  useEffect(() => () => { if (scanTimer.current !== null) window.clearTimeout(scanTimer.current); }, []);

  const chooseBiome = (next: DiscoveryBiome) => { setBiome(next); setFound([]); setSelected(null); setClaimed(false); setScanCharges(3); };
  const find = (item: (typeof points)[number]) => {
    const isRequired = item.id < requiredFinds;
    if (isRequired && item.id !== nextRequiredId) return;
    if (!found.includes(item.id)) setFound((current) => [...current, item.id]);
    setSelected(item);
  };
  const claim = () => { if (claimed || !biome || !complete) return; setClaimed(true); onComplete({ biomeId: biome.id, finds: found.length, mastery: masteryGain }); };
  const performReset = () => {
    setRunNumber((value) => value + 1); setFound([]); setSelected(null); setClaimed(false); setScanCharges(3);
  };
  const reset = () => {
    if (found.length === 0 || claimed) return performReset();
    setConfirmAction({
      title: tr("Leave this unfinished journal?", "ออกจากสมุดบันทึกที่ยังไม่เสร็จไหม?"),
      description: tr(
        `${found.length}/${requiredFinds} required signals are logged. Unclaimed progress from this layout will be cleared.`,
        `บันทึกสัญญาณแล้ว ${found.length}/${requiredFinds} จุด หากเริ่มใหม่ ความคืบหน้ารอบนี้จะหายไป`,
      ),
      confirmLabel: tr("Start new layout", "เริ่มแผนที่ใหม่"),
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
      <section className="discovery-run-guide"><div><BookOpen className="h-4 w-4" /><span>{tr("Why play Discovery?", "เล่นโหมดสำรวจแล้วได้อะไร?")}<strong>{tr("Learn Galia lore and earn crystals, XP, biome mastery, and PURI bond—with no timer or failure.", "เรียนรู้เรื่องราวของกาเลีย พร้อมรับคริสตัล XP ค่าความชำนาญ และเพิ่มความสนิทกับ PURI โดยไม่มีเวลาและไม่มีแพ้")}</strong></span></div><div><Gift className="h-4 w-4" /><span>{tr("Campaign benefit", "โบนัสสำหรับเนื้อเรื่อง")}<strong>{gameState.modeRecords.discoveryFinds >= 18 ? tr("Field Scanner unlocked: +10% Story companion chance", "ปลดล็อกเครื่องสแกน: โอกาสเจอเพื่อนในเนื้อเรื่อง +10%") : tr(`${gameState.modeRecords.discoveryFinds}/18 finds toward +10% Story companion chance`, `พบแล้ว ${gameState.modeRecords.discoveryFinds}/18 จุด เพื่อรับโอกาสเจอเพื่อนในเนื้อเรื่อง +10%`)}</strong></span></div></section>
      <section className="discovery-biome-grid">
        {DISCOVERY_BIOMES.map((item) => { const mastery = gameState.modeRecords.discoveryMastery[item.id] || 0; return <button key={item.id} className={`discovery-biome discovery-biome--${item.accent}`} onClick={() => chooseBiome(item)}><img src={item.backdrop} alt={tr(`${item.name} landscape`, `พื้นที่ ${item.name}`)} /><i /><div><span>{item.subtitle}</span><h2>{item.name}</h2><p>{item.description}</p><strong><Compass className="h-4 w-4" /> {tr("Explore this area", "สำรวจพื้นที่นี้")}</strong><small>{getMasteryTier(mastery)} · {mastery}/100 {tr("mastery", "ความชำนาญ")}</small></div></button>; })}
      </section>
    </main>
  );

  const currentMastery = gameState.modeRecords.discoveryMastery[biome.id] || 0;
  return (
    <main className="discovery-mode relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-24 lg:px-8">
      <header className="discovery-header"><button onClick={() => setBiome(null)}><ArrowLeft className="h-4 w-4" /> {tr("Biomes", "พื้นที่สำรวจ")}</button><div><div className="command-kicker">{tr(`Discovery Run · ${biome.name}`, `ออกสำรวจ · ${biome.name}`)}</div><h1>{tr(`Follow the signal trail${rareSignalActive ? " and find the rare anomaly" : ""}.`, `ตามรอยสัญญาณ${rareSignalActive ? " และค้นหาสัญญาณหายาก" : ""}`)}</h1><p>{tr("Find the pulsing clue. Each clue unlocks the next one, so the trail is always easy to follow.", "หาจุดที่กำลังกะพริบ เมื่อเก็บได้ จุดถัดไปจะเปิดขึ้นมา ทำตามลำดับได้เลย")}</p></div><div className="discovery-pilot"><img src={pilot.image} alt="" /><span>{getMasteryTier(currentMastery)}<small>{found.length}/{points.length} {tr("discoveries", "สิ่งที่พบ")}</small></span></div></header>
      <section className="discovery-run-guide"><div><MousePointerClick className="h-4 w-4" /><span>{tr("Current clue", "เบาะแสตอนนี้")}<strong>{complete ? tr("Trail complete · claim your rewards", "ตามรอยครบแล้ว · รับรางวัลได้เลย") : tr(`Find pulsing clue ${found.filter((id) => id < requiredFinds).length + 1} of ${requiredFinds}`, `หาจุดกะพริบลำดับ ${found.filter((id) => id < requiredFinds).length + 1} จาก ${requiredFinds}`)}</strong></span></div><div><Gift className="h-4 w-4" /><span>{tr("Journal reward", "รางวัลสมุดบันทึก")}<strong>{tr(`+${Math.ceil(requiredFinds * puri.rewardMultiplier * modifiers.crystalMultiplier)} crystals${rareSignalActive ? ` · rare signal +${Math.ceil(puri.rewardMultiplier * modifiers.crystalMultiplier)}` : ""}`, `+${Math.ceil(requiredFinds * puri.rewardMultiplier * modifiers.crystalMultiplier)} คริสตัล${rareSignalActive ? ` · สัญญาณหายาก +${Math.ceil(puri.rewardMultiplier * modifiers.crystalMultiplier)}` : ""}`)}</strong></span></div><button onClick={scan} disabled={scanCharges <= 0 || scanActive}><ScanLine className="h-4 w-4" /> {tr(`Show clue · ${scanCharges} left`, `ช่วยหาจุด · เหลือ ${scanCharges} ครั้ง`)}</button></section>
      <section className="discovery-layout">
        <div className="discovery-scene"><img className="discovery-scene__backdrop" src={biome.backdrop} alt={tr(`${biome.name} landscape`, `พื้นที่ ${biome.name}`)} /><div className="discovery-scene__wash" /><div className="discovery-scene__hint"><Leaf className="h-4 w-4" /> {puri.discoveryHint ? tr("PURI found a warm signal. Look for the pulsing marker!", "PURI เจอสัญญาณแล้ว มองหาจุดที่กำลังกะพริบ!") : tr("Search the scene. Signals glow gently when you move near them.", "มองหาให้ทั่ว สัญญาณจะเรืองแสงเมื่อเข้าใกล้")}</div>
          {points.map((item) => { const isFound = found.includes(item.id); const isRare = item.id >= requiredFinds; const isLockedClue = !isRare && !isFound && item.id !== nextRequiredId; return <button key={item.id} aria-label={isLockedClue ? tr("Follow the pulsing clue first", "เก็บจุดที่กำลังกะพริบก่อน") : `Discover ${isRare ? "rare anomaly " : ""}${item.name}`} disabled={isLockedClue} onClick={() => find(item)} className={`discovery-point ${isFound ? "is-found" : ""} ${isRare ? "is-rare" : ""} ${isLockedClue ? "is-locked-clue" : ""} ${item.id === nextRequiredId || guidedId === item.id || (scanActive && !isFound) ? "is-guided" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%` }}>{isFound ? item.icon : isRare ? "✦" : "?"}</button>; })}
          {complete && <div className="discovery-complete"><Sparkles className="h-5 w-5" /> {tr(`Trail complete · +${masteryGain} mastery`, `ตามรอยครบแล้ว · ความชำนาญ +${masteryGain}`)}</div>}
        </div>
        <aside className="discovery-journal"><div className="discovery-journal__title"><BookOpen className="h-5 w-5" /><div><span>{tr("Field journal", "สมุดบันทึก")}</span><strong>{biome.name} · {tr(`Run ${runNumber + 1}`, `รอบ ${runNumber + 1}`)}</strong></div></div>
          {selected ? <div className="discovery-journal__entry"><span>{selected.icon}</span><div className="command-kicker">{tr("Discovery logged", "บันทึกแล้ว")}</div><h2>{selected.name}</h2><p>{selected.lore}</p></div> : <div className="discovery-journal__empty"><span>✧</span><p>{tr("Select a glowing signal to record its story.", "กดสัญญาณที่เรืองแสงเพื่อบันทึกเรื่องราว")}</p></div>}
          <div className="discovery-journal__list">{points.map((item) => <div key={item.id} className={found.includes(item.id) ? "is-found" : ""}><span>{found.includes(item.id) ? item.icon : "?"}</span><strong>{found.includes(item.id) ? item.name : tr("Undiscovered", "ยังไม่พบ")}</strong></div>)}</div>
          {complete && !claimed && <button className="discovery-claim" onClick={claim}>{tr("Claim journal rewards", "รับรางวัล")}</button>}
          {claimed && <div className="discovery-claimed">{tr(`+${crystalReward} crystals · +${found.length} XP · +${masteryGain} mastery`, `คริสตัล +${crystalReward} · XP +${found.length} · ความชำนาญ +${masteryGain}`)}</div>}
          <button className="discovery-reset" onClick={reset}><RotateCcw className="h-4 w-4" /> {tr("Start a new signal layout", "เริ่มแผนที่ใหม่")}</button>
        </aside>
      </section>
      <ConfirmActionDialog action={confirmAction} onClose={() => setConfirmAction(null)} />
    </main>
  );
}
