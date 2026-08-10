import { DB } from "../core/db.js";

export function renderFamily(rootEl, ctx) {
  rootEl.innerHTML = "";
  const family = ctx.profile.family || [];

  if (family.length === 0) {
    const empty = document.createElement("div");
    empty.className = "col center grow";
    empty.innerHTML = `<div style="font-size:4rem;">👨‍👩‍👧‍👦</div>
      <p class="text-base" style="text-align:center; max-width:480px;">
        Aún no hay fotos de familiares. Añade alguna para poder reconocerlas durante los ejercicios.
      </p>`;
    rootEl.appendChild(empty);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "grid-options cols-3";
  family.forEach((f, idx) => {
    const card = document.createElement("div");
    card.className = "card col center";
    card.innerHTML = `
      <img src="${f.photo}" alt="${f.name}" style="width:140px;height:140px;object-fit:cover;border-radius:20px;box-shadow:var(--shadow-soft);" />
      <p class="text-base" style="font-weight:700; margin-top:12px;">${f.name}</p>
      <p class="text-md">${f.relation || ""}</p>
    `;
    const del = document.createElement("button");
    del.className = "btn btn-ghost";
    del.style.marginTop = "10px";
    del.textContent = "🗑️ Quitar";
    del.onclick = async () => {
      ctx.profile.family = ctx.profile.family.filter((_, i) => i !== idx);
      await DB.put("profile", ctx.profile);
      renderFamily(rootEl, ctx);
    };
    card.appendChild(del);
    grid.appendChild(card);
  });
  rootEl.appendChild(grid);
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
    ctx.profile.family.push({ name, relation, photo: photoData });
    await DB.put("profile", ctx.profile);
    onDone(ctx.profile);
  };
}
