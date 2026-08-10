import { getSessionsForProfile, summarize, drawAccuracyChart } from "../core/reports.js";

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

  const chartCard = document.createElement("div");
  chartCard.className = "card";
  chartCard.style.marginTop = "8px";
  chartCard.innerHTML = `<h3 class="title-lg">Últimas sesiones</h3>`;
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 320;
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  chartCard.appendChild(canvas);
  rootEl.appendChild(chartCard);

  drawAccuracyChart(canvas, sessions);

  const note = document.createElement("p");
  note.className = "text-md";
  note.style.textAlign = "center";
  note.textContent = totalExercises
    ? `En total se han completado ${totalExercises} ejercicios. ¡Cada ratito cuenta!`
    : "Todavía no hay ejercicios registrados.";
  rootEl.appendChild(note);
}
