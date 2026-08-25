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
 * onObstacleCleared, onObstacleHit, onPrizeCollected, onPrizeMissed,
 * onGoalReached, onProgress), para que el sonido, la música y la voz
 * puedan engancharse sin que este archivo necesite saber nada de audio.
 */

const GAME_DURATION_MS = 5 * 60 * 1000; // ~5 minutos, ajustable aquí
const GROUND_RATIO = 0.78; // el suelo vive al 78% de la altura del lienzo
const CEREBRIN_X_RATIO = 0.22; // Cerebrín se queda fijo a la izquierda; el mundo se mueve hacia él
const CEREBRIN_SIZE = 96; // ancho de referencia del dibujo, en px

// Animales-obstáculo: reconocibles, grandes y simpáticos. Cada uno con
// su combinación de colores propia para distinguirse de un vistazo.
const ANIMALS = [
  { kind: "goat", body: "#C9A876", accent: "#8B7355" }, // cabra
  { kind: "sheep", body: "#F7F2E7", accent: "#2B2B2E" }, // oveja
  { kind: "donkey", body: "#9B9B93", accent: "#5A5A52" }, // burro
  { kind: "cow", body: "#FDFBF7", accent: "#3A3A3A" }, // vaca
];

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
    // los pies queden EXACTAMENTE apoyados en el suelo.
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
    this.nextObstacleAt = 1600;
    this.nextPrizeAt = 5200;
    this.cerebrinY = 0; // desplazamiento respecto al suelo (0 = en el suelo, negativo = en el aire)
    this.velocityY = 0;
    this.jumping = false;
    this.squash = 1; // efecto visual de "chafado" al despegar/aterrizar
    this.shakeUntil = 0; // temblor breve de Cerebrín al chocar
    this.finished = false;
    this.scrollSpeed = 190; // px/s, sube ligeramente con el progreso
    this._announcedNearGoal = false;
    this._announcedAlmostThere = false;
    this._nextPrizeIsBalloon = 0;
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
    // Salto con más recorrido que antes, para pasar con margen por
    // encima de un animal (cabra, oveja, burro o vaca) sin llegar a
    // rozarlo, manteniendo un vuelo natural y fácil de anticipar
    // (~0,95s de principio a fin).
    this.velocityY = -620;
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

  /** Suma (o resta, con un mínimo de 0 para no confundir con números
   * negativos) puntos, siempre a través de aquí. */
  addPoints(amount) {
    this.points = Math.max(0, this.points + amount);
  }

  _update(dt) {
    const progress = this._progress();
    // Progresión suave y siempre accesible: al principio despacio y con
    // obstáculos muy separados; hacia el final, un poco más de ritmo,
    // pero nunca exigente.
    this.scrollSpeed = 190 + progress * 65;

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

    this._updateObstacles(dt, progress);
    this._updatePrizes(dt, progress);
  }

  _updateObstacles(dt, progress) {
    this.nextObstacleAt -= dt * 1000;
    if (this.nextObstacleAt <= 0) {
      // Espaciado siempre generoso (persona mayor: tiempo de sobra para
      // reaccionar), con secuencias que nunca se aceleran demasiado.
      const minGap = 2800 - progress * 800;
      const maxGap = 3800 - progress * 800;
      this.nextObstacleAt = minGap + Math.random() * (maxGap - minGap);
      const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
      this.obstacles.push({
        animal,
        x: this.w + 40,
        width: 62,
        height: 52,
        cleared: false,
        hit: false,
        hitAt: -9999,
        wobble: Math.random() * Math.PI * 2,
        legPhase: 0,
      });
    }

    // Hitbox algo más generosa que el dibujo visible por fuera (para no
    // penalizar nunca un roce mínimo), pero SIN pasarse — corresponde
    // razonablemente con el tamaño real del animal.
    const tolerance = 10;
    const cerebrinLeft = this.cerebrinX - CEREBRIN_SIZE / 2 + 18 + tolerance;
    const cerebrinRight = this.cerebrinX + CEREBRIN_SIZE / 2 - 18 - tolerance;
    const cerebrinBottom = this.groundY + this.cerebrinY;

    this.obstacles.forEach((ob) => {
      ob.x -= this.scrollSpeed * dt;
      ob.wobble += dt * 4;
      ob.legPhase += dt * 8;

      const obLeft = ob.x + tolerance;
      const obRight = ob.x + ob.width - tolerance;
      const obTop = this.groundY - ob.height + tolerance * 0.6;

      const overlapX = cerebrinRight > obLeft && cerebrinLeft < obRight;
      const overlapY = cerebrinBottom > obTop;

      if (overlapX && overlapY && !ob.hit && !ob.cleared) {
        ob.hit = true; // un pequeño "tropiezo" sin consecuencias graves: no hay vidas ni fin de partida
        ob.hitAt = this.elapsed;
        this.addPoints(-5); // penalización moderada por chocar
        this.shakeUntil = this.elapsed + 260; // Cerebrín tiembla un instante
        this.callbacks.onObstacleHit?.();
      }
      if (!ob.cleared && !ob.hit && obRight < cerebrinLeft) {
        ob.cleared = true;
        this.addPoints(10); // buen salto: superó el animal sin rozarlo
        this.callbacks.onObstacleCleared?.();
      }
    });
    this.obstacles = this.obstacles.filter((ob) => ob.x + ob.width > -20);
  }

  _updatePrizes(dt, progress) {
    this.nextPrizeAt -= dt * 1000;
    if (this.nextPrizeAt <= 0) {
      // Con bastante menos frecuencia que los animales, y solo si no hay
      // ninguno cerca de esa misma zona — así nunca hace falta
      // reaccionar a dos cosas a la vez.
      const tooClose = this.obstacles.some((ob) => ob.x > this.w - 60 && ob.x < this.w + 220);
      if (!tooClose) {
        // Se turnan estrella / pájaro / globo, cada uno con su propio
        // valor, para dar variedad sin complicar nada.
        const cycle = ["star", "bird", "balloon"];
        const type = cycle[this._nextPrizeIsBalloon % cycle.length];
        this._nextPrizeIsBalloon++;
        const points = type === "star" ? 20 : type === "bird" ? 30 : [10, 40, 100][Math.floor(Math.random() * 3)];
        this.prizes.push({
          type,
          points,
          x: this.w + 60,
          // Altura calculada para que SIEMPRE haga falta saltar (por
          // encima de la cabeza de Cerebrín de pie, ~85px) y SIEMPRE sea
          // alcanzable en el punto más alto del salto (ahora ~148px, con
          // margen de sobra en ambos extremos).
          y: 118 + Math.random() * 34,
          size: type === "star" ? 44 : type === "bird" ? 38 : 46,
          collected: false,
          missed: false,
          spin: 0,
        });
        this.nextPrizeAt = 5000 + Math.random() * 2600;
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
      if (pr.collected || pr.missed) return;
      const prLeft = pr.x - pr.size / 2;
      const prRight = pr.x + pr.size / 2;
      const prTop = this.groundY - pr.y - pr.size / 2;
      const prBottom = this.groundY - pr.y + pr.size / 2;
      const overlapX = cerebrinRight > prLeft && cerebrinLeft < prRight;
      const overlapY = cerebrinTop < prBottom && this.groundY + this.cerebrinY > prTop;
      if (overlapX && overlapY) {
        pr.collected = true;
        this.addPoints(pr.points);
        this.callbacks.onPrizeCollected?.();
      } else if (prRight < 0) {
        // Se quedó sin cogerlo: penalización pequeña, para animar a
        // intentarlo la próxima vez sin que resulte grave.
        pr.missed = true;
        this.addPoints(-3);
        this.callbacks.onPrizeMissed?.();
      }
    });
    this.prizes = this.prizes.filter((pr) => pr.x > -60);
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

    // Suelo (con un poco de "hierba" sencilla)
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

    // Animales-obstáculo: al chocar, se ponen en rojo y van recuperando
    // su color original poco a poco (nunca se quedan en rojo fijo), con
    // una pequeña sacudida a modo de señal de error.
    this.obstacles.forEach((ob) => {
      const bob = Math.sin(ob.wobble) * 2;
      const sinceHit = ob.hit ? this.elapsed - ob.hitAt : Infinity;
      const shake = sinceHit < 260 ? Math.sin(sinceHit * 0.14) * (1 - sinceHit / 260) * 6 : 0;
      const hitFade = ob.hit ? Math.max(0, 1 - sinceHit / 700) : 0; // 0 = color normal, 1 = rojo total
      ctx.save();
      ctx.translate(ob.x + ob.width / 2 + shake, groundY + bob);
      this._animalPath(ctx, ob.animal, ob.width, ob.height, ob.legPhase, hitFade);
      ctx.restore();
    });

    // Premios: estrellas, pajaritos y globos, cada uno con su valor bien
    // visible, meciéndose suavemente en el aire.
    this.prizes.forEach((pr) => {
      if (pr.collected || pr.missed) return;
      ctx.save();
      ctx.translate(pr.x, groundY - pr.y);
      if (pr.type === "bird") {
        ctx.rotate(Math.sin(pr.spin) * 0.12);
        this._birdPath(ctx, pr.size);
      } else if (pr.type === "balloon") {
        this._balloonPath(ctx, pr.size, pr.points, Math.sin(pr.spin) * 0.08);
      } else {
        ctx.rotate(Math.sin(pr.spin) * 0.35);
        ctx.fillStyle = "#F5A93E";
        this._starPath(ctx, 0, 0, pr.size / 2, pr.size / 4.4, 5);
        ctx.fill();
      }
      ctx.restore();
      if (pr.type === "star" || pr.type === "bird") {
        ctx.save();
        ctx.fillStyle = "#2B2B2E";
        ctx.font = "bold 15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`+${pr.points}`, pr.x, groundY - pr.y + pr.size / 2 + 18);
        ctx.restore();
      }
    });

    // Cerebrín: apoyado exactamente sobre la línea del suelo, con un
    // pequeño efecto de "chafado" al despegar/aterrizar, y un temblor
    // rápido y breve si acaba de chocar ("¡Ups!").
    const groundContactY = groundY + this.cerebrinY;
    const shaking = this.elapsed < this.shakeUntil;
    const shakeX = shaking ? Math.sin(this.elapsed * 0.09) * 5 : 0;
    ctx.save();
    ctx.translate(this.cerebrinX + shakeX, groundContactY);
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
    ctx.fillStyle = "#4E7FBF";
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#395E91";
    ctx.beginPath();
    ctx.ellipse(-r * 0.15, r * 0.05, r * 0.55, r * 0.34, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#F5A93E";
    ctx.beginPath();
    ctx.moveTo(r * 0.85, -r * 0.08);
    ctx.lineTo(r * 1.25, 0);
    ctx.lineTo(r * 0.85, r * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#2B2B2E";
    ctx.beginPath();
    ctx.arc(r * 0.42, -r * 0.22, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Globo de colores con su valor de puntos integrado y bien legible. */
  _balloonPath(ctx, size, points, tilt) {
    const colors = { 10: "#7FA8DE", 40: "#F5A93E", 100: "#E85F73" };
    ctx.save();
    ctx.rotate(tilt);
    const r = size / 2;
    // Hilo
    ctx.strokeStyle = "#B0A98C";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, r * 1.1);
    ctx.lineTo(0, r * 1.9);
    ctx.stroke();
    // Globo
    ctx.fillStyle = colors[points] || "#7FA8DE";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.86, r, 0, 0, Math.PI * 2);
    ctx.fill();
    // Brillo
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.22, r * 0.3, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Nudo
    ctx.fillStyle = colors[points] || "#7FA8DE";
    ctx.beginPath();
    ctx.moveTo(-4, r * 0.95);
    ctx.lineTo(4, r * 0.95);
    ctx.lineTo(0, r * 1.12);
    ctx.closePath();
    ctx.fill();
    // Valor, integrado y legible
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 15px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`+${points}`, 0, -2);
    ctx.textBaseline = "alphabetic";
    ctx.restore();
  }

  /**
   * Animal-obstáculo genérico: silueta grande, reconocible y simpática,
   * con las patas moviéndose ligeramente para dar sensación de carrera.
   * `hitFade` (0-1) tiñe de rojo el cuerpo al chocar, recuperando su
   * color original poco a poco.
   */
  _animalPath(ctx, animal, width, height, legPhase, hitFade) {
    const bodyColor = this._mixWithRed(animal.body, hitFade);
    const accentColor = this._mixWithRed(animal.accent, hitFade * 0.7);
    const legSwing = Math.sin(legPhase) * 5;

    // Patas
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    [-width * 0.28, -width * 0.08, width * 0.1, width * 0.3].forEach((lx, i) => {
      const sw = i % 2 === 0 ? legSwing : -legSwing;
      ctx.beginPath();
      ctx.moveTo(lx, -height * 0.22);
      ctx.lineTo(lx + sw * 0.3, 0);
      ctx.stroke();
    });

    // Cuerpo
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, -height * 0.42, width * 0.42, height * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cabeza y rasgos distintivos por tipo de animal
    const headX = width * 0.36;
    const headY = -height * 0.55;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(headX, headY, width * 0.18, height * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    if (animal.kind === "sheep") {
      // Lana rizada (varios círculos superpuestos) y patas negras ya cubren el resto.
      ctx.fillStyle = bodyColor;
      [[-0.1, -0.2], [0.08, -0.32], [-0.28, -0.1]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(width * dx, height * dy - height * 0.42, width * 0.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.ellipse(headX + 4, headY + 2, width * 0.1, height * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (animal.kind === "goat") {
      // Cuernecitos y barbita
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(headX - 2, headY - height * 0.18);
      ctx.lineTo(headX - 6, headY - height * 0.32);
      ctx.moveTo(headX + 6, headY - height * 0.18);
      ctx.lineTo(headX + 10, headY - height * 0.32);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(headX + 2, headY + height * 0.16);
      ctx.lineTo(headX + 2, headY + height * 0.28);
      ctx.stroke();
    } else if (animal.kind === "donkey") {
      // Orejas largas: rasgo distintivo inmediato
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.ellipse(headX - 4, headY - height * 0.32, width * 0.06, height * 0.22, -0.3, 0, Math.PI * 2);
      ctx.ellipse(headX + 8, headY - height * 0.32, width * 0.06, height * 0.22, 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (animal.kind === "cow") {
      // Manchas
      ctx.fillStyle = accentColor;
      [[-0.12, -0.4], [0.14, -0.36], [-0.02, -0.5]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.ellipse(width * dx, height * dy, width * 0.09, height * 0.07, 0.3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.beginPath();
      ctx.moveTo(headX - 3, headY - height * 0.18);
      ctx.lineTo(headX - 5, headY - height * 0.28);
      ctx.moveTo(headX + 5, headY - height * 0.18);
      ctx.lineTo(headX + 7, headY - height * 0.28);
      ctx.strokeStyle = "#E7DCC0";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Ojo (mismo para todos, da vida al conjunto)
    ctx.fillStyle = "#2B2B2E";
    ctx.beginPath();
    ctx.arc(headX + width * 0.06, headY - height * 0.02, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Mezcla un color hexadecimal con rojo, en la proporción `amount`
   * (0 = color original, 1 = rojo total) — para el efecto de choque. */
  _mixWithRed(hex, amount) {
    if (amount <= 0) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const target = [230, 57, 70];
    const mix = (c, t) => Math.round(c + (t - c) * amount);
    return `rgb(${mix(r, target[0])}, ${mix(g, target[1])}, ${mix(b, target[2])})`;
  }
}
