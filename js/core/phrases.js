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

export function getWellbeingQuestions(part) {
  // 'part' = mañana | tarde | noche | madrugada — usado para adaptar el tono
  if (part === "tarde" || part === "noche") {
    return [
      { key: "day_ok", text: "¿Cómo ha ido el día?", type: "mood" },
    ];
  }
  return [
    { key: "day_ok", text: "¿Cómo estás hoy?", type: "mood" },
  ];
}

export function fillName(template, name) {
  return template.replaceAll("{name}", name || "");
}
