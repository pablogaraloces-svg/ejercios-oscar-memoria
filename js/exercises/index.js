import { generateMemoryExercise } from "./memory.js";
import { generateAttentionExercise } from "./attention.js";
import { generateCalculationExercise } from "./calculation.js";
import { generateColorExercise } from "./colors.js";
import { generateAnimalExercise } from "./animals.js";
import { generateFamilyPhotoExercise } from "./familyPhotos.js";
import { generateDifferencesExercise } from "./spotDifference.js";
import { generatePuzzleExercise } from "./puzzleTools.js";
import { generateIntrusoExercise } from "./intruso.js";
import { generateCompraExercise } from "./compra.js";
import { getLevel } from "../core/adaptiveDifficulty.js";

const GENERATORS = {
  memoria: generateMemoryExercise,
  atencion: generateAttentionExercise,
  calculo: generateCalculationExercise,
  colores: generateColorExercise,
  animales: generateAnimalExercise,
  diferencias: generateDifferencesExercise,
  herramientas: generatePuzzleExercise,
  intruso: generateIntrusoExercise,
  compra: generateCompraExercise,
};

export const ALL_CATEGORIES = [
  "memoria",
  "atencion",
  "calculo",
  "colores",
  "animales",
  "diferencias",
  "herramientas",
  "intruso",
  "compra",
  "fotos",
];

export const CATEGORY_LABELS = {
  memoria: "Memoria",
  atencion: "Atención",
  calculo: "Cálculo",
  colores: "Colores",
  animales: "Animales",
  diferencias: "Diferencias",
  herramientas: "Herramientas",
  intruso: "El intruso",
  compra: "La compra",
  fotos: "Familia",
};

/**
 * Construye la lista de ejercicios para la sesión de hoy, mezclando
 * categorías (evita dos seguidas iguales) y respetando el nivel
 * adaptativo guardado por categoría para este perfil.
 *
 * IMPORTANTE: "fotos" (reconocimiento familiar), "herramientas" (puzle),
 * "intruso" y "compra" no se pueden elegir/desmarcar durante la
 * configuración inicial (son incorporaciones posteriores, o dependen de
 * fotos que aún no existen en ese momento). Por eso aquí se incluyen
 * SIEMPRE de forma automática cuando corresponda, en vez de depender de
 * profile.enabledCategories — si no, nunca llegarían a aparecer en la
 * rotación de ejercicios aunque la familia ya hubiera cargado fotos.
 */
export async function buildSessionExercises(profile, count = 20) {
  const hasFamily = !!(profile.family && profile.family.length >= 2);
  const ALWAYS_ON = ["herramientas", "intruso", "compra"];

  const baseCategories = (profile.enabledCategories && profile.enabledCategories.length
    ? profile.enabledCategories
    : ALL_CATEGORIES
  ).filter((c) => c !== "fotos" && !ALWAYS_ON.includes(c));

  const enabledCategories = [...baseCategories, ...ALWAYS_ON, ...(hasFamily ? ["fotos"] : [])];

  const exercises = [];
  let lastCategory = null;
  let lastTwo = [];

  function pickCategory(forced) {
    if (forced) return forced;
    let category;
    let attempts = 0;
    do {
      category = enabledCategories[Math.floor(Math.random() * enabledCategories.length)];
      attempts++;
    } while (
      (category === lastCategory || lastTwo.filter((c) => c === category).length >= 2) &&
      enabledCategories.length > 1 &&
      attempts < 12
    );
    return category;
  }

  // Posiciones garantizadas para que "fotos" (si hay familia cargada) y el
  // resto de categorías siempre activas formen parte SIEMPRE de la sesión,
  // no solo por azar.
  const forcedSlots = {};
  if (hasFamily) {
    forcedSlots[Math.floor(count * 0.2)] = "fotos";
    if (count >= 10) forcedSlots[Math.floor(count * 0.65)] = "fotos";
  }
  const spare = [Math.floor(count * 0.35), Math.floor(count * 0.5), Math.floor(count * 0.85)];
  ALWAYS_ON.forEach((cat, i) => {
    const slot = spare[i];
    if (slot !== undefined && forcedSlots[slot] === undefined) forcedSlots[slot] = cat;
  });

  for (let i = 0; i < count; i++) {
    const category = pickCategory(forcedSlots[i]);
    lastCategory = category;
    lastTwo = [...lastTwo.slice(-1), category];

    const level = await getLevel(profile.id, category);
    let ex;
    if (category === "fotos") {
      ex = generateFamilyPhotoExercise(profile.family, level);
      if (!ex) continue;
    } else {
      ex = GENERATORS[category](level);
    }
    ex.id = `${category}_${i}_${Date.now()}`;
    exercises.push(ex);
  }
  return exercises;
}
