/**
 * restGame.js — "Juego de descanso": una pequeña experiencia de reflejos
 * y diversión al terminar los ejercicios cognitivos, protagonizada por
 * Cerebrín. Mecánica mínima a propósito (un único botón, SALTAR) para que
 * sea accesible y relajante, no un reto.
 *
 * Totalmente independiente del sistema de ejercicios/estadísticas: no
 * llama a reportResult() ni a adaptiveDifficulty — la puntuación de este
 * juego vive solo aquí, nunca se mezcla con las estadísticas cognitivas.
 */

const GAME_DURATION_MS = 5 * 60 * 1000; // ~5 minutos, ajustable aquí
const GROUND_RATIO = 0.78; // el suelo vive al 78% de la altura del lienzo
const CEREBRIN_X_RATIO = 0.22; // Cerebrín se queda fijo a la izquierda; el mundo se mueve hacia él

export class RestGame {
  constructor(canvas, { onProgress, onObstacleCleared } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.onProgress = onProgress;
    this.onObstacleCleared = onObstacleCleared;
    this.mascotImg = new Image();
    this.mascotImg.src = "assets/mascot/cerebrin.png";
    this.running = false;
    this.rafId = null;
    this._resize();
    this.reset();
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const cssW = Math.max(320, rect.width);
    const cssH = 300;
    this.canvas.style.width = cssW + "px";
    this.canvas.style.height = cssH + "px";
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = cssW;
    this.h = cssH;
    this.groundY = this.h * GROUND_RATIO;
    this.cerebrinX = this.w * CEREBRIN_X_RATIO;
  }

  reset() {
    this.startTime = null;
    this.elapsed = 0;
    this.points = 0;
    this.obstacles = [];
    this.nextSpawnAt = 900;
    this.cerebrinY = 0; // desplazamiento respecto al suelo (0 = en el suelo, negativo = en el aire)
    this.velocityY = 0;
    this.jumping = false;
    this.finished = false;
    this.scrollSpeed = 210; // px/s, sube ligeramente con el progreso
  }

  start() {
    this.running = true;
    this.startTime = performance.now() - this.elapsed;
    this._loop(performance.now());
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  jump() {
    if (this.jumping || this.finished) return;
    this.jumping = true;
    this.velocityY = -560; // impulso hacia arriba (px/s)
  }

  _progress() {
    return Math.min(1, this.elapsed / GAME_DURATION_MS);
  }

  _loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.04, (now - (this._lastFrame || now)) / 1000);
    this._lastFrame = now;
    this.elapsed = now - this.startTime;

    if (!this.finished) this._update(dt);
    this._draw();

    const progress = this._progress();
    this.onProgress?.({ points: this.points, progress });

    if (progress >= 1 && !this.finished) {
      this.finished = true;
      this.onProgress?.({ points: this.points, progress: 1, done: true });
    }

    this.rafId = requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    const progress = this._progress();
    // Progresión suave: al principio despacio y con obstáculos muy
    // separados; hacia la mitad/final, algo más de ritmo — siempre
    // dentro de un rango tranquilo, nunca frenético.
    this.scrollSpeed = 200 + progress * 90;

    // Física simple del salto (parábola: sube, gravedad la frena, baja).
    if (this.jumping) {
      this.velocityY += 1500 * dt; // gravedad
      this.cerebrinY += this.velocityY * dt;
      if (this.cerebrinY >= 0) {
        this.cerebrinY = 0;
        this.velocityY = 0;
        this.jumping = false;
      }
    }

    // Puntos por el mero hecho de avanzar (goteo suave y constante).
    this.points += dt * 6;

    // Generar obstáculos: intervalo que se acorta poco a poco según el
    // progreso (inicio fácil y espaciado → final con algo más de ritmo).
    this.nextSpawnAt -= dt * 1000;
    if (this.nextSpawnAt <= 0) {
      const minGap = 2600 - progress * 1100;
      const maxGap = 3600 - progress * 1200;
      this.nextSpawnAt = minGap + Math.random() * (maxGap - minGap);
      this.obstacles.push({
        x: this.w + 40,
        width: 34 + Math.random() * 14,
        height: 34 + Math.random() * 22,
        cleared: false,
        hit: false,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    // Mover obstáculos y comprobar colisión/superación.
    const cerebrinW = 64;
    const cerebrinLeft = this.cerebrinX - cerebrinW / 2 + 10;
    const cerebrinRight = this.cerebrinX + cerebrinW / 2 - 10;
    const cerebrinBottom = this.groundY + this.cerebrinY;

    this.obstacles.forEach((ob) => {
      ob.x -= this.scrollSpeed * dt;
      ob.wobble += dt * 4;

      const obLeft = ob.x;
      const obRight = ob.x + ob.width;
      const obTop = this.groundY - ob.height;

      const overlapX = cerebrinRight > obLeft && cerebrinLeft < obRight;
      const overlapY = cerebrinBottom > obTop;

      if (overlapX && overlapY && !ob.hit && !ob.cleared) {
        ob.hit = true; // un pequeño "tropiezo" sin consecuencias graves: no hay vidas ni fin de partida
      }
      if (!ob.cleared && !ob.hit && obRight < cerebrinLeft) {
        ob.cleared = true;
        this.points += 10;
        this.onObstacleCleared?.();
      }
    });
    this.obstacles = this.obstacles.filter((ob) => ob.x + ob.width > -20);
  }

  _draw() {
    const { ctx, w, h, groundY } = this;
    ctx.clearRect(0, 0, w, h);

    // Cielo cálido, coherente con la identidad visual de la app.
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#FFF6E5");
    sky.addColorStop(1, "#F3EFE4");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Suelo
    ctx.fillStyle = "#E7E0CF";
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.strokeStyle = "#C9BFA0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    // Meta (al final del recorrido, visible cuando ya se está cerca)
    const progress = this._progress();
    if (progress > 0.85) {
      const goalX = w - (1 - (progress - 0.85) / 0.15) * 40 - 30;
      ctx.fillStyle = "#4F9868";
      ctx.fillRect(goalX, groundY - 90, 6, 90);
      ctx.fillStyle = "#F5A93E";
      ctx.beginPath();
      ctx.moveTo(goalX + 6, groundY - 90);
      ctx.lineTo(goalX + 34, groundY - 78);
      ctx.lineTo(goalX + 6, groundY - 66);
      ctx.closePath();
      ctx.fill();
    }

    // Obstáculos: bloques redondeados y amistosos, con un ligero balanceo.
    this.obstacles.forEach((ob) => {
      const bob = Math.sin(ob.wobble) * 2;
      ctx.save();
      ctx.translate(ob.x + ob.width / 2, groundY - ob.height / 2 + bob);
      ctx.fillStyle = ob.hit ? "#E8A2AC" : "#7FA8DE";
      this._roundedRectPath(ctx, -ob.width / 2, -ob.height / 2, ob.width, ob.height, 10);
      ctx.fill();
      ctx.restore();
    });

    // Cerebrín
    const cy = groundY + this.cerebrinY;
    ctx.save();
    ctx.translate(this.cerebrinX, cy);
    if (this.mascotImg.complete && this.mascotImg.naturalWidth) {
      const size = 92;
      const ratio = this.mascotImg.naturalHeight / this.mascotImg.naturalWidth;
      ctx.drawImage(this.mascotImg, -size / 2, -size, size, size * ratio);
    } else {
      ctx.fillStyle = "#F5A93E";
      ctx.beginPath();
      ctx.arc(0, -40, 34, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Rectángulo con esquinas redondeadas, dibujado a mano (sin depender
   * de ctx.roundRect(), no disponible en algunos WebView de Android más
   * antiguos — así el juego funciona igual en cualquier tablet). */
  _roundedRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
