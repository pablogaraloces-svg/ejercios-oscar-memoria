import { shuffle, randInt } from "./data.js";

const OP_WORDS = { "+": "más", "-": "menos" };

/**
 * Cálculo muy básico y cálido: sumas y restas sencillas.
 * La mayoría de las veces usa números pequeños y fáciles, pero de vez en
 * cuando (para variar y poner un pequeño reto) alterna con números algo
 * más grandes, tipo "12 + 12", independientemente del nivel adaptativo.
 *
 * Importante: el texto que se muestra usa el símbolo (+ / -), pero el
 * texto que se LEE en voz alta usa la palabra completa ("más"/"menos"),
 * porque algunos motores de voz no pronuncian bien el símbolo "-" entre
 * números (a veces suena como si dijera "a" en vez de "menos").
 */
export function generateCalculationExercise(level = 2) {
  const allowSubtraction = level > 3;
  const op = allowSubtraction && Math.random() > 0.5 ? "-" : "+";

  // ~30% de las veces: números un poco más grandes (dos cifras) para
  // variar y dar algo más de reto, alternando con los más sencillos.
  const harder = Math.random() < 0.3;

  let a, b;
  if (harder) {
    a = randInt(10, 20);
    b = randInt(10, 20);
  } else {
    const maxNum = Math.min(3 + level * 1.6, 12);
    a = randInt(1, Math.floor(maxNum));
    b = randInt(1, Math.floor(maxNum));
  }
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
    calcA: a,
    calcOp: op,
    calcB: b,
    calcResult: correct,
    options,
  };
}
