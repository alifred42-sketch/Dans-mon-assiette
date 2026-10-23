/**
 * Substitutions d'affichage pour le mode Sans Gluten.
 * Les recettes sources restent intactes : seules les chaînes affichées changent.
 */
const GLUTEN_FREE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bpâte\s+(?:feuilletée|brisée)\b/gi, "Pâte sans gluten"],
  [/\bfarine\s+de\s+blé\b/gi, "Fécule de maïs (ou farine de riz)"],
  [/\bfarine\b/gi, "Fécule de maïs (ou farine de riz)"],
  [/\b(?:pâtes|spaghettis|spaghetti|coquillettes)\b/gi, "Pâtes sans gluten"],
  [/\b(?:tranches?\s+de\s+pain|toast|pain)\b/gi, "Pain sans gluten"],
  [/\bchapelure\b/gi, "Chapelure sans gluten"],
  [/\bsauce\s+soja\b/gi, "Sauce soja Tamari (sans gluten)"],
];

/** Transforme un texte uniquement pour l'affichage lorsque Sans Gluten est activé. */
export function adaptGlutenFreeText(text: string, enabled = true): string {
  if (!enabled || !text) return text;
  return GLUTEN_FREE_REPLACEMENTS.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text,
  );
}
