/**
 * sounds.js — Pequeños efectos sonoros divertidos al tocar animales,
 * sintetizados con Web Audio (sin archivos externos, funciona offline).
 * Además, si la voz está activada, se dice la onomatopeya en voz alta.
 */
let audioCtx = null;
function ctx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function blip(freqStart, freqEnd, duration, type = "sine") {
  const c = ctx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  const t0 = c.currentTime;
  osc.frequency.setValueAtTime(freqStart, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.4, t0 + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Patrón sonoro simple y simpático asociado a cada tipo de animal. */
const PATTERNS = {
  Perro: () => { blip(300, 180, 0.14); setTimeout(() => blip(300, 180, 0.14), 160); },
  Gato: () => blip(500, 900, 0.28, "sine"),
  Caballo: () => { for (let i = 0; i < 3; i++) setTimeout(() => blip(220 + i * 30, 140, 0.09), i * 110); },
  Vaca: () => blip(160, 110, 0.5, "sawtooth"),
  Oveja: () => blip(400, 320, 0.35, "triangle"),
  Cerdo: () => blip(250, 500, 0.22, "square"),
  Gallina: () => { blip(600, 800, 0.1); setTimeout(() => blip(700, 500, 0.12), 120); },
  Pato: () => blip(350, 300, 0.16, "square"),
  Conejo: () => blip(700, 900, 0.08),
  León: () => blip(140, 90, 0.6, "sawtooth"),
  Elefante: () => blip(200, 700, 0.5, "sawtooth"),
  Mono: () => { blip(500, 700, 0.09); setTimeout(() => blip(600, 800, 0.09), 100); },
  Oso: () => blip(120, 90, 0.4, "sawtooth"),
  Tortuga: () => blip(220, 200, 0.2),
  Pez: () => blip(600, 650, 0.1),
  Pájaro: () => { blip(900, 1200, 0.08); setTimeout(() => blip(1000, 1300, 0.08), 100); },
  Burro: () => blip(200, 500, 0.4, "sawtooth"),
  Cabra: () => blip(380, 300, 0.3, "triangle"),
  Ratón: () => blip(1200, 1500, 0.06),
  Búho: () => blip(300, 220, 0.4, "sine"),
};

export const Sounds = {
  playAnimal(name) {
    const fn = PATTERNS[name];
    if (fn) fn();
    else blip(400, 300, 0.2);
  },
  playPositive() {
    [523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, f, 0.18), i * 90));
  },
  playSoftError() {
    blip(300, 220, 0.25, "sine");
  },
  /** Melodía muy corta y alegre para la pantalla de inicio (una sola vez). */
  playWelcome() {
    [392, 523, 659, 784].forEach((f, i) => setTimeout(() => blip(f, f, 0.22, "triangle"), i * 110));
  },
};
