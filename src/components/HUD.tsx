import { GameState, getRank, getXPProgress, getFaction, canClaimDaily, countControlled, PLANETS } from "@/lib/gameState";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

type Screen = "map" | "planet" | "shop" | "pets" | "info";

interface Props {
  gameState: GameState;
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  onClaimDaily?: () => void;
  onLogoClick?: () => void;
}

export default function HUD({ gameState, activeScreen, onNavigate, onClaimDaily, onLogoClick }: Props) {
  const { t } = useI18n();
  const rank = getRank(gameState.level);
  const xpInfo = getXPProgress(gameState.xp, gameState.level);
  const faction = getFaction(gameState.faction);
  const dailyAvailable = canClaimDaily(gameState.lastDailyReward);
  const controlled = gameState.faction ? countControlled(gameState.influence, gameState.faction) : 0;
  const activeSectors = Object.values(gameState.influence).filter((sector) => sector.mud + sector.oni + sector.ustur > 0).length;

  return (
    <>
      {/* Top Status Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-3 py-2 sm:px-5 sm:py-2.5 bg-card/90 backdrop-blur-md border-b border-border/60 shadow-lg">
        {/* Left: Logo + Rank */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-bold text-foreground truncate" style={{ fontFamily: "var(--font-display)" }}>
                {rank.emoji} {rank.name}
              </span>
              {faction && (
                <span className={`text-xs font-bold ${faction.colorClass} shrink-0`}>
                  {faction.name}
                </span>
              )}
              <span className="hidden rounded-full border border-border/50 bg-background/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:inline-flex">
                {t("sectorIntel")}
              </span>
            </div>
            {/* XP Bar */}
            <div className="mt-1 flex items-center gap-1.5">
              <div className="h-2 w-14 overflow-hidden rounded-full bg-muted sm:w-24">
                <motion.div
                  className="h-full bg-cosmic-yellow rounded-full"
                  animate={{ width: `${xpInfo.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-[11px] sm:text-xs text-muted-foreground font-medium whitespace-nowrap">
                {gameState.xp}/{xpInfo.next} {t("xp")}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Lang toggle + Planets controlled + Currency + Daily */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {activeSectors > 0 && (
            <div className="flex items-center gap-1 rounded-lg bg-card/60 px-2 py-1 text-muted-foreground" title={t("activeSectors")}>
              <span className="text-sm">📡</span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70 lg:inline">{t("activeIntelCount")}</span>
              <span className="text-xs font-bold">{activeSectors}</span>
            </div>
          )}
          {controlled > 0 && (
            <div className={`flex items-center gap-1 ${faction?.colorClass || "text-muted-foreground"} bg-card/60 px-2 py-1 rounded-lg`} title={t("localControl")}>
              <span className="text-sm">🛰️</span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70 lg:inline">{t("controlledCount")}</span>
              <span className="text-xs font-bold">{controlled}/{PLANETS.length}</span>
            </div>
          )}
          <div className="flex items-center gap-1 rounded-xl bg-cosmic-cyan/10 px-2.5 py-1.5" title={t("crystals")}>
            <span className="text-base">💎</span>
            <span className="text-sm font-bold text-cosmic-cyan">{gameState.crystals}</span>
          </div>
          {dailyAvailable && onClaimDaily && (
            <motion.button
              onClick={onClaimDaily}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="min-h-[44px] px-3 py-1.5 rounded-xl bg-cosmic-yellow text-accent-foreground font-bold text-sm shadow-lg"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("daily")}
            </motion.button>
          )}
        </div>
      </div>

      {/* Bottom Navigation Bar - always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around px-2 py-1.5 sm:py-2 bg-card/90 backdrop-blur-md border-t border-border/60 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <NavButton emoji="🗺️" label={t("galaxy")} active={activeScreen === "map"} onClick={() => onNavigate("map")} />
        <NavButton emoji="🚀" label={t("ships")} active={activeScreen === "shop"} onClick={() => onNavigate("shop")} />
        <NavButton emoji="🐾" label={t("pets")} active={activeScreen === "pets"} onClick={() => onNavigate("pets")} badge={gameState.pets.length} />
        <NavButton emoji="ℹ️" label={t("info")} active={activeScreen === "info"} onClick={() => onNavigate("info")} />
      </div>
    </>
  );
}

function NavButton({ emoji, label, active, onClick, badge, disabled }: {
  emoji: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[64px] min-h-[56px] px-3 py-1.5 rounded-xl transition-all
        ${active ? "translate-y-[-1px] bg-primary/12 text-primary shadow-[0_10px_24px_rgba(16,185,129,0.14)]" : disabled ? "text-muted-foreground/40 cursor-not-allowed" : "text-muted-foreground hover:text-foreground hover:bg-card/60 active:scale-95"}
      `}
    >
      {active && (
        <span className="absolute inset-x-4 top-1 h-[3px] rounded-full bg-primary/70" />
      )}
      <span className="text-xl sm:text-2xl">{emoji}</span>
      <span className="text-[11px] sm:text-xs font-bold" style={{ fontFamily: "var(--font-display)" }}>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-cosmic-pink text-[10px] font-bold text-primary-foreground flex items-center justify-center">
          {badge}
        </span>
      )}
      {disabled && (
        <span className="absolute -top-1 -right-1 text-[10px]">🔒</span>
      )}
    </button>
  );
}
