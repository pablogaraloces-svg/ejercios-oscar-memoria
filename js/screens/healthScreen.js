import { addHealthEntry, getHealthEntries, monthLabel } from "../core/health.js";

/**
 * healthScreen.js — Apartado de seguimiento de salud, pensado para que un
 * familiar introduzca datos periódicamente y, más adelante, puedan
 * consultarse (incluso mostrarse a un médico): diseño limpio, sin
 * elementos decorativos de más.
 */
export async function renderHealth(rootEl, ctx) {
  rootEl.innerHTML = "";

  const formCard = document.createElement("div");
  formCard.className = "card col";
  formCard.style.maxWidth = "640px";
  formCard.innerHTML = `
    <h3 class="title-lg">Nueva medición</h3>
    <div class="field" style="margin-top:10px;">
      <label for="health-oxygen">Oxígeno en sangre (%)</label>
      <input type="number" id="health-oxygen" inputmode="numeric" min="0" max="100" placeholder="Ej: 97" />
    </div>
    <div class="row wrap" style="gap:16px;">
      <div class="field" style="flex:1; min-width:180px;">
        <label for="health-systolic">Tensión alta</label>
        <input type="number" id="health-systolic" inputmode="numeric" placeholder="Ej: 125" />
      </div>
      <div class="field" style="flex:1; min-width:180px;">
        <label for="health-diastolic">Tensión baja</label>
        <input type="number" id="health-diastolic" inputmode="numeric" placeholder="Ej: 78" />
      </div>
    </div>
  `;
  const saveBtn = document.createElement("button");
  saveBtn.className = "btn btn-success btn-huge";
  saveBtn.style.marginTop = "16px";
  saveBtn.textContent = "Guardar medición";
  saveBtn.onclick = async () => {
    const oxygen = formCard.querySelector("#health-oxygen").value;
    const systolic = formCard.querySelector("#health-systolic").value;
    const diastolic = formCard.querySelector("#health-diastolic").value;
    if (!oxygen && !systolic && !diastolic) return;
    await addHealthEntry(ctx.profile.id, { oxygen, systolic, diastolic });
    formCard.querySelector("#health-oxygen").value = "";
    formCard.querySelector("#health-systolic").value = "";
    formCard.querySelector("#health-diastolic").value = "";
    saveBtn.textContent = "¡Guardado! ✔️";
    setTimeout(() => (saveBtn.textContent = "Guardar medición"), 1600);
    await renderHistory();
  };
  formCard.appendChild(saveBtn);
  rootEl.appendChild(formCard);

  const historyCard = document.createElement("div");
  historyCard.className = "card col";
  historyCard.innerHTML = `<h3 class="title-lg">Promedio del mes</h3>`;
  const averagesBox = document.createElement("div");
  averagesBox.className = "grid-options cols-3";
  averagesBox.style.marginTop = "10px";
  historyCard.appendChild(averagesBox);
  rootEl.appendChild(historyCard);

  const historyListCard = document.createElement("div");
  historyListCard.className = "card col";
  historyListCard.innerHTML = `<h3 class="title-lg">Historial</h3><p class="text-md">Ordenado de la medición más reciente a la más antigua.</p>`;
  const listBox = document.createElement("div");
  listBox.className = "col";
  listBox.style.gap = "10px";
  listBox.style.marginTop = "10px";
  historyListCard.appendChild(listBox);
  rootEl.appendChild(historyListCard);

  async function renderHistory() {
    const entries = await getHealthEntries(ctx.profile.id);

    // Promedios del mes actual (oxígeno y tensión SIEMPRE por separado).
    const now = new Date();
    const inMonth = entries.filter((e) => {
      const d = new Date(e.timestamp);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const avg = (arr) => {
      const nums = arr.filter((v) => typeof v === "number");
      return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    };
    const avgOxygen = avg(inMonth.map((e) => e.oxygen));
    const avgSys = avg(inMonth.map((e) => e.systolic));
    const avgDia = avg(inMonth.map((e) => e.diastolic));
    const fmt = (v, d = 1) => (v === null ? "—" : v.toFixed(d).replace(".", ","));

    averagesBox.innerHTML = "";
    [
      { label: `Oxígeno medio (${monthLabel(now.getMonth())})`, value: avgOxygen !== null ? `${fmt(avgOxygen)}%` : "—", emoji: "🫁" },
      { label: "Tensión alta media", value: fmt(avgSys, 0), emoji: "❤️" },
      { label: "Tensión baja media", value: fmt(avgDia, 0), emoji: "💙" },
    ].forEach((s) => {
      const card = document.createElement("div");
      card.className = "card col center";
      card.innerHTML = `<span style="font-size:2rem;">${s.emoji}</span>
        <span class="health-value-huge">${s.value}</span>
        <span class="text-sm" style="text-align:center;">${s.label}</span>`;
      averagesBox.appendChild(card);
    });

    listBox.innerHTML = "";
    if (!entries.length) {
      const empty = document.createElement("p");
      empty.className = "text-md";
      empty.textContent = "Todavía no hay mediciones guardadas.";
      listBox.appendChild(empty);
      return;
    }
    entries.forEach((e) => {
      const row = document.createElement("div");
      row.className = "health-history-item";
      const parts = [];
      if (e.oxygen !== null) parts.push(`Oxígeno: ${e.oxygen}%`);
      if (e.systolic !== null || e.diastolic !== null) {
        parts.push(`Tensión: ${e.systolic ?? "—"} / ${e.diastolic ?? "—"}`);
      }
      row.innerHTML = `
        <span class="text-base" style="font-weight:700;">${e.date}, ${e.time}</span>
        <span class="text-base">${parts.join(" · ") || "Sin datos"}</span>
      `;
      listBox.appendChild(row);
    });
  }

  await renderHistory();
}
