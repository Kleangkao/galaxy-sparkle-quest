import { useState } from "react";
import { motion } from "framer-motion";
import { FACTIONS, FactionId } from "@/lib/gameState";
import starAtlasLogo from "@/assets/star-atlas-logo.png";
import factionMud from "@/assets/faction-mud.png";
import factionOni from "@/assets/faction-oni.png";
import factionUstur from "@/assets/faction-ustur.png";
import { useI18n } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";

const FACTION_IMAGES: Record<FactionId, string> = {
  mud: factionMud,
  oni: factionOni,
  ustur: factionUstur,
};

interface Props {
  onSelect: (factionId: FactionId) => void;
}

export default function FactionSelect({ onSelect }: Props) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<FactionId | null>(null);

  const handleSelect = (id: FactionId) => setSelected(id);
  const handleConfirm = () => { if (selected) onSelect(selected); };
  const selectedFaction = FACTIONS.find((f) => f.id === selected);
  const getBonusClassName = (factionId: FactionId) => {
    if (factionId === "mud") {
      return "border border-cosmic-red bg-cosmic-red/20 text-cosmic-red shadow-[0_0_18px_hsl(var(--cosmic-red)/0.2)]";
    }

    if (factionId === "oni") {
      return "border border-cosmic-cyan bg-cosmic-cyan/20 text-cosmic-cyan";
    }

    return "border border-cosmic-yellow bg-cosmic-yellow/20 text-cosmic-yellow";
  };

  return (
    <div className="space-bg min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-y-auto">
      {/* Language toggle */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50">
        <LanguageToggle />
      </div>

      <div className="text-center mb-4 sm:mb-6 md:mb-8 animate-slide-up">
        <img src={starAtlasLogo} alt="Star Atlas" className="h-16 sm:h-24 md:h-32 lg:h-36 mx-auto mb-2 sm:mb-4 opacity-90" />
        <h1
          className="mx-auto mb-1 whitespace-nowrap text-[clamp(2rem,6vw,4.75rem)] font-black leading-[0.95] tracking-[-0.04em] text-white sm:mb-2"
          style={{
            fontFamily: "var(--font-hero)",
            textShadow: "0 0 18px hsl(330 85% 65% / 0.35), 0 0 36px hsl(280 80% 65% / 0.18)",
          }}
        >
          {t("cosmicExplorerGalaxy")}
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground" style={{ fontFamily: "var(--font-display)" }}>
          {t("chooseTeam")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl mb-4 sm:mb-6 md:mb-8">
        {FACTIONS.map((faction, i) => (
          <button key={faction.id} onClick={() => handleSelect(faction.id)}
            className={`relative flex flex-row sm:flex-col items-center sm:items-stretch gap-3 sm:gap-4 p-4 sm:p-5 min-h-[100px] sm:min-h-[360px] rounded-2xl border-2 transition-all duration-300 animate-slide-up
              ${selected === faction.id
                ? `${faction.borderClass} bg-card/80 scale-[1.02] sm:scale-105 shadow-lg`
                : "border-border bg-card/40 hover:bg-card/60 hover:scale-[1.01] sm:hover:scale-102"}
            `}
            style={{ animationDelay: `${i * 0.15}s` }}>
            <div className="flex w-20 sm:w-full shrink-0 justify-center">
              <img
                src={FACTION_IMAGES[faction.id]}
                alt={faction.name}
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 object-contain animate-float shrink-0"
                style={{ animationDelay: `${i * 0.5}s` }}
              />
            </div>
            <div className="text-left sm:text-center flex flex-1 min-w-0 flex-col sm:h-full">
              <div className={`text-base sm:text-lg md:text-xl font-bold ${faction.colorClass}`} style={{ fontFamily: "var(--font-display)" }}>
                {faction.emoji} {faction.name}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                {t(`${faction.id}Subtitle` as any)}
              </div>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed sm:flex-1">
                {t(`${faction.id}Description` as any)}
              </p>
              <div className={`mt-3 flex min-h-[44px] w-full items-center justify-center rounded-2xl px-3 py-2 text-center text-xs font-bold leading-snug sm:min-h-[56px] sm:px-4 sm:text-sm ${getBonusClassName(faction.id)}`}>
                {faction.id === "mud" ? t("mudBonus2") : faction.id === "oni" ? t("oniBonus") : t("usturBonus")}
              </div>
            </div>
            {selected === faction.id && (
              <div className={`absolute -top-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full ${faction.bgClass} flex items-center justify-center text-xs sm:text-sm font-bold`}>✓</div>
            )}
          </button>
        ))}
      </div>

      {selected && selectedFaction && (
        <motion.button
          onClick={handleConfirm}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`relative w-full max-w-sm overflow-hidden rounded-2xl px-6 py-4 text-base font-bold text-accent-foreground shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:max-w-xl sm:px-8 sm:text-lg ${selectedFaction.bgClass}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          <motion.div
            animate={{ x: ["-120%", "160%"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.1 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
          <span className="relative z-10">{t("joinFaction")} {selectedFaction.name}! 🚀</span>
        </motion.button>
      )}
    </div>
  );
}
