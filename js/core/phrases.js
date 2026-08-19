/**
 * phrases.js — Bancos de texto cálido: motivación, saludos, ayudas.
 * Selección aleatoria sin repetir hasta agotar el banco (más humano).
 */

function makePicker(list) {
  let bag = [];
  return function pick() {
    if (bag.length === 0) bag = [...list].sort(() => Math.random() - 0.5);
    return bag.pop();
  };
}

export const pickMotivation = makePicker([
  "Muy bien, {name}. Cada día avanzas un poquito más.",
  "Eso es, {name}, lo has hecho genial.",
  "¡Qué bien lo estás haciendo hoy, {name}!",
  "Perfecto, {name}. Me encanta acompañarte en esto.",
  "Así se hace, {name}. Vamos con calma y seguro.",
  "Estupendo, {name}. Estoy muy orgulloso de ti.",
  "Lo has clavado, {name}. Sigamos disfrutando.",
  "Muy bien pensado, {name}.",
  "{name}, hoy tu cabeza está muy despierta.",
  "Genial, {name}. Un pasito más, sin prisa.",
]);

export const pickTryAgainSoft = makePicker([
  "No pasa nada, {name}, lo intentamos otra vez con calma.",
  "Tranquilo/a, {name}, todos nos equivocamos alguna vez.",
  "Casi, casi. Vamos a intentarlo de nuevo, {name}.",
  "Sin prisa, {name}. Piénsalo con calma.",
]);

export const pickHint = makePicker([
  "Una pequeña pista: fíjate bien en los colores.",
  "Pista: mira con calma cada opción, sin prisa.",
  "Te doy una ayudita: piensa en lo que hemos visto antes.",
  "Fíjate despacio, seguro que lo ves.",
]);

export const pickClosing = makePicker([
  "Hemos terminado por hoy, {name}. ¡Lo has hecho fenomenal!",
  "Sesión terminada, {name}. Descansa, te lo has ganado.",
  "Muy buen trabajo hoy, {name}. Hasta la próxima.",
  "{name}, gracias por este ratito juntos. Hasta pronto.",
]);

export const pickMoodPositiveReaction = makePicker([
  "Qué alegría, {name}. Me encanta verte así.",
  "¡Genial, {name}! Vamos a aprovechar este buen ánimo.",
  "Me alegro mucho, {name}. Sigamos con esa energía.",
  "Qué bien, {name}. Eso se nota en tu sonrisa.",
]);

export const pickMoodEncourageReaction = makePicker([
  "Gracias por contármelo, {name}. Vamos a pasar un ratito tranquilo juntos.",
  "No pasa nada, {name}, hoy iremos con calma y cariño.",
  "Te acompaño igualmente, {name}. Seguro que mejora el día.",
  "Está bien decirlo, {name}. Aquí estoy, vamos poco a poco.",
]);

export const pickMemoryIntro = makePicker([
  "{name}, ahora fíjate bien en estas imágenes durante unos segundos.",
  "Vamos a entrenar la memoria, {name}. Mira con calma, sin prisa.",
  "{name}, obsérvalas tranquilamente, luego te pregunto.",
  "Fíjate bien, {name}. Dentro de un momento te pregunto qué había.",
]);

export const pickInactivityHint = makePicker([
  "Tómate tu tiempo. Cuando quieras, fíjate en las opciones.",
  "Aquí sigo, sin prisa. Cuando estés listo, elige una opción.",
  "Tranquilo/a, vamos a mirarlo juntos con calma.",
]);

/** Frase de transición entre un ejercicio y el siguiente (guía a Óscar sin necesitar botón). */
export const pickNextExercisePhrase = makePicker([
  "Vamos a continuar con el siguiente ejercicio, {name}.",
  "Sigamos con otro ejercicio, {name}.",
  "Vamos con el siguiente, {name}.",
  "Un ejercicio más, {name}. Vamos allá.",
  "Continuemos, {name}.",
  "Muy bien, {name}. Ahora otro ejercicio.",
]);

function getPartOfDay() {
  const h = new Date().getHours();
  if (h < 6) return "madrugada";
  if (h < 13) return "mañana";
  if (h < 20) return "tarde";
  return "noche";
}

export function getGreeting(name) {
  const part = getPartOfDay();
  const map = {
    madrugada: [`Hola ${name}, ¿todo bien tan temprano?`],
    mañana: [`Buenos días, ${name}. ¿Cómo estás hoy?`, `¡Hola ${name}! ¿Qué tal has amanecido?`],
    tarde: [`Buenas tardes, ${name}. ¿Cómo ha ido el día?`, `Hola ${name}, ¿qué tal la tarde?`],
    noche: [`Buenas noches, ${name}. ¿Cómo ha ido todo hoy?`, `Hola ${name}, ¿todo tranquilo esta noche?`],
  };
  const options = map[part];
  return options[Math.floor(Math.random() * options.length)];
}

export function getWellbeingQuestions() {
  // Pregunta única y fija: el "¿cómo ha ido el día?" ya se cubre en el
  // saludo inicial, así que aquí siempre se pregunta por el humor, sin
  // duplicar la pregunta anterior.
  return [{ key: "mood_today", text: "¿Cómo te encuentras de humor hoy?", type: "mood" }];
}

export function fillName(template, name) {
  return template.replaceAll("{name}", name || "");
}

/**
 * applyNameBudget — Limita el nombre de Óscar a como máximo una vez por
 * pantalla/ejercicio. Si el "presupuesto" (budget) ya se ha usado en este
 * paso, se retira el nombre de la frase con una limpieza gramatical básica
 * en vez de dejar huecos raros ("Correcto, . Esta es...").
 *
 * @param {string} template - frase con el marcador {name}
 * @param {string} name - nombre real de la persona
 * @param {{used:boolean}} budget - objeto compartido para todo el paso actual
 */
export function applyNameBudget(template, name, budget) {
  if (!template.includes("{name}")) return template;
  if (budget && !budget.used) {
    budget.used = true;
    return fillName(template, name);
  }
  let result = template
    .replaceAll(", {name},", ",")
    .replaceAll(", {name}.", ".")
    .replaceAll(", {name}!", "!")
    .replaceAll(", {name}?", "?")
    .replaceAll(", {name}", "")
    .replaceAll("{name}, ", "")
    .replaceAll("{name}.", ".")
    .replaceAll("{name}", "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (result) result = result.charAt(0).toUpperCase() + result.slice(1);
  return result;
}

/** Hora actual en formato "HH:MM", para mostrar y leer en voz alta. */
export function getCurrentTimeText() {
  const now = new Date();
  return now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

/** Fecha corta actual (para la portada), ej. "martes, 19 de agosto". */
export function getCurrentDateText() {
  const now = new Date();
  return now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

/** Frase hablada con el día, mes y año de hoy, para que la voz lo recuerde al empezar. */
export function getSpokenDate() {
  const now = new Date();
  const text = now.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `Hoy es ${text}.`;
}
