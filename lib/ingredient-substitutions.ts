/**
 * Substitutions d'affichage pour le mode Sans Gluten.
 * Les recettes sources restent intactes : seules les chaînes affichées changent.
 */
const GLUTEN_FREE_PATTERN = /(?<![\p{L}])pâte\s+(?:feuilletée|brisée)(?![\p{L}])|(?<![\p{L}])farine\s+de\s+blé(?![\p{L}])|(?<![\p{L}])farine(?![\p{L}])|(?<![\p{L}])(?:pâtes|spaghettis|spaghetti|coquillettes)(?![\p{L}])|(?<![\p{L}])(?:tranches?\s+de\s+pain|toast|pain)(?![\p{L}])|(?<![\p{L}])chapelure(?![\p{L}])|(?<![\p{L}])sauce\s+soja(?![\p{L}])/giu;

/** Transforme un texte uniquement pour l'affichage lorsque Sans Gluten est activé. */
export function adaptGlutenFreeText(text: string, enabled = true): string {
  if (!enabled || !text) return text;
  return text.replace(GLUTEN_FREE_PATTERN, (match) => {
    const normalized = match.toLocaleLowerCase("fr");
    if (/^pâte\s+(?:feuilletée|brisée)$/i.test(normalized)) return "Pâte sans gluten";
    if (/^farine\s+de\s+blé$/i.test(normalized) || /^farine$/i.test(normalized)) return "Fécule de maïs (ou farine de riz)";
    if (/^(?:pâtes|spaghettis|spaghetti|coquillettes)$/i.test(normalized)) return "Pâtes sans gluten";
    if (/^(?:tranches?\s+de\s+pain|toast|pain)$/i.test(normalized)) return "Pain sans gluten";
    if (/^chapelure$/i.test(normalized)) return "Chapelure sans gluten";
    if (/^sauce\s+soja$/i.test(normalized)) return "Sauce soja Tamari (sans gluten)";
    return match;
  });
}
