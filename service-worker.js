/**
 * service-worker.js — Cache-first para uso 100% offline.
 * Sube CACHE_VERSION cuando se publiquen cambios para forzar actualización.
 */
const CACHE_VERSION = "acompanante-v5";
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
