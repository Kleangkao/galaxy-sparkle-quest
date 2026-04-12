import { useMemo } from "react";

export default function SpaceBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.8,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 2,
        bright: Math.random() < 0.15,
        hue: Math.random() < 0.3 ? (Math.random() < 0.5 ? 190 : 45) : 0,
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Stars */}
      {stars.map((s) => (
        <div
          key={s.id}
          className={`absolute rounded-full ${s.bright ? "animate-twinkle-bright" : "animate-twinkle"}`}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            backgroundColor: s.hue
              ? `hsl(${s.hue} 80% 80%)`
              : `hsl(var(--foreground))`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {/* Nebula blobs — slowly drifting */}
      <div
        className="absolute top-[8%] left-[12%] w-80 h-80 rounded-full animate-nebula-drift"
        style={{
          background: "radial-gradient(circle, hsl(280 80% 65% / 0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute top-[45%] right-[8%] w-[28rem] h-[28rem] rounded-full animate-nebula-drift"
        style={{
          background: "radial-gradient(circle, hsl(190 90% 55% / 0.08) 0%, transparent 70%)",
          filter: "blur(50px)",
          animationDelay: "-7s",
        }}
      />
      <div
        className="absolute bottom-[8%] left-[35%] w-96 h-96 rounded-full animate-nebula-drift"
        style={{
          background: "radial-gradient(circle, hsl(330 85% 65% / 0.08) 0%, transparent 70%)",
          filter: "blur(45px)",
          animationDelay: "-14s",
        }}
      />
      {/* Subtle warm nebula */}
      <div
        className="absolute top-[60%] left-[5%] w-64 h-64 rounded-full animate-nebula-drift"
        style={{
          background: "radial-gradient(circle, hsl(45 95% 60% / 0.06) 0%, transparent 70%)",
          filter: "blur(35px)",
          animationDelay: "-3s",
        }}
      />
    </div>
  );
}
