/**
 * adaptiveDifficulty.js — Ajusta la dificultad SIN que el usuario lo note.
 * Reglas: si falla, baja. Si acierta bien (sin ayudas), sube muy poco.
 * Rango de dificultad: 1 (muy fácil) a 10 (más exigente, siempre amable).
 */
import { DB } from "./db.js";

const MIN_LEVEL = 1;
const MAX_LEVEL = 10;

export async function getLevel(profileId, category) {
  const rec = await DB.get("progress", `${profileId}_${category}`);
  return rec?.level ?? 2; // se empieza suave, nunca al máximo
}

export async function reportResult(profileId, category, { success, usedHints = 0 }) {
  const id = `${profileId}_${category}`;
  const rec = (await DB.get("progress", id)) || {
    id,
    profileId,
    category,
    level: 2,
    streak: 0,
    history: [],
  };

  if (success && usedHints === 0) {
    rec.streak = (rec.streak || 0) + 1;
    // Sube muy poco, y solo tras aciertos consecutivos limpios
    if (rec.streak >= 2) {
      rec.level = Math.min(MAX_LEVEL, rec.level + 1);
      rec.streak = 0;
    }
  } else if (success && usedHints > 0) {
    rec.streak = 0; // se mantiene, no sube ni baja
  } else {
    rec.streak = 0;
    rec.level = Math.max(MIN_LEVEL, rec.level - 1);
  }

  rec.history = [...(rec.history || []).slice(-49), { t: Date.now(), success, usedHints }];
  await DB.put("progress", rec);
  return rec.level;
}

export async function getAllProgress(profileId) {
  const all = await DB.getAll("progress");
  return all.filter((r) => r.profileId === profileId);
}
