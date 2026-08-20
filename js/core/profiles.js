import { DB, uid } from "./db.js";

/**
 * profiles.js — Soporte de varios perfiles en la misma aplicación
 * (varias personas usando la misma tablet, cada una con sus propias
 * estadísticas, familia, recordatorios y salud).
 *
 * Todo lo demás en la app (sesiones, recordatorios, progreso, salud,
 * familia) ya vivía guardado con su propio `profileId`, así que cambiar
 * de perfil activo no necesita ningún cambio adicional en el resto del
 * código: basta con cambiar qué objeto `profile` usa la app.
 */

export async function getAllProfiles() {
  const all = await DB.getAll("profile");
  return all.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

export async function createProfile({ name, photo = null, age = null }) {
  const profile = {
    id: uid("profile"),
    name,
    photo,
    age,
    weight: null,
    height: null,
    notes: "",
    medications: { morning: [], noon: [], night: [] },
    family: [],
    enabledCategories: [],
    createdAt: Date.now(),
  };
  await DB.put("profile", profile);
  return profile;
}

/**
 * Elimina un perfil y TODOS sus datos asociados (recordatorios, progreso,
 * sesiones, salud) — para no dejar información huérfana guardada sin
 * ningún perfil al que pertenezca. Nunca borra el perfil si es el único
 * que queda: la app necesita al menos uno.
 */
export async function deleteProfileCascade(profileId) {
  const all = await getAllProfiles();
  if (all.length <= 1) {
    return { ok: false, reason: "ultimo-perfil" };
  }

  const [reminders, progress, sessions, health, settingsEntries] = await Promise.all([
    DB.getAll("reminders"),
    DB.getAll("progress"),
    DB.getAll("sessions"),
    DB.getAll("health"),
    DB.getAll("settings"),
  ]);

  const deletions = [
    ...reminders.filter((r) => r.profileId === profileId).map((r) => DB.delete("reminders", r.id)),
    ...progress.filter((p) => p.profileId === profileId).map((p) => DB.delete("progress", p.id)),
    ...sessions.filter((s) => s.profileId === profileId).map((s) => DB.delete("sessions", s.id)),
    ...health.filter((h) => h.profileId === profileId).map((h) => DB.delete("health", h.id)),
    ...settingsEntries
      .filter((e) => (e.id?.startsWith("mood_") || e.id?.startsWith("done_")) && e.profileId === profileId)
      .map((e) => DB.delete("settings", e.id)),
  ];
  await Promise.all(deletions);
  await DB.delete("profile", profileId);

  return { ok: true };
}
