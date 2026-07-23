const POSITIONS = {
  "red-rocket": [1, 0],
  "candy-ship": [0, 0],
  "ice-ship": [2, 0],
  "jungle-cruiser": [3, 0],
  shield: [0, 1],
  booster: [1, 1],
  scanner: [2, 1],
  garden: [3, 1],
  wings: [0, 2],
  crown: [1, 2],
} as const;

type SpriteId = keyof typeof POSITIONS;

export default function GaliaHangarSprite({ id, className = "" }: { id: string; className?: string }) {
  const position = POSITIONS[id as SpriteId];
  if (!position) return null;

  return (
    <span
      aria-hidden="true"
      className={`galia-hangar-sprite ${className}`}
      style={{
        backgroundPosition: `${position[0] * (100 / 3)}% ${position[1] * 50}%`,
      }}
    />
  );
}
