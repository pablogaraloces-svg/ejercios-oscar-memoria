import { TOOLS, WORKSHOP_DECOR, sample, shuffle, randInt } from "./data.js";

/**
 * generatePuzzleExercise — Un pequeño "puzle" de taller (una cuadrícula
 * 2x2) con tres huecos ya rellenos con objetos de contexto y un hueco
 * vacío que corresponde a una herramienta. Óscar debe elegir, entre varias
 * opciones, la herramienta que falta para completar el puzle.
 */
export function generatePuzzleExercise(level = 2) {
  const optionCount = level < 4 ? 3 : level < 8 ? 4 : 5;
  const chosen = sample(TOOLS, Math.min(optionCount, TOOLS.length));
  const target = chosen[randInt(0, chosen.length - 1)];

  // Tres celdas de contexto fijas (no son la respuesta), siempre en el mismo
  // orden visual salvo la posición del hueco, que varía.
  const decor = sample(WORKSHOP_DECOR, 3);
  const emptySlotIndex = randInt(0, 3);

  const cells = [];
  let decorIdx = 0;
  for (let i = 0; i < 4; i++) {
    if (i === emptySlotIndex) cells.push({ empty: true });
    else cells.push({ empty: false, emoji: decor[decorIdx++] });
  }

  return {
    category: "herramientas",
    kind: "puzzle_piece",
    prompt: "Falta una pieza en el puzle. ¿Cuál encaja aquí?",
    cells,
    emptySlotIndex,
    targetEmoji: target.emoji,
    targetName: target.name,
    options: shuffle(chosen).map((t) => ({
      label: t.name,
      emoji: t.emoji,
      hideLabel: true,
      correct: t.name === target.name,
    })),
  };
}
