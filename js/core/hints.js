/**
 * hints.js — Ayudas progresivas.
 * 1er error: mensaje suave.
 * 2º error: pista textual.
 * 3er error: resaltar (parpadeo suave) el botón correcto.
 * 4º error: solución amable, sin frustración.
 */
import { pickHint, pickTryAgainSoft, fillName } from "./phrases.js";

export class HintFlow {
  constructor({ name, onSoft, onHint, onHighlight, onReveal }) {
    this.name = name;
    this.errorCount = 0;
    this.onSoft = onSoft;
    this.onHint = onHint;
    this.onHighlight = onHighlight;
    this.onReveal = onReveal;
  }

  reset() {
    this.errorCount = 0;
  }

  registerError() {
    this.errorCount += 1;
    switch (this.errorCount) {
      case 1:
        this.onSoft?.(fillName(pickTryAgainSoft(), this.name));
        break;
      case 2:
        this.onHint?.(pickHint());
        break;
      case 3:
        this.onHighlight?.();
        break;
      default:
        this.onReveal?.();
        break;
    }
    return this.errorCount;
  }
}
