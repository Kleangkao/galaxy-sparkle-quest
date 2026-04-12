import { useState, useEffect } from "react";

interface Props {
  onComplete: (bonus: number) => void;
}

const ANIMALS = ["🦎", "🐒", "🦜", "🐸", "🦋", "🐛", "🦊", "🐍", "🦥", "🐢"];

export default function MiniGameHiddenAnimals({ onComplete }: Props) {
  const [grid, setGrid] = useState<{ id: number; emoji: string; found: boolean; isAnimal: boolean }[]>([]);
  const [found, setFound] = useState(0);
  const [taps, setTaps] = useState(0);
  const total = 5;

  useEffect(() => {
    const leaves = Array.from({ length: 16 }, (_, i) => ({
      id: i, emoji: "🌿", found: false, isAnimal: false,
    }));
    const animalPositions = new Set<number>();
    while (animalPositions.size < total) animalPositions.add(Math.floor(Math.random() * 16));
    animalPositions.forEach((pos) => {
      leaves[pos].isAnimal = true;
      leaves[pos].emoji = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    });
    setGrid(leaves);
  }, []);

  useEffect(() => {
    if (found === total) {
      const bonus = Math.max(2, 10 - taps);
      setTimeout(() => onComplete(bonus), 500);
    }
  }, [found, taps, onComplete]);

  const handleTap = (id: number) => {
    setTaps((t) => t + 1);
    setGrid((prev) => prev.map((c) => {
      if (c.id === id && !c.found) {
        if (c.isAnimal) { setFound((f) => f + 1); return { ...c, found: true }; }
        return { ...c, found: true };
      }
      return c;
    }));
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      <div className="flex items-center justify-between w-full px-2">
        <span className="text-sm font-bold text-cosmic-green" style={{ fontFamily: "var(--font-display)" }}>🔍 Find {total} Animals!</span>
        <span className="text-sm font-bold text-cosmic-cyan">{found}/{total} found</span>
      </div>
      <div className="grid grid-cols-4 gap-2 w-full">
        {grid.map((cell) => (
          <button key={cell.id} onClick={() => handleTap(cell.id)}
            className={`aspect-square rounded-xl text-2xl sm:text-3xl flex items-center justify-center transition-all duration-200
              ${cell.found
                ? cell.isAnimal ? "bg-cosmic-green/30 border-2 border-cosmic-green scale-95" : "bg-muted/50 border-2 border-border opacity-50"
                : "bg-cosmic-green/20 border-2 border-border hover:scale-105 cursor-pointer"}`}>
            {cell.found ? (cell.isAnimal ? cell.emoji : "🍃") : "🌿"}
          </button>
        ))}
      </div>
    </div>
  );
}
