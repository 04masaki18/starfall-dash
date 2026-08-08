import assert from 'node:assert/strict';
import {
  clamp,
  difficultyAt,
  spawnIntervalAt,
  circlesOverlap,
  formatScore,
  scoreAt,
} from '../game-core.js';

assert.equal(clamp(5, 0, 10), 5);
assert.equal(clamp(-1, 0, 10), 0);
assert.equal(clamp(20, 0, 10), 10);

assert.equal(difficultyAt(0), 1);
assert.ok(difficultyAt(30) > 1);
assert.ok(difficultyAt(999) <= 3.6);

assert.ok(spawnIntervalAt(0) <= .78);
assert.ok(spawnIntervalAt(90) >= .28);

assert.equal(circlesOverlap({ x: 0, y: 0, r: 10 }, { x: 15, y: 0, r: 10 }), true);
assert.equal(circlesOverlap({ x: 0, y: 0, r: 10 }, { x: 30, y: 0, r: 10 }), false);

assert.equal(formatScore(42), '000042');
assert.equal(formatScore(-5), '000000');
assert.equal(scoreAt(10, 2), 150);

console.log('game-core tests: OK');
