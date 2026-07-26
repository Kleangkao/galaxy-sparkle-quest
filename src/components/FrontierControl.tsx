import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Flag, Gauge, Heart, Radio, Rocket, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { GameState, INFLUENCE_TO_CAPTURE, PLANETS, getPlanetController, getPlanetDisplayName } from "@/lib/gameState";
import { useI18n } from "@/lib/i18n";
import { getPuriBonuses } from "@/lib/puriBond";
import { getRelayMission, RelayRouteChoice } from "@/lib/strategyMissions";

interface Props {
  gameState: GameState;
  onBack: () => void;
  onComplete: (result: { captures: number; objectiveComplete: boolean; influence: GameState["influence"] }) => void;
}

const cloneInfluence = (influence: GameState["influence"]): GameState["influence"] =>
  Object.fromEntries(Object.entries(influence).map(([id, values]) => [id, { ...values }]));

export default function FrontierControl({ gameState, onBack, onComplete }: Props) {
  const { lang, tr } = useI18n();
  const faction = gameState.faction ?? "mud";
  const puri = getPuriBonuses(gameState.modeRecords.puriBond);
  const mission = getRelayMission(gameState.modeRecords.strategyCycles);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [signal, setSignal] = useState(0);
  const [hull, setHull] = useState(mission.startingHull);
  const [route, setRoute] = useState<RelayRouteChoice[]>([]);
  const [resolved, setResolved] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [puriShieldUsed, setPuriShieldUsed] = useState(false);
  const workingInfluence = useMemo(() => {
    const next = cloneInfluence(gameState.influence);
    route.forEach((choice) => {
      const planet = PLANETS[choice.planetIndex];
      next[planet.id] = { ...next[planet.id], [faction]: Math.min(INFLUENCE_TO_CAPTURE, next[planet.id][faction] + choice.signal) };
    });
    return next;
  }, [faction, gameState.influence, route]);
  const startControlled = Object.values(gameState.influence).filter((value) => getPlanetController(value) === faction).length;
  const controlledNow = Object.values(workingInfluence).filter((value) => getPlanetController(value) === faction).length;
  const captures = Math.max(0, controlledNow - startControlled);
  const objectiveComplete = signal >= mission.targetSignal && hull > 0 && step === mission.routes.length;

  const choose = (choice: RelayRouteChoice) => {
    if (resolved || claimed || step >= mission.routes.length) return;
    const shieldProtects = choice.kind === "risk" && puri.strategyActions > 0 && !puriShieldUsed;
    const actualDamage = shieldProtects ? 0 : choice.damage;
    const nextHull = Math.max(0, hull - actualDamage);
    const nextSignal = signal + choice.signal;
    const nextStep = step + 1;
    setRoute((current) => [...current, choice]);
    setHull(nextHull);
    setSignal(nextSignal);
    setStep(nextStep);
    if (shieldProtects) setPuriShieldUsed(true);
    if (nextHull <= 0 || nextStep >= mission.routes.length) setResolved(true);
  };

  const claim = () => {
    if (!resolved || claimed) return;
    setClaimed(true);
    onComplete({ captures, objectiveComplete, influence: workingInfluence });
  };

  if (!started) return (
    <main className={`strategy-mode strategy-intro relative z-10 mx-auto min-h-screen max-w-5xl px-5 pb-28 pt-28 lg:px-8 ${gameState.accessibility.effects === "reduced" ? "effects-reduced" : ""}`}>
      <button className="strategy-intro__back" onClick={onBack}><ArrowLeft className="h-4 w-4" /> {tr("Modes", "โหมด")}</button>
      <div className="command-kicker">{tr("Frontier Relay · Rotating route mission", "เส้นทางแนวหน้า · ภารกิจเปลี่ยนทุกรอบ")}</div>
      <h1>{lang === "th" ? mission.nameTh : mission.name}</h1>
      <p>{lang === "th" ? mission.descriptionTh : mission.description}</p>
      <section className="strategy-how">
        <div><strong>1</strong><Rocket className="h-5 w-5" /><span>{tr("Choose four jumps", "เลือกเส้นทาง 4 ครั้ง")}<small>{tr("Only one route can be taken each turn.", "แต่ละครั้งเลือกได้เพียง 1 ทาง")}</small></span></div>
        <div><strong>2</strong><Gauge className="h-5 w-5" /><span>{tr(`Plan for ${mission.recommendedRisks} risky jump${mission.recommendedRisks === 1 ? "" : "s"}`, `วางแผนใช้ทางเสี่ยง ${mission.recommendedRisks} ครั้ง`)}<small>{tr(`Reach ${mission.targetSignal} signal before the route ends.`, `ส่งสัญญาณให้ถึง ${mission.targetSignal} ก่อนจบเส้นทาง`)}</small></span></div>
        <div><strong>3</strong><Heart className="h-5 w-5" /><span>{tr("Bring the relay ship home", "พายานส่งสัญญาณกลับบ้าน")}<small>{tr(`The ship starts with ${mission.startingHull} hull. PURI may block one storm.`, `ยานเริ่มด้วยพลัง ${mission.startingHull} แต้ม และ PURI อาจกันพายุได้ 1 ครั้ง`)}</small></span></div>
      </section>
      <button className="strategy-intro__start" onClick={() => setStarted(true)}><Sparkles className="h-4 w-4" /> {tr("Launch relay ship", "ปล่อยยานส่งสัญญาณ")}</button>
    </main>
  );

  const currentChoices = mission.routes[Math.min(step, mission.routes.length - 1)];
  return (
    <main className={`strategy-mode relative z-10 mx-auto min-h-screen max-w-6xl px-5 pb-28 pt-28 lg:px-8 ${gameState.accessibility.effects === "reduced" ? "effects-reduced" : ""}`}>
      <header className="strategy-header"><button onClick={onBack}><ArrowLeft className="h-4 w-4" /> {tr("Modes", "โหมด")}</button><div><div className="command-kicker">{tr("Frontier Relay", "เส้นทางแนวหน้า")} · {lang === "th" ? mission.nameTh : mission.name}</div><h1>{tr("Build the signal route", "สร้างเส้นทางส่งสัญญาณ")}</h1><p>{resolved ? tr("Route complete. Check the result and bank the flight.", "เดินทางจบแล้ว ตรวจผลและรับรางวัล") : tr(`Jump ${step + 1} of ${mission.routes.length} · choose one sector`, `ช่วงที่ ${step + 1} จาก ${mission.routes.length} · เลือก 1 พื้นที่`)}</p></div></header>

      <section className={`relay-status ${objectiveComplete ? "is-complete" : ""}`}>
        <div><Radio /><span>{tr("Signal charge", "พลังสัญญาณ")}<strong>{signal}/{mission.targetSignal}</strong></span><i><b style={{ width: `${Math.min(100, signal / mission.targetSignal * 100)}%` }} /></i></div>
        <div><Heart /><span>{tr("Relay hull", "พลังยาน")}<strong>{hull}/{mission.startingHull}</strong></span><i><b style={{ width: `${hull / mission.startingHull * 100}%` }} /></i></div>
      </section>
      <div className="relay-forecast">
        <Radio className="h-4 w-4" />
        <span>{resolved
          ? tr("Route calculation complete", "คำนวณเส้นทางเสร็จแล้ว")
          : tr(`${Math.max(0, mission.targetSignal - signal)} signal still needed · ${mission.routes.length - step} jumps remain`, `ต้องการอีก ${Math.max(0, mission.targetSignal - signal)} สัญญาณ · เหลือ ${mission.routes.length - step} ช่วง`)}</span>
        {puri.strategyActions > 0 && <strong>{puriShieldUsed ? tr("PURI shield used", "ใช้เกราะ PURI แล้ว") : tr("PURI shield ready", "เกราะ PURI พร้อม")}</strong>}
      </div>

      <section className="relay-flight">
        <div className="relay-flight__trail">
          <span className="is-start"><Flag />{tr("Start", "เริ่ม")}</span>
          {route.map((choice, index) => <span key={`${choice.planetIndex}-${index}`} className={`is-${choice.kind} relay-flight__jump`}><Rocket />{getPlanetDisplayName(choice.planetIndex, faction)}<small>+{choice.signal}</small></span>)}
          {Array.from({ length: mission.routes.length - route.length }).map((_, index) => <span key={`empty-${index}`} className="is-empty">{index === mission.routes.length - route.length - 1 ? <Flag /> : <Radio />}</span>)}
        </div>

        {!resolved ? <div className="relay-choices">
          {currentChoices.map((choice) => {
            const planet = PLANETS[choice.planetIndex];
            return <button key={planet.id} className={`is-${choice.kind}`} onClick={() => choose(choice)}>
              <div>{choice.kind === "safe" ? <ShieldCheck /> : <TriangleAlert />}</div>
              <span>{tr(choice.kind === "safe" ? "Safe route" : "Risk route", choice.kind === "safe" ? "ทางปลอดภัย" : "ทางเสี่ยง")}</span>
              <h2>{planet.emoji} {getPlanetDisplayName(choice.planetIndex, faction)}</h2>
               <p>{choice.kind === "safe" ? tr("Stable corridor. No hull damage, but low signal.", "เส้นทางนิ่ง ยานไม่เสียพลัง แต่ได้สัญญาณน้อย") : puri.strategyActions > 0 && !puriShieldUsed ? tr("Ion storm. PURI will absorb this route's damage.", "พายุไอออน PURI จะกันความเสียหายครั้งนี้") : tr("Ion storm. Faster signal, but -1 hull.", "พายุไอออน สัญญาณแรงขึ้น แต่พลังยาน -1")}</p>
               <strong><Radio /> +{choice.signal} {tr("signal", "สัญญาณ")} {choice.damage ? `· ${puri.strategyActions > 0 && !puriShieldUsed ? tr("PURI protects", "PURI ป้องกัน") : `-${choice.damage} ${tr("hull", "พลังยาน")}`}` : ""}</strong>
            </button>;
          })}
        </div> : <div className={`relay-result ${objectiveComplete ? "is-win" : "is-fail"}`}>
          {objectiveComplete ? <CheckCircle2 /> : <TriangleAlert />}
          <h2>{objectiveComplete ? tr("Signal delivered", "ส่งสัญญาณสำเร็จ") : tr("Signal route incomplete", "ส่งสัญญาณไม่สำเร็จ")}</h2>
          <p>{objectiveComplete ? tr("The frontier relay is online. Your chosen sectors gained faction influence.", "เครือข่ายแนวหน้าทำงานแล้ว พื้นที่ที่เลือกได้รับคะแนนฝ่าย") : hull <= 0 ? tr("The ship took too much damage. Use more safe routes next time.", "ยานเสียหายมากเกินไป รอบหน้าเลือกทางปลอดภัยเพิ่มขึ้น") : tr(`The route needs ${mission.targetSignal} signal. Plan for ${mission.recommendedRisks} risky jump${mission.recommendedRisks === 1 ? "" : "s"}.`, `ต้องมีสัญญาณ ${mission.targetSignal} ขึ้นไป ลองวางแผนใช้ทางเสี่ยง ${mission.recommendedRisks} ครั้ง`)}</p>
          {!claimed && <button onClick={claim}>{tr("Bank flight rewards", "รับรางวัลเที่ยวบิน")}</button>}
          {claimed && <strong>{tr("Flight saved · results ready", "บันทึกเที่ยวบินแล้ว")}</strong>}
        </div>}
      </section>
    </main>
  );
}
