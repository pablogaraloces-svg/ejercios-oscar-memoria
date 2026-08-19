/**
 * service-worker.js — Cache-first para uso 100% offline.
 * Sube CACHE_VERSION cuando se publiquen cambios para forzar actualización.
 * Debe coincidir siempre con APP_VERSION (js/core/version.js): cambios
 * pequeños suman un decimal (v11.1, v11.2...), los grandes pasan a la
 * siguiente versión mayor (v12).
 */
const CACHE_VERSION = "acompanante-v11.1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",
  "./js/app.js",
  "./js/core/db.js",
  "./js/core/state.js",
  "./js/core/phrases.js",
  "./js/core/voice.js",
  "./js/core/music.js",
  "./js/core/sounds.js",
  "./js/core/pdfExport.js",
  "./js/core/health.js",
  "./js/core/weather.js",
  "./js/core/version.js",
  "./js/core/mascot.js",
  "./js/core/adaptiveDifficulty.js",
  "./js/core/hints.js",
  "./js/core/reminders.js",
  "./js/core/reports.js",
  "./js/core/confetti.js",
  "./js/exercises/data.js",
  "./js/exercises/memory.js",
  "./js/exercises/attention.js",
  "./js/exercises/calculation.js",
  "./js/exercises/colors.js",
  "./js/exercises/animals.js",
  "./js/exercises/familyPhotos.js",
  "./js/exercises/spotDifference.js",
  "./js/exercises/puzzleTools.js",
  "./js/exercises/intruso.js",
  "./js/exercises/compra.js",
  "./js/exercises/toolIcons.js",
  "./js/core/familyPhrase.js",
  "./js/exercises/index.js",
  "./js/screens/onboarding.js",
  "./js/screens/session.js",
  "./js/screens/settingsScreen.js",
  "./js/screens/familyScreen.js",
  "./js/screens/reportsScreen.js",
  "./js/screens/healthScreen.js",
  "./assets/icons/icon-72.png",
  "./assets/icons/icon-96.png",
  "./assets/icons/icon-128.png",
  "./assets/icons/icon-144.png",
  "./assets/icons/icon-152.png",
  "./assets/icons/icon-180.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-384.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-192.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/mascot/cerebrin.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // El documento HTML principal (la "carcasa" de la app, incluida la
  // pantalla de inicio de Cerebrín) se sirve SIEMPRE con estrategia
  // "red primero": así, en cuanto hay conexión, se ve de inmediato la
  // versión más reciente en vez de una copia cacheada antigua — que es
  // justo lo que causaba que a veces se viera brevemente una pantalla de
  // precarga de una versión anterior antes de que el nuevo Service Worker
  // tomara el control. Si no hay red, se cae automáticamente al caché
  // (offline sigue funcionando igual que antes).
  const isDocumentRequest =
    event.request.mode === "navigate" || event.request.url.endsWith("/index.html") || event.request.url.endsWith("/");

  if (isDocumentRequest) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  // Todo lo demás (JS, CSS, imágenes...) sigue con caché primero, para un
  // arranque instantáneo y funcionamiento 100% offline.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
