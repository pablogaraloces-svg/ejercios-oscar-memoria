import { DB } from "../core/db.js";
import { DEFAULT_REMINDER_CATALOG } from "../core/state.js";
import { getReminders, addReminder, removeReminder, setReminderEnabled } from "../core/reminders.js";
import { Voice } from "../core/voice.js";
import { Music, TRACKS } from "../core/music.js";
import { getAllProfiles, createProfile, deleteProfileCascade } from "../core/profiles.js";

const TABS = [
  { key: "perfiles", label: "👤 Perfiles" },
  { key: "recordatorios", label: "✅ Recordatorios" },
  { key: "voz", label: "🔊 Voz y música" },
  { key: "accesibilidad", label: "🔎 Accesibilidad" },
  { key: "password", label: "🔑 Contraseña admin" },
];

export async function renderSettings(tabsEl, rootEl, ctx) {
  let activeTab = "perfiles";

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
    if (activeTab === "perfiles") await renderProfilesTab();
    else if (activeTab === "recordatorios") await renderRemindersTab();
    else if (activeTab === "voz") await renderVoiceTab();
    else if (activeTab === "password") await renderPasswordTab();
    else await renderAccessibilityTab();
  }

  async function renderProfilesTab() {
    const wrap = document.createElement("div");
    wrap.className = "col";
    wrap.style.gap = "16px";
    wrap.style.maxWidth = "640px";

    const intro = document.createElement("p");
    intro.className = "text-md";
    intro.textContent = "Toca la foto y el nombre de una persona para ver o editar su ficha. Puedes tener varios perfiles en la misma aplicación y cambiar entre ellos cuando quieras.";
    wrap.appendChild(intro);

    const list = document.createElement("div");
    list.className = "col";
    list.style.gap = "12px";
    wrap.appendChild(list);

    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-accent";
    addBtn.style.marginTop = "4px";
    addBtn.textContent = "➕ Añadir perfil";
    addBtn.onclick = () => openAddProfileModal();
    wrap.appendChild(addBtn);

    rootEl.appendChild(wrap);

    async function refresh() {
      const profiles = await getAllProfiles();
      list.innerHTML = "";
      profiles.forEach((p) => renderProfileCard(p, profiles.length));
    }

    function renderProfileCard(p, totalProfiles) {
      const isActive = p.id === ctx.profile.id;
      const item = document.createElement("div");
      item.className = "card profile-card-item";

      const header = document.createElement("div");
      header.className = "profile-card-header";
      header.innerHTML = `
        <span class="profile-avatar">${p.photo ? `<img src="${p.photo}" alt="${p.name}" />` : "👤"}</span>
        <span class="col" style="gap:2px; flex:1; text-align:left;">
          <span class="profile-name">${p.name}</span>
          ${isActive ? '<span class="pill">Perfil activo ahora</span>' : '<span class="text-sm" style="color:var(--color-text-soft);">Toca para ver la ficha</span>'}
        </span>
        <span class="profile-expand-arrow">▾</span>
      `;
      item.appendChild(header);

      const panel = document.createElement("div");
      panel.className = "profile-detail-panel";
      const inner = document.createElement("div");
      inner.className = "profile-detail-inner";
      inner.innerHTML = `
        <div class="field">
          <label for="pf-name-${p.id}">Nombre</label>
          <input type="text" id="pf-name-${p.id}" value="${p.name || ""}" />
        </div>
        <div class="field">
          <label for="pf-photo-${p.id}">Foto</label>
          <input type="file" id="pf-photo-${p.id}" accept="image/*" style="min-height:auto; border:none; padding:8px 0;" />
        </div>
        <div class="row wrap" style="gap:16px;">
          <div class="field" style="flex:1; min-width:140px;">
            <label for="pf-age-${p.id}">Edad</label>
            <input type="number" id="pf-age-${p.id}" value="${p.age ?? ""}" />
          </div>
          <div class="field" style="flex:1; min-width:140px;">
            <label for="pf-weight-${p.id}">Peso (kg)</label>
            <input type="number" id="pf-weight-${p.id}" value="${p.weight ?? ""}" />
          </div>
          <div class="field" style="flex:1; min-width:140px;">
            <label for="pf-height-${p.id}">Altura (cm)</label>
            <input type="number" id="pf-height-${p.id}" value="${p.height ?? ""}" />
          </div>
        </div>
        <div class="field">
          <label for="pf-notes-${p.id}">Observaciones</label>
          <textarea id="pf-notes-${p.id}" placeholder="Notas para la familia o el profesional (alergias, preferencias, cualquier cosa a tener en cuenta)…">${p.notes || ""}</textarea>
        </div>
        <div class="row wrap" style="gap:12px; margin-top:6px;">
          <button class="btn btn-success" id="pf-save-${p.id}">Guardar cambios</button>
          ${!isActive ? `<button class="btn btn-ghost" id="pf-use-${p.id}">Usar este perfil</button>` : ""}
          ${totalProfiles > 1 ? `<button class="btn btn-warm" id="pf-delete-${p.id}">🗑️ Eliminar perfil</button>` : ""}
        </div>
      `;
      panel.appendChild(inner);
      item.appendChild(panel);

      let expanded = false;
      header.onclick = () => {
        expanded = !expanded;
        header.classList.toggle("is-expanded", expanded);
        panel.classList.toggle("is-expanded", expanded);
      };

      let photoData = null;
      inner.querySelector(`#pf-photo-${p.id}`).addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => (photoData = reader.result);
        reader.readAsDataURL(file);
      });

      inner.querySelector(`#pf-save-${p.id}`).onclick = async () => {
        const nameVal = inner.querySelector(`#pf-name-${p.id}`).value.trim();
        p.name = nameVal || p.name;
        const ageVal = inner.querySelector(`#pf-age-${p.id}`).value;
        p.age = ageVal ? Number(ageVal) : null;
        const weightVal = inner.querySelector(`#pf-weight-${p.id}`).value;
        p.weight = weightVal ? Number(weightVal) : null;
        const heightVal = inner.querySelector(`#pf-height-${p.id}`).value;
        p.height = heightVal ? Number(heightVal) : null;
        p.notes = inner.querySelector(`#pf-notes-${p.id}`).value;
        if (photoData) p.photo = photoData;
        await DB.put("profile", p);
        if (isActive) {
          ctx.profile = p;
          ctx.onProfileUpdated?.(p);
        }
        const saveBtn = inner.querySelector(`#pf-save-${p.id}`);
        saveBtn.textContent = "¡Guardado! ✔️";
        setTimeout(() => (saveBtn.textContent = "Guardar cambios"), 1600);
        await refresh();
      };

      const useBtn = inner.querySelector(`#pf-use-${p.id}`);
      if (useBtn) {
        useBtn.onclick = () => ctx.onProfileSwitched?.(p);
      }

      const deleteBtn = inner.querySelector(`#pf-delete-${p.id}`);
      if (deleteBtn) {
        deleteBtn.onclick = async () => {
          deleteBtn.textContent = "Toca de nuevo para confirmar";
          deleteBtn.onclick = async () => {
            const result = await deleteProfileCascade(p.id);
            if (result.ok) {
              if (isActive) {
                // Si se elimina el perfil activo, se pasa automáticamente
                // al primero que quede.
                const remaining = await getAllProfiles();
                if (remaining[0]) ctx.onProfileSwitched?.(remaining[0]);
              } else {
                await refresh();
              }
            }
          };
        };
      }

      list.appendChild(item);
    }

    function openAddProfileModal() {
      ctx.openModal?.((box, close) => {
        box.innerHTML = `
          <h2 class="title-lg">Añadir perfil</h2>
          <div class="col" style="gap:16px; margin-top:20px; text-align:left;">
            <div class="field">
              <label for="new-pf-name">Nombre</label>
              <input type="text" id="new-pf-name" placeholder="Ej: Óscar, María…" />
            </div>
            <div class="field">
              <label for="new-pf-age">Edad (opcional)</label>
              <input type="number" id="new-pf-age" />
            </div>
            <div class="field">
              <label for="new-pf-photo">Foto (opcional, se puede añadir luego)</label>
              <input type="file" id="new-pf-photo" accept="image/*" style="min-height:auto; border:none; padding:8px 0;" />
            </div>
          </div>
          <div class="row center" style="gap:16px; margin-top:28px;">
            <button class="btn btn-ghost" id="new-pf-cancel">Cancelar</button>
            <button class="btn btn-success" id="new-pf-save" disabled>Añadir</button>
          </div>
        `;
        let photoData = null;
        const nameInput = box.querySelector("#new-pf-name");
        const saveBtn = box.querySelector("#new-pf-save");
        nameInput.addEventListener("input", () => {
          saveBtn.disabled = !nameInput.value.trim();
        });
        box.querySelector("#new-pf-photo").addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => (photoData = reader.result);
          reader.readAsDataURL(file);
        });
        box.querySelector("#new-pf-cancel").onclick = close;
        saveBtn.onclick = async () => {
          const name = nameInput.value.trim();
          if (!name) return;
          const ageVal = box.querySelector("#new-pf-age").value;
          await createProfile({ name, photo: photoData, age: ageVal ? Number(ageVal) : null });
          close();
          await refresh();
        };
      });
    }

    await refresh();
  }

  async function renderPasswordTab() {
    const s = ctx.settings;
    const wrap = document.createElement("div");
    wrap.className = "col";
    wrap.style.maxWidth = "640px";
    wrap.style.gap = "16px";

    const pinCard = document.createElement("div");
    pinCard.className = "card col";
    pinCard.innerHTML = `
      <p class="text-base" style="font-weight:700;">PIN de administración</p>
      <p class="text-md">Se pide al tocar el candado 🔐 de la pantalla principal, para entrar en Ajustes, Estadísticas o editar la familia.</p>
      <div class="field" style="margin-top:10px;">
        <label for="set-pin">PIN (4-6 dígitos)</label>
        <input type="text" id="set-pin" inputmode="numeric" maxlength="6" value="${s.adminPin || "1234"}" />
      </div>
    `;
    const savePinBtn = document.createElement("button");
    savePinBtn.className = "btn btn-success";
    savePinBtn.style.marginTop = "12px";
    savePinBtn.textContent = "Guardar PIN";
    savePinBtn.onclick = async () => {
      const pinVal = pinCard.querySelector("#set-pin").value.trim();
      if (pinVal) s.adminPin = pinVal;
      await DB.put("settings", s);
      savePinBtn.textContent = "¡Guardado! ✔️";
      setTimeout(() => (savePinBtn.textContent = "Guardar PIN"), 1600);
    };
    pinCard.appendChild(savePinBtn);
    wrap.appendChild(pinCard);

    const questionCard = document.createElement("div");
    questionCard.className = "card col";
    questionCard.innerHTML = `
      <p class="text-base" style="font-weight:700;">Pregunta de recuperación</p>
      <p class="text-md">Si alguien falla el PIN 5 veces seguidas, se le ofrecerá responder a esta pregunta para poder entrar y cambiar el PIN. Déjala en blanco si no la quieres usar.</p>
      <div class="field" style="margin-top:10px;">
        <label for="set-security-q">Pregunta</label>
        <input type="text" id="set-security-q" placeholder="Ej: ¿En qué ciudad nació Óscar?" value="${s.securityQuestion || ""}" />
      </div>
      <div class="field">
        <label for="set-security-a">Respuesta</label>
        <input type="text" id="set-security-a" placeholder="Respuesta exacta" value="${s.securityAnswer || ""}" />
      </div>
    `;
    const saveQBtn = document.createElement("button");
    saveQBtn.className = "btn btn-success";
    saveQBtn.style.marginTop = "12px";
    saveQBtn.textContent = "Guardar pregunta";
    saveQBtn.onclick = async () => {
      s.securityQuestion = questionCard.querySelector("#set-security-q").value.trim();
      s.securityAnswer = questionCard.querySelector("#set-security-a").value.trim();
      await DB.put("settings", s);
      saveQBtn.textContent = "¡Guardado! ✔️";
      setTimeout(() => (saveQBtn.textContent = "Guardar pregunta"), 1600);
    };
    questionCard.appendChild(saveQBtn);
    wrap.appendChild(questionCard);

    rootEl.appendChild(wrap);
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

    // Velocidad de la voz: selector sencillo de 3 opciones.
    const speedTitle = document.createElement("p");
    speedTitle.className = "text-md";
    speedTitle.style.marginTop = "14px";
    speedTitle.textContent = "Velocidad de la voz";
    voiceCard.appendChild(speedTitle);

    const speedGrid = document.createElement("div");
    speedGrid.className = "grid-options cols-3";
    const speedOptions = [
      { key: "lenta", label: "Más lenta", rate: 0.75 },
      { key: "normal", label: "Normal", rate: 0.92 },
      { key: "rapida", label: "Más rápida", rate: 1.12 },
    ];
    speedOptions.forEach((opt) => {
      const b = document.createElement("button");
      b.className = "option-card";
      b.style.minHeight = "68px";
      b.textContent = opt.label;
      const isActive = Math.abs((s.voiceRate ?? 0.92) - opt.rate) < 0.03;
      b.style.borderColor = isActive ? "var(--color-success)" : "";
      b.onclick = async () => {
        s.voiceRate = opt.rate;
        Voice.setRate(opt.rate);
        await DB.put("settings", s);
        [...speedGrid.children].forEach((c) => (c.style.borderColor = ""));
        b.style.borderColor = "var(--color-success)";
      };
      speedGrid.appendChild(b);
    });
    voiceCard.appendChild(speedGrid);

    // Tono de la voz: deslizador con margen pequeño para que no suene artificial.
    const pitchTitle = document.createElement("p");
    pitchTitle.className = "text-md";
    pitchTitle.style.marginTop = "14px";
    pitchTitle.textContent = "Tono de la voz";
    voiceCard.appendChild(pitchTitle);

    const pitchInput = document.createElement("input");
    pitchInput.type = "range";
    pitchInput.min = "0.85";
    pitchInput.max = "1.15";
    pitchInput.step = "0.05";
    pitchInput.value = String(s.voicePitch ?? 1.0);
    pitchInput.style.width = "100%";
    pitchInput.style.height = "48px";
    pitchInput.oninput = async () => {
      s.voicePitch = Number(pitchInput.value);
      Voice.setPitch(s.voicePitch);
      await DB.put("settings", s);
    };
    voiceCard.appendChild(pitchInput);

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
      switchRow("🧠 Mostrar mascota", s.mascotEnabled, async (v) => {
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
