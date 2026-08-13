import { generateMemoryExercise } from "./memory.js";
import { generateAttentionExercise } from "./attention.js";
import { generateCalculationExercise } from "./calculation.js";
import { generateColorExercise } from "./colors.js";
import { generateAnimalExercise } from "./animals.js";
import { generateFamilyPhotoExercise } from "./familyPhotos.js";
import { generateDifferencesExercise } from "./spotDifference.js";
import { getLevel } from "../core/adaptiveDifficulty.js";

const GENERATORS = {
  memoria: generateMemoryExercise,
  atencion: generateAttentionExercise,
  calculo: generateCalculationExercise,
  colores: generateColorExercise,
  animales: generateAnimalExercise,
  diferencias: generateDifferencesExercise,
};

export const ALL_CATEGORIES = ["memoria", "atencion", "calculo", "colores", "animales", "diferencias", "fotos"];

export const CATEGORY_LABELS = {
  memoria: "Memoria",
  atencion: "Atención",
  calculo: "Cálculo",
  colores: "Colores",
  animales: "Animales",
  diferencias: "Diferencias",
  fotos: "Familia",
};

/**
 * Construye la lista de ejercicios para la sesión de hoy, mezclando
 * categorías (evita dos seguidas iguales) y respetando el nivel
 * adaptativo guardado por categoría para este perfil.
 */
export async function buildSessionExercises(profile, count = 20) {
  const enabledCategories = (profile.enabledCategories && profile.enabledCategories.length
    ? profile.enabledCategories
    : ALL_CATEGORIES
  ).filter((c) => c !== "fotos" || (profile.family && profile.family.length >= 2));

  const exercises = [];
  let lastCategory = null;
  let lastTwo = [];

  for (let i = 0; i < count; i++) {
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
