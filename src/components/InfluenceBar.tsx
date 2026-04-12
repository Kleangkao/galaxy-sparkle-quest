import { motion } from "framer-motion";
import { FactionId, PlanetInfluence, INFLUENCE_TO_CAPTURE, getPlanetController, FACTIONS } from "@/lib/gameState";

interface InfluenceBarProps {
  influence: PlanetInfluence;
  compact?: boolean;
}

const FACTION_COLORS: Record<FactionId, string> = {
  mud: "hsl(330 85% 65%)",
  oni: "hsl(190 90% 55%)",
  ustur: "hsl(45 95% 60%)",
};

const FACTION_BG: Record<FactionId, string> = {
  mud: "bg-cosmic-pink",
  oni: "bg-cosmic-cyan",
  ustur: "bg-cosmic-yellow",
};

export function InfluenceBar({ influence, compact }: InfluenceBarProps) {
  const total = Math.max(influence.mud + influence.oni + influence.ustur, 1);
  const controller = getPlanetController(influence);

  if (compact) {
    // Mini bar for planet nodes
    return (
      <div className="flex gap-[1px] w-full h-1.5 rounded-full overflow-hidden bg-muted/40">
        {(["mud", "oni", "ustur"] as FactionId[]).map(f => {
          const pct = (influence[f] / INFLUENCE_TO_CAPTURE) * 100;
          return (
            <motion.div
              key={f}
              className={`h-full ${FACTION_BG[f]} ${controller === f ? "opacity-100" : "opacity-70"}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          );
        })}
      </div>
    );
  }

  // Full influence bar for planet cards
  return (
    <div className="w-full">
      <div className="flex gap-[2px] w-full h-2.5 rounded-full overflow-hidden bg-muted/30">
        {(["mud", "oni", "ustur"] as FactionId[]).map(f => {
          const pct = (influence[f] / total) * 100;
          return (
            <motion.div
              key={f}
              className={`h-full ${FACTION_BG[f]} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, type: "spring" }}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        {(["mud", "oni", "ustur"] as FactionId[]).map(f => {
          const pct = Math.round((influence[f] / INFLUENCE_TO_CAPTURE) * 100);
          const faction = FACTIONS.find(fc => fc.id === f)!;
          return (
            <span
              key={f}
              className={`text-[10px] sm:text-xs font-bold ${controller === f ? faction.colorClass : "text-muted-foreground/60"}`}
            >
              {faction.emoji} {pct}%
            </span>
          );
        })}
      </div>
    </div>
  );
}

interface FactionControlRingProps {
  influence: PlanetInfluence;
  size?: string;
}

export function FactionControlRing({ influence, size = "inset-[-5px] sm:inset-[-7px]" }: FactionControlRingProps) {
  const controller = getPlanetController(influence);
  const total = influence.mud + influence.oni + influence.ustur;

  if (total === 0) return null;

  if (controller) {
    // Solid ring for controlled planet
    const color = FACTION_COLORS[controller];
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`absolute ${size} rounded-full pointer-events-none`}
        style={{
          border: `3px solid ${color}`,
          boxShadow: `0 0 12px ${color.replace(")", " / 0.4)")}, 0 0 24px ${color.replace(")", " / 0.15)")}`,
        }}
      />
    );
  }

  // Contested: show gradient ring from the top two factions
  const sorted = (["mud", "oni", "ustur"] as FactionId[])
    .map(f => ({ f, v: influence[f] }))
    .sort((a, b) => b.v - a.v);

  const color1 = FACTION_COLORS[sorted[0].f];
  const color2 = FACTION_COLORS[sorted[1].f];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.6 }}
      className={`absolute ${size} rounded-full pointer-events-none`}
      style={{
        border: "2px solid transparent",
        background: `linear-gradient(135deg, ${color1}, ${color2}) border-box`,
        WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    />
  );
}
