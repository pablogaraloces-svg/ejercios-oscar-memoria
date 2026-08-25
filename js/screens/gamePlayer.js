import { RestGame } from "./restGame.js";
import { GameSounds } from "../core/gameSounds.js";
import { Voice } from "../core/voice.js";
import { recordGameSession } from "../core/gameStats.js";
import { burstConfetti } from "../core/confetti.js";

/**
 * gamePlayer.js — Construye la experiencia completa de "Cerebrín
 * Saltarín" (título, HUD, lienzo, botón SALTAR, Reiniciar/Salir) dentro
 * de cualquier contenedor. Se usa desde dos sitios:
 *
 *  - mode:"rest"  → al terminar los ejercicios cognitivos (SessionRunner).
 *  - mode:"free"  → desde la Sala de Juegos, sin haber hecho ejercicios.
 *
 * onExit() se llama cuando el usuario decide salir del todo (confirmado
 * si la partida seguía en marcha); cada sitio decide qué significa
 * "salir" (continuar el cierre de la sesión, o volver a la Sala de
 * Juegos) — este archivo no conoce esa diferencia, solo avisa.
 */
export function renderCerebrinSaltarin(container, { mode, profile, onExit }) {
  container.innerHTML = "";
  const box = document.createElement("div");
  box.className = "col center rest-game-wrap";
  box.innerHTML = `
    <h2 class="title-xl" style="text-align:center;">🕹️ Cerebrín Saltarín</h2>
    <p class="text-md" style="text-align:center;">Salta para esquivar a los animales y coger premios ⭐🎈</p>
    <div class="rest-game-hud">
      <span class="rest-game-points" id="rg-points">Puntos: 0</span>
      <div class="row" style="flex:1; align-items:center; gap:10px;">
        <div class="progress-track"><div class="progress-fill" id="rg-progress-fill" style="width:0%;"></div></div>
        <span class="pill">META</span>
      </div>
      <div class="game-volume-control">
        <span aria-hidden="true">🔊</span>
        <input type="range" min="0" max="1" step="0.1" value="1" class="game-volume-slider" id="rg-volume" aria-label="Volumen del juego" />
      </div>
    </div>
    <div class="rest-game-arcade-row">
      <div class="rest-game-side-btns">
        <button class="rest-game-side-btn" id="rg-restart-btn" aria-label="Reiniciar">
          <span class="rest-game-side-btn-icon">🔄</span><span>Reiniciar</span>
        </button>
        <button class="rest-game-side-btn" id="rg-finish-btn" aria-label="Salir">
          <span class="rest-game-side-btn-icon">🚪</span><span>Salir</span>
        </button>
      </div>
      <div class="rest-game-canvas-wrap">
        <canvas class="rest-game-canvas" id="rg-canvas"></canvas>
      </div>
      <button class="rest-game-jump-arcade-btn" id="rg-jump-btn">SALTAR</button>
    </div>
  `;
  container.appendChild(box);

  const canvas = box.querySelector("#rg-canvas");
  const pointsLabel = box.querySelector("#rg-points");
  const progressFill = box.querySelector("#rg-progress-fill");
  const jumpBtn = box.querySelector("#rg-jump-btn");
  const volumeSlider = box.querySelector("#rg-volume");
  volumeSlider.value = String(GameSounds.getVolume());
  volumeSlider.addEventListener("input", (e) => GameSounds.setVolume(Number(e.target.value)));

  GameSounds.startMusic(0.2);
  const startedAt = Date.now();
  let summaryShown = false;

  const game = new RestGame(canvas, {
    onJump: () => GameSounds.playJump(),
    onObstacleCleared: () => GameSounds.playClear(),
    onObstacleHit: () => GameSounds.playHit(),
    onPrizeCollected: () => GameSounds.playPrize(),
    onPrizeMissed: () => {}, // penalización silenciosa: no hace falta un sonido específico, ya se ve reflejado en los puntos
    onGoalReached: () => GameSounds.playVictory(),
    // Refuerzo hablado puntual, nunca continuo — como pide el diseño.
    onNearGoal: () => Voice.say("¡Ya falta poquito!"),
    onAlmostThere: () => Voice.say("¡Lo estás haciendo muy bien!"),
    onProgress: ({ points, progress, done }) => {
      pointsLabel.textContent = `Puntos: ${Math.floor(points)}`;
      progressFill.style.width = `${Math.round(progress * 100)}%`;
      if (done && !summaryShown) {
        summaryShown = true;
        showSummary();
      }
    },
  });

  const doJump = () => game.jump();
  jumpBtn.addEventListener("click", doJump);
  canvas.addEventListener("click", doJump);
  game.start();

  box.querySelector("#rg-restart-btn").onclick = () => {
    GameSounds.stopMusic();
    game.stop();
    startGameFresh();
  };

  box.querySelector("#rg-finish-btn").onclick = () => {
    confirmExit(() => {
      game.stop();
      GameSounds.stopMusic();
      saveSession(false);
      onExit?.();
    });
  };

  function startGameFresh() {
    renderCerebrinSaltarin(container, { mode, profile, onExit });
  }

  async function saveSession(completed) {
    if (!profile?.id) return;
    try {
      await recordGameSession(profile.id, "cerebrin_saltarin", {
        points: game.points,
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
      <h2 class="title-lg">¿Quieres finalizar el juego?</h2>
      <p class="text-base" style="margin:16px 0 28px;">Puedes seguir jugando un poco más, o salir ya.</p>
      <div class="row center wrap" style="gap:16px;">
        <button class="btn btn-ghost" id="rg-continue-btn">Continuar</button>
        <button class="btn btn-warm" id="rg-confirm-exit-btn">Salir</button>
      </div>
    `;
    modal.classList.add("active");
    modalBox.querySelector("#rg-continue-btn").onclick = () => modal.classList.remove("active");
    modalBox.querySelector("#rg-confirm-exit-btn").onclick = () => {
      modal.classList.remove("active");
      onConfirm();
    };
  }

  function showSummary() {
    game.stop();
    GameSounds.stopMusic();
    saveSession(true);
    const finalPoints = Math.floor(game.points);
    box.innerHTML = `
      <img src="assets/mascot/cerebrin.png" alt="Cerebrín" class="closing-mascot" style="width:min(30vw,180px);" />
      <h2 class="title-xl" style="text-align:center;">¡LO HAS CONSEGUIDO!</h2>
      <p class="text-lg" style="text-align:center; font-weight:800; color:var(--color-success);">Puntos: ${finalPoints}</p>
      <p class="text-md" style="text-align:center;">¿Qué quieres hacer?</p>
      <div class="row center wrap" style="gap:16px; margin-top:10px;">
        <button class="btn btn-accent" id="rg-repeat-btn">🔄 Repetir</button>
        <button class="btn btn-success btn-huge" id="rg-exit-btn">Salir</button>
      </div>
    `;
    burstConfetti(24);
    Voice.say(`¡Lo has conseguido! Puntos: ${finalPoints}.`);

    box.querySelector("#rg-repeat-btn").onclick = () => startGameFresh();
    box.querySelector("#rg-exit-btn").onclick = () => onExit?.();
  }

  return {
    destroy() {
      game.stop();
      GameSounds.stopMusic();
    },
  };
}
