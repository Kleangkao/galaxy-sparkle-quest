import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playVictorySound, playPetDiscoverySound, playCrystalSound } from "@/lib/sounds";
import { useI18n } from "@/lib/i18n";

const CONFETTI = ["🌟", "⭐", "✨", "💎", "🎉", "🎊", "💫", "🪐", "🦋", "🌈", "🔮", "💖"];

interface Props {
  xp: number;
  crystals: number;
  petName: string | null;
  petEmoji: string | null;
  faction: string | null;
  onDone: () => void;
}

export default function CelebrationScreen({ xp, crystals, petName, petEmoji, faction, onDone }: Props) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [showPet, setShowPet] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [crystalCount, setCrystalCount] = useState(0);
  const [xpCount, setXpCount] = useState(0);

  useEffect(() => {
    playVictorySound();
    const timers = [
      setTimeout(() => setShow(true), 200),
      setTimeout(() => { setShowRewards(true); playCrystalSound(); }, 900),
      setTimeout(() => {
        setShowPet(true);
        if (petName) playPetDiscoverySound();
      }, 1600),
      setTimeout(() => setShowButton(true), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [petName]);

  useEffect(() => {
    if (!showRewards) return;
    const dur = 800;
    const steps = 20;
    const interval = dur / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCrystalCount(Math.round((step / steps) * crystals));
      setXpCount(Math.round((step / steps) * xp));
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [showRewards, crystals, xp]);

  const confettiRain = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i, x: Math.random() * 100,
      emoji: CONFETTI[Math.floor(Math.random() * CONFETTI.length)],
      delay: Math.random() * 3, duration: 2.5 + Math.random() * 2,
      size: 0.7 + Math.random() * 0.8, spin: Math.random() > 0.5 ? 1 : -1,
    })), []);

  const rings = useMemo(() =>
    Array.from({ length: 3 }, (_, i) => ({
      id: i, delay: i * 0.4,
      color: ["hsl(45 95% 60% / 0.3)", "hsl(280 80% 65% / 0.2)", "hsl(190 90% 55% / 0.2)"][i],
    })), []);

  const flyingCrystals = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i, startX: 40 + Math.random() * 20, startY: 55 + Math.random() * 10, delay: 0.9 + i * 0.12,
    })), []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-4 bg-background/85 backdrop-blur-lg overflow-hidden">
      {/* Confetti rain */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confettiRain.map((p) => (
          <div key={p.id} className="absolute"
            style={{ left: `${p.x}%`, top: "-5%", fontSize: `${p.size}rem`,
              animation: `confetti-rain ${p.duration}s ${p.delay}s ease-in forwards`,
              "--spin": p.spin } as React.CSSProperties}>
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Expanding rings */}
      {show && rings.map((r) => (
        <motion.div key={r.id}
          initial={{ scale: 0.3, opacity: 0.8 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 2, delay: r.delay, ease: "easeOut", repeat: Infinity, repeatDelay: 1 }}
          className="absolute w-32 h-32 rounded-full border-2 pointer-events-none"
          style={{ borderColor: r.color }} />
      ))}

      {/* Radial glow */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 40%, hsl(45 95% 60% / 0.12) 0%, hsl(280 80% 65% / 0.06) 40%, transparent 70%)" }} />

      {/* Flying crystals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {showRewards && flyingCrystals.map((c) => (
          <motion.div key={c.id}
            initial={{ x: `${c.startX}vw`, y: `${c.startY}vh`, scale: 1, opacity: 1 }}
            animate={{ x: "85vw", y: "3vh", scale: 0.3, opacity: 0 }}
            transition={{ duration: 1.2, delay: c.delay, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute text-xl">💎</motion.div>
        ))}
      </div>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 14 }}
            className="relative z-10 flex flex-col items-center gap-4 sm:gap-5 text-center max-w-xs sm:max-w-sm"
          >
            {/* Trophy */}
            <motion.div className="relative">
              <motion.div
                animate={{ scale: [1, 1.12, 1], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl sm:text-8xl drop-shadow-[0_0_30px_hsl(45_95%_60%/0.4)]">🏆</motion.div>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <motion.span key={i}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: i * 0.67 }}
                  className="absolute text-lg sm:text-xl"
                  style={{ top: "50%", left: "50%", transformOrigin: "0 0", transform: `rotate(${i * 60}deg) translateX(50px)` }}>
                  {["✨", "⭐", "💫", "🌟", "💎", "✨"][i]}
                </motion.span>
              ))}
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="text-2xl sm:text-3xl font-extrabold glow-text-yellow"
              style={{ fontFamily: "var(--font-display)" }}>
              {t("planetComplete")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.38 }}
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:text-xs"
            >
              {petName ? "Mission logged // new discovery secured" : "Mission logged // rewards secured"}
            </motion.p>

            {/* Rewards card */}
            {showRewards && (
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex flex-col gap-3 bg-card/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-border/60 w-full shadow-2xl"
              >
                {/* XP */}
                <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15, type: "spring" }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-cosmic-yellow/10 border border-cosmic-yellow/20">
                  <div className="flex items-center gap-2.5 text-base sm:text-lg">
                    <motion.span animate={{ rotate: [0, 20, -20, 0] }} transition={{ duration: 1, repeat: Infinity }} className="text-xl">⭐</motion.span>
                    <span className="font-semibold text-foreground">{t("experience")}</span>
                  </div>
                  <motion.span className="font-extrabold text-cosmic-yellow text-xl sm:text-2xl tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
                    +{xpCount}
                  </motion.span>
                </motion.div>

                {/* Crystals */}
                <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.25, type: "spring" }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-cosmic-cyan/10 border border-cosmic-cyan/20">
                  <div className="flex items-center gap-2.5 text-base sm:text-lg">
                    <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="text-xl">💎</motion.span>
                    <span className="font-semibold text-foreground">{t("crystals")}</span>
                  </div>
                  <motion.span className="font-extrabold text-cosmic-cyan text-xl sm:text-2xl tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
                    +{crystalCount}
                  </motion.span>
                </motion.div>

                {/* Faction bonus */}
                {faction === "mud" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                    className="text-xs text-cosmic-yellow font-bold text-center py-1.5 bg-cosmic-yellow/5 rounded-lg">
                    {t("mudBonus")}
                  </motion.div>
                )}

                {/* Pet found */}
                <AnimatePresence>
                  {showPet && petName && petEmoji && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 12 }}
                      className="flex items-center justify-center gap-4 mt-2 pt-3 border-t border-border/60">
                      <div className="relative">
                        <motion.span animate={{ y: [0, -10, 0], rotate: [0, 8, -8, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }} className="text-4xl sm:text-5xl block">{petEmoji}</motion.span>
                        <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-[-8px] rounded-full border-2 border-cosmic-pink/40" />
                      </div>
                      <div className="text-left">
                        <motion.span initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                          className="font-bold text-cosmic-pink block text-base sm:text-lg" style={{ fontFamily: "var(--font-display)" }}>
                          {t("newPetFound")}
                        </motion.span>
                        <span className="text-sm text-foreground">{petName}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* Continue */}
            {showButton && (
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  initial={{ y: 30, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  onClick={onDone}
                  className="relative min-h-[56px] overflow-hidden rounded-2xl bg-cosmic-yellow px-10 py-3.5 text-lg font-bold text-accent-foreground shadow-[0_0_30px_hsl(45_95%_60%/0.3)] sm:px-14 sm:py-4 sm:text-xl"
                  style={{ fontFamily: "var(--font-display)" }}>
                  <motion.div animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <span className="relative z-10">{t("continueBtn")}</span>
                </motion.button>
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  Return to the map and continue your expedition.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
