import {
  getSessionsForProfile,
  summarize,
  drawAccuracyChart,
  getCategoryStats,
  drawCategoryErrorChart,
  getMoodStats,
  drawMoodChart,
  getReminderAdherence,
  drawAdherenceChart,
  getSessionHourDistribution,
  drawHourChart,
  getDailyDurationTotals,
  drawDurationChart,
  getMoodByDate,
  summarizeMoodByDate,
  resetStats,
} from "../core/reports.js";
import { canvasesToPdfBlob, shareOrDownloadPdf } from "../core/pdfExport.js";
import { getHealthEntries, getMonthlyHealthAverages, monthLabel, formatAverage } from "../core/health.js";

const MOOD_COLORS = {
  "Muy bien": "#6FBF8B",
  "Bien": "#A9D6B8",
  "Regular": "#FFB454",
  "No muy bien": "#EF798A",
};
const MOOD_EMOJI = { "Muy bien": "😊", "Bien": "🙂", "Regular": "😐", "No muy bien": "😕" };

let lastCharts = null; // referencias a los canvas ya dibujados, para poder exportarlos a PDF

export async function renderReports(rootEl, ctx) {
  rootEl.innerHTML = "";
  const sessions = await getSessionsForProfile(ctx.profile.id);
  const { totalSessions, totalExercises, avgAccuracy, streak } = summarize(sessions);
  const charts = {};

  const statsGrid = document.createElement("div");
  statsGrid.className = "grid-options cols-3";
  statsGrid.style.flexShrink = "0";
  [
    { label: "Días seguidos", value: streak, emoji: "🔥" },
    { label: "Sesiones totales", value: totalSessions, emoji: "🗓️" },
    { label: "Precisión media", value: `${avgAccuracy}%`, emoji: "🎯" },
  ].forEach((s) => {
    const card = document.createElement("div");
    card.className = "card col center";
    card.innerHTML = `<span style="font-size:2.2rem;">${s.emoji}</span>
      <span class="title-xl">${s.value}</span>
      <span class="text-md">${s.label}</span>`;
    statsGrid.appendChild(card);
  });
  rootEl.appendChild(statsGrid);

  // Evolución general
  const chartCard = document.createElement("div");
  chartCard.className = "card";
  chartCard.innerHTML = `<h3 class="title-lg">Últimas sesiones</h3><p class="text-md">Porcentaje de aciertos por sesión.</p>`;
  const canvas = document.createElement("canvas");
  canvas.width = 900; canvas.height = 260;
  canvas.style.width = "100%"; canvas.style.height = "auto";
  chartCard.appendChild(canvas);
  rootEl.appendChild(chartCard);
  drawAccuracyChart(canvas, sessions);
  charts.accuracy = canvas;

  // Tiempo dedicado por día (suma de todas las sesiones de ese día)
  const durationSeries = getDailyDurationTotals(sessions);
  const durationCard = document.createElement("div");
  durationCard.className = "card";
  durationCard.innerHTML = `<h3 class="title-lg">Tiempo dedicado cada día</h3><p class="text-md">Si hace varias sesiones el mismo día, se suman todas.</p>`;
  const durationCanvas = document.createElement("canvas");
  durationCanvas.width = 900; durationCanvas.height = 240;
  durationCanvas.style.width = "100%"; durationCanvas.style.height = "auto";
  durationCard.appendChild(durationCanvas);
  rootEl.appendChild(durationCard);
  drawDurationChart(durationCanvas, durationSeries);
  charts.duration = durationCanvas;

  // Dónde falla más
  const catStats = await getCategoryStats(ctx.profile.id);
  const catCard = document.createElement("div");
  catCard.className = "card";
  catCard.innerHTML = `<h3 class="title-lg">Dónde tiene más dificultad</h3><p class="text-md">Porcentaje de fallos por tipo de ejercicio.</p>`;
  const catCanvas = document.createElement("canvas");
  catCanvas.width = 900; catCanvas.height = 260;
  catCanvas.style.width = "100%"; catCanvas.style.height = "auto";
  catCard.appendChild(catCanvas);
  rootEl.appendChild(catCard);
  drawCategoryErrorChart(catCanvas, catStats);
  charts.category = catCanvas;

  // Por hora del día
  const hourBuckets = getSessionHourDistribution(sessions);
  const hourCard = document.createElement("div");
  hourCard.className = "card";
  hourCard.innerHTML = `<h3 class="title-lg">A qué horas hace las sesiones</h3><p class="text-md">Ayuda a ver si hay una hora del día en la que rinde mejor.</p>`;
  const hourCanvas = document.createElement("canvas");
  hourCanvas.width = 900; hourCanvas.height = 220;
  hourCanvas.style.width = "100%"; hourCanvas.style.height = "auto";
  hourCard.appendChild(hourCanvas);
  rootEl.appendChild(hourCard);
  drawHourChart(hourCanvas, hourBuckets);
  charts.hour = hourCanvas;

  // Estados de ánimo (recuento)
  const moodCounts = await getMoodStats(ctx.profile.id);
  const moodCard = document.createElement("div");
  moodCard.className = "card";
  moodCard.innerHTML = `<h3 class="title-lg">Cómo dice sentirse</h3><p class="text-md">Recuento de respuestas a "¿cómo te encuentras de humor hoy?".</p>`;
  const moodCanvas = document.createElement("canvas");
  moodCanvas.width = 900; moodCanvas.height = 220;
  moodCanvas.style.width = "100%"; moodCanvas.style.height = "auto";
  moodCard.appendChild(moodCanvas);
  rootEl.appendChild(moodCard);
  drawMoodChart(moodCanvas, moodCounts);
  charts.mood = moodCanvas;

  // Calendario de ánimo del mes
  const moodByDate = await getMoodByDate(ctx.profile.id);
  const calendarCard = document.createElement("div");
  calendarCard.className = "card";
  calendarCard.innerHTML = `<h3 class="title-lg">Calendario de ánimo</h3><p class="text-md">Un vistazo rápido a los días del mes según cómo dijo sentirse.</p>`;
  const calendarWrap = document.createElement("div");
  calendarWrap.style.marginTop = "10px";
  calendarCard.appendChild(calendarWrap);
  rootEl.appendChild(calendarCard);
  renderMoodCalendar(calendarWrap, moodByDate);

  // Cumplimiento de recordatorios
  const adherence = await getReminderAdherence(ctx.profile.id);
  const adherenceCard = document.createElement("div");
  adherenceCard.className = "card";
  adherenceCard.innerHTML = `<h3 class="title-lg">Cumplimiento de recordatorios</h3>
    <p class="text-md">De media cumple el <strong>${Math.round(adherence.overall * 100)}%</strong> de los recordatorios activos (${adherence.totalReminders}).</p>`;
  const adherenceCanvas = document.createElement("canvas");
  adherenceCanvas.width = 900; adherenceCanvas.height = 220;
  adherenceCanvas.style.width = "100%"; adherenceCanvas.style.height = "auto";
  adherenceCard.appendChild(adherenceCanvas);
  rootEl.appendChild(adherenceCard);
  drawAdherenceChart(adherenceCanvas, adherence.series);
  charts.adherence = adherenceCanvas;

  // Salud: historial cronológico + promedios mensuales (oxígeno y tensión
  // siempre por separado), reutilizando el mismo sistema de tarjetas.
  const healthEntries = await getHealthEntries(ctx.profile.id);
  if (healthEntries.length) {
    const healthAverages = await getMonthlyHealthAverages(ctx.profile.id);
    const healthCard = document.createElement("div");
    healthCard.className = "card col";
    healthCard.innerHTML = `<h3 class="title-lg">Salud</h3>
      <p class="text-md">Promedio de ${monthLabel(healthAverages.month)}: oxígeno ${
      healthAverages.avgOxygen !== null ? formatAverage(healthAverages.avgOxygen) + "%" : "—"
    }, tensión ${formatAverage(healthAverages.avgSystolic, 0)} / ${formatAverage(healthAverages.avgDiastolic, 0)}.</p>`;
    const healthList = document.createElement("div");
    healthList.className = "col";
    healthList.style.gap = "8px";
    healthList.style.marginTop = "10px";
    healthEntries.slice(0, 10).forEach((e) => {
      const row = document.createElement("div");
      row.className = "health-history-item";
      const parts = [];
      if (e.oxygen !== null) parts.push(`Oxígeno: ${e.oxygen}%`);
      if (e.systolic !== null || e.diastolic !== null) parts.push(`Tensión: ${e.systolic ?? "—"} / ${e.diastolic ?? "—"}`);
      row.innerHTML = `<span class="text-base" style="font-weight:700;">${e.date}</span><span class="text-base">${parts.join(" · ")}</span>`;
      healthList.appendChild(row);
    });
    healthCard.appendChild(healthList);
    rootEl.appendChild(healthCard);
  }

  const note = document.createElement("p");
  note.className = "text-md";
  note.style.textAlign = "center";
  note.textContent = totalExercises
    ? `En total se han completado ${totalExercises} ejercicios. ¡Cada ratito cuenta!`
    : "Todavía no hay ejercicios registrados.";
  rootEl.appendChild(note);

  // Botón de restablecer, claramente separado del resto para evitar toques
  // accidentales, y siempre con confirmación explícita antes de borrar nada.
  const dangerCard = document.createElement("div");
  dangerCard.className = "card col center";
  dangerCard.style.marginTop = "8px";
  dangerCard.style.border = "2px dashed var(--color-warm)";
  const resetBtn = document.createElement("button");
  resetBtn.className = "btn btn-warm";
  resetBtn.textContent = "🗑️ Restablecer estadísticas";
  resetBtn.onclick = () => openResetConfirm(rootEl, ctx);
  dangerCard.appendChild(resetBtn);
  const resetNote = document.createElement("p");
  resetNote.className = "text-sm";
  resetNote.style.marginTop = "8px";
  resetNote.style.color = "var(--color-text-soft)";
  resetNote.textContent = "Borra sesiones, gráficas y calendario de ánimo. No afecta al perfil, la familia ni los ajustes.";
  dangerCard.appendChild(resetNote);
  rootEl.appendChild(dangerCard);

  lastCharts = {
    charts,
    stats: { totalSessions, totalExercises, avgAccuracy, streak },
    moodByDate,
    profileName: ctx.profile.name,
  };
}

function openResetConfirm(rootEl, ctx) {
  const modal = document.getElementById("generic-modal");
  const box = document.getElementById("generic-modal-box");
  box.innerHTML = `
    <div style="font-size:2.4rem;">⚠️</div>
    <h2 class="title-lg">¿Seguro que quieres borrar todas las estadísticas?</h2>
    <p class="text-base" style="margin:12px 0 20px;">Se borrarán las sesiones, las gráficas y el calendario de ánimo. El perfil, la familia, las fotos, los recordatorios y los ajustes NO se ven afectados.</p>
    <div class="row center" style="gap:16px;">
      <button class="btn btn-ghost" id="reset-stats-cancel">Cancelar</button>
      <button class="btn btn-warm" id="reset-stats-confirm">Sí, borrar estadísticas</button>
    </div>
  `;
  modal.classList.add("active");
  box.querySelector("#reset-stats-cancel").onclick = () => modal.classList.remove("active");
  box.querySelector("#reset-stats-confirm").onclick = async () => {
    await resetStats(ctx.profile.id);
    modal.classList.remove("active");
    await renderReports(rootEl, ctx);
  };
}

function renderMoodCalendar(container, moodByDate) {
  container.innerHTML = "";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = (firstDay.getDay() + 6) % 7; // lunes=0

  const monthLabel = document.createElement("p");
  monthLabel.className = "text-base";
  monthLabel.style.fontWeight = "700";
  monthLabel.style.marginBottom = "8px";
  monthLabel.textContent = now.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  container.appendChild(monthLabel);

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(7, 1fr)";
  grid.style.gap = "6px";

  ["L", "M", "X", "J", "V", "S", "D"].forEach((d) => {
    const cell = document.createElement("div");
    cell.textContent = d;
    cell.style.textAlign = "center";
    cell.style.fontWeight = "700";
    cell.style.fontSize = "var(--font-sm)";
    cell.style.color = "var(--color-text-soft)";
    grid.appendChild(cell);
  });

  for (let i = 0; i < startWeekday; i++) {
    grid.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const key = dateObj.toDateString();
    const mood = moodByDate[key];
    const cell = document.createElement("div");
    cell.style.aspectRatio = "1";
    cell.style.borderRadius = "10px";
    cell.style.display = "flex";
    cell.style.flexDirection = "column";
    cell.style.alignItems = "center";
    cell.style.justifyContent = "center";
    cell.style.fontWeight = "700";
    cell.style.background = mood ? `${MOOD_COLORS[mood]}33` : "var(--color-bg-soft)";
    cell.style.border = `2px solid ${mood ? MOOD_COLORS[mood] : "var(--color-border)"}`;
    // Icono de cara bien grande (lo importante aquí es que se distinga a
    // simple vista); el número del día queda pequeño, es secundario.
    cell.innerHTML = mood
      ? `<span style="font-size:1.9rem; line-height:1;">${MOOD_EMOJI[mood]}</span><span style="font-size:var(--font-sm); margin-top:2px;">${day}</span>`
      : `<span style="font-size:var(--font-sm);">${day}</span>`;
    grid.appendChild(cell);
  }
  container.appendChild(grid);

  const counts = summarizeMoodByDate(moodByDate);
  const legend = document.createElement("div");
  legend.className = "row wrap";
  legend.style.marginTop = "12px";
  legend.style.gap = "14px";
  Object.entries(counts).forEach(([label, count]) => {
    const item = document.createElement("span");
    item.className = "pill";
    item.style.fontSize = "var(--font-base)";
    item.innerHTML = `<span style="font-size:1.3rem;">${MOOD_EMOJI[label]}</span> ${label}: ${count} día(s)`;
    legend.appendChild(item);
  });
  container.appendChild(legend);
}

/**
 * Genera el PDF con el resumen actual (debe llamarse después de renderReports)
 * y lo comparte o descarga.
 */
export async function exportReportPdf(ctx) {
  if (!lastCharts) return { status: "sin-datos" };
  const { charts, stats, moodByDate, profileName } = lastCharts;

  const page1 = document.createElement("canvas");
  page1.width = 1240;
  page1.height = 1754;
  const p1 = page1.getContext("2d");
  p1.fillStyle = "#FBF9F5";
  p1.fillRect(0, 0, page1.width, page1.height);
  p1.fillStyle = "#2E2E2E";
  p1.font = "bold 44px sans-serif";
  p1.fillText(`Resumen de estadísticas`, 60, 90);
  p1.font = "28px sans-serif";
  p1.fillText(`${profileName} — ${new Date().toLocaleDateString("es-ES")}`, 60, 140);

  p1.font = "24px sans-serif";
  p1.fillText(`Días seguidos: ${stats.streak}`, 60, 200);
  p1.fillText(`Sesiones totales: ${stats.totalSessions}`, 60, 236);
  p1.fillText(`Precisión media: ${stats.avgAccuracy}%`, 60, 272);
  p1.fillText(`Ejercicios completados: ${stats.totalExercises}`, 60, 308);

  drawScaled(p1, charts.accuracy, 60, 340, 1120);
  drawScaled(p1, charts.category, 60, 340 + 320, 1120);
  drawScaled(p1, charts.hour, 60, 340 + 320 * 2, 1120);

  const page2 = document.createElement("canvas");
  page2.width = 1240;
  page2.height = 1754;
  const p2 = page2.getContext("2d");
  p2.fillStyle = "#FBF9F5";
  p2.fillRect(0, 0, page2.width, page2.height);
  p2.fillStyle = "#2E2E2E";
  p2.font = "bold 36px sans-serif";
  p2.fillText("Ánimo y cumplimiento de recordatorios", 60, 80);

  drawScaled(p2, charts.mood, 60, 120, 1120);
  drawScaled(p2, charts.adherence, 60, 120 + 320, 1120);

  const blob = canvasesToPdfBlob([page1, page2]);
  const filename = `estadisticas_${profileName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
  return { status: await shareOrDownloadPdf(blob, filename) };
}

function drawScaled(ctx, sourceCanvas, x, y, targetWidth) {
  const scale = targetWidth / sourceCanvas.width;
  const targetHeight = sourceCanvas.height * scale;
  ctx.drawImage(sourceCanvas, x, y, targetWidth, targetHeight);
}
