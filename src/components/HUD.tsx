import type { LucideIcon } from "lucide-react";
import {
  Binoculars,
  Crosshair,
  Gamepad2,
  Info,
  Map,
  PawPrint,
  RefreshCw,
  Shield,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { GameState, getRank, getXPProgress, getFaction, canClaimDaily, countControlled, PLANETS } from "@/lib/gameState";
import { useI18n } from "@/lib/i18n";

export type AppScreen = "hub" | "map" | "planet" | "shop" | "pets" | "info" | "swarm" | "arcade-select" | "arcade" | "discovery" | "strategy";

interface Props {
  gameState: GameState;
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onClaimDaily?: () => void;
  onLogoClick?: () => void;
}

interface DockItem {
  label: string;
  icon: LucideIcon;
  screen: AppScreen;
  active: (screen: AppScreen) => boolean;
}

const DOCK_ITEMS: DockItem[] = [
  { label: "Modes", icon: Gamepad2, screen: "hub", active: (screen) => screen === "hub" },
  { label: "Story", icon: Map, screen: "map", active: (screen) => screen === "map" || screen === "planet" },
  { label: "Swarm", icon: Swords, screen: "swarm", active: (screen) => screen === "swarm" },
  { label: "Arcade", icon: Crosshair, screen: "arcade-select", active: (screen) => screen === "arcade" || screen === "arcade-select" },
  { label: "Discover", icon: Binoculars, screen: "discovery", active: (screen) => screen === "discovery" },
  { label: "Control", icon: Shield, screen: "strategy", active: (screen) => screen === "strategy" },
  { label: "Crew", icon: Users, screen: "shop", active: (screen) => screen === "shop" },
];

export default function HUD({ gameState, activeScreen, onNavigate, onClaimDaily, onLogoClick }: Props) {
  const { t } = useI18n();
  const rank = getRank(gameState.level);
  const xpInfo = getXPProgress(gameState.xp, gameState.level);
  const faction = getFaction(gameState.faction);
  const dailyAvailable = canClaimDaily(gameState.lastDailyReward);
  const controlled = gameState.faction ? countControlled(gameState.influence, gameState.faction) : 0;

  return (
    <>
      <header className="app-status-bar">
        <div className="app-status-bar__captain">
          <Sparkles className="h-4 w-4 text-cosmic-yellow" />
          <div>
            <strong>{rank.name}</strong>
            <span>{gameState.xp}/{xpInfo.next} {t("xp")}</span>
          </div>
          <i aria-label={`${Math.round(xpInfo.progress)}% to next rank`}><b style={{ width: `${xpInfo.progress}%` }} /></i>
        </div>

        <div className="app-status-bar__actions">
          {faction && (
            <button className={`faction-switch ${faction.colorClass}`} onClick={onLogoClick} title="Switch faction without deleting progress">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{faction.name}</span>
              <small>Switch faction</small>
            </button>
          )}
          {controlled > 0 && <span className="status-chip"><Shield className="h-3.5 w-3.5" /> {controlled}/{PLANETS.length}</span>}
          <span className="status-chip status-chip--crystals">◆ {gameState.crystals}</span>
          {dailyAvailable && onClaimDaily && (
            <motion.button className="daily-chip" onClick={onClaimDaily} animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>
              Daily +
            </motion.button>
          )}
          <button className="status-icon-button" onClick={() => onNavigate("pets")} aria-label={`Companions, ${gameState.pets.length} owned`} title="Companions">
            <PawPrint className="h-4 w-4" /><span>{gameState.pets.length}</span>
          </button>
          <button className="status-icon-button" onClick={() => onNavigate("info")} aria-label="Game guide" title="Game guide">
            <Info className="h-4 w-4" />
          </button>
        </div>
      </header>

      <nav className="command-dock hide-scrollbar" aria-label="Game modes">
        {DOCK_ITEMS.map((item) => (
          <DockButton key={item.label} item={item} activeScreen={activeScreen} onNavigate={onNavigate} />
        ))}
      </nav>
    </>
  );
}

function DockButton({ item, activeScreen, onNavigate }: { item: DockItem; activeScreen: AppScreen; onNavigate: (screen: AppScreen) => void }) {
  const Icon = item.icon;
  const isActive = item.active(activeScreen);
  return (
    <button className={isActive ? "is-active" : ""} onClick={() => onNavigate(item.screen)} aria-current={isActive ? "page" : undefined}>
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </button>
  );
}
