/**
 * state.js — Estado en memoria compartido entre módulos.
 * Fuente de verdad transitoria; la persistente vive en IndexedDB (db.js).
 */
export const AppState = {
  profile: null,        // perfil activo del usuario
  settings: null,        // preferencias globales (voz, contraste, texto...)
  reminders: [],          // recordatorios configurados
  todaySession: null,     // sesión de hoy en curso
  screenHistory: [],
  usedExerciseIds: new Set(), // evita repetir en la misma sesión
};

export const DEFAULT_SETTINGS = {
  id: "global",
  voiceEnabled: false,
  highContrast: false,
  textSize: "base", // base | lg | xl
  reduceMotion: false,
  mascotEnabled: true,
  sessionMinutes: 20,
};

export const DEFAULT_REMINDER_CATALOG = [
  { key: "medicacion", label: "Tomar la medicación", emoji: "💊" },
  { key: "agua", label: "Beber agua", emoji: "💧" },
  { key: "dientes", label: "Lavarse los dientes", emoji: "🪥" },
  { key: "paseo", label: "Dar un paseo", emoji: "🚶" },
  { key: "ejercicio", label: "Hacer ejercicios suaves", emoji: "🤸" },
  { key: "audifonos", label: "Ponerse los audífonos", emoji: "👂" },
  { key: "crema", label: "Ponerse crema", emoji: "🧴" },
  { key: "rehabilitacion", label: "Rehabilitación", emoji: "🦾" },
];
