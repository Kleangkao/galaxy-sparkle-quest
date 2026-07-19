import { Planet, FactionId, PLANETS, isPlanetUnlocked, getPlanetDisplayName, PlanetInfluence, getPlanetController, getPlanetLeader, getPlanetStatus } from "@/lib/gameState";
import { ArrowRight, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

interface Props {
  planet: Planet;
  level: number;
  faction: FactionId | null;
  visited: boolean;
  influence?: PlanetInfluence;
  hasUndiscoveredPet?: boolean;
  onLaunch?: (planet: Planet) => void;
}

export default function PlanetCard({ planet, level, faction, visited, influence, hasUndiscoveredPet, onLaunch }: Props) {
  const { t } = useI18n();
  const planetIndex = PLANETS.findIndex((candidate) => candidate.id === planet.id);
  const unlocked = isPlanetUnlocked(planet, level, faction);
  const controller = influence ? getPlanetController(influence) : null;
  const status = influence ? getPlanetStatus(influence) : "neutral";
  const totalInfluence = influence ? influence.mud + influence.oni + influence.ustur : 0;
  const leader = influence && totalInfluence > 0 ? getPlanetLeader(influence) : null;

  const displayFaction = controller || faction;
  const factionColor = displayFaction === "oni" ? "bg-cosmic-cyan" : displayFaction === "ustur" ? "bg-cosmic-yellow" : displayFaction === "mud" ? "bg-cosmic-red" : planet.color;
  const factionGlow = displayFaction === "oni" ? "planet-glow-cyan" : displayFaction === "ustur" ? "planet-glow-yellow" : displayFaction === "mud" ? "planet-glow-pink" : planet.glowClass;

  const statusLabel =
    status === "controlled" && controller
      ? `${controller.toUpperCase()} Controlled`
      : status === "contested"
        ? "Async activity detected"
        : "Quiet sector";
  const biomeLabel =
    planet.biome === "crystal" ? "Crystal Sector"
      : planet.biome === "candy" ? "Candy Sector"
        : planet.biome === "ice" ? "Ice Sector"
          : planet.biome === "jungle" ? "Jungle Sector"
            : planet.biome === "nebula" ? "Nebula Sector"
              : planet.biome === "ocean" ? "Ocean Sector"
                : planet.biome === "crater" ? "Crater Sector"
                  : planet.biome === "shore" ? "Shore Sector"
                    : planet.biome === "cave" ? "Cave Sector"
                      : "Legendary Sector";
  const headerLabel = unlocked ? (visited ? "Sector Intel" : "Available Mission") : "Locked Dossier";
  const progressValues = influence
    ? [influence.mud, influence.oni, influence.ustur]
    : [0, 0, 0];
  const progressTotal = Math.max(progressValues[0] + progressValues[1] + progressValues[2], 1);
  const primaryAction = visited ? "Survey Run" : "Launch Ready";

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={`relative flex flex-col p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 w-full min-h-[88px] gap-3
        ${unlocked ? "border-border bg-card/60 hover:bg-card/75" : "border-border/50 bg-card/30 opacity-70"}
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full border border-border/60 bg-background/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {headerLabel}
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground">{unlocked ? `Chapter ${planetIndex + 1}` : "Preview dossier"}</span>
      </div>

      <div className="flex items-center w-full">
        <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl shrink-0
          ${unlocked ? factionGlow : ""} ${unlocked ? factionColor : factionColor + " opacity-30"}`}>
          {planet.emoji}
          {!unlocked && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/55">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          {visited && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cosmic-green flex items-center justify-center text-[10px] font-bold">✓</div>
          )}
        </div>

        <div className="ml-3 flex-1 text-left min-w-0">
          <h3 className={`text-base sm:text-lg font-bold truncate ${unlocked ? "text-foreground" : "text-muted-foreground"}`}
            style={{ fontFamily: "var(--font-hero)" }}>
            {getPlanetDisplayName(planetIndex, faction) || planet.name}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
            {unlocked ? planet.description : `Sector dossier ready. Deployment opens at Level ${planet.unlockLevel}.`}
          </p>
          <span className="mt-1 inline-block rounded-full border border-border/40 bg-background/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {biomeLabel}
          </span>
          {unlocked && (
            <span className={`text-[10px] sm:text-xs font-semibold mt-1 inline-block
              ${status === "controlled" ? (controller === "mud" ? "text-cosmic-pink" : controller === "oni" ? "text-cosmic-cyan" : "text-cosmic-yellow") : status === "contested" ? "text-cosmic-orange" : "text-muted-foreground/80"}`}>
              {statusLabel}
            </span>
          )}
        </div>

        <div className={`ml-2 flex flex-col items-end gap-1 shrink-0 ${unlocked ? "" : "opacity-75"}`}>
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-cosmic-cyan bg-cosmic-cyan/10 px-2 py-0.5 rounded-full">
            <span>💎</span> {planet.crystals}
          </div>
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-cosmic-yellow bg-cosmic-yellow/10 px-2 py-0.5 rounded-full">
            <span>⭐</span> {planet.xp}
          </div>
        </div>
      </div>

      {unlocked && (
        <div className="space-y-2">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/30">
            <div className="flex h-full gap-[2px]">
              <div className="rounded-full bg-cosmic-pink" style={{ width: `${(progressValues[0] / progressTotal) * 100}%` }} />
              <div className="rounded-full bg-cosmic-cyan" style={{ width: `${(progressValues[1] / progressTotal) * 100}%` }} />
              <div className="rounded-full bg-cosmic-yellow" style={{ width: `${(progressValues[2] / progressTotal) * 100}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-cosmic-cyan/20 bg-cosmic-cyan/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cosmic-cyan">
              {primaryAction}
            </span>
            <span className="rounded-full border border-cosmic-yellow/20 bg-cosmic-yellow/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cosmic-yellow">
              Egg Scan
            </span>
            {visited && (
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${hasUndiscoveredPet ? "border-cosmic-green/20 bg-cosmic-green/10 text-cosmic-green" : "border-border/40 bg-background/20 text-muted-foreground"}`}>
                {hasUndiscoveredPet ? "Pet Recovery" : "Pet Archived"}
              </span>
            )}
          </div>
        </div>
      )}

      {unlocked && onLaunch ? (
        <button className="planet-card-launch" onClick={() => onLaunch(planet)}>
          <span>{visited ? "Replay survey" : "Play story chapter"}</span><ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/20 px-3 py-2 text-[11px] text-muted-foreground">
          <span>Rewards preview</span><span className="font-semibold text-foreground/80">Unlocks at Level {planet.unlockLevel}</span>
        </div>
      )}
    </motion.div>
  );
}
