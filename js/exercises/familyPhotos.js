import { shuffle, randInt } from "./data.js";

/**
 * Reconocimiento de familiares: usa las fotos guardadas en el perfil
 * (cargadas durante la configuración). Si no hay suficientes fotos,
 * este ejercicio se omite automáticamente (ver exercises/index.js).
 */
export function generateFamilyPhotoExercise(family, level = 2) {
  if (!family || family.length < 2) return null;

  const optionCount = Math.min(family.length, level < 5 ? 3 : 4);
  const chosen = shuffle(family).slice(0, optionCount);
  const target = chosen[randInt(0, chosen.length - 1)];

  return {
    category: "fotos",
    kind: "photo_choice",
    prompt: `¿Quién es ${target.relation ? "tu " + target.relation : "esta persona"}?`,
    photo: target.photo,
    options: chosen.map((f) => ({
      label: f.name,
      correct: f.name === target.name,
    })),
  };
}
