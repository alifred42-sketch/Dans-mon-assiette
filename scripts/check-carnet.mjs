import fs from "node:fs";
import path from "node:path";

const file = path.resolve("data/carnet.json");
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];
const warnings = [];
const recipeById = new Map(data.recipes.map((recipe) => [recipe.id, recipe]));
const weekOf = (week) => data.plan.filter((slot) => slot.week === week);

for (let week = 1; week <= 52; week += 1) {
  const slots = weekOf(week);
  if (slots.length !== 14) errors.push(`Semaine ${week}: ${slots.length} repas au lieu de 14.`);
  for (const day of ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"]) {
    for (const meal of ["Midi", "Soir"]) {
      if (!slots.some((slot) => slot.day === day && slot.meal === meal)) errors.push(`Semaine ${week}: repas manquant — ${day} ${meal}.`);
    }
  }
  for (const slot of slots) {
    if (slot.recipeId && !recipeById.has(slot.recipeId)) errors.push(`Semaine ${week}: recette absente pour « ${slot.name} » (${slot.recipeId}).`);
  }
  const fridayLunch = slots.find((slot) => slot.day === "VENDREDI" && slot.meal === "Midi");
  if (!fridayLunch?.name?.includes("Opération Vide-Frigo")) errors.push(`Semaine ${week}: le vendredi midi doit être « 🍱 Opération Vide-Frigo ! ».`);
  const fridayDinner = slots.find((slot) => slot.day === "VENDREDI" && slot.meal === "Soir");
  if (!/burger|pizza|tacos|quesadilla|croque|wrap|hot.?dog|kebab|nugget/i.test(fridayDinner?.name || "")) warnings.push(`Semaine ${week}: repas plaisir du vendredi soir à vérifier — ${fridayDinner?.name || "absent"}.`);
  const saturdayMeals = slots.filter((slot) => slot.day === "SAMEDI");
  if (!saturdayMeals.some((slot) => /burger|pizza|tacos|quesadilla|croque|wrap|hot.?dog|kebab|nugget|gratin convivial|repas festif/i.test(slot.name || ""))) warnings.push(`Semaine ${week}: aucun repas festif clairement identifié le samedi.`);
  const batch = data.batch.filter((item) => item.week === week);
  const stages = [
    ["découpe", /découpe|decoupe/i],
    ["four", /four|fournée|fournee/i],
    ["robot Monsieur Cuisine", /robot monsieur cuisine/i],
    ["cuissons simultanées", /cuissons simultanées|cuissons simultanees/i],
    ["conservation", /conservation|congélateur|congelateur/i],
    ["assemblage", /assemblage/i],
  ];
  for (const [label, pattern] of stages) {
    if (!batch.some((item) => pattern.test(`${item.type} ${item.text}`))) errors.push(`Semaine ${week}: étape batchcooking manquante — ${label}.`);
  }
}

const plannedIds = new Set(data.plan.map((slot) => slot.recipeId).filter(Boolean));
for (const id of plannedIds) {
  const recipe = recipeById.get(id);
  if (!recipe) continue;
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length < 2) errors.push(`Recette planifiée ${id}: moins de 2 ingrédients.`);
  if (!Array.isArray(recipe.steps) || recipe.steps.length < 2) errors.push(`Recette planifiée ${id}: moins de 2 étapes.`);
  if (!recipe.timePrep) errors.push(`Recette planifiée ${id}: temps de préparation manquant.`);
  if (!recipe.timeCook) errors.push(`Recette planifiée ${id}: temps de cuisson manquant.`);
  if (/ingrédients à prévoir|à compléter|selon votre goût|selon disponibilité|préparer selon/i.test(JSON.stringify(recipe))) {
    errors.push(`Recette planifiée ${id}: contient une consigne vague ou un contenu à compléter.`);
  }
}
for (const recipe of data.recipes) {
  if (!recipe.timePrep || !recipe.timeCook || !recipe.ingredients?.length || !recipe.steps?.length) {
    warnings.push(`Fiche à compléter hors plan : ${recipe.name} (${recipe.id}).`);
  }
}

console.log(`Cuisine Chic Ouf — contrôle du carnet`);
console.log(`Recettes : ${data.recipes.length} | Menus : ${data.plan.length} | Semaines : 52 | Fiches utilisées dans les menus : ${plannedIds.size}`);
console.log(`Batchcooking : ${data.batch.length} tâches`);
console.log(`Erreurs bloquantes : ${errors.length} | Points éditoriaux à vérifier : ${warnings.length}`);
for (const error of errors) console.error(`ERREUR : ${error}`);
for (const warning of warnings.slice(0, 40)) console.warn(`À VÉRIFIER : ${warning}`);
if (warnings.length > 40) console.warn(`… et ${warnings.length - 40} autres fiches à vérifier hors menus.`);
if (errors.length) process.exitCode = 1;
