const COLORS = ["#FFB454", "#6FBF8B", "#5E81AC", "#EF798A", "#F2C230"];

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
