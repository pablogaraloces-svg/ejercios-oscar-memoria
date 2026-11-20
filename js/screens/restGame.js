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
  { kind: "goat", emoji: "🐐" },
  { kind: "sheep", emoji: "🐑" },
  { kind: "donkey", emoji: "🫏" },
  { kind: "cow", emoji: "🐮" },
];

// Más peso para los globos (aparecen con más frecuencia que el resto),
// alternando también con frutas — variedad de premios "que flotan".
const PRIZE_CYCLE = ["star", "balloon", "fruit", "balloon", "bird", "balloon"];
// "Vitamina" (power-up al estilo de los clásicos de plataformas): al
// cogerla, durante un rato Cerebrín puede dar un DOBLE SALTO (pulsar
// SALTAR otra vez en el aire). Aparece de vez en cuando, nunca seguida.
const VITAMIN_DURATION_MS = 15000;
const VITAMIN_FIRST_MS = 20000;
const VITAMIN_GAP_MIN_MS = 38000;
const VITAMIN_GAP_MAX_MS = 52000;
const GRAVITY = 1350;

const FRUITS = [
  { kind: "apple", points: 15 },
  { kind: "cherry", points: 25 },
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
    // Vitamina / doble salto
    this.vitamins = [];
    this.nextVitaminAt = VITAMIN_FIRST_MS;
    this.powerUntil = 0;
    this._wasPowered = false;
    this.airJumpsLeft = 0;
    this.floaty = false; // tras el doble salto cae algo más despacio (planea)
    this.flipStart = -9999; // voltereta del doble salto
    this.sparkles = [];
  }

  /** ¿Tiene ahora mismo el súper poder de la vitamina? */
  _powered() {
    return this.elapsed < this.powerUntil;
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
    if (this.finished) return;
    if (this.jumping) {
      // Doble salto (solo con la vitamina activa): un segundo impulso en
      // el aire, con voltereta y destellos. Nunca saca a Cerebrín por
      // arriba del escenario: el impulso se calcula según la altura que
      // le queda libre, y después cae planeando un poco más despacio.
      if (this._powered() && this.airJumpsLeft > 0) {
        this.airJumpsLeft--;
        const maxH = this._maxJumpHeight();
        const free = Math.max(0, maxH - -this.cerebrinY);
        this.velocityY = -Math.max(260, Math.sqrt(2 * GRAVITY * free));
        this.floaty = true;
        this.flipStart = this.elapsed;
        this.squash = 1.15;
        this._burstSparkles(this.cerebrinX, this.groundY + this.cerebrinY - 10, 12);
        this.callbacks.onDoubleJump?.();
      }
      return;
    }
    this.jumping = true;
    this.airJumpsLeft = this._powered() ? 1 : 0;
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
      this.velocityY += GRAVITY * (this.floaty && this.velocityY > 0 ? 0.6 : 1) * dt; // gravedad
      this.cerebrinY += this.velocityY * dt;
      const maxH = this._maxJumpHeight();
      if (this.cerebrinY < -maxH) {
        this.cerebrinY = -maxH;
        this.velocityY = Math.max(this.velocityY, 0);
      }
      if (this.cerebrinY >= 0) {
        this.cerebrinY = 0;
        this.velocityY = 0;
        this.jumping = false;
        this.floaty = false;
        this.squash = 0.86; // se "achata" un instante al aterrizar
      }
    }

    // Fin del súper poder: aviso sonoro (lo gestiona gamePlayer).
    const powered = this._powered();
    if (this._wasPowered && !powered) this.callbacks.onPowerDown?.();
    this._wasPowered = powered;
    // Estela de destellos mientras dura el poder.
    if (powered && Math.random() < dt * 9) {
      this._burstSparkles(this.cerebrinX - 18, this.groundY + this.cerebrinY - this.cerebrinDrawH * (0.3 + Math.random() * 0.5), 1);
    }
    this.sparkles.forEach((sp) => {
      sp.x += (sp.vx - this.scrollSpeed * 0.35) * dt;
      sp.y += sp.vy * dt;
      sp.vy += 120 * dt;
      sp.life -= dt;
    });
    this.sparkles = this.sparkles.filter((sp) => sp.life > 0);
    // El efecto de chafado se recupera suavemente hacia 1 (tamaño normal).
    this.squash += (1 - this.squash) * Math.min(1, dt * 10);

    this._updateObstacles(dt, progress);
    this._updatePrizes(dt, progress);
    this._updateVitamins(dt);
  }

  /** Altura máxima (sobre el suelo) a la que puede llegar Cerebrín sin
   * salirse por arriba del escenario. */
  _maxJumpHeight() {
    return this.groundY - this.cerebrinDrawH - 6;
  }

  _burstSparkles(x, y, count) {
    const colors = ["#FFD54A", "#FFFFFF", "#F5A93E", "#7FCC9A"];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 90;
      this.sparkles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 30,
        life: 0.5 + Math.random() * 0.4,
        size: 4 + Math.random() * 4,
        color: colors[i % colors.length],
      });
    }
  }

  _updateVitamins(dt) {
    this.nextVitaminAt -= dt * 1000;
    if (this.nextVitaminAt <= 0) {
      const busy =
        this._powered() ||
        this.vitamins.some((v) => !v.collected) ||
        this.obstacles.some((ob) => ob.x > this.w - 80 && ob.x < this.w + 260) ||
        this.prizes.some((pr) => pr.x > this.w - 60);
      if (busy || this.finished) {
        this.nextVitaminAt = 700; // se reintenta en cuanto haya hueco
      } else {
        this.vitamins.push({ x: this.w + 60, y: 122 + Math.random() * 16, size: 46, spin: 0, collected: false, collectedAt: 0 });
        this.nextVitaminAt = VITAMIN_GAP_MIN_MS + Math.random() * (VITAMIN_GAP_MAX_MS - VITAMIN_GAP_MIN_MS);
      }
    }

    const cerebrinLeft = this.cerebrinX - CEREBRIN_SIZE / 2 + 8;
    const cerebrinRight = this.cerebrinX + CEREBRIN_SIZE / 2 - 8;
    const cerebrinTop = this.groundY + this.cerebrinY - this.cerebrinDrawH;
    this.vitamins.forEach((v) => {
      v.x -= this.scrollSpeed * dt;
      v.spin += dt * 2;
      if (v.collected) return;
      const half = v.size / 2 + 4; // un poco generosa: que sea fácil cogerla
      const top = this.groundY - v.y - half;
      const bottom = this.groundY - v.y + half;
      if (cerebrinRight > v.x - half && cerebrinLeft < v.x + half && cerebrinTop < bottom && this.groundY + this.cerebrinY > top) {
        v.collected = true;
        v.collectedAt = this.elapsed;
        this.powerUntil = this.elapsed + VITAMIN_DURATION_MS;
        this._wasPowered = true;
        // Si la coge en pleno salto, ya puede usar el doble salto en ese mismo salto.
        if (this.jumping) this.airJumpsLeft = 1;
        this.addPoints(25);
        this._burstSparkles(v.x, this.groundY - v.y, 18);
        this.callbacks.onPowerUp?.();
      }
    });
    this.vitamins = this.vitamins.filter((v) => (v.collected ? this.elapsed - v.collectedAt < 600 : v.x > -60));
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
        // Más pequeños que antes (eran 62x52 y se dibujaban casi tan altos
        // como el salto): ahora queda margen de sobra por encima.
        width: 50,
        height: 40,
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
      const tooClose =
        this.obstacles.some((ob) => ob.x > this.w - 60 && ob.x < this.w + 260) ||
        this.vitamins.some((v) => !v.collected && v.x > this.w - 120);
      if (!tooClose) {
        // Se turnan estrella / pájaro / fruta / globo. La fruta aparece
        // en pequeñas ráfagas de 2-3 seguidas (como un arco de monedas),
        // en vez de una sola suelta.
        const type = PRIZE_CYCLE[this._nextPrizeIsBalloon % PRIZE_CYCLE.length];
        this._nextPrizeIsBalloon++;
        if (type === "fruit") {
          const count = 2 + Math.floor(Math.random() * 2); // 2 o 3 seguidas
          const baseY = 118 + Math.random() * 18;
          for (let i = 0; i < count; i++) {
            const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
            this.prizes.push(this._makePrize("fruit", fruit.points, i * 44, baseY + Math.sin(i * 1.1) * 16, fruit.kind));
          }
        } else {
          const points = type === "star" ? 20 : type === "bird" ? 30 : [10, 40, 100][Math.floor(Math.random() * 3)];
          this.prizes.push(this._makePrize(type, points, 0, 118 + Math.random() * 34, null));
        }
        // Más frecuentes que antes, para que haya más premios al saltar.
        this.nextPrizeAt = 2600 + Math.random() * 1300;
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
        pr.collectedAt = this.elapsed;
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
    // Los premios recogidos se quedan un instante más (con su propia
    // animación de "conseguido", ver _draw) antes de desaparecer del todo.
    this.prizes = this.prizes.filter((pr) => {
      if (pr.collected) return this.elapsed - pr.collectedAt < 480;
      return pr.x > -60;
    });
  }

  /** Crea un premio nuevo; `xOffset` permite colocar varios seguidos en
   * una pequeña ráfaga (arco de fruta), como en un videojuego arcade
   * clásico de monedas. */
  _makePrize(type, points, xOffset, y, fruitKind) {
    return {
      type,
      fruitKind,
      points,
      x: this.w + 60 + xOffset,
      // Altura calculada para que SIEMPRE haga falta saltar (por encima
      // de la cabeza de Cerebrín de pie, ~85px) y SIEMPRE sea alcanzable
      // en el punto más alto del salto (~148px), con margen de sobra.
      y,
      size: type === "star" ? 44 : type === "bird" ? 38 : type === "fruit" ? 38 : 46,
      collected: false,
      missed: false,
      collectedAt: 0,
      spin: 0,
    };
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

    // Montañas lejanas, muy despacio (fondo, para dar sensación de
    // profundidad sin distraer).
    ctx.fillStyle = "rgba(148, 140, 172, 0.32)";
    [0.05, 0.38, 0.68, 0.95].forEach((frac, i) => {
      const mx = ((w * frac - t * 7) % (w + 200) + (w + 200)) % (w + 200) - 100;
      const peakY = groundY - 58 - (i % 2) * 18;
      ctx.beginPath();
      ctx.moveTo(mx - 85, groundY);
      ctx.lineTo(mx, peakY);
      ctx.lineTo(mx + 85, groundY);
      ctx.closePath();
      ctx.fill();
    });

    // Árboles, un poco más cerca y más rápidos que las montañas (efecto
    // de profundidad "parallax"): son los que más dan sensación real de
    // que Cerebrín está corriendo por el escenario.
    ctx.fillStyle = "rgba(79, 152, 104, 0.55)";
    [0.08, 0.32, 0.58, 0.8].forEach((frac, i) => {
      const tx = ((w * frac - t * 42) % (w + 100) + (w + 100)) % (w + 100) - 50;
      const treeH = 42 + (i % 2) * 8;
      ctx.beginPath();
      ctx.moveTo(tx, groundY - treeH);
      ctx.lineTo(tx - 17, groundY - 6);
      ctx.lineTo(tx + 17, groundY - 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(139, 94, 60, 0.6)";
      ctx.fillRect(tx - 3, groundY - 8, 6, 10);
      ctx.fillStyle = "rgba(79, 152, 104, 0.55)";
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

    // Premios: estrellas, pajaritos, globos y frutas, cada uno con su
    // valor bien visible, meciéndose suavemente en el aire. Al
    // recogerlos, un pequeño "destello + puntos flotando hacia arriba"
    // (igual que las monedas de un videojuego de plataformas clásico),
    // en vez de desaparecer de golpe.
    this.prizes.forEach((pr) => {
      if (pr.missed) return;
      if (pr.collected) {
        const t = Math.min(1, (this.elapsed - pr.collectedAt) / 480);
        const floatY = groundY - pr.y - t * 46;
        const scale = 1 + t * 0.5;
        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.translate(pr.x, floatY);
        ctx.scale(scale, scale);
        ctx.fillStyle = "#FFD54A";
        this._starPath(ctx, 0, 0, 13, 5.5, 6);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.fillStyle = "#2E7D4F";
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`+${pr.points}`, pr.x, floatY - 22);
        ctx.restore();
        return;
      }
      ctx.save();
      ctx.translate(pr.x, groundY - pr.y);
      if (pr.type === "bird") {
        ctx.rotate(Math.sin(pr.spin) * 0.12);
        this._birdPath(ctx, pr.size);
      } else if (pr.type === "balloon") {
        this._balloonPath(ctx, pr.size, pr.points, Math.sin(pr.spin) * 0.08);
      } else if (pr.type === "fruit") {
        ctx.rotate(Math.sin(pr.spin) * 0.18);
        this._fruitPath(ctx, pr.fruitKind, pr.size);
      } else {
        ctx.rotate(Math.sin(pr.spin) * 0.35);
        ctx.fillStyle = "#F5A93E";
        this._starPath(ctx, 0, 0, pr.size / 2, pr.size / 4.4, 5);
        ctx.fill();
      }
      ctx.restore();
      if (pr.type === "star" || pr.type === "bird" || pr.type === "fruit") {
        ctx.save();
        ctx.fillStyle = "#2B2B2E";
        ctx.font = "bold 15px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`+${pr.points}`, pr.x, groundY - pr.y + pr.size / 2 + 18);
        ctx.restore();
      }
    });

    // Vitamina: cápsula brillante que flota con un halo que late y dos
    // destellos girando alrededor (como el champiñón/estrella de los
    // clásicos de plataformas: se reconoce de un vistazo que es "especial").
    this.vitamins.forEach((v) => {
      const cy = groundY - v.y + Math.sin(v.spin * 1.6) * 5;
      if (v.collected) {
        const k = Math.min(1, (this.elapsed - v.collectedAt) / 600);
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = "#E85F73";
        ctx.font = "900 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("¡DOBLE SALTO!", v.x, cy - 20 - k * 40);
        ctx.restore();
        return;
      }
      this._vitaminPath(ctx, v.x, cy, v.size, v.spin);
    });

    // Destellos (doble salto, vitamina y estela del súper poder).
    this.sparkles.forEach((sp) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, sp.life * 2));
      ctx.fillStyle = sp.color;
      this._starPath(ctx, sp.x, sp.y, sp.size, sp.size / 2.4, 4);
      ctx.fill();
      ctx.restore();
    });

    // Cerebrín: apoyado exactamente sobre la línea del suelo, con un
    // pequeño efecto de "chafado" al despegar/aterrizar, y un temblor
    // rápido y breve si acaba de chocar ("¡Ups!").
    const groundContactY = groundY + this.cerebrinY;
    const shaking = this.elapsed < this.shakeUntil;
    const shakeX = shaking ? Math.sin(this.elapsed * 0.09) * 5 : 0;
    // Súper poder activo: halo dorado que late detrás de Cerebrín. En los
    // 3 últimos segundos parpadea, para avisar de que se va a acabar.
    const powered = this._powered();
    if (powered) {
      const left = this.powerUntil - this.elapsed;
      const blinkOff = left < 3000 && Math.floor(left / 160) % 2 === 0;
      if (!blinkOff) {
        const cy = groundContactY - this.cerebrinDrawH * 0.5;
        const r = this.cerebrinDrawH * (0.78 + Math.sin(this.elapsed / 140) * 0.06);
        const halo = ctx.createRadialGradient(this.cerebrinX, cy, 4, this.cerebrinX, cy, r);
        halo.addColorStop(0, "rgba(255, 224, 120, 0.55)");
        halo.addColorStop(0.6, "rgba(255, 196, 70, 0.22)");
        halo.addColorStop(1, "rgba(255, 196, 70, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(this.cerebrinX, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.save();
    ctx.translate(this.cerebrinX + shakeX, groundContactY);
    // Voltereta completa al hacer el doble salto (gira sobre su centro).
    const flipT = (this.elapsed - this.flipStart) / 480;
    if (flipT >= 0 && flipT < 1) {
      const ease = 1 - Math.pow(1 - flipT, 3);
      ctx.translate(0, -this.cerebrinDrawH / 2);
      ctx.rotate(ease * Math.PI * 2);
      ctx.translate(0, this.cerebrinDrawH / 2);
    }
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

    // Indicador del súper poder (arriba a la izquierda): cápsula + barra
    // que se va vaciando, para ver cuánto tiempo queda de doble salto.
    if (powered) {
      const left = Math.max(0, this.powerUntil - this.elapsed) / VITAMIN_DURATION_MS;
      const bw = 190, bh = 40, bx = this.w - bw - 12, by = 12;
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      this._roundedRectPath(ctx, bx, by, bw, bh, 20);
      ctx.fill();
      this._vitaminPath(ctx, bx + 22, by + bh / 2, 26, 0, true);
      ctx.fillStyle = "#B4421F";
      ctx.font = "900 15px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("DOBLE SALTO", bx + 42, by + 17);
      ctx.fillStyle = "rgba(0,0,0,0.10)";
      this._roundedRectPath(ctx, bx + 42, by + 24, bw - 56, 8, 4);
      ctx.fill();
      ctx.fillStyle = left < 0.2 ? "#E85F73" : "#F5A93E";
      this._roundedRectPath(ctx, bx + 42, by + 24, Math.max(8, (bw - 56) * left), 8, 4);
      ctx.fill();
      ctx.restore();
    }
  }

  /** Vitamina: cápsula bicolor (naranja/amarilla) con brillo, halo que
   * late y dos destellos orbitando. `small` = versión del indicador. */
  _vitaminPath(ctx, x, y, size, spin, small = false) {
    ctx.save();
    ctx.translate(x, y);
    if (!small) {
      const pulse = 1 + Math.sin(spin * 3) * 0.08;
      const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, size * 0.95 * pulse);
      halo.addColorStop(0, "rgba(255, 230, 140, 0.75)");
      halo.addColorStop(1, "rgba(255, 210, 90, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.95 * pulse, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 2; i++) {
        const a = spin * 2.2 + i * Math.PI;
        ctx.fillStyle = "#FFFFFF";
        this._starPath(ctx, Math.cos(a) * size * 0.72, Math.sin(a) * size * 0.42, 5, 2, 4);
        ctx.fill();
      }
      ctx.rotate(-0.5 + Math.sin(spin) * 0.15);
    } else {
      ctx.rotate(-0.5);
    }
    const len = size, r = size * 0.27;
    // mitad izquierda (naranja)
    ctx.fillStyle = "#FF7A3D";
    ctx.beginPath();
    ctx.arc(-len / 2 + r, 0, r, Math.PI / 2, (Math.PI * 3) / 2);
    ctx.lineTo(0, -r);
    ctx.lineTo(0, r);
    ctx.closePath();
    ctx.fill();
    // mitad derecha (amarilla)
    ctx.fillStyle = "#FFD54A";
    ctx.beginPath();
    ctx.arc(len / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(0, r);
    ctx.lineTo(0, -r);
    ctx.closePath();
    ctx.fill();
    // contorno suave + brillo
    ctx.strokeStyle = "rgba(150, 60, 20, 0.45)";
    ctx.lineWidth = small ? 1.5 : 2;
    this._roundedRectPath(ctx, -len / 2, -r, len, r * 2, r);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    this._roundedRectPath(ctx, -len / 2 + r * 0.6, -r * 0.62, len - r * 1.6, r * 0.42, r * 0.21);
    ctx.fill();
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

  /** Fruta sencilla y reconocible (manzana o cereza), dibujada a mano. */
  _fruitPath(ctx, kind, size) {
    const r = size / 2;
    if (kind === "cherry") {
      // Dos cerezas unidas por un tallito, rojo intenso.
      ctx.strokeStyle = "#4F9868";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.quadraticCurveTo(r * 0.1, -r * 1.3, r * 0.35, -r * 1.35);
      ctx.moveTo(0, -r * 0.9);
      ctx.quadraticCurveTo(-r * 0.1, -r * 1.15, -r * 0.3, -r * 0.95);
      ctx.stroke();
      ctx.fillStyle = "#C8253D";
      [[-r * 0.32, -r * 0.55], [r * 0.28, -r * 0.35]].forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.arc(-r * 0.42, -r * 0.65, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Manzana: cuerpo redondeado, hoja y rabito.
      ctx.fillStyle = "#4F9868";
      ctx.beginPath();
      ctx.ellipse(r * 0.22, -r * 1.05, r * 0.22, r * 0.13, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8B5E3C";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.78);
      ctx.lineTo(r * 0.06, -r * 1.05);
      ctx.stroke();
      ctx.fillStyle = "#E1462F";
      ctx.beginPath();
      ctx.arc(-r * 0.18, 0, r * 0.62, 0, Math.PI * 2);
      ctx.arc(r * 0.22, 0, r * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.28, -r * 0.22, r * 0.14, r * 0.22, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Animal-obstáculo: el mismo emoji ya usado en el ejercicio de
   * Animales (🐐🐑🫏🐮), reconocible al instante — mucho más claro que
   * una silueta dibujada a mano, y sin el problema de la oveja
   * apenas distinguible del fondo.
   *
   * Como un emoji no se puede "recolorear" directamente, el aviso de
   * choque se hace con un resplandor rojo detrás del animal que se
   * desvanece poco a poco (mismo efecto percibido: "chocó, ahora se
   * nota en rojo, y se recupera solo").
   */
  _animalPath(ctx, animal, width, height, legPhase, hitFade) {
    const bob = Math.abs(Math.sin(legPhase)) * 4; // pequeño rebote al correr

    if (hitFade > 0) {
      ctx.save();
      const glow = ctx.createRadialGradient(0, -height * 0.45, 2, 0, -height * 0.45, width * 0.7);
      glow.addColorStop(0, `rgba(230, 57, 70, ${0.55 * hitFade})`);
      glow.addColorStop(1, "rgba(230, 57, 70, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -height * 0.45, width * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.font = `${Math.round(height * 1.45)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(animal.emoji, 0, -bob + 2);
    ctx.restore();
  }
}
