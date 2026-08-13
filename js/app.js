import { DB } from "./core/db.js";
import { DEFAULT_SETTINGS } from "./core/state.js";
import { Voice } from "./core/voice.js";
import { Music } from "./core/music.js";
import { Mascot } from "./core/mascot.js";
import { renderOnboarding } from "./screens/onboarding.js";
import { SessionRunner } from "./screens/session.js";
import { renderSettings } from "./screens/settingsScreen.js";
import { renderFamily, openAddFamilyModal, openEditFamilyModal } from "./screens/familyScreen.js";
import { renderReports } from "./screens/reportsScreen.js";
import { getGreeting } from "./core/phrases.js";

const screens = {};
document.querySelectorAll(".screen").forEach((el) => (screens[el.id] = el));

function showScreen(id) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[id].classList.add("active");
}

const ctx = { profile: null, settings: null };

function applySettings(settings) {
  document.body.classList.toggle("high-contrast", !!settings.highContrast);
  document.body.classList.toggle("reduce-motion", !!settings.reduceMotion);
  document.body.classList.remove("text-lg", "text-xl");
  if (settings.textSize && settings.textSize !== "base") {
    document.body.classList.add(`text-${settings.textSize}`);
  }
  Voice.setEnabled(!!settings.voiceEnabled);
  if (settings.voiceURI) Voice.setVoiceURI(settings.voiceURI);
}

// El audio en el navegador requiere un primer gesto del usuario:
// arrancamos la música de fondo en cuanto toque la pantalla por primera vez.
let musicPrimed = false;
function primeMusicOnFirstTouch() {
  if (musicPrimed) return;
  musicPrimed = true;
  if (ctx.settings?.musicEnabled) Music.start(ctx.settings.musicVolume ?? 0.35);
  document.removeEventListener("pointerdown", primeMusicOnFirstTouch);
}
document.addEventListener("pointerdown", primeMusicOnFirstTouch);

async function boot() {
  // Registrar service worker para uso 100% offline
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }

  const profiles = await DB.getAll("profile");
  let settings = await DB.get("settings", "global");
  if (!settings) {
    settings = { ...DEFAULT_SETTINGS };
    await DB.put("settings", settings);
  }
  ctx.settings = settings;
  applySettings(settings);

  if (profiles.length === 0) {
    showScreen("screen-onboarding");
    renderOnboarding(document.getElementById("onboarding-root"), (profile, newSettings) => {
      ctx.profile = profile;
      ctx.settings = newSettings;
      applySettings(newSettings);
      goHome();
    });
  } else {
    ctx.profile = profiles[0];
    goHome();
  }
}

function goHome() {
  document.getElementById("home-greeting").textContent = getGreeting(ctx.profile.name);
  document.getElementById("home-date").textContent = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  showScreen("screen-home");
}

/* ---------------- Sesión diaria ---------------- */
let sessionRunner = null;

document.getElementById("btn-start-session").addEventListener("click", () => {
  showScreen("screen-session");
  const mascotEl = document.getElementById("session-mascot");
  const bubbleEl = document.getElementById("session-bubble");
  const mascot = new Mascot(mascotEl, bubbleEl);
  mascotEl.style.display = ctx.settings.mascotEnabled ? "flex" : "none";

  sessionRunner = new SessionRunner({
    contentEl: document.getElementById("session-content"),
    mascot,
    bubbleEl,
    progressFillEl: document.getElementById("session-progress"),
    stepLabelEl: document.getElementById("session-step-label"),
    profile: ctx.profile,
    settings: ctx.settings,
  });
  sessionRunner.start(() => goHome());
});

document.getElementById("btn-session-back").addEventListener("click", () => {
  goHome();
});

/* ---------------- Informes ---------------- */
document.getElementById("btn-open-reports").addEventListener("click", async () => {
  showScreen("screen-reports");
  await renderReports(document.getElementById("reports-root"), ctx);
});
document.getElementById("btn-reports-back").addEventListener("click", goHome);

/* ---------------- Familia ---------------- */
function refreshFamilyScreen() {
  renderFamily(document.getElementById("family-root"), ctx, openEditModal);
}
function openEditModal(index) {
  const modal = document.getElementById("generic-modal");
  const box = document.getElementById("generic-modal-box");
  openEditFamilyModal(box, ctx, index, (updatedProfile) => {
    modal.classList.remove("active");
    if (updatedProfile) {
      ctx.profile = updatedProfile;
      refreshFamilyScreen();
    }
  });
  modal.classList.add("active");
}
document.getElementById("btn-open-family").addEventListener("click", () => {
  showScreen("screen-family");
  refreshFamilyScreen();
});
document.getElementById("btn-family-back").addEventListener("click", goHome);
document.getElementById("btn-add-family").addEventListener("click", () => {
  const modal = document.getElementById("generic-modal");
  const box = document.getElementById("generic-modal-box");
  openAddFamilyModal(box, ctx, (updatedProfile) => {
    modal.classList.remove("active");
    if (updatedProfile) {
      ctx.profile = updatedProfile;
      refreshFamilyScreen();
    }
  });
  modal.classList.add("active");
});

/* ---------------- Ajustes ---------------- */
document.getElementById("btn-open-settings").addEventListener("click", () => {
  showScreen("screen-settings");
  renderSettings(document.getElementById("settings-tabs"), document.getElementById("settings-root"), {
    profile: ctx.profile,
    settings: ctx.settings,
    onProfileUpdated: (p) => {
      ctx.profile = p;
      document.getElementById("home-greeting").textContent = getGreeting(ctx.profile.name);
    },
  });
});
document.getElementById("btn-settings-back").addEventListener("click", goHome);

/* ---------------- Salir con confirmación ---------------- */
document.getElementById("btn-exit").addEventListener("click", () => {
  document.getElementById("exit-modal").classList.add("active");
});
document.getElementById("btn-exit-cancel").addEventListener("click", () => {
  document.getElementById("exit-modal").classList.remove("active");
});
document.getElementById("btn-exit-confirm").addEventListener("click", () => {
  document.getElementById("exit-modal").classList.remove("active");
  // Progreso ya guardado automáticamente en IndexedDB en cada paso.
  // Intentamos cerrar; si el navegador no lo permite (PWA instalada sí lo permite), mostramos aviso.
  window.close();
  setTimeout(() => {
    const box = document.getElementById("generic-modal-box");
    box.innerHTML = `<div style="font-size:3rem;">💛</div>
      <h2 class="title-lg">Ya puedes cerrar la aplicación</h2>
      <p class="text-base" style="margin:14px 0 22px;">Todo tu progreso está guardado. ¡Hasta la próxima!</p>
      <button class="btn btn-success btn-huge" id="ok-close-info">Vale</button>`;
    document.getElementById("generic-modal").classList.add("active");
    box.querySelector("#ok-close-info").onclick = () => {
      document.getElementById("generic-modal").classList.remove("active");
    };
  }, 400);
});

boot();
