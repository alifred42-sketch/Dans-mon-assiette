#!/usr/bin/env node
/**
 * Read-only audit of the 52-week static menu.
 * Does not rewrite recipes or menu slots. Heuristic findings are warnings so
 * a culinary review can distinguish likely issues from confirmed defects.
 * Run: npm run audit:weekly-plan
 */
import fs from "node:fs";
import path from "node:path";

const file = path.resolve("data/carnet.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const byId = new Map((data.recipes || []).map((recipe) => [recipe.id, recipe]));
const warnings = [];
const errors = [];
const DAYS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];
const fold = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const slotsFor = (week) => (data.plan || []).filter((slot) => slot.week === week);
const recipeOf = (slot) => slot?.recipeId ? byId.get(slot.recipeId) : undefined;
const nameOf = (slot) => recipeOf(slot)?.name || slot?.name || "";
const isMainDish = (name) => !/\b(dessert|snack|gouter|goûter|truffes?|biscuits? aperitif|crackers|gressins|granola|confiture|compote|mousse au chocolat|cookies?|brownies?|pancakes? sucres?|gaufres? sucrees?|cake sucre|tarte aux pommes sucree)\b/i.test(fold(name));
function category(name) {
  const n = fold(name);
  if (/soupe|veloute|potage|bouillon/.test(n)) return "soupe";
  if (/salade|taboule|crudite|poke bowl/.test(n)) return "salade";
  if (/pizza|tarte salee|quiche|flammekueche/.test(n)) return "pizza-quiche";
  if (/pates|lasagne|spaghetti|tagliatelle|macaroni|ravioli|gnocchi/.test(n)) return "pates";
  if (/riz|risotto|paella|couscous|semoule/.test(n)) return "riz-semoule";
  if (/gratin|hachis parmentier|crumble sale/.test(n)) return "gratin";
  if (/omelette|oeufs|frittata|shakshuka/.test(n)) return "oeufs";
  if (/poisson|saumon|cabillaud|thon|maquereau|colin|sardine|crevette|moules/.test(n)) return "poisson";
  if (/chili|lentilles|pois chiches|haricots|falafel|dahl|tofu/.test(n)) return "legumineuses";
  if (/poulet|dinde|boeuf|veau|porc|agneau|steak|saucisse|jambon|burger|boulettes/.test(n)) return "viande";
  return "autre";
}
function monthForWeek(week) {
  const year = new Date().getFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (week - 1) * 7);
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  return thursday.getUTCMonth() + 1;
}
function ingredientsOf(recipe) {
  return (recipe?.ingredients || []).map((line) => fold(line))
    .filter((line) => line && !/\b(sel|poivre|eau|huile|vinaigre|epices|herbes|paprika|cumin|curry|ail|oignon|farine|sucre)\b/.test(line));
}
const seasonalWindows = [
  { name: "tomate", months: [6, 7, 8, 9] },
  { name: "courgette", months: [6, 7, 8, 9, 10] },
  { name: "aubergine", months: [6, 7, 8, 9] },
  { name: "poivron", months: [6, 7, 8, 9, 10] },
  { name: "concombre", months: [5, 6, 7, 8, 9] },
  { name: "melon", months: [6, 7, 8, 9] },
  { name: "peche", months: [6, 7, 8, 9] },
  { name: "abricot", months: [6, 7, 8] },
  { name: "fraise", months: [4, 5, 6, 7, 8, 9] },
  { name: "asperge", months: [3, 4, 5, 6] },
  { name: "haricot vert", months: [6, 7, 8, 9, 10] },
];
const vegRe = /\b(courgettes?|tomates?|aubergines?|poivrons?|concombres?|melons?|peches?|abricots?|fraises?|asperges?|haricots verts?)\b/g;
function pillarSets(recipes) {
  const vegetables = new Set(), starches = new Set(), proteins = new Set();
  for (const recipe of recipes) {
    for (const line of recipe?.ingredients || []) {
      const n = fold(line).replace(/^\s*\d+[.,]?\d*\s*(g|kg|ml|cl|l)?\s*(de|du|des|d)?\s*/, "");
      if (/courgette|carotte|tomate|poivron|aubergine|concombre|poireau|champignon|brocoli|chou|epinard|salade|courge|navet|radis|asperge|haricot vert/.test(n)) vegetables.add(n.replace(/s\b/, ""));
      if (/riz|pates|semoule|couscous|quinoa|boulgour|polenta|nouilles|pomme de terre|patate douce|lentilles|pois chiches|haricots secs/.test(n)) starches.add(n.replace(/s\b/, ""));
      if (/poulet|dinde|boeuf|veau|porc|agneau|saumon|cabillaud|thon|maquereau|colin|crevette|oeuf|tofu|lentilles|pois chiches|haricots secs/.test(n)) proteins.add(n.replace(/s\b/, ""));
    }
  }
  return { vegetables, starches, proteins };
}

for (let week = 1; week <= 52; week++) {
  const slots = slotsFor(week);
  if (slots.length !== 14) errors.push(`Semaine ${week}: ${slots.length}/14 créneaux.`);
  for (const day of DAYS) for (const meal of ["Midi", "Soir"]) {
    const found = slots.filter((slot) => slot.day === day && slot.meal === meal);
    if (!found.length) errors.push(`Semaine ${week}: créneau manquant ${day} ${meal}.`);
  }
  for (const slot of slots) {
    if (slot.recipeId && !byId.has(slot.recipeId)) errors.push(`Semaine ${week}: ID recette introuvable ${slot.recipeId}.`);
    if (slot.meal === "Midi" && !isMainDish(nameOf(slot))) warnings.push(`Semaine ${week} ${slot.day} midi: dessert/snack possible « ${nameOf(slot)} ».`);
    if (slot.meal === "Soir" && !isMainDish(nameOf(slot))) warnings.push(`Semaine ${week} ${slot.day} soir: dessert/snack possible « ${nameOf(slot)} ».`);
  }
  const dinners = DAYS.map((day) => slots.find((slot) => slot.day === day && slot.meal === "Soir"));
  for (let i = 1; i < dinners.length; i++) {
    const before = category(nameOf(dinners[i - 1]));
    const after = category(nameOf(dinners[i]));
    if (before !== "autre" && before === after) warnings.push(`Semaine ${week}: catégorie « ${after} » deux soirs de suite (${nameOf(dinners[i - 1])} → ${nameOf(dinners[i])}).`);
  }
  const month = monthForWeek(week);
  for (const slot of dinners) {
    const recipe = recipeOf(slot);
    const text = fold([nameOf(slot), ...(recipe?.ingredients || [])].join(" "));
    for (const rule of seasonalWindows) {
      if (rule.months.includes(month)) continue;
      if (new RegExp(`\\b${rule.name.replace(/ /g, "\\s+")}s?\\b`).test(text)) {
        warnings.push(`Semaine ${week} (mois ${month}): produit possiblement hors saison « ${rule.name} » dans « ${nameOf(slot)} ».`);
      }
    }
  }
  const dinnerRecipes = dinners.map(recipeOf).filter(Boolean);
  const pillars = pillarSets(dinnerRecipes);
  if (pillars.vegetables.size > 3) warnings.push(`Semaine ${week}: ${pillars.vegetables.size} piliers légumes distincts (objectif ≤ 3).`);
  if (pillars.starches.size > 2) warnings.push(`Semaine ${week}: ${pillars.starches.size} piliers féculents distincts (objectif ≤ 2).`);
  if (pillars.proteins.size > 2) warnings.push(`Semaine ${week}: ${pillars.proteins.size} piliers protéines distincts (objectif ≤ 2).`);
  for (let i = 0; i < dinnerRecipes.length - 1; i++) {
    const a = ingredientsOf(dinnerRecipes[i]), b = ingredientsOf(dinnerRecipes[i + 1]);
    const shared = a.filter((ingredient) => b.some((other) => ingredient.includes(other) || other.includes(ingredient)));
    const coreA = a.some((v) => /poulet|dinde|boeuf|porc|saumon|cabillaud|thon|oeuf|lentille|pois chiche|tofu/.test(v));
    const coreB = b.some((v) => /poulet|dinde|boeuf|porc|saumon|cabillaud|thon|oeuf|lentille|pois chiche|tofu/.test(v));
    if (coreA && coreB && shared.length === 0) warnings.push(`Semaine ${week}: transformation mère/fille à confirmer entre « ${dinnerRecipes[i].name} » et « ${dinnerRecipes[i + 1].name} ».`);
  }
}

const plannedIds = new Set((data.plan || []).map((slot) => slot.recipeId).filter(Boolean));
console.log("Cuisine Chic Ouf — audit heuristique du planning 52 semaines (lecture seule)");
console.log(`Recettes source: ${(data.recipes || []).length} | Créneaux: ${(data.plan || []).length} | Recettes planifiées: ${plannedIds.size}`);
console.log(`Erreurs de structure/IDs: ${errors.length} | Alertes culinaires à examiner: ${warnings.length}`);
for (const error of errors) console.error("ERREUR: " + error);
for (const warning of warnings.slice(0, 160)) console.warn("À EXAMINER: " + warning);
if (warnings.length > 160) console.warn(`… ${warnings.length - 160} alertes supplémentaires (non affichées).`);
if (errors.length) process.exitCode = 1;
