import { TOOL_PAIRS, shuffle, sample, randInt } from "./data.js";

/**
 * generatePuzzleExercise — Se muestra un objeto (un tornillo, un tronco de
 * madera, un clavo...) y Óscar debe elegir, entre varias herramientas, la
 * que de verdad se necesita para ese objeto. Ya no hay "piezas de contexto"
 * sueltas sin relación: cada objeto tiene una única herramienta lógica.
 */
export function generatePuzzleExercise(level = 2) {
  const optionCount = level < 4 ? 3 : level < 8 ? 4 : Math.min(5, TOOL_PAIRS.length);

  const target = TOOL_PAIRS[randInt(0, TOOL_PAIRS.length - 1)];
  const otherTools = TOOL_PAIRS.filter((p) => p.tool !== target.tool);
  const decoys = sample(otherTools, Math.min(optionCount - 1, otherTools.length));

  const options = shuffle([target, ...decoys]).map((p) => ({
    label: p.tool,
    emoji: p.toolEmoji,
    hideLabel: true,
    correct: p.tool === target.tool,
  }));

  return {
    category: "herramientas",
    kind: "puzzle_piece",
    prompt: `${target.situation}. ¿Qué herramienta necesitas?`,
    contextEmoji: target.contextEmoji,
    contextLabel: target.context,
    targetEmoji: target.toolEmoji,
    targetName: target.tool,
    options,
  };
}
