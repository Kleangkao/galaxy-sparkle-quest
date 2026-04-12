import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { MISSION_BRIEFS } from "@/lib/missionBriefs";

const EN_SECTIONS = [
  {
    title: "Mission Mechanics",
    bullets: [
      "🧱 Walls block movement and force route planning.",
      "⚡ Hazard zones damage HP when stepped on.",
      "👾 Enemies roam and punish slow, cornered routes.",
      "🌀 Speed and slippery tiles change movement distance and timing.",
      "📦 Delivery zones and 🛸 teleports appear on late-stage sectors.",
    ],
  },
  {
    title: "Replay System",
    bullets: [
      "Survey runs trade lower core rewards for repeat utility.",
      "Egg scans improve on replayed sectors.",
      "Missing pets can still be recovered on repeat runs.",
    ],
  },
  {
    title: "Faction System",
    bullets: [
      "Local control tracks which faction currently holds a sector.",
      "Faction influence grows after missions and async simulation updates.",
      "Controlled sectors count toward your expedition footprint.",
    ],
  },
  {
    title: "Intel System",
    bullets: [
      "Active Intel means rival movement has been detected.",
      "Quiet sectors have little or no recent faction pressure.",
      "Sector status updates between runs, not from live PvP.",
    ],
  },
  {
    title: "Rewards",
    bullets: [
      "Crystals and XP scale by sector difficulty and mission result.",
      "Replay runs keep utility value even when core rewards are reduced.",
      "Pet discovery is tied to sector-specific replay and egg loops.",
    ],
  },
  {
    title: "Pets",
    bullets: [
      "Archived pets stay in your collection permanently.",
      "Missing pets can reappear through replay and egg systems.",
      "Active companions give passive expedition bonuses.",
    ],
  },
  {
    title: "Simulation",
    bullets: [
      "Rival factions progress asynchronously in the background.",
      "Momentum and catch-up pressure keep sector control moving.",
      "The world feels alive without needing live multiplayer sessions.",
    ],
  },
];

const TH_SECTIONS = [
  {
    title: "กลไกภารกิจใหม่",
    bullets: [
      "🧱 กำแพงจะบล็อกเส้นทางและบังคับให้วางแผนเดิน",
      "⚡ โซนอันตรายทำให้ HP ลดเมื่อเหยียบ",
      "👾 ศัตรูจะเดินกดดัน ถ้าช้าหรือเข้ามุมจะเสี่ยงมากขึ้น",
      "🌀 พื้นเร่งความเร็วและพื้นลื่นทำให้ระยะเดินเปลี่ยน",
      "📦 ด่านท้ายจะมีจุดส่งของ และ 🛸 จุดวาร์ปเพิ่มเข้ามา",
    ],
  },
  {
    title: "ระบบการเล่นซ้ำ",
    bullets: [
      "รอบสำรวจซ้ำจะลดรางวัลหลัก แต่ยังมีคุณค่าด้านการฟาร์มต่อเนื่อง",
      "การสแกนหาไข่ดีขึ้นเมื่อเล่นด่านเดิมซ้ำ",
      "สัตว์เลี้ยงที่ยังขาดสามารถกลับมาเจอได้จากการเล่นซ้ำ",
    ],
  },
  {
    title: "ระบบฝ่าย",
    bullets: [
      "การควบคุมพื้นที่บอกว่าฝ่ายไหนครองเซกเตอร์อยู่ตอนนี้",
      "อิทธิพลของฝ่ายจะเพิ่มหลังภารกิจและจากการจำลองแบบอะซิงก์",
      "เซกเตอร์ที่ยึดได้จะนับเป็นพื้นที่ของคณะสำรวจคุณ",
    ],
  },
  {
    title: "ระบบข่าวกรอง",
    bullets: [
      "Active Intel หมายถึงมีความเคลื่อนไหวของฝ่ายคู่แข่ง",
      "Quiet Sector คือพื้นที่ที่ยังแทบไม่มีแรงกดดันจากฝ่ายอื่น",
      "สถานะของเซกเตอร์จะอัปเดตระหว่างรอบ ไม่ใช่ PvP แบบสด",
    ],
  },
  {
    title: "รางวัล",
    bullets: [
      "คริสตัลและ XP จะโตตามความยากของเซกเตอร์และผลภารกิจ",
      "รอบเล่นซ้ำยังคุ้มในเชิงระบบ แม้รางวัลหลักจะลดลง",
      "การค้นพบสัตว์เลี้ยงเชื่อมกับการเล่นซ้ำและระบบไข่",
    ],
  },
  {
    title: "สัตว์เลี้ยง",
    bullets: [
      "สัตว์เลี้ยงที่เก็บแล้วจะอยู่ในคอลเลกชันถาวร",
      "ตัวที่ยังขาดสามารถกลับมาเจอได้ผ่าน replay และ eggs",
      "เพื่อนคู่ใจที่ใช้งานอยู่จะให้โบนัสแบบติดตัว",
    ],
  },
  {
    title: "การจำลองโลก",
    bullets: [
      "ฝ่ายคู่แข่งจะเดินเกมต่อเองแบบอะซิงก์อยู่เบื้องหลัง",
      "ระบบ momentum และ catch-up pressure ช่วยให้แผนที่ยังขยับ",
      "โลกดูมีชีวิตโดยไม่ต้องเป็นออนไลน์สดตลอดเวลา",
    ],
  },
];

export default function InfoScreen() {
  const { lang } = useI18n();
  const sections = useMemo(() => (lang === "th" ? TH_SECTIONS : EN_SECTIONS), [lang]);
  const missionRows = useMemo(
    () =>
      Object.values(MISSION_BRIEFS).map((brief, idx) => ({
        level: idx + 1,
        ...brief,
      })),
    [],
  );

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-3 pb-24 pt-28 sm:gap-6 sm:px-6 sm:pb-28 sm:pt-32 md:px-8">
      <div className="mx-auto w-full max-w-5xl rounded-[1.75rem] border border-border/50 bg-card/35 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-5">
        <div className="mb-5">
          <h1 className="text-3xl font-black tracking-[-0.03em] text-white sm:text-4xl md:text-5xl lg:text-6xl" style={{ fontFamily: "var(--font-hero)" }}>
            System Info
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Game screen is for deciding and playing. This screen is for reading and understanding the systems.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-border/50 bg-background/20 p-4">
              <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {section.title}
              </h2>
              <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                {section.bullets.map((bullet) => (
                  <p key={bullet} className="leading-relaxed">
                    {bullet}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-border/50 bg-background/20 p-4">
          <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {lang === "th" ? "คู่มือด่าน 1-10 แบบสั้น" : "Level 1-10 Quick Guide"}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {missionRows.map((row) => (
              <div key={row.title} className="rounded-xl border border-border/40 bg-background/20 p-3">
                <p className="text-xs font-bold text-cosmic-cyan">Lv.{row.level} - {row.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{row.encounters}</p>
                <p className="mt-1 text-xs text-cosmic-green">{lang === "th" ? "วิธีรับมือ: " : "Handle: "}{row.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
