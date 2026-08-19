import { DB, uid } from "../core/db.js";
import {
  getGreeting,
  getSpokenDate,
  getCurrentTimeText,
  getWellbeingQuestions,
  pickMotivation,
  pickClosing,
  pickNextExercisePhrase,
  pickMoodPositiveReaction,
  pickMoodEncourageReaction,
  pickInactivityHint,
  fillName,
  applyNameBudget,
} from "../core/phrases.js";
import { Voice } from "../core/voice.js";
import { Sounds } from "../core/sounds.js";
import { HintFlow } from "../core/hints.js";
import { reportResult } from "../core/adaptiveDifficulty.js";
import { getReminders, markReminderDoneToday, unmarkReminderDoneToday } from "../core/reminders.js";
import { buildFamilyIdentityPhrase } from "../core/familyPhrase.js";
import { buildSessionExercises, CATEGORY_LABELS } from "../exercises/index.js";
import { burstConfetti, celebrateSuccess } from "../core/confetti.js";

const INACTIVITY_MS = 60000;
const POSITIVE_MOODS = new Set(["Muy bien", "Bien"]);

function getPartOfDay() {
  const h = new Date().getHours();
  if (h < 6) return "madrugada";
  if (h < 13) return "mañana";
  if (h < 20) return "tarde";
  return "noche";
}

export class SessionRunner {
  constructor({ contentEl, mascot, bubbleEl, progressFillEl, stepLabelEl, profile, settings }) {
    this.contentEl = contentEl;
    this.mascot = mascot;
    this.bubbleEl = bubbleEl;
    this.progressFillEl = progressFillEl;
    this.stepLabelEl = stepLabelEl;
    this.profile = profile;
    this.settings = settings;
    this.stats = { correct: 0, total: 0 };
    this.steps = [];
    this.stepIndex = 0;
    this.inactivityTimer = null;
  }

  async start(onFinish) {
    this.onFinish = onFinish;
    this.startedAt = Date.now();

    const part = getPartOfDay();
    const wellbeing = getWellbeingQuestions(part);
    const reminders = (await getReminders(this.profile.id)).filter((r) => r.enabled);
    const exercises = await buildSessionExercises(this.profile, this.settings.exercisesPerSession || 20);

    this.steps = [
      { type: "greeting" },
      ...wellbeing.map((q) => ({ type: "wellbeing", question: q })),
      ...(reminders.length ? [{ type: "reminders", reminders }] : []),
      ...exercises.map((ex) => ({ type: "exercise", exercise: ex })),
      { type: "closing" },
    ];
    this.renderStep();
  }

  say(text) {
    this.bubbleEl.textContent = text;
    this.bubbleEl.classList.remove("hidden");
    this.bubbleEl.classList.add("fade-in");
    Voice.say(text, {
      onStart: () => this.mascot.startTalking(),
      onEnd: () => this.mascot.stopTalking(),
    });
  }

  /** Habla `spoken` (si existe) pero muestra `visible` en la burbuja de texto. */
  sayVisibleVsSpoken(visible, spoken) {
    this.bubbleEl.textContent = visible;
    this.bubbleEl.classList.remove("hidden");
    this.bubbleEl.classList.add("fade-in");
    Voice.say(spoken || visible, {
      onStart: () => this.mascot.startTalking(),
      onEnd: () => this.mascot.stopTalking(),
    });
  }

  updateProgress() {
    const pct = Math.round((this.stepIndex / (this.steps.length - 1)) * 100);
    this.progressFillEl.style.width = `${pct}%`;
    this.stepLabelEl.textContent = `${this.stepIndex + 1} / ${this.steps.length}`;
  }

  next() {
    this.clearInactivityTimer();
    clearTimeout(this._advanceTimer);
    if (this.stepIndex < this.steps.length - 1) {
      this.stepIndex++;
      this.renderStep();
    }
  }

  /** Vuelve al paso inmediatamente anterior de la sesión (ejercicio, saludo,
   * recordatorios...), reutilizando el mismo render que usa "siguiente". */
  back() {
    this.clearInactivityTimer();
    clearTimeout(this._advanceTimer);
    if (this.stepIndex > 0) {
      this.stepIndex--;
      this.renderStep();
    }
  }

  /**
   * Avance automático (sin botón): la app conduce a Óscar de una pantalla a
   * la siguiente por sí sola, esperando lo necesario para que la voz y la
   * animación terminen con calma (con un margen extra de ~3s) antes de
   * seguir. Cada llamada reemplaza cualquier avance pendiente anterior.
   */
  scheduleAutoAdvance(delayMs) {
    clearTimeout(this._advanceTimer);
    this._advanceTimer = setTimeout(() => this.next(), delayMs + 3000);
  }

  /** Igual que scheduleAutoAdvance pero sin el margen extra de 3s: para
   * pantallas donde el tiempo pedido debe cumplirse tal cual (p.ej. "Antes
   * de seguir", que no lleva voz larga de por medio). */
  scheduleExactAdvance(delayMs) {
    clearTimeout(this._advanceTimer);
    this._advanceTimer = setTimeout(() => this.next(), delayMs);
  }

  /* -------- Aviso pasados 60s sin tocar nada -------- */
  startInactivityTimer(onTrigger) {
    this.clearInactivityTimer();
    this.inactivityTimer = setTimeout(() => {
      Voice.say(fillName(pickInactivityHint(), this.profile.name));
      onTrigger?.();
    }, INACTIVITY_MS);
  }
  clearInactivityTimer() {
    clearTimeout(this.inactivityTimer);
    this.inactivityTimer = null;
  }

  renderStep() {
    this.clearInactivityTimer();
    clearTimeout(this._advanceTimer);
    // Presupuesto de nombre: como máximo se dice "Óscar" una vez por
    // pantalla/ejercicio (se reinicia limpio en cada paso nuevo).
    this._nameBudget = { used: false };
    this.updateProgress();
    this.mascot.idle();
    this.contentEl.innerHTML = "";
    this.contentEl.classList.remove("fade-in");
    void this.contentEl.offsetWidth;
    this.contentEl.classList.add("fade-in");

    const step = this.steps[this.stepIndex];
    if (step.type === "greeting") this.renderGreeting();
    else if (step.type === "wellbeing") this.renderWellbeing(step.question);
    else if (step.type === "reminders") this.renderReminders(step.reminders);
    else if (step.type === "exercise") this.renderExercise(step.exercise);
    else if (step.type === "closing") this.renderClosing();
  }

  renderGreeting() {
    const greetText = getGreeting(this.profile.name);
    const dateText = getSpokenDate();
    const timeText = `Ahora son las ${getCurrentTimeText()}.`;
    this._nameBudget.used = true; // el saludo ya dice el nombre una vez
    this.say(`${greetText} ${dateText} ${timeText}`);
    const box = document.createElement("div");
    box.className = "col center grow";
    box.innerHTML = `<div style="font-size:3.2rem;">👋</div>
      <h2 class="title-xl" style="text-align:center;">${greetText}</h2>
      <p class="text-md" style="text-align:center;">${dateText} · ${getCurrentTimeText()}</p>`;
    const btn = document.createElement("button");
    btn.className = "btn btn-success btn-huge btn-start-bigger";
    btn.style.marginTop = "28px";
    btn.textContent = "Estoy listo";
    btn.onclick = () => this.next();
    box.appendChild(btn);
    this.contentEl.appendChild(box);
  }

  renderWellbeing(question) {
    this.say(question.text);
    const box = document.createElement("div");
    box.className = "col center grow";
    box.innerHTML = `<div style="font-size:2.8rem;">💬</div><h2 class="title-xl" style="text-align:center;">${question.text}</h2>`;
    const options = document.createElement("div");
    options.className = "row wrap center";
    options.style.marginTop = "26px";
    options.style.gap = "16px";
    const moods = [
      { emoji: "😊", label: "Muy bien" },
      { emoji: "🙂", label: "Bien" },
      { emoji: "😐", label: "Regular" },
      { emoji: "😕", label: "No muy bien" },
    ];
    moods.forEach((m, i) => {
      const b = document.createElement("button");
      b.className = "option-card";
      b.style.minWidth = "150px";
      // Animación individual y escalonada: cada emoticono "respira" a su
      // propio ritmo, para que parezca vivo sin distraer ni moverse todos
      // a la vez.
      b.innerHTML = `<span class="emoji study-item-breathe" style="animation-delay:${(i * 0.28).toFixed(2)}s;">${m.emoji}</span><span>${m.label}</span>`;
      b.onclick = async () => {
        options.querySelectorAll("button").forEach((x) => (x.style.pointerEvents = "none"));
        b.classList.add("correct-flash");
        await DB.put("settings", {
          id: `mood_${new Date().toDateString()}_${question.key}`,
          date: new Date().toDateString(),
          key: question.key,
          value: m.label,
        });
        const isPositive = POSITIVE_MOODS.has(m.label);
        const reaction = applyNameBudget(
          isPositive ? pickMoodPositiveReaction() : pickMoodEncourageReaction(),
          this.profile.name,
          this._nameBudget
        );
        this.mascot.celebrate();
        this.say(reaction);
        this.scheduleAutoAdvance(Math.max(2200, Voice.estimateDurationMs(reaction)));
      };
      options.appendChild(b);
    });
    box.appendChild(options);
    this.contentEl.appendChild(box);
  }

  renderReminders(reminders) {
    const box = document.createElement("div");
    box.className = "col grow";
    box.innerHTML = `<h2 class="title-xl">Antes de seguir…</h2><p class="text-md">Marca lo que ya hayas hecho hoy.</p>`;
    this.say("¿Has podido hacer alguna de estas cositas hoy?");
    const list = document.createElement("div");
    list.className = "col";
    list.style.marginTop = "16px";
    list.style.gap = "12px";

    // Estado compartido de todos los recordatorios de este paso: mientras
    // no haya NINGUNO marcado, la pantalla no debe avanzar sola.
    const doneStates = {};
    const anyDone = () => Object.values(doneStates).some(Boolean);
    const evaluateAdvance = () => {
      if (anyDone()) {
        // Al terminar de marcar (o corregir), esperamos un momento breve
        // antes de continuar, por si quiere marcar alguna cosita más.
        this.scheduleExactAdvance(1200);
      } else {
        // Nada marcado todavía: no avanzar. Aun así, dejamos una red de
        // seguridad muy larga para que la pantalla nunca quede bloqueada
        // del todo si un día no hay ninguna actividad que marcar.
        this.scheduleExactAdvance(45000);
      }
    };

    reminders.forEach((rem) => {
      const row = document.createElement("div");
      row.className = "switch-row reminder-row";
      row.innerHTML = `<span class="row" style="gap:12px; font-size:var(--font-md); font-weight:700;">
          <span style="font-size:1.8rem;">${rem.emoji}</span> ${rem.label}
        </span>`;

      // Cada sesión empieza siempre con todo desmarcado (no se conserva el
      // estado de sesiones anteriores, aunque sean del mismo día). Se puede
      // marcar y desmarcar libremente para corregir un toque accidental.
      const doneBtn = document.createElement("button");
      doneBtn.type = "button";
      doneBtn.className = "btn btn-ghost reminder-done-btn";
      doneBtn.textContent = "Marcar hecho";
      doneStates[rem.id] = false;

      const setVisual = () => {
        if (doneStates[rem.id]) {
          doneBtn.textContent = "✔️ Hecho";
          doneBtn.classList.remove("btn-ghost");
          doneBtn.classList.add("reminder-done-btn-active");
        } else {
          doneBtn.textContent = "Marcar hecho";
          doneBtn.classList.add("btn-ghost");
          doneBtn.classList.remove("reminder-done-btn-active");
        }
      };

      doneBtn.addEventListener("click", async () => {
        doneStates[rem.id] = !doneStates[rem.id];
        setVisual();
        evaluateAdvance();
        try {
          if (doneStates[rem.id]) {
            this.mascot.celebrate();
            Sounds.playPositive();
            await markReminderDoneToday(this.profile.id, rem.id);
          } else {
            await unmarkReminderDoneToday(this.profile.id, rem.id);
          }
        } catch (err) {
          console.error("No se pudo actualizar el recordatorio:", err);
          doneStates[rem.id] = !doneStates[rem.id];
          setVisual();
        }
      });

      row.appendChild(doneBtn);
      list.appendChild(row);
    });
    box.appendChild(list);

    this.contentEl.appendChild(box);

    // Sin botón "Continuar": mientras no haya nada marcado, la pantalla
    // espera. En cuanto Óscar marque algo, avanza sola poco después.
    evaluateAdvance();
  }

  /* ---------------- Ejercicios ---------------- */

  renderExercise(ex) {
    this.stats.total++;
    this._exerciseCount = (this._exerciseCount || 0) + 1;
    const catLabel = CATEGORY_LABELS[ex.category] || "";
    this.mascot.thinking();

    // A partir del segundo ejercicio, la voz guía la transición (ya no hay
    // botón "Siguiente"), con una frase distinta cada vez.
    const transition =
      this._exerciseCount > 1
        ? `${applyNameBudget(pickNextExercisePhrase(), this.profile.name, this._nameBudget)} `
        : "";

    if (ex.kind !== "memory_recall") {
      const header = document.createElement("div");
      header.className = "col";
      header.innerHTML = `<span class="pill" style="align-self:flex-start;">${catLabel}</span>`;
      this.contentEl.appendChild(header);
      this.sayVisibleVsSpoken(transition + ex.prompt, transition + (ex.spokenPrompt || ex.prompt));
    } else {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = catLabel;
      this.contentEl.appendChild(pill);
      ex.__transitionPrefix = transition;
    }

    const hintFlow = new HintFlow({
      name: this.profile.name,
      nameBudget: this._nameBudget,
      onSoft: (msg) => this.say(msg),
      onPistaVoice: (msg) => this.say(msg),
      onVisualHint: () => this.showVisualHint(),
      onReveal: () => this.revealCorrect(ex),
    });
    this.currentHintFlow = hintFlow;

    if (ex.kind === "memory_recall") this.renderMemoryRecall(ex, hintFlow);
    else if (ex.kind === "photo_choice") this.renderPhotoChoice(ex, hintFlow);
    else if (ex.kind === "spot_diff") this.renderSpotDiff(ex, hintFlow);
    else if (ex.kind === "puzzle_piece") this.renderPuzzlePiece(ex, hintFlow);
    else this.renderChoice(ex, hintFlow);
  }

  renderMemoryRecall(ex, hintFlow) {
    const introText = (ex.__transitionPrefix || "") + applyNameBudget(ex.introText, this.profile.name, this._nameBudget);
    const introEl = document.createElement("p");
    introEl.className = "title-lg fade-in";
    introEl.style.textAlign = "center";
    introEl.style.marginTop = "8px";
    introEl.textContent = introText;
    this.contentEl.appendChild(introEl);
    this.say(introText);

    const studyBox = document.createElement("div");
    studyBox.className = "row wrap center fade-in";
    studyBox.style.gap = "26px";
    studyBox.style.marginTop = "20px";
    ex.studyItems.forEach((item, i) => {
      const card = document.createElement("div");
      card.className = "card col center";
      card.style.minWidth = "132px";
      // Animación suave e individual (tipo "genie"): cada dibujo respira a
      // su propio ritmo, para invitar a mirarlos con calma sin marear.
      card.innerHTML = `<span class="study-item-breathe" style="font-size:3.9rem; animation-delay:${(i * 0.35).toFixed(2)}s;">${item.emoji}</span>`;
      studyBox.appendChild(card);
    });
    this.contentEl.appendChild(studyBox);

    const timerNote = document.createElement("p");
    timerNote.className = "text-md";
    timerNote.style.textAlign = "center";
    timerNote.style.marginTop = "14px";
    timerNote.textContent = "Míralo con calma, ahora te pregunto…";
    this.contentEl.appendChild(timerNote);

    setTimeout(() => {
      introEl.remove();
      studyBox.remove();
      timerNote.remove();
      const askHeader = document.createElement("p");
      askHeader.className = "title-lg fade-in";
      askHeader.style.textAlign = "center";
      askHeader.textContent = ex.prompt;
      this.contentEl.appendChild(askHeader);
      this.say(ex.prompt);
      this.renderChoice(ex, hintFlow);
    }, ex.studySeconds * 1000);
  }

  renderChoice(ex, hintFlow, { compact = false } = {}) {
    const grid = document.createElement("div");
    grid.className = `grid-options ${ex.options.length > 4 ? "cols-3" : ""}`;
    grid.style.marginTop = "18px";
    this.optionButtons = [];

    ex.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = compact ? "option-card option-card-compact" : "option-card";
      if (opt.svgIcon) {
        btn.innerHTML = opt.hideLabel
          ? `<span class="emoji tool-icon">${opt.svgIcon}</span>`
          : `<span class="emoji tool-icon">${opt.svgIcon}</span><span>${opt.label}</span>`;
      } else if (opt.color) {
        const isWhite = opt.color.toUpperCase() === "#FFFFFF";
        const swatchBorder = isWhite ? "3px solid #9A9A9A" : "3px solid rgba(0,0,0,0.12)";
        const swatchShadow = isWhite ? "box-shadow:inset 0 0 0 2px #E4E4E4;" : "";
        btn.innerHTML = `<span style="width:52px;height:52px;border-radius:14px;background:${opt.color};border:${swatchBorder};${swatchShadow}display:block;"></span>`;
      } else if (opt.emoji) {
        btn.innerHTML = opt.hideLabel
          ? `<span class="emoji">${opt.emoji}</span>`
          : `<span class="emoji">${opt.emoji}</span><span>${opt.label}</span>`;
      } else {
        btn.innerHTML = `<span style="font-size:2.2rem;">${opt.label}</span>`;
      }
      btn.dataset.correct = opt.correct ? "1" : "0";
      btn.onclick = () => this.handleAnswer(ex, btn, opt, hintFlow);
      this.optionButtons.push(btn);
      grid.appendChild(btn);
    });
    this.contentEl.appendChild(grid);

    this.startInactivityTimer(() => this.showInactivityHint());
  }

  /* ---------------- Puzle de herramientas ---------------- */

  renderPuzzlePiece(ex, hintFlow) {
    const wrap = document.createElement("div");
    wrap.className = "col";
    wrap.style.gap = "12px";
    wrap.style.marginTop = "12px";

    // Objeto que necesita la herramienta, y a su lado el hueco donde
    // "encajará" la herramienta correcta al elegirla.
    const scene = document.createElement("div");
    scene.className = "card puzzle-scene";
    scene.innerHTML = `
      <div class="puzzle-object">
        <span class="puzzle-object-emoji">${ex.contextSvg || ex.contextEmoji}</span>
        <span class="text-md">${ex.contextLabel}</span>
      </div>
      <span class="puzzle-arrow">➜</span>
    `;
    const slotEl = document.createElement("div");
    slotEl.className = "puzzle-cell puzzle-cell-empty";
    scene.appendChild(slotEl);
    ex.__slotEl = slotEl;

    wrap.appendChild(scene);
    this.contentEl.appendChild(wrap);

    // Reutiliza el renderizado y la lógica de aciertos/errores de las
    // opciones de elección múltiple; solo se añade la animación de encaje.
    this.renderChoice(ex, hintFlow);
  }

  /** Anima el emoji elegido volando desde el botón hasta el hueco del puzle. */
  animatePieceIntoSlot(fromBtn, slotEl, emoji) {
    if (!slotEl) return;
    const fromRect = fromBtn.getBoundingClientRect();
    const toRect = slotEl.getBoundingClientRect();
    const clone = document.createElement("div");
    clone.textContent = emoji;
    clone.className = "puzzle-flying-piece";
    clone.style.left = `${fromRect.left + fromRect.width / 2 - 22}px`;
    clone.style.top = `${fromRect.top + fromRect.height / 2 - 22}px`;
    document.body.appendChild(clone);

    const dx = toRect.left + toRect.width / 2 - (fromRect.left + fromRect.width / 2);
    const dy = toRect.top + toRect.height / 2 - (fromRect.top + fromRect.height / 2);
    requestAnimationFrame(() => {
      clone.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`;
      clone.style.opacity = "0.95";
    });
    setTimeout(() => {
      slotEl.textContent = emoji;
      slotEl.classList.remove("puzzle-cell-empty");
      slotEl.classList.add("puzzle-cell-snap");
      clone.remove();
    }, 620);
  }

  renderPhotoChoice(ex, hintFlow) {
    const photoBox = document.createElement("div");
    photoBox.className = "col center family-photo-stage";
    photoBox.style.marginTop = "12px";
    photoBox.innerHTML = `<img src="${ex.photo}" alt="Foto familiar" class="family-photo-elevated" />`;
    this.contentEl.appendChild(photoBox);
    this.renderChoice(ex, hintFlow, { compact: true });
  }

  async handleAnswer(ex, btn, opt, hintFlow) {
    if (ex.category === "animales") Sounds.playAnimal(opt.label);

    this.optionButtons.forEach((b) => (b.style.pointerEvents = "none"));
    if (opt.correct) {
      this.clearInactivityTimer();
      btn.classList.add("correct-flash");
      this.mascot.celebrate();
      Sounds.playPositive();

      let msg;
      if (ex.category === "fotos") {
        msg = applyNameBudget(
          buildFamilyIdentityPhrase({ name: opt.label, relation: opt.relation, gender: opt.gender }, { withCorrectPrefix: true }),
          this.profile.name,
          this._nameBudget
        );
      } else {
        msg = applyNameBudget(pickMotivation(), this.profile.name, this._nameBudget);
      }
      this.say(msg);
      this.stats.correct++;
      if (ex.category === "herramientas" && ex.__slotEl) {
        this.animatePieceIntoSlot(btn, ex.__slotEl, opt.emoji);
      }
      await reportResult(this.profile.id, ex.category, { success: true, usedHints: hintFlow.errorCount });
      burstConfetti(14);
      celebrateSuccess({ big: ["🎉", "⭐", "🥳", "👏"][Math.floor(Math.random() * 4)] });
      this.scheduleAutoAdvance(Math.max(2400, Voice.estimateDurationMs(msg)));
    } else {
      btn.classList.add("wrong-flash");
      this.optionButtons.forEach((b) => (b.style.pointerEvents = "auto"));
      Sounds.playSoftError();
      const dir = this.optionButtons.indexOf(btn) < this.optionButtons.length / 2 ? "right" : "left";
      this.mascot.pointTo(dir);
      const count = hintFlow.registerError();
      if (count >= 4) {
        this.clearInactivityTimer();
        await reportResult(this.profile.id, ex.category, { success: false, usedHints: count });
      } else {
        this.startInactivityTimer(() => this.showInactivityHint());
      }
    }
  }

  /** Pista visual (2º-3º error): parpadeo en el botón correcto. */
  showVisualHint() {
    const correctBtn = this.optionButtons?.find((b) => b.dataset.correct === "1");
    correctBtn?.classList.add("btn-wiggle-hint");
  }

  /** Pista de inactividad (60s sin tocar nada): solo se mueve el dibujo. */
  showInactivityHint() {
    const correctBtn = this.optionButtons?.find((b) => b.dataset.correct === "1");
    const emojiSpan = correctBtn?.querySelector(".emoji");
    if (emojiSpan) emojiSpan.classList.add("emoji-hint-wiggle");
    else correctBtn?.classList.add("emoji-hint-wiggle");
  }

  revealCorrect(ex) {
    const correctBtn = this.optionButtons?.find((b) => b.dataset.correct === "1");
    correctBtn?.classList.add("correct-flash");
    const msg = applyNameBudget(
      "No te preocupes, {name}. Era esta. La próxima vez seguro que la ves.",
      this.profile.name,
      this._nameBudget
    );
    this.mascot.encourage();
    this.say(msg);
    this.scheduleAutoAdvance(Math.max(2800, Voice.estimateDurationMs(msg)));
  }

  /* ---------------- Encuentra las diferencias ---------------- */

  renderSpotDiff(ex, hintFlow) {
    const wrap = document.createElement("div");
    wrap.className = "col";
    wrap.style.gap = "10px";
    wrap.style.marginTop = "14px";

    const labels = document.createElement("div");
    labels.className = "row";
    labels.style.justifyContent = "center";
    labels.style.gap = "40px";
    labels.innerHTML = `
      <div class="col center" style="gap:4px;">
        <span class="pill">Imagen 1</span>
      </div>
      <div class="col center" style="gap:4px;">
        <span class="pill">Imagen 2</span>
        <span class="spot-diff-touch">TOCA AQUÍ</span>
      </div>
    `;
    wrap.appendChild(labels);

    const panels = document.createElement("div");
    panels.className = "row wrap";
    panels.style.gap = "18px";
    panels.style.justifyContent = "center";

    const cols = Math.ceil(Math.sqrt(ex.panelA.length));

    function buildPanel(items, interactive) {
      const p = document.createElement("div");
      p.className = "card";
      p.style.display = "grid";
      p.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      p.style.gap = "8px";
      items.forEach((emoji) => {
        const cell = document.createElement("div");
        cell.textContent = emoji;
        cell.className = "diff-cell";
        if (interactive) cell.classList.add("diff-cell-interactive");
        p.appendChild(cell);
      });
      return p;
    }

    const panelA = buildPanel(ex.panelA, false);
    const panelB = buildPanel(ex.panelB, true);
    panels.appendChild(panelA);
    panels.appendChild(panelB);
    wrap.appendChild(panels);

    const status = document.createElement("p");
    status.className = "text-md";
    status.style.textAlign = "center";
    status.textContent = `Encontradas: 0 / ${ex.diffPositions.length}`;
    wrap.appendChild(status);

    this.contentEl.appendChild(wrap);

    const found = new Set();

    const onCellTap = async (idx, cell) => {
      if (found.has(idx)) return;
      this.clearInactivityTimer();
      if (ex.diffPositions.includes(idx)) {
        found.add(idx);
        cell.classList.add("diff-cell-found");
        this.mascot.celebrate();
        Sounds.playPositive();
        status.textContent = `Encontradas: ${found.size} / ${ex.diffPositions.length}`;

        if (found.size === ex.diffPositions.length) {
          await reportResult(this.profile.id, ex.category, { success: true, usedHints: hintFlow.errorCount });
          const msg = applyNameBudget(pickMotivation(), this.profile.name, this._nameBudget);
          this.say(msg);
          burstConfetti(18);
          celebrateSuccess({ big: "🔍✨" });
          this.scheduleAutoAdvance(Math.max(2400, Voice.estimateDurationMs(msg)));
        } else {
          this.startInactivityTimer(() => this.hintSpotDiffInactivity(panelB, ex, found));
        }
      } else {
        cell.classList.add("diff-cell-wrong");
        Sounds.playSoftError();
        setTimeout(() => cell.classList.remove("diff-cell-wrong"), 500);
        const count = hintFlow.registerError();
        if (count >= 4) {
          ex.diffPositions
            .filter((p) => !found.has(p))
            .forEach((p) => panelB.children[p].classList.add("btn-wiggle-hint"));
        } else {
          this.startInactivityTimer(() => this.hintSpotDiffInactivity(panelB, ex, found));
        }
      }
    };

    [...panelB.children].forEach((cell, idx) => {
      cell.onclick = () => onCellTap(idx, cell);
    });

    this.startInactivityTimer(() => this.hintSpotDiffInactivity(panelB, ex, found));
  }

  /** Inactividad en "diferencias": solo se mueve uno de los dibujos aún no encontrados. */
  hintSpotDiffInactivity(panelB, ex, found) {
    const remaining = ex.diffPositions.filter((p) => !found.has(p));
    if (remaining.length) {
      const target = remaining[0];
      panelB.children[target]?.classList.add("emoji-hint-wiggle");
    }
  }

  /* ---------------- Cierre ---------------- */

  async renderClosing() {
    const box = document.createElement("div");
    box.className = "col center grow closing-celebration";
    const text = applyNameBudget(pickClosing(), this.profile.name, this._nameBudget);
    box.innerHTML = `<div class="closing-party-icon">🎉</div>
      <h2 class="title-xl" style="text-align:center;">${text}</h2>`;
    this.say(text);
    burstConfetti(36);
    // La copa se ancla más abajo del centro para no tapar nunca el
    // mensaje de felicitación, que ya ocupa el centro de la pantalla.
    celebrateSuccess({ big: "🏆", anchorY: window.innerHeight * 0.74 });

    const accuracy = this.stats.total ? this.stats.correct / this.stats.total : 0;
    const endedAt = Date.now();
    const durationMin = Math.round((endedAt - this.startedAt) / 60000);
    const timeFmt = { hour: "2-digit", minute: "2-digit" };

    await DB.put("sessions", {
      id: uid("session"),
      profileId: this.profile.id,
      date: new Date().toDateString(),
      timestamp: endedAt,
      hour: new Date().getHours(),
      startTime: new Date(this.startedAt).toLocaleTimeString("es-ES", timeFmt),
      endTime: new Date(endedAt).toLocaleTimeString("es-ES", timeFmt),
      exercisesCompleted: this.stats.total,
      accuracy,
      durationMin,
    });

    this.contentEl.appendChild(box);

    // Sin botón: tras felicitar a Óscar, la app vuelve sola a la pantalla
    // principal, dando tiempo de sobra a que la voz y la fiesta terminen.
    setTimeout(() => this.onFinish(), Math.max(3800, Voice.estimateDurationMs(text)) + 3000);
  }
}
