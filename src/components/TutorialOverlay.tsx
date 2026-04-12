import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";

interface Props {
  faction: string;
  onDismiss: () => void;
}

export default function TutorialOverlay({ faction, onDismiss }: Props) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1500);
    const t2 = setTimeout(() => setStep(2), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const factionLabel = faction === "mud" ? "MUD Territory" : faction === "oni" ? "ONI Region" : "USTUR Sector";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4 bg-background/70 backdrop-blur-md"
        onClick={step >= 2 ? onDismiss : undefined}
      >
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-6xl sm:text-7xl"
              >
                🚀
              </motion.span>
              <h2 className="text-2xl sm:text-3xl font-extrabold glow-text" style={{ fontFamily: "var(--font-display)" }}>
                {t("welcomeExplorer")}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xs">
                {t("youveJoined")} <span className="font-bold text-foreground">{factionLabel}</span>
              </p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="instruction"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-5xl sm:text-6xl"
              >
                👆
              </motion.div>
              <h2 className="text-xl sm:text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
                {t("tapSparkle")} <span className="text-cosmic-yellow">{t("sparkleMoon")}</span> 🌙
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                {t("toStartMission")}
              </p>
            </motion.div>
          )}

          {step >= 2 && (
            <motion.div
              key="go"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-5xl sm:text-6xl"
              >
                ✨
              </motion.span>
              <h2 className="text-xl sm:text-2xl font-extrabold glow-text-yellow" style={{ fontFamily: "var(--font-display)" }}>
                {t("letsGo")}
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onDismiss}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl text-base font-bold shadow-lg min-h-[48px]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t("startExploring")}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
