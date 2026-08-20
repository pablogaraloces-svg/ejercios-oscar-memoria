/**
 * version.js — Número de versión de la aplicación, visible debajo del
 * crédito de autoría en la pantalla de inicio y en la portada.
 *
 * A partir de aquí se reinicia el contador: todo lo anterior (v2-v11)
 * fueron cambios técnicos de puesta a punto; esta es la primera versión
 * que se considera "la app ya funcional de verdad", así que empezamos a
 * contar de nuevo desde la 1.1.
 *
 * Esquema de numeración: los cambios puntuales suman un decimal (1.1,
 * 1.2, 1.3...) sobre la versión mayor actual (1), en vez de subir el
 * número entero cada vez. Cuando se acumule una actualización realmente
 * grande o un rediseño importante, se pasa a la siguiente versión mayor
 * (2.0) y se reinicia el decimal. Así hay margen para muchos cambios
 * pequeños sin que el número crezca demasiado rápido.
 *
 * Debe mantenerse siempre coherente con CACHE_VERSION en
 * service-worker.js (mismo número, para que ambos avancen juntos).
 */
export const APP_VERSION = "1.3";
