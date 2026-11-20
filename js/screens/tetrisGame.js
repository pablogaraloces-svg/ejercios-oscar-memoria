import { GameSounds } from "../core/gameSounds.js";
import { Voice } from "../core/voice.js";
import { recordGameSession, getGameStats } from "../core/gameStats.js";
import { burstConfetti } from "../core/confetti.js";
import { Mascot } from "../core/mascot.js";

/**
 * tetrisGame.js — Tetris sencillo, fiel al original:
 *  - Tablero de 10 x 20, las 7 piezas clásicas (I, O, T, S, Z, J, L)
 *    con sus colores de siempre, rotación con "empujón" en las paredes.
 *  - Pieza siguiente, líneas, niveles (cada 10 líneas cae más rápido) y
 *    puntuación del Tetris de NES (40 / 100 / 300 / 1200 x nivel).
 *  - Música: "Korobéiniki" (canción popular rusa del s. XIX, la melodía
 *    clásica del Tetris), en versión chiptune (core/gameSounds.js).
 *
 * Adaptado a una persona mayor en tablet: botones grandes (izquierda,
 * derecha, bajar, girar, bajar del todo), velocidad inicial tranquila,
 * "sombra" que indica dónde caerá la pieza, y un pequeño margen antes de
 * fijarse al tocar fondo para poder recolocarla con calma.
 *
 * Igual que los demás juegos: totalmente independiente de las
 * estadísticas cognitivas; guarda sus datos en core/gameStats.js.
 */

const GAME_ID = "tetris";
const COLS = 10;
const ROWS = 20;
const HIDDEN = 2; // filas ocultas por encima (donde nacen las piezas)

// Formas (rotación 0) y colores clásicos, algo suavizados.
const PIECES = {
  I: { color: "#38C6E8", cells: [[0, 1], [1, 1], [2, 1], [3, 1]], size: 4 },
  O: { color: "#F5CC2E", cells: [[1, 0], [2, 0], [1, 1], [2, 1]], size: 4 },
  T: { color: "#A35BD6", cells: [[1, 0], [0, 1], [1, 1], [2, 1]], size: 3 },
  S: { color: "#55BF63", cells: [[1, 0], [2, 0], [0, 1], [1, 1]], size: 3 },
  Z: { color: "#E5525C", cells: [[0, 0], [1, 0], [1, 1], [2, 1]], size: 3 },
  J: { color: "#3E6FD6", cells: [[0, 0], [0, 1], [1, 1], [2, 1]], size: 3 },
  L: { color: "#F28F43", cells: [[2, 0], [0, 1], [1, 1], [2, 1]], size: 3 },
};
const TYPES = Object.keys(PIECES);
const LINE_POINTS = [0, 40, 100, 300, 1200];
const LOCK_DELAY_MS = 550;
const MAX_LOCK_RESETS = 15;
const CLEAR_ANIM_MS = 380;

/** Intervalo de caída (ms por fila) según el nivel: empieza despacio. */
function gravityMs(level) {
  return Math.max(180, Math.round(1000 * Math.pow(0.86, level - 1)));
}

function rotateCells(cells, size, times) {
  let out = cells.map(([x, y]) => [x, y]);
  for (let t = 0; t < ((times % 4) + 4) % 4; t++) out = out.map(([x, y]) => [size - 1 - y, x]);
  return out;
}

export class Tetris {
  constructor(callbacks = {}) {
    this.cb = callbacks;
    this.reset();
  }

  reset() {
    this.grid = Array.from({ length: ROWS + HIDDEN }, () => Array(COLS).fill(null));
    this.bag = [];
    this.next = this._fromBag();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.over = false;
    this.paused = false;
    this.clearing = null; // { rows, start }
    this.dropTimer = 0;
    this.lockTimer = null;
    this.lockResets = 0;
    this._spawn();
  }

  _fromBag() {
    if (!this.bag.length) {
      this.bag = [...TYPES];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop();
  }

  _spawn() {
    const type = this.next;
    this.next = this._fromBag();
    const def = PIECES[type];
    this.piece = { type, rot: 0, x: Math.floor((COLS - def.size) / 2), y: HIDDEN - 1 + (type === "I" ? -1 : 0) };
    this.lockTimer = null;
    this.lockResets = 0;
    this.dropTimer = 0;
    if (this._collides(this.piece)) {
      this.over = true;
      this.cb.onGameOver?.();
    }
    this.cb.onNext?.(this.next);
  }

  cellsOf(p) {
    const def = PIECES[p.type];
    return rotateCells(def.cells, def.size, p.rot).map(([x, y]) => [x + p.x, y + p.y]);
  }

  _collides(p) {
    return this.cellsOf(p).some(([x, y]) => x < 0 || x >= COLS || y >= ROWS + HIDDEN || (y >= 0 && this.grid[y][x]));
  }

  _onGround() {
    return this._collides({ ...this.piece, y: this.piece.y + 1 });
  }

  _canAct() {
    return !this.over && !this.paused && !this.clearing;
  }

  _afterMove() {
    // Si está apoyada, recolocarla le da un poco más de margen (limitado).
    if (this.lockTimer !== null && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  move(dx) {
    if (!this._canAct()) return false;
    const p = { ...this.piece, x: this.piece.x + dx };
    if (this._collides(p)) return false;
    this.piece = p;
    this._afterMove();
    this.cb.onMove?.();
    return true;
  }

  rotate() {
    if (!this._canAct() || this.piece.type === "O") return false;
    const rot = (this.piece.rot + 1) % 4;
    // "Empujones" para que gire aunque esté pegada a una pared o al suelo.
    const kicks = this.piece.type === "I" ? [0, -1, 1, -2, 2] : [0, -1, 1];
    for (const dx of kicks) {
      for (const dy of [0, -1]) {
        const p = { ...this.piece, rot, x: this.piece.x + dx, y: this.piece.y + dy };
        if (!this._collides(p)) {
          this.piece = p;
          this._afterMove();
          this.cb.onRotate?.();
          return true;
        }
      }
    }
    return false;
  }

  softDrop() {
    if (!this._canAct()) return false;
    const p = { ...this.piece, y: this.piece.y + 1 };
    if (this._collides(p)) {
      this._lock();
      return false;
    }
    this.piece = p;
    this.score += 1;
    this.dropTimer = 0;
    return true;
  }

  hardDrop() {
    if (!this._canAct()) return;
    let n = 0;
    while (!this._collides({ ...this.piece, y: this.piece.y + 1 })) {
      this.piece.y++;
      n++;
    }
    this.score += n * 2;
    this.cb.onHardDrop?.();
    this._lock();
  }

  ghostY() {
    let y = this.piece.y;
    while (!this._collides({ ...this.piece, y: y + 1 })) y++;
    return y;
  }

  _lock() {
    const cells = this.cellsOf(this.piece);
    const color = PIECES[this.piece.type].color;
    let aboveTop = true;
    cells.forEach(([x, y]) => {
      if (y >= 0) this.grid[y][x] = color;
      if (y >= HIDDEN) aboveTop = false;
    });
    this.cb.onLock?.();
    // Si la pieza se ha quedado entera por encima del tablero visible, se acabó.
    if (aboveTop) {
      this.over = true;
      this.cb.onGameOver?.();
      return;
    }
    const full = [];
    for (let y = 0; y < ROWS + HIDDEN; y++) if (this.grid[y].every(Boolean)) full.push(y);
    if (full.length) {
      this.clearing = { rows: full, start: performance.now() };
      this.piece = null;
      this.cb.onLinesStart?.(full.length);
    } else {
      this._spawn();
    }
  }

  _finishClear() {
    const n = this.clearing.rows.length;
    this.grid = this.grid.filter((_, y) => !this.clearing.rows.includes(y));
    while (this.grid.length < ROWS + HIDDEN) this.grid.unshift(Array(COLS).fill(null));
    this.clearing = null;
    const prevLevel = this.level;
    this.lines += n;
    this.score += LINE_POINTS[n] * this.level;
    this.level = 1 + Math.floor(this.lines / 10);
    this.cb.onLines?.(n, this.level > prevLevel);
    this._spawn();
  }

  update(dtMs) {
    if (this.over || this.paused) return;
    if (this.clearing) {
      if (performance.now() - this.clearing.start >= CLEAR_ANIM_MS) this._finishClear();
      return;
    }
    if (this._onGround()) {
      if (this.lockTimer === null) this.lockTimer = 0;
      this.lockTimer += dtMs;
      if (this.lockTimer >= LOCK_DELAY_MS) this._lock();
      return;
    }
    this.lockTimer = null;
    this.dropTimer += dtMs;
    const g = gravityMs(this.level);
    while (this.dropTimer >= g && !this._onGround()) {
      this.dropTimer -= g;
      this.piece.y++;
    }
  }
}

/* ---------------- Dibujo ---------------- */

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt))));
  r = f(r); g = f(g); b = f(b);
  return `rgb(${r},${g},${b})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Bloque con volumen (bisel y brillo), mismo lenguaje 3D que los botones de la app. */
function drawBlock(ctx, x, y, s, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const pad = Math.max(1, s * 0.05);
  const r = s * 0.18;
  const g = ctx.createLinearGradient(x, y, x + s, y + s);
  g.addColorStop(0, shade(color, 0.28));
  g.addColorStop(1, shade(color, -0.18));
  ctx.fillStyle = g;
  roundRect(ctx, x + pad, y + pad, s - pad * 2, s - pad * 2, r);
  ctx.fill();
  // brillo superior
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  roundRect(ctx, x + s * 0.18, y + s * 0.14, s * 0.64, s * 0.2, s * 0.1);
  ctx.fill();
  // borde inferior más oscuro
  ctx.strokeStyle = shade(color, -0.35);
  ctx.lineWidth = Math.max(1, s * 0.05);
  roundRect(ctx, x + pad, y + pad, s - pad * 2, s - pad * 2, r);
  ctx.stroke();
  ctx.restore();
}

function drawGhost(ctx, x, y, s, color) {
  ctx.save();
  const pad = s * 0.1;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(2, s * 0.07);
  roundRect(ctx, x + pad, y + pad, s - pad * 2, s - pad * 2, s * 0.16);
  ctx.stroke();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/* ---------------- Pantalla ---------------- */

export function renderTetrisGame(container, { profile, onExit }) {
  container.innerHTML = "";
  const box = document.createElement("div");
  box.className = "col center tetris-wrap";
  box.innerHTML = `
    <div class="tetris-hud">
      <div class="rest-game-score-panel">
        <span class="rest-game-score-label">PUNTOS</span>
        <span class="rest-game-score-value" id="tt-points">0</span>
        <span class="rest-game-score-record" id="tt-record">Récord: —</span>
      </div>
      <div class="tetris-hud-btns">
        <button class="rest-game-side-btn" id="tt-pause-btn" aria-label="Pausa">
          <span class="rest-game-side-btn-icon" id="tt-pause-icon">⏸️</span><span id="tt-pause-label">Pausa</span>
        </button>
        <button class="rest-game-side-btn" id="tt-restart-btn" aria-label="Reiniciar">
          <span class="rest-game-side-btn-icon">🔄</span><span>Reiniciar</span>
        </button>
        <button class="rest-game-side-btn" id="tt-finish-btn" aria-label="Salir">
          <span class="rest-game-side-btn-icon">🚪</span><span>Salir</span>
        </button>
      </div>
      <div class="game-volume-control">
        <span aria-hidden="true">🔊</span>
        <input type="range" min="0" max="1" step="0.1" value="1" class="game-volume-slider" id="tt-volume" aria-label="Volumen del juego" />
      </div>
    </div>

    <div class="tetris-main">
      <div class="tetris-pad tetris-pad-left">
        <div class="tetris-pad-row">
          <button class="tetris-btn" id="tt-left" aria-label="Mover a la izquierda"><svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true" style="transform:rotate(0deg)"><path d="M28 7 L28 33 L9 20 Z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg></button>
          <button class="tetris-btn" id="tt-right" aria-label="Mover a la derecha"><svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true" style="transform:rotate(180deg)"><path d="M28 7 L28 33 L9 20 Z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg></button>
        </div>
        <button class="tetris-btn tetris-btn-wide" id="tt-down" aria-label="Bajar"><svg viewBox="0 0 40 40" width="44" height="44" aria-hidden="true" style="transform:rotate(-90deg)"><path d="M28 7 L28 33 L9 20 Z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg></button>
      </div>

      <div class="tetris-board-wrap" id="tt-board-wrap">
        <canvas class="tetris-board" id="tt-board"></canvas>
        <div class="tetris-pause-veil hidden" id="tt-veil">PAUSA</div>
      </div>

      <div class="tetris-side">
        <div class="tetris-info-card">
          <span class="tetris-info-label">Siguiente</span>
          <canvas class="tetris-next" id="tt-next" width="120" height="80"></canvas>
        </div>
        <div class="tetris-info-row">
          <div class="tetris-info-card tetris-info-small">
            <span class="tetris-info-label">Líneas</span>
            <span class="tetris-info-value" id="tt-lines">0</span>
          </div>
          <div class="tetris-info-card tetris-info-small">
            <span class="tetris-info-label">Nivel</span>
            <span class="tetris-info-value" id="tt-level">1</span>
          </div>
        </div>
        <div class="mascot bounce tetris-mascot" id="tt-mascot"><img src="assets/mascot/cerebrin.png" alt="Cerebrín" class="mascot-img" /></div>
      </div>

      <div class="tetris-pad tetris-pad-right">
        <button class="tetris-btn tetris-btn-rotate" id="tt-rotate" aria-label="Girar">⟳<span class="tetris-btn-cap">GIRAR</span></button>
        <button class="tetris-btn tetris-btn-drop" id="tt-drop" aria-label="Bajar del todo">⤓<span class="tetris-btn-cap">ABAJO</span></button>
      </div>
    </div>
  `;
  container.appendChild(box);

  const $ = (sel) => box.querySelector(sel);
  const canvas = $("#tt-board");
  const ctx = canvas.getContext("2d");
  const nextCanvas = $("#tt-next");
  const nctx = nextCanvas.getContext("2d");
  const wrap = $("#tt-board-wrap");
  const pointsEl = $("#tt-points");
  const recordEl = $("#tt-record");
  const linesEl = $("#tt-lines");
  const levelEl = $("#tt-level");
  const veil = $("#tt-veil");
  const mascot = new Mascot($("#tt-mascot"), null);
  mascot.idle();

  const volumeSlider = $("#tt-volume");
  volumeSlider.value = String(GameSounds.getVolume());
  volumeSlider.addEventListener("input", (e) => GameSounds.setVolume(Number(e.target.value)));

  let bestBefore = 0;
  if (profile?.id) {
    getGameStats(profile.id, GAME_ID)
      .then((s) => {
        bestBefore = s.bestScore;
        recordEl.textContent = `Récord: ${s.bestScore}`;
      })
      .catch(() => {});
  } else {
    recordEl.textContent = "Récord: 0";
  }

  const startedAt = Date.now();
  let stopped = false;
  let rafId = null;
  let summaryShown = false;
  let tetrisSaid = 0;

  const game = new Tetris({
    onMove: () => GameSounds.playTetrisMove(),
    onRotate: () => GameSounds.playTetrisRotate(),
    onHardDrop: () => {},
    onLock: () => GameSounds.playTetrisLock(),
    onLinesStart: (n) => {
      GameSounds.playTetrisLines(n);
      mascot.celebrate();
      if (n === 4) {
        burstConfetti(30);
        if (tetrisSaid < 3) {
          tetrisSaid++;
          Voice.say("¡Tetris! ¡Cuatro líneas de golpe!");
        }
      } else if (n >= 2) {
        burstConfetti(10);
      }
    },
    onLines: (n, levelUp) => {
      if (levelUp) {
        GameSounds.playTetrisLevelUp();
        Voice.say(`¡Muy bien! Nivel ${game.level}.`);
      }
      setTimeout(() => !stopped && mascot.idle(), 1200);
    },
    onNext: (type) => drawNext(type),
    onGameOver: () => {
      setTimeout(() => showSummary(), 700);
    },
  });

  /* ---- tamaño del tablero (se adapta al hueco disponible) ---- */
  let cell = 28;
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const h = wrap.clientHeight;
    const w = wrap.clientWidth;
    cell = Math.max(14, Math.floor(Math.min(h / ROWS, w / COLS)));
    const cw = cell * COLS;
    const ch = cell * ROWS;
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ndpr = dpr;
    nextCanvas.width = Math.round(120 * ndpr);
    nextCanvas.height = Math.round(80 * ndpr);
    nctx.setTransform(ndpr, 0, 0, ndpr, 0, 0);
    drawNext(game.next);
    draw();
  }
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => resize()) : null;
  ro?.observe(wrap);

  function drawNext(type) {
    nctx.clearRect(0, 0, 120, 80);
    if (!type) return;
    const def = PIECES[type];
    const s = 22;
    const xs = def.cells.map((c) => c[0]);
    const ys = def.cells.map((c) => c[1]);
    const w = (Math.max(...xs) - Math.min(...xs) + 1) * s;
    const h = (Math.max(...ys) - Math.min(...ys) + 1) * s;
    const ox = (120 - w) / 2 - Math.min(...xs) * s;
    const oy = (80 - h) / 2 - Math.min(...ys) * s;
    def.cells.forEach(([x, y]) => drawBlock(nctx, ox + x * s, oy + y * s, s, def.color));
  }

  function draw() {
    const W = cell * COLS;
    const H = cell * ROWS;
    // Fondo del tablero: azul noche con rejilla muy suave.
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1D2538");
    bg.addColorStop(1, "#141A28");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cell + 0.5, 0);
      ctx.lineTo(x * cell + 0.5, H);
      ctx.stroke();
    }
    for (let y = 1; y < ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cell + 0.5);
      ctx.lineTo(W, y * cell + 0.5);
      ctx.stroke();
    }

    // Piezas ya colocadas (con destello en las líneas que se están borrando).
    const flashing = game.clearing ? game.clearing.rows : [];
    const t = game.clearing ? (performance.now() - game.clearing.start) / CLEAR_ANIM_MS : 0;
    for (let y = HIDDEN; y < ROWS + HIDDEN; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = game.grid[y][x];
        if (!c) continue;
        if (flashing.includes(y)) {
          drawBlock(ctx, x * cell, (y - HIDDEN) * cell, cell, c, Math.max(0, 1 - t));
        } else {
          drawBlock(ctx, x * cell, (y - HIDDEN) * cell, cell, c);
        }
      }
      if (flashing.includes(y)) {
        ctx.save();
        ctx.globalAlpha = 0.85 * (1 - Math.abs(t * 2 - 1));
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, (y - HIDDEN) * cell, W, cell);
        ctx.restore();
      }
    }

    if (game.piece && !game.over) {
      const color = PIECES[game.piece.type].color;
      // Sombra: dónde caerá la pieza.
      const gy = game.ghostY();
      game.cellsOf({ ...game.piece, y: gy }).forEach(([x, y]) => {
        if (y >= HIDDEN) drawGhost(ctx, x * cell, (y - HIDDEN) * cell, cell, color);
      });
      game.cellsOf(game.piece).forEach(([x, y]) => {
        if (y >= HIDDEN) drawBlock(ctx, x * cell, (y - HIDDEN) * cell, cell, color);
      });
    }
  }

  function updateHud() {
    pointsEl.textContent = String(game.score);
    linesEl.textContent = String(game.lines);
    levelEl.textContent = String(game.level);
  }

  let last = performance.now();
  function loop(now) {
    if (stopped) return;
    const dt = Math.min(100, now - last);
    last = now;
    game.update(dt);
    draw();
    updateHud();
    rafId = requestAnimationFrame(loop);
  }

  /* ---- controles: botones grandes con repetición al mantener pulsado ---- */
  function holdRepeat(btn, action, { delay = 230, every = 85 } = {}) {
    let t1 = null;
    let t2 = null;
    const stop = () => {
      clearTimeout(t1);
      clearInterval(t2);
      t1 = t2 = null;
      btn.classList.remove("pressed");
    };
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      btn.setPointerCapture?.(e.pointerId);
      btn.classList.add("pressed");
      action();
      t1 = setTimeout(() => {
        t2 = setInterval(action, every);
      }, delay);
    });
    ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"].forEach((ev) => btn.addEventListener(ev, stop));
  }
  function tapOnce(btn, action) {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      btn.classList.add("pressed");
      action();
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => btn.addEventListener(ev, () => btn.classList.remove("pressed")));
  }
  holdRepeat($("#tt-left"), () => game.move(-1));
  holdRepeat($("#tt-right"), () => game.move(1));
  holdRepeat($("#tt-down"), () => game.softDrop(), { delay: 120, every: 55 });
  tapOnce($("#tt-rotate"), () => game.rotate());
  tapOnce($("#tt-drop"), () => game.hardDrop());

  // Teclado (por si se juega en un ordenador).
  const onKey = (e) => {
    if (summaryShown) return;
    const k = e.key;
    if (k === "ArrowLeft") game.move(-1);
    else if (k === "ArrowRight") game.move(1);
    else if (k === "ArrowDown") game.softDrop();
    else if (k === "ArrowUp" || k === "x" || k === "X") game.rotate();
    else if (k === " ") game.hardDrop();
    else if (k === "p" || k === "P") togglePause();
    else return;
    e.preventDefault();
  };
  document.addEventListener("keydown", onKey);

  function togglePause(force) {
    if (game.over) return;
    game.paused = force !== undefined ? force : !game.paused;
    veil.classList.toggle("hidden", !game.paused);
    $("#tt-pause-icon").textContent = game.paused ? "▶️" : "⏸️";
    $("#tt-pause-label").textContent = game.paused ? "Seguir" : "Pausa";
    if (game.paused) GameSounds.stopMusic();
    else GameSounds.startMusic(0.5, "tetris");
  }
  $("#tt-pause-btn").onclick = () => togglePause();

  $("#tt-restart-btn").onclick = () => {
    cleanup();
    renderTetrisGame(container, { profile, onExit });
  };
  $("#tt-finish-btn").onclick = () => {
    const wasPaused = game.paused;
    togglePause(true);
    confirmExit(
      () => {
        cleanup();
        saveSession(false);
        onExit?.();
      },
      () => togglePause(wasPaused)
    );
  };

  function cleanup() {
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    ro?.disconnect();
    document.removeEventListener("keydown", onKey);
    GameSounds.stopMusic();
  }

  async function saveSession(completed) {
    if (!profile?.id) return;
    try {
      await recordGameSession(profile.id, GAME_ID, {
        points: game.score,
        durationMs: Date.now() - startedAt,
        completed,
      });
    } catch (err) {
      console.warn("No se pudo guardar la estadística del juego:", err);
    }
  }

  function confirmExit(onConfirm, onCancel) {
    const modal = document.getElementById("generic-modal");
    const modalBox = document.getElementById("generic-modal-box");
    if (!modal || !modalBox) {
      onConfirm();
      return;
    }
    modalBox.innerHTML = `
      <h2 class="title-lg">¿Quieres salir del juego?</h2>
      <p class="text-base" style="margin:16px 0 28px;">Llevas ${game.score} puntos. Puedes seguir jugando un poco más, o salir ya.</p>
      <div class="row center wrap" style="gap:16px;">
        <button class="btn btn-ghost" id="tt-continue-btn">Continuar</button>
        <button class="btn btn-warm" id="tt-confirm-exit-btn">Salir</button>
      </div>
    `;
    modal.classList.add("active");
    modalBox.querySelector("#tt-continue-btn").onclick = () => {
      modal.classList.remove("active");
      onCancel?.();
    };
    modalBox.querySelector("#tt-confirm-exit-btn").onclick = () => {
      modal.classList.remove("active");
      onConfirm();
    };
  }

  function showSummary() {
    if (summaryShown || stopped) return;
    summaryShown = true;
    cleanup();
    GameSounds.playTetrisGameOver();
    saveSession(true);
    const pts = game.score;
    const isRecord = pts > bestBefore && pts > 0;
    box.innerHTML = `
      <div class="rest-game-end-panel">
        <img src="assets/mascot/cerebrin.png" alt="Cerebrín" class="closing-mascot" style="width:min(26vw,150px);" />
        <h2 class="rest-game-end-title">¡BUENA PARTIDA!</h2>
        ${isRecord ? `<p class="rest-game-new-record">🏆 ¡NUEVO RÉCORD! 🏆</p>` : ""}
        <div class="rest-game-end-score">
          <span class="rest-game-end-score-label">PUNTOS</span>
          <span class="rest-game-end-score-value">${pts}</span>
        </div>
        <p class="rest-game-end-best">Líneas: ${game.lines} · Nivel: ${game.level} · Récord: ${Math.max(pts, bestBefore)}</p>
        <p class="text-md" style="text-align:center; margin-top:6px;">¿Qué quieres hacer?</p>
        <div class="row center wrap" style="gap:16px; margin-top:10px;">
          <button class="btn btn-accent" id="tt-repeat-btn">🔄 Repetir</button>
          <button class="btn btn-success btn-huge" id="tt-exit-btn">Salir</button>
        </div>
      </div>
    `;
    burstConfetti(isRecord ? 40 : 20);
    Voice.say(
      isRecord
        ? `¡Buena partida! Y nuevo récord: ${pts} puntos.`
        : `¡Buena partida! Has hecho ${game.lines} ${game.lines === 1 ? "línea" : "líneas"} y ${pts} puntos.`
    );
    box.querySelector("#tt-repeat-btn").onclick = () => renderTetrisGame(container, { profile, onExit });
    box.querySelector("#tt-exit-btn").onclick = () => onExit?.();
  }

  // Arranque
  resize();
  requestAnimationFrame(resize); // segunda medida, ya con el diseño asentado
  GameSounds.startMusic(0.5, "tetris");
  Voice.say("Coloca las piezas para completar líneas. Muévelas con las flechas y gíralas con el botón de girar.");
  rafId = requestAnimationFrame(loop);

  return {
    destroy() {
      cleanup();
    },
  };
}
