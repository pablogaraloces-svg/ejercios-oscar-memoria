import { DB } from "../core/db.js";
import { Voice } from "../core/voice.js";
import { buildFamilyIdentityPhrase } from "../core/familyPhrase.js";

export function renderFamily(rootEl, ctx, openModalFn, editable = false) {
  rootEl.innerHTML = "";
  const family = ctx.profile.family || [];

  if (family.length === 0) {
    const empty = document.createElement("div");
    empty.className = "col center grow";
    empty.innerHTML = `<div style="font-size:3.4rem;">👨‍👩‍👧‍👦</div>
      <p class="text-base" style="text-align:center; max-width:480px;">
        ${editable
          ? "Aún no hay fotos de familiares. Añade alguna para poder reconocerlas durante los ejercicios."
          : "Todavía no hay fotos de la familia aquí."}
      </p>`;
    rootEl.appendChild(empty);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "grid-options cols-3";
  family.forEach((f, idx) => {
    const card = document.createElement("div");
    card.className = "card col center family-card";
    const photoEl = document.createElement("img");
    photoEl.src = f.photo;
    photoEl.alt = f.name;
    photoEl.className = "family-photo";
    card.appendChild(photoEl);

    const nameEl = document.createElement("p");
    nameEl.className = "text-base";
    nameEl.style.fontWeight = "700";
    nameEl.style.marginTop = "10px";
    nameEl.textContent = f.name;
    card.appendChild(nameEl);

    const relEl = document.createElement("p");
    relEl.className = "text-md";
    relEl.textContent = f.relation || "";
    card.appendChild(relEl);

    if (!editable) {
      // En la vista de Óscar (solo ver): tocar la foto la amplía un
      // momento y la voz dice quién es y su parentesco, como pequeña
      // ayuda de memoria voluntaria — no es un examen.
      photoEl.style.cursor = "pointer";
      photoEl.addEventListener("click", () => {
        photoEl.classList.remove("family-photo-zoom");
        void photoEl.offsetWidth;
        photoEl.classList.add("family-photo-zoom");
        setTimeout(() => photoEl.classList.remove("family-photo-zoom"), 900);
        const phrase = buildFamilyIdentityPhrase(f, { profileName: ctx.profile.name });
        Voice.say(phrase);
      });
    } else {
      const modBtn = document.createElement("button");
      modBtn.className = "btn btn-ghost";
      modBtn.style.marginTop = "8px";
      modBtn.textContent = "✏️ Modificar";
      modBtn.onclick = () => openModalFn(idx);
      card.appendChild(modBtn);
    }
    grid.appendChild(card);
  });
  rootEl.appendChild(grid);
}

function genderFieldHtml(idPrefix, current) {
  return `
    <div class="field">
      <label>Género (para hablar de forma natural, opcional)</label>
      <div class="row" style="gap:10px;">
        <button type="button" class="btn btn-ghost gender-btn" id="${idPrefix}-gender-m" data-gender="M" style="flex:1;">Hombre</button>
        <button type="button" class="btn btn-ghost gender-btn" id="${idPrefix}-gender-f" data-gender="F" style="flex:1;">Mujer</button>
      </div>
    </div>
  `;
}

function wireGenderButtons(modalBox, idPrefix, initial, onChange) {
  let current = initial || null;
  const mBtn = modalBox.querySelector(`#${idPrefix}-gender-m`);
  const fBtn = modalBox.querySelector(`#${idPrefix}-gender-f`);
  function refresh() {
    mBtn.classList.toggle("btn-success", current === "M");
    mBtn.classList.toggle("btn-ghost", current !== "M");
    fBtn.classList.toggle("btn-success", current === "F");
    fBtn.classList.toggle("btn-ghost", current !== "F");
  }
  mBtn.onclick = () => {
    current = current === "M" ? null : "M";
    refresh();
    onChange(current);
  };
  fBtn.onclick = () => {
    current = current === "F" ? null : "F";
    refresh();
    onChange(current);
  };
  refresh();
}

export function openAddFamilyModal(modalBox, ctx, onDone) {
  modalBox.innerHTML = `
    <h2 class="title-lg">Añadir familiar</h2>
    <div class="col" style="gap:16px; margin-top:20px; text-align:left;">
      <div class="field">
        <label for="fam-name">Nombre</label>
        <input type="text" id="fam-name" placeholder="Ej: María" />
      </div>
      <div class="field">
        <label for="fam-relation">Parentesco (opcional)</label>
        <input type="text" id="fam-relation" placeholder="Ej: hija, nieto, hermana…" />
      </div>
      ${genderFieldHtml("fam", null)}
      <div class="field">
        <label for="fam-photo">Foto</label>
        <input type="file" id="fam-photo" accept="image/*" style="min-height:auto; border:none; padding:8px 0;" />
      </div>
    </div>
    <div class="row center" style="gap:16px; margin-top:28px;">
      <button class="btn btn-ghost" id="fam-cancel">Cancelar</button>
      <button class="btn btn-success" id="fam-save" disabled>Guardar</button>
    </div>
  `;
  let photoData = null;
  let gender = null;
  wireGenderButtons(modalBox, "fam", null, (g) => (gender = g));

  const fileInput = modalBox.querySelector("#fam-photo");
  const saveBtn = modalBox.querySelector("#fam-save");

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      photoData = reader.result;
      saveBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  });

  modalBox.querySelector("#fam-cancel").onclick = () => onDone(null);
  saveBtn.onclick = async () => {
    const name = modalBox.querySelector("#fam-name").value.trim();
    const relation = modalBox.querySelector("#fam-relation").value.trim();
    if (!name || !photoData) return;
    ctx.profile.family = ctx.profile.family || [];
    ctx.profile.family.push({ name, relation, gender, photo: photoData });
    await DB.put("profile", ctx.profile);
    onDone(ctx.profile);
  };
}

/**
 * Modal de edición: permite cambiar nombre, parentesco, género y foto de
 * un familiar ya guardado, y dentro incluye la opción de quitarlo.
 */
export function openEditFamilyModal(modalBox, ctx, index, onDone) {
  const person = ctx.profile.family[index];
  if (!person) return onDone(null);

  modalBox.innerHTML = `
    <h2 class="title-lg">Modificar familiar</h2>
    <div class="col center" style="margin-top:10px;">
      <img src="${person.photo}" alt="${person.name}" class="family-photo" id="fam-edit-preview" />
    </div>
    <div class="col" style="gap:16px; margin-top:16px; text-align:left;">
      <div class="field">
        <label for="fam-edit-name">Nombre</label>
        <input type="text" id="fam-edit-name" value="${person.name}" />
      </div>
      <div class="field">
        <label for="fam-edit-relation">Parentesco (opcional)</label>
        <input type="text" id="fam-edit-relation" value="${person.relation || ""}" />
      </div>
      ${genderFieldHtml("fam-edit", person.gender)}
      <div class="field">
        <label for="fam-edit-photo">Cambiar foto (opcional)</label>
        <input type="file" id="fam-edit-photo" accept="image/*" style="min-height:auto; border:none; padding:8px 0;" />
      </div>
    </div>
    <div class="row spread" style="margin-top:26px;">
      <button class="btn btn-warm" id="fam-edit-delete">🗑️ Quitar de la familia</button>
      <div class="row" style="gap:16px;">
        <button class="btn btn-ghost" id="fam-edit-cancel">Cancelar</button>
        <button class="btn btn-success" id="fam-edit-save">Guardar cambios</button>
      </div>
    </div>
  `;

  let newPhotoData = null;
  let gender = person.gender || null;
  wireGenderButtons(modalBox, "fam-edit", person.gender, (g) => (gender = g));

  const fileInput = modalBox.querySelector("#fam-edit-photo");
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      newPhotoData = reader.result;
      modalBox.querySelector("#fam-edit-preview").src = newPhotoData;
    };
    reader.readAsDataURL(file);
  });

  modalBox.querySelector("#fam-edit-cancel").onclick = () => onDone(null);

  modalBox.querySelector("#fam-edit-save").onclick = async () => {
    const name = modalBox.querySelector("#fam-edit-name").value.trim();
    const relation = modalBox.querySelector("#fam-edit-relation").value.trim();
    if (!name) return;
    person.name = name;
    person.relation = relation;
    person.gender = gender;
    if (newPhotoData) person.photo = newPhotoData;
    await DB.put("profile", ctx.profile);
    onDone(ctx.profile);
  };

  modalBox.querySelector("#fam-edit-delete").onclick = () => {
    modalBox.innerHTML = `
      <div style="font-size:2.6rem;">💛</div>
      <h2 class="title-lg">¿Quitar a ${person.name}?</h2>
      <p class="text-base" style="margin:14px 0 24px;">Ya no aparecerá en el ejercicio de reconocimiento familiar. Puedes volver a añadirlo cuando quieras.</p>
      <div class="row center" style="gap:16px;">
        <button class="btn btn-ghost" id="fam-delete-cancel">Cancelar</button>
        <button class="btn btn-warm" id="fam-delete-confirm">Sí, quitar</button>
      </div>
    `;
    modalBox.querySelector("#fam-delete-cancel").onclick = () => onDone(null);
    modalBox.querySelector("#fam-delete-confirm").onclick = async () => {
      ctx.profile.family = ctx.profile.family.filter((_, i) => i !== index);
      await DB.put("profile", ctx.profile);
      onDone(ctx.profile);
    };
  };
}
