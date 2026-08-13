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

function isSpanish(v) {
  return v.lang?.toLowerCase().startsWith("es");
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

  /** Lista de voces en español disponibles en este dispositivo (incluye Google TTS si está instalado). */
  getAvailableVoices() {
    if (typeof speechSynthesis === "undefined") return [];
    const all = speechSynthesis.getVoices();
    const spanish = all.filter(isSpanish);
    return (spanish.length ? spanish : all).map((v) => ({
      uri: v.voiceURI,
      name: v.name,
      isGoogle: /google/i.test(v.name),
      lang: v.lang,
    }));
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

  say(text, { onEnd } = {}) {
    if (!enabled || typeof speechSynthesis === "undefined" || !text) {
      if (onEnd) onEnd();
      return;
    }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "es-ES";
    utter.rate = 0.92;
    utter.pitch = 1.03;
    if (selectedVoice) utter.voice = selectedVoice;
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
