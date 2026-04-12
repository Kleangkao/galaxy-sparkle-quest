import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlienEgg, AlienPet, EGG_COLORS, hatchEgg, getRarityBorder, getRarityBg } from "@/lib/pets";
import { playClickSound } from "@/lib/sounds";
import { useI18n } from "@/lib/i18n";

interface Props {
  egg: AlienEgg;
  ownedPets: string[];
  onResolved: (pet: AlienPet | null) => void;
  onClose: () => void;
}

type Phase = "found" | "hatching" | "reveal";

export default function EggHatchOverlay({ egg, ownedPets, onResolved, onClose }: Props) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("found");
  const [revealedPet, setRevealedPet] = useState<AlienPet | null>(null);
  const colors = EGG_COLORS[egg.rarity];

  const handleTapEgg = () => {
    playClickSound();
    setPhase("hatching");
    // After shake animation, reveal
    setTimeout(() => {
      const pet = hatchEgg(egg, ownedPets);
      setRevealedPet(pet);
      setPhase("reveal");
      onResolved(pet);
    }, 1800);
  };

  const handleDone = () => {
    playClickSound();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
    >
      <AnimatePresence mode="wait">
        {/* Phase 1: Egg found */}
        {phase === "found" && (
          <motion.div
            key="found"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center gap-4 max-w-xs"
          >
            <motion.p
              className="text-lg sm:text-xl font-extrabold text-foreground text-center"
              style={{ fontFamily: "var(--font-display)" }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {t("foundAlienEgg")}
            </motion.p>

            {/* Egg with sparkles */}
            <motion.div
              className="relative"
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Sparkles around egg */}
              {[...Array(6)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-lg"
                  style={{
                    left: `${50 + 45 * Math.cos((i * Math.PI * 2) / 6)}%`,
                    top: `${50 + 45 * Math.sin((i * Math.PI * 2) / 6)}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }}
                >
                  ✨
                </motion.span>
              ))}
              <div className={`w-28 h-36 sm:w-32 sm:h-40 rounded-[50%] ${colors.bg} border-2 ${colors.border} ${colors.glow} flex items-center justify-center`}>
                <span className="text-6xl sm:text-7xl">🥚</span>
              </div>
            </motion.div>

            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              egg.rarity === "legendary" ? "bg-cosmic-yellow/20 text-cosmic-yellow" :
              egg.rarity === "rare" ? "bg-cosmic-cyan/20 text-cosmic-cyan" :
              "bg-muted/40 text-muted-foreground"
            }`}>
              {t(egg.rarity === "legendary" ? "legendaryEgg" : egg.rarity === "rare" ? "rareEgg" : "commonEgg")}
            </span>

            <motion.button
              onClick={handleTapEgg}
              whileTap={{ scale: 0.9 }}
              className="min-h-[52px] px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg"
              style={{ fontFamily: "var(--font-display)" }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {t("tapToHatch")}
            </motion.button>
          </motion.div>
        )}

        {/* Phase 2: Hatching */}
        {phase === "hatching" && (
          <motion.div
            key="hatching"
            initial={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{
                rotate: [-8, 8, -12, 12, -15, 15, 0],
                scale: [1, 1.05, 1, 1.1, 1, 1.15, 1.3],
              }}
              transition={{ duration: 1.8, ease: "easeInOut" }}
            >
              <div className={`w-28 h-36 sm:w-32 sm:h-40 rounded-[50%] ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}>
                <span className="text-6xl sm:text-7xl">🥚</span>
              </div>
            </motion.div>
            {/* Crack lines */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 1] }}
              transition={{ duration: 1.8 }}
              className="text-2xl"
            >
              💥
            </motion.div>
          </motion.div>
        )}

        {/* Phase 3: Reveal */}
        {phase === "reveal" && (
          <motion.div
            key="reveal"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex flex-col items-center gap-4 max-w-xs"
          >
            {/* Flash */}
            <motion.div
              initial={{ opacity: 1, scale: 0.5 }}
              animate={{ opacity: 0, scale: 3 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none absolute h-32 w-32 rounded-full bg-cosmic-yellow/30 blur-2xl"
            />

            <motion.p
              className="text-lg sm:text-xl font-extrabold text-foreground text-center"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {revealedPet ? t("newAlienFriend") : t("eggEmpty")}
            </motion.p>

            {revealedPet ? (
              <>
                {/* Celebration sparkles */}
                {[...Array(8)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="pointer-events-none absolute text-xl"
                    initial={{ opacity: 1, x: 0, y: 0 }}
                    animate={{
                      opacity: 0,
                      x: (Math.random() - 0.5) * 200,
                      y: (Math.random() - 0.5) * 200,
                    }}
                    transition={{ duration: 1.2, delay: i * 0.1 }}
                  >
                    {["🎉", "⭐", "✨", "🌟", "💫"][i % 5]}
                  </motion.span>
                ))}

                <motion.div
                  animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ${getRarityBg(revealedPet.rarity)} border-2 ${getRarityBorder(revealedPet.rarity)} flex items-center justify-center`}
                >
                  <span className="text-5xl sm:text-6xl">{revealedPet.emoji}</span>
                </motion.div>

                <span className={`text-base sm:text-lg font-bold ${revealedPet.color}`} style={{ fontFamily: "var(--font-display)" }}>
                  {revealedPet.name}
                </span>
                <span className="text-xs text-muted-foreground">{revealedPet.species}</span>
                <div className="flex items-center gap-1.5 bg-card/60 px-3 py-1.5 rounded-xl">
                  <span>{revealedPet.ability.emoji}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {revealedPet.ability.descEn}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-4xl">💨</span>
            )}

            <motion.button
              onClick={handleDone}
              whileTap={{ scale: 0.9 }}
              className="min-h-[52px] px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg mt-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("continueBtn")}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
