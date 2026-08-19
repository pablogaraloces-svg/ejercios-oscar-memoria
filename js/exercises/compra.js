import { shuffle, sample } from "./data.js";

/**
 * "La compra" — Cerebrín dice qué hay que comprar y Óscar debe elegir el
 * producto correcto entre varios cotidianos y reconocibles. Trabaja
 * memoria, comprensión y asociación con una situación de la vida diaria.
 * Ejercicio nuevo e independiente: no modifica ningún ejercicio existente.
 */
const ITEMS = [
  { name: "leche", article: "la", emoji: "🥛" },
  { name: "pan", article: "el", emoji: "🍞" },
  { name: "manzanas", article: "las", emoji: "🍎" },
  { name: "huevos", article: "los", emoji: "🥚" },
  { name: "queso", article: "el", emoji: "🧀" },
  { name: "jabón", article: "el", emoji: "🧼" },
  { name: "agua", article: "el", emoji: "💧" },
  { name: "naranjas", article: "las", emoji: "🍊" },
];

export function generateCompraExercise(level = 2) {
  const [target, ...restPool] = shuffle(ITEMS);
  const decoys = sample(restPool, 3);

  const options = shuffle([target, ...decoys]).map((item) => ({
    label: item.name,
    emoji: item.emoji,
    hideLabel: true,
    correct: item.name === target.name,
  }));

  return {
    category: "compra",
    kind: "choice",
    prompt: `Hoy vamos a comprar ${target.article} ${target.name}. ¿Qué tenemos que comprar?`,
    options,
  };
}
