import { ArrowRight, Crosshair, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { GameState, PLANETS, getFaction, getRank, getSectorLore, isPlanetUnlocked } from "@/lib/gameState";
import { getPilot, getTool } from "@/lib/loadouts";
import { useI18n } from "@/lib/i18n";

const BRIEFING_TH: Record<string, { chapter: string; story: string; threat: string; mission: string }> = {
  "sparkle-moon": { chapter: "บท 1 · แสงแรก", story: "สัญญาณขอความช่วยเหลือเก่ากำลังเรียกรหัสของกัปตันซ้ำไปมา", threat: "คลื่นพลังคริสตัล", mission: "เปิดสถานีส่งสัญญาณในอุโมงค์คริสตัลอีกครั้ง" },
  "candy-planet": { chapter: "บท 2 · สัญญาณมีชีวิต", story: "สัญญาณนี้มีชีวิต และกำลังชวนให้เราตามไป", threat: "สปอร์จำแลง", mission: "ตามรอยสิ่งมีชีวิตผ่านป่าปะการังเรืองแสง" },
  "frosty-star": { chapter: "บท 3 · รอยทางเยือกแข็ง", story: "แกนนำทางที่หายไปเก็บแผนที่ซึ่งถูกลบจากทุกคลังข้อมูล", threat: "ธารน้ำแข็งความเร็วสูง", mission: "ผ่านทางน้ำแข็งและนำแกนนำทางกลับมา" },
  "jungle-world": { chapter: "บท 4 · ผู้เฝ้ามอง", story: "มีใครบางคนปกป้องเส้นทางนี้มาก่อนที่ทั้งสามฝ่ายจะมาถึง", threat: "โดรนผู้พิทักษ์", mission: "หลบหน่วยลาดตระเวนใต้ป่าโบราณ" },
  "rainbow-nebula": { chapter: "บท 5 · ฟ้าที่แตกสลาย", story: "ทีมคู่แข่งกำลังแข่งกับเราเพื่อชิงกุญแจดวงดาว", threat: "พายุไอออน", mission: "เปิดโหนดบนเกาะลอยฟ้าก่อนพายุปิดทาง" },
  "bubbly-bay": { chapter: "บท 6 · ใต้หมู่ดาว", story: "หอดูดาวใต้น้ำกำลังชี้ไปยังพื้นที่ซึ่งไม่มีในแผนที่", threat: "คลื่นแรงดัน", mission: "ส่งพลังให้หอดูดาวใต้มหาสมุทรต่างดาว" },
  "cookie-crater": { chapter: "บท 7 · ฝนเพลิง", story: "กุญแจดวงดาวปลุกเครื่องจักรใต้พื้นผิวขึ้นมา", threat: "ฝูงอุกกาบาต", mission: "เก็บตัวปรับเสถียรและกลับยานก่อนพื้นถล่ม" },
  "starlight-shore": { chapter: "บท 8 · เส้นทางเมล็ดดาว", story: "เมล็ดดาวช่วยชายแดนได้ หรืออาจเปิดประตูสุดท้าย", threat: "กระแสแสง", mission: "ช่วยสัญญาณเพื่อนและเปิดโหนดทางออก" },
  "crystal-cave": { chapter: "บท 9 · สามคู่แข่ง", story: "ทั้งสามฝ่ายต้องเลือกว่าจะแข่งขันหรือร่วมกันเปิดประตู", threat: "ผู้พิทักษ์แห่งความว่าง", mission: "ชาร์จประตูแนวหน้าและยึดแกนคริสตัล" },
  "golden-galaxy": { chapter: "บท 10 · พ้นขอบแผนที่", story: "สัญญาณที่หายไปกำลังรอผู้พิทักษ์คนใหม่", threat: "ผู้เฝ้ามงกุฎ", mission: "เข้าสู่แกนออโรราและหาคำตอบสุดท้าย" },
};

const LEADER_TRANSMISSIONS = {
  mud: { name: "Commander Charon", image: "/assets/galia-current/mud-leader-charon-master-v2.webp" },
  oni: { name: "Pathfinder Vaor", image: "/assets/galia-plush-tech/canonical/oni-leader-master-v1.jpg" },
  ustur: { name: "Elder Opos", image: "/assets/galia-plush-tech/canonical/ustur-leader-master-v1.jpg" },
};

interface Props {
  gameState: GameState;
  controlledCount: number;
  activeIntelCount: number;
  onLaunch: (planetId: string) => void;
}

export default function CommandBriefing({ gameState, controlledCount, activeIntelCount, onLaunch }: Props) {
  const { tr, lang } = useI18n();
  const faction = getFaction(gameState.faction);
  const unlockedPlanets = PLANETS.filter((planet) => isPlanetUnlocked(planet, gameState.level, gameState.faction));
  const nextMission = PLANETS.find((planet) => isPlanetUnlocked(planet, gameState.level, gameState.faction) && !gameState.visitedPlanets.includes(planet.id))
    ?? unlockedPlanets[unlockedPlanets.length - 1]
    ?? PLANETS[0];
  const lore = getSectorLore(nextMission.id);
  const loreTh = BRIEFING_TH[nextMission.id];
  const rank = getRank(gameState.level);
  const campaignProgress = Math.round((gameState.visitedPlanets.length / PLANETS.length) * 100);
  const leader = gameState.faction ? LEADER_TRANSMISSIONS[gameState.faction] : LEADER_TRANSMISSIONS.mud;
  const activePilot = getPilot(gameState.activePilot);
  const activeTool = getTool(gameState.activeTool);

  return (
    <section className="command-briefing" aria-labelledby="command-briefing-title">
      <div className="command-briefing__signal" aria-hidden="true">
        <img src={leader.image} alt="" />
        <span className="command-briefing__signal-ring" />
      </div>

      <div className="command-briefing__copy">
        <div className="command-kicker"><Radio className="inline h-3 w-3" /> {leader.name} · {lang === "th" ? loreTh?.chapter : lore.chapter}</div>
        <h2 id="command-briefing-title">{tr("Captain, the frontier is calling.", "กัปตัน เราได้รับสัญญาณจากแนวหน้า")}</h2>
        <p>{lang === "th" ? loreTh?.story : lore.story}</p>
        <div className="command-briefing__chips">
          <span><Crosshair className="h-3.5 w-3.5" /> {lang === "th" ? loreTh?.threat : lore.threat}</span>
          <span><ShieldCheck className="h-3.5 w-3.5" /> {tr(`${faction?.name} expedition`, `ทีมสำรวจ ${faction?.name}`)}</span>
          <span><Sparkles className="h-3.5 w-3.5" /> {lang === "th" ? rank.nameTh : rank.name}</span>
          <span>🧑‍🚀 {activePilot.name}</span>
          <span>🛠️ {activeTool.name}</span>
        </div>
      </div>

      <div className="command-briefing__mission">
        <div className="command-briefing__mission-topline">
          <span>{tr("Recommended mission", "ภารกิจแนะนำ")}</span>
          <span>{tr(`${campaignProgress}% charted`, `สำรวจแล้ว ${campaignProgress}%`)}</span>
        </div>
        <div className="command-briefing__mission-title">
          <span className="text-3xl" aria-hidden="true">{nextMission.emoji}</span>
          <div>
            <strong>{lore.name}</strong>
            <small>{lang === "th" ? loreTh?.mission : lore.mission}</small>
          </div>
        </div>
        <button onClick={() => onLaunch(nextMission.id)}>
          {tr("Launch expedition", "เริ่มภารกิจ")} <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="command-briefing__telemetry" aria-label={tr("Campaign telemetry", "สรุปสถานการณ์")}>
        <div><strong>{gameState.visitedPlanets.length}/10</strong><span>{tr("signals traced", "สัญญาณที่ตามพบ")}</span></div>
        <div><strong>{controlledCount}</strong><span>{tr("sectors secured", "พื้นที่ที่ยึดได้")}</span></div>
        <div><strong>{activeIntelCount}</strong><span>{tr("rival contacts", "ความเคลื่อนไหวคู่แข่ง")}</span></div>
      </div>
    </section>
  );
}
