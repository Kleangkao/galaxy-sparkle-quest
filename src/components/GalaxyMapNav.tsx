import { ArrowLeft, Gamepad2 } from "lucide-react";
import { playClickSound } from "@/lib/sounds";
import { useI18n } from "@/lib/i18n";

interface Props {
  onHome: () => void;
}

export default function GalaxyMapNav({ onHome }: Props) {
  const { tr } = useI18n();
  return (
    <button
      onClick={() => { playClickSound(); onHome(); }}
      className="story-back-button"
      aria-label={tr("Return to all game modes", "กลับไปหน้าเลือกโหมด")}
    >
      <ArrowLeft className="h-4 w-4" />
      <Gamepad2 className="h-4 w-4 text-cosmic-cyan" />
      <span>{tr("All modes", "โหมดทั้งหมด")}</span>
    </button>
  );
}
