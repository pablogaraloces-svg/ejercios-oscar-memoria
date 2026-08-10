import { ANIMALS, OBJECTS, sample, shuffle, randInt } from "./data.js";

/**
 * Genera un ejercicio de memoria: se muestran N elementos unos segundos,
 * luego se pregunta cuál de ellos apareció.
 * Nivel bajo = 2 elementos a recordar y estudio largo.
 * Nivel alto = hasta 4 elementos y menos tiempo.
 */
export function generateMemoryExercise(level = 2) {
  const pool = Math.random() > 0.5 ? ANIMALS : OBJECTS;
  const itemsToShow = Math.min(2 + Math.floor(level / 3), 4);
  const studySeconds = Math.max(4, 8 - Math.floor(level / 2));

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
  }));

  return {
    category: "memoria",
    kind: "memory_recall",
    studyItems: shown,
    studySeconds,
    prompt: "¿Cuál de estos la hemos visto antes?",
    options,
  };
}
