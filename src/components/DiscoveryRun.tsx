import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, BookOpen, Compass, Gift, Leaf, MousePointerClick, RotateCcw, ScanLine, Sparkles } from "lucide-react";
import { GameState, getGameplayModifiers } from "@/lib/gameState";
import { getPilot } from "@/lib/loadouts";
import { getPuriBonuses } from "@/lib/puriBond";
import { DISCOVERY_BIOMES, DiscoveryBiome, getDiscoveryClue, getDiscoveryDecoyId, getDiscoveryResearchChapter, getDiscoveryRotation, getMasteryTier } from "@/lib/discoveryBiomes";
import ConfirmActionDialog, { ConfirmAction } from "@/components/ConfirmActionDialog";
import { useI18n } from "@/lib/i18n";

interface Props {
  gameState: GameState;
  onActiveChange?: (active: boolean) => void;
  onBack: () => void;
  onComplete: (result: { biomeId: string; finds: number; mastery: number }) => void;
}

export default function DiscoveryRun({ gameState, onActiveChange, onBack, onComplete }: Props) {
  const { tr, lang } = useI18n();
  const pilot = getPilot(gameState.activePilot);
  const puri = getPuriBonuses(gameState.modeRecords.puriBond);
  const modifiers = getGameplayModifiers(gameState);
  const [biome, setBiome] = useState<DiscoveryBiome | null>(null);
  const [runNumber, setRunNumber] = useState(gameState.modeRecords.discoveryRuns);
  const rareSignalActive = Boolean(biome && (runNumber + DISCOVERY_BIOMES.findIndex((item) => item.id === biome.id)) % 3 === 2);
  const finds = useMemo(() => biome ? getDiscoveryRotation(biome, runNumber, 7) : [], [biome, runNumber]);
  const points = useMemo(() => finds.map((item, index) => ({ ...item, id: index, x: 9 + ((index * 31 + runNumber * 7 + 11) % 81), y: 15 + ((index * 37 + runNumber * 5 + 5) % 66) })), [finds, runNumber]);
  const [found, setFound] = useState<number[]>([]);
  const [selected, setSelected] = useState<(typeof points)[number] | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [scanCharges, setScanCharges] = useState(3);
  const [scanActive, setScanActive] = useState(false);
  const [wrongPick, setWrongPick] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const scanTimer = useRef<number | null>(null);
  const previousViewRef = useRef(`biomes:${runNumber}`);
  const requiredFinds = Math.min(6, points.length);
  const coreComplete = requiredFinds > 0 && found.filter((id) => id < requiredFinds).length === requiredFinds;
  const complete = coreComplete && (!rareSignalActive || found.includes(requiredFinds));
  const nextRequiredId = points.find((item) => item.id < requiredFinds && !found.includes(item.id))?.id;
  const nextTargetId = nextRequiredId ?? (rareSignalActive && coreComplete && !found.includes(requiredFinds) ? requiredFinds : undefined);
  const decoyId = getDiscoveryDecoyId(nextTargetId, points, found);
  const guidedId = puri.discoveryHint ? nextTargetId : undefined;
  const crystalReward = Math.ceil(found.length * puri.rewardMultiplier * modifiers.crystalMultiplier);
  const masteryGain = complete ? 20 : found.length;

  useEffect(() => () => { if (scanTimer.current !== null) window.clearTimeout(scanTimer.current); }, []);
  useEffect(() => {
    onActiveChange?.(Boolean(biome && !claimed));
    return () => onActiveChange?.(false);
  }, [biome, claimed, onActiveChange]);
  useEffect(() => {
    const viewKey = `${biome?.id ?? "biomes"}:${runNumber}`;
    if (previousViewRef.current !== viewKey) {
      window.scrollTo({ top: 0, behavior: "auto" });
      previousViewRef.current = viewKey;
    }
  }, [biome?.id, runNumber]);

  const chooseBiome = (next: DiscoveryBiome) => { setBiome(next); setFound([]); setSelected(null); setClaimed(false); setScanCharges(3); setWrongPick(null); };
  const find = (item: (typeof points)[number]) => {
    if (item.id !== nextTargetId) {
      setWrongPick(item.id);
      return;
    }
    if (!found.includes(item.id)) setFound((current) => [...current, item.id]);
    setWrongPick(null);
    setSelected(item);
  };
  const claim = () => { if (claimed || !biome || !complete) return; setClaimed(true); onComplete({ biomeId: biome.id, finds: found.length, mastery: masteryGain }); };
  const performReset = () => {
    setRunNumber((value) => value + 1); setFound([]); setSelected(null); setClaimed(false); setScanCharges(3); setWrongPick(null);
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
  const leaveBiome = () => {
    if (found.length === 0 || claimed) {
      setBiome(null);
      return;
    }
    setConfirmAction({
      title: tr("Leave this unfinished journal?", "ออกจากสมุดบันทึกที่ยังไม่เสร็จไหม?"),
      description: tr(
        `${found.length}/${requiredFinds} required signals are logged. Leaving now will clear this run's unclaimed progress.`,
        `บันทึกสัญญาณแล้ว ${found.length}/${requiredFinds} จุด หากออกตอนนี้ ความคืบหน้าที่ยังไม่ได้รับรางวัลจะหายไป`,
      ),
      confirmLabel: tr("Leave run", "ออกจากรอบ"),
      tone: "danger",
      onConfirm: () => setBiome(null),
    });
  };
  const scan = () => {
    if (scanCharges <= 0 || scanActive) return;
    setScanCharges((value) => value - 1);
    setScanActive(true);
    if (scanTimer.current !== null) window.clearTimeout(scanTimer.current);
    scanTimer.current = window.setTimeout(() => setScanActive(false), 1800);
  };
  const biomeName = biome ? (lang === "th" ? biome.nameTh : biome.name) : "";
  const coreFoundCount = found.filter((id) => id < requiredFinds).length;
  const nextPoint = nextTargetId === undefined ? undefined : points.find((point) => point.id === nextTargetId);
  const decoyPoint = decoyId === undefined ? undefined : points.find((point) => point.id === decoyId);
  const clueText = getDiscoveryClue(nextPoint, decoyPoint, coreFoundCount, lang);

  if (!biome) return (
    <main className="discovery-mode discovery-select relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <header className="discovery-header"><button onClick={onBack}><ArrowLeft className="h-4 w-4" /> {tr("Modes", "โหมด")}</button><div><div className="command-kicker">{tr("Discovery network · Relaxed clue mode", "เครือข่ายสำรวจ · ตามคำใบ้แบบสบาย ๆ")}</div><h1>{tr("Follow clues and fill your journal.", "ตามคำใบ้และเติมสมุดสำรวจ")}</h1><p>{tr("There is no timer and no failure. Each clue reveals two possible signals; choose the matching one and record six journal entries.", "ไม่มีเวลาและไม่มีแพ้ แต่ละคำใบ้จะเปิดสัญญาณให้เลือก 2 จุด เลือกจุดที่ตรงกับคำใบ้และเก็บบันทึกให้ครบ 6 รายการ")}</p></div><div className="discovery-pilot"><img src={pilot.image} alt="" /><span>{pilot.name}<small>{gameState.modeRecords.discoveryFinds} {tr("total finds", "สิ่งที่พบ")}</small></span></div></header>
      <section className="discovery-how"><span><strong>1</strong><Compass className="h-4 w-4" /> {tr("Pick any biome", "เลือกพื้นที่")}</span><span><strong>2</strong><MousePointerClick className="h-4 w-4" /> {tr("Read the clue · choose 1 of 2 signals", "อ่านคำใบ้ · เลือก 1 จาก 2 จุด")}</span><span><strong>3</strong><Gift className="h-4 w-4" /> {tr("Record 6 entries · claim rewards", "เก็บ 6 รายการ · รับรางวัล")}</span></section>
      <section className="discovery-run-guide"><div><BookOpen className="h-4 w-4" /><span>{tr("Why play Discovery?", "เล่นโหมดสำรวจแล้วได้อะไร?")}<strong>{tr("Learn Galia lore and earn crystals, XP, biome mastery, and PURI bond with no timer or failure.", "เรียนรู้เรื่องราวของกาเลีย พร้อมรับคริสตัล XP ค่าความชำนาญ และเพิ่มความสนิทกับ PURI โดยไม่จำกัดเวลา")}</strong></span></div><div><Gift className="h-4 w-4" /><span>{tr("Campaign benefit", "โบนัสสำหรับเนื้อเรื่อง")}<strong>{gameState.modeRecords.discoveryFinds >= 18 ? tr("Field Scanner unlocked: +10% Story companion chance", "ปลดล็อกเครื่องสแกน: โอกาสเจอเพื่อนในเนื้อเรื่อง +10%") : tr(`${gameState.modeRecords.discoveryFinds}/18 finds toward +10% Story companion chance`, `พบแล้ว ${gameState.modeRecords.discoveryFinds}/18 จุด เพื่อรับโอกาสเจอเพื่อนในเนื้อเรื่อง +10%`)}</strong></span></div></section>
      <section className="discovery-biome-grid">
        {DISCOVERY_BIOMES.map((item) => { const mastery = gameState.modeRecords.discoveryMastery[item.id] || 0; const name = lang === "th" ? item.nameTh : item.name; return <button key={item.id} className={`discovery-biome discovery-biome--${item.accent}`} onClick={() => chooseBiome(item)}><img src={item.backdrop} alt={tr(`${item.name} landscape`, `พื้นที่ ${item.nameTh}`)} /><i /><div><span>{lang === "th" ? item.subtitleTh : item.subtitle}</span><h2>{name}</h2><p>{lang === "th" ? item.descriptionTh : item.description}</p><strong><Compass className="h-4 w-4" /> {tr("Explore this area", "สำรวจพื้นที่นี้")}</strong><small>{getMasteryTier(mastery, lang)} · {mastery}/100 {tr("mastery", "ความชำนาญ")}</small></div></button>; })}
      </section>
    </main>
  );

  const currentMastery = gameState.modeRecords.discoveryMastery[biome.id] || 0;
  const researchChapter = getDiscoveryResearchChapter(currentMastery);
  const visibleJournalPoints = points.filter((item) => item.id < requiredFinds || rareSignalActive);
  return (
    <main className="discovery-mode relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <header className="discovery-header"><button onClick={leaveBiome}><ArrowLeft className="h-4 w-4" /> {tr("Biomes", "พื้นที่สำรวจ")}</button><div><div className="command-kicker">{tr(`Discovery Run · ${biome.name}`, `ออกสำรวจ · ${biome.nameTh}`)}</div><h1>{tr(`Follow the signal trail${rareSignalActive ? " and find the rare anomaly" : ""}.`, `ตามรอยสัญญาณ${rareSignalActive ? " และค้นหาสัญญาณหายาก" : ""}`)}</h1><p>{tr("Clues now rotate between map position, direction, and distance. A wrong guess has no penalty.", "คำใบ้จะสลับระหว่างตำแหน่ง ทิศทาง และระยะ ตอบผิดไม่เสียอะไร")}</p></div><div className="discovery-pilot"><img src={pilot.image} alt="" /><span>{getMasteryTier(currentMastery, lang)}<small>{tr(`Research level ${researchChapter}/5`, `ระดับสมุดสำรวจ ${researchChapter}/5`)}</small></span></div></header>
      <section className="discovery-run-guide"><div><MousePointerClick className="h-4 w-4" /><span>{tr("Current clue", "เบาะแสตอนนี้")}<strong>{complete ? tr("Trail complete · claim your rewards", "ตามรอยครบแล้ว · รับรางวัลได้เลย") : `${nextTargetId === requiredFinds ? tr("Rare signal", "สัญญาณหายาก") : tr(`Signal ${coreFoundCount + 1}/${requiredFinds}`, `สัญญาณ ${coreFoundCount + 1}/${requiredFinds}`)} · ${clueText}`}</strong></span></div><div><Gift className="h-4 w-4" /><span>{tr("Journal reward", "รางวัลสมุดบันทึก")}<strong>{tr(`+${Math.ceil(requiredFinds * puri.rewardMultiplier * modifiers.crystalMultiplier)} crystals${rareSignalActive ? ` · rare signal +${Math.ceil(puri.rewardMultiplier * modifiers.crystalMultiplier)}` : ""}`, `+${Math.ceil(requiredFinds * puri.rewardMultiplier * modifiers.crystalMultiplier)} คริสตัล${rareSignalActive ? ` · สัญญาณหายาก +${Math.ceil(puri.rewardMultiplier * modifiers.crystalMultiplier)}` : ""}`)}</strong></span></div><button onClick={scan} disabled={scanCharges <= 0 || scanActive}><ScanLine className="h-4 w-4" /> {tr(`Reveal answer · ${scanCharges} left`, `เฉลยจุด · เหลือ ${scanCharges} ครั้ง`)}</button></section>
      <section className="discovery-layout">
        <div className="discovery-scene"><img className="discovery-scene__backdrop" src={biome.backdrop} alt={tr(`${biome.name} landscape`, `พื้นที่ ${biome.nameTh}`)} /><div className="discovery-scene__wash" /><div className="discovery-scene__hint"><Leaf className="h-4 w-4" /> {wrongPick !== null ? tr("That signal does not match the clue. Try the other visible point.", "จุดนั้นไม่ตรงกับคำใบ้ ลองอีกจุดที่มองเห็นได้") : puri.discoveryHint ? tr("PURI is highlighting the correct signal.", "PURI กำลังช่วยไฮไลต์สัญญาณที่ถูกต้อง") : tr("Use the location clue above. Two signal points are visible.", "ดูคำใบ้ตำแหน่งด้านบน จะมีสัญญาณให้เลือก 2 จุด")}</div>
          {found.slice(1).map((id) => {
            const current = points[id];
            const previous = points[id - 1];
            if (!current || !previous || !found.includes(id - 1)) return null;
            const dx = current.x - previous.x;
            const dy = current.y - previous.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            return <i key={`trail-${id}`} className="discovery-trail-line" style={{ left: `${previous.x}%`, top: `${previous.y}%`, width: `${length}%`, transform: `rotate(${angle}deg)` }} />;
          })}
          {points.map((item) => { const isFound = found.includes(item.id); const isRare = item.id >= requiredFinds; const isCandidate = item.id === nextTargetId || item.id === decoyId; const isLockedClue = !isFound && ((!isRare && !isCandidate) || (isRare && (coreComplete ? !rareSignalActive : item.id !== decoyId))); const itemName = lang === "th" ? item.nameTh : item.name; return <button key={item.id} aria-label={isLockedClue ? tr("Signal locked until the next clue", "สัญญาณยังล็อกอยู่จนกว่าจะถึงคำใบ้ถัดไป") : tr(`Discover ${isRare ? "rare anomaly " : ""}${item.name}`, `สำรวจ${isRare ? "สัญญาณหายาก " : ""}${item.nameTh}`)} disabled={isLockedClue} onClick={() => find(item)} className={`discovery-point ${isFound ? "is-found" : ""} ${isRare ? "is-rare" : ""} ${isLockedClue ? "is-locked-clue" : ""} ${guidedId === item.id || (scanActive && item.id === nextTargetId) ? "is-guided" : ""} ${wrongPick === item.id ? "is-wrong" : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%` }} title={isFound ? itemName : undefined}>{isFound ? item.icon : isRare && coreComplete ? "✦" : "?"}</button>; })}
          {complete && <div className="discovery-complete"><Sparkles className="h-5 w-5" /> {tr(`Trail complete · +${masteryGain} mastery`, `ตามรอยครบแล้ว · ความชำนาญ +${masteryGain}`)}</div>}
        </div>
        <aside className="discovery-journal"><div className="discovery-journal__title"><BookOpen className="h-5 w-5" /><div><span>{tr("Field journal", "สมุดบันทึก")}</span><strong>{biomeName} · {tr(`Run ${runNumber + 1}`, `รอบ ${runNumber + 1}`)}</strong></div></div>
          {selected ? <div className="discovery-journal__entry"><span>{selected.icon}</span><div className="command-kicker">{tr("Discovery logged", "บันทึกแล้ว")}</div><h2>{lang === "th" ? selected.nameTh : selected.name}</h2><p>{lang === "th" ? selected.loreTh : selected.lore}</p></div> : <div className="discovery-journal__empty"><span>✧</span><p>{tr("Use the clue and select one of the two visible signals.", "ดูคำใบ้แล้วเลือกสัญญาณที่มองเห็น 1 จาก 2 จุด")}</p></div>}
          <div className="discovery-journal__list">{visibleJournalPoints.map((item) => <div key={item.id} className={found.includes(item.id) ? "is-found" : ""}><span>{found.includes(item.id) ? item.icon : "?"}</span><strong>{found.includes(item.id) ? (lang === "th" ? item.nameTh : item.name) : item.id >= requiredFinds ? tr("Rare anomaly", "สัญญาณหายาก") : tr("Undiscovered", "ยังไม่พบ")}</strong></div>)}</div>
          {complete && !claimed && <button className="discovery-claim" onClick={claim}>{tr("Claim journal rewards", "รับรางวัล")}</button>}
          {claimed && <div className="discovery-claimed">{tr(`+${crystalReward} crystals · +${found.length} XP · +${masteryGain} mastery`, `คริสตัล +${crystalReward} · XP +${found.length} · ความชำนาญ +${masteryGain}`)}</div>}
          <button className="discovery-reset" onClick={reset}><RotateCcw className="h-4 w-4" /> {tr("Start a new signal layout", "เริ่มแผนที่ใหม่")}</button>
        </aside>
      </section>
      <ConfirmActionDialog action={confirmAction} onClose={() => setConfirmAction(null)} />
    </main>
  );
}
