import { SCENE_ITEMS, sample, shuffle, randInt } from "./data.js";

/**
 * generateDifferencesExercise — Dos paneles con los mismos elementos,
 * pero 3 de ellos son distintos entre sí. Óscar debe tocar, en el
 * panel B, los elementos que sean diferentes al panel A.
 * Nivel bajo: rejilla pequeña. Nivel alto: rejilla más grande.
 */
export function generateDifferencesExercise(level = 2) {
  const gridSize = level < 4 ? 6 : level < 7 ? 8 : 9;
  const diffCount = 3;

  const base = sample(SCENE_ITEMS, gridSize);
  const others = SCENE_ITEMS.filter((s) => !base.includes(s));
  const diffPositions = shuffle([...Array(gridSize).keys()]).slice(0, diffCount);

  const panelA = [...base];
  const panelB = [...base];
  diffPositions.forEach((pos, i) => {
    panelB[pos] = others[i % others.length];
  });

  return {
    category: "diferencias",
    kind: "spot_diff",
    prompt: "Toca en la segunda imagen los 3 elementos que sean diferentes",
    panelA,
    panelB,
    diffPositions,
  };
}
