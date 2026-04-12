import { useState, useEffect, useCallback } from "react";

interface Props {
  title: string;
  emojis: string[];
  onComplete: (bonus: number) => void;
}

export default function MiniGameTapCrystals({ title, emojis, onComplete }: Props) {
  const [items, setItems] = useState<{ id: number; x: number; y: number; size: number; tapped: boolean; emoji: string }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);

  const spawn = useCallback(() => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-14), {
      id, x: 5 + Math.random() * 85, y: 5 + Math.random() * 80,
      size: 32 + Math.random() * 20, tapped: false,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }]);
  }, [emojis]);

  useEffect(() => { const i = setInterval(spawn, 600); return () => clearInterval(i); }, [spawn]);

  useEffect(() => {
    if (timeLeft <= 0) { onComplete(score); return; }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, score, onComplete]);

  const handleTap = (id: number) => {
    setItems((prev) => prev.map((c) => (c.id === id && !c.tapped ? { ...c, tapped: true } : c)));
    setScore((s) => s + 1);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md">
      <div className="flex items-center justify-between w-full px-2">
        <span className="text-sm font-bold text-cosmic-yellow" style={{ fontFamily: "var(--font-display)" }}>{title}</span>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-cosmic-cyan">💎 {score}</span>
          <span className={`text-sm font-bold ${timeLeft <= 3 ? "text-cosmic-red animate-pulse" : "text-foreground"}`}>⏱️ {timeLeft}s</span>
        </div>
      </div>
      <div className="relative w-full bg-card/40 border border-border rounded-2xl overflow-hidden" style={{ height: 300 }}>
        {items.map((c) => !c.tapped ? (
          <button key={c.id} onClick={() => handleTap(c.id)}
            className="absolute transition-all duration-150 hover:scale-125 active:scale-90 animate-slide-up cursor-pointer"
            style={{ left: `${c.x}%`, top: `${c.y}%`, fontSize: c.size, transform: "translate(-50%, -50%)" }}>
            {c.emoji}
          </button>
        ) : (
          <span key={c.id} className="absolute text-cosmic-yellow font-bold text-sm animate-fade-out pointer-events-none"
            style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}>+1</span>
        ))}
      </div>
    </div>
  );
}
