/**
 * mascot.js — Mono/macaco simpático y discreto. Cambia de cara según
 * cómo le va a Óscar en el ejercicio: contento al acertar, animando
 * con cariño si falla, pensativo mientras espera respuesta.
 */
const FACES = {
  idle: "🐵",
  thinking: "🤔",
  happy: "🙉",
  veryHappy: "🐒",
  encouraging: "🙈",
  pointing: "🐵",
};

export class Mascot {
  constructor(rootEl, bubbleEl) {
    this.root = rootEl;
    this.bubble = bubbleEl;
    this.hideTimer = null;
    this.faceTimer = null;
  }

  setFace(face) {
    if (this.root) this.root.textContent = FACES[face] || FACES.idle;
  }

  idle() {
    this.root.className = "mascot bounce";
    this.setFace("idle");
  }

  thinking() {
    this.root.className = "mascot bounce";
    this.setFace("thinking");
  }

  pointTo(direction) {
    this.root.className = `mascot bounce point-${direction}`;
    this.setFace("pointing");
    clearTimeout(this.faceTimer);
    this.faceTimer = setTimeout(() => {
      this.root.className = "mascot bounce";
      this.setFace("idle");
    }, 1600);
  }

  celebrate() {
    this.root.className = "mascot celebrate";
    this.setFace(Math.random() > 0.5 ? "happy" : "veryHappy");
    clearTimeout(this.faceTimer);
    this.faceTimer = setTimeout(() => {
      this.root.className = "mascot bounce";
      this.setFace("idle");
    }, 1400);
  }

  encourage() {
    this.root.className = "mascot bounce shake-soft";
    this.setFace("encouraging");
    clearTimeout(this.faceTimer);
    this.faceTimer = setTimeout(() => {
      this.root.className = "mascot bounce";
      this.setFace("idle");
    }, 1400);
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
