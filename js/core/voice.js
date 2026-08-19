/**
 * voice.js — Voz cercana y opcional (SpeechSynthesis nativo del dispositivo).
 * No requiere red: en Android, Chrome expone las voces instaladas en el
 * sistema, entre ellas las del motor "Google Text-to-Speech" si la
 * familia lo tiene instalado. Aquí simplemente las listamos y dejamos
 * elegir; no se llama a ningún servicio en la nube.
 */
let enabled = false;
let selectedVoice = null;
let selectedURI = null;
let voicesReadyCallbacks = [];
let rate = 0.92; // velocidad: lenta ~0.75, normal ~0.92, rápida ~1.12
let pitch = 1.0; // tono: se permite un margen pequeño para no sonar artificial

function isSpanish(v) {
  return v.lang?.toLowerCase().startsWith("es");
}

const FEMALE_HINTS = /female|mujer|helena|paulina|mónica|monica|elvira|lucia|lucía|marisol|conchita|penélope|penelope|carmen/i;
const MALE_HINTS = /male|hombre|jorge|diego|pablo|carlos|enrique|miguel|juan(?!a)/i;

function guessGender(name) {
  if (FEMALE_HINTS.test(name)) return "mujer";
  if (MALE_HINTS.test(name)) return "hombre";
  return "sin especificar";
}

function refreshVoices() {
  if (typeof speechSynthesis === "undefined") return [];
  const voices = speechSynthesis.getVoices();
  if (selectedURI) {
    selectedVoice = voices.find((v) => v.voiceURI === selectedURI) || selectedVoice;
  }
  if (!selectedVoice) {
    selectedVoice =
      voices.find((v) => isSpanish(v) && /google/i.test(v.name)) ||
      voices.find((v) => isSpanish(v)) ||
      voices[0] ||
      null;
  }
  if (voices.length) {
    voicesReadyCallbacks.forEach((cb) => cb(voices));
    voicesReadyCallbacks = [];
  }
  return voices;
}

if (typeof speechSynthesis !== "undefined") {
  speechSynthesis.onvoiceschanged = refreshVoices;
  refreshVoices();
}

export const Voice = {
  setEnabled(v) {
    enabled = v;
    if (!v && typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  },
  isEnabled() {
    return enabled;
  },

  /** Lista de voces disponibles en este dispositivo — incluye todas las
   * instaladas (Google, Samsung, u otros motores del sistema), no solo
   * español, para que la familia pueda ver todos los "asistentes de voz"
   * que ofrece la tablet. Las voces en español aparecen primero. */
  getAvailableVoices() {
    if (typeof speechSynthesis === "undefined") return [];
    const all = speechSynthesis.getVoices();
    const withMeta = all.map((v) => ({
      uri: v.voiceURI,
      name: v.name,
      isGoogle: /google/i.test(v.name),
      lang: v.lang,
      gender: guessGender(v.name),
    }));
    return withMeta.sort((a, b) => {
      const aEs = a.lang?.toLowerCase().startsWith("es") ? 0 : 1;
      const bEs = b.lang?.toLowerCase().startsWith("es") ? 0 : 1;
      return aEs - bEs;
    });
  },

  /** Se resuelve cuando la lista de voces del sistema esté cargada (puede tardar un instante). */
  onVoicesReady(cb) {
    if (typeof speechSynthesis === "undefined") return;
    const voices = speechSynthesis.getVoices();
    if (voices.length) cb(voices);
    else voicesReadyCallbacks.push(cb);
  },

  setVoiceURI(uri) {
    selectedURI = uri;
    if (typeof speechSynthesis !== "undefined") {
      const voices = speechSynthesis.getVoices();
      selectedVoice = voices.find((v) => v.voiceURI === uri) || selectedVoice;
    }
  },

  getSelectedURI() {
    return selectedVoice?.voiceURI || null;
  },

  /** Velocidad de habla. Se recomienda usar los presets: 0.75 (lenta), 0.92 (normal), 1.12 (rápida). */
  setRate(v) {
    rate = Math.max(0.5, Math.min(1.6, Number(v) || 0.92));
  },
  getRate() {
    return rate;
  },

  /** Tono de voz. Margen deliberadamente pequeño para que no suene artificial. */
  setPitch(v) {
    pitch = Math.max(0.8, Math.min(1.2, Number(v) || 1.0));
  },
  getPitch() {
    return pitch;
  },

  say(text, { onEnd, onStart } = {}) {
    if (!enabled || typeof speechSynthesis === "undefined" || !text) {
      if (onEnd) onEnd();
      return;
    }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "es-ES";
    utter.rate = rate;
    utter.pitch = pitch;
    if (selectedVoice) utter.voice = selectedVoice;
    if (onStart) utter.onstart = onStart;
    if (onEnd) utter.onend = onEnd;
    speechSynthesis.speak(utter);
  },

  /** Estimación aproximada (ms) de cuánto tardará en leerse un texto, para
   * no cortar animaciones ni avanzar de pantalla demasiado rápido. */
  estimateDurationMs(text) {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).length;
    // ~2.4 palabras/seg a ritmo pausado + margen
    return Math.max(1400, Math.round((words / 2.4) * 1000) + 500);
  },
};
