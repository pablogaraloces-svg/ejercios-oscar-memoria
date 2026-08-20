import { DB, uid } from "../core/db.js";
import { DEFAULT_REMINDER_CATALOG, DEFAULT_SETTINGS } from "../core/state.js";
import { seedDefaultReminders } from "../core/reminders.js";
import { ALL_CATEGORIES, CATEGORY_LABELS } from "../exercises/index.js";

export function renderOnboarding(root, onComplete) {
  const data = {
    name: "",
    reminderKeys: ["medicacion", "agua"],
    categories: [...ALL_CATEGORIES.filter((c) => !["fotos", "herramientas", "intruso", "compra"].includes(c))],
    textSize: "base",
    adminPin: "1234",
  };
  let step = 0;

  const steps = [stepWelcome, stepName, stepReminders, stepExercises, stepAccessibility, stepAdminPin, stepDone];

  function renderStep() {
    root.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "col grow fade-in";
    wrap.style.maxWidth = "760px";
    wrap.style.margin = "0 auto";
    wrap.style.width = "100%";
    steps[step](wrap);
    root.appendChild(wrap);
  }

  function goNext() {
    if (step < steps.length - 1) step++;
    renderStep();
  }
  function goBack() {
    if (step > 0) step--;
    renderStep();
  }

  function navButtons(container, { nextLabel = "Continuar", nextDisabled = false, onNext } = {}) {
    const row = document.createElement("div");
    row.className = "row spread";
    row.style.marginTop = "32px";
    if (step > 0) {
      const back = document.createElement("button");
      back.className = "btn btn-ghost";
      back.textContent = "← Atrás";
      back.onclick = goBack;
      row.appendChild(back);
    } else {
      row.appendChild(document.createElement("div"));
    }
    const next = document.createElement("button");
    next.className = "btn btn-success btn-huge";
    next.textContent = nextLabel;
    next.disabled = nextDisabled;
    next.onclick = () => {
      if (onNext) onNext();
      goNext();
    };
    row.appendChild(next);
    container.appendChild(row);
  }

  function stepWelcome(c) {
    c.innerHTML = `
      <div class="col center grow">
        <img src="assets/mascot/cerebrin.png" alt="Cerebrín" style="width:110px; height:auto; margin:0 auto;" />
        <h1 class="title-huge" style="text-align:center;">¡Hola! Vamos a preparar tu espacio</h1>
        <p class="text-base" style="text-align:center; max-width:560px;">
          Solo te voy a pedir un par de cosas muy sencillas. Tranquilo/a, no hay prisa.
        </p>
      </div>`;
    navButtons(c, { nextLabel: "Empezar" });
  }

  function stepName(c) {
    c.innerHTML = `<h2 class="title-lg">¿Cómo te llamas?</h2>
      <p class="text-md">Así podré saludarte cada día por tu nombre.</p>
      <div class="field" style="margin-top:24px;">
        <input type="text" id="ob-name" placeholder="Escribe tu nombre" value="${data.name}" style="font-size:2rem; text-align:center;" />
      </div>`;
    const input = c.querySelector("#ob-name");
    input.addEventListener("input", () => (data.name = input.value.trim()));
    navButtons(c, {
      onNext: () => {},
    });
    setTimeout(() => input.focus(), 300);
  }

  function stepReminders(c) {
    c.innerHTML = `<h2 class="title-lg">¿Qué te gustaría recordar cada día?</h2>
      <p class="text-md">Aparecerá amablemente durante el ratito diario. Puedes cambiarlo cuando quieras.</p>`;
    const grid = document.createElement("div");
    grid.className = "grid-options cols-3";
    grid.style.marginTop = "20px";
    DEFAULT_REMINDER_CATALOG.forEach((item) => {
      const btn = document.createElement("button");
      btn.className = "option-card";
      btn.innerHTML = `<span class="emoji">${item.emoji}</span><span>${item.label}</span>`;
      if (data.reminderKeys.includes(item.key)) btn.style.borderColor = "var(--color-success)";
      btn.onclick = () => {
        if (data.reminderKeys.includes(item.key)) {
          data.reminderKeys = data.reminderKeys.filter((k) => k !== item.key);
          btn.style.borderColor = "";
        } else {
          data.reminderKeys.push(item.key);
          btn.style.borderColor = "var(--color-success)";
        }
      };
      grid.appendChild(btn);
    });
    c.appendChild(grid);
    navButtons(c);
  }

  function stepExercises(c) {
    c.innerHTML = `<h2 class="title-lg">¿Qué tipo de ejercicios prefieres?</h2>
      <p class="text-md">Puedes elegir varios. Iremos variando para que no se haga repetitivo. (El reconocimiento de fotos familiares, el puzle de herramientas, "El intruso" y "La compra" se incluyen siempre, sin necesidad de elegirlos aquí.)</p>`;
    const grid = document.createElement("div");
    grid.className = "grid-options cols-3";
    grid.style.marginTop = "20px";
    ALL_CATEGORIES.filter((cat) => !["fotos", "herramientas", "intruso", "compra"].includes(cat)).forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "option-card";
      const emojiMap = { memoria: "🧠", atencion: "👀", calculo: "➕", colores: "🎨", animales: "🐾", diferencias: "🔍" };
      btn.innerHTML = `<span class="emoji">${emojiMap[cat]}</span><span>${CATEGORY_LABELS[cat]}</span>`;
      btn.style.borderColor = data.categories.includes(cat) ? "var(--color-success)" : "";
      btn.onclick = () => {
        if (data.categories.includes(cat)) {
          data.categories = data.categories.filter((k) => k !== cat);
        } else {
          data.categories.push(cat);
        }
        btn.style.borderColor = data.categories.includes(cat) ? "var(--color-success)" : "";
      };
      grid.appendChild(btn);
    });
    c.appendChild(grid);
    navButtons(c, { nextDisabled: false });
  }

  function stepAccessibility(c) {
    c.innerHTML = `<h2 class="title-lg">Un último detalle</h2>
      <p class="text-md">¿Prefieres el texto más grande?</p>`;
    const grid = document.createElement("div");
    grid.className = "grid-options cols-3";
    grid.style.marginTop = "20px";
    [
      { key: "base", label: "Normal" },
      { key: "lg", label: "Grande" },
      { key: "xl", label: "Muy grande" },
    ].forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "option-card";
      btn.textContent = opt.label;
      btn.style.borderColor = data.textSize === opt.key ? "var(--color-success)" : "";
      btn.onclick = () => {
        data.textSize = opt.key;
        [...grid.children].forEach((b) => (b.style.borderColor = ""));
        btn.style.borderColor = "var(--color-success)";
      };
      grid.appendChild(btn);
    });
    c.appendChild(grid);
    navButtons(c);
  }

  function stepAdminPin(c) {
    c.innerHTML = `<h2 class="title-lg">Un PIN solo para la familia</h2>
      <p class="text-md">Con este PIN se podrá entrar en Ajustes, Estadísticas y editar la familia, sin que ${data.name || "él/ella"} tenga que ver esos botones. Se puede cambiar luego desde Administración.</p>
      <div class="field" style="margin-top:20px; max-width:260px;">
        <label for="ob-pin">PIN (4-6 dígitos)</label>
        <input type="text" id="ob-pin" inputmode="numeric" maxlength="6" value="${data.adminPin}" style="font-size:1.6rem; text-align:center; letter-spacing:6px;" />
      </div>`;
    const input = c.querySelector("#ob-pin");
    input.addEventListener("input", () => {
      data.adminPin = input.value.trim() || "1234";
    });
    navButtons(c);
  }

  function stepDone(c) {
    c.innerHTML = `<div class="col center grow">
        <div style="font-size:5rem;">🎉</div>
        <h1 class="title-xl" style="text-align:center;">¡Todo listo, ${data.name || ""}!</h1>
        <p class="text-base" style="text-align:center;">Ya podemos empezar a pasar ratitos juntos.</p>
      </div>`;
    const row = document.createElement("div");
    row.className = "row center";
    row.style.marginTop = "24px";
    const finishBtn = document.createElement("button");
    finishBtn.className = "btn btn-success btn-huge";
    finishBtn.textContent = "Ir al inicio";
    finishBtn.onclick = async () => {
      const profile = {
        id: uid("profile"),
        name: data.name || "Amigo/a",
        age: null,
        weight: null,
        height: null,
        photo: null,
        notes: "",
        medications: { morning: [], noon: [], night: [] },
        family: [],
        enabledCategories: data.categories.length ? data.categories : [...ALL_CATEGORIES],
        createdAt: Date.now(),
      };
      await DB.put("profile", profile);
      await seedDefaultReminders(profile.id, data.reminderKeys);
      const settings = {
        ...DEFAULT_SETTINGS,
        textSize: data.textSize,
        adminPin: data.adminPin || "1234",
        activeProfileId: profile.id,
      };
      await DB.put("settings", settings);
      onComplete(profile, settings);
    };
    row.appendChild(finishBtn);
    c.appendChild(row);
  }

  renderStep();
}
