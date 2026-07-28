import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { playClickSound } from "@/lib/sounds";

export default function LanguageToggle() {
  const { lang, setLang } = useI18n();

  const toggle = () => {
    playClickSound();
    setLang(lang === "en" ? "th" : "en");
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      className="language-toggle flex min-h-[44px] items-center gap-1 rounded-xl border border-border/60 bg-card/60 px-2.5 py-1.5 text-foreground shadow-sm transition-all hover:bg-card/80"
      title={lang === "en" ? "เปลี่ยนเป็นภาษาไทย" : "Switch to English"}
    >
      <span className="language-toggle__icon text-sm" aria-hidden="true">🌐</span>
      <span className="language-toggle__label text-xs font-bold" style={{ fontFamily: "var(--font-display)" }}>
        {lang === "en" ? "EN / ไทย" : "ไทย / EN"}
      </span>
    </motion.button>
  );
}
