/**
 * data.js — Bancos de contenido reutilizables por varios ejercicios.
 * Mantenerlos amplios evita que la app se sienta repetitiva.
 */

export const ANIMALS = [
  { name: "Perro", emoji: "🐶", article: "el" }, { name: "Gato", emoji: "🐱", article: "el" },
  { name: "Caballo", emoji: "🐴", article: "el" }, { name: "Vaca", emoji: "🐮", article: "la" },
  { name: "Oveja", emoji: "🐑", article: "la" }, { name: "Cerdo", emoji: "🐷", article: "el" },
  { name: "Gallina", emoji: "🐔", article: "la" }, { name: "Pato", emoji: "🦆", article: "el" },
  { name: "Conejo", emoji: "🐰", article: "el" }, { name: "León", emoji: "🦁", article: "el" },
  { name: "Elefante", emoji: "🐘", article: "el" }, { name: "Mono", emoji: "🐵", article: "el" },
  { name: "Oso", emoji: "🐻", article: "el" }, { name: "Tortuga", emoji: "🐢", article: "la" },
  { name: "Pez", emoji: "🐟", article: "el" }, { name: "Pájaro", emoji: "🐦", article: "el" },
  { name: "Burro", emoji: "🫏", article: "el" }, { name: "Cabra", emoji: "🐐", article: "la" },
  { name: "Ratón", emoji: "🐭", article: "el" }, { name: "Búho", emoji: "🦉", article: "el" },
];

export const COLORS = [
  { name: "Rojo", hex: "#E5533D" }, { name: "Azul", hex: "#4E7FBF" },
  { name: "Verde", hex: "#5FA463" }, { name: "Amarillo", hex: "#F2C230" },
  { name: "Naranja", hex: "#F0954D" }, { name: "Morado", hex: "#9B7EDB" },
  { name: "Rosa", hex: "#EF9FBB" }, { name: "Marrón", hex: "#8B5E3C" },
  { name: "Blanco", hex: "#FFFFFF" }, { name: "Negro", hex: "#3A3A3A" },
];

export const OBJECTS = [
  { name: "Silla", emoji: "🪑" }, { name: "Mesa", emoji: "🛋️" },
  { name: "Taza", emoji: "☕" }, { name: "Reloj", emoji: "⏰" },
  { name: "Llave", emoji: "🔑" }, { name: "Paraguas", emoji: "☂️" },
  { name: "Libro", emoji: "📖" }, { name: "Gafas", emoji: "👓" },
  { name: "Zapato", emoji: "👞" }, { name: "Flor", emoji: "🌸" },
  { name: "Sol", emoji: "☀️" }, { name: "Luna", emoji: "🌙" },
  { name: "Casa", emoji: "🏠" }, { name: "Coche", emoji: "🚗" },
  { name: "Pelota", emoji: "⚽" }, { name: "Manzana", emoji: "🍎" },
  { name: "Pan", emoji: "🥖" }, { name: "Pescado", emoji: "🐟" },
];

/** Herramientas básicas y reconocibles para el ejercicio de puzle. */
export const TOOLS = [
  { name: "Martillo", emoji: "🔨" },
  { name: "Destornillador", emoji: "🪛" },
  { name: "Llave inglesa", emoji: "🔧" },
  { name: "Alicates", emoji: "🗜️" },
  { name: "Sierra", emoji: "🪚" },
  { name: "Tornillo", emoji: "🔩" },
];

/** Objetos de "atrezzo" fijos que dan contexto de taller al puzle (no son la respuesta). */
export const WORKSHOP_DECOR = ["🧰", "⚙️", "🪵"];

/** Banco amplio para el ejercicio "encuentra las diferencias". */
export const SCENE_ITEMS = [
  "🌳","🌸","🍄","🦋","🐝","☀️","⭐","🌈","🍎","🍇","🎈","🎀","🧸","⚽","🚗",
  "🏠","🌙","☂️","🐦","🐟","🌻","🍀","🎵","💛","🍊","🍉","🎁","🧦","👒","🕶️",
];

export function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
