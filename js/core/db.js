/**
 * db.js — Capa de persistencia offline (IndexedDB).
 * Guarda: perfil, recordatorios, progreso por ejercicio, historial de sesiones.
 * Diseño modular: cualquier función futura puede añadir su propio "store"
 * sin tocar el resto de la app.
 */

const DB_NAME = "acompanante-db";
const DB_VERSION = 2; // v2: añade el almacén "health" (Administración > Salud). No borra nada existente.
const STORES = ["profile", "reminders", "progress", "sessions", "settings", "health"];

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx(storeName, mode = "readonly") {
  const db = await openDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

export const DB = {
  async get(store, id) {
    const s = await tx(store);
    return new Promise((resolve, reject) => {
      const r = s.get(id);
      r.onsuccess = () => resolve(r.result || null);
      r.onerror = () => reject(r.error);
    });
  },

  async getAll(store) {
    const s = await tx(store);
    return new Promise((resolve, reject) => {
      const r = s.getAll();
      r.onsuccess = () => resolve(r.result || []);
      r.onerror = () => reject(r.error);
    });
  },

  async put(store, value) {
    const s = await tx(store, "readwrite");
    return new Promise((resolve, reject) => {
      const r = s.put(value);
      r.onsuccess = () => resolve(value);
      r.onerror = () => reject(r.error);
    });
  },

  async delete(store, id) {
    const s = await tx(store, "readwrite");
    return new Promise((resolve, reject) => {
      const r = s.delete(id);
      r.onsuccess = () => resolve(true);
      r.onerror = () => reject(r.error);
    });
  },

  async clear(store) {
    const s = await tx(store, "readwrite");
    return new Promise((resolve, reject) => {
      const r = s.clear();
      r.onsuccess = () => resolve(true);
      r.onerror = () => reject(r.error);
    });
  },
};

export function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
