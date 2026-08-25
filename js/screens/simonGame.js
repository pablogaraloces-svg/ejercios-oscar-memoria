import { GameSounds } from "../core/gameSounds.js";
import { Voice } from "../core/voice.js";
import { recordGameSession } from "../core/gameStats.js";
import { burstConfetti } from "../core/confetti.js";
import { Mascot } from "../core/mascot.js";

/**
 * simonGame.js — Juego de memoria inspirado en "Simón": un tablero
 * circular con 5 colores (azul, verde, rojo, amarillo, negro), cada uno
 * con su propia nota musical. Cerebrín muestra una secuencia cada vez
 * más larga y Óscar debe repetirla tocando los colores en el mismo
 * orden.
 *
 * Diseño accesible a propósito: un fallo NUNCA termina la partida de
 * golpe — se repite la misma secuencia con ánimo, sin perder lo ya
 * conseguido. Solo se cierra la partida cuando Óscar decide "Salir", o
 * al alcanzar una secuencia ya muy larga (celebración de "maestría").
 *
 * Totalmente independiente del sistema de ejercicios/estadísticas
 * cognitivas — igual que Cerebrín Saltarín, guarda sus propios datos
 * (si los guarda) en core/gameStats.js, nunca en "progress".
 */

const COLORS = [
  { key: "blue", label: "Azul", base: "#2C5FA8", light: "#5B8FD9", lit: "#9CC6FF", note: 261.63 },
  { key: "green", label: "Verde", base: "#3E8E5B", light: "#6BC98A", lit: "#A9FFC4", note: 329.63 },
  { key: "red", label: "Rojo", base: "#B23A48", light: "#E06070", lit: "#FFAEB8", note: 392.0 },
  { key: "yellow", label: "Amarillo", base: "#C79A2E", light: "#F0C34D", lit: "#FFE8A3", note: 440.0 },
  { key: "black", label: "Negro", base: "#2A2A2E", light: "#55555C", lit: "#A5A5B0", note: 523.25 },
];
const MAX_SEQUENCE = 20; // llegar aquí se celebra como "maestría" del juego
const MAX_RETRIES_PER_ROUND = 3; // nunca se "pierde" del todo, pero sí se anima a intentarlo de nuevo

class SimonGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.callbacks = callbacks;
    this.sequence = [];
    this.playerIndex = 0;
    this.round = 0;
    this.retries = 0;
    this.state = "idle"; // idle | showing | listening | ended
    this.litIndex = -1;
    this.litUntil = 0;
    this.stopped = false;
    this._resize();
  }

  /** Cancela cualquier temporizador o animación pendiente (se llama al
   * salir del juego), para no dejar nada corriendo de fondo si se
   * abandona a media secuencia. */
  stop() {
    this.stopped = true;
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.max(260, Math.min(rect.width, 420));
    this.canvas.style.width = size + "px";
    this.canvas.style.height = size + "px";
    this.canvas.width = Math.round(size * dpr);
    this.canvas.height = Math.round(size * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.size = size;
    this.cx = size / 2;
    this.cy = size / 2;
    this.rOuter = size / 2 - 8;
    this.rInner = size * 0.22;
  }

  start() {
    this.sequence = [];
    this.round = 0;
    this.addRandomStep();
    this.callbacks.onRoundChange?.(this.round);
    this._draw();
    this.playSequence(true);
  }

  addRandomStep() {
    this.sequence.push(Math.floor(Math.random() * COLORS.length));
    this.round = this.sequence.length;
  }

  async playSequence(isFirst = false) {
    if (this.stopped) return;
    this.state = "showing";
    this.playerIndex = 0;
    this.callbacks.onStateChange?.("showing");
    if (isFirst) {
      // Espera a que Cerebrín termine de hablar del todo antes de
      // empezar a mostrar la secuencia — antes se esperaba un tiempo
      // fijo (demasiado corto) y el juego arrancaba mientras la voz
      // seguía sonando.
      await this.callbacks.onInstruction?.();
      if (this.stopped) return;
      await this._sleep(350); // pequeña pausa natural tras la voz, antes de empezar
    } else {
      await this._sleep(500);
    }
    if (this.stopped) return;
    for (let i = 0; i < this.sequence.length; i++) {
      if (this.stopped) return;
      const idx = this.sequence[i];
      this.lightUp(idx, 620);
      GameSounds.playNote(COLORS[idx].note);
      this.callbacks.onProgress?.();
      await this._sleep(700);
    }
    if (this.stopped) return;
    this.state = "listening";
    this.callbacks.onStateChange?.("listening");
  }

  lightUp(index, ms) {
    this.litIndex = index;
    this.litUntil = performance.now() + ms;
    this._draw();
    const check = () => {
      if (this.stopped) return;
      if (performance.now() >= this.litUntil) {
        this.litIndex = -1;
        this._draw();
      } else {
        requestAnimationFrame(check);
      }
    };
    requestAnimationFrame(check);
  }

  /** Toque del jugador sobre un color concreto (índice 0-4). */
  tap(index) {
    if (this.state !== "listening") return;
    this.lightUp(index, 260);
    GameSounds.playNote(COLORS[index].note, 0.3);

    if (index === this.sequence[this.playerIndex]) {
      this.playerIndex++;
      if (this.playerIndex >= this.sequence.length) {
        // ¡Ronda completa! Se guarda el progreso y crece la secuencia.
        this.retries = 0;
        this.state = "idle";
        GameSounds.playSimonRoundComplete();
        this.callbacks.onRoundComplete?.(this.round);
        if (this.round >= MAX_SEQUENCE) {
          this.state = "ended";
          this.callbacks.onMastery?.();
          return;
        }
        setTimeout(() => {
          if (this.stopped) return;
          this.addRandomStep();
          this.callbacks.onRoundChange?.(this.round);
          this.playSequence(false);
        }, 1400);
      }
    } else {
      // Un fallo nunca termina la partida: se anima a intentarlo de
      // nuevo, repitiendo la misma secuencia desde el principio.
      this.state = "idle";
      GameSounds.playSimonWrong();
      this.retries++;
      this.callbacks.onWrong?.(this.retries >= MAX_RETRIES_PER_ROUND);
      setTimeout(() => {
        if (this.stopped) return;
        this.playSequence(false);
      }, 1600);
    }
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Detecta qué gajo del tablero corresponde a una posición de toque. */
  hitTest(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left - this.cx;
    const y = clientY - rect.top - this.cy;
    const dist = Math.hypot(x, y);
    if (dist < this.rInner || dist > this.rOuter) return -1;
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    const step = (Math.PI * 2) / COLORS.length;
    return Math.floor(angle / step) % COLORS.length;
  }

  _draw() {
    const { ctx, cx, cy, rOuter, rInner } = this;
    ctx.clearRect(0, 0, this.size, this.size);
    const step = (Math.PI * 2) / COLORS.length;
    const gap = 0.035; // pequeño hueco entre gajos, como en el Simón clásico

    COLORS.forEach((color, i) => {
      const start = -Math.PI / 2 + i * step + gap;
      const end = -Math.PI / 2 + (i + 1) * step - gap;
      const isLit = this.litIndex === i;
      this._drawWedge(ctx, cx, cy, rInner, rOuter, start, end, color, isLit);
    });

    // Cubo central ("hub"), con el mismo lenguaje de volumen 3D que el
    // resto de la app — muestra la ronda actual.
    const hubGrad = ctx.createRadialGradient(cx - rInner * 0.3, cy - rInner * 0.35, 4, cx, cy, rInner);
    hubGrad.addColorStop(0, "#FFF6E5");
    hubGrad.addColorStop(1, "#E8DCC4");
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rInner - 4, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.stroke();
    ctx.fillStyle = "#2E2E2E";
    ctx.font = `bold ${Math.round(rInner * 0.42)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.round > 0 ? String(this.round) : "🧠", cx, cy + 2);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  /** Dibuja un "gajo" del tablero con relieve 3D (degradado + brillo +
   * sombra), y un resplandor extra cuando está iluminado — mismo
   * lenguaje visual que el botón SALTAR del otro juego. */
  _drawWedge(ctx, cx, cy, rInner, rOuter, startAngle, endAngle, color, isLit) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx + rInner * Math.cos(startAngle), cy + rInner * Math.sin(startAngle));
    ctx.lineTo(cx + rOuter * Math.cos(startAngle), cy + rOuter * Math.sin(startAngle));
    ctx.arc(cx, cy, rOuter, startAngle, endAngle);
    ctx.lineTo(cx + rInner * Math.cos(endAngle), cy + rInner * Math.sin(endAngle));
    ctx.arc(cx, cy, rInner, endAngle, startAngle, true);
    ctx.closePath();

    if (isLit) {
      ctx.shadowColor = color.lit;
      ctx.shadowBlur = 30;
    } else {
      ctx.shadowColor = "rgba(0,0,0,0.28)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
    }

    const midAngle = (startAngle + endAngle) / 2;
    const highlightX = cx + Math.cos(midAngle) * rInner * 1.4;
    const highlightY = cy + Math.sin(midAngle) * rInner * 1.4;
    const grad = ctx.createRadialGradient(highlightX, highlightY, 4, cx, cy, rOuter);
    grad.addColorStop(0, isLit ? color.lit : color.light);
    grad.addColorStop(1, isLit ? color.light : color.base);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.22)";
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * renderSimonGame — construye la experiencia completa (título, tablero,
 * HUD, Reiniciar/Salir) dentro de cualquier contenedor. Misma firma que
 * gamePlayer.js, para encajar igual en la Sala de Juegos.
 */
export function renderSimonGame(container, { profile, onExit }) {
  container.innerHTML = "";
  const box = document.createElement("div");
  box.className = "col center simon-game-wrap";
  box.innerHTML = `
    <h2 class="title-xl" style="text-align:center;">🎨 El juego de los colores</h2>
    <p class="text-md" id="simon-instructions" style="text-align:center;">Mira bien los colores que se iluminan, y luego tócalos en el mismo orden.</p>
    <div class="simon-hud">
      <span class="rest-game-points" id="simon-round">Ronda: 0</span>
      <div class="game-volume-control">
        <span aria-hidden="true">🔊</span>
        <input type="range" min="0" max="1" step="0.1" value="1" class="game-volume-slider" id="simon-volume" aria-label="Volumen del juego" />
      </div>
    </div>
    <div class="simon-main-row">
      <div class="rest-game-side-btns">
        <button class="rest-game-side-btn" id="simon-restart-btn" aria-label="Reiniciar">
          <span class="rest-game-side-btn-icon">🔄</span><span>Reiniciar</span>
        </button>
        <button class="rest-game-side-btn" id="simon-finish-btn" aria-label="Salir">
          <span class="rest-game-side-btn-icon">🚪</span><span>Salir</span>
        </button>
      </div>
      <div class="simon-board-wrap">
        <canvas class="simon-board-canvas" id="simon-canvas"></canvas>
      </div>
      <div class="simon-mascot-col">
        <div class="mascot bounce" id="simon-mascot"><img src="assets/mascot/cerebrin.png" alt="Cerebrín" class="mascot-img" /></div>
      </div>
    </div>
  `;
  container.appendChild(box);

  const canvas = box.querySelector("#simon-canvas");
  const roundLabel = box.querySelector("#simon-round");
  const instructions = box.querySelector("#simon-instructions");
  const volumeSlider = box.querySelector("#simon-volume");
  const mascot = new Mascot(box.querySelector("#simon-mascot"), null);
  mascot.idle();
  volumeSlider.value = String(GameSounds.getVolume());
  volumeSlider.addEventListener("input", (e) => GameSounds.setVolume(Number(e.target.value)));

  const startedAt = Date.now();
  let bestRound = 0;

  const game = new SimonGame(canvas, {
    // Devuelve una promesa que se resuelve cuando Cerebrín termina de
    // hablar del todo (con una red de seguridad por si el evento de voz
    // no llegara a disparase nunca), para que el juego espere de verdad
    // a que termine la instrucción antes de empezar.
    onInstruction: () =>
      new Promise((resolve) => {
        const text = "Mira bien los colores, y después repite tú la secuencia igual.";
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          mascot.stopTalking();
          resolve();
        };
        mascot.startTalking();
        Voice.say(text, { onEnd: finish });
        setTimeout(finish, Voice.estimateDurationMs(text) + 800);
      }),
    onStateChange: (state) => {
      instructions.textContent =
        state === "showing"
          ? "Mira bien los colores…"
          : "¡Ahora te toca a ti! Toca los colores en el mismo orden.";
      if (state === "showing") mascot.thinking();
      else mascot.idle();
    },
    onRoundChange: (round) => {
      roundLabel.textContent = `Ronda: ${round}`;
      bestRound = Math.max(bestRound, round);
    },
    onRoundComplete: () => {
      burstConfetti(10);
      mascot.celebrate();
    },
    onWrong: (manyRetries) => {
      mascot.encourage();
      Voice.say(manyRetries ? "No pasa nada, sigamos intentándolo con calma." : "Casi, vamos a intentarlo otra vez.");
    },
    onMastery: () => {
      showSummary(true);
    },
  });

  canvas.addEventListener("click", (e) => {
    const idx = game.hitTest(e.clientX, e.clientY);
    if (idx >= 0) game.tap(idx);
  });

  game.start();

  box.querySelector("#simon-restart-btn").onclick = () => {
    game.stop();
    startFresh();
  };
  box.querySelector("#simon-finish-btn").onclick = () => {
    confirmExit(() => {
      game.stop();
      saveSession();
      onExit?.();
    });
  };

  function startFresh() {
    renderSimonGame(container, { profile, onExit });
  }

  async function saveSession() {
    if (!profile?.id) return;
    try {
      await recordGameSession(profile.id, "simon_colores", {
        points: bestRound,
        durationMs: Date.now() - startedAt,
        completed: bestRound >= MAX_SEQUENCE,
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
      <p class="text-base" style="margin:16px 0 28px;">Has llegado a la ronda ${bestRound}. Puedes seguir jugando un poco más, o salir ya.</p>
      <div class="row center wrap" style="gap:16px;">
        <button class="btn btn-ghost" id="simon-continue-btn">Continuar</button>
        <button class="btn btn-warm" id="simon-confirm-exit-btn">Salir</button>
      </div>
    `;
    modal.classList.add("active");
    modalBox.querySelector("#simon-continue-btn").onclick = () => modal.classList.remove("active");
    modalBox.querySelector("#simon-confirm-exit-btn").onclick = () => {
      modal.classList.remove("active");
      onConfirm();
    };
  }

  function showSummary(mastered) {
    game.stop();
    saveSession();
    box.innerHTML = `
      <img src="assets/mascot/cerebrin.png" alt="Cerebrín" class="closing-mascot" style="width:min(30vw,180px);" />
      <h2 class="title-xl" style="text-align:center;">${mastered ? "¡Te lo sabes todo!" : "¡Muy bien!"}</h2>
      <p class="text-lg" style="text-align:center; font-weight:800; color:var(--color-success);">Ronda alcanzada: ${bestRound}</p>
      <p class="text-md" style="text-align:center;">¿Quieres volver a jugar?</p>
      <div class="row center wrap" style="gap:16px; margin-top:10px;">
        <button class="btn btn-accent" id="simon-repeat-btn">🔄 Repetir</button>
        <button class="btn btn-success btn-huge" id="simon-exit-btn">Salir</button>
      </div>
    `;
    burstConfetti(24);
    Voice.say(`¡Muy bien! Has llegado a la ronda ${bestRound}.`);
    box.querySelector("#simon-repeat-btn").onclick = () => startFresh();
    box.querySelector("#simon-exit-btn").onclick = () => onExit?.();
  }

  return {
    destroy() {
      // Cancela cualquier secuencia/temporizador pendiente si se
      // abandona el juego a medias — igual de robusto que Cerebrín
      // Saltarín, aunque este juego no tenga un bucle de animación
      // continuo (es por turnos).
      game.stop();
    },
  };
}
