export const WORLD = Object.freeze({ width: 960, height: 540 });

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function difficultyAt(seconds) {
  return 1 + Math.min(2.6, seconds / 34);
}

export function spawnIntervalAt(seconds) {
  return Math.max(0.28, 0.78 - seconds * 0.0085);
}

export function circlesOverlap(a, b, padding = 0) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const r = Math.max(0, a.r + b.r - padding);
  return dx * dx + dy * dy < r * r;
}

export function formatScore(score) {
  return String(Math.max(0, Math.floor(score))).padStart(6, '0');
}

export function scoreAt(seconds, nearMisses = 0) {
  return Math.floor(seconds * 10 + nearMisses * 25);
}
