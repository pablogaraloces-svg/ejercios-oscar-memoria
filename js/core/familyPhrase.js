/**
 * familyPhrase.js — Construye frases naturales sobre un familiar, usando
 * únicamente los datos reales guardados (nombre y parentesco). Nunca se
 * inventa un parentesco: si no está guardado, simplemente se omite.
 *
 * Se usa tanto en el ejercicio "¿Adivinas quién es?" como al tocar una
 * fotografía en Mi Familia.
 */

// Pronombre según el género guardado (opcional) de cada familiar.
function pronoun(gender) {
  if (gender === "M") return "Él";
  if (gender === "F") return "Ella";
  return null;
}

/**
 * @param {{name:string, relation?:string, gender?:'M'|'F'|null}} person
 * @param {{withCorrectPrefix?:boolean, profileName?:string}} opts
 */
export function buildFamilyIdentityPhrase(person, { withCorrectPrefix = false, profileName = "" } = {}) {
  const prefix = withCorrectPrefix ? `Correcto, ${profileName}. ` : "";
  const p = pronoun(person.gender);

  if (person.relation) {
    if (p) return `${prefix}${p} es ${person.name}, es tu ${person.relation}.`;
    return `${prefix}Es tu ${person.relation}: ${person.name}.`;
  }
  // Sin parentesco guardado: no se inventa, solo se confirma el nombre.
  if (p) return `${prefix}${p} es ${person.name}.`;
  return `${prefix}Esta es ${person.name}.`;
}
