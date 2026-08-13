import { ANIMALS, sample, shuffle, randInt } from "./data.js";

export function generateAnimalExercise(level = 2) {
  const optionCount = level < 4 ? 3 : level < 8 ? 4 : 6;
  const chosen = sample(ANIMALS, optionCount);
  const target = chosen[randInt(0, chosen.length - 1)];
  const options = chosen.map((a) => ({
    emoji: a.emoji,
    label: a.name,
    hideLabel: true, // solo se muestra el dibujo, sin el nombre debajo
    correct: a.name === target.name,
  }));

  return {
    category: "animales",
    kind: "choice",
    prompt: `¿Cuál es ${target.article} ${target.name.toLowerCase()}?`,
    options: shuffle(options),
  };
}
