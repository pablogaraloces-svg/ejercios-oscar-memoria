import { GameSounds } from "../core/gameSounds.js";
import { Voice } from "../core/voice.js";
import { recordGameSession } from "../core/gameStats.js";
import { burstConfetti } from "../core/confetti.js";
import { Mascot } from "../core/mascot.js";

/**
 * wordSearchGame.js — Sopa de letras, nivel fácil tirando a medio:
 * palabras solo en horizontal, vertical y diagonal hacia abajo (nunca
 * al revés, para que sea fácil de seguir con la vista), en una rejilla
 * de tamaño moderado. Selección con dos toques (primera letra, última
 * letra) en vez de arrastrar el dedo — más cómodo y fiable en una
 * tablet para una persona mayor que un gesto de arrastre continuo.
 *
 * Totalmente independiente del sistema de ejercicios/estadísticas
 * cognitivas — igual que los otros juegos, guarda sus propios datos en
 * core/gameStats.js.
 */

const GRID_SIZE = 10;
const WORD_POOL = [
  "GATO", "PERRO", "FLOR", "CASA", "LUNA", "SOL", "LIBRO", "MESA",
  "VACA", "PATO", "LLAVE", "COCHE", "QUESO", "PAN", "SILLA", "RELOJ",
];
const WORDS_PER_GAME = 8;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVXYZ";
// Derecha, abajo y diagonal abajo-derecha: nunca al revés ni hacia
// arriba, para que sea fácil de seguir con la vista (nivel fácil/medio).
const DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 1, dc: 1 },
];

function pickWords() {
  const shuffled = [...WORD_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, WORDS_PER_GAME);
}

/** Genera la rejilla y coloca las palabras; si alguna no cupiera tras
 * varios intentos, simplemente se descarta (con la reserva de la
 * lista de palabras, siempre hay suficientes para completar el hueco). */
function buildPuzzle() {
  const candidates = pickWords();
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  const placed = [];

  candidates.forEach((word) => {
    let done = false;
    for (let attempt = 0; attempt < 200 && !done; attempt++) {
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const maxRow = GRID_SIZE - (dir.dr ? word.length - 1 : 0);
      const maxCol = GRID_SIZE - (dir.dc ? word.length - 1 : 0);
      if (maxRow <= 0 || maxCol <= 0) continue;
      const row = Math.floor(Math.random() * maxRow);
      const col = Math.floor(Math.random() * maxCol);

      const cells = [];
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const r = row + dir.dr * i;
        const c = col + dir.dc * i;
        const existing = grid[r][c];
        if (existing && existing !== word[i]) {
          fits = false;
          break;
        }
        cells.push([r, c]);
      }
      if (!fits) continue;

      cells.forEach(([r, c], i) => (grid[r][c] = word[i]));
      placed.push({ word, cells, found: false });
      done = true;
    }
  });

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) grid[r][c] = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    }
  }

  return { grid, placed };
}

export function renderWordSearchGame(container, { profile, onExit }) {
  container.innerHTML = "";
  const { grid, placed } = buildPuzzle();

  const box = document.createElement("div");
  box.className = "col center wordsearch-wrap";
  box.innerHTML = `
    <h2 class="title-xl" style="text-align:center;">🔎 Sopa de letras</h2>
    <p class="text-md" id="ws-instructions" style="text-align:center;">Toca la primera letra de una palabra y después la última, en línea recta.</p>
    <div class="simon-hud">
      <span class="rest-game-points" id="ws-found-count">Encontradas: 0 / ${placed.length}</span>
      <div class="game-volume-control">
        <span aria-hidden="true">🔊</span>
        <input type="range" min="0" max="1" step="0.1" value="1" class="game-volume-slider" id="ws-volume" aria-label="Volumen del juego" />
      </div>
    </div>
    <div class="wordsearch-main-row">
      <div class="rest-game-side-btns">
        <button class="rest-game-side-btn" id="ws-restart-btn" aria-label="Reiniciar">
          <span class="rest-game-side-btn-icon">🔄</span><span>Reiniciar</span>
        </button>
        <button class="rest-game-side-btn" id="ws-finish-btn" aria-label="Salir">
          <span class="rest-game-side-btn-icon">🚪</span><span>Salir</span>
        </button>
      </div>
      <div class="wordsearch-grid" id="ws-grid" style="grid-template-columns: repeat(${GRID_SIZE}, 1fr);"></div>
      <div class="wordsearch-side">
        <div class="simon-mascot-col" style="margin-bottom:10px;">
          <div class="mascot bounce" id="ws-mascot"><img src="assets/mascot/cerebrin.png" alt="Cerebrín" class="mascot-img" /></div>
        </div>
        <ul class="wordsearch-list" id="ws-word-list"></ul>
      </div>
    </div>
  `;
  container.appendChild(box);

  const gridEl = box.querySelector("#ws-grid");
  const listEl = box.querySelector("#ws-word-list");
  const foundLabel = box.querySelector("#ws-found-count");
  const instructions = box.querySelector("#ws-instructions");
  const volumeSlider = box.querySelector("#ws-volume");
  const mascot = new Mascot(box.querySelector("#ws-mascot"), null);
  mascot.idle();
  volumeSlider.value = String(GameSounds.getVolume());
  volumeSlider.addEventListener("input", (e) => GameSounds.setVolume(Number(e.target.value)));

  const startedAt = Date.now();
  let foundCount = 0;
  let selStart = null; // {r, c, btn}
  const cellButtons = [];

  // Rejilla de letras
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const btn = document.createElement("button");
      btn.className = "wordsearch-cell";
      btn.textContent = grid[r][c];
      btn.dataset.r = r;
      btn.dataset.c = c;
      btn.onclick = () => onCellTap(r, c, btn);
      gridEl.appendChild(btn);
      cellButtons.push(btn);
    }
  }

  // Lista de palabras, en el lateral
  placed.forEach((entry, i) => {
    const li = document.createElement("li");
    li.className = "wordsearch-list-item";
    li.id = `ws-word-${i}`;
    li.textContent = entry.word;
    listEl.appendChild(li);
  });

  function cellAt(r, c) {
    return cellButtons[r * GRID_SIZE + c];
  }

  function clearSelectionHighlight() {
    cellButtons.forEach((b) => b.classList.remove("wordsearch-cell-selected"));
  }

  function onCellTap(r, c, btn) {
    // Una celda ya "encontrada" no puede usarse para EMPEZAR una nueva
    // selección, pero sí puede ser el segundo toque que completa una
    // palabra distinta — dos palabras pueden compartir una misma letra
    // en la rejilla, y bloquear siempre esa celda impediría terminar de
    // encontrar la palabra que falta.
    if (!selStart && btn.classList.contains("wordsearch-cell-found")) return;

    if (!selStart) {
      selStart = { r, c, btn };
      btn.classList.add("wordsearch-cell-selected");
      return;
    }

    if (selStart.r === r && selStart.c === c) {
      // Tocar la misma letra dos veces: se cancela la selección.
      clearSelectionHighlight();
      selStart = null;
      return;
    }

    const path = straightPath(selStart.r, selStart.c, r, c);
    if (!path) {
      // No están en línea recta: se reinicia la selección desde aquí.
      clearSelectionHighlight();
      selStart = { r, c, btn };
      btn.classList.add("wordsearch-cell-selected");
      return;
    }

    path.forEach(([pr, pc]) => cellAt(pr, pc).classList.add("wordsearch-cell-selected"));
    const letters = path.map(([pr, pc]) => grid[pr][pc]).join("");
    const reversed = letters.split("").reverse().join("");
    const match = placed.find((e) => !e.found && (e.word === letters || e.word === reversed));

    if (match) {
      match.found = true;
      foundCount++;
      path.forEach(([pr, pc]) => {
        const cellBtn = cellAt(pr, pc);
        cellBtn.classList.remove("wordsearch-cell-selected");
        cellBtn.classList.add("wordsearch-cell-found");
      });
      const li = document.getElementById(`ws-word-${placed.indexOf(match)}`);
      li.classList.add("wordsearch-list-item-found");
      foundLabel.textContent = `Encontradas: ${foundCount} / ${placed.length}`;
      GameSounds.playClear();
      mascot.celebrate();
      burstConfetti(10);

      if (foundCount === placed.length) {
        finishGame();
      }
    } else {
      // No coincide con ninguna palabra: pequeño aviso y se limpia.
      GameSounds.playSimonWrong();
      setTimeout(clearSelectionHighlight, 260);
    }
    selStart = null;
  }

  /** Devuelve el camino de celdas entre dos puntos si están en línea
   * recta (horizontal, vertical o diagonal); si no, null. */
  function straightPath(r1, c1, r2, c2) {
    const dr = r2 - r1;
    const dc = c2 - c1;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    if (steps === 0) return null;
    const stepR = Math.sign(dr);
    const stepC = Math.sign(dc);
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null; // no es una línea recta válida
    const path = [];
    for (let i = 0; i <= steps; i++) path.push([r1 + stepR * i, c1 + stepC * i]);
    return path;
  }

  function finishGame() {
    Voice.say("¡Muy bien! Has encontrado todas las palabras.");
    saveSession(true);
    setTimeout(() => showSummary(), 900);
  }

  box.querySelector("#ws-restart-btn").onclick = () => startFresh();
  box.querySelector("#ws-finish-btn").onclick = () => {
    confirmExit(() => {
      saveSession(false);
      onExit?.();
    });
  };

  function startFresh() {
    renderWordSearchGame(container, { profile, onExit });
  }

  async function saveSession(completed) {
    if (!profile?.id) return;
    try {
      await recordGameSession(profile.id, "sopa_de_letras", {
        points: foundCount * 10,
        durationMs: Date.now() - startedAt,
        completed,
      });
    } catch (err) {
      console.warn("No se pudo guardar la estadística del juego:", err);
    }
  }

  function confirmExit(onConfirm) {
    const modal = document.getElementById("generic-modal");
    const modalBox = document.getElementById("generic-modal-box");
    if (!modal || !modalBox) {
      onConfirm();
      return;
    }
    modalBox.innerHTML = `
      <h2 class="title-lg">¿Quieres salir del juego?</h2>
      <p class="text-base" style="margin:16px 0 28px;">Has encontrado ${foundCount} de ${placed.length} palabras. Puedes seguir buscando, o salir ya.</p>
      <div class="row center wrap" style="gap:16px;">
        <button class="btn btn-ghost" id="ws-continue-btn">Continuar</button>
        <button class="btn btn-warm" id="ws-confirm-exit-btn">Salir</button>
      </div>
    `;
    modal.classList.add("active");
    modalBox.querySelector("#ws-continue-btn").onclick = () => modal.classList.remove("active");
    modalBox.querySelector("#ws-confirm-exit-btn").onclick = () => {
      modal.classList.remove("active");
      onConfirm();
    };
  }

  function showSummary() {
    GameSounds.playVictory();
    box.innerHTML = `
      <img src="assets/mascot/cerebrin.png" alt="Cerebrín" class="closing-mascot" style="width:min(30vw,180px);" />
      <h2 class="title-xl" style="text-align:center;">¡LO HAS CONSEGUIDO!</h2>
      <p class="text-lg" style="text-align:center; font-weight:800; color:var(--color-success);">Palabras encontradas: ${placed.length}</p>
      <p class="text-md" style="text-align:center;">¿Quieres volver a jugar?</p>
      <div class="row center wrap" style="gap:16px; margin-top:10px;">
        <button class="btn btn-accent" id="ws-repeat-btn">🔄 Repetir</button>
        <button class="btn btn-success btn-huge" id="ws-exit-btn">Salir</button>
      </div>
    `;
    burstConfetti(24);
    box.querySelector("#ws-repeat-btn").onclick = () => startFresh();
    box.querySelector("#ws-exit-btn").onclick = () => onExit?.();
  }

  return {
    destroy() {
      // Sin bucle de animación ni temporizadores largos que cancelar
      // (solo un pequeño setTimeout de 260-900ms como mucho); al
      // reconstruirse el contenedor, cualquier referencia queda
      // huérfana y sin efecto visible.
    },
  };
}
