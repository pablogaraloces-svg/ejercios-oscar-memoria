/**
 * version.js — Número de versión de la aplicación, visible debajo del
 * crédito de autoría en la pantalla de inicio y en la portada.
 *
 * Esquema de numeración: los cambios pequeños/puntuales suman un decimal
 * (11.1, 11.2, 11.3...) sobre la versión mayor actual (11), en vez de
 * subir el número entero cada vez. Cuando se acumule una actualización
 * grande o un rediseño importante, se pasa a la siguiente versión mayor
 * (12.0) y se reinicia el decimal. Así hay margen para muchos cambios
 * pequeños sin que el número crezca demasiado rápido.
 *
 * Debe mantenerse siempre coherente con CACHE_VERSION en
 * service-worker.js (mismo número, para que ambos avancen juntos).
 */
export const APP_VERSION = "11.1";
