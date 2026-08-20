import { DB, uid } from "./db.js";
import { getDateKey } from "./dateUtils.js";

/**
 * health.js — Registro histórico de salud (oxígeno en sangre y tensión
 * arterial). Cada medición se guarda como un registro independiente con
 * fecha y hora (nunca se sobrescribe una medición anterior), igual que las
 * sesiones diarias.
 */

export async function addHealthEntry(profileId, { oxygen, systolic, diastolic }) {
  const now = new Date();
  const entry = {
    id: uid("health"),
    profileId,
    date: getDateKey(now),
    time: now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    timestamp: now.getTime(),
    oxygen: oxygen === "" || oxygen === null ? null : Number(oxygen),
    systolic: systolic === "" || systolic === null ? null : Number(systolic),
    diastolic: diastolic === "" || diastolic === null ? null : Number(diastolic),
  };
  await DB.put("health", entry);
  return entry;
}

export async function getHealthEntries(profileId) {
  const all = await DB.getAll("health");
  return all
    .filter((e) => e.profileId === profileId)
    .sort((a, b) => b.timestamp - a.timestamp); // más reciente primero
}

/** Promedios del mes indicado (por defecto, el mes actual), calculados por separado. */
export async function getMonthlyHealthAverages(profileId, year, month) {
  const entries = await getHealthEntries(profileId);
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth();

  const inMonth = entries.filter((e) => {
    const d = new Date(e.timestamp);
    return d.getFullYear() === y && d.getMonth() === m;
  });

  const avg = (values) => {
    const nums = values.filter((v) => typeof v === "number" && !Number.isNaN(v));
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  };

  return {
    year: y,
    month: m,
    count: inMonth.length,
    avgOxygen: avg(inMonth.map((e) => e.oxygen)),
    avgSystolic: avg(inMonth.map((e) => e.systolic)),
    avgDiastolic: avg(inMonth.map((e) => e.diastolic)),
  };
}

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function monthLabel(month) {
  return MONTH_NAMES[month] || "";
}

export function formatAverage(value, decimals = 1) {
  if (value === null || value === undefined) return "—";
  return value.toFixed(decimals).replace(".", ",");
}
