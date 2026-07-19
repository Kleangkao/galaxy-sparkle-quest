import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Gem,
  LockKeyhole,
  Map,
  PawPrint,
  Radio,
  Shield,
  Sparkles,
  Target,
} from "lucide-react";
import {
  GameState,
  PLANETS,
  Planet,
  countControlled,
  getPlanetController,
  getPlanetDisplayName,
  getSectorLore,
  isPlanetUnlocked,
} from "@/lib/gameState";

interface Props {
  gameState: GameState;
  onHome: () => void;
  onLaunch: (planet: Planet) => void;
}

const BIOME_LABELS: Record<Planet["biome"], string> = {
  crystal: "Crystal caverns",
  candy: "Coral wilds",
  ice: "Frozen slipstream",
  jungle: "Ancient canopy",
  nebula: "Ion archipelago",
  ocean: "Alien ocean",
  crater: "Volcanic basin",
  shore: "Starlight coast",
  cave: "Deep crystal vault",
  legendary: "Golden frontier",
};

export default function StoryExpeditionConsole({ gameState, onHome, onLaunch }: Props) {
  const unlocked = PLANETS.filter((planet) => isPlanetUnlocked(planet, gameState.level, gameState.faction));
  const recommended = unlocked.find((planet) => !gameState.visitedPlanets.includes(planet.id)) ?? unlocked.at(-1) ?? PLANETS[0];
  const [selectedId, setSelectedId] = useState(recommended.id);
  const selected = PLANETS.find((planet) => planet.id === selectedId) ?? recommended;
  const selectedIndex = PLANETS.findIndex((planet) => planet.id === selected.id);
  const selectedUnlocked = isPlanetUnlocked(selected, gameState.level, gameState.faction);
  const selectedVisited = gameState.visitedPlanets.includes(selected.id);
  const lore = getSectorLore(selected.id);
  const influence = gameState.influence[selected.id];
  const controller = getPlanetController(influence);
  const controlledCount = gameState.faction ? countControlled(gameState.influence, gameState.faction) : 0;
  const campaignProgress = Math.round((gameState.visitedPlanets.length / PLANETS.length) * 100);
  const totalInfluence = Math.max(1, influence.mud + influence.oni + influence.ustur);
  const nextUnlock = PLANETS.find((planet) => !isPlanetUnlocked(planet, gameState.level, gameState.faction));

  const status = useMemo(() => {
    if (!selectedUnlocked) return { label: `Unlocks at level ${selected.unlockLevel}`, tone: "locked" };
    if (selectedVisited) return { label: "Chapter cleared", tone: "complete" };
    return { label: "Ready to deploy", tone: "ready" };
  }, [selected.unlockLevel, selectedUnlocked, selectedVisited]);

  return (
    <main className="story-console relative z-10 mx-auto min-h-screen max-w-7xl px-5 pb-28 pt-28 lg:px-8">
      <header className="story-console__hero">
        <img src="/assets/star-atlas/kQLooz/01-vitaly-tyukin-sand-punaab-fire3.webp" alt="" />
        <div className="story-console__hero-shade" />
        <div className="story-console__hero-copy">
          <button className="story-console__back" onClick={onHome}><ArrowLeft className="h-4 w-4" /> All modes</button>
          <div className="command-kicker"><Radio className="h-3.5 w-3.5" /> Campaign signal online</div>
          <h1>Story Expeditions</h1>
          <p>Trace one living signal across ten chapters. Choose a route, complete a short mission, and change who controls the frontier.</p>
          <button className="story-console__continue" onClick={() => onLaunch(recommended)}>
            <Compass className="h-4 w-4" /> {gameState.visitedPlanets.length ? "Continue campaign" : "Begin chapter one"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="story-console__hero-stats" aria-label="Campaign progress">
          <div><strong>{gameState.visitedPlanets.length}/10</strong><span>chapters cleared</span></div>
          <div><strong>{campaignProgress}%</strong><span>signal traced</span></div>
          <div><strong>{controlledCount}</strong><span>sectors secured</span></div>
        </div>
      </header>

      <section className="story-console__workspace">
        <aside className="story-chapters" aria-label="Campaign chapters">
          <div className="story-chapters__header">
            <div><span>Signal trail</span><strong>Select a chapter</strong></div>
            <Map className="h-5 w-5" />
          </div>
          <div className="story-chapters__list hide-scrollbar">
            {PLANETS.map((planet, index) => {
              const chapterUnlocked = isPlanetUnlocked(planet, gameState.level, gameState.faction);
              const visited = gameState.visitedPlanets.includes(planet.id);
              const isSelected = planet.id === selected.id;
              const planetLore = getSectorLore(planet.id);
              return (
                <button
                  key={planet.id}
                  className={`${isSelected ? "is-selected" : ""} ${visited ? "is-complete" : ""}`}
                  onClick={() => setSelectedId(planet.id)}
                  aria-pressed={isSelected}
                >
                  <span className="story-chapters__number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="story-chapters__node">{visited ? <CheckCircle2 /> : chapterUnlocked ? <span>{planet.emoji}</span> : <LockKeyhole />}</span>
                  <span className="story-chapters__copy"><strong>{planetLore.name}</strong><small>{chapterUnlocked ? planetLore.chapter.split("·").at(-1)?.trim() : `Level ${planet.unlockLevel}`}</small></span>
                  <ArrowRight className="story-chapters__arrow h-4 w-4" />
                </button>
              );
            })}
          </div>
          <div className="story-chapters__footer">
            <Sparkles className="h-4 w-4" />
            <span>{nextUnlock ? `Next chapter opens at level ${nextUnlock.unlockLevel}` : "Every chapter is open"}</span>
          </div>
        </aside>

        <article className="story-dossier">
          <div className="story-dossier__topline">
            <span className={`story-dossier__status is-${status.tone}`}>{status.label}</span>
            <span>Chapter {String(selectedIndex + 1).padStart(2, "0")} / 10</span>
          </div>

          <div className="story-dossier__title">
            <span>{selected.emoji}</span>
            <div><div className="command-kicker">{lore.chapter}</div><h2>{lore.name}</h2><p>{BIOME_LABELS[selected.biome]}</p></div>
          </div>

          <div className="story-dossier__narrative">
            <div><Radio className="h-4 w-4" /><span>Signal fragment</span></div>
            <p>{lore.story}</p>
          </div>

          <div className="story-dossier__objective">
            <Target className="h-5 w-5" />
            <div><span>Mission objective</span><strong>{lore.mission}</strong><small>Threat detected: {lore.threat}</small></div>
          </div>

          <div className="story-dossier__rewards" aria-label="Mission rewards">
            <div><Gem className="h-4 w-4" /><span>Crystals<strong>{selectedVisited ? Math.floor(selected.crystals / 3) : selected.crystals}</strong></span></div>
            <div><Sparkles className="h-4 w-4" /><span>Captain XP<strong>{selectedVisited ? Math.floor(selected.xp / 2) : selected.xp}</strong></span></div>
            <div><PawPrint className="h-4 w-4" /><span>Companion intel<strong>{selected.pet?.name ?? "None"}</strong></span></div>
          </div>

          <div className="story-dossier__influence">
            <div><span><Shield className="h-4 w-4" /> Sector influence</span><strong>{controller ? `${controller.toUpperCase()} controlled` : "Contested frontier"}</strong></div>
            <i aria-label={`MUD ${influence.mud}, ONI ${influence.oni}, USTUR ${influence.ustur}`}>
              <b className="is-mud" style={{ width: `${influence.mud / totalInfluence * 100}%` }} />
              <b className="is-oni" style={{ width: `${influence.oni / totalInfluence * 100}%` }} />
              <b className="is-ustur" style={{ width: `${influence.ustur / totalInfluence * 100}%` }} />
            </i>
            <small>Every completed expedition adds influence for your active faction.</small>
          </div>

          <button className="story-dossier__launch" disabled={!selectedUnlocked} onClick={() => onLaunch(selected)}>
            {selectedUnlocked ? <><Compass className="h-4 w-4" /> {selectedVisited ? "Replay survey" : "Choose route and deploy"} <ArrowRight className="h-4 w-4" /></> : <><LockKeyhole className="h-4 w-4" /> Reach level {selected.unlockLevel}</>}
          </button>
        </article>
      </section>

      <section className="story-flow" aria-label="Story mission flow">
        <div><strong>1</strong><span>Choose chapter<small>Follow the signal trail</small></span></div>
        <ArrowRight />
        <div><strong>2</strong><span>Pick your route<small>Scout, Steady, or Salvage</small></span></div>
        <ArrowRight />
        <div><strong>3</strong><span>Complete objective<small>Earn rewards and influence</small></span></div>
      </section>
    </main>
  );
}
