import { DB, uid } from "./db.js";
import { DEFAULT_REMINDER_CATALOG } from "./state.js";

/**
 * reminders.js — Recordatorios que SOLO aparecen dentro de la sesión diaria,
 * nunca como notificaciones del sistema fuera de la app (la tablet puede
 * estar apagada la mayor parte del día).
 */
export async function getReminders(profileId) {
  const all = await DB.getAll("reminders");
  return all.filter((r) => r.profileId === profileId);
}

export async function addReminder(profileId, { label, emoji, custom = false }) {
  const reminder = {
    id: uid("rem"),
    profileId,
    label,
    emoji: emoji || "✅",
    custom,
    enabled: true,
    createdAt: Date.now(),
  };
  await DB.put("reminders", reminder);
  return reminder;
}

export async function setReminderEnabled(id, enabled) {
  const rem = await DB.get("reminders", id);
  if (!rem) return;
  rem.enabled = enabled;
  await DB.put("reminders", rem);
}

export async function removeReminder(id) {
  await DB.delete("reminders", id);
}

export async function seedDefaultReminders(profileId, selectedKeys = []) {
  const existing = await getReminders(profileId);
  if (existing.length > 0) return existing;
  const toAdd = DEFAULT_REMINDER_CATALOG.filter((c) => selectedKeys.includes(c.key));
  for (const item of toAdd) {
    await addReminder(profileId, { label: item.label, emoji: item.emoji });
  }
  return getReminders(profileId);
}

export async function markReminderDoneToday(profileId, reminderId) {
  const key = `done_${new Date().toDateString()}_${reminderId}`;
  const rec = { id: key, profileId, reminderId, date: new Date().toDateString(), done: true };
  await DB.put("settings", rec);
}

export async function isReminderDoneToday(profileId, reminderId) {
  const key = `done_${new Date().toDateString()}_${reminderId}`;
  const rec = await DB.get("settings", key);
  return !!rec?.done;
}
