import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Egg, PawPrint, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { ALIEN_PETS, AlienEgg, EGG_COLORS } from "@/lib/pets";
import { playClickSound } from "@/lib/sounds";
import { useI18n } from "@/lib/i18n";

interface Props {
  ownedPets: string[];
  activePet: string | null;
  eggs: AlienEgg[];
  onBack: () => void;
  onSetActivePet: (petId: string) => void;
  onHatchEgg: (egg: AlienEgg) => void;
}

export default function PetCollection({ ownedPets, activePet, eggs, onBack, onSetActivePet, onHatchEgg }: Props) {
  const { tr, lang } = useI18n();
  const [tab, setTab] = useState<"archive" | "eggs">("archive");
  const owned = (petId: string, petName: string) => ownedPets.some((value) => value.toLowerCase() === petId || value.toLowerCase() === petName.toLowerCase());
  const illustrated = ALIEN_PETS.filter((pet) => pet.image);
  const ownedCount = ALIEN_PETS.filter((pet) => owned(pet.id, pet.name)).length;
  const active = ALIEN_PETS.find((pet) => activePet === pet.id || activePet === pet.name);
  const featured = (active?.image ? active : illustrated.find((pet) => owned(pet.id, pet.name))) ?? illustrated[0];

  return (
    <main className="relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <button onClick={() => { playClickSound(); onBack(); }} className="hangar-back">
        <ArrowLeft className="h-4 w-4" /> {tr("Galaxy map", "แผนที่กาเลีย")}
      </button>

      <div className="companion-archive">
        <section className="companion-archive__hero">
          <div className="companion-archive__visual">
            {featured?.image && <img src={featured.image} alt={featured.name} />}
          </div>
          <div className="companion-archive__copy">
            <div className="command-kicker"><Radio className="h-4 w-4" /> {tr("Companion Archive", "คลังเพื่อนร่วมทาง")}</div>
            <h1>{tr("Find a friend. Build a bond.", "ออกตามหา แล้วเติบโตไปด้วยกัน")}</h1>
            <p>{tr(
              "Companions are practical crew partners, not a separate sticker collection. Equip one ability for every activity and recover new signals through Story and Discovery.",
              "เพื่อนร่วมทางช่วยทีมได้จริง เลือกใช้ความสามารถได้ 1 อย่างในทุกโหมด และออกตามหาสัญญาณใหม่จากเนื้อเรื่องกับโหมดสำรวจ",
            )}</p>
            <div className="companion-archive__stats">
              <div><span>{tr("Archive records", "บันทึกที่พบ")}</span><strong>{ownedCount}/{ALIEN_PETS.length}</strong></div>
              <div><span>{tr("Egg signals", "ไข่ที่รอฟัก")}</span><strong>{eggs.length}</strong></div>
              <div><span>{tr("On your team", "กำลังร่วมทีม")}</span><strong>{active ? active.name : tr("Not selected", "ยังไม่ได้เลือก")}</strong></div>
            </div>
          </div>
        </section>

        <div className="mt-4 flex gap-2">
          <button onClick={() => setTab("archive")} className={`min-h-11 rounded-xl px-5 text-sm font-black ${tab === "archive" ? "bg-primary text-primary-foreground" : "bg-card/60 text-muted-foreground"}`}><PawPrint className="mr-2 inline h-4 w-4" />{tr("Known companions", "เพื่อนที่รู้จัก")}</button>
          <button onClick={() => setTab("eggs")} className={`min-h-11 rounded-xl px-5 text-sm font-black ${tab === "eggs" ? "bg-primary text-primary-foreground" : "bg-card/60 text-muted-foreground"}`}><Egg className="mr-2 inline h-4 w-4" />{tr(`Incubation (${eggs.length})`, `ห้องฟักไข่ (${eggs.length})`)}</button>
        </div>

        <AnimatePresence mode="wait">
          {tab === "archive" ? (
            <motion.section key="archive" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="companion-records">
                {illustrated.map((pet) => {
                  const isOwned = owned(pet.id, pet.name);
                  const isActive = activePet === pet.id || activePet === pet.name;
                  return (
                    <article className={`companion-record ${!isOwned ? "opacity-55" : ""}`} key={pet.id}>
                      <img src={pet.image} alt={isOwned ? pet.name : tr("Unknown companion signal", "สัญญาณเพื่อนที่ยังไม่รู้จัก")} className={!isOwned ? "grayscale" : ""} />
                      <div className="companion-record__copy">
                        <div className="command-kicker">{isActive ? tr("Active companion", "กำลังร่วมทีม") : isOwned ? tr("Archive confirmed", "บันทึกแล้ว") : tr("Signal not recovered", "ยังไม่พบสัญญาณ")}</div>
                        <h3>{isOwned ? pet.name : tr("UNKNOWN SIGNAL", "สัญญาณที่ยังไม่รู้จัก")}</h3>
                        <p>{isOwned ? (lang === "th" ? pet.ability.descTh : pet.ability.descEn) : tr("Find this companion during Story or Discovery.", "ตามหาได้จากเนื้อเรื่องหรือโหมดสำรวจ")}</p>
                        {isOwned && !isActive && <button onClick={() => onSetActivePet(pet.id)}>{tr("Add to active crew", "เลือกเข้าร่วมทีม")}</button>}
                        {isActive && <p className="!text-cosmic-green"><ShieldCheck className="mr-1 inline h-4 w-4" />{tr("Ability is active in supported modes", "ความสามารถพร้อมใช้ในโหมดที่รองรับ")}</p>}
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="companion-signals">
                <div className="flex items-center gap-2 text-sm font-black text-white"><Sparkles className="h-4 w-4 text-cosmic-cyan" />{tr("Uncharted companion signals", "สัญญาณเพื่อนที่ยังไม่ค้นพบ")}</div>
                <p className="mt-1 text-xs text-muted-foreground">{tr(
                  "The remaining companions stay encrypted until their final artwork and field record are ready. Their gameplay unlocks remain saved.",
                  "เพื่อนที่เหลือจะยังเป็นสัญญาณลับจนกว่าภาพและข้อมูลจะพร้อม ความคืบหน้าที่ปลดล็อกไว้ยังอยู่ครบ",
                )}</p>
                <div className="companion-signals__track" aria-label={tr(`${ALIEN_PETS.length - illustrated.length} unknown signals`, `สัญญาณที่ยังไม่รู้จัก ${ALIEN_PETS.length - illustrated.length} จุด`)}>
                  {ALIEN_PETS.slice(illustrated.length).map((pet) => <i key={pet.id} className={owned(pet.id, pet.name) ? "!bg-cosmic-green" : ""} />)}
                </div>
              </div>
            </motion.section>
          ) : (
            <motion.section key="eggs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {eggs.length === 0 ? <div className="col-span-full rounded-2xl border border-border/50 bg-card/30 p-10 text-center text-sm text-muted-foreground">{tr("No egg signals are waiting. Story and Discovery can uncover them.", "ตอนนี้ยังไม่มีไข่รอฟัก ลองตามหาจากเนื้อเรื่องหรือโหมดสำรวจ")}</div> : eggs.map((egg) => {
                const colors = EGG_COLORS[egg.rarity];
                return <article key={egg.id} className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-5`}>
                  <Egg className="h-12 w-12 text-cosmic-pink" />
                  <h2 className="mt-3 font-black text-white">{tr(`${egg.rarity} signal egg`, `ไข่สัญญาณระดับ ${egg.rarity}`)}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{tr("Hatch to identify the companion inside.", "ฟักเพื่อดูว่าเพื่อนตัวไหนอยู่ข้างใน")}</p>
                  <button onClick={() => onHatchEgg(egg)} className="mt-4 w-full rounded-xl bg-primary p-3 text-sm font-black text-primary-foreground">{tr("Begin hatching", "เริ่มฟักไข่")}</button>
                </article>;
              })}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
