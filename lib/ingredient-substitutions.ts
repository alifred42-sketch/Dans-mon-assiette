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


/**
 * Aide d'affichage pour adapter certaines recettes en mode sans lactose.
 * Le texte source est conservé : seules les chaînes affichées sont modifiées.
 */
const LACTOSE_FREE_PATTERN = /(?<![\p{L}])(?:lait\s+de\s+vache|lait(?!\s+(?:de\s+(?:coco|soja|riz|vache|chèvre|chevre|brebis)|d['’]?(?:amande|avoine|noisette)|sans\s+lactose|végétal|vegetal))|crème\s+fraîche|crème\s+liquide|crème(?!\s+(?:de\s+soja|végétale|vegetale|sans\s+lactose))|beurre(?!\s+de\s+(?:cacahuète|cacahuete|noix|karité|karite))|yaourt(?!\s+(?:sans\s+lactose|au\s+soja|végétal|vegetal))|fromage\s+blanc(?!\s+sans\s+lactose)|emmental\s+râpé|fromage\s+râpé|gruyère)(?![\p{L}])/giu;

export function adaptLactoseFreeText(text: string, enabled = true): string {
  if (!enabled || !text) return text;
  return text.replace(LACTOSE_FREE_PATTERN, (match) => {
    const normalized = match.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (/^lait(?: de vache)?$/.test(normalized)) return "Lait sans lactose (ou lait végétal)";
    if (/^creme(?: fraiche| liquide)?$/.test(normalized)) return "Crème sans lactose (ou crème de soja)";
    if (/^beurre$/.test(normalized)) return "Margarine végétale (ou beurre sans lactose)";
    if (/^(?:yaourt|fromage blanc)$/.test(normalized)) return "Yaourt sans lactose (ou au soja)";
    if (/^(?:fromage rape|emmental rape|gruyere)$/.test(normalized)) return "Fromage râpé sans lactose";
    return match;
  });
}
