import { Planet, FactionId, isPlanetUnlocked, getPlanetDisplayName, PlanetInfluence, getPlanetController } from "@/lib/gameState";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { FactionControlRing } from "@/components/InfluenceBar";
import { useI18n } from "@/lib/i18n";

interface Props {
  planet: Planet;
  level: number;
  faction: FactionId | null;
  visited: boolean;
  onClick: () => void;
  index: number;
  influence?: PlanetInfluence;
  shaking?: boolean;
  isFirstTime?: boolean;
  selected?: boolean;
  reducedMotion?: boolean;
  offsetX?: number;
  offsetY?: number;
}

export default function PlanetNode({ planet, level, faction, visited, onClick, index, influence, shaking, isFirstTime, selected, reducedMotion, offsetX = 0, offsetY = 0 }: Props) {
  const { t } = useI18n();
  const unlocked = isPlanetUnlocked(planet, level, faction);
  const controller = influence ? getPlanetController(influence) : null;

  const displayFaction = controller || faction;
  const factionColor = displayFaction === "oni"
    ? "bg-cosmic-cyan"
    : displayFaction === "ustur"
      ? "bg-cosmic-yellow"
      : displayFaction === "mud"
        ? "bg-cosmic-red"
        : planet.color;
  const factionGlow = displayFaction === "oni"
    ? "planet-glow-cyan"
    : displayFaction === "ustur"
      ? "planet-glow-yellow"
      : displayFaction === "mud"
        ? "planet-glow-pink"
        : planet.glowClass;
  return (
    <motion.button
      onClick={onClick}
      whileTap={unlocked ? { scale: 0.94 } : { scale: 0.97 }}
      whileHover={unlocked ? { scale: 1.04 } : undefined}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: reducedMotion ? 0 : index * 0.08, type: "spring", stiffness: 200 }}
      className={`absolute flex h-[122px] w-[122px] flex-col items-center ${unlocked ? "cursor-pointer" : "cursor-not-allowed"}`}
      style={{
        left: `calc(${planet.position.x}% + ${offsetX}%)`,
        top: `calc(${planet.position.y}% + ${offsetY}% - 34px)`,
        transform: "translate(-50%, 0)",
      }}
      aria-label={getPlanetDisplayName(index, faction)}
    >
      {unlocked && isFirstTime && index === 0 && (
        <motion.div
          animate={{ y: [-2, 4, -2] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-14 sm:-top-16 flex flex-col items-center gap-1 z-40"
        >
          <div className="flex items-center gap-1 rounded-full border border-cosmic-yellow/60 bg-cosmic-yellow/20 px-3 py-1 backdrop-blur-sm shadow-[0_0_24px_hsl(45_95%_60%/0.3)]">
            <span className="text-sm sm:text-base">⭐</span>
            <span className="whitespace-nowrap text-xs font-bold text-cosmic-yellow sm:text-sm" style={{ fontFamily: "var(--font-display)" }}>
              {t("startHere")}
            </span>
            <span className="text-sm sm:text-base">⭐</span>
          </div>
          <span className="text-lg drop-shadow-lg sm:text-xl">👇</span>
        </motion.div>
      )}

      <motion.div
        animate={
          shaking && !unlocked
            ? { x: [0, -6, 6, -4, 4, 0], rotate: [0, -3, 3, -2, 2, 0] }
            : unlocked && !reducedMotion
              ? { scale: selected ? [1.02, 1.05, 1.02] : [1, 1.02, 1] }
              : {}
        }
        transition={
          shaking && !unlocked
            ? { duration: 0.4 }
            : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
        }
        className={`relative mt-1 flex aspect-square h-14 w-14 shrink-0 items-center justify-center rounded-full border text-2xl sm:h-[70px] sm:w-[70px] sm:text-3xl md:h-20 md:w-20 md:text-4xl lg:h-[92px] lg:w-[92px] ${unlocked ? "border-white/25 shadow-[0_0_0_6px_rgba(45,212,191,0.08)]" : "border-white/8"} ${selected ? "ring-4 ring-cosmic-yellow/70 ring-offset-2 ring-offset-background/20" : ""} ${unlocked ? factionGlow : ""} ${unlocked ? factionColor : `${factionColor} opacity-30`} ${unlocked && !visited ? "animate-pulse-glow" : ""} ${shaking && !unlocked ? "ring-2 ring-destructive/60" : ""} transition-transform duration-300`}
      >
        {unlocked && (
          <div className="pointer-events-none absolute inset-[8%] rounded-full border border-white/20" />
        )}
        {unlocked && (
          <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.28),transparent_34%)]" />
        )}
        {unlocked && influence && <FactionControlRing influence={influence} />}

        {unlocked ? (
          planet.emoji
        ) : (
          <motion.div animate={shaking ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.3 }}>
            <Lock className={`h-5 w-5 sm:h-6 sm:w-6 ${shaking ? "text-destructive" : "text-muted-foreground"} transition-colors`} />
          </motion.div>
        )}

        {visited && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cosmic-green text-xs font-bold shadow-[0_0_8px_hsl(145_75%_50%/0.4)] sm:h-6 sm:w-6"
          >
            ✓
          </motion.div>
        )}
      </motion.div>

      <div className="mt-2 flex flex-col items-center gap-1 text-center">
        <span
          className={`max-w-[78px] text-[10px] font-bold leading-tight drop-shadow-md sm:max-w-[92px] sm:text-sm ${selected ? "scale-[1.03] text-foreground glow-text" : unlocked ? "text-foreground/88" : "text-muted-foreground"}`}
          style={{ fontFamily: "var(--font-hero)" }}
        >
          {getPlanetDisplayName(index, faction)}
        </span>

        {!unlocked && (
          <span className="text-[10px] font-medium text-muted-foreground sm:text-xs">Level {planet.unlockLevel}</span>
        )}
      </div>
    </motion.button>
  );
}
