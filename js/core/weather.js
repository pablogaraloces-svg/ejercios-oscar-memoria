/**
 * weather.js — Meteorología sencilla para la portada. Usa la ubicación del
 * dispositivo (si el usuario la autoriza) y un servicio meteorológico
 * abierto (Open-Meteo, sin necesidad de clave de API).
 *
 * Principio general: esto NUNCA debe bloquear ni romper la aplicación. Si
 * algo falla (sin permiso, sin red, servicio caído...), simplemente se
 * devuelve `null` y quien llame oculta el bloque meteorológico.
 */

const CODE_INFO = {
  0: { icon: "☀️", label: "Despejado" },
  1: { icon: "🌤️", label: "Poco nuboso" },
  2: { icon: "⛅", label: "Parcialmente nublado" },
  3: { icon: "☁️", label: "Nublado" },
  45: { icon: "🌫️", label: "Niebla" },
  48: { icon: "🌫️", label: "Niebla" },
  51: { icon: "🌦️", label: "Llovizna" },
  53: { icon: "🌦️", label: "Llovizna" },
  55: { icon: "🌦️", label: "Llovizna" },
  61: { icon: "🌧️", label: "Lluvia" },
  63: { icon: "🌧️", label: "Lluvia" },
  65: { icon: "🌧️", label: "Lluvia fuerte" },
  71: { icon: "❄️", label: "Nieve" },
  73: { icon: "❄️", label: "Nieve" },
  75: { icon: "❄️", label: "Nieve fuerte" },
  80: { icon: "🌦️", label: "Chubascos" },
  81: { icon: "🌦️", label: "Chubascos" },
  82: { icon: "🌧️", label: "Chubascos fuertes" },
  95: { icon: "⛈️", label: "Tormenta" },
  96: { icon: "⛈️", label: "Tormenta" },
  99: { icon: "⛈️", label: "Tormenta" },
};

function describeCode(code) {
  return CODE_INFO[code] || { icon: "🌡️", label: "" };
}

function getPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null), // permiso denegado o error: no bloquear, seguir sin tiempo
      { timeout: 6000, maximumAge: 20 * 60 * 1000 }
    );
  });
}

let cache = null; // { data, fetchedAt }
const CACHE_MS = 20 * 60 * 1000; // 20 minutos

/** Devuelve { temp, icon, label } o null si no se ha podido obtener. */
export async function getWeather() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache.data;

  try {
    const pos = await getPosition();
    if (!pos) return null;

    const { latitude, longitude } = pos.coords;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const json = await res.json();
    const temp = json?.current?.temperature_2m;
    const code = json?.current?.weather_code;
    if (typeof temp !== "number") return null;

    const { icon, label } = describeCode(code);
    const data = { temp: Math.round(temp), icon, label };
    cache = { data, fetchedAt: Date.now() };
    return data;
  } catch (err) {
    return null; // sin red, tiempo agotado, etc. — nunca romper la app
  }
}
