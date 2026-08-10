import { ANIMALS, OBJECTS, COLORS, sample, shuffle, randInt } from "./data.js";

/**
 * Ejercicios de atención: encontrar el elemento distinto entre varios iguales,
 * o encontrar el elemento que se pide entre varias opciones.
 */
export function generateAttentionExercise(level = 2) {
  const mode = Math.random() > 0.5 ? "odd_one_out" : "find_named";

  if (mode === "odd_one_out") {
    const pool = Math.random() > 0.5 ? ANIMALS : OBJECTS;
    const gridSize = level < 4 ? 4 : level < 7 ? 6 : 9;
    const [common, different] = sample(pool, 2);
    const options = [];
    for (let i = 0; i < gridSize - 1; i++) {
      options.push({ label: common.name, emoji: common.emoji, correct: false, isDistractor: true });
    }
    options.push({ label: different.name, emoji: different.emoji, correct: true });
    return {
      category: "atencion",
      kind: "choice",
      prompt: "Toca el que es diferente a los demás",
      options: shuffle(options),
    };
  }

  // find_named
  const pool = Math.random() > 0.5 ? ANIMALS : COLORS;
  const isColor = pool === COLORS;
  const optionCount = level < 4 ? 3 : level < 7 ? 4 : 6;
  const chosen = sample(pool, optionCount);
  const target = chosen[randInt(0, chosen.length - 1)];
  const options = chosen.map((item) => ({
    label: item.name,
    emoji: isColor ? undefined : item.emoji,
    color: isColor ? item.hex : undefined,
    correct: item.name === target.name,
  }));

  return {
    category: "atencion",
    kind: "choice",
    prompt: `Toca: ${target.name}`,
    options: shuffle(options),
  };
}
