/**
 * voice.js — Voz cercana y opcional (SpeechSynthesis nativo del dispositivo).
 * No requiere red: Android trae motores de voz instalados en el sistema.
 */
let enabled = false;
let voice = null;

function pickSpanishVoice() {
  const voices = speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang?.startsWith("es") && /female|mujer|es-es/i.test(v.name)) ||
    voices.find((v) => v.lang?.startsWith("es")) ||
    voices[0] ||
    null
  );
}

if (typeof speechSynthesis !== "undefined") {
  speechSynthesis.onvoiceschanged = () => {
    voice = pickSpanishVoice();
  };
  voice = pickSpanishVoice();
}

export const Voice = {
  setEnabled(v) {
    enabled = v;
    if (!v && typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  },
  isEnabled() {
    return enabled;
  },
  say(text) {
    if (!enabled || typeof speechSynthesis === "undefined" || !text) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "es-ES";
    utter.rate = 0.92;
    utter.pitch = 1.02;
    if (voice) utter.voice = voice;
    speechSynthesis.speak(utter);
  },
};
