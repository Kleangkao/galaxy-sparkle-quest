import { GameState, SHIP_UPGRADES, SHIP_SKINS, getActiveShipEmoji, getUpgradeCost, getUpgradeTier, MAX_UPGRADE_TIER } from "@/lib/gameState";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  gameState: GameState;
  onBuyUpgrade: (id: string, cost: number) => void;
  onBuySkin: (id: string, cost: number) => void;
  onEquipSkin: (id: string) => void;
  onBack: () => void;
}

export default function ShipUpgradeShop({ gameState, onBuyUpgrade, onBuySkin, onEquipSkin, onBack }: Props) {
  const { t } = useI18n();
  const ownedSkins = gameState.ownedSkins || ["red-rocket"];
  const upgrades = gameState.upgrades || [];
  const activeShipEmoji = getActiveShipEmoji(gameState);
  const installedUpgrades = SHIP_UPGRADES.filter((upgrade) => upgrades.includes(upgrade.id));
  const availableUpgrades = SHIP_UPGRADES.filter((upgrade) => !upgrades.includes(upgrade.id));

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center overflow-visible px-3 pb-24 pt-28 sm:px-6 sm:pb-28 sm:pt-32 md:px-8">
      <button onClick={onBack}
        className="fixed left-4 top-20 z-[60] flex items-center justify-center min-h-[48px] gap-1.5 rounded-2xl border border-border/60 bg-card/92 px-4 py-2 text-foreground shadow-lg transition-colors hover:bg-card sm:top-20">
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-xs sm:text-sm font-bold">{t("galaxyMap")}</span>
      </button>

      <div className="mb-3 text-center animate-slide-up sm:mb-4">
        <div className="text-3xl sm:text-4xl md:text-5xl mb-2 animate-float">{activeShipEmoji}</div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-[-0.03em] text-white" style={{ fontFamily: "var(--font-hero)" }}>{t("shipHangar")}</h2>
        <p className="text-[10px] sm:text-xs text-muted-foreground">💎 {gameState.crystals} {t("crystals")}</p>
      </div>
      <div className="mb-4 grid w-full max-w-xs grid-cols-1 gap-2 sm:mb-5 sm:max-w-md sm:grid-cols-3">
        <div className="rounded-2xl border border-cosmic-cyan/15 bg-cosmic-cyan/5 px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cosmic-cyan">Installed</div>
          <div className="mt-1 text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{installedUpgrades.length}</div>
        </div>
        <div className="rounded-2xl border border-cosmic-purple/15 bg-cosmic-purple/5 px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-cosmic-purple">Owned Skins</div>
          <div className="mt-1 text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{ownedSkins.length}</div>
        </div>
        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/5 px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">Current Ship</div>
          <div className="mt-1 text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>{activeShipEmoji}</div>
        </div>
      </div>

      {/* Ship Skins */}
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mb-4 sm:mb-6 animate-slide-up rounded-[1.5rem] border border-border/50 bg-card/30 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
        <h3 className="text-xs sm:text-sm font-bold text-cosmic-purple mb-2" style={{ fontFamily: "var(--font-display)" }}>{t("shipColors")}</h3>
        <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">{t("skinsRules")}</p>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {SHIP_SKINS.map((skin) => {
            const owned = ownedSkins.includes(skin.id);
            const active = gameState.activeSkin === skin.id;
            const canAfford = gameState.crystals >= skin.cost;
            const levelOk = gameState.level >= skin.requiredLevel;
            return (
              <button key={skin.id}
                onClick={() => {
                  if (owned) {
                    onEquipSkin(skin.id);
                    return;
                  }

                  if (canAfford && levelOk && window.confirm(`Buy ${skin.name} for ${skin.cost} crystals?`)) {
                    onBuySkin(skin.id, skin.cost);
                  }
                }}
                disabled={!owned && (!canAfford || !levelOk)}
                className={`min-h-[48px] p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 text-center transition-all duration-200
                  ${active ? "border-cosmic-green bg-cosmic-green/10 scale-105" : owned ? "border-border bg-card/60 hover:scale-[1.03] cursor-pointer" : canAfford && levelOk ? "border-border bg-card/40 hover:bg-card/60 cursor-pointer" : "border-border/40 bg-card/20 opacity-50"}
                `}>
                <div className="text-xl sm:text-2xl mb-0.5 sm:mb-1">{skin.emoji}</div>
                <div className="text-[11px] sm:text-xs font-bold text-foreground mt-1">{skin.name}</div>
                {active && <span className="text-[10px] sm:text-[11px] text-cosmic-green font-bold">{t("equipped")}</span>}
                {!owned && <span className="text-[10px] sm:text-[11px] text-cosmic-cyan font-bold">💎 {skin.cost}</span>}
                {!owned && !levelOk && <span className="text-[10px] sm:text-[11px] text-cosmic-yellow block">🔒 Lvl {skin.requiredLevel}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upgrades */}
      <div className="w-full max-w-xs animate-slide-up rounded-[1.5rem] border border-border/50 bg-card/30 p-4 pb-6 shadow-[0_12px_30px_rgba(0,0,0,0.18)] sm:max-w-sm sm:pb-8 md:max-w-md">
        <h3 className="text-xs sm:text-sm font-bold text-cosmic-cyan mb-2" style={{ fontFamily: "var(--font-display)" }}>{t("upgrades")}</h3>
        <p className="mb-3 rounded-xl border border-cosmic-cyan/20 bg-cosmic-cyan/5 px-3 py-2 text-[11px] leading-relaxed text-cyan-50/85 sm:text-xs">
          Permanent ship systems apply automatically. Reward systems help every mode; timer systems help Story, Swarm, and Arcade; discovery systems help Story; shields also add Swarm hull.
        </p>

        {installedUpgrades.length > 0 && (
          <div className="mb-3 rounded-xl border border-cosmic-green/20 bg-cosmic-green/5 p-3">
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-cosmic-green sm:text-xs" style={{ fontFamily: "var(--font-display)" }}>
              {t("installedSystems")}
            </div>
            <div className="flex flex-col gap-2">
              {installedUpgrades.map((upgrade) => (
                <div key={upgrade.id} className="rounded-lg border border-cosmic-green/15 bg-background/20 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{upgrade.emoji}</span>
                    <span className="text-xs font-bold text-foreground sm:text-sm">{upgrade.name}</span>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.14em] text-cosmic-green">Tier {getUpgradeTier(gameState, upgrade.id)}/{MAX_UPGRADE_TIER}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">{upgrade.effect}</p>
                  {getUpgradeTier(gameState, upgrade.id) < MAX_UPGRADE_TIER && (() => {
                    const tier = getUpgradeTier(gameState, upgrade.id);
                    const cost = getUpgradeCost(upgrade, tier);
                    const available = gameState.crystals >= cost;
                    return <button className="mt-2 w-full rounded-lg border border-cosmic-cyan/30 bg-cosmic-cyan/10 px-3 py-2 text-xs font-bold text-cosmic-cyan disabled:opacity-40" disabled={!available} onClick={() => available && window.confirm(`Upgrade ${upgrade.name} to Tier ${tier + 1} for ${cost} crystals?`) && onBuyUpgrade(upgrade.id, cost)}>Upgrade to Tier {tier + 1} · 💎 {cost}</button>;
                  })()}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
          {availableUpgrades.map((up) => {
            const isOwned = upgrades.includes(up.id);
            const cost = getUpgradeCost(up, 0);
            const canAfford = gameState.crystals >= cost;
            const levelOk = gameState.level >= up.requiredLevel;
            const available = !isOwned && canAfford && levelOk;
            return (
              <button key={up.id} onClick={() => {
                if (available && window.confirm(`Install ${up.name} for ${cost} crystals?`)) {
                  onBuyUpgrade(up.id, cost);
                }
              }}
                disabled={!available}
                className={`flex items-center min-h-[48px] gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 text-left transition-all duration-200
                  ${isOwned ? "border-cosmic-green/50 bg-cosmic-green/10" : available ? "border-border bg-card/60 hover:scale-[1.02] cursor-pointer" : "border-border/40 bg-card/20 opacity-50"}
                `}>
                <span className="text-xl sm:text-2xl shrink-0">{up.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-foreground block">{up.name}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground block line-clamp-2">{up.description}</span>
                  <span className="text-[10px] sm:text-xs text-foreground/80 block mt-0.5 leading-relaxed">{up.effect}</span>
                  {!isOwned && <span className={`text-[10px] sm:text-xs font-bold block mt-0.5 ${canAfford ? "text-cosmic-cyan" : "text-cosmic-red"}`}>💎 {up.cost}</span>}
                  {isOwned && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="text-[10px] sm:text-xs text-cosmic-green font-bold block">{t("owned")}</span>
                      <span className="text-[10px] sm:text-xs text-cosmic-cyan font-bold block">{t("permanentPassive")}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {availableUpgrades.length === 0 && (
          <div className="mt-3 rounded-xl border border-cosmic-green/20 bg-cosmic-green/5 px-4 py-3 text-center text-xs text-cosmic-green sm:text-sm">
            Every ship system is installed. Raise each one to Tier 3 to complete the hangar.
          </div>
        )}
      </div>
    </div>
  );
}
