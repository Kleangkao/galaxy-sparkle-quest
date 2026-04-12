import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PLANETS, Planet, FactionId, PlanetInfluence, getPlanetController, getPlanetDisplayName, getPlanetLeader, getPlanetStatus, isPlanetUnlocked } from "@/lib/gameState";
import PlanetNode from "@/components/PlanetNode";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getPetById, getPetByName } from "@/lib/pets";
import { playLockedSound } from "@/lib/sounds";
import { getMissionBrief } from "@/lib/missionBriefs";

const GALAXY_ROUTE_SEGMENTS: Array<[number, number]> = [
  [0, 4],
  [1, 4],
  [1, 5],
  [2, 5],
  [2, 6],
  [3, 6],
  [4, 7],
  [5, 7],
  [5, 8],
  [6, 8],
  [7, 9],
  [8, 9],
];
/** Route dashed lines stay aligned to raw `PLANETS` coordinates (no horizontal shift). */
const PLANET_OFFSET_BY_BREAKPOINT = {
  mobile: -6,
  tablet: -6,
  desktop: -6,
} as const;

const PLANET_VERTICAL_OFFSET_BY_BREAKPOINT = {
  mobile: -1,
  tablet: -1,
  desktop: -1,
} as const;

function getPlanetOffsetX(viewportWidth: number) {
  if (viewportWidth < 640) return PLANET_OFFSET_BY_BREAKPOINT.mobile;
  if (viewportWidth < 1024) return PLANET_OFFSET_BY_BREAKPOINT.tablet;
  return PLANET_OFFSET_BY_BREAKPOINT.desktop;
}

function getPlanetOffsetY(viewportWidth: number) {
  if (viewportWidth < 640) return PLANET_VERTICAL_OFFSET_BY_BREAKPOINT.mobile;
  if (viewportWidth < 1024) return PLANET_VERTICAL_OFFSET_BY_BREAKPOINT.tablet;
  return PLANET_VERTICAL_OFFSET_BY_BREAKPOINT.desktop;
}

function getRoutePath(segment: [number, number]) {
  const [fromIndex, toIndex] = segment;
  const from = PLANETS[fromIndex]?.position;
  const to = PLANETS[toIndex]?.position;
  if (!from || !to) return "";
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

function getNavigationKey(event: KeyboardEvent): "prev" | "next" | "enter" | null {
  const key = event.key.toLowerCase();
  const code = event.code;
  if (key === "a" || key === "w" || key === "arrowleft" || key === "arrowup" || code === "KeyA" || code === "KeyW") return "prev";
  if (key === "d" || key === "s" || key === "arrowright" || key === "arrowdown" || code === "KeyD" || code === "KeyS") return "next";
  if (key === "enter" || key === " " || code === "Enter" || code === "Space") return "enter";
  return null;
}

interface Props {
  level: number;
  faction: FactionId | null;
  visitedPlanets: string[];
  onPlanetClick: (planet: Planet) => void;
  influence: Record<string, PlanetInfluence>;
  activePet?: string | null;
  reducedMotion?: boolean;
}

export default function SwipeableGalaxyMap({ level, faction, visitedPlanets, onPlanetClick, influence, activePet, reducedMotion }: Props) {
  const { t } = useI18n();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const planetOffsetX = useMemo(() => getPlanetOffsetX(viewportWidth), [viewportWidth]);
  const planetOffsetY = useMemo(() => getPlanetOffsetY(viewportWidth), [viewportWidth]);
  const unlockedIndexes = useMemo(
    () => PLANETS.map((planet, index) => (isPlanetUnlocked(planet, level, faction) ? index : -1)).filter((index) => index >= 0),
    [level, faction],
  );
  const defaultSelectedIndex = useMemo(() => {
    const lastVisitedId = visitedPlanets[visitedPlanets.length - 1];
    const lastVisitedIndex = PLANETS.findIndex((planet) => planet.id === lastVisitedId);
    if (lastVisitedIndex >= 0) return lastVisitedIndex;
    return unlockedIndexes[0] ?? 0;
  }, [visitedPlanets, unlockedIndexes]);
  const [selectedIndex, setSelectedIndex] = useState(defaultSelectedIndex);
  const selectedPlanet = PLANETS[selectedIndex] ?? PLANETS[0];
  const selectedInfluence = selectedPlanet ? influence[selectedPlanet.id] : undefined;
  const selectedUnlocked = selectedPlanet ? isPlanetUnlocked(selectedPlanet, level, faction) : false;
  const selectedStatus = selectedInfluence ? getPlanetStatus(selectedInfluence) : "neutral";
  const selectedController = selectedInfluence ? getPlanetController(selectedInfluence) : null;
  const selectedLeader = selectedInfluence ? getPlanetLeader(selectedInfluence) : null;
  const selectedDisplayName = selectedPlanet ? getPlanetDisplayName(selectedIndex, faction) : "";
  const selectedMissionBrief = selectedPlanet ? getMissionBrief(selectedPlanet.id) : null;
  const selectedSummary = !selectedPlanet
    ? ""
    : !selectedUnlocked
      ? `Unlocks at Level ${selectedPlanet.unlockLevel}.`
      : selectedMissionBrief
        ? `${selectedMissionBrief.title}: ${selectedMissionBrief.encounters}`
        : visitedPlanets.includes(selectedPlanet.id)
          ? "Survey run ready. Replay for egg scans, missing pets, and local control."
          : "Fresh sector. Launch now for full first-clear rewards.";
  const selectedIntelLabel =
    selectedStatus === "controlled" && selectedController
      ? `${selectedController.toUpperCase()} controls this sector`
      : selectedStatus === "contested" && selectedLeader
        ? `${selectedLeader.toUpperCase()} leads current intel`
        : "No rival intel logged yet";

  useEffect(() => {
    setSelectedIndex(defaultSelectedIndex);
  }, [defaultSelectedIndex]);

  useEffect(() => {
    mapRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const moveSelection = useCallback((direction: -1 | 1) => {
    setSelectedIndex((current) => {
      const nextIndex = current + direction;
      if (nextIndex < 0) return 0;
      if (nextIndex >= PLANETS.length) return PLANETS.length - 1;
      return nextIndex;
    });
  }, []);

  const [shakingPlanet, setShakingPlanet] = useState<string | null>(null);

  const handlePlanetClick = useCallback((planet: Planet) => {
    const unlocked = isPlanetUnlocked(planet, level, faction);
    if (!unlocked) {
      playLockedSound();
      setShakingPlanet(planet.id);
      setTimeout(() => setShakingPlanet(null), 500);
      toast(`${t("planetLockedMsg")} ${planet.unlockLevel} ${t("toUnlock")}`);
      return;
    }

    setSelectedIndex(PLANETS.findIndex((candidate) => candidate.id === planet.id));
    onPlanetClick(planet);
  }, [level, faction, onPlanetClick, t]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      switch (getNavigationKey(event)) {
        case "prev":
          event.preventDefault();
          moveSelection(-1);
          return;
        case "next":
          event.preventDefault();
          moveSelection(1);
          return;
        case "enter":
          event.preventDefault();
          if (PLANETS[selectedIndex]) handlePlanetClick(PLANETS[selectedIndex]);
          return;
        default:
          return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlanetClick, moveSelection, selectedIndex]);

  return (
    <div
      ref={mapRef}
      tabIndex={0}
      onMouseEnter={() => mapRef.current?.focus()}
      onPointerDown={() => mapRef.current?.focus()}
      className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-emerald-300/15 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.18),_transparent_34%),linear-gradient(180deg,_rgba(7,62,44,0.92),_rgba(17,24,39,0.94)_42%,_rgba(21,24,50,0.98))] px-4 py-5 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-sm outline-none sm:px-6 sm:py-6"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[16%] h-48 w-48 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute right-[-6%] top-[12%] h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute bottom-[-5%] left-[8%] h-24 w-[38%] rounded-[999px] bg-emerald-400/12 blur-sm" />
        <div className="absolute bottom-[-8%] right-[4%] h-28 w-[42%] rounded-[999px] bg-cyan-300/12 blur-sm" />
      </div>

      <div className="relative z-10 mb-4 flex flex-col items-center gap-3 text-center">
        <motion.div
          key={selectedPlanet?.id}
          initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.18, ease: "easeOut" }}
          className="w-full max-w-2xl rounded-2xl border border-emerald-200/20 bg-background/15 px-4 py-3 text-left shadow-[0_0_30px_rgba(16,185,129,0.08)] backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100">
              Selected Sector
            </span>
            <span className="rounded-full border border-border/40 bg-background/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {selectedUnlocked ? "Ready" : `Level ${selectedPlanet?.unlockLevel}`}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${selectedUnlocked ? selectedPlanet.color : `${selectedPlanet.color} opacity-40`} ${selectedUnlocked ? selectedPlanet.glowClass : ""}`}>
              {selectedPlanet?.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white sm:text-base" style={{ fontFamily: "var(--font-hero)" }}>
                {selectedDisplayName}
              </div>
              <div className="line-clamp-2 text-[11px] leading-relaxed text-emerald-50/80 sm:text-xs">
                {selectedSummary}
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/75">
              {selectedIntelLabel}
            </span>
            {selectedPlanet && (
              <>
                <span className="rounded-full bg-cosmic-cyan/10 px-2.5 py-1 text-[10px] font-bold text-cosmic-cyan">💎 {selectedPlanet.crystals}</span>
                <span className="rounded-full bg-cosmic-yellow/10 px-2.5 py-1 text-[10px] font-bold text-cosmic-yellow">⭐ {selectedPlanet.xp}</span>
              </>
            )}
            {selectedMissionBrief && selectedUnlocked && (
              <span className="rounded-full border border-cosmic-cyan/30 bg-cosmic-cyan/10 px-2.5 py-1 text-[10px] font-semibold text-cosmic-cyan">
                Tip: {selectedMissionBrief.tip}
              </span>
            )}
          </div>
        </motion.div>
        <span className="rounded-full border border-emerald-200/20 bg-background/15 px-4 py-1.5 text-[11px] font-semibold text-emerald-50/75 shadow-sm">
          WASD / Arrows move sector focus. {t("enterLaunch")}. Follow the highlighted node.
        </span>
      </div>

      <div className="relative mx-auto h-[520px] w-full max-w-[980px] overflow-visible sm:h-[620px]">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {GALAXY_ROUTE_SEGMENTS.map((segment) => {
            const isSelectedRoute = segment.includes(selectedIndex);
            return (
            <path
              key={segment.join("-")}
              d={getRoutePath(segment)}
              fill="none"
              stroke={isSelectedRoute ? "rgba(255, 241, 118, 0.92)" : "rgba(236, 72, 153, 0.52)"}
              strokeWidth={isSelectedRoute ? "0.72" : "0.48"}
              strokeLinecap="round"
              strokeDasharray={isSelectedRoute ? "0.9 1.8" : "0.6 2.2"}
            />
          )})}
        </svg>

        {PLANETS.map((planet, index) => (
          <PlanetNode
            key={planet.id}
            planet={planet}
            level={level}
            faction={faction}
            visited={visitedPlanets.includes(planet.id)}
            onClick={() => handlePlanetClick(planet)}
            index={index}
            influence={influence[planet.id]}
            shaking={shakingPlanet === planet.id}
            isFirstTime={visitedPlanets.length === 0}
            selected={selectedIndex === index}
            reducedMotion={reducedMotion}
            offsetX={planetOffsetX}
            offsetY={planetOffsetY}
          />
        ))}

        {activePet && (() => {
          const pet = getPetById(activePet) || getPetByName(activePet);
          if (!pet) return null;

          const lastVisited = visitedPlanets.length > 0
            ? PLANETS.find((planet) => planet.id === visitedPlanets[visitedPlanets.length - 1])
            : PLANETS[0];

          if (!lastVisited) return null;

          return (
            <motion.div
              className="pointer-events-none absolute z-30"
              style={{
                left: `${lastVisited.position.x + planetOffsetX + 5}%`,
                top: `${lastVisited.position.y + planetOffsetY - 4}%`,
                transform: "translate(-50%, -50%)",
              }}
              animate={{
                y: [0, -8, 0],
                x: [0, 3, -3, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-2xl drop-shadow-lg sm:text-3xl">{pet.emoji}</span>
            </motion.div>
          );
        })()}

      </div>

      <div className="relative z-10 mt-3 flex justify-center">
        <div className="rounded-full border border-emerald-200/20 bg-background/20 px-4 py-2 text-[11px] font-medium text-emerald-50/70">
          Triangle routes show progression. Detailed sector intel lives in the mission board below.
        </div>
      </div>
    </div>
  );
}
