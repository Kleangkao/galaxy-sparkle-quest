import type { LucideIcon } from "lucide-react";
import {
  Binoculars,
  Crosshair,
  Gamepad2,
  Info,
  Map,
  PawPrint,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { GameState, getRank, getXPProgress, getFaction, canClaimDaily, countControlled, PLANETS } from "@/lib/gameState";
import { useI18n } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";

export type AppScreen = "hub" | "map" | "planet" | "shop" | "pets" | "info" | "swarm" | "arcade-select" | "arcade" | "discovery" | "strategy" | "progress";

interface Props {
  gameState: GameState;
  activeScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onClaimDaily?: () => void;
  onLogoClick?: () => void;
  onOpenSettings?: () => void;
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
  { label: "Progress", icon: Trophy, screen: "progress", active: (screen) => screen === "progress" },
  { label: "Crew", icon: Users, screen: "shop", active: (screen) => screen === "shop" },
];

export default function HUD({ gameState, activeScreen, onNavigate, onClaimDaily, onLogoClick, onOpenSettings }: Props) {
  const { t, tr } = useI18n();
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
            <strong>{tr(rank.name, rank.name === "Explorer" ? "นักสำรวจ" : rank.name)}</strong>
            <span>{gameState.xp}/{xpInfo.next} {t("xp")}</span>
          </div>
          <i aria-label={`${Math.round(xpInfo.progress)}% to next rank`}><b style={{ width: `${xpInfo.progress}%` }} /></i>
        </div>

        <div className="app-status-bar__actions">
          {faction && (
            <button className={`faction-switch ${faction.colorClass}`} onClick={onLogoClick} title={tr("Switch faction without deleting progress", "เปลี่ยนฝ่ายได้โดยเซฟเดิมไม่หาย")}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{faction.name}</span>
              <small>{tr("Switch faction", "เปลี่ยนฝ่าย")}</small>
            </button>
          )}
          {controlled > 0 && <span className="status-chip"><Shield className="h-3.5 w-3.5" /> {controlled}/{PLANETS.length}</span>}
          <span className="status-chip status-chip--crystals">◆ {gameState.crystals}</span>
          {dailyAvailable && onClaimDaily && (
            <motion.button className="daily-chip" onClick={onClaimDaily} animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>
              Daily +
            </motion.button>
          )}
          <button className="status-icon-button" onClick={() => onNavigate("pets")} aria-label={tr(`Companions, ${gameState.pets.length} owned`, `เพื่อนร่วมทาง ${gameState.pets.length} ตัว`)} title={tr("Companions", "เพื่อนร่วมทาง")}>
            <PawPrint className="h-4 w-4" /><span>{gameState.pets.length}</span>
          </button>
          <button className="status-icon-button" onClick={() => onNavigate("info")} aria-label={tr("Game guide", "คู่มือเกม")} title={tr("Game guide", "คู่มือเกม")}>
            <Info className="h-4 w-4" />
          </button>
          <button className="status-icon-button" onClick={onOpenSettings} aria-label={tr("Game settings", "ตั้งค่าเกม")} title={tr("Game settings", "ตั้งค่าเกม")}>
            <Settings className="h-4 w-4" />
          </button>
          <LanguageToggle />
        </div>
      </header>

      {activeScreen !== "hub" && (
        <nav className="command-dock hide-scrollbar" aria-label={tr("Game modes", "โหมดเกม")}>
          {DOCK_ITEMS.map((item) => (
            <DockButton key={item.label} item={item} activeScreen={activeScreen} onNavigate={onNavigate} />
          ))}
        </nav>
      )}
    </>
  );
}

function DockButton({ item, activeScreen, onNavigate }: { item: DockItem; activeScreen: AppScreen; onNavigate: (screen: AppScreen) => void }) {
  const { tr } = useI18n();
  const Icon = item.icon;
  const isActive = item.active(activeScreen);
  return (
    <button className={isActive ? "is-active" : ""} onClick={() => onNavigate(item.screen)} aria-current={isActive ? "page" : undefined}>
      <Icon className="h-4 w-4" />
      <span>{tr(item.label, {
        Modes: "โหมด",
        Story: "เนื้อเรื่อง",
        Swarm: "ฝ่าศัตรู",
        Arcade: "ยิงเป้า",
        Discover: "สำรวจ",
        Control: "วางแผน",
        Progress: "ความคืบหน้า",
        Crew: "จัดทีม",
      }[item.label] ?? item.label)}</span>
    </button>
  );
}
