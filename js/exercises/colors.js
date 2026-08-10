import { COLORS, sample, shuffle, randInt } from "./data.js";

export function generateColorExercise(level = 2) {
  const optionCount = level < 4 ? 3 : level < 8 ? 4 : 6;
  const chosen = sample(COLORS, optionCount);
  const target = chosen[randInt(0, chosen.length - 1)];
  const options = chosen.map((c) => ({
    color: c.hex,
    label: c.name,
    correct: c.name === target.name,
  }));

  return {
    category: "colores",
    kind: "choice",
    prompt: `Toca el color: ${target.name}`,
    options: shuffle(options),
  };
}
