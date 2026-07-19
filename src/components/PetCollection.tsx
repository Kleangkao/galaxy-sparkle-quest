import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ALIEN_PETS, AlienPet, AlienEgg, getRarityBorder, getRarityBg, EGG_COLORS } from "@/lib/pets";
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
  const { t, lang } = useI18n();
  const ownedLower = ownedPets.map(p => p.toLowerCase());
  const [tab, setTab] = useState<"pets" | "eggs">("pets");
  const activeCompanion = ALIEN_PETS.find((pet) => activePet === pet.id || activePet === pet.name);

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center overflow-visible px-3 pb-24 pt-28 sm:px-6 sm:pb-28 sm:pt-32 md:px-8">
      <motion.button
        onClick={() => { playClickSound(); onBack(); }}
        whileTap={{ scale: 0.9 }}
        className="fixed left-4 top-20 z-[60] flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl border border-border/60 bg-card/92 px-4 py-2 text-foreground shadow-lg transition-all hover:bg-card active:scale-95 sm:top-20">
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-xs sm:text-sm font-bold" style={{ fontFamily: "var(--font-display)" }}>{t("galaxyMap")}</span>
      </motion.button>

      <div className="w-full max-w-lg mx-auto pb-4 sm:pb-6">
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-1 whitespace-nowrap text-center text-[clamp(1.125rem,4.2vw,3.75rem)] font-black tracking-[-0.03em] text-white"
          style={{ fontFamily: "var(--font-hero)" }}
        >
          {t("alienPetCollection")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xs sm:text-sm text-muted-foreground text-center mb-3"
        >
          {ownedLower.length}/{ALIEN_PETS.length} {t("discovered")}
        </motion.p>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-cosmic-green/15 bg-cosmic-green/5 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cosmic-green">Discovered</div>
            <div className="mt-1 text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{ownedLower.length}/{ALIEN_PETS.length}</div>
          </div>
          <div className="rounded-2xl border border-cosmic-pink/15 bg-cosmic-pink/5 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cosmic-pink">Egg Queue</div>
            <div className="mt-1 text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{eggs.length}</div>
          </div>
          <div className="rounded-2xl border border-cosmic-cyan/15 bg-cosmic-cyan/5 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cosmic-cyan">Active Companion</div>
            <div className="mt-1 text-[13px] font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              {activeCompanion ? `${activeCompanion.emoji} ${activeCompanion.name}` : "None equipped"}
            </div>
          </div>
        </div>

        {/* Tabs: Pets / Eggs */}
        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={() => { playClickSound(); setTab("pets"); }}
            className={`min-h-[44px] px-5 py-2 rounded-xl font-bold text-sm transition-all ${
              tab === "pets" ? "bg-primary text-primary-foreground shadow-lg" : "bg-card/60 text-muted-foreground hover:bg-card/80"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            🐾 {t("pets")}
          </button>
          <button
            onClick={() => { playClickSound(); setTab("eggs"); }}
            className={`min-h-[44px] px-5 py-2 rounded-xl font-bold text-sm transition-all relative ${
              tab === "eggs" ? "bg-primary text-primary-foreground shadow-lg" : "bg-card/60 text-muted-foreground hover:bg-card/80"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("eggs")}
            {eggs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cosmic-pink text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {eggs.length}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === "pets" ? (
            <motion.div key="pets" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {ownedLower.length === 0 && (
                <div className="mb-3 rounded-2xl border border-border/50 bg-card/30 px-4 py-3 text-center text-xs text-muted-foreground">
                  Your collection is empty right now. Replay sectors marked for pet recovery to fill this archive faster.
                </div>
              )}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {ALIEN_PETS.map((pet, i) => {
                  const owned = ownedLower.includes(pet.id) || ownedPets.some(p => p.toLowerCase() === pet.name.toLowerCase());
                  const isActive = activePet === pet.id || activePet === pet.name;
                  return (
                    <motion.div
                      key={pet.id}
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.06, type: "spring", stiffness: 200 }}
                      whileHover={owned ? { scale: 1.04, y: -4 } : undefined}
                      className={`relative rounded-xl sm:rounded-2xl border-2 p-3 sm:p-4 flex flex-col items-center gap-1.5 transition-all
                        ${owned ? getRarityBorder(pet.rarity) + " " + getRarityBg(pet.rarity) : "border-border/30 bg-card/30 opacity-50"}
                        ${isActive ? "ring-2 ring-cosmic-yellow ring-offset-1 ring-offset-background" : ""}
                      `}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <span className="absolute -top-2 -right-2 text-base bg-card rounded-full px-1.5 py-0.5 shadow-md border border-cosmic-yellow/50 text-cosmic-yellow font-bold text-[10px]">
                          {t("activePet")}
                        </span>
                      )}

                      {/* Pet emoji with animations */}
                      <motion.span
                        className={`flex h-20 w-full items-center justify-center overflow-hidden rounded-xl text-3xl sm:h-24 sm:text-4xl ${owned ? "" : "grayscale"}`}
                        animate={owned ? {
                          y: [0, -5, 0],
                          rotate: [0, 3, -3, 0],
                          scale: isActive ? [1, 1.1, 1] : 1,
                        } : {}}
                        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }}
                      >
                        {pet.image ? <img src={pet.image} alt={owned ? pet.name : "Undiscovered companion"} className="h-full w-full object-cover" /> : pet.emoji}
                      </motion.span>

                      <span className={`text-xs sm:text-sm font-bold ${owned ? pet.color : "text-muted-foreground"}`}
                        style={{ fontFamily: "var(--font-display)" }}>
                        {owned ? pet.name : "???"}
                      </span>

                      {/* Rarity badge */}
                      <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        owned
                          ? pet.rarity === "legendary"
                            ? "bg-cosmic-yellow/20 text-cosmic-yellow"
                            : pet.rarity === "rare"
                              ? "bg-cosmic-cyan/20 text-cosmic-cyan"
                              : "bg-muted/40 text-muted-foreground"
                          : "text-muted-foreground/50"
                      }`}>
                        {owned ? t(pet.rarity === "legendary" ? "rarityLegendary" : pet.rarity === "rare" ? "rarityRare" : "rarityCommon") : pet.rarity}
                      </span>

                      {/* Ability */}
                      {owned && (
                        <div className="flex items-center gap-1 bg-card/60 px-2 py-1 rounded-lg mt-0.5">
                          <span className="text-xs">{pet.ability.emoji}</span>
                          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                            {lang === "th" ? pet.ability.descTh : pet.ability.descEn}
                          </span>
                        </div>
                      )}

                      {/* Set Active button */}
                      {owned && !isActive && (
                        <motion.button
                          onClick={() => { playClickSound(); onSetActivePet(pet.id); }}
                          whileTap={{ scale: 0.9 }}
                          className="min-h-[36px] w-full px-2 py-1.5 rounded-lg bg-primary/80 text-primary-foreground text-[10px] sm:text-xs font-bold mt-1 hover:bg-primary transition-colors"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {t("setActivePet")}
                        </motion.button>
                      )}

                      {!owned && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground/50 text-center mt-1">
                          {t("explorePlanetsToFind")}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="eggs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {eggs.length === 0 ? (
                <div className="rounded-2xl border border-border/50 bg-card/30 py-12 text-center">
                  <span className="text-5xl mb-3 block">🥚</span>
                  <p className="text-sm text-muted-foreground">{t("noEggs")}</p>
                  <p className="mt-2 text-xs text-muted-foreground/80">
                    Survey runs and unexplored sectors are your best source of new egg scans.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {eggs.map((egg, i) => {
                    const colors = EGG_COLORS[egg.rarity];
                    return (
                      <motion.div
                        key={egg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`rounded-xl sm:rounded-2xl border-2 ${colors.border} ${colors.bg} ${colors.glow} p-4 flex flex-col items-center gap-2`}
                      >
                        <motion.span
                          className="text-4xl sm:text-5xl"
                          animate={{ rotate: [-3, 3, -3], y: [0, -3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          🥚
                        </motion.span>
                        <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          egg.rarity === "legendary" ? "bg-cosmic-yellow/20 text-cosmic-yellow" :
                          egg.rarity === "rare" ? "bg-cosmic-cyan/20 text-cosmic-cyan" :
                          "bg-muted/40 text-muted-foreground"
                        }`}>
                          {t(egg.rarity === "legendary" ? "legendaryEgg" : egg.rarity === "rare" ? "rareEgg" : "commonEgg")}
                        </span>
                        <motion.button
                          onClick={() => { playClickSound(); onHatchEgg(egg); }}
                          whileTap={{ scale: 0.9 }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="min-h-[40px] w-full px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-md"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {t("hatchEgg")} 🐣
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
