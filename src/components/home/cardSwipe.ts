export function getCardSwipeStep(direction: "up" | "down" | "left" | "right", dx: number, dy: number): -1 | 0 | 1 {
  const horizontal = direction === "left" || direction === "right";
  const along = (horizontal ? dx : dy) * (direction === "left" || direction === "up" ? -1 : 1);
  const across = Math.abs(horizontal ? dy : dx);
  if (Math.abs(along) < 36 || Math.abs(along) < across * 1.4) return 0;
  return along > 0 ? 1 : -1;
}
