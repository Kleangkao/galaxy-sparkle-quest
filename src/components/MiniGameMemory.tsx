import { useState, useEffect, useCallback } from "react";

interface Props {
  onComplete: (bonusCrystals: number) => void;
}

const SYMBOLS = ["👽", "🛸", "🌀", "🔮", "🪐", "⭐", "🌙", "🦋"];

export default function MiniGameMemory({ onComplete }: Props) {
  const [cards, setCards] = useState<{ id: number; symbol: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const totalPairs = 6;

  useEffect(() => {
    const selected = SYMBOLS.slice(0, totalPairs);
    const deck = [...selected, ...selected]
      .sort(() => Math.random() - 0.5)
      .map((symbol, i) => ({ id: i, symbol, flipped: false, matched: false }));
    setCards(deck);
  }, []);

  useEffect(() => {
    if (matches === totalPairs) {
      const bonus = Math.max(1, 8 - Math.floor(moves / 4));
      setTimeout(() => onComplete(bonus), 600);
    }
  }, [matches, moves, onComplete]);

  const handleFlip = (id: number) => {
    if (locked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newCards = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      const [a, b] = newFlipped;
      const cardA = newCards.find((c) => c.id === a)!;
      const cardB = newCards.find((c) => c.id === b)!;

      if (cardA.symbol === cardB.symbol) {
        setCards((prev) => prev.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c)));
        setMatches((m) => m + 1);
        setFlippedIds([]);
        setLocked(false);
      } else {
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c)));
          setFlippedIds([]);
          setLocked(false);
        }, 800);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      <div className="flex items-center justify-between w-full px-2">
        <div className="text-sm font-bold text-cosmic-pink" style={{ fontFamily: "var(--font-display)" }}>
          🔮 Memory Puzzle
        </div>
        <span className="text-sm font-bold text-muted-foreground">Moves: {moves}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 w-full">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            className={`aspect-square rounded-xl text-2xl sm:text-3xl flex items-center justify-center transition-all duration-300 font-bold
              ${card.matched ? "bg-cosmic-pink/30 border-2 border-cosmic-pink scale-95" : card.flipped ? "bg-card border-2 border-cosmic-purple" : "bg-muted hover:bg-muted/80 border-2 border-border hover:scale-105 cursor-pointer"}
            `}
          >
            {card.flipped || card.matched ? card.symbol : "❓"}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Match all {totalPairs} pairs!</p>
    </div>
  );
}
