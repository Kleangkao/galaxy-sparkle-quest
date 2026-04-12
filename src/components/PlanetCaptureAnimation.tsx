import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FactionId, FACTIONS } from "@/lib/gameState";
import { playVictorySound } from "@/lib/sounds";
import { useI18n } from "@/lib/i18n";

interface Props {
  factionId: FactionId;
  planetName: string;
  planetEmoji: string;
  onDone: () => void;
}

export default function PlanetCaptureAnimation({ factionId, planetName, planetEmoji, onDone }: Props) {
  const { t } = useI18n();
  const [phase, setPhase] = useState(0);
  const faction = FACTIONS.find(f => f.id === factionId)!;

  useEffect(() => {
    playVictorySound();
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 1800);
    const t3 = setTimeout(() => onDone(), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const ringColor = faction.hslColor;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background/80 backdrop-blur-lg"
        onClick={onDone}
      >
        {/* Expanding faction-colored rings */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            initial={{ scale: 0.3, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 2.5, delay: i * 0.4, ease: "easeOut" }}
            className="absolute w-24 h-24 rounded-full border-[3px] pointer-events-none"
            style={{ borderColor: `hsl(${ringColor})` }}
          />
        ))}

        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 45%, hsl(${ringColor} / 0.2) 0%, transparent 60%)`,
          }}
        />

        {/* Planet with pulsing glow */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 150, damping: 12 }}
          className="relative mb-4"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-6xl sm:text-8xl"
            style={{
              filter: `drop-shadow(0 0 20px hsl(${ringColor} / 0.5))`,
            }}
          >
            {planetEmoji}
          </motion.div>
          {/* Control ring */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute inset-[-12px] rounded-full border-[4px]"
            style={{
              borderColor: `hsl(${ringColor})`,
              boxShadow: `0 0 20px hsl(${ringColor} / 0.4), 0 0 40px hsl(${ringColor} / 0.15)`,
            }}
          />
        </motion.div>

        {/* Text */}
        <AnimatePresence mode="wait">
          {phase >= 1 && (
            <motion.div
              key="capture-text"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <h2
                className="text-2xl sm:text-3xl font-extrabold"
                style={{
                  fontFamily: "var(--font-display)",
                  color: `hsl(${ringColor})`,
                  textShadow: `0 0 20px hsl(${ringColor} / 0.4)`,
                }}
              >
                {t("planetCaptured")}
              </h2>
              <p className="text-base sm:text-lg text-foreground font-bold" style={{ fontFamily: "var(--font-display)" }}>
                {faction.emoji} {faction.name} {t("nowControls")}
              </p>
              <p className="text-lg sm:text-xl text-foreground/80" style={{ fontFamily: "var(--font-display)" }}>
                {planetEmoji} {planetName}
              </p>
              <p className="max-w-md text-xs leading-relaxed text-foreground/65 sm:text-sm">
                Local control has shifted in the background simulation. This reflects sector intel, not a live PvP takeover in your current run.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bonus badge */}
        {phase >= 2 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mt-4 px-5 py-2 rounded-2xl border-2 bg-card/80 backdrop-blur-sm"
            style={{ borderColor: `hsl(${ringColor} / 0.5)` }}
          >
            <span className="text-sm sm:text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              {t("bonusCrystalsTeam")}
            </span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
