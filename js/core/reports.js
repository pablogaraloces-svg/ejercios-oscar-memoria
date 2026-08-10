import { DB } from "./db.js";

/**
 * reports.js — Construye datos de evolución y los dibuja en <canvas>.
 * Todo calculado localmente a partir del historial de sesiones guardado.
 */
export async function getSessionsForProfile(profileId) {
  const all = await DB.getAll("sessions");
  return all
    .filter((s) => s.profileId === profileId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function summarize(sessions) {
  const last14 = sessions.slice(-14);
  const totalSessions = sessions.length;
  const totalExercises = sessions.reduce((acc, s) => acc + (s.exercisesCompleted || 0), 0);
  const avgAccuracy =
    sessions.length === 0
      ? 0
      : Math.round(
          (sessions.reduce((acc, s) => acc + (s.accuracy || 0), 0) / sessions.length) * 100
        );
  const streak = computeStreak(sessions);
  return { last14, totalSessions, totalExercises, avgAccuracy, streak };
}

function computeStreak(sessions) {
  const days = new Set(sessions.map((s) => s.date));
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const key = cursor.toDateString();
    if (days.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

/** Dibuja una gráfica de barras simple y cálida en un canvas dado. */
export function drawAccuracyChart(canvas, sessions) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const data = sessions.slice(-10);
  if (data.length === 0) {
    ctx.fillStyle = "#5A5A5A";
    ctx.font = "24px sans-serif";
    ctx.fillText("Todavía no hay sesiones registradas", 20, h / 2);
    return;
  }

  const padding = 40;
  const barGap = 14;
  const chartW = w - padding * 2;
  const chartH = h - padding * 2;
  const barW = chartW / data.length - barGap;

  // ejes
  ctx.strokeStyle = "#E4DFD3";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, h - padding);
  ctx.lineTo(w - padding, h - padding);
  ctx.stroke();

  data.forEach((s, i) => {
    const value = Math.max(0, Math.min(1, s.accuracy || 0));
    const barH = chartH * value;
    const x = padding + i * (barW + barGap);
    const y = h - padding - barH;

    const grad = ctx.createLinearGradient(0, y, 0, h - padding);
    grad.addColorStop(0, "#6FBF8B");
    grad.addColorStop(1, "#FFB454");
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barW, barH, 10);
    ctx.fill();

    ctx.fillStyle = "#5A5A5A";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    const label = s.date.split(" ").slice(1, 3).join(" ");
    ctx.fillText(label, x + barW / 2, h - padding + 22);
    ctx.fillText(`${Math.round(value * 100)}%`, x + barW / 2, y - 8);
  });
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, h);
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}
