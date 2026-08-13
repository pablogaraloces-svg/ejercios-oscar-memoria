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
} from "../core/reports.js";

export async function renderReports(rootEl, ctx) {
  rootEl.innerHTML = "";
  const sessions = await getSessionsForProfile(ctx.profile.id);
  const { totalSessions, totalExercises, avgAccuracy, streak } = summarize(sessions);

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
    card.innerHTML = `<span style="font-size:2.6rem;">${s.emoji}</span>
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
  canvas.width = 900; canvas.height = 300;
  canvas.style.width = "100%"; canvas.style.height = "auto";
  chartCard.appendChild(canvas);
  rootEl.appendChild(chartCard);
  drawAccuracyChart(canvas, sessions);

  // Dónde falla más (por categoría cognitiva)
  const catStats = await getCategoryStats(ctx.profile.id);
  const catCard = document.createElement("div");
  catCard.className = "card";
  catCard.innerHTML = `<h3 class="title-lg">Dónde tiene más dificultad</h3><p class="text-md">Porcentaje de fallos por tipo de ejercicio (más alto = le cuesta más).</p>`;
  const catCanvas = document.createElement("canvas");
  catCanvas.width = 900; catCanvas.height = 300;
  catCanvas.style.width = "100%"; catCanvas.style.height = "auto";
  catCard.appendChild(catCanvas);
  rootEl.appendChild(catCard);
  drawCategoryErrorChart(catCanvas, catStats);

  // Estados de ánimo
  const moodCounts = await getMoodStats(ctx.profile.id);
  const moodCard = document.createElement("div");
  moodCard.className = "card";
  moodCard.innerHTML = `<h3 class="title-lg">Cómo dice sentirse</h3><p class="text-md">Recuento de respuestas a "¿cómo estás?" a lo largo de los días.</p>`;
  const moodCanvas = document.createElement("canvas");
  moodCanvas.width = 900; moodCanvas.height = 260;
  moodCanvas.style.width = "100%"; moodCanvas.style.height = "auto";
  moodCard.appendChild(moodCanvas);
  rootEl.appendChild(moodCard);
  drawMoodChart(moodCanvas, moodCounts);

  // Cumplimiento de recordatorios
  const adherence = await getReminderAdherence(ctx.profile.id);
  const adherenceCard = document.createElement("div");
  adherenceCard.className = "card";
  adherenceCard.innerHTML = `<h3 class="title-lg">Cumplimiento de recordatorios</h3>
    <p class="text-md">De media cumple el <strong>${Math.round(adherence.overall * 100)}%</strong> de los recordatorios marcados como activos (${adherence.totalReminders}).</p>`;
  const adherenceCanvas = document.createElement("canvas");
  adherenceCanvas.width = 900; adherenceCanvas.height = 260;
  adherenceCanvas.style.width = "100%"; adherenceCanvas.style.height = "auto";
  adherenceCard.appendChild(adherenceCanvas);
  rootEl.appendChild(adherenceCard);
  drawAdherenceChart(adherenceCanvas, adherence.series);

  const note = document.createElement("p");
  note.className = "text-md";
  note.style.textAlign = "center";
  note.textContent = totalExercises
    ? `En total se han completado ${totalExercises} ejercicios. ¡Cada ratito cuenta!`
    : "Todavía no hay ejercicios registrados.";
  rootEl.appendChild(note);
}
