/**
 * hints.js — Ayudas progresivas ante errores.
 * 1er error: mensaje suave (voz), sin pista visual todavía.
 * 2º error: aviso corto por voz ("Fíjate bien, te voy a dar una pequeña
 *           pista") + pista VISUAL (parpadeo en la opción correcta).
 *           La voz no describe la pista, solo avisa de que va a darla.
 * 3er error: se mantiene/refuerza la pista visual, sin voz nueva.
 * 4º error: solución amable (voz + visual).
 */
import { pickTryAgainSoft, applyNameBudget } from "./phrases.js";

const PISTA_INTRO = "Fíjate bien, {name}. Te voy a dar una pequeña pista.";

export class HintFlow {
  constructor({ name, nameBudget, onSoft, onPistaVoice, onVisualHint, onReveal }) {
    this.name = name;
    this.nameBudget = nameBudget || { used: false };
    this.errorCount = 0;
    this.onSoft = onSoft;
    this.onPistaVoice = onPistaVoice;
    this.onVisualHint = onVisualHint;
    this.onReveal = onReveal;
  }

  reset() {
    this.errorCount = 0;
  }

  registerError() {
    this.errorCount += 1;
    switch (this.errorCount) {
      case 1:
        this.onSoft?.(applyNameBudget(pickTryAgainSoft(), this.name, this.nameBudget));
        break;
      case 2:
        this.onPistaVoice?.(applyNameBudget(PISTA_INTRO, this.name, this.nameBudget));
        this.onVisualHint?.();
        break;
      case 3:
        // Solo refuerzo visual, sin nueva frase hablada.
        this.onVisualHint?.();
        break;
      default:
        this.onReveal?.();
        break;
    }
    return this.errorCount;
  }
}
