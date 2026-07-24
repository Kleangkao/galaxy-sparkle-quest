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
      className="flex items-center gap-1 min-h-[44px] px-2.5 py-1.5 rounded-xl bg-card/60 border border-border/60 text-foreground hover:bg-card/80 transition-all shadow-sm"
      title={lang === "en" ? "เปลี่ยนเป็นภาษาไทย" : "Switch to English"}
    >
      <span className="text-sm">🌐</span>
      <span className="text-xs font-bold" style={{ fontFamily: "var(--font-display)" }}>
        {lang === "en" ? "EN / ไทย" : "ไทย / EN"}
      </span>
    </motion.button>
  );
}
