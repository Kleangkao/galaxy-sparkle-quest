import { ArrowLeft, Gamepad2 } from "lucide-react";
import { playClickSound } from "@/lib/sounds";

interface Props {
  onHome: () => void;
}

export default function GalaxyMapNav({ onHome }: Props) {
  return (
    <button
      onClick={() => { playClickSound(); onHome(); }}
      className="story-back-button"
      aria-label="Return to all game modes"
    >
      <ArrowLeft className="h-4 w-4" />
      <Gamepad2 className="h-4 w-4 text-cosmic-cyan" />
      <span>All modes</span>
    </button>
  );
}
