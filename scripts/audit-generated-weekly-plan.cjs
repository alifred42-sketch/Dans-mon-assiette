#!/usr/bin/env node
/**
 * Audite le planning réellement généré par weekPlan(), et non seulement le plan
 * statique de data/carnet.json. Aucune donnée n'est modifiée.
 *
 * Le hook TypeScript utilise le compilateur déjà installé avec le projet ; les
 * alias "@/..." sont résolus à la racine du dépôt.
 */
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  const mapped = request.startsWith("@/") ? path.join(ROOT, request.slice(2)) : request;
  return originalResolve.call(this, mapped, parent, isMain, options);
};
require.extensions[".ts"] = function (module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      resolveJsonModule: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  }).outputText;
  module._compile(compiled, filename);
};

const { weekPlan, getRecipe } = require(path.join(ROOT, "lib/carnet.ts"));
const DAYS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];
const errors = [];
const warnings = [];
const fold = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

function category(recipe) {
  if (!recipe) return "inconnu";
  const name = fold(recipe.name);
  if (/soupe|veloute|potage|bouillon/.test(name)) return "soupe";
  if (/salade|taboule|crudite/.test(name)) return "salade";
  if (/pates|spaghetti|lasagnes|ravioles|gnocchi|nouilles/.test(name)) return "pates";
  if (/riz|risotto|paella/.test(name)) return "riz";
  if (/pizza|flam/.test(name)) return "pizza";
  if (/quiche|tarte salee|cake sale|frittata/.test(name)) return "quiche";
  if (/wrap|tacos|quesadilla|burrito|fajitas/.test(name)) return "wrap-tacos";
  if (/burger|croque|sandwich|hot.?dog/.test(name)) return "sandwich";
  if (/gratin|hachis parmentier|crumble sale/.test(name)) return "gratin";
  if (/chili|con carne/.test(name)) return "chili";
  if (/curry|dahl|dal/.test(name)) return "curry";
  if (/omelette|oeufs|oeuf/.test(name)) return "oeufs";
  if (/poisson|saumon|cabillaud|thon|maquereau|colin|crevettes?|sardines?/.test(name)) return "poisson";
  if (/poulet|dinde|boeuf|veau|porc|agneau|steak|saucisse|jambon/.test(name)) return "viande";
  if (/poelee|legumes rotis|legumes farcis|ratatouille/.test(name)) return "legumes";
  return "plat";
}

const dessert = /(?:dessert|snack|truffes?|bonbons?|cookies?|biscuits? sucre|brownies?|mousse au chocolat|panna cotta|tiramisu|compote|granola|energy balls|boules d energie|barres energetiques|gaufres? sucrees|crepes sucrees|fondants? au chocolat|rochers coco|madeleines|financiers|muffins? sucrees?|chips|pop.?corn|sucettes|mendiants|buche|bouchees chocolatees|bouchees aperitives|mini.?feuilletes|gressins|crackers|tartinade|dip\b|cocktail|mocktail|smoothie|boisson|bananes? roties?|banana bread|pain perdu|salade de fruits|fruits au chocolat|bowl de (?:skyr|fromage blanc|yaourt)|skyr aux fruits|fromage blanc aux fruits|bowl sucre)/i;

function pillars(recipe) {
  const text = fold([recipe?.name || "", ...(recipe?.ingredients || [])].join(" "));
  const collect = (tokens) => tokens.filter((token) => text.includes(token));
  return {
    vegetables: collect(["courgette", "carotte", "tomate", "poivron", "poireau", "brocoli", "chou", "epinard", "aubergine", "courge", "potimarron", "champignon", "concombre", "haricot vert", "artichaut", "asperge", "navet", "panais", "fenouil", "endive", "betterave", "radis", "salade", "blette", "celeri"]),
    starches: collect(["pates", "spaghetti", "lasagne", "riz", "pomme de terre", "patate douce", "quinoa", "semoule", "couscous", "boulgour", "polenta", "pain", "tortilla", "nouilles", "orge"]),
    proteins: collect(["poulet", "dinde", "boeuf", "veau", "porc", "agneau", "canard", "saumon", "cabillaud", "thon", "maquereau", "colin", "poisson", "crevette", "sardine", "oeuf", "lentille", "pois chiche", "haricot rouge", "tofu", "tempeh"]),
  };
}

const monthlyRules = [
  { label: "tomate", re: /\b(?:tomates?|tomate cerise)\b/, months: [6,7,8,9] },
  { label: "courgette", re: /\bcourgettes?\b/, months: [6,7,8,9,10] },
  { label: "aubergine", re: /\baubergines?\b/, months: [7,8,9] },
  { label: "poivron", re: /\bpoivrons?\b/, months: [7,8,9,10] },
  { label: "concombre", re: /\bconcombres?\b/, months: [5,6,7,8,9] },
  { label: "melon", re: /\bmelons?\b/, months: [6,7,8,9] },
  { label: "pêche/nectarine/pastèque", re: /\b(?:pasteques?|peches?|nectarines?)\b/, months: [6,7,8,9] },
  { label: "abricot", re: /\babricots?\b/, months: [6,7,8] },
  { label: "fraise/framboise/groseille", re: /\b(?:fraises?|framboises?|groseilles?)\b/, months: [4,5,6,7,8,9] },
  { label: "asperge", re: /\basperges?\b/, months: [3,4,5,6] },
  { label: "haricot vert", re: /\bharicots verts?\b/, months: [6,7,8,9,10] },
  { label: "potimarron", re: /\bpotimarrons?\b/, months: [9,10,11,12,1,2] },
  { label: "butternut", re: /\bcourges? butternut\b/, months: [9,10,11,12,1,2] },
  { label: "châtaigne", re: /\bchataignes?\b/, months: [9,10,11,12] },
  { label: "chou de Bruxelles", re: /\bchoux? de bruxelles\b/, months: [9,10,11,12,1,2,3] },
  { label: "endive", re: /\bendives?\b/, months: [10,11,12,1,2,3,4] },
  { label: "panais", re: /\bpanais\b/, months: [10,11,12,1,2,3] },
  { label: "clémentine", re: /\bclementines?\b/, months: [11,12,1,2] },
  { label: "mandarine", re: /\bmandarines?\b/, months: [11,12,1,2] },
  { label: "poireau", re: /\bpoireaux?\b/, months: [9,10,11,12,1,2,3,4] },
  { label: "pomme/poire", re: /\b(?:pommes?|poires?)\b/, months: [8,9,10,11,12,1,2,3,4,5] },
];
function isoMonthForWeek(week) {
  const year = new Date().getFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (week - 1) * 7);
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  return thursday.getUTCMonth() + 1;
}
function checkSeason(recipe, month, week, slot) {
  for (const raw of recipe?.ingredients || []) {
    const line = fold(raw);
    if (/conserve|concassee|coulis|passata|en boite|en conserve|surgel|tomates pelees|concentre de tomate|compote|confiture/.test(line)) continue;
    const rule = monthlyRules.find((item) => item.re.test(line) && !item.months.includes(month));
    if (rule) warnings.push("Semaine " + week + " " + slot.day + " " + slot.meal + ": " + rule.label + " possiblement hors saison dans « " + recipe.name + " ».");
  }
}

const preferences = { householdServings: 2 };
// Une seule génération sans récursion par semaine. Les frontières et les restes sont
// ensuite vérifiés avec les plans déjà en cache pour que l'audit reste rapide en CI.
const generatedPlans = new Map();
for (let week = 1; week <= 52; week++) {
  generatedPlans.set(week, weekPlan(week, {}, preferences, false, false));
}

for (let week = 1; week <= 52; week++) {
  const basePlan = generatedPlans.get(week) || [];
  const previousWeek = week === 1 ? 52 : week - 1;
  const previousBasePlan = generatedPlans.get(previousWeek) || [];
  const previousDay = { MARDI: "LUNDI", MERCREDI: "MARDI", JEUDI: "MERCREDI", VENDREDI: "JEUDI", SAMEDI: "VENDREDI", DIMANCHE: "SAMEDI" };
  const plan = basePlan.map((slot) => {
    if (slot.meal !== "Midi") return slot;
    const source = slot.day === "LUNDI" ? previousBasePlan : basePlan;
    const dinnerDay = slot.day === "LUNDI" ? "DIMANCHE" : previousDay[slot.day];
    const dinner = source.find((item) => item.day === dinnerDay && item.meal === "Soir");
    const recipe = getRecipe(dinner?.recipeId);
    return recipe ? { ...slot, recipeId: recipe.id, name: "Restes du dîner — " + recipe.name } : slot;
  });
  if (plan.length !== 14) errors.push("Semaine " + week + ": " + plan.length + "/14 créneaux générés.");
  for (const slot of plan) {
    const recipe = getRecipe(slot.recipeId);
    if (slot.recipeId && !recipe) errors.push("Semaine " + week + ": ID de recette introuvable " + slot.recipeId + ".");
    if (!recipe) warnings.push("Semaine " + week + " " + slot.day + " " + slot.meal + ": créneau sans recette complète.");
    else if (dessert.test(fold(recipe.name))) errors.push("Semaine " + week + " " + slot.day + " " + slot.meal + ": dessert/snack planifié comme plat — " + recipe.name);
    checkSeason(recipe, isoMonthForWeek(week), week, slot);
  }

  const dinners = DAYS.map((day) => plan.find((slot) => slot.day === day && slot.meal === "Soir"));
  const previous = previousBasePlan;
  // Cette génération de contrôle désactive volontairement le cooldown de frontière ;
  // l'audit du planning source vérifie séparément la frontière entre deux semaines.
  const recent = [];
  for (const dinner of dinners) {
    const recipe = getRecipe(dinner?.recipeId);
    const currentCategory = category(recipe);
    if (currentCategory !== "inconnu" && recent.includes(currentCategory)) {
      warnings.push("Semaine " + week + ": catégorie « " + currentCategory + " » dans la fenêtre de 48 h autour de « " + (recipe?.name || dinner?.name || "repas vide") + " ».");
    }
    recent.push(currentCategory);
    if (recent.length > 2) recent.shift();
  }

  const dinnerRecipes = dinners.map((slot) => getRecipe(slot?.recipeId)).filter(Boolean);
  const union = { vegetables: new Set(), starches: new Set(), proteins: new Set() };
  for (const recipe of dinnerRecipes) {
    const found = pillars(recipe);
    for (const key of Object.keys(union)) for (const token of found[key]) union[key].add(token);
  }
  if (union.vegetables.size > 3) warnings.push("Semaine " + week + ": " + union.vegetables.size + " piliers légumes (maximum 3) dans le planning généré.");
  if (union.starches.size > 2) warnings.push("Semaine " + week + ": " + union.starches.size + " piliers féculents (maximum 2) dans le planning généré.");
  if (union.proteins.size > 2) warnings.push("Semaine " + week + ": " + union.proteins.size + " piliers protéines (maximum 2) dans le planning généré.");

  const pivotSlot = plan.find((slot) => slot.day === "MARDI" && slot.meal === "Soir");
  const daughterSlot = plan.find((slot) => slot.day === "JEUDI" && slot.meal === "Soir");
  const pivot = getRecipe(pivotSlot?.recipeId), daughter = getRecipe(daughterSlot?.recipeId);
  if (pivot && daughter) {
    const tokens = ["pois chiches", "lentilles", "haricots", "poulet", "dinde", "boeuf", "veau", "porc", "agneau", "saumon", "cabillaud", "thon", "maquereau", "colin", "crevette", "tofu", "falafel", "oeuf"];
    const pivotText = fold([pivot.name, ...(pivot.ingredients || [])].join(" "));
    const daughterText = fold([daughter.name, ...(daughter.ingredients || [])].join(" "));
    if (!tokens.some((token) => pivotText.includes(token) && daughterText.includes(token))) warnings.push("Semaine " + week + ": la recette du jeudi ne semble pas réutiliser de pilier du mardi (" + pivot.name + " → " + daughter.name + ").");
  }
}

console.log("Cuisine Chic Ouf — audit du planning réellement généré par weekPlan() (lecture seule)");
console.log("Erreurs bloquantes : " + errors.length + " | Alertes de diversité/saison/piliers à examiner : " + warnings.length);
for (const item of errors.slice(0, 100)) console.error("ERREUR : " + item);
for (const item of warnings.slice(0, 160)) console.warn("À EXAMINER : " + item);
if (warnings.length > 160) console.warn("... " + (warnings.length - 160) + " alertes supplémentaires non affichées.");
if (errors.length) process.exitCode = 1;
