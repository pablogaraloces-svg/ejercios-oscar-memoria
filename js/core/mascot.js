/**
 * mascot.js — Mascota discreta que solo interviene para ayudar.
 * No hace ruido visual constante; se activa en momentos concretos.
 */
export class Mascot {
  constructor(rootEl, bubbleEl) {
    this.root = rootEl;
    this.bubble = bubbleEl;
    this.hideTimer = null;
  }

  idle() {
    this.root.className = "mascot bounce";
  }

  pointTo(direction) {
    // direction: 'left' | 'right'
    this.root.className = `mascot bounce point-${direction}`;
    setTimeout(() => (this.root.className = "mascot bounce"), 1600);
  }

  celebrate() {
    this.root.className = "mascot celebrate";
    setTimeout(() => (this.root.className = "mascot bounce"), 800);
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
