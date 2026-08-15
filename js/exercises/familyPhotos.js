import { shuffle, randInt } from "./data.js";

/**
 * Reconocimiento de familiares: usa las fotos guardadas en el perfil
 * (cargadas durante la configuración). Si no hay suficientes fotos,
 * este ejercicio se omite automáticamente (ver exercises/index.js).
 */
export function generateFamilyPhotoExercise(family, level = 2) {
  if (!family || family.length < 2) return null;

  // Variación: elegimos entre varias formas de preguntar, y una foto y
  // combinación de opciones distinta cada vez.
  const prompts = ["¿Reconoces a esta persona?", "¿Quién es?", "¿Sabes quién es esta persona?"];
  const prompt = prompts[randInt(0, prompts.length - 1)];

  const optionCount = Math.min(family.length, 3);
  const chosen = shuffle(family).slice(0, optionCount);
  const target = chosen[randInt(0, chosen.length - 1)];

  return {
    category: "fotos",
    kind: "photo_choice",
    prompt,
    photo: target.photo,
    // Se guarda la persona completa (no solo el nombre) para poder construir
    // la frase de acierto con parentesco y género reales, sin inventar nada.
    options: chosen.map((f) => ({
      label: f.name,
      relation: f.relation || "",
      gender: f.gender || null,
      correct: f.name === target.name,
    })),
  };
}
