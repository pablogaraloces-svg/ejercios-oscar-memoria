/**
 * dateUtils.js — Utilidades de fecha compartidas por toda la app.
 *
 * getDateKey(): clave interna ESTABLE, sin idioma (formato AAAA-MM-DD),
 * usada para guardar y agrupar datos por día (recordatorios, ánimo,
 * sesiones, salud...). Nunca debe mostrarse tal cual al usuario — para
 * eso están formatDateEs() y compañía.
 *
 * Antes se usaba `Date.prototype.toDateString()` como clave, pero ese
 * método siempre devuelve el texto en INGLÉS ("Wed Aug 19 2026"),
 * independientemente del idioma del dispositivo — de ahí que las fechas
 * guardadas aparecieran en inglés en Salud y Estadísticas. Con la nueva
 * clave (solo números, sin idioma) ese problema desaparece de raíz, y de
 * paso las fechas ordenan correctamente en las listas (con el formato
 * antiguo, "Wed" ordenaba antes que "Thu" alfabéticamente, no por fecha
 * real).
 */

export function getDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseAnyDate(value) {
  if (value instanceof Date) return value;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  // Compatibilidad con datos guardados antes de este cambio (formato
  // inglés de toDateString(), que sigue siendo interpretable por Date()).
  return new Date(value);
}

/** Fecha completa en español: "miércoles, 19 de agosto de 2026". */
export function formatDateEs(dateKeyOrDate) {
  return parseAnyDate(dateKeyOrDate).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Fecha media en español, sin día de la semana: "19 de agosto de 2026". */
export function formatDateMediumEs(dateKeyOrDate) {
  return parseAnyDate(dateKeyOrDate).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Fecha corta en español, para gráficas: "19 ago". */
export function formatDateShortEs(dateKeyOrDate) {
  return parseAnyDate(dateKeyOrDate).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}
