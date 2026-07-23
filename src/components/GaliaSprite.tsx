const SHEETS = {
  story: { src: "/assets/galia-current/story-exploration-kit-v1.webp", columns: 4, rows: 4 },
  swarm: { src: "/assets/galia-current/swarm-combat-kit-v1.webp", columns: 4, rows: 4 },
  arcade: { src: "/assets/galia-current/arcade-target-kit-v1.webp", columns: 3, rows: 3 },
  discovery: { src: "/assets/galia-current/discovery-collectibles-kit-v1.webp", columns: 4, rows: 4 },
} as const;

export type GaliaSpriteSheet = keyof typeof SHEETS;

export default function GaliaSprite({
  sheet,
  column,
  row,
  className = "",
}: {
  sheet: GaliaSpriteSheet;
  column: number;
  row: number;
  className?: string;
}) {
  const definition = SHEETS[sheet];
  const x = column * (100 / (definition.columns - 1));
  const y = row * (100 / (definition.rows - 1));

  return (
    <span
      aria-hidden="true"
      className={`galia-game-sprite ${className}`}
      style={{
        backgroundImage: `url("${definition.src}")`,
        backgroundPosition: `${x}% ${y}%`,
        backgroundSize: `${definition.columns * 100}% ${definition.rows * 100}%`,
      }}
    />
  );
}
