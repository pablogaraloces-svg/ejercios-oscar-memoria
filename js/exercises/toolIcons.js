/**
 * toolIcons.js — Iconos dibujados a mano en SVG para las dos piezas que
 * generaban confusión como emoji (🔩 podía confundirse con cualquiera de
 * las dos, ⚙️ es un engranaje, no una tuerca). Con un dibujo propio,
 * tornillo y tuerca quedan inequívocos de un vistazo.
 *
 * Ambos usan currentColor, así heredan el color de texto normal y se ven
 * bien tanto en modo claro como en alto contraste.
 */

/** Tornillo: vástago con rosca en espiral y cabeza ranurada arriba. */
export const SCREW_ICON = `
<svg viewBox="0 0 64 64" width="52" height="52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="14" r="11" fill="#B0B6BD" stroke="#6B7076" stroke-width="2.5"/>
  <rect x="27" y="8" width="10" height="3" rx="1" fill="#6B7076"/>
  <rect x="27.5" y="24" width="9" height="30" rx="3" fill="#C7CCD1" stroke="#6B7076" stroke-width="2.5"/>
  <path d="M27.5 30 L36.5 33 M27.5 36 L36.5 39 M27.5 42 L36.5 45 M27.5 48 L36.5 51" stroke="#6B7076" stroke-width="2" stroke-linecap="round"/>
  <path d="M27.5 24 L32 54 L36.5 24" fill="none" stroke="#6B7076" stroke-width="0"/>
</svg>`;

/** Tuerca: hexágono clásico visto desde arriba, con el agujero central. */
export const NUT_ICON = `
<svg viewBox="0 0 64 64" width="52" height="52" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polygon points="32,6 50,17 50,39 32,50 14,39 14,17" fill="#C7CCD1" stroke="#6B7076" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="32" cy="28" r="11" fill="#F6F2EA" stroke="#6B7076" stroke-width="3"/>
</svg>`;
