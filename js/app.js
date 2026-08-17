import { DB } from "./core/db.js";
import { DEFAULT_SETTINGS } from "./core/state.js";
import { Voice } from "./core/voice.js";
import { Music } from "./core/music.js";
import { Mascot } from "./core/mascot.js";
import { renderOnboarding } from "./screens/onboarding.js";
import { SessionRunner } from "./screens/session.js";
import { renderSettings } from "./screens/settingsScreen.js";
import { renderFamily, openAddFamilyModal, openEditFamilyModal } from "./screens/familyScreen.js";
import { renderReports, exportReportPdf } from "./screens/reportsScreen.js";
import { getGreeting } from "./core/phrases.js";

const screens = {};
document.querySelectorAll(".screen").forEach((el) => (screens[el.id] = el));

function showScreen(id) {
  Object.values(screens).forEach((el) => el.classList.remove("active"));
  screens[id].classList.add("active");
}

const ctx = { profile: null, settings: null };
let familyEditable = false; // false = vista de Óscar (solo ver), true = Administración

function applySettings(settings) {
  document.body.classList.toggle("high-contrast", !!settings.highContrast);
  document.body.classList.toggle("reduce-motion", !!settings.reduceMotion);
  document.body.classList.remove("text-lg", "text-xl");
  if (settings.textSize && settings.textSize !== "base") {
    document.body.classList.add(`text-${settings.textSize}`);
  }
  Voice.setEnabled(!!settings.voiceEnabled);
  if (settings.voiceURI) Voice.setVoiceURI(settings.voiceURI);
  Voice.setRate(settings.voiceRate ?? 0.92);
  Voice.setPitch(settings.voicePitch ?? 1.0);
}

// El audio en el navegador requiere un primer gesto del usuario:
// arrancamos la música de fondo en cuanto toque la pantalla por primera vez.
let musicPrimed = false;
function primeMusicOnFirstTouch() {
  if (musicPrimed) return;
  musicPrimed = true;
  if (ctx.settings?.musicEnabled) Music.start(ctx.settings.musicVolume ?? 0.35, ctx.settings.musicTrack ?? 0);
  document.removeEventListener("pointerdown", primeMusicOnFirstTouch);
}
document.addEventListener("pointerdown", primeMusicOnFirstTouch);

async function boot() {
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

// Las instancias de mascota se crean UNA sola vez (no en cada sesión) para
// no acumular listeners de "toque" duplicados sobre el mismo elemento.
const homeMascot = new Mascot(document.getElementById("home-mascot"), null);
const sessionMascot = new Mascot(document.getElementById("session-mascot"), document.getElementById("session-bubble"));

function goHome() {
  document.getElementById("home-greeting").textContent = getGreeting(ctx.profile.name);
  document.getElementById("home-date").textContent = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  homeMascot.setName(ctx.profile.name);
  showScreen("screen-home");
}

/* ---------------- Sesión diaria ---------------- */
let sessionRunner = null;

document.getElementById("btn-start-session").addEventListener("click", () => {
  showScreen("screen-session");
  const mascotEl = document.getElementById("session-mascot");
  const bubbleEl = document.getElementById("session-bubble");
  sessionMascot.setName(ctx.profile.name);
  mascotEl.style.display = ctx.settings.mascotEnabled ? "flex" : "none";

  sessionRunner = new SessionRunner({
    contentEl: document.getElementById("session-content"),
    mascot: sessionMascot,
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

/* ---------------- Familia (Óscar: solo ver / Administración: editable) ---------------- */
function refreshFamilyScreen() {
  const familyTitleEl = document.getElementById("family-title");
  familyTitleEl.textContent = familyEditable ? "Editar familia" : "Mi familia";
  familyTitleEl.classList.toggle("title-admin", familyEditable);
  document.getElementById("btn-add-family").classList.toggle("hidden", !familyEditable);
  renderFamily(document.getElementById("family-root"), ctx, openEditModal, familyEditable);
}
function openEditModal(index) {
  if (!familyEditable) return;
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
  familyEditable = false;
  showScreen("screen-family");
  refreshFamilyScreen();
});
document.getElementById("btn-family-back").addEventListener("click", () => {
  if (familyEditable) showScreen("screen-admin-menu");
  else goHome();
});
document.getElementById("btn-add-family").addEventListener("click", () => {
  if (!familyEditable) return;
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

/* ---------------- Ajustes (solo desde Administración) ---------------- */
function openSettingsScreen() {
  showScreen("screen-settings");
  renderSettings(document.getElementById("settings-tabs"), document.getElementById("settings-root"), {
    profile: ctx.profile,
    settings: ctx.settings,
    onProfileUpdated: (p) => {
      ctx.profile = p;
    },
  });
}
document.getElementById("btn-settings-back").addEventListener("click", () => showScreen("screen-admin-menu"));

/* ---------------- Estadísticas (solo desde Administración) ---------------- */
document.getElementById("btn-reports-back").addEventListener("click", () => showScreen("screen-admin-menu"));
document.getElementById("btn-send-report").addEventListener("click", async () => {
  const btn = document.getElementById("btn-send-report");
  const original = btn.textContent;
  btn.textContent = "Generando…";
  btn.disabled = true;
  try {
    const result = await exportReportPdf(ctx);
    if (result.status === "shared") btn.textContent = "✔️ Compartido";
    else if (result.status === "downloaded") btn.textContent = "✔️ Descargado";
    else btn.textContent = original;
  } catch (err) {
    console.error("No se pudo generar el PDF:", err);
    btn.textContent = "Error, prueba de nuevo";
  }
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 2400);
});

/* ---------------- Administración: acceso con PIN ---------------- */
function openAdminPinModal() {
  const modal = document.getElementById("generic-modal");
  const box = document.getElementById("generic-modal-box");
  let failedAttempts = 0;

  function renderPinStep() {
    box.innerHTML = `
      <div style="font-size:2.4rem;">🔐</div>
      <h2 class="title-lg">Acceso de administración</h2>
      <p class="text-base" style="margin:10px 0 18px;">Introduce el PIN para entrar en Ajustes, Estadísticas o editar la familia.</p>
      <input type="password" id="admin-pin-input" inputmode="numeric" maxlength="6"
        style="min-height:64px; width:100%; text-align:center; letter-spacing:8px; font-size:1.6rem; border-radius:16px; border:3px solid var(--color-border); background:var(--color-bg-soft); color:var(--color-text);" />
      <p class="text-sm" id="admin-pin-error" style="color:var(--color-warm); margin-top:8px; min-height:1.2em;"></p>
      <div class="row center" style="gap:16px; margin-top:16px;">
        <button class="btn btn-ghost" id="admin-pin-cancel">Cancelar</button>
        <button class="btn btn-success" id="admin-pin-ok">Entrar</button>
      </div>
      <button class="btn btn-ghost hidden" id="admin-pin-forgot" style="margin-top:14px; font-size:var(--font-sm);">¿Has olvidado el PIN?</button>
    `;
    const input = box.querySelector("#admin-pin-input");
    const errorEl = box.querySelector("#admin-pin-error");
    const forgotBtn = box.querySelector("#admin-pin-forgot");
    setTimeout(() => input.focus(), 200);

    const tryEnter = () => {
      const expected = ctx.settings.adminPin || "1234";
      if (input.value === expected) {
        modal.classList.remove("active");
        showScreen("screen-admin-menu");
      } else {
        failedAttempts++;
        input.value = "";
        input.focus();
        if (failedAttempts >= 5) {
          errorEl.textContent = "Varios intentos fallidos.";
          forgotBtn.classList.remove("hidden");
        } else {
          errorEl.textContent = "PIN incorrecto, inténtalo de nuevo.";
        }
      }
    };

    box.querySelector("#admin-pin-ok").onclick = tryEnter;
    box.querySelector("#admin-pin-cancel").onclick = () => modal.classList.remove("active");
    forgotBtn.onclick = renderRecoveryStep;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") tryEnter();
    });
  }

  function renderRecoveryStep() {
    const question = ctx.settings.securityQuestion;
    if (!question) {
      box.innerHTML = `
        <div style="font-size:2.4rem;">💛</div>
        <h2 class="title-lg">No hay pregunta de recuperación configurada</h2>
        <p class="text-base" style="margin:12px 0 20px;">Todavía no se ha creado ninguna pregunta para este caso. Como la aplicación no usa internet ni servidores, no hay otra forma de recuperar el PIN — habría que preguntar a quien lo configuró, o borrar los datos de la app desde los ajustes de Android (esto también borraría el progreso guardado).</p>
        <div class="row center">
          <button class="btn btn-success" id="recovery-back">Volver</button>
        </div>
      `;
      box.querySelector("#recovery-back").onclick = renderPinStep;
      return;
    }

    box.innerHTML = `
      <div style="font-size:2.4rem;">🔑</div>
      <h2 class="title-lg">Pregunta de recuperación</h2>
      <p class="text-base" style="margin:10px 0 14px;">${question}</p>
      <input type="text" id="recovery-answer-input"
        style="min-height:64px; width:100%; text-align:center; font-size:1.3rem; border-radius:16px; border:3px solid var(--color-border); background:var(--color-bg-soft); color:var(--color-text);" />
      <p class="text-sm" id="recovery-error" style="color:var(--color-warm); margin-top:8px; min-height:1.2em;"></p>
      <div class="row center" style="gap:16px; margin-top:16px;">
        <button class="btn btn-ghost" id="recovery-cancel">Cancelar</button>
        <button class="btn btn-success" id="recovery-ok">Comprobar</button>
      </div>
    `;
    const answerInput = box.querySelector("#recovery-answer-input");
    const errorEl = box.querySelector("#recovery-error");
    setTimeout(() => answerInput.focus(), 200);

    box.querySelector("#recovery-cancel").onclick = () => modal.classList.remove("active");
    box.querySelector("#recovery-ok").onclick = () => {
      const expected = (ctx.settings.securityAnswer || "").trim().toLowerCase();
      const given = answerInput.value.trim().toLowerCase();
      if (expected && given === expected) {
        renderNewPinStep();
      } else {
        errorEl.textContent = "Respuesta incorrecta, inténtalo de nuevo.";
        answerInput.value = "";
        answerInput.focus();
      }
    };
  }

  function renderNewPinStep() {
    box.innerHTML = `
      <div style="font-size:2.4rem;">✔️</div>
      <h2 class="title-lg">Elige un nuevo PIN</h2>
      <p class="text-base" style="margin:10px 0 14px;">Respuesta correcta. Ahora puedes crear un PIN nuevo.</p>
      <input type="text" id="new-pin-input" inputmode="numeric" maxlength="6"
        style="min-height:64px; width:100%; text-align:center; letter-spacing:8px; font-size:1.6rem; border-radius:16px; border:3px solid var(--color-border); background:var(--color-bg-soft); color:var(--color-text);" />
      <div class="row center" style="gap:16px; margin-top:16px;">
        <button class="btn btn-success" id="new-pin-save">Guardar y entrar</button>
      </div>
    `;
    const newPinInput = box.querySelector("#new-pin-input");
    setTimeout(() => newPinInput.focus(), 200);
    box.querySelector("#new-pin-save").onclick = async () => {
      const val = newPinInput.value.trim();
      if (!val) return;
      ctx.settings.adminPin = val;
      await DB.put("settings", ctx.settings);
      modal.classList.remove("active");
      showScreen("screen-admin-menu");
    };
  }

  renderPinStep();
  modal.classList.add("active");
}
document.getElementById("btn-admin").addEventListener("click", openAdminPinModal);
document.getElementById("btn-admin-back").addEventListener("click", goHome);

document.getElementById("btn-admin-settings").addEventListener("click", openSettingsScreen);
document.getElementById("btn-admin-reports").addEventListener("click", async () => {
  showScreen("screen-reports");
  await renderReports(document.getElementById("reports-root"), ctx);
});
document.getElementById("btn-admin-family").addEventListener("click", () => {
  familyEditable = true;
  showScreen("screen-family");
  refreshFamilyScreen();
});

/* ---------------- Salir con confirmación ---------------- */
document.getElementById("btn-exit").addEventListener("click", () => {
  document.getElementById("exit-modal").classList.add("active");
});
document.getElementById("btn-exit-cancel").addEventListener("click", () => {
  document.getElementById("exit-modal").classList.remove("active");
});
document.getElementById("btn-exit-confirm").addEventListener("click", () => {
  document.getElementById("exit-modal").classList.remove("active");
  window.close();
  setTimeout(() => {
    const box = document.getElementById("generic-modal-box");
    box.innerHTML = `<div style="font-size:2.6rem;">💛</div>
      <h2 class="title-lg">Ya puedes cerrar la aplicación</h2>
      <p class="text-base" style="margin:12px 0 20px;">Todo tu progreso está guardado. ¡Hasta la próxima!</p>
      <button class="btn btn-success btn-huge" id="ok-close-info">Vale</button>`;
    document.getElementById("generic-modal").classList.add("active");
    box.querySelector("#ok-close-info").onclick = () => {
      document.getElementById("generic-modal").classList.remove("active");
    };
  }, 400);
});

boot();
