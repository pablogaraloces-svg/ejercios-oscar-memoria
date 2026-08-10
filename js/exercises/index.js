import { generateMemoryExercise } from "./memory.js";
import { generateAttentionExercise } from "./attention.js";
import { generateCalculationExercise } from "./calculation.js";
import { generateColorExercise } from "./colors.js";
import { generateAnimalExercise } from "./animals.js";
import { generateFamilyPhotoExercise } from "./familyPhotos.js";
import { getLevel } from "../core/adaptiveDifficulty.js";

const GENERATORS = {
  memoria: generateMemoryExercise,
  atencion: generateAttentionExercise,
  calculo: generateCalculationExercise,
  colores: generateColorExercise,
  animales: generateAnimalExercise,
};

export const ALL_CATEGORIES = ["memoria", "atencion", "calculo", "colores", "animales", "fotos"];

export const CATEGORY_LABELS = {
  memoria: "Memoria",
  atencion: "Atención",
  calculo: "Cálculo",
  colores: "Colores",
  animales: "Animales",
  fotos: "Familia",
};

/**
 * Construye la lista de ejercicios para la sesión de hoy, mezclando
 * categorías (evita dos seguidas iguales) y respetando el nivel
 * adaptativo guardado por categoría para este perfil.
 */
export async function buildSessionExercises(profile, count = 8) {
  const enabledCategories = (profile.enabledCategories && profile.enabledCategories.length
    ? profile.enabledCategories
    : ALL_CATEGORIES
  ).filter((c) => c !== "fotos" || (profile.family && profile.family.length >= 2));

  const exercises = [];
  let lastCategory = null;

  for (let i = 0; i < count; i++) {
    let category;
    let attempts = 0;
    do {
      category = enabledCategories[Math.floor(Math.random() * enabledCategories.length)];
      attempts++;
    } while (category === lastCategory && enabledCategories.length > 1 && attempts < 8);
    lastCategory = category;

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
