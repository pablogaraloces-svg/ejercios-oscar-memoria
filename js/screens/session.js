import { DB, uid } from "../core/db.js";
import {
  getGreeting,
  getSpokenDate,
  getWellbeingQuestions,
  pickMotivation,
  pickClosing,
  pickMoodPositiveReaction,
  pickMoodEncourageReaction,
  pickInactivityHint,
  fillName,
} from "../core/phrases.js";
import { Voice } from "../core/voice.js";
import { Sounds } from "../core/sounds.js";
import { HintFlow } from "../core/hints.js";
import { reportResult } from "../core/adaptiveDifficulty.js";
import { getReminders, markReminderDoneToday, isReminderDoneToday } from "../core/reminders.js";
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
  constructor({ contentEl, mascot, bubbleEl, progressFillEl, stepLabelEl, continueBtn, profile, settings }) {
    this.contentEl = contentEl;
    this.mascot = mascot;
    this.bubbleEl = bubbleEl;
    this.progressFillEl = progressFillEl;
    this.stepLabelEl = stepLabelEl;
    this.continueBtn = continueBtn;
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
    Voice.say(text);
  }

  /** Habla `spoken` (si existe) pero muestra `visible` en la burbuja de texto. */
  sayVisibleVsSpoken(visible, spoken) {
    this.bubbleEl.textContent = visible;
    this.bubbleEl.classList.remove("hidden");
    this.bubbleEl.classList.add("fade-in");
    Voice.say(spoken || visible);
  }

  updateProgress() {
    const pct = Math.round((this.stepIndex / (this.steps.length - 1)) * 100);
    this.progressFillEl.style.width = `${pct}%`;
    this.stepLabelEl.textContent = `${this.stepIndex + 1} / ${this.steps.length}`;
  }

  next() {
    this.clearInactivityTimer();
    this.hideContinueBtn();
    if (this.stepIndex < this.steps.length - 1) {
      this.stepIndex++;
      this.renderStep();
    }
  }

  /* -------- Botón "Continuamos" arriba a la derecha -------- */
  hideContinueBtn() {
    this.continueBtn.classList.add("hidden");
    this.continueBtn.onclick = null;
    clearTimeout(this._continueTimer);
  }

  scheduleContinue(delayMs) {
    let advanced = false;
    const go = () => {
      if (advanced) return;
      advanced = true;
      clearTimeout(this._continueTimer);
      this.next();
    };
    this.continueBtn.onclick = go;
    this.continueBtn.classList.remove("hidden");
    this._continueTimer = setTimeout(go, delayMs);
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
    this.hideContinueBtn();
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
    this.say(`${greetText} ${dateText}`);
    const box = document.createElement("div");
    box.className = "col center grow";
    box.innerHTML = `<div style="font-size:3.2rem;">👋</div>
      <h2 class="title-xl" style="text-align:center;">${greetText}</h2>
      <p class="text-md" style="text-align:center;">${dateText}</p>`;
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
    moods.forEach((m) => {
      const b = document.createElement("button");
      b.className = "option-card";
      b.style.minWidth = "150px";
      b.innerHTML = `<span class="emoji">${m.emoji}</span><span>${m.label}</span>`;
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
        const reaction = fillName(
          isPositive ? pickMoodPositiveReaction() : pickMoodEncourageReaction(),
          this.profile.name
        );
        this.mascot.celebrate();
        this.say(reaction);
        this.scheduleContinue(Math.max(2200, Voice.estimateDurationMs(reaction)));
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

    reminders.forEach((rem) => {
      const row = document.createElement("div");
      row.className = "switch-row reminder-row";
      row.innerHTML = `<span class="row" style="gap:12px; font-size:var(--font-md); font-weight:700;">
          <span style="font-size:1.8rem;">${rem.emoji}</span> ${rem.label}
        </span>`;

      const doneBtn = document.createElement("button");
      doneBtn.type = "button";
      doneBtn.className = "btn btn-ghost reminder-done-btn";
      doneBtn.textContent = "Marcar hecho";

      const setDoneVisual = () => {
        doneBtn.textContent = "✔️ Hecho";
        doneBtn.classList.remove("btn-ghost");
        doneBtn.classList.add("reminder-done-btn-active");
      };

      isReminderDoneToday(this.profile.id, rem.id)
        .then((done) => {
          if (done) setDoneVisual();
        })
        .catch((err) => console.error("Error comprobando recordatorio:", err));

      doneBtn.addEventListener("click", async () => {
        if (doneBtn.dataset.locked === "1") return;
        doneBtn.dataset.locked = "1";
        setDoneVisual();
        this.mascot.celebrate();
        Sounds.playPositive();
        try {
          await markReminderDoneToday(this.profile.id, rem.id);
        } catch (err) {
          console.error("No se pudo guardar el recordatorio:", err);
          doneBtn.dataset.locked = "0";
        }
      });

      row.appendChild(doneBtn);
      list.appendChild(row);
    });
    box.appendChild(list);

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-huge btn-success";
    nextBtn.style.marginTop = "20px";
    nextBtn.textContent = "Continuar";
    nextBtn.onclick = () => this.next();
    box.appendChild(nextBtn);

    this.contentEl.appendChild(box);
  }

  /* ---------------- Ejercicios ---------------- */

  renderExercise(ex) {
    this.stats.total++;
    const catLabel = CATEGORY_LABELS[ex.category] || "";
    this.mascot.thinking();

    if (ex.kind !== "memory_recall") {
      const header = document.createElement("div");
      header.className = "col";
      header.innerHTML = `<span class="pill" style="align-self:flex-start;">${catLabel}</span>
        <h2 class="title-xl" style="margin-top:8px;">${ex.prompt}</h2>`;
      this.contentEl.appendChild(header);
      this.sayVisibleVsSpoken(ex.prompt, ex.spokenPrompt);
    } else {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = catLabel;
      this.contentEl.appendChild(pill);
    }

    const hintFlow = new HintFlow({
      name: this.profile.name,
      onSoft: (msg) => this.say(msg),
      onPistaVoice: (msg) => this.say(msg),
      onVisualHint: () => this.showVisualHint(),
      onReveal: () => this.revealCorrect(ex),
    });
    this.currentHintFlow = hintFlow;

    if (ex.kind === "memory_recall") this.renderMemoryRecall(ex, hintFlow);
    else if (ex.kind === "photo_choice") this.renderPhotoChoice(ex, hintFlow);
    else if (ex.kind === "spot_diff") this.renderSpotDiff(ex, hintFlow);
    else this.renderChoice(ex, hintFlow);
  }

  renderMemoryRecall(ex, hintFlow) {
    const introText = fillName(ex.introText, this.profile.name);
    const introEl = document.createElement("p");
    introEl.className = "title-lg fade-in";
    introEl.style.textAlign = "center";
    introEl.style.marginTop = "8px";
    introEl.textContent = introText;
    this.contentEl.appendChild(introEl);
    this.say(introText);

    const studyBox = document.createElement("div");
    studyBox.className = "row wrap center fade-in";
    studyBox.style.gap = "20px";
    studyBox.style.marginTop = "18px";
    ex.studyItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "card col center";
      card.style.minWidth = "120px";
      card.innerHTML = `<span style="font-size:3.4rem;">${item.emoji}</span>`;
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

  renderChoice(ex, hintFlow) {
    const grid = document.createElement("div");
    grid.className = `grid-options ${ex.options.length > 4 ? "cols-3" : ""}`;
    grid.style.marginTop = "18px";
    this.optionButtons = [];

    ex.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "option-card";
      if (opt.color) {
        btn.innerHTML = `<span style="width:52px;height:52px;border-radius:14px;background:${opt.color};border:3px solid rgba(0,0,0,0.1);display:block;"></span>`;
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

  renderPhotoChoice(ex, hintFlow) {
    const photoBox = document.createElement("div");
    photoBox.className = "col center";
    photoBox.style.marginTop = "12px";
    photoBox.innerHTML = `<img src="${ex.photo}" alt="Foto familiar" style="width:170px;height:170px;object-fit:cover;border-radius:24px;box-shadow:var(--shadow-lift);" />`;
    this.contentEl.appendChild(photoBox);
    this.renderChoice(ex, hintFlow);
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
        msg = opt.relation
          ? `Correcto, ${this.profile.name}. Esta es tu ${opt.relation}, ${opt.label}.`
          : `Correcto, ${this.profile.name}. Esta es ${opt.label}.`;
      } else {
        msg = fillName(pickMotivation(), this.profile.name);
      }
      this.say(msg);
      this.stats.correct++;
      await reportResult(this.profile.id, ex.category, { success: true, usedHints: hintFlow.errorCount });
      burstConfetti(14);
      celebrateSuccess({ big: ["🎉", "⭐", "🥳", "👏"][Math.floor(Math.random() * 4)] });
      this.scheduleContinue(Math.max(2400, Voice.estimateDurationMs(msg)));
    } else {
      btn.classList.add("wrong-flash");
      this.optionButtons.forEach((b) => (b.style.pointerEvents = "auto"));
      Sounds.playSoftError();
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
    const msg = `No te preocupes, ${this.profile.name}. Era esta. La próxima vez seguro que la ves.`;
    this.mascot.encourage();
    this.say(msg);
    this.scheduleContinue(Math.max(2800, Voice.estimateDurationMs(msg)));
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
    labels.innerHTML = `<span class="pill">Imagen A</span><span class="pill">Imagen B — toca aquí</span>`;
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
          const msg = fillName(pickMotivation(), this.profile.name);
          this.say(msg);
          burstConfetti(18);
          celebrateSuccess({ big: "🔍✨" });
          this.scheduleContinue(Math.max(2400, Voice.estimateDurationMs(msg)));
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
    box.className = "col center grow";
    const text = fillName(pickClosing(), this.profile.name);
    box.innerHTML = `<div style="font-size:4rem;">🎉</div>
      <h2 class="title-xl" style="text-align:center;">${text}</h2>`;
    this.say(text);
    burstConfetti(36);
    celebrateSuccess({ big: "🏆" });

    const accuracy = this.stats.total ? this.stats.correct / this.stats.total : 0;
    const durationMin = Math.round((Date.now() - this.startedAt) / 60000);

    await DB.put("sessions", {
      id: uid("session"),
      profileId: this.profile.id,
      date: new Date().toDateString(),
      timestamp: Date.now(),
      hour: new Date().getHours(),
      exercisesCompleted: this.stats.total,
      accuracy,
      durationMin,
    });

    const btn = document.createElement("button");
    btn.className = "btn btn-huge btn-success";
    btn.style.marginTop = "26px";
    btn.textContent = "Volver al inicio";
    btn.onclick = () => this.onFinish();
    box.appendChild(btn);
    this.contentEl.appendChild(box);
  }
}
