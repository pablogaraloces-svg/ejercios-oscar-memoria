/**
 * restGame.js — Motor de "Cerebrín Saltarín". Mecánica mínima a
 * propósito (un único botón, SALTAR) para que sea accesible y
 * relajante, pensado específicamente para una persona mayor: sin vidas,
 * sin penalizaciones duras, velocidad moderada, obstáculos grandes y
 * bien separados.
 *
 * Totalmente independiente del sistema de ejercicios/estadísticas
 * cognitivas: esta clase no llama a reportResult() ni a
 * adaptiveDifficulty en ningún momento. Sus propias estadísticas (si se
 * quieren guardar) viven aparte, en core/gameStats.js.
 *
 * Se comunica con el exterior únicamente mediante callbacks (onJump,
 * onObstacleCleared, onObstacleHit, onPrizeCollected, onGoalReached,
 * onProgress), para que el sonido, la música y la voz puedan
 * engancharse sin que este archivo necesite saber nada de audio.
 */

const GAME_DURATION_MS = 5 * 60 * 1000; // ~5 minutos, ajustable aquí
const GROUND_RATIO = 0.78; // el suelo vive al 78% de la altura del lienzo
const CEREBRIN_X_RATIO = 0.22; // Cerebrín se queda fijo a la izquierda; el mundo se mueve hacia él
const CEREBRIN_SIZE = 96; // ancho de referencia del dibujo, en px

export class RestGame {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.callbacks = callbacks;
    this.mascotImg = new Image();
    // Versión recortada a medida (sin ningún margen transparente
    // alrededor): imprescindible para que el cálculo de apoyo sobre el
    // suelo sea exacto. La imagen general del resto de la app conserva
    // su margen (para la insignia circular), así que aquí se usa una
    // específica para el juego.
    this.mascotImg.src = "assets/mascot/cerebrin-game.png";
    // La imagen carga de forma asíncrona: en cuanto esté lista, se
    // recalcula la proporción real (antes se calculaba solo una vez, al
    // construir el juego, cuando la imagen normalmente aún no había
    // cargado — y se quedaba con un valor aproximado para siempre).
    this.mascotImg.onload = () => this._resize();
    this.running = false;
    this.rafId = null;
    this._resize();
    this.reset();
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const cssW = Math.max(320, rect.width);
    const cssH = 320;
    this.canvas.style.width = cssW + "px";
    this.canvas.style.height = cssH + "px";
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = cssW;
    this.h = cssH;
    this.groundY = this.h * GROUND_RATIO;
    this.cerebrinX = this.w * CEREBRIN_X_RATIO;
    // Alto real del dibujo respetando su proporción original, para que
    // los pies queden EXACTAMENTE apoyados en el suelo (antes se
    // asumía un dibujo cuadrado, y quedaba flotando unos px por encima).
    const ratio = this.mascotImg.naturalHeight && this.mascotImg.naturalWidth
      ? this.mascotImg.naturalHeight / this.mascotImg.naturalWidth
      : 0.905;
    this.cerebrinDrawH = CEREBRIN_SIZE * ratio;
  }

  reset() {
    this.startTime = null;
    this.elapsed = 0;
    this.points = 0;
    this.obstacles = [];
    this.prizes = [];
    this.nextObstacleAt = 1400;
    this.nextPrizeAt = 5200;
    this.cerebrinY = 0; // desplazamiento respecto al suelo (0 = en el suelo, negativo = en el aire)
    this.velocityY = 0;
    this.jumping = false;
    this.squash = 1; // efecto visual de "chafado" al despegar/aterrizar
    this.finished = false;
    this.scrollSpeed = 200; // px/s, sube ligeramente con el progreso
    this._announcedNearGoal = false;
    this._announcedAlmostThere = false;
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
    // Impulso pensado para que se anticipe con facilidad: ni demasiado
    // alto ni demasiado rápido (aprox. 0,7s de vuelo completo).
    this.velocityY = -520;
    this.squash = 1.18; // pequeño "estirón" al despegar
    this.callbacks.onJump?.();
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
    this.onProgressTick(progress);

    if (progress >= 1 && !this.finished) {
      this.finished = true;
      this.callbacks.onGoalReached?.();
      this.callbacks.onProgress?.({ points: Math.floor(this.points), progress: 1, done: true });
    }

    this.rafId = requestAnimationFrame((t) => this._loop(t));
  }

  /** Avisos hablados puntuales cerca de la meta — nunca de forma
   * continua, solo una vez cada uno. */
  onProgressTick(progress) {
    this.callbacks.onProgress?.({ points: Math.floor(this.points), progress });
    if (progress >= 0.7 && !this._announcedNearGoal) {
      this._announcedNearGoal = true;
      this.callbacks.onNearGoal?.();
    }
    if (progress >= 0.9 && !this._announcedAlmostThere) {
      this._announcedAlmostThere = true;
      this.callbacks.onAlmostThere?.();
    }
  }

  _update(dt) {
    const progress = this._progress();
    // Progresión suave y siempre accesible: al principio despacio y con
    // obstáculos muy separados; hacia el final, un poco más de ritmo,
    // pero nunca exigente.
    this.scrollSpeed = 195 + progress * 75;

    // Física del salto (parábola: impulso, subida, aire, bajada,
    // aterrizaje), con un pequeño efecto de "chafado" al tocar el suelo
    // para reforzar visualmente el aterrizaje.
    if (this.jumping) {
      this.velocityY += 1350 * dt; // gravedad
      this.cerebrinY += this.velocityY * dt;
      if (this.cerebrinY >= 0) {
        this.cerebrinY = 0;
        this.velocityY = 0;
        this.jumping = false;
        this.squash = 0.86; // se "achata" un instante al aterrizar
      }
    }
    // El efecto de chafado se recupera suavemente hacia 1 (tamaño normal).
    this.squash += (1 - this.squash) * Math.min(1, dt * 10);

    // Los puntos solo suben por buenos saltos (superar un obstáculo) o
    // por conseguir estrellas/pájaros — nunca por el mero hecho de
    // avanzar por el recorrido.

    this._updateObstacles(dt, progress);
    this._updatePrizes(dt, progress);
  }

  _updateObstacles(dt, progress) {
    this.nextObstacleAt -= dt * 1000;
    if (this.nextObstacleAt <= 0) {
      // Espaciado siempre generoso (persona mayor: tiempo de sobra para
      // reaccionar), con una variedad muy ligera según el progreso.
      const minGap = 2700 - progress * 900;
      const maxGap = 3700 - progress * 900;
      this.nextObstacleAt = minGap + Math.random() * (maxGap - minGap);
      // Más pequeños en general; de vez en cuando alguno más largo
      // (nunca más alto) para dar algo de variedad sin complicar el salto.
      const isLong = Math.random() < 0.25;
      this.obstacles.push({
        x: this.w + 40,
        width: isLong ? 66 + Math.random() * 20 : 28 + Math.random() * 10,
        height: 26 + Math.random() * 12,
        cleared: false,
        hit: false,
        hitAt: 0,
        wobble: Math.random() * Math.PI * 2,
      });
    }

    const cerebrinLeft = this.cerebrinX - CEREBRIN_SIZE / 2 + 14;
    const cerebrinRight = this.cerebrinX + CEREBRIN_SIZE / 2 - 14;
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
        ob.hitAt = this.elapsed;
        this.callbacks.onObstacleHit?.();
      }
      if (!ob.cleared && !ob.hit && obRight < cerebrinLeft) {
        ob.cleared = true;
        this.points += 10;
        this.callbacks.onObstacleCleared?.();
      }
    });
    this.obstacles = this.obstacles.filter((ob) => ob.x + ob.width > -20);
  }

  _updatePrizes(dt, progress) {
    this.nextPrizeAt -= dt * 1000;
    if (this.nextPrizeAt <= 0) {
      // Con bastante menos frecuencia que los obstáculos, y solo si no
      // hay ningún obstáculo cerca de esa misma zona — así nunca hace
      // falta reaccionar a dos cosas a la vez.
      const tooClose = this.obstacles.some((ob) => ob.x > this.w - 60 && ob.x < this.w + 220);
      if (!tooClose) {
        // Se alternan estrellas y pájaros, cada uno con su propia
        // puntuación, para dar algo de variedad visual.
        this._nextPrizeIsBird = !this._nextPrizeIsBird;
        const type = this._nextPrizeIsBird ? "bird" : "star";
        this.prizes.push({
          type,
          x: this.w + 60,
          // Altura calculada para que SIEMPRE haga falta saltar (por
          // encima de la cabeza de Cerebrín de pie, ~85px) y SIEMPRE sea
          // alcanzable en el punto más alto del salto (~185px), con
          // margen de sobra en ambos extremos para que no haga falta un
          // salto perfectamente cronometrado.
          y: 115 + Math.random() * 30,
          size: type === "star" ? 40 : 36,
          points: type === "star" ? 20 : 30,
          collected: false,
          spin: 0,
        });
        this.nextPrizeAt = 5200 + Math.random() * 2600;
      } else {
        this.nextPrizeAt = 500; // se reintenta enseguida en cuanto haya hueco
      }
    }

    const cerebrinLeft = this.cerebrinX - CEREBRIN_SIZE / 2 + 10;
    const cerebrinRight = this.cerebrinX + CEREBRIN_SIZE / 2 - 10;
    const cerebrinTop = this.groundY + this.cerebrinY - this.cerebrinDrawH;

    this.prizes.forEach((pr) => {
      pr.x -= this.scrollSpeed * dt;
      pr.spin += dt * 2.4;
      if (pr.collected) return;
      const prLeft = pr.x - pr.size / 2;
      const prRight = pr.x + pr.size / 2;
      const prTop = this.groundY - pr.y - pr.size / 2;
      const prBottom = this.groundY - pr.y + pr.size / 2;
      const overlapX = cerebrinRight > prLeft && cerebrinLeft < prRight;
      const overlapY = cerebrinTop < prBottom && this.groundY + this.cerebrinY > prTop;
      if (overlapX && overlapY) {
        pr.collected = true;
        this.points += pr.points;
        this.callbacks.onPrizeCollected?.();
      }
    });
    this.prizes = this.prizes.filter((pr) => pr.x > -40);
  }

  _draw() {
    const { ctx, w, h, groundY } = this;
    ctx.clearRect(0, 0, w, h);

    // Cielo cálido con estética arcade sencilla (franjas muy sutiles),
    // coherente con la identidad visual de la app.
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#FFEFCB");
    sky.addColorStop(1, "#F3EFE4");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Nubes decorativas muy discretas
    const t = this.elapsed / 1000;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    [0.15, 0.5, 0.82].forEach((frac, i) => {
      const cx = ((w * frac - t * 12 * (i + 1)) % (w + 120) + (w + 120)) % (w + 120) - 60;
      const cy = 40 + i * 22;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 34, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 22, cy + 4, 22, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    });

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
      ctx.fillRect(goalX, groundY - 96, 6, 96);
      ctx.fillStyle = "#F5A93E";
      ctx.beginPath();
      ctx.moveTo(goalX + 6, groundY - 96);
      ctx.lineTo(goalX + 36, groundY - 84);
      ctx.lineTo(goalX + 6, groundY - 72);
      ctx.closePath();
      ctx.fill();
    }

    // Obstáculos: bloques redondeados y amistosos, con un ligero
    // balanceo. Al chocar, se ponen en rojo claro y hacen una pequeña
    // sacudida a modo de "señal de error", breve y nada agresiva.
    this.obstacles.forEach((ob) => {
      const bob = Math.sin(ob.wobble) * 2;
      const sinceHit = ob.hit ? this.elapsed - ob.hitAt : Infinity;
      const shake = sinceHit < 260 ? Math.sin(sinceHit * 0.14) * (1 - sinceHit / 260) * 6 : 0;
      ctx.save();
      ctx.translate(ob.x + ob.width / 2 + shake, groundY - ob.height / 2 + bob);
      ctx.fillStyle = ob.hit ? "#E63946" : "#7FA8DE";
      this._roundedRectPath(ctx, -ob.width / 2, -ob.height / 2, ob.width, ob.height, 10);
      ctx.fill();
      if (ob.hit && sinceHit < 260) {
        ctx.strokeStyle = "rgba(230, 57, 70, 0.55)";
        ctx.lineWidth = 3;
        this._roundedRectPath(ctx, -ob.width / 2 - 4, -ob.height / 2 - 4, ob.width + 8, ob.height + 8, 12);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Premios: estrellas y pajaritos que se mecen suavemente en el aire.
    this.prizes.forEach((pr) => {
      if (pr.collected) return;
      ctx.save();
      ctx.translate(pr.x, groundY - pr.y);
      if (pr.type === "bird") {
        ctx.rotate(Math.sin(pr.spin) * 0.12);
        this._birdPath(ctx, pr.size);
      } else {
        ctx.rotate(Math.sin(pr.spin) * 0.35);
        ctx.fillStyle = "#F5A93E";
        this._starPath(ctx, 0, 0, pr.size / 2, pr.size / 4.4, 5);
        ctx.fill();
      }
      ctx.restore();
    });

    // Cerebrín: apoyado exactamente sobre la línea del suelo (el alto
    // real del dibujo respeta su proporción original), con un pequeño
    // efecto de "chafado" al despegar/aterrizar para reforzar el salto.
    const groundContactY = groundY + this.cerebrinY;
    ctx.save();
    ctx.translate(this.cerebrinX, groundContactY);
    ctx.scale(1 / this.squash, this.squash);
    if (this.mascotImg.complete && this.mascotImg.naturalWidth) {
      const dh = this.cerebrinDrawH;
      ctx.drawImage(this.mascotImg, -CEREBRIN_SIZE / 2, -dh, CEREBRIN_SIZE, dh);
    } else {
      ctx.fillStyle = "#F5A93E";
      ctx.beginPath();
      ctx.arc(0, -34, 34, 0, Math.PI * 2);
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

  /** Estrella de 5 puntas, dibujada a mano (sin dependencias). */
  _starPath(ctx, cx, cy, outerR, innerR, spikes) {
    ctx.beginPath();
    const step = Math.PI / spikes;
    let rot = -Math.PI / 2;
    ctx.moveTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    for (let i = 0; i < spikes; i++) {
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    }
    ctx.closePath();
  }

  /** Pajarito sencillo y original (cuerpo redondeado, ala y pico),
   * dibujado a mano — sin copiar ningún personaje existente. */
  _birdPath(ctx, size) {
    const r = size / 2;
    // Cuerpo
    ctx.fillStyle = "#4E7FBF";
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ala
    ctx.fillStyle = "#395E91";
    ctx.beginPath();
    ctx.ellipse(-r * 0.15, r * 0.05, r * 0.55, r * 0.34, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Pico
    ctx.fillStyle = "#F5A93E";
    ctx.beginPath();
    ctx.moveTo(r * 0.85, -r * 0.08);
    ctx.lineTo(r * 1.25, 0);
    ctx.lineTo(r * 0.85, r * 0.18);
    ctx.closePath();
    ctx.fill();
    // Ojo
    ctx.fillStyle = "#2B2B2E";
    ctx.beginPath();
    ctx.arc(r * 0.42, -r * 0.22, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
}
