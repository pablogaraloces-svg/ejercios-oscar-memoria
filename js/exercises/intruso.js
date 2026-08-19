import { shuffle, sample, randInt } from "./data.js";

/**
 * "El intruso" — se muestran 4 elementos: 3 de una misma categoría y 1
 * que no pertenece al grupo. Óscar debe encontrar el que sobra.
 * Ejercicio nuevo e independiente: no modifica ningún ejercicio existente.
 */
const CATEGORIES = {
  Animales: [
    { name: "Perro", emoji: "🐶" }, { name: "Gato", emoji: "🐱" },
    { name: "Caballo", emoji: "🐴" }, { name: "Vaca", emoji: "🐮" },
    { name: "Cerdo", emoji: "🐷" }, { name: "Conejo", emoji: "🐰" },
    { name: "Oso", emoji: "🐻" },
  ],
  Cocina: [
    { name: "Tenedor", emoji: "🍴" }, { name: "Cuchara", emoji: "🥄" },
    { name: "Cuchillo", emoji: "🔪" }, { name: "Sartén", emoji: "🍳" },
    { name: "Cuenco", emoji: "🥣" },
  ],
  Herramientas: [
    { name: "Martillo", emoji: "🔨" }, { name: "Llave inglesa", emoji: "🔧" },
    { name: "Tijeras", emoji: "✂️" }, { name: "Destornillador", emoji: "🪛" },
    { name: "Sierra", emoji: "🪚" },
  ],
  Frutas: [
    { name: "Manzana", emoji: "🍎" }, { name: "Pera", emoji: "🍐" },
    { name: "Plátano", emoji: "🍌" }, { name: "Uvas", emoji: "🍇" },
    { name: "Naranja", emoji: "🍊" },
  ],
  Transporte: [
    { name: "Coche", emoji: "🚗" }, { name: "Autobús", emoji: "🚌" },
    { name: "Bicicleta", emoji: "🚲" }, { name: "Taxi", emoji: "🚕" },
    { name: "Tren", emoji: "🚂" },
  ],
};

export function generateIntrusoExercise(level = 2) {
  const catNames = Object.keys(CATEGORIES);
  const mainCat = catNames[randInt(0, catNames.length - 1)];
  const otherCats = catNames.filter((c) => c !== mainCat);
  const intruderCat = otherCats[randInt(0, otherCats.length - 1)];

  const mainItems = sample(CATEGORIES[mainCat], 3);
  const intruder = sample(CATEGORIES[intruderCat], 1)[0];

  const options = shuffle([...mainItems, intruder]).map((item) => ({
    label: item.name,
    emoji: item.emoji,
    hideLabel: true,
    correct: item.name === intruder.name && item.emoji === intruder.emoji,
  }));

  return {
    category: "intruso",
    kind: "choice",
    prompt: "¿Cuál no pertenece al grupo?",
    spokenPrompt: "Fíjate en estas imágenes. ¿Cuál no pertenece al grupo?",
    options,
  };
}
