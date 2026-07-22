export function getStoryStepCount(dashReady: boolean, dashRequested: boolean) {
  return dashReady && dashRequested ? 2 : 1;
}

export function isOrthogonallyAdjacent(rowA: number, colA: number, rowB: number, colB: number) {
  return Math.abs(rowA - rowB) + Math.abs(colA - colB) === 1;
}
