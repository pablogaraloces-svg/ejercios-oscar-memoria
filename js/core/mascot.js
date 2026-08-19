/**
 * mascot.js — Cerebrín, la mascota oficial de la aplicación (sustituye al
 * mono anterior). Usa la imagen real del personaje; las reacciones ya no
 * cambian de "cara" (solo hay una imagen), sino que animan el conjunto
 * mediante CSS: rebote, celebración, ánimo, señalar y, ahora, una
 * animación sencilla de boca mientras habla por voz.
 */
const TAP_ANIMATIONS = ["tap-spin", "tap-jump", "tap-wobble", "tap-grow"];
const TAP_PHRASES = [
  "¡Hola! ¿Jugamos un rato?",
  "¡Uy, cosquillas!",
  "Estoy aquí contigo, {name}.",
  "¡Qué bien lo vamos a pasar hoy!",
  "¿Vamos a hacer algún ejercicio?",
  "¡Wiiii!",
];

export class Mascot {
  constructor(rootEl, bubbleEl) {
    this.root = rootEl;
    this.bubble = bubbleEl;
    this.hideTimer = null;
    this.faceTimer = null;
    this.tapTimer = null;
    this.name = "";
    if (this.root) {
      this.root.addEventListener("click", () => this.onTap());
    }
  }

  setName(name) {
    this.name = name || "";
  }

  /** Reacción divertida y aleatoria cada vez que Óscar toca la mascota. */
  onTap() {
    const anim = TAP_ANIMATIONS[Math.floor(Math.random() * TAP_ANIMATIONS.length)];
    this.root.classList.remove(...TAP_ANIMATIONS);
    void this.root.offsetWidth;
    this.root.classList.add(anim);
    clearTimeout(this.tapTimer);
    this.tapTimer = setTimeout(() => this.root.classList.remove(anim), 750);
    if (this.bubble) {
      const phrase = TAP_PHRASES[Math.floor(Math.random() * TAP_PHRASES.length)].replace("{name}", this.name);
      this.say(phrase, { duration: 2200 });
    }
  }

  idle() {
    this.root.className = "mascot bounce";
  }

  thinking() {
    this.root.className = "mascot bounce thinking-tilt";
  }

  pointTo(direction) {
    this.root.className = `mascot bounce point-${direction}`;
    clearTimeout(this.faceTimer);
    this.faceTimer = setTimeout(() => (this.root.className = "mascot bounce"), 1600);
  }

  celebrate() {
    this.root.className = "mascot celebrate";
    clearTimeout(this.faceTimer);
    this.faceTimer = setTimeout(() => (this.root.className = "mascot bounce"), 1400);
  }

  encourage() {
    this.root.className = "mascot bounce shake-soft";
    clearTimeout(this.faceTimer);
    this.faceTimer = setTimeout(() => (this.root.className = "mascot bounce"), 1400);
  }

  /** Se llama cuando empieza a sonar la voz: anima la boca mientras habla. */
  startTalking() {
    this.root?.classList.add("talking");
  }

  /** Se llama cuando termina la voz (o no hay voz activada): vuelve al reposo. */
  stopTalking() {
    this.root?.classList.remove("talking");
  }

  say(text, { duration = 4200 } = {}) {
    if (!this.bubble) return;
    this.bubble.textContent = text;
    this.bubble.classList.remove("hidden");
    this.bubble.classList.add("fade-in");
    clearTimeout(this.hideTimer);
    if (duration) {
      this.hideTimer = setTimeout(() => this.bubble.classList.add("hidden"), duration);
    }
  }

  hideBubble() {
    this.bubble?.classList.add("hidden");
  }
}
