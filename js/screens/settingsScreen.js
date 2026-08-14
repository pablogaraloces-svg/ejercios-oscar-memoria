import { DB } from "../core/db.js";
import { DEFAULT_REMINDER_CATALOG } from "../core/state.js";
import { getReminders, addReminder, removeReminder, setReminderEnabled } from "../core/reminders.js";
import { Voice } from "../core/voice.js";
import { Music, TRACKS } from "../core/music.js";

const TABS = [
  { key: "perfil", label: "👤 Perfil" },
  { key: "recordatorios", label: "✅ Recordatorios" },
  { key: "voz", label: "🔊 Voz y música" },
  { key: "accesibilidad", label: "🔎 Accesibilidad" },
];

export async function renderSettings(tabsEl, rootEl, ctx) {
  let activeTab = "perfil";

  function renderTabs() {
    tabsEl.innerHTML = "";
    TABS.forEach((t) => {
      const b = document.createElement("button");
      b.className = "btn " + (t.key === activeTab ? "btn-success" : "btn-ghost");
      b.textContent = t.label;
      b.onclick = () => {
        activeTab = t.key;
        renderTabs();
        renderBody();
      };
      tabsEl.appendChild(b);
    });
  }

  async function renderBody() {
    rootEl.innerHTML = "";
    if (activeTab === "perfil") await renderProfileTab();
    else if (activeTab === "recordatorios") await renderRemindersTab();
    else if (activeTab === "voz") await renderVoiceTab();
    else await renderAccessibilityTab();
  }

  async function renderProfileTab() {
    const p = ctx.profile;
    const s = ctx.settings;
    const card = document.createElement("div");
    card.className = "card col";
    card.style.maxWidth = "640px";
    card.innerHTML = `
      <div class="field">
        <label for="set-name">Nombre</label>
        <input type="text" id="set-name" value="${p.name || ""}" />
      </div>
      <div class="field">
        <label for="set-age">Edad (opcional)</label>
        <input type="number" id="set-age" value="${p.age ?? ""}" />
      </div>
      <div class="row wrap" style="gap:16px;">
        <div class="field" style="flex:1; min-width:180px;">
          <label for="set-weight">Peso (kg, opcional)</label>
          <input type="number" id="set-weight" value="${p.weight ?? ""}" />
        </div>
        <div class="field" style="flex:1; min-width:180px;">
          <label for="set-height">Altura (cm, opcional)</label>
          <input type="number" id="set-height" value="${p.height ?? ""}" />
        </div>
      </div>
      <div class="field">
        <label for="set-pin">PIN de administración (para entrar en 🔐)</label>
        <input type="text" id="set-pin" inputmode="numeric" maxlength="6" value="${s.adminPin || "1234"}" />
      </div>
    `;
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-success btn-huge";
    saveBtn.style.marginTop = "16px";
    saveBtn.textContent = "Guardar cambios";
    saveBtn.onclick = async () => {
      p.name = card.querySelector("#set-name").value.trim() || p.name;
      const ageVal = card.querySelector("#set-age").value;
      p.age = ageVal ? Number(ageVal) : null;
      const weightVal = card.querySelector("#set-weight").value;
      p.weight = weightVal ? Number(weightVal) : null;
      const heightVal = card.querySelector("#set-height").value;
      p.height = heightVal ? Number(heightVal) : null;
      await DB.put("profile", p);

      const pinVal = card.querySelector("#set-pin").value.trim();
      if (pinVal) s.adminPin = pinVal;
      await DB.put("settings", s);

      ctx.onProfileUpdated?.(p);
      saveBtn.textContent = "¡Guardado! ✔️";
      setTimeout(() => (saveBtn.textContent = "Guardar cambios"), 1600);
    };
    card.appendChild(saveBtn);
    rootEl.appendChild(card);
  }

  async function renderRemindersTab() {
    const wrap = document.createElement("div");
    wrap.className = "col";
    wrap.style.maxWidth = "720px";

    const current = await getReminders(ctx.profile.id);
    const currentKeys = new Set(current.map((r) => r.label));

    const list = document.createElement("div");
    list.className = "col";
    list.style.gap = "12px";
    current.forEach((rem) => {
      const row = document.createElement("div");
      row.className = "switch-row";
      row.innerHTML = `<span class="row" style="gap:12px; font-weight:700; font-size:var(--font-base);">
        <span style="font-size:1.8rem;">${rem.emoji}</span>${rem.label}</span>`;
      const controls = document.createElement("div");
      controls.className = "row";
      const label = document.createElement("label");
      label.className = "switch";
      label.innerHTML = `<input type="checkbox" ${rem.enabled ? "checked" : ""} />
        <span class="track"></span><span class="thumb"></span>`;
      label.querySelector("input").onchange = (e) => setReminderEnabled(rem.id, e.target.checked);
      controls.appendChild(label);
      if (rem.custom) {
        const del = document.createElement("button");
        del.className = "btn btn-ghost btn-icon";
        del.textContent = "🗑️";
        del.onclick = async () => {
          await removeReminder(rem.id);
          renderBody();
        };
        controls.appendChild(del);
      }
      row.appendChild(controls);
      list.appendChild(row);
    });
    wrap.appendChild(list);

    const missing = DEFAULT_REMINDER_CATALOG.filter((c) => !currentKeys.has(c.label));
    if (missing.length) {
      const addTitle = document.createElement("p");
      addTitle.className = "text-md";
      addTitle.style.marginTop = "20px";
      addTitle.textContent = "Añadir más:";
      wrap.appendChild(addTitle);
      const grid = document.createElement("div");
      grid.className = "grid-options cols-3";
      missing.forEach((item) => {
        const b = document.createElement("button");
        b.className = "option-card";
        b.innerHTML = `<span class="emoji">${item.emoji}</span><span>${item.label}</span>`;
        b.onclick = async () => {
          await addReminder(ctx.profile.id, { label: item.label, emoji: item.emoji });
          renderBody();
        };
        grid.appendChild(b);
      });
      wrap.appendChild(grid);
    }

    const customTitle = document.createElement("p");
    customTitle.className = "text-md";
    customTitle.style.marginTop = "20px";
    customTitle.textContent = "Crear un recordatorio propio:";
    wrap.appendChild(customTitle);

    const customRow = document.createElement("div");
    customRow.className = "row";
    customRow.style.marginTop = "10px";
    customRow.innerHTML = `<input type="text" id="custom-rem-input" placeholder="Ej: Echarse crema en brazos y piernas" style="flex:1; min-height:72px; border-radius:16px; border:3px solid var(--color-border); padding:0 16px; font-size:var(--font-base);" />`;
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-accent";
    addBtn.textContent = "➕ Añadir";
    addBtn.onclick = async () => {
      const input = customRow.querySelector("#custom-rem-input");
      if (!input.value.trim()) return;
      await addReminder(ctx.profile.id, { label: input.value.trim(), emoji: "⭐", custom: true });
      renderBody();
    };
    customRow.appendChild(addBtn);
    wrap.appendChild(customRow);

    rootEl.appendChild(wrap);
  }

  function switchRow(label, checked, onChange) {
    const row = document.createElement("div");
    row.className = "switch-row";
    row.innerHTML = `<span class="text-base" style="font-weight:700;">${label}</span>`;
    const sw = document.createElement("label");
    sw.className = "switch";
    sw.innerHTML = `<input type="checkbox" ${checked ? "checked" : ""} /><span class="track"></span><span class="thumb"></span>`;
    sw.querySelector("input").onchange = (e) => onChange(e.target.checked);
    row.appendChild(sw);
    return row;
  }

  async function renderVoiceTab() {
    const s = ctx.settings;
    const wrap = document.createElement("div");
    wrap.className = "col";
    wrap.style.maxWidth = "640px";
    wrap.style.gap = "16px";

    wrap.appendChild(
      switchRow("🔊 Voz que acompaña", s.voiceEnabled, async (v) => {
        s.voiceEnabled = v;
        Voice.setEnabled(v);
        await DB.put("settings", s);
        if (v) Voice.say("Así sonará mi voz durante los ejercicios.");
      })
    );

    const voiceCard = document.createElement("div");
    voiceCard.className = "card col";
    voiceCard.innerHTML = `<p class="text-base" style="font-weight:700;">Elegir voz / asistente de voz</p>
      <p class="text-md">Se muestran todas las voces instaladas en esta tablet (los distintos "asistentes de voz" que tenga el dispositivo), con el español primero.</p>`;
    const select = document.createElement("select");
    select.style.cssText =
      "min-height:56px; border-radius:14px; border:3px solid var(--color-border); padding:0 14px; font-size:var(--font-base); background:var(--color-bg-soft); color:var(--color-text); margin-top:8px;";
    function fillVoices() {
      const voices = Voice.getAvailableVoices();
      select.innerHTML = "";
      if (!voices.length) {
        const opt = document.createElement("option");
        opt.textContent = "No se han encontrado voces en este dispositivo";
        select.appendChild(opt);
        return;
      }
      voices.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v.uri;
        const genderTag = v.gender !== "sin especificar" ? ` · ${v.gender}` : "";
        opt.textContent = `${v.isGoogle ? "🟢 " : ""}${v.name} (${v.lang}${genderTag})`;
        if (v.uri === (s.voiceURI || Voice.getSelectedURI())) opt.selected = true;
        select.appendChild(opt);
      });
    }
    fillVoices();
    Voice.onVoicesReady(fillVoices);
    select.onchange = async () => {
      s.voiceURI = select.value;
      Voice.setVoiceURI(select.value);
      await DB.put("settings", s);
      Voice.setEnabled(true);
      Voice.say("Hola, así sonaré a partir de ahora.");
      Voice.setEnabled(s.voiceEnabled);
    };
    voiceCard.appendChild(select);

    const tryBtn = document.createElement("button");
    tryBtn.className = "btn btn-ghost";
    tryBtn.style.marginTop = "10px";
    tryBtn.textContent = "🔈 Probar esta voz";
    tryBtn.onclick = () => {
      const wasEnabled = Voice.isEnabled();
      Voice.setEnabled(true);
      Voice.say(`Hola ${ctx.profile.name}, encantado de acompañarte hoy.`, {
        onEnd: () => Voice.setEnabled(wasEnabled),
      });
    };
    voiceCard.appendChild(tryBtn);

    const note = document.createElement("p");
    note.className = "text-sm";
    note.style.marginTop = "10px";
    note.style.color = "var(--color-text-soft)";
    note.textContent =
      "Nota: para voces más naturales y humanas, se pueden instalar voces de mayor calidad desde los Ajustes de Android (Ajustes > Sistema > Idiomas y entrada > Síntesis de voz > Motor de Google > Instalar datos de voz). En cuanto se instalen, aparecerán aquí automáticamente para elegir, sin necesitar conexión después de instalarlas.";
    voiceCard.appendChild(note);
    wrap.appendChild(voiceCard);

    // Música de fondo
    const musicCard = document.createElement("div");
    musicCard.className = "card col";
    musicCard.appendChild(
      switchRow("🎵 Música de fondo relajante", s.musicEnabled, async (v) => {
        s.musicEnabled = v;
        await DB.put("settings", s);
        if (v) Music.start(s.musicVolume, s.musicTrack);
        else Music.stop();
      })
    );

    const trackTitle = document.createElement("p");
    trackTitle.className = "text-md";
    trackTitle.style.marginTop = "12px";
    trackTitle.textContent = "Elegir ambiente musical:";
    musicCard.appendChild(trackTitle);

    const trackGrid = document.createElement("div");
    trackGrid.className = "grid-options cols-3";
    TRACKS.forEach((t, idx) => {
      const b = document.createElement("button");
      b.className = "option-card";
      b.style.minHeight = "76px";
      b.innerHTML = `<span>${t.name}</span>`;
      b.style.borderColor = s.musicTrack === idx ? "var(--color-success)" : "";
      b.onclick = async () => {
        s.musicTrack = idx;
        await DB.put("settings", s);
        [...trackGrid.children].forEach((c) => (c.style.borderColor = ""));
        b.style.borderColor = "var(--color-success)";
        if (s.musicEnabled) Music.start(s.musicVolume, idx);
      };
      trackGrid.appendChild(b);
    });
    musicCard.appendChild(trackGrid);

    const volLabel = document.createElement("p");
    volLabel.className = "text-md";
    volLabel.style.marginTop = "12px";
    volLabel.textContent = "Volumen de la música";
    musicCard.appendChild(volLabel);
    const volInput = document.createElement("input");
    volInput.type = "range";
    volInput.min = "0";
    volInput.max = "1";
    volInput.step = "0.05";
    volInput.value = String(s.musicVolume);
    volInput.style.width = "100%";
    volInput.style.height = "48px";
    volInput.oninput = async () => {
      s.musicVolume = Number(volInput.value);
      Music.setVolume(s.musicVolume);
      await DB.put("settings", s);
    };
    musicCard.appendChild(volInput);
    wrap.appendChild(musicCard);

    rootEl.appendChild(wrap);
  }

  async function renderAccessibilityTab() {
    const s = ctx.settings;
    const wrap = document.createElement("div");
    wrap.className = "col";
    wrap.style.maxWidth = "640px";
    wrap.style.gap = "14px";

    wrap.appendChild(
      switchRow("🌗 Alto contraste", s.highContrast, async (v) => {
        s.highContrast = v;
        document.body.classList.toggle("high-contrast", v);
        await DB.put("settings", s);
      })
    );
    wrap.appendChild(
      switchRow("🐢 Reducir animaciones", s.reduceMotion, async (v) => {
        s.reduceMotion = v;
        document.body.classList.toggle("reduce-motion", v);
        await DB.put("settings", s);
      })
    );
    wrap.appendChild(
      switchRow("🐵 Mostrar mascota", s.mascotEnabled, async (v) => {
        s.mascotEnabled = v;
        await DB.put("settings", s);
      })
    );

    const sizeTitle = document.createElement("p");
    sizeTitle.className = "text-md";
    sizeTitle.style.marginTop = "10px";
    sizeTitle.textContent = "Tamaño del texto:";
    wrap.appendChild(sizeTitle);

    const sizeGrid = document.createElement("div");
    sizeGrid.className = "grid-options cols-3";
    [
      { key: "base", label: "Normal" },
      { key: "lg", label: "Grande" },
      { key: "xl", label: "Muy grande" },
    ].forEach((opt) => {
      const b = document.createElement("button");
      b.className = "option-card";
      b.textContent = opt.label;
      b.style.borderColor = s.textSize === opt.key ? "var(--color-success)" : "";
      b.onclick = async () => {
        s.textSize = opt.key;
        document.body.classList.remove("text-lg", "text-xl");
        if (opt.key !== "base") document.body.classList.add(`text-${opt.key}`);
        await DB.put("settings", s);
        renderAccessibilityTab();
      };
      sizeGrid.appendChild(b);
    });
    wrap.appendChild(sizeGrid);

    rootEl.appendChild(wrap);
  }

  renderTabs();
  await renderBody();
}
