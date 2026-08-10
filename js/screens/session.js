import { DB, uid } from "../core/db.js";
import { getGreeting, getWellbeingQuestions, pickMotivation, pickClosing, fillName } from "../core/phrases.js";
import { Voice } from "../core/voice.js";
import { HintFlow } from "../core/hints.js";
import { reportResult } from "../core/adaptiveDifficulty.js";
import { getReminders, markReminderDoneToday, isReminderDoneToday } from "../core/reminders.js";
import { buildSessionExercises } from "../exercises/index.js";
import { burstConfetti } from "../core/confetti.js";
import { CATEGORY_LABELS } from "../exercises/index.js";

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
  }

  async start(onFinish) {
    this.onFinish = onFinish;
    this.startedAt = Date.now();

    const part = getPartOfDay();
    const wellbeing = getWellbeingQuestions(part);
    const reminders = (await getReminders(this.profile.id)).filter((r) => r.enabled);
    const exercises = await buildSessionExercises(this.profile, 8);

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

  updateProgress() {
    const pct = Math.round((this.stepIndex / (this.steps.length - 1)) * 100);
    this.progressFillEl.style.width = `${pct}%`;
    this.stepLabelEl.textContent = `${this.stepIndex + 1} / ${this.steps.length}`;
  }

  next() {
    if (this.stepIndex < this.steps.length - 1) {
      this.stepIndex++;
      this.renderStep();
    }
  }

  renderStep() {
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
    const text = getGreeting(this.profile.name);
    this.say(text);
    const box = document.createElement("div");
    box.className = "col center grow";
    box.innerHTML = `<div style="font-size:4rem;">👋</div>
      <h2 class="title-xl" style="text-align:center;">${text}</h2>`;
    const btn = document.createElement("button");
    btn.className = "btn btn-success btn-huge";
    btn.style.marginTop = "32px";
    btn.textContent = "Estoy list@";
    btn.onclick = () => this.next();
    box.appendChild(btn);
    this.contentEl.appendChild(box);
  }

  renderWellbeing(question) {
    this.say(question.text);
    const box = document.createElement("div");
    box.className = "col center grow";
    box.innerHTML = `<div style="font-size:3.4rem;">💬</div><h2 class="title-xl" style="text-align:center;">${question.text}</h2>`;
    const options = document.createElement("div");
    options.className = "row wrap center";
    options.style.marginTop = "32px";
    options.style.gap = "18px";
    const moods = [
      { emoji: "😊", label: "Muy bien" },
      { emoji: "🙂", label: "Bien" },
      { emoji: "😐", label: "Regular" },
      { emoji: "😕", label: "No muy bien" },
    ];
    moods.forEach((m) => {
      const b = document.createElement("button");
      b.className = "option-card";
      b.style.minWidth = "170px";
      b.innerHTML = `<span class="emoji">${m.emoji}</span><span>${m.label}</span>`;
      b.onclick = async () => {
        await DB.put("settings", {
          id: `mood_${new Date().toDateString()}_${question.key}`,
          date: new Date().toDateString(),
          key: question.key,
          value: m.label,
        });
        this.mascot.celebrate();
        this.next();
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
    list.style.marginTop = "20px";
    list.style.gap = "14px";

    reminders.forEach((rem) => {
      const row = document.createElement("div");
      row.className = "switch-row";
      row.style.minHeight = "88px";
      row.innerHTML = `<span class="row" style="gap:14px; font-size:var(--font-md); font-weight:700;">
          <span style="font-size:2.2rem;">${rem.emoji}</span> ${rem.label}
        </span>`;
      const doneBtn = document.createElement("button");
      doneBtn.className = "btn btn-success";
      isReminderDoneToday(this.profile.id, rem.id).then((done) => {
        doneBtn.textContent = done ? "✔️ Hecho" : "Marcar hecho";
        if (done) doneBtn.classList.add("btn-ghost");
      });
      doneBtn.onclick = async () => {
        await markReminderDoneToday(this.profile.id, rem.id);
        doneBtn.textContent = "✔️ Hecho";
        this.mascot.celebrate();
      };
      row.appendChild(doneBtn);
      list.appendChild(row);
    });
    box.appendChild(list);

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-huge btn-success";
    nextBtn.style.marginTop = "24px";
    nextBtn.textContent = "Continuar";
    nextBtn.onclick = () => this.next();
    box.appendChild(nextBtn);

    this.contentEl.appendChild(box);
  }

  renderExercise(ex) {
    this.stats.total++;
    const catLabel = CATEGORY_LABELS[ex.category] || "";
    const header = document.createElement("div");
    header.className = "col";
    header.innerHTML = `<span class="pill" style="align-self:flex-start;">${catLabel}</span>
      <h2 class="title-xl" style="margin-top:10px;">${ex.prompt}</h2>`;
    this.contentEl.appendChild(header);
    this.say(ex.prompt);

    const hintFlow = new HintFlow({
      name: this.profile.name,
      onSoft: (msg) => this.say(msg),
      onHint: (msg) => this.say(msg),
      onHighlight: () => this.highlightCorrect(),
      onReveal: () => this.revealCorrect(ex),
    });
    this.currentHintFlow = hintFlow;

    if (ex.kind === "memory_recall") this.renderMemoryRecall(ex, hintFlow);
    else if (ex.kind === "photo_choice") this.renderPhotoChoice(ex, hintFlow);
    else this.renderChoice(ex, hintFlow);
  }

  renderMemoryRecall(ex, hintFlow) {
    const studyBox = document.createElement("div");
    studyBox.className = "row wrap center fade-in";
    studyBox.style.gap = "28px";
    studyBox.style.marginTop = "24px";
    ex.studyItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "card col center";
      card.style.minWidth = "160px";
      card.innerHTML = `<span style="font-size:4.5rem;">${item.emoji}</span><span class="text-base" style="font-weight:700;">${item.name}</span>`;
      studyBox.appendChild(card);
    });
    this.contentEl.appendChild(studyBox);

    const timerNote = document.createElement("p");
    timerNote.className = "text-md";
    timerNote.style.textAlign = "center";
    timerNote.style.marginTop = "18px";
    timerNote.textContent = "Míralo con calma, ahora te pregunto…";
    this.contentEl.appendChild(timerNote);

    setTimeout(() => {
      studyBox.remove();
      timerNote.remove();
      const askHeader = document.createElement("p");
      askHeader.className = "title-lg";
      askHeader.style.textAlign = "center";
      askHeader.textContent = ex.prompt;
      this.contentEl.appendChild(askHeader);
      this.renderChoice(ex, hintFlow, true);
    }, ex.studySeconds * 1000);
  }

  renderChoice(ex, hintFlow, skipHeaderDup = false) {
    const grid = document.createElement("div");
    grid.className = `grid-options ${ex.options.length > 4 ? "cols-3" : ""}`;
    grid.style.marginTop = "24px";
    this.optionButtons = [];

    ex.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "option-card";
      if (opt.color) {
        btn.innerHTML = `<span style="width:64px;height:64px;border-radius:16px;background:${opt.color};border:3px solid rgba(0,0,0,0.1);display:block;"></span><span>${opt.label}</span>`;
      } else if (opt.emoji) {
        btn.innerHTML = `<span class="emoji">${opt.emoji}</span><span>${opt.label}</span>`;
      } else {
        btn.innerHTML = `<span style="font-size:2.4rem;">${opt.label}</span>`;
      }
      btn.dataset.correct = opt.correct ? "1" : "0";
      btn.onclick = () => this.handleAnswer(ex, btn, opt, hintFlow);
      this.optionButtons.push(btn);
      grid.appendChild(btn);
    });
    this.contentEl.appendChild(grid);
  }

  renderPhotoChoice(ex, hintFlow) {
    const photoBox = document.createElement("div");
    photoBox.className = "col center";
    photoBox.style.marginTop = "16px";
    photoBox.innerHTML = `<img src="${ex.photo}" alt="Foto familiar" style="width:220px;height:220px;object-fit:cover;border-radius:28px;box-shadow:var(--shadow-lift);" />`;
    this.contentEl.appendChild(photoBox);
    this.renderChoice(ex, hintFlow);
  }

  async handleAnswer(ex, btn, opt, hintFlow) {
    this.optionButtons.forEach((b) => (b.style.pointerEvents = "none"));
    if (opt.correct) {
      btn.classList.add("correct-flash");
      this.mascot.celebrate();
      const msg = fillName(pickMotivation(), this.profile.name);
      this.say(msg);
      this.stats.correct++;
      await reportResult(this.profile.id, ex.category, { success: true, usedHints: hintFlow.errorCount });
      burstConfetti(14);
      setTimeout(() => this.next(), 1400);
    } else {
      btn.classList.add("wrong-flash");
      this.optionButtons.forEach((b) => (b.style.pointerEvents = "auto"));
      const dir = this.optionButtons.indexOf(btn) < this.optionButtons.length / 2 ? "right" : "left";
      this.mascot.pointTo(dir);
      const count = hintFlow.registerError();
      if (count >= 4) {
        await reportResult(this.profile.id, ex.category, { success: false, usedHints: count });
        setTimeout(() => this.next(), 2600);
      }
    }
  }

  highlightCorrect() {
    const correctBtn = this.optionButtons.find((b) => b.dataset.correct === "1");
    correctBtn?.classList.add("btn-wiggle-hint");
  }

  revealCorrect(ex) {
    const correctBtn = this.optionButtons.find((b) => b.dataset.correct === "1");
    correctBtn?.classList.add("correct-flash");
    this.say(`No te preocupes, ${this.profile.name}. Era esta. La próxima vez seguro que la ves.`);
  }

  async renderClosing() {
    const box = document.createElement("div");
    box.className = "col center grow";
    const text = fillName(pickClosing(), this.profile.name);
    box.innerHTML = `<div style="font-size:5rem;">🎉</div>
      <h2 class="title-xl" style="text-align:center;">${text}</h2>`;
    this.say(text);
    burstConfetti(36);

    const accuracy = this.stats.total ? this.stats.correct / this.stats.total : 0;
    const durationMin = Math.round((Date.now() - this.startedAt) / 60000);

    await DB.put("sessions", {
      id: uid("session"),
      profileId: this.profile.id,
      date: new Date().toDateString(),
      timestamp: Date.now(),
      exercisesCompleted: this.stats.total,
      accuracy,
      durationMin,
    });

    const btn = document.createElement("button");
    btn.className = "btn btn-huge btn-success";
    btn.style.marginTop = "32px";
    btn.textContent = "Volver al inicio";
    btn.onclick = () => this.onFinish();
    box.appendChild(btn);
    this.contentEl.appendChild(box);
  }
}
