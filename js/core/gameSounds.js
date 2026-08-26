/**
 * gameSounds.js — Música arcade y efectos de sonido de "Cerebrín
 * Saltarín". Módulo independiente de core/music.js y core/sounds.js (la
 * música del resto de la app es relajante; esta es alegre, dinámica y
 * con un aire retro de videojuego, así que conviene no mezclarlas).
 *
 * La voz de Cerebrín tiene prioridad: cada efecto de sonido "agacha"
 * un instante el volumen de la música, y las frases habladas (a través
 * de core/voice.js) se reproducen igual con independencia de esta música.
 */

let audioCtx = null;
let musicGain = null;
let sfxGain = null;
let running = false;
let scheduleTimer = null;
let nextStepTime = 0;
let stepIndex = 0;
let baseMusicVolume = 0.16;
// Subido de nuevo (segunda ronda de ajuste): el usuario sigue
// notándolo bajo incluso con el regulador al máximo. Se comprobó con
// una simulación que, incluso en el peor caso posible (varios sonidos
// solapados a la vez), no llega a saturar.
const BASE_SFX_LEVEL = 2.0;
let masterVolume = 1; // control de volumen general del juego (0-1), ajustable desde el propio juego

function ensureContext() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(audioCtx.destination);
    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = BASE_SFX_LEVEL * masterVolume;
    sfxGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

/** Volumen de música "objetivo" actual, ya con el control general
 * aplicado — la música nunca debe superar a la voz ni a los efectos. */
function effectiveMusicVolume() {
  return baseMusicVolume * masterVolume;
}

// Patrón de 16 pasos (dos compases), con silencios propios para que
// suene con más vida que una simple repetición nota-a-nota — bajo +
// melodía + percusión ligera (bombo + hi-hat), estética chiptune clásica
// pero con más producción que una única línea plana. Tempo tranquilo y
// siempre a volumen moderado, para no tapar nunca la voz ni los efectos.
const BASS_PATTERN = [130.81, 0, 130.81, 164.81, 0, 164.81, 130.81, 0, 146.83, 0, 146.83, 174.61, 0, 164.81, 146.83, 0];
const MELODY_PATTERN = [523.25, 0, 659.25, 587.33, 523.25, 0, 587.33, 659.25, 493.88, 0, 587.33, 523.25, 440.0, 0, 493.88, 440.0];
const KICK_STEPS = new Set([0, 8]);
const HIHAT_STEPS = new Set([2, 4, 6, 10, 12, 14]);
const STEP_DUR = 0.19;

let noiseBuffer = null;
function getNoiseBuffer(ctx) {
  if (noiseBuffer) return noiseBuffer;
  const size = Math.floor(ctx.sampleRate * 0.05);
  noiseBuffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

function playChiptuneNote(freq, startTime, duration, gainNode, wave, peak) {
  if (!audioCtx || !freq) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = wave;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(gainNode);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

function playHihat(startTime) {
  const src = audioCtx.createBufferSource();
  src.buffer = getNoiseBuffer(audioCtx);
  const filter = audioCtx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 6500;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.05, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(musicGain);
  src.start(startTime);
  src.stop(startTime + 0.04);
}

function playKick(startTime) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(118, startTime);
  osc.frequency.exponentialRampToValueAtTime(42, startTime + 0.11);
  gain.gain.setValueAtTime(0.18, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.14);
  osc.connect(gain);
  gain.connect(musicGain);
  osc.start(startTime);
  osc.stop(startTime + 0.15);
}

function scheduleLoop() {
  if (!running || !audioCtx) return;
  const now = audioCtx.currentTime;
  const lookAhead = 0.9; // se programa con margen (scheduler "look-ahead"), así el bucle es fluido y sin cortes
  while (nextStepTime < now + lookAhead) {
    const i = stepIndex % BASS_PATTERN.length;
    playChiptuneNote(BASS_PATTERN[i], nextStepTime, STEP_DUR * 0.92, musicGain, "triangle", 0.16);
    playChiptuneNote(MELODY_PATTERN[i], nextStepTime, STEP_DUR * 0.8, musicGain, "square", 0.1);
    if (KICK_STEPS.has(i)) playKick(nextStepTime);
    if (HIHAT_STEPS.has(i)) playHihat(nextStepTime);
    stepIndex++;
    nextStepTime += STEP_DUR;
  }
  scheduleTimer = setTimeout(scheduleLoop, 100);
}

/** Agacha un instante la música para que el efecto se oiga con
 * claridad (según lo pedido: la voz y los efectos tienen prioridad). */
function duckMusic() {
  if (!running || !musicGain || !audioCtx) return;
  const now = audioCtx.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setValueAtTime(musicGain.gain.value, now);
  musicGain.gain.linearRampToValueAtTime(effectiveMusicVolume() * 0.4, now + 0.06);
  musicGain.gain.linearRampToValueAtTime(effectiveMusicVolume(), now + 0.5);
}

export const GameSounds = {
  startMusic(volume = 0.65) {
    const ctx = ensureContext();
    if (!ctx) return;
    baseMusicVolume = volume;
    if (ctx.state === "suspended") ctx.resume();
    running = true;
    nextStepTime = ctx.currentTime + 0.05;
    stepIndex = 0;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.linearRampToValueAtTime(effectiveMusicVolume(), ctx.currentTime + 0.6);
    if (!scheduleTimer) scheduleLoop();
  },

  /** Control de volumen general del juego (0-1): escala tanto la
   * música como los efectos, manteniendo siempre la misma proporción
   * entre ellos (la música nunca "gana" a los efectos ni a la voz). */
  setVolume(v) {
    masterVolume = Math.max(0, Math.min(1, v));
    if (sfxGain) sfxGain.gain.value = BASE_SFX_LEVEL * masterVolume;
    if (running && musicGain && audioCtx) {
      musicGain.gain.cancelScheduledValues(audioCtx.currentTime);
      musicGain.gain.linearRampToValueAtTime(effectiveMusicVolume(), audioCtx.currentTime + 0.15);
    }
  },
  getVolume() {
    return masterVolume;
  },

  stopMusic() {
    running = false;
    if (musicGain && audioCtx) {
      musicGain.gain.cancelScheduledValues(audioCtx.currentTime);
      musicGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
    }
    clearTimeout(scheduleTimer);
    scheduleTimer = null;
  },

  /** "¡Cerebrín ha saltado!" — corto, claro, reconocible. */
  playJump() {
    const ctx = ensureContext();
    if (!ctx) return;
    duckMusic();
    const t = ctx.currentTime;
    playChiptuneNote(440, t, 0.1, sfxGain, "square", 0.22);
    playChiptuneNote(660, t + 0.05, 0.12, sfxGain, "square", 0.18);
  },

  /** Pequeño sonido ascendente al superar un obstáculo. */
  playClear() {
    const ctx = ensureContext();
    if (!ctx) return;
    duckMusic();
    const t = ctx.currentTime;
    [523.25, 659.25, 784.0].forEach((f, i) => playChiptuneNote(f, t + i * 0.045, 0.1, sfxGain, "triangle", 0.2));
  },

  /** Efecto de tropiezo/choque: claro pero suave, nunca agresivo. */
  /** Efecto de tropiezo/choque: claro pero suave, nunca agresivo.
   * Combina un tono descendente con un golpe de textura (ruido breve),
   * para que se note claramente incluso con la música sonando de fondo
   * (antes era un tono grave y suave, muy parecido al bajo de la
   * música, y quedaba camuflado). */
  playHit() {
    const ctx = ensureContext();
    if (!ctx) return;
    duckMusic();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.16);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);

    // Golpe de textura corto (ruido filtrado), a modo de "porrazo suave"
    // que se distingue de cualquier nota musical, sea cual sea su tono.
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = getNoiseBuffer(ctx);
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 900;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(sfxGain);
    noiseSrc.start(t);
    noiseSrc.stop(t + 0.13);
  },

  /** "¡Premio conseguido!" — brillante y satisfactorio, muy corto. */
  playPrize() {
    const ctx = ensureContext();
    if (!ctx) return;
    duckMusic();
    const t = ctx.currentTime;
    [880, 1174.66].forEach((f, i) => playChiptuneNote(f, t + i * 0.06, 0.14, sfxGain, "square", 0.22));
  },

  /** Fanfarria breve al llegar a la meta — claramente distinta de
   * superar un obstáculo, sensación de "final de nivel". */
  playVictory() {
    const ctx = ensureContext();
    if (!ctx) return;
    duckMusic();
    const t = ctx.currentTime;
    const run = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    run.forEach((f, i) => playChiptuneNote(f, t + i * 0.09, 0.16, sfxGain, "triangle", 0.22));
    // Acorde final, sostenido, a modo de campanillas de victoria.
    [1046.5, 1318.5, 1568.0].forEach((f) => playChiptuneNote(f, t + run.length * 0.09, 0.7, sfxGain, "triangle", 0.14));
  },

  /** Reproduce una nota concreta (juego "Simón"): clara, cálida, con un
   * cuerpo agradable (dos ondas superpuestas, como un pequeño "campanilleo"). */
  playNote(freq, duration = 0.45) {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    playChiptuneNote(freq, t, duration, sfxGain, "triangle", 0.28);
    playChiptuneNote(freq * 2, t, duration * 0.6, sfxGain, "sine", 0.08);
  },

  /** Fallo suave en el juego "Simón": claro, pero nunca agresivo ni
   * desalentador — solo indica "casi, prueba otra vez". */
  playSimonWrong() {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(196, t);
    osc.frequency.exponentialRampToValueAtTime(130.81, t + 0.3);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(t);
    osc.stop(t + 0.4);
  },

  /** Pequeño chispazo de éxito al completar una ronda entera de la
   * secuencia — distinto del sonido de cada nota individual. */
  playSimonRoundComplete() {
    const ctx = ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => playChiptuneNote(f, t + i * 0.08, 0.16, sfxGain, "triangle", 0.22));
  },
};
