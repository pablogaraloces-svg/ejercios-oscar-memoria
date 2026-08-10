/**
 * data.js — Bancos de contenido reutilizables por varios ejercicios.
 * Mantenerlos amplios evita que la app se sienta repetitiva.
 */

export const ANIMALS = [
  { name: "Perro", emoji: "🐶" }, { name: "Gato", emoji: "🐱" },
  { name: "Caballo", emoji: "🐴" }, { name: "Vaca", emoji: "🐮" },
  { name: "Oveja", emoji: "🐑" }, { name: "Cerdo", emoji: "🐷" },
  { name: "Gallina", emoji: "🐔" }, { name: "Pato", emoji: "🦆" },
  { name: "Conejo", emoji: "🐰" }, { name: "León", emoji: "🦁" },
  { name: "Elefante", emoji: "🐘" }, { name: "Mono", emoji: "🐵" },
  { name: "Oso", emoji: "🐻" }, { name: "Tortuga", emoji: "🐢" },
  { name: "Pez", emoji: "🐟" }, { name: "Pájaro", emoji: "🐦" },
  { name: "Burro", emoji: "🫏" }, { name: "Cabra", emoji: "🐐" },
  { name: "Ratón", emoji: "🐭" }, { name: "Búho", emoji: "🦉" },
];

export const COLORS = [
  { name: "Rojo", hex: "#E5533D" }, { name: "Azul", hex: "#4E7FBF" },
  { name: "Verde", hex: "#5FA463" }, { name: "Amarillo", hex: "#F2C230" },
  { name: "Naranja", hex: "#F0954D" }, { name: "Morado", hex: "#9B7EDB" },
  { name: "Rosa", hex: "#EF9FBB" }, { name: "Marrón", hex: "#8B5E3C" },
  { name: "Blanco", hex: "#F4F1EA" }, { name: "Negro", hex: "#3A3A3A" },
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

export function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
