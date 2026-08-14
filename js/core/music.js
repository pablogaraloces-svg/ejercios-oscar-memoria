/**
 * music.js — Música de fondo relajante, 100% generada en el dispositivo
 * con Web Audio API (no requiere descargar nada, funciona sin conexión).
 * Se ofrecen 5 variantes distintas para poder cambiar el ambiente.
 */
let audioCtx = null;
let masterGain = null;
let running = false;
let scheduleTimer = null;
let currentTrack = 0;

export const TRACKS = [
  { name: "Amanecer tranquilo", scale: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25], tempo: 1.0, wave: "sine" },
  { name: "Brisa suave", scale: [220.0, 246.94, 277.18, 329.63, 369.99, 440.0], tempo: 1.15, wave: "sine" },
  { name: "Tarde de piano", scale: [261.63, 311.13, 349.23, 392.0, 466.16, 523.25], tempo: 0.85, wave: "triangle" },
  { name: "Jardín sereno", scale: [293.66, 329.63, 392.0, 440.0, 493.88, 587.33], tempo: 1.05, wave: "sine" },
  { name: "Manta cálida", scale: [196.0, 220.0, 246.94, 293.66, 329.63, 392.0], tempo: 0.75, wave: "triangle" },
];

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

function playNote(freq, duration, startTime, wave) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.5, startTime + duration * 0.3);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.1);
}

function scheduleLoop() {
  if (!running || !audioCtx) return;
  const track = TRACKS[currentTrack] || TRACKS[0];
  const now = audioCtx.currentTime;
  const noteDur = (3.2 + Math.random() * 1.6) * track.tempo;
  const freq = track.scale[Math.floor(Math.random() * track.scale.length)];
  playNote(freq, noteDur, now + 0.05, track.wave);
  if (Math.random() > 0.6) {
    const freq2 = track.scale[Math.floor(Math.random() * track.scale.length)] / 2;
    playNote(freq2, noteDur * 1.3, now + 0.1, track.wave);
  }
  scheduleTimer = setTimeout(scheduleLoop, noteDur * 700);
}

export const Music = {
  setTrack(index) {
    currentTrack = Math.max(0, Math.min(TRACKS.length - 1, index));
  },
  getTrack() {
    return currentTrack;
  },
  start(volume = 0.35, trackIndex = null) {
    const ctx = ensureContext();
    if (!ctx) return;
    if (trackIndex !== null) this.setTrack(trackIndex);
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
