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
  voiceURI: null, // voz elegida por la familia (voces instaladas en el dispositivo)
  voiceRate: 0.92, // 0.75 lenta, 0.92 normal, 1.12 rápida
  voicePitch: 1.0, // tono, margen pequeño (0.85 - 1.15)
  highContrast: false,
  textSize: "base", // base | lg | xl
  reduceMotion: false,
  mascotEnabled: true,
  sessionMinutes: 25,
  exercisesPerSession: 20,
  musicEnabled: true,
  musicVolume: 0.35,
  musicTrack: 0, // 0-4, ver core/music.js
  adminPin: "1234", // PIN de administración (cambiable desde Ajustes > Contraseña admin)
  securityQuestion: "", // pregunta de recuperación si se olvida el PIN
  securityAnswer: "",
  adminMenuOrder: ["settings", "reports", "health", "family"], // orden de los botones del panel de Administración, reordenable
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
