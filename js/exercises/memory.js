import { ANIMALS, OBJECTS, sample, shuffle, randInt } from "./data.js";

const INTROS = [
  "{name}, ahora fíjate bien en estas imágenes durante unos segundos.",
  "Vamos a entrenar la memoria, {name}. Mira con calma, sin prisa.",
  "{name}, obsérvalas tranquilamente, luego te pregunto.",
  "Fíjate bien, {name}. Dentro de un momento te pregunto qué había.",
];

const QUESTIONS = [
  "¿Cuál de estos la hemos visto antes?",
  "¿Cuál de estas imágenes ha aparecido antes?",
  "¿Te acuerdas de cuál era? Tócala.",
  "¿Cuál de estas estaba en el grupo de antes?",
];

function pickOne(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Genera un ejercicio de memoria: se muestran N elementos durante 10
 * segundos exactos, luego se pregunta cuál de ellos apareció.
 * La introducción y la pregunta varían para no sonar repetitivas.
 */
export function generateMemoryExercise(level = 2) {
  const pool = Math.random() > 0.5 ? ANIMALS : OBJECTS;
  const itemsToShow = Math.min(2 + Math.floor(level / 3), 4);
  const studySeconds = 10;

  const shown = sample(pool, itemsToShow);
  const decoyCount = Math.min(1 + Math.floor(level / 4), 3);
  const decoys = sample(
    pool.filter((p) => !shown.includes(p)),
    decoyCount
  );

  const target = shown[randInt(0, shown.length - 1)];
  const options = shuffle([target, ...decoys]).map((item) => ({
    label: item.name,
    emoji: item.emoji,
    correct: item.name === target.name,
    hideLabel: true,
  }));

  return {
    category: "memoria",
    kind: "memory_recall",
    studyItems: shown,
    studySeconds,
    introText: pickOne(INTROS),
    prompt: pickOne(QUESTIONS),
    options,
  };
}
