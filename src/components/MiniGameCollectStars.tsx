import { useState, useEffect, useCallback } from "react";

interface Props {
  onComplete: (bonus: number) => void;
}

const STARS = ["⭐", "🌟", "💫", "✨", "🌠"];

export default function MiniGameCollectStars({ onComplete }: Props) {
  const [stars, setStars] = useState<{ id: number; x: number; lane: number; caught: boolean }[]>([]);
  const [shipLane, setShipLane] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);

  const spawnStar = useCallback(() => {
    const lane = Math.floor(Math.random() * 3);
    setStars((prev) => [...prev.slice(-10), { id: Date.now() + Math.random(), x: 100, lane, caught: false }]);
  }, []);

  useEffect(() => { const i = setInterval(spawnStar, 500); return () => clearInterval(i); }, [spawnStar]);

  // Move stars
  useEffect(() => {
    const i = setInterval(() => {
      setStars((prev) => {
        return prev.map((s) => ({ ...s, x: s.x - 4 })).filter((s) => s.x > -10);
      });
    }, 50);
    return () => clearInterval(i);
  }, []);

  // Check collisions
  useEffect(() => {
    setStars((prev) => prev.map((s) => {
      if (!s.caught && s.lane === shipLane && s.x < 15 && s.x > 0) {
        setScore((sc) => sc + 1);
        return { ...s, caught: true };
      }
      return s;
    }));
  }, [stars, shipLane]);

  useEffect(() => {
    if (timeLeft <= 0) { onComplete(score); return; }
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, score, onComplete]);

  const lanes = [0, 1, 2];

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md">
      <div className="flex items-center justify-between w-full px-2">
        <span className="text-sm font-bold text-cosmic-purple" style={{ fontFamily: "var(--font-display)" }}>🌈 Collect Stars!</span>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-cosmic-cyan">⭐ {score}</span>
          <span className={`text-sm font-bold ${timeLeft <= 3 ? "text-cosmic-red animate-pulse" : "text-foreground"}`}>⏱️ {timeLeft}s</span>
        </div>
      </div>

      <div className="relative w-full bg-card/40 border border-border rounded-2xl overflow-hidden" style={{ height: 200 }}>
        {lanes.map((lane) => (
          <div key={lane} className="absolute left-0 right-0 flex items-center" style={{ top: `${lane * 33 + 10}%`, height: "26%" }}>
            {/* Lane line */}
            <div className="absolute inset-0 border-b border-border/30" />
          </div>
        ))}

        {/* Ship */}
        <div className="absolute left-[5%] text-3xl transition-all duration-150 z-10"
          style={{ top: `${shipLane * 33 + 12}%` }}>
          🚀
        </div>

        {/* Stars */}
        {stars.filter((s) => !s.caught).map((s) => (
          <div key={s.id} className="absolute text-2xl transition-none"
            style={{ left: `${s.x}%`, top: `${s.lane * 33 + 14}%` }}>
            {STARS[Math.floor(s.id) % STARS.length]}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {lanes.map((lane) => (
          <button key={lane} onClick={() => setShipLane(lane)}
            className={`px-6 py-3 rounded-xl text-sm font-bold transition-all
              ${shipLane === lane ? "bg-cosmic-purple text-primary-foreground scale-105" : "bg-muted text-muted-foreground hover:bg-muted/80"}
            `} style={{ fontFamily: "var(--font-display)" }}>
            {lane === 0 ? "⬆️ Top" : lane === 1 ? "➡️ Mid" : "⬇️ Bot"}
          </button>
        ))}
      </div>
    </div>
  );
}
