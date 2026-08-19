// Paleta alineada con el nuevo sistema de diseño (solo estética, sin
// ningún cambio de lógica ni de comportamiento).
const COLORS = ["#F5A93E", "#4F9868", "#4E7FBF", "#E85F73", "#FFCB77"];

export function burstConfetti(count = 24) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.left = `${Math.random() * 100}vw`;
    el.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
    el.style.animationDuration = `${2.2 + Math.random() * 1.4}s`;
    el.style.animationDelay = `${Math.random() * 0.3}s`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }
}

const CELEBRATION_EMOJIS = ["⭐", "🎉", "💛", "✨", "🌟", "👏"];

/**
 * Celebración más emotiva: un emoji grande "explota" y pequeñas partículas
 * salen volando hacia fuera. Por defecto se centra en la pantalla, pero
 * admite anclarse a un punto concreto (p.ej. más abajo, para no tapar
 * nunca un texto ya centrado, como en la pantalla de cierre de sesión).
 */
export function celebrateSuccess({ big = "🎉", particles = 10, anchorY = null } = {}) {
  const burst = document.createElement("div");
  burst.className = "success-burst";
  burst.textContent = big;
  if (anchorY !== null) burst.style.top = `${anchorY}px`;
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 1100);

  const cx = window.innerWidth / 2;
  const cy = anchorY !== null ? anchorY : window.innerHeight / 2;
  for (let i = 0; i < particles; i++) {
    const p = document.createElement("div");
    p.className = "success-particle";
    p.textContent = CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)];
    const angle = (Math.PI * 2 * i) / particles + Math.random() * 0.4;
    const dist = 140 + Math.random() * 120;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    p.style.setProperty("--fly-to", `translate(${dx}px, ${dy}px)`);
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }
}

