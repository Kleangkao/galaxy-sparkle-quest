import starAtlasIcon from "@/assets/star-atlas-icon.png";
import { useI18n } from "@/lib/i18n";
import { playClickSound } from "@/lib/sounds";

interface Props {
  onHome: () => void;
}

export default function GalaxyMapNav({ onHome }: Props) {
  const { t } = useI18n();

  return (
    <button
      onClick={() => { playClickSound(); onHome(); }}
      className="fixed left-4 top-24 z-[60] flex min-h-[48px] items-center gap-2 rounded-2xl border border-border/60 bg-card/92 px-3.5 py-2.5 text-foreground shadow-lg transition-all hover:bg-primary/20 active:scale-95 sm:top-24"
      style={{ fontFamily: "var(--font-display)" }}
    >
      <img src={starAtlasIcon} alt="Star Atlas" className="h-7 w-7 object-contain sm:h-8 sm:w-8" />
      <span className="text-xs font-bold sm:text-sm">{t("backHome")}</span>
    </button>
  );
}
