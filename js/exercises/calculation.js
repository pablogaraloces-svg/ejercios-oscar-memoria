import { shuffle, randInt } from "./data.js";

const OP_WORDS = { "+": "más", "-": "menos" };

/**
 * Cálculo muy básico y cálido: sumas y restas sencillas.
 * Nivel bajo: números de 1 a 5, solo sumas.
 * Nivel alto: números hasta 20, sumas y restas.
 *
 * Importante: el texto que se muestra usa el símbolo (+ / -), pero el
 * texto que se LEE en voz alta usa la palabra completa ("más"/"menos"),
 * porque algunos motores de voz no pronuncian bien el símbolo "-" entre
 * números (a veces suena como si dijera "a" en vez de "menos").
 */
export function generateCalculationExercise(level = 2) {
  const maxNum = Math.min(3 + level * 1.6, 20);
  const allowSubtraction = level > 3;
  const op = allowSubtraction && Math.random() > 0.5 ? "-" : "+";

  let a = randInt(1, Math.floor(maxNum));
  let b = randInt(1, Math.floor(maxNum));
  if (op === "-" && b > a) [a, b] = [b, a]; // evitar negativos

  const correct = op === "+" ? a + b : a - b;
  const distractors = new Set();
  while (distractors.size < 3) {
    const delta = randInt(-3, 3) || 1;
    const val = correct + delta;
    if (val >= 0 && val !== correct) distractors.add(val);
  }

  const options = shuffle([correct, ...distractors]).map((n) => ({
    label: String(n),
    correct: n === correct,
  }));

  return {
    category: "calculo",
    kind: "choice",
    prompt: `¿Cuánto es ${a} ${op} ${b}?`,
    spokenPrompt: `¿Cuánto es ${a} ${OP_WORDS[op]} ${b}?`,
    options,
  };
}
