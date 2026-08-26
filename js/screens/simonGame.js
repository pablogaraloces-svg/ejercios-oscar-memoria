import { GameSounds } from "../core/gameSounds.js";
import { Voice } from "../core/voice.js";
import { recordGameSession } from "../core/gameStats.js";
import { burstConfetti } from "../core/confetti.js";
import { Mascot } from "../core/mascot.js";

/**
 * simonGame.js — Juego de memoria inspirado en "Simón": 5 cuadrados
 * redondeados con volumen 3D (mismo lenguaje visual que el botón
 * SALTAR), en una fila horizontal — azul, verde, rojo, amarillo, negro
 * — cada uno con su propia nota musical. Cerebrín muestra una secuencia
 * cada vez más larga y Óscar debe repetirla tocando los colores en el
 * mismo orden.
 *
 * Diseño accesible a propósito: un fallo NUNCA termina la partida de
 * golpe — se repite la misma secuencia con ánimo, sin perder lo ya
 * conseguido. Ritmo pausado (secuencia lenta, notas largas), pensado
 * para una persona mayor.
 *
 * Totalmente independiente del sistema de ejercicios/estadísticas
 * cognitivas — igual que los demás juegos, guarda sus propios datos en
 * core/gameStats.js, nunca en "progress".
 */

const COLORS = [
  { key: "blue", label: "Azul", note: 261.63 },
  { key: "green", label: "Verde", note: 329.63 },
  { key: "red", label: "Rojo", note: 392.0 },
  { key: "yellow", label: "Amarillo", note: 440.0 },
  { key: "black", label: "Negro", note: 523.25 },
];
const MAX_SEQUENCE = 10; // llegar aquí se celebra como "maestría" del juego
const MAX_RETRIES_PER_ROUND = 3; // nunca se "pierde" del todo, pero sí se anima a intentarlo de nuevo

class SimonGame {
  constructor(squares, callbacks = {}) {
    this.squares = squares; // 5 botones del DOM, uno por color
    this.callbacks = callbacks;
    this.sequence = [];
    this.playerIndex = 0;
    this.round = 0;
    this.retries = 0;
    this.state = "idle"; // idle | showing | listening | ended
    this.stopped = false;
  }

  /** Cancela cualquier temporizador pendiente (se llama al salir del
   * juego), para no dejar nada corriendo de fondo si se abandona a
   * media secuencia. */
  stop() {
    this.stopped = true;
  }

  start() {
    this.sequence = [];
    this.round = 0;
    this.addRandomStep();
    this.callbacks.onRoundChange?.(this.round);
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
      // empezar a mostrar la secuencia.
      await this.callbacks.onInstruction?.();
      if (this.stopped) return;
      await this._sleep(400); // pequeña pausa natural tras la voz, antes de empezar
    } else {
      await this._sleep(650);
    }
    if (this.stopped) return;
    for (let i = 0; i < this.sequence.length; i++) {
      if (this.stopped) return;
      const idx = this.sequence[i];
      // Iluminación y nota largas, con pausa generosa entre una y otra:
      // pensado para que a una persona mayor le dé tiempo de sobra a
      // seguir la secuencia con calma, sin sensación de prisa.
      this.lightUp(idx, 1100);
      GameSounds.playNote(COLORS[idx].note, 0.9);
      this.callbacks.onProgress?.();
      await this._sleep(1300);
    }
    if (this.stopped) return;
    this.state = "listening";
    this.callbacks.onStateChange?.("listening");
  }

  lightUp(index, ms) {
    const el = this.squares[index];
    el.classList.add("simon-square-lit");
    setTimeout(() => {
      if (this.stopped) return;
      el.classList.remove("simon-square-lit");
    }, ms);
  }

  /** Toque del jugador sobre un color concreto (índice 0-4). */
  tap(index) {
    if (this.state !== "listening") return;
    this.lightUp(index, 320);
    GameSounds.playNote(COLORS[index].note, 0.35);

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
        }, 1600);
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
      }, 1800);
    }
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
    <h2 class="title-xl simon-title" style="text-align:center;">🎨 El juego de los colores</h2>
    <p class="text-md" id="simon-instructions" style="text-align:center;">Mira bien los colores que se iluminan, y luego tócalos en el mismo orden.</p>
    <div class="simon-hud">
      <span class="rest-game-points" id="simon-round">Ronda: 0 / ${MAX_SEQUENCE}</span>
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
      <div class="simon-mascot-col">
        <div class="mascot bounce" id="simon-mascot"><img src="assets/mascot/cerebrin.png" alt="Cerebrín" class="mascot-img" /></div>
      </div>
    </div>
    <div class="simon-board-row" id="simon-board">
      ${COLORS.map((c) => `<button class="simon-square simon-square-${c.key}" aria-label="${c.label}"></button>`).join("")}
    </div>
  `;
  container.appendChild(box);

  const squares = [...box.querySelectorAll(".simon-square")];
  const roundLabel = box.querySelector("#simon-round");
  const instructions = box.querySelector("#simon-instructions");
  const volumeSlider = box.querySelector("#simon-volume");
  const mascot = new Mascot(box.querySelector("#simon-mascot"), null);
  mascot.idle();
  volumeSlider.value = String(GameSounds.getVolume());
  volumeSlider.addEventListener("input", (e) => GameSounds.setVolume(Number(e.target.value)));

  const startedAt = Date.now();
  let bestRound = 0;

  const game = new SimonGame(squares, {
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
      roundLabel.textContent = `Ronda: ${round} / ${MAX_SEQUENCE}`;
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

  squares.forEach((sq, i) => {
    sq.onclick = () => game.tap(i);
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
      // abandona el juego a medias.
      game.stop();
    },
  };
}
