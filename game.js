import {
  WORLD,
  clamp,
  difficultyAt,
  spawnIntervalAt,
  circlesOverlap,
  formatScore,
  scoreAt,
} from './game-core.js';

const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
const scoreValue = document.querySelector('#scoreValue');
const bestValue = document.querySelector('#bestValue');
const finalScore = document.querySelector('#finalScore');
const finalBest = document.querySelector('#finalBest');
const newBest = document.querySelector('#newBest');
const startOverlay = document.querySelector('#startOverlay');
const gameOverOverlay = document.querySelector('#gameOverOverlay');
const startButton = document.querySelector('#startButton');
const retryButton = document.querySelector('#retryButton');
const soundButton = document.querySelector('#soundButton');
const toast = document.querySelector('#toast');

const STORAGE_KEY = 'starfall-dash-best-v1';
let best = Number(localStorage.getItem(STORAGE_KEY) || 0);
bestValue.textContent = formatScore(best);

const input = { left: false, right: false, pointer: false, pointerX: WORLD.width / 2 };
const state = {
  mode: 'menu',
  elapsed: 0,
  nearMisses: 0,
  spawnTimer: 0,
  lastTime: 0,
  shake: 0,
  flash: 0,
  muted: false,
};

let player;
let meteors = [];
let particles = [];
let stars = [];
let audioCtx = null;
let toastTimer = 0;

function createStars() {
  stars = Array.from({ length: 95 }, () => ({
    x: Math.random() * WORLD.width,
    y: Math.random() * WORLD.height,
    size: Math.random() * 1.7 + 0.35,
    speed: Math.random() * 10 + 4,
    alpha: Math.random() * 0.65 + 0.2,
    phase: Math.random() * Math.PI * 2,
  }));
}

function resetGame() {
  player = { x: WORLD.width / 2, y: WORLD.height - 66, r: 17, vx: 0 };
  meteors = [];
  particles = [];
  state.elapsed = 0;
  state.nearMisses = 0;
  state.spawnTimer = 0.25;
  state.shake = 0;
  state.flash = 0;
  scoreValue.textContent = formatScore(0);
}

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function tone(freq, duration, type = 'sine', gain = 0.04, slide = 0) {
  if (state.muted) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(amp).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 520);
}

function startGame() {
  ensureAudio();
  resetGame();
  state.mode = 'playing';
  startOverlay.classList.remove('visible');
  gameOverOverlay.classList.remove('visible');
  tone(420, .12, 'triangle', .035, 180);
  tone(720, .12, 'triangle', .025, 120);
}

function endGame() {
  if (state.mode !== 'playing') return;
  state.mode = 'over';
  state.shake = 16;
  state.flash = 1;
  const score = scoreAt(state.elapsed, state.nearMisses);
  const isBest = score > best;
  if (isBest) {
    best = score;
    localStorage.setItem(STORAGE_KEY, String(best));
  }
  bestValue.textContent = formatScore(best);
  finalScore.textContent = formatScore(score);
  finalBest.textContent = formatScore(best);
  newBest.classList.toggle('visible', isBest);
  setTimeout(() => gameOverOverlay.classList.add('visible'), 420);
  tone(180, .5, 'sawtooth', .055, -100);
  spawnExplosion(player.x, player.y, 42, true);
}

function spawnMeteor() {
  const difficulty = difficultyAt(state.elapsed);
  const r = 13 + Math.random() * 19;
  const edge = r + 10;
  const speed = (125 + Math.random() * 90) * difficulty;
  meteors.push({
    x: edge + Math.random() * (WORLD.width - edge * 2),
    y: -r - 14,
    r,
    speed,
    drift: (Math.random() - .5) * 38,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - .5) * 1.7,
    nearChecked: false,
    seed: Math.random() * 100,
  });
}

function spawnTrail(x, y) {
  if (Math.random() > .62) return;
  particles.push({
    x: x + (Math.random() - .5) * 8,
    y: y + 12,
    vx: (Math.random() - .5) * 18,
    vy: 55 + Math.random() * 35,
    life: .35,
    maxLife: .35,
    size: 2 + Math.random() * 3,
    kind: 'trail',
  });
}

function spawnExplosion(x, y, count, crash = false) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (crash ? 70 : 30) + Math.random() * (crash ? 210 : 90);
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: .4 + Math.random() * .55,
      maxLife: .95,
      size: 1.5 + Math.random() * (crash ? 5 : 3),
      kind: crash ? 'crash' : 'spark',
    });
  }
}

function update(dt) {
  for (const star of stars) {
    star.y += star.speed * dt * (state.mode === 'playing' ? 1.45 : .45);
    star.phase += dt * 1.4;
    if (star.y > WORLD.height + 4) {
      star.y = -4;
      star.x = Math.random() * WORLD.width;
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'crash') p.vy += 75 * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  state.shake = Math.max(0, state.shake - 42 * dt);
  state.flash = Math.max(0, state.flash - 2.7 * dt);
  if (state.mode !== 'playing') return;

  state.elapsed += dt;
  const currentScore = scoreAt(state.elapsed, state.nearMisses);
  scoreValue.textContent = formatScore(currentScore);

  const accel = 1700;
  const maxSpeed = 410;
  if (input.pointer) {
    const dx = input.pointerX - player.x;
    player.vx += clamp(dx * 7.5, -accel, accel) * dt;
  } else {
    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    player.vx += direction * accel * dt;
    if (!direction) player.vx *= Math.pow(.0008, dt);
  }
  player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
  player.x += player.vx * dt;
  player.x = clamp(player.x, 30, WORLD.width - 30);
  spawnTrail(player.x, player.y + 16);

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    spawnMeteor();
    const interval = spawnIntervalAt(state.elapsed);
    state.spawnTimer = interval * (.78 + Math.random() * .43);
    if (state.elapsed > 28 && Math.random() < .13) {
      setTimeout(() => state.mode === 'playing' && spawnMeteor(), 110);
    }
  }

  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.y += m.speed * dt;
    m.x += m.drift * dt;
    m.rotation += m.spin * dt;

    if (circlesOverlap(player, m, 5)) {
      endGame();
      return;
    }

    if (!m.nearChecked && m.y > player.y - 4) {
      m.nearChecked = true;
      const horizontalGap = Math.abs(m.x - player.x) - (m.r + player.r);
      if (horizontalGap >= 0 && horizontalGap < 34) {
        state.nearMisses++;
        showToast('NEAR MISS  +25');
        tone(860, .08, 'triangle', .023, 220);
        spawnExplosion((m.x + player.x) / 2, player.y, 8);
      }
    }

    if (m.y > WORLD.height + m.r + 30 || m.x < -70 || m.x > WORLD.width + 70) {
      meteors.splice(i, 1);
    }
  }
}

function drawBackground(time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, WORLD.height);
  gradient.addColorStop(0, '#090d25');
  gradient.addColorStop(.55, '#070b1a');
  gradient.addColorStop(1, '#040611');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  const nebula = ctx.createRadialGradient(500, 140, 10, 500, 140, 430);
  nebula.addColorStop(0, 'rgba(90, 74, 255, .11)');
  nebula.addColorStop(.5, 'rgba(45, 32, 135, .055)');
  nebula.addColorStop(1, 'rgba(20, 12, 60, 0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  for (const star of stars) {
    const twinkle = .65 + Math.sin(star.phase + time * .001) * .35;
    ctx.globalAlpha = star.alpha * twinkle;
    ctx.fillStyle = '#d9e4ff';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(107, 116, 180, .065)';
  ctx.lineWidth = 1;
  for (let y = 95; y < WORLD.height; y += 74) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD.width, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  if (!player) return;
  const bob = state.mode === 'playing' ? Math.sin(state.elapsed * 7) * 1.4 : 0;
  ctx.save();
  ctx.translate(player.x, player.y + bob);

  const glow = ctx.createRadialGradient(0, 12, 2, 0, 12, 45);
  glow.addColorStop(0, 'rgba(105, 224, 255, .35)');
  glow.addColorStop(1, 'rgba(105, 224, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 10, 45, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 18;
  ctx.shadowColor = 'rgba(117, 105, 255, .7)';
  ctx.fillStyle = '#8174ff';
  ctx.beginPath();
  ctx.moveTo(0, -25);
  ctx.lineTo(19, 18);
  ctx.lineTo(6, 13);
  ctx.lineTo(0, 23);
  ctx.lineTo(-6, 13);
  ctx.lineTo(-19, 18);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e9edff';
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(6, 8);
  ctx.lineTo(0, 4);
  ctx.lineTo(-6, 8);
  ctx.closePath();
  ctx.fill();

  if (state.mode === 'playing') {
    const flame = 9 + Math.random() * 8;
    ctx.fillStyle = 'rgba(97, 236, 255, .9)';
    ctx.beginPath();
    ctx.moveTo(-4, 17);
    ctx.lineTo(0, 17 + flame);
    ctx.lineTo(4, 17);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawMeteor(m) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.rotate(m.rotation);

  const tailLength = clamp(m.speed * .18, 30, 90);
  const tail = ctx.createLinearGradient(0, -m.r - tailLength, 0, m.r);
  tail.addColorStop(0, 'rgba(255, 111, 93, 0)');
  tail.addColorStop(.65, 'rgba(255, 117, 83, .12)');
  tail.addColorStop(1, 'rgba(255, 177, 91, .36)');
  ctx.fillStyle = tail;
  ctx.beginPath();
  ctx.moveTo(-m.r * .6, 0);
  ctx.lineTo(-m.r * .18, -m.r - tailLength);
  ctx.lineTo(m.r * .25, -m.r - tailLength * .85);
  ctx.lineTo(m.r * .7, 0);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 18;
  ctx.shadowColor = 'rgba(255, 114, 82, .44)';
  const rock = ctx.createRadialGradient(-m.r * .35, -m.r * .35, 2, 0, 0, m.r * 1.1);
  rock.addColorStop(0, '#f49b73');
  rock.addColorStop(.35, '#b85e50');
  rock.addColorStop(1, '#552b3f');
  ctx.fillStyle = rock;
  ctx.beginPath();
  ctx.arc(0, 0, m.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(56, 23, 42, .42)';
  const craterData = [
    [-.32, -.18, .22], [.29, .12, .17], [.07, -.42, .11]
  ];
  for (const [cx, cy, cr] of craterData) {
    ctx.beginPath();
    ctx.arc(cx * m.r, cy * m.r, cr * m.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.kind === 'crash' ? '#ff8871' : p.kind === 'trail' ? '#6fe9ff' : '#8ffbe6';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function render(time) {
  const shakeX = state.shake ? (Math.random() - .5) * state.shake : 0;
  const shakeY = state.shake ? (Math.random() - .5) * state.shake : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  drawBackground(time);
  for (const m of meteors) drawMeteor(m);
  drawParticles();
  drawPlayer();
  ctx.restore();

  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 110, 120, ${state.flash * .24})`;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  }

  if (state.mode === 'playing') {
    const d = difficultyAt(state.elapsed);
    const progress = clamp((d - 1) / 2.6, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(28, WORLD.height - 24, 110, 3);
    ctx.fillStyle = 'rgba(130,117,255,.9)';
    ctx.fillRect(28, WORLD.height - 24, 110 * progress, 3);
    ctx.fillStyle = 'rgba(174,183,218,.62)';
    ctx.font = '9px ui-sans-serif, system-ui';
    ctx.fillText(`THREAT ${String(Math.ceil(d * 2)).padStart(2, '0')}`, 28, WORLD.height - 31);
  }
}

function frame(time) {
  const dt = state.lastTime ? clamp((time - state.lastTime) / 1000, 0, .04) : 0;
  state.lastTime = time;
  update(dt);
  render(time);
  requestAnimationFrame(frame);
}

function pointerToWorldX(event) {
  const rect = canvas.getBoundingClientRect();
  return ((event.clientX - rect.left) / rect.width) * WORLD.width;
}

function handlePointerDown(event) {
  if (state.mode !== 'playing') return;
  input.pointer = true;
  input.pointerX = pointerToWorldX(event);
  canvas.setPointerCapture?.(event.pointerId);
}

function handlePointerMove(event) {
  if (!input.pointer || state.mode !== 'playing') return;
  input.pointerX = pointerToWorldX(event);
}

function handlePointerUp() { input.pointer = false; }

const keyMap = {
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

window.addEventListener('keydown', (event) => {
  const action = keyMap[event.key];
  if (action) {
    input[action] = true;
    event.preventDefault();
  }
  if ((event.key === 'Enter' || event.key === ' ') && state.mode !== 'playing') {
    startGame();
    event.preventDefault();
  }
});
window.addEventListener('keyup', (event) => {
  const action = keyMap[event.key];
  if (action) input[action] = false;
});
canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointermove', handlePointerMove);
canvas.addEventListener('pointerup', handlePointerUp);
canvas.addEventListener('pointercancel', handlePointerUp);

startButton.addEventListener('click', startGame);
retryButton.addEventListener('click', startGame);
soundButton.addEventListener('click', () => {
  state.muted = !state.muted;
  soundButton.classList.toggle('muted', state.muted);
  soundButton.textContent = state.muted ? '×' : '♪';
  if (!state.muted) tone(620, .08, 'triangle', .03, 100);
});

document.addEventListener('visibilitychange', () => {
  state.lastTime = performance.now();
});

createStars();
resetGame();
requestAnimationFrame(frame);
