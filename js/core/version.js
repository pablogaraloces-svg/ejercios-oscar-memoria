/**
 * version.js — Número de versión de la aplicación, visible debajo del
 * crédito de autoría en la pantalla de inicio.
 *
 * Se incrementa correlativamente cada vez que se publica una actualización
 * (debe mantenerse en el mismo número que CACHE_VERSION en
 * service-worker.js, para que ambos avancen siempre juntos). Así, con solo
 * mirar la pantalla de inicio, se sabe exactamente qué versión hay
 * instalada en la tablet.
 */
export const APP_VERSION = "9";
