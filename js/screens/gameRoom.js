import { renderCerebrinSaltarin } from "./gamePlayer.js";
import { renderSimonGame } from "./simonGame.js";
import { getGameStats } from "../core/gameStats.js";

/**
 * gameRoom.js — "Sala de juegos": acceso directo a los juegos, sin pasar
 * por los ejercicios cognitivos (aquí la partida se considera "juego
 * libre", no "juego de descanso").
 *
 * Arquitectura pensada para crecer: para añadir un juego nuevo en el
 * futuro basta con añadir una entrada más a GAMES (icono, nombre,
 * descripción y su función de render) — el resto de esta pantalla no
 * necesita ningún cambio.
 */
const GAMES = [
  {
    id: "cerebrin_saltarin",
    name: "Cerebrín Saltarín",
    emoji: "🕹️",
    description: "Ayuda a Cerebrín a saltar los obstáculos y conseguir premios.",
    enabled: true,
    render: renderCerebrinSaltarin,
  },
  {
    id: "simon_colores",
    name: "El juego de los colores",
    emoji: "🎨",
    description: "Memoriza y repite la secuencia de colores y sonidos, cada vez más larga.",
    enabled: true,
    render: renderSimonGame,
  },
  // Futuros juegos: añadir aquí una entrada más, con su propio "render".
];

let activeGamePlayer = null;

/** Se llama desde app.js al salir de la Sala de Juegos por el botón
 * "atrás" de la barra superior, para no dejar música/animación de un
 * juego corriendo de fondo si no se salió por su propio botón "Salir". */
export function stopActiveGame() {
  activeGamePlayer?.destroy?.();
  activeGamePlayer = null;
}

export async function renderGameRoom(rootEl, ctx) {
  stopActiveGame();
  rootEl.innerHTML = "";

  const title = document.createElement("h2");
  title.className = "title-xl";
  title.style.textAlign = "center";
  title.textContent = "🎮 Sala de juegos";
  rootEl.appendChild(title);

  const intro = document.createElement("p");
  intro.className = "text-md";
  intro.style.textAlign = "center";
  intro.textContent = "Elige un juego para pasar un buen rato con Cerebrín, sin necesidad de hacer antes los ejercicios.";
  rootEl.appendChild(intro);

  const list = document.createElement("div");
  list.className = "col game-room-list";

  const enabledGames = GAMES.filter((g) => g.enabled);
  for (const game of enabledGames) {
    const stats = await getGameStats(ctx.profile.id, game.id);
    const card = document.createElement("div");
    card.className = "card game-card";
    card.innerHTML = `
      <div class="row" style="gap:16px; align-items:center;">
        <span class="game-card-icon">${game.emoji}</span>
        <div class="col" style="gap:4px; flex:1;">
          <span class="game-card-name">${game.name}</span>
          <span class="text-md">${game.description}</span>
          ${stats.plays ? `<span class="text-sm game-card-stats">Mejor puntuación: ${stats.bestScore} · Partidas jugadas: ${stats.plays}</span>` : ""}
        </div>
      </div>
    `;
    const playBtn = document.createElement("button");
    playBtn.className = "btn btn-success btn-huge";
    playBtn.style.marginTop = "14px";
    playBtn.style.width = "100%";
    playBtn.textContent = "JUGAR";
    playBtn.onclick = () => {
      activeGamePlayer = game.render(rootEl, {
        mode: "free",
        profile: ctx.profile,
        onExit: () => renderGameRoom(rootEl, ctx),
      });
    };
    card.appendChild(playBtn);
    list.appendChild(card);
  }
  rootEl.appendChild(list);
}
