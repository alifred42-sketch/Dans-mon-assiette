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
const LACTOSE_FREE_PATTERN = /(?<![\p{L}])(?:lait\s+de\s+vache|lait(?:\s+(?:entier|demi[- ]?écrémé|écrémé))?(?!\s+(?:de\s+(?:coco|soja|riz|vache|chèvre|chevre|brebis)|d['’]?(?:amande|avoine|noisette)|sans\s+lactose|végétal|vegetal))|crème\s+fraîche(?:\s+épaisse)?|crème\s+liquide(?:\s+entière)?|crème(?!\s+(?:de\s+soja|végétale|vegetale|sans\s+lactose))|beurre(?:\s+(?:doux|fondu|salé|sale|demi[- ]?sel))?(?!\s+de\s+(?:cacahuète|cacahuete|noix|karité|karite))|yaourt(?:\s+nature)?(?!\s+(?:sans\s+lactose|au\s+soja|végétal|vegetal))|fromage\s+blanc(?!\s+sans\s+lactose)|emmental\s+râpé|fromage\s+râpé|gruyère(?:\s+râpé)?)(?![\p{L}])/giu;

export function adaptLactoseFreeText(text: string, enabled = true): string {
  if (!enabled || !text) return text;
  return text.replace(LACTOSE_FREE_PATTERN, (match) => {
    const normalized = match.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (/^lait(?: de vache| entier| demi[- ]?ecreme| ecreme)?$/.test(normalized)) return "Lait sans lactose (ou lait végétal)";
    if (/^creme(?: fraiche(?: epaisse)?| liquide(?: entiere)?| epaisse)?$/.test(normalized)) return "Crème sans lactose (ou crème de soja)";
    if (/^beurre(?: doux| fondu| sale| demi[- ]?sel)?$/.test(normalized)) return "Margarine végétale (ou beurre sans lactose)";
    if (/^(?:yaourt(?: nature)?|fromage blanc)$/.test(normalized)) return "Yaourt sans lactose (ou au soja)";
    if (/^(?:fromage rape|emmental rape|gruyere(?: rape)?)$/.test(normalized)) return "Fromage râpé sans lactose";
    return match;
  });
}


/**
 * Aide d'affichage pour éviter certains fruits à coque.
 * Les données sources restent intactes ; les substitutions affichées ne garantissent
 * ni l'absence de traces ni la sécurité pour une personne allergique.
 */
const NUT_FREE_PATTERN = /(?<![\p{L}])(?:beurre\s+de\s+cacahu[eè]te|pur[eé]e\s+d['’](?:amande|amandes?|noisette|noisettes?)|poudre\s+d['’](?:amande|amandes?|noisette|noisettes?)|amandes?(?:\s+(?:enti[eè]res?|effil[eé]es?|en\s+poudre))?|noisettes?(?:\s+(?:enti[eè]res?|concass[eé]es?|en\s+poudre))?|noix\s+de\s+(?:cajou|p[eé]can|macadamia)|noix\s+du\s+br[eé]sil|pistaches?|noix(?!\s+de\s+coco)|pesto)(?![\p{L}])/giu;

/** Remplace les mentions ciblées dans les textes affichés lorsque l'option est active. */
export function adaptNutFreeText(text: string, enabled = true): string {
  if (!enabled || !text) return text;
  return text.replace(NUT_FREE_PATTERN, (match) => {
    const normalized = match.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "'");
    if (/^(?:beurre de cacahuete|puree d'(?:amande|amandes|noisette|noisettes))$/.test(normalized)) return "Purée de sésame (Tahini)";
    if (/^pesto$/.test(normalized)) return "Pesto sans fruits à coque (aux graines de tournesol)";
    if (/^(?:amande|amandes|amande entiere|amandes entieres|amande effilee|amandes effilees|amande en poudre|amandes en poudre|poudre d'amande|poudre d'amandes|noisette|noisettes|noisette entiere|noisettes entieres|noisette concassee|noisettes concassees|noisette en poudre|noisettes en poudre|poudre de noisette|poudre de noisettes)$/.test(normalized)) return "Graines de tournesol (ou de courge)";
    if (/^(?:noix|noix de cajou|noix de pecan|noix de macadamia|noix du bresil|pistache|pistaches)$/.test(normalized)) return "Graines de sésame (ou pignons de pin)";
    return match;
  });
}
