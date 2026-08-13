/**
 * music.js — Música de fondo relajante y motivadora, 100% generada en el
 * dispositivo con Web Audio API (no requiere descargar ningún archivo,
 * así que funciona sin conexión). Un pad suave en escala mayor pentatónica
 * con una ligera variación aleatoria para que no suene mecánico.
 */
let audioCtx = null;
let masterGain = null;
let padNodes = [];
let running = false;
let scheduleTimer = null;

const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // Do mayor pentatónica

function ensureContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function playNote(freq, duration, startTime) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.5, startTime + duration * 0.3);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);
  padNodes.push(osc);
}

function scheduleLoop() {
  if (!running || !audioCtx) return;
  const now = audioCtx.currentTime;
  const noteDur = 3.2 + Math.random() * 1.6;
  const freq = SCALE[Math.floor(Math.random() * SCALE.length)];
  playNote(freq, noteDur, now + 0.05);
  // acorde suave de fondo ocasional
  if (Math.random() > 0.6) {
    const freq2 = SCALE[Math.floor(Math.random() * SCALE.length)] / 2;
    playNote(freq2, noteDur * 1.3, now + 0.1);
  }
  padNodes = padNodes.filter((n) => n);
  scheduleTimer = setTimeout(scheduleLoop, noteDur * 700);
}

export const Music = {
  start(volume = 0.35) {
    const ctx = ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    running = true;
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.4);
    if (!scheduleTimer) scheduleLoop();
  },
  stop() {
    running = false;
    if (masterGain && audioCtx) {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.8);
    }
    clearTimeout(scheduleTimer);
    scheduleTimer = null;
  },
  setVolume(v) {
    if (masterGain && audioCtx && running) {
      masterGain.gain.linearRampToValueAtTime(v, audioCtx.currentTime + 0.3);
    }
  },
  isRunning() {
    return running;
  },
};
