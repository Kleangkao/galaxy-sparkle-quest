type Coord = [number, number];

export function getReachableStoryCellKeys(
  walls: Coord[] = [],
  rows = 8,
  cols = 8,
): Set<string> {
  const coordKey = (row: number, col: number) => `${row},${col}`;
  const wallKeys = new Set(walls.map(([row, col]) => coordKey(row, col)));
  const start: Coord = [rows - 1, Math.floor(cols / 2)];
  const reachable = new Set<string>([coordKey(start[0], start[1])]);
  const queue: Coord[] = [start];
  const directions: Coord[] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    directions.forEach(([dr, dc]) => {
      const nextRow = row + dr;
      const nextCol = col + dc;
      const key = coordKey(nextRow, nextCol);
      if (
        nextRow < 0 || nextRow >= rows ||
        nextCol < 0 || nextCol >= cols ||
        wallKeys.has(key) ||
        reachable.has(key)
      ) return;
      reachable.add(key);
      queue.push([nextRow, nextCol]);
    });
  }

  return reachable;
}
