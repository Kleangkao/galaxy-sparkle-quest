import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Flag, Gauge, Heart, Radio, Rocket, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { GameState, INFLUENCE_TO_CAPTURE, PLANETS, getPlanetController, getSectorLore } from "@/lib/gameState";
import { useI18n } from "@/lib/i18n";

interface Props {
  gameState: GameState;
  onBack: () => void;
  onComplete: (result: { captures: number; objectiveComplete: boolean; influence: GameState["influence"] }) => void;
}

type RouteChoice = { planetIndex: number; signal: number; damage: number; kind: "safe" | "risk" };

const ROUTES: RouteChoice[][] = [
  [{ planetIndex: 1, signal: 22, damage: 0, kind: "safe" }, { planetIndex: 2, signal: 31, damage: 1, kind: "risk" }],
  [{ planetIndex: 3, signal: 24, damage: 0, kind: "safe" }, { planetIndex: 4, signal: 34, damage: 1, kind: "risk" }],
  [{ planetIndex: 5, signal: 25, damage: 0, kind: "safe" }, { planetIndex: 6, signal: 36, damage: 1, kind: "risk" }],
  [{ planetIndex: 7, signal: 27, damage: 0, kind: "safe" }, { planetIndex: 8, signal: 38, damage: 1, kind: "risk" }],
];

const cloneInfluence = (influence: GameState["influence"]): GameState["influence"] =>
  Object.fromEntries(Object.entries(influence).map(([id, values]) => [id, { ...values }]));

export default function FrontierControl({ gameState, onBack, onComplete }: Props) {
  const { tr } = useI18n();
  const faction = gameState.faction ?? "mud";
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [signal, setSignal] = useState(0);
  const [hull, setHull] = useState(3);
  const [route, setRoute] = useState<RouteChoice[]>([]);
  const [resolved, setResolved] = useState(false);
  const [claimed, setClaimed] = useState(false);
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
  const objectiveComplete = signal >= 95 && hull > 0 && step === ROUTES.length;

  const choose = (choice: RouteChoice) => {
    if (resolved || claimed || step >= ROUTES.length) return;
    const nextHull = Math.max(0, hull - choice.damage);
    const nextSignal = signal + choice.signal;
    const nextStep = step + 1;
    setRoute((current) => [...current, choice]);
    setHull(nextHull);
    setSignal(nextSignal);
    setStep(nextStep);
    if (nextHull <= 0 || nextStep >= ROUTES.length) setResolved(true);
  };

  const claim = () => {
    if (!resolved || claimed) return;
    setClaimed(true);
    onComplete({ captures, objectiveComplete, influence: workingInfluence });
  };

  if (!started) return (
    <main className="strategy-mode strategy-intro relative z-10 mx-auto min-h-screen max-w-5xl px-5 pb-28 pt-28 lg:px-8">
      <button className="strategy-intro__back" onClick={onBack}><ArrowLeft className="h-4 w-4" /> {tr("Modes", "โหมด")}</button>
      <div className="command-kicker">{tr("Frontier Relay · Four route decisions", "เส้นทางแนวหน้า · เลือกทาง 4 ครั้ง")}</div>
      <h1>{tr("Carry the signal across the frontier.", "ส่งสัญญาณให้ถึงแนวหน้า")}</h1>
      <p>{tr("Choose one of two sectors at each jump. Safe routes protect your hull; risky routes charge the signal faster. Finish with 95 signal and at least 1 hull.", "แต่ละช่วงเลือกได้ 2 ทาง ทางปลอดภัยช่วยรักษายาน ทางเสี่ยงเติมสัญญาณได้เร็วกว่า จบให้ได้ 95 สัญญาณ และเหลือพลังยานอย่างน้อย 1")}</p>
      <section className="strategy-how">
        <div><strong>1</strong><Rocket className="h-5 w-5" /><span>{tr("Choose four jumps", "เลือกเส้นทาง 4 ครั้ง")}<small>{tr("Only one route can be taken each turn.", "แต่ละครั้งเลือกได้เพียง 1 ทาง")}</small></span></div>
        <div><strong>2</strong><Gauge className="h-5 w-5" /><span>{tr("Reach 95 signal", "เก็บสัญญาณให้ถึง 95")}<small>{tr("Risky sectors charge more signal.", "ทางเสี่ยงให้สัญญาณมากกว่า")}</small></span></div>
        <div><strong>3</strong><Heart className="h-5 w-5" /><span>{tr("Keep hull above zero", "อย่าให้พลังยานหมด")}<small>{tr("Three risky routes will destroy the relay ship.", "เลือกทางเสี่ยง 3 ครั้ง ยานจะเสียหายจนหมด")}</small></span></div>
      </section>
      <button className="strategy-intro__start" onClick={() => setStarted(true)}><Sparkles className="h-4 w-4" /> {tr("Launch relay ship", "ปล่อยยานส่งสัญญาณ")}</button>
    </main>
  );

  const currentChoices = ROUTES[Math.min(step, ROUTES.length - 1)];
  return (
    <main className="strategy-mode relative z-10 mx-auto min-h-screen max-w-6xl px-5 pb-28 pt-28 lg:px-8">
      <header className="strategy-header"><button onClick={onBack}><ArrowLeft className="h-4 w-4" /> {tr("Modes", "โหมด")}</button><div><div className="command-kicker">{tr("Frontier Relay", "เส้นทางแนวหน้า")}</div><h1>{tr("Build the signal route", "สร้างเส้นทางส่งสัญญาณ")}</h1><p>{resolved ? tr("Route complete. Check the result and bank the flight.", "เดินทางจบแล้ว ตรวจผลและรับรางวัล") : tr(`Jump ${step + 1} of 4 · choose one sector`, `ช่วงที่ ${step + 1} จาก 4 · เลือก 1 พื้นที่`)}</p></div></header>

      <section className={`relay-status ${objectiveComplete ? "is-complete" : ""}`}>
        <div><Radio /><span>{tr("Signal charge", "พลังสัญญาณ")}<strong>{signal}/95</strong></span><i><b style={{ width: `${Math.min(100, signal / 95 * 100)}%` }} /></i></div>
        <div><Heart /><span>{tr("Relay hull", "พลังยาน")}<strong>{hull}/3</strong></span><i><b style={{ width: `${hull / 3 * 100}%` }} /></i></div>
      </section>

      <section className="relay-flight">
        <div className="relay-flight__trail">
          <span className="is-start"><Flag />{tr("Start", "เริ่ม")}</span>
          {route.map((choice, index) => <span key={`${choice.planetIndex}-${index}`} className={`is-${choice.kind}`}><Rocket />{getSectorLore(PLANETS[choice.planetIndex].id).name}<small>+{choice.signal}</small></span>)}
          {Array.from({ length: 4 - route.length }).map((_, index) => <span key={`empty-${index}`} className="is-empty">{index === 3 - route.length ? <Flag /> : <Radio />}</span>)}
        </div>

        {!resolved ? <div className="relay-choices">
          {currentChoices.map((choice) => {
            const planet = PLANETS[choice.planetIndex];
            return <button key={planet.id} className={`is-${choice.kind}`} onClick={() => choose(choice)}>
              <div>{choice.kind === "safe" ? <ShieldCheck /> : <TriangleAlert />}</div>
              <span>{tr(choice.kind === "safe" ? "Safe route" : "Risk route", choice.kind === "safe" ? "ทางปลอดภัย" : "ทางเสี่ยง")}</span>
              <h2>{planet.emoji} {getSectorLore(planet.id).name}</h2>
              <p>{choice.kind === "safe" ? tr("Stable corridor. No hull damage.", "เส้นทางนิ่ง ยานไม่เสียพลัง") : tr("Ion storm. Faster signal, but -1 hull.", "พายุไอออน สัญญาณแรงขึ้น แต่พลังยาน -1")}</p>
              <strong><Radio /> +{choice.signal} {tr("signal", "สัญญาณ")} {choice.damage ? `· -${choice.damage} ${tr("hull", "พลังยาน")}` : ""}</strong>
            </button>;
          })}
        </div> : <div className={`relay-result ${objectiveComplete ? "is-win" : "is-fail"}`}>
          {objectiveComplete ? <CheckCircle2 /> : <TriangleAlert />}
          <h2>{objectiveComplete ? tr("Signal delivered", "ส่งสัญญาณสำเร็จ") : tr("Signal route incomplete", "ส่งสัญญาณไม่สำเร็จ")}</h2>
          <p>{objectiveComplete ? tr("The frontier relay is online. Your chosen sectors gained faction influence.", "เครือข่ายแนวหน้าทำงานแล้ว พื้นที่ที่เลือกได้รับคะแนนฝ่าย") : hull <= 0 ? tr("The ship took too much damage. Mix safe and risky routes next time.", "ยานเสียหายมากเกินไป รอบหน้าลองสลับทางปลอดภัยกับทางเสี่ยง") : tr("The route needs 95 signal. Choose at least two risky sectors.", "ต้องมีสัญญาณ 95 ขึ้นไป ลองเลือกทางเสี่ยงอย่างน้อย 2 ครั้ง")}</p>
          {!claimed && <button onClick={claim}>{tr("Bank flight rewards", "รับรางวัลเที่ยวบิน")}</button>}
          {claimed && <strong>{tr("Flight saved · results ready", "บันทึกเที่ยวบินแล้ว")}</strong>}
        </div>}
      </section>
    </main>
  );
}
