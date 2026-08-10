import { DB } from "../core/db.js";
import { DEFAULT_REMINDER_CATALOG } from "../core/state.js";
import { getReminders, addReminder, removeReminder, setReminderEnabled } from "../core/reminders.js";
import { Voice } from "../core/voice.js";

const TABS = [
  { key: "perfil", label: "👤 Perfil" },
  { key: "recordatorios", label: "✅ Recordatorios" },
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
    else await renderAccessibilityTab();
  }

  async function renderProfileTab() {
    const p = ctx.profile;
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
    `;
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-success btn-huge";
    saveBtn.style.marginTop = "20px";
    saveBtn.textContent = "Guardar cambios";
    saveBtn.onclick = async () => {
      p.name = card.querySelector("#set-name").value.trim() || p.name;
      const ageVal = card.querySelector("#set-age").value;
      p.age = ageVal ? Number(ageVal) : null;
      await DB.put("profile", p);
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

    // Catálogo para añadir los que faltan
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

    // Recordatorio personalizado
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

  async function renderAccessibilityTab() {
    const s = ctx.settings;
    const wrap = document.createElement("div");
    wrap.className = "col";
    wrap.style.maxWidth = "640px";
    wrap.style.gap = "14px";

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

    wrap.appendChild(
      switchRow("🔊 Voz que acompaña", s.voiceEnabled, async (v) => {
        s.voiceEnabled = v;
        Voice.setEnabled(v);
        await DB.put("settings", s);
      })
    );
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
      switchRow("🌻 Mostrar mascota", s.mascotEnabled, async (v) => {
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
