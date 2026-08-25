import { DB, uid } from "./db.js";

/**
 * gameStats.js — Registro propio de "Cerebrín Saltarín" (partidas
 * jugadas, mejor puntuación, tiempo jugado...). Vive en su propio
 * almacén ("gameStats"), separado por completo de "progress" (donde
 * vive la dificultad adaptativa de memoria/atención/cálculo/etc.) — así
 * que jugar nunca afecta a ninguna estadística cognitiva.
 */

export async function recordGameSession(profileId, gameId, { points, durationMs, completed }) {
  const entry = {
    id: uid("game"),
    profileId,
    gameId,
    points: Math.round(points),
    durationMs: Math.round(durationMs),
    completed: !!completed,
    timestamp: Date.now(),
  };
  await DB.put("gameStats", entry);
  return entry;
}

export async function getGameStats(profileId, gameId) {
  const all = await DB.getAll("gameStats");
  const mine = all.filter((r) => r.profileId === profileId && r.gameId === gameId);
  if (!mine.length) {
    return { plays: 0, bestScore: 0, lastScore: 0, totalTimeMs: 0 };
  }
  const bestScore = Math.max(...mine.map((r) => r.points));
  const last = mine.reduce((a, b) => (a.timestamp > b.timestamp ? a : b));
  const totalTimeMs = mine.reduce((acc, r) => acc + (r.durationMs || 0), 0);
  return { plays: mine.length, bestScore, lastScore: last.points, totalTimeMs };
}
