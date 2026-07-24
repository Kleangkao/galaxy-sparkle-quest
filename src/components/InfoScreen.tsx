import { BookOpen, Gamepad2, HardDrive, HeartHandshake, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { GAME_VERSION, RELEASE_CHANNEL } from "@/lib/release";

const operatorFacts = [
  ["Accounts", "No account, name, email, chat, or profile upload is required.", "บัญชีผู้ใช้", "ไม่ต้องสมัครบัญชี ไม่ต้องกรอกชื่อ อีเมล แชต หรืออัปโหลดข้อมูลส่วนตัว"],
  ["Progress", "Game progress and settings are stored in this browser on this device.", "เซฟเกม", "ความคืบหน้าและการตั้งค่าจะเก็บไว้ในเบราว์เซอร์ของเครื่องนี้"],
  ["Backups", "Download or import a save file from Settings whenever you want.", "สำรองเซฟ", "ดาวน์โหลดหรือนำเข้าไฟล์เซฟได้ทุกเมื่อจากหน้าตั้งค่า"],
  ["Tracking", "The game does not include advertising, behavioral analytics, or a player feedback form.", "การติดตาม", "เกมไม่มีโฆษณา ไม่มีระบบติดตามพฤติกรรม และไม่มีแบบฟอร์มเก็บความคิดเห็น"],
];

const playFacts = [
  ["Story", "Move one tile at a time, complete the mission objective, then return to your ship.", "เนื้อเรื่อง", "เดินครั้งละ 1 ช่อง ทำเป้าหมายให้ครบ แล้วกลับไปที่ยาน"],
  ["Swarm", "Move with WASD or arrows. Shooting is automatic. Collect energy and choose perks.", "ฝ่าฝูงศัตรู", "ขยับด้วย WASD หรือปุ่มลูกศร ปืนยิงอัตโนมัติ เก็บพลังแล้วเลือกความสามารถ"],
  ["Arcade", "Aim with the mouse, click to shoot, and press R to reload.", "ยิงเป้า", "เล็งด้วยเมาส์ คลิกเพื่อยิง และกด R เพื่อเติมกระสุน"],
  ["Discovery", "Follow the pulsing clue until all six signals are recorded. There is no timer.", "สำรวจ", "ตามหาจุดที่กำลังกะพริบให้ครบ 6 จุด โหมดนี้ไม่มีเวลาจำกัด"],
  ["Control", "Choose a sector and spend every move to complete the short objective.", "วางแผน", "เลือกพื้นที่ แล้วใช้คำสั่งให้ครบเพื่อทำเป้าหมายสั้น ๆ"],
];

export default function InfoScreen() {
  const { lang, tr } = useI18n();
  return (
    <main className="info-center relative z-10 mx-auto min-h-screen max-w-6xl px-5 pb-28 pt-28 lg:px-8">
      <header className="info-center__hero">
        <div className="command-kicker"><Sparkles className="h-4 w-4" /> {tr("Player & parent information", "ข้อมูลสำหรับผู้เล่นและผู้ปกครอง")}</div>
        <h1>{tr("About Guardians of Galia", "เกี่ยวกับ Guardians of Galia")}</h1>
        <p>{tr("A free, cozy sci-fi game played directly on this website. No installation or account is needed.", "เกมไซไฟเล่นสบาย ๆ เล่นฟรีบนเว็บไซต์นี้ ไม่ต้องติดตั้งและไม่ต้องสมัครบัญชี")}</p>
        <span>{RELEASE_CHANNEL} · v{GAME_VERSION}</span>
      </header>

      <section className="info-center__panel">
        <div className="info-center__heading"><Gamepad2 /><div><span>{tr("Quick guide", "วิธีเล่นแบบสั้น")}</span><h2>{tr("Choose what you feel like playing", "เลือกโหมดที่อยากเล่นได้เลย")}</h2></div></div>
        <div className="info-center__list">{playFacts.map(([enTitle, enBody, thTitle, thBody]) => <article key={enTitle}><strong>{tr(enTitle, thTitle)}</strong><p>{tr(enBody, thBody)}</p></article>)}</div>
      </section>

      <section className="info-center__panel">
        <div className="info-center__heading"><ShieldCheck /><div><span>{tr("Privacy", "ความเป็นส่วนตัว")}</span><h2>{tr("Your game stays on this device", "เซฟเกมอยู่ในเครื่องนี้")}</h2></div></div>
        <div className="info-center__list">{operatorFacts.map(([enTitle, enBody, thTitle, thBody]) => <article key={enTitle}><strong>{tr(enTitle, thTitle)}</strong><p>{tr(enBody, thBody)}</p></article>)}</div>
        <div className="info-center__notice"><HardDrive /><p>{tr("Clearing browser data, using private browsing, or changing devices may remove local progress. Download a backup from Settings before doing so.", "ถ้าล้างข้อมูลเบราว์เซอร์ ใช้โหมดไม่ระบุตัวตน หรือเปลี่ยนเครื่อง เซฟอาจหายได้ ควรดาวน์โหลดไฟล์สำรองจากหน้าตั้งค่าก่อน")}</p></div>
      </section>

      <section className="info-center__grid">
        <article className="info-center__panel">
          <div className="info-center__heading"><HeartHandshake /><div><span>{tr("Safety & support", "ความปลอดภัยและการช่วยเหลือ")}</span><h2>{tr("No public communication", "ไม่มีการคุยกับคนแปลกหน้า")}</h2></div></div>
          <p>{tr("There is no chat, public profile, player-to-player messaging, purchasing, advertising, or user-generated content. For help, contact the person or Alice Arcade channel that shared the game. Children should not send names, school details, addresses, or other personal information.", "เกมไม่มีแชต โปรไฟล์สาธารณะ ข้อความระหว่างผู้เล่น การซื้อของ โฆษณา หรือเนื้อหาจากผู้เล่น หากต้องการความช่วยเหลือ ให้ติดต่อคนหรือช่อง Alice Arcade ที่ส่งเกมนี้มา เด็ก ๆ ไม่ควรส่งชื่อ โรงเรียน ที่อยู่ หรือข้อมูลส่วนตัว")}</p>
        </article>
        <article className="info-center__panel">
          <div className="info-center__heading"><Scale /><div><span>{tr("Credits & rights", "เครดิตและสิทธิ์การใช้งาน")}</span><h2>{tr("Original Galia game project", "โปรเจกต์เกม Galia")}</h2></div></div>
          <p>{tr("Guardians of Galia is an independent browser game by Alice Arcade. Selected sci-fi concept references are used with permission. Star Atlas and related marks belong to their respective owners; this game is not an official Star Atlas product. Source references and artist names are preserved in the project asset catalog.", "Guardians of Galia เป็นเกมบนเว็บของ Alice Arcade มีการใช้ภาพอ้างอิงไซไฟบางส่วนโดยได้รับอนุญาต ชื่อและเครื่องหมาย Star Atlas เป็นของเจ้าของสิทธิ์ เกมนี้ไม่ใช่ผลิตภัณฑ์ทางการของ Star Atlas และเก็บที่มาของภาพกับชื่อศิลปินไว้ในรายการแอสเซตของโปรเจกต์")}</p>
        </article>
      </section>

      <section className="info-center__panel">
        <div className="info-center__heading"><BookOpen /><div><span>{tr("Website-only release", "เล่นบนเว็บไซต์เท่านั้น")}</span><h2>{tr("Supported play", "รูปแบบที่รองรับ")}</h2></div></div>
        <p>{tr("The main release is designed for desktop browsers with a keyboard and mouse. Mobile layouts may open, but mobile gameplay is not yet the supported launch experience.", "เวอร์ชันหลักออกแบบสำหรับเว็บบนคอมพิวเตอร์ ใช้คีย์บอร์ดและเมาส์ มือถืออาจเปิดได้ แต่ยังไม่ใช่รูปแบบหลักที่รองรับในการเปิดตัวครั้งนี้")}</p>
        <small>{lang === "th" ? `เวอร์ชัน ${GAME_VERSION} · อัปเดตอัตโนมัติเมื่อโหลดหน้าเว็บใหม่` : `Version ${GAME_VERSION} · updates apply when the webpage reloads`}</small>
      </section>
    </main>
  );
}
