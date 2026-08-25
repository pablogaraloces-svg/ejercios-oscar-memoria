import { DB } from "./db.js";
import { CATEGORY_LABELS } from "../exercises/index.js";
import { getDateKey, formatDateShortEs } from "./dateUtils.js";

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

/**
 * Borra las estadísticas de evolución (sesiones, progreso/dificultad por
 * categoría, estados de ánimo y cumplimiento de recordatorios) SIN tocar
 * el perfil, la familia, las fotos, los recordatorios configurados ni
 * ningún ajuste de la aplicación (voz, música, PIN, accesibilidad...).
 */
export async function resetStats(profileId) {
  const [sessions, progress, settingsEntries] = await Promise.all([
    DB.getAll("sessions"),
    DB.getAll("progress"),
    DB.getAll("settings"),
  ]);

  const deletions = [];
  sessions.filter((s) => s.profileId === profileId).forEach((s) => deletions.push(DB.delete("sessions", s.id)));
  progress.filter((p) => p.profileId === profileId).forEach((p) => deletions.push(DB.delete("progress", p.id)));
  settingsEntries
    .filter((e) => (e.id?.startsWith("mood_") || e.id?.startsWith("done_")) && e.profileId === profileId)
    .forEach((e) => deletions.push(DB.delete("settings", e.id)));

  await Promise.all(deletions);
}

/**
 * Restablece SOLO una categoría concreta (p.ej. "Memoria"), sin tocar
 * ninguna otra estadística, ni las sesiones, ni la familia, ni la salud.
 * Borra su registro de progreso (nivel adaptativo + historial de
 * aciertos/fallos), que es de donde salen tanto el nivel de dificultad
 * como el porcentaje mostrado en "Dónde tiene más dificultad".
 */
export async function resetCategoryStat(profileId, category) {
  await DB.delete("progress", `${profileId}_${category}`);
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
    const key = getDateKey(cursor);
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
    const label = formatDateShortEs(s.date);
    ctx.fillText(label, x + barW / 2, h - padding + 22);
    ctx.fillText(`${Math.round(value * 100)}%`, x + barW / 2, y - 8);
  });
}

/** ---------- Tiempo total dedicado por día (varias sesiones se suman) ---------- */
export function getDailyDurationTotals(sessions) {
  const byDate = {};
  sessions.forEach((s) => {
    byDate[s.date] = (byDate[s.date] || 0) + (s.durationMin || 0);
  });
  return Object.entries(byDate)
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function drawDurationChart(canvas, series) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const data = series.slice(-10);
  if (!data.length) {
    ctx.fillStyle = "#5A5A5A";
    ctx.font = "20px sans-serif";
    ctx.fillText("Todavía no hay sesiones registradas", 20, h / 2);
    return;
  }
  const padding = 44;
  const chartW = w - padding * 2;
  const chartH = h - padding * 2;
  const barGap = 16;
  const barW = chartW / data.length - barGap;
  const max = Math.max(...data.map((d) => d.minutes), 1);

  ctx.strokeStyle = "#E4DFD3";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, h - padding);
  ctx.lineTo(w - padding, h - padding);
  ctx.stroke();

  data.forEach((d, i) => {
    const barH = (d.minutes / max) * chartH;
    const x = padding + i * (barW + barGap);
    const y = h - padding - barH;
    const grad = ctx.createLinearGradient(0, y, 0, h - padding);
    grad.addColorStop(0, "#F5A93E");
    grad.addColorStop(1, "#4E7FBF");
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barW, Math.max(barH, 2), 8);
    ctx.fill();
    ctx.fillStyle = "#5A5A5A";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    const label = formatDateShortEs(d.date);
    ctx.fillText(label, x + barW / 2, h - padding + 20);
    ctx.fillText(`${d.minutes} min`, x + barW / 2, y - 8);
  });
}

/** ---------- Distribución de sesiones por hora del día ---------- */
export function getSessionHourDistribution(sessions) {
  const buckets = new Array(24).fill(0);
  sessions.forEach((s) => {
    const h = typeof s.hour === "number" ? s.hour : new Date(s.timestamp).getHours();
    buckets[h] = (buckets[h] || 0) + 1;
  });
  return buckets;
}

export function drawHourChart(canvas, buckets) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const total = buckets.reduce((a, b) => a + b, 0);
  if (!total) {
    ctx.fillStyle = "#5A5A5A";
    ctx.font = "20px sans-serif";
    ctx.fillText("Todavía no hay sesiones registradas", 20, h / 2);
    return;
  }
  const padding = 40;
  const chartW = w - padding * 2;
  const chartH = h - padding * 2;
  const barW = chartW / 24;
  const max = Math.max(...buckets, 1);

  buckets.forEach((v, hour) => {
    const barH = (v / max) * chartH;
    const x = padding + hour * barW;
    const y = h - padding - barH;
    ctx.fillStyle = "#5E81AC";
    roundRect(ctx, x + 2, y, barW - 4, Math.max(barH, v ? 2 : 0), 6);
    ctx.fill();
    if (hour % 3 === 0) {
      ctx.fillStyle = "#5A5A5A";
      ctx.font = "13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${hour}h`, x + barW / 2, h - padding + 18);
    }
  });
}

/** ---------- Ánimo por día del mes (para el calendario) ---------- */
const MOOD_ORDER = ["Muy bien", "Bien", "Regular", "No muy bien"];
const MOOD_RANK = { "Muy bien": 0, "Bien": 1, "Regular": 2, "No muy bien": 3 };

export async function getMoodByDate(profileId) {
  const all = await DB.getAll("settings");
  const moods = all.filter((r) => r.id?.startsWith("mood_") && r.profileId === profileId);
  const byDate = {};
  moods.forEach((m) => {
    // Si hay varias respuestas el mismo día, nos quedamos con la menos positiva
    if (!byDate[m.date] || MOOD_RANK[m.value] > MOOD_RANK[byDate[m.date]]) {
      byDate[m.date] = m.value;
    }
  });
  return byDate;
}

export function summarizeMoodByDate(byDate) {
  const counts = { "Muy bien": 0, "Bien": 0, "Regular": 0, "No muy bien": 0 };
  Object.values(byDate).forEach((v) => {
    if (counts[v] !== undefined) counts[v]++;
  });
  return counts;
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

/** ---------- Fallos por categoría de ejercicio ---------- */
export async function getCategoryStats(profileId) {
  const all = await DB.getAll("progress");
  const mine = all.filter((r) => r.profileId === profileId);
  return mine.map((r) => {
    const history = r.history || [];
    const total = history.length;
    // "Dificultad" = proporción de intentos que NO fueron un acierto
    // limpio a la primera (o bien falló del todo, o necesitó alguna
    // pista antes de acertar). Antes solo se contaban los fallos totales
    // (cuando Óscar se rendía tras 4 intentos seguidos), lo que
    // infravaloraba mucho la dificultad real: acertar tras 2 o 3 fallos
    // se contaba exactamente igual que acertar a la primera. Se reutiliza
    // el mismo dato que ya se guardaba (usedHints), sin ningún cálculo
    // ni almacenamiento nuevo.
    const struggled = history.filter((h) => !h.success || (h.usedHints || 0) > 0).length;
    const failRate = total ? struggled / total : 0;
    // Porcentaje de aciertos "puro" (independiente de si necesitó
    // pistas): estadística distinta a la dificultad, para la sección de
    // "Estadísticas cognitivas" del PDF y de la pantalla.
    const successes = history.filter((h) => h.success).length;
    const successRate = total ? successes / total : 0;
    return {
      category: r.category,
      label: CATEGORY_LABELS[r.category] || r.category,
      total,
      fails: struggled,
      failRate,
      successRate,
      level: r.level ?? 2,
    };
  }).filter((c) => c.total > 0);
}

export function drawCategoryErrorChart(canvas, stats) {
  const ctx = canvas.getContext("2d");
  if (!stats.length) {
    canvas.width = 900;
    canvas.height = 260;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#5A5A5A";
    ctx.font = "22px sans-serif";
    ctx.fillText("Todavía no hay suficientes datos", 20, canvas.height / 2);
    return;
  }

  // El lienzo se ensancha según haga falta para que cada categoría tenga
  // un hueco mínimo cómodo — con muchas categorías, el gráfico se hace
  // más ancho (y su contenedor permite scroll horizontal) en vez de
  // apretujar las barras hasta que los títulos se pisen entre sí.
  const padding = 44;
  const minBarW = 96;
  const barGap = 22;
  const neededW = stats.length * (minBarW + barGap) + padding * 2;
  const w = Math.max(900, neededW);
  const h = 280;
  canvas.width = w;
  canvas.height = h;
  ctx.clearRect(0, 0, w, h);

  const axisY = h - padding - 30; // se reserva espacio abajo para la etiqueta de cada categoría
  const chartH = axisY - padding;
  const chartW = w - padding * 2;
  const barW = chartW / stats.length - barGap;

  ctx.strokeStyle = "#E4DFD3";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, axisY);
  ctx.lineTo(w - padding, axisY);
  ctx.stroke();

  ctx.textAlign = "center";
  stats.forEach((s, i) => {
    const barH = chartH * s.failRate;
    const x = padding + i * (barW + barGap);
    const y = axisY - barH;
    const grad = ctx.createLinearGradient(0, y, 0, axisY);
    grad.addColorStop(0, "#EF798A");
    grad.addColorStop(1, "#FFB454");
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barW, Math.max(barH, 2), 10);
    ctx.fill();

    ctx.fillStyle = "#5A5A5A";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`${Math.round(s.failRate * 100)}%`, x + barW / 2, Math.max(y - 8, padding - 4));

    // La etiqueta ajusta su tamaño de letra y, si aun así no cabe, se
    // parte en dos líneas — nunca se deja un título montado sobre otro.
    drawWrappedLabel(ctx, s.label, x + barW / 2, axisY + 22, barW + barGap - 6);
  });
}

/** Escribe una etiqueta centrada, reduciendo el tamaño de letra o
 * partiéndola en dos líneas si no cabe en el ancho disponible. */
function drawWrappedLabel(ctx, text, cx, topY, maxWidth) {
  ctx.font = "600 16px sans-serif";
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, cx, topY);
    return;
  }
  ctx.font = "600 13px sans-serif";
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, cx, topY);
    return;
  }
  const words = text.split(" ");
  if (words.length > 1) {
    const mid = Math.ceil(words.length / 2);
    ctx.fillText(words.slice(0, mid).join(" "), cx, topY);
    ctx.fillText(words.slice(mid).join(" "), cx, topY + 15);
  } else {
    ctx.fillText(text, cx, topY);
  }
}

/** ---------- Estados de ánimo marcados por día ---------- */
export async function getMoodStats(profileId) {
  const all = await DB.getAll("settings");
  const moods = all.filter((r) => r.id?.startsWith("mood_") && r.profileId === profileId);
  const counts = {};
  moods.forEach((m) => {
    counts[m.value] = (counts[m.value] || 0) + 1;
  });
  return counts;
}

export function drawMoodChart(canvas, counts) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const order = [
    { label: "Muy bien", emoji: "😊", color: "#6FBF8B" },
    { label: "Bien", emoji: "🙂", color: "#A9D6B8" },
    { label: "Regular", emoji: "😐", color: "#FFB454" },
    { label: "No muy bien", emoji: "😕", color: "#EF798A" },
  ];
  const total = order.reduce((acc, o) => acc + (counts[o.label] || 0), 0);
  if (!total) {
    ctx.fillStyle = "#5A5A5A";
    ctx.font = "22px sans-serif";
    ctx.fillText("Todavía no hay respuestas de ánimo registradas", 20, h / 2);
    return;
  }
  const padding = 44;
  const chartW = w - padding * 2;
  const chartH = h - padding * 2;
  const barGap = 26;
  const barW = chartW / order.length - barGap;

  order.forEach((o, i) => {
    const value = counts[o.label] || 0;
    const ratio = value / total;
    const barH = chartH * ratio;
    const x = padding + i * (barW + barGap);
    const y = h - padding - barH;
    ctx.fillStyle = o.color;
    roundRect(ctx, x, y, barW, Math.max(barH, 2), 10);
    ctx.fill();
    ctx.font = "28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(o.emoji, x + barW / 2, y - 12);
    ctx.fillStyle = "#5A5A5A";
    ctx.font = "15px sans-serif";
    ctx.fillText(`${value}`, x + barW / 2, h - padding + 22);
  });
}

/** ---------- Cumplimiento de recordatorios ---------- */
export async function getReminderAdherence(profileId) {
  const [reminders, all] = await Promise.all([
    DB.getAll("reminders").then((r) => r.filter((x) => x.profileId === profileId && x.enabled)),
    DB.getAll("settings"),
  ]);
  const doneEntries = all.filter((r) => r.id?.startsWith("done_") && r.profileId === profileId && r.done);
  const byDate = {};
  doneEntries.forEach((d) => {
    byDate[d.date] = (byDate[d.date] || 0) + 1;
  });
  const days = Object.keys(byDate).sort();
  const totalReminders = reminders.length || 1;
  const series = days.map((d) => ({ date: d, rate: Math.min(1, byDate[d] / totalReminders) }));
  const overall = series.length
    ? series.reduce((acc, s) => acc + s.rate, 0) / series.length
    : 0;
  return { series, overall, totalReminders: reminders.length };
}

export function drawAdherenceChart(canvas, series) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const data = series.slice(-10);
  if (!data.length) {
    ctx.fillStyle = "#5A5A5A";
    ctx.font = "22px sans-serif";
    ctx.fillText("Todavía no hay recordatorios marcados", 20, h / 2);
    return;
  }
  const padding = 44;
  const chartW = w - padding * 2;
  const chartH = h - padding * 2;
  const barGap = 14;
  const barW = chartW / data.length - barGap;

  ctx.strokeStyle = "#E4DFD3";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, h - padding);
  ctx.lineTo(w - padding, h - padding);
  ctx.stroke();

  data.forEach((s, i) => {
    const barH = chartH * s.rate;
    const x = padding + i * (barW + barGap);
    const y = h - padding - barH;
    const grad = ctx.createLinearGradient(0, y, 0, h - padding);
    grad.addColorStop(0, "#5E81AC");
    grad.addColorStop(1, "#6FBF8B");
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, barW, Math.max(barH, 2), 10);
    ctx.fill();
    ctx.fillStyle = "#5A5A5A";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    const label = formatDateShortEs(s.date);
    ctx.fillText(label, x + barW / 2, h - padding + 20);
    ctx.fillText(`${Math.round(s.rate * 100)}%`, x + barW / 2, y - 8);
  });
}
