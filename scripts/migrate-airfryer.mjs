#!/usr/bin/env node
/**
 * Migration additive Airfryer — Cuisine Chic Ouf !
 *
 * Usage:
 *   node scripts/migrate-airfryer.mjs                 # audit only (dry-run)
 *   node scripts/migrate-airfryer.mjs --write         # writes JSON changes
 *   node scripts/migrate-airfryer.mjs --write --file data/recettes-619.json
 *
 * Adds Airfryer fields without removing or rewriting existing recipe fields.
 * Missing oven data is left null and reported for human review; no guessed
 * temperature or cooking duration is silently invented.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const write = process.argv.includes("--write");
const fileArg = process.argv.find((arg, i, args) => args[i - 1] === "--file");
const DATA_DIR = path.join(ROOT, "data");

function listJson(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listJson(full);
    return entry.isFile() && entry.name.endsWith(".json") ? [full] : [];
  });
}

function recipeLike(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    && typeof (value.name ?? value.title) === "string"
    && Array.isArray(value.ingredients)
    && (Array.isArray(value.steps) || Array.isArray(value.preparation) || Array.isArray(value.instructions));
}

function allRecipeObjects(value, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) allRecipeObjects(item, found);
  } else if (value && typeof value === "object") {
    if (recipeLike(value)) found.push(value);
    for (const [key, child] of Object.entries(value)) {
      if (!["ingredients", "steps", "preparation", "instructions"].includes(key)) allRecipeObjects(child, found);
    }
  }
  return found;
}

function normalize(text) {
  return String(text ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getInstructions(recipe) {
  const sectionLines = Array.isArray(recipe.sections)
    ? recipe.sections.flatMap((section) => Array.isArray(section?.lines) ? section.lines : [])
    : [];
  return [recipe.steps, recipe.preparation, recipe.instructions, recipe.robot, sectionLines]
    .filter(Array.isArray).flat().filter((v) => typeof v === "string").join("\n");
}

function ovenCooking(instructions, recipe) {
  const text = normalize(instructions);
  const hasStructuredOvenTemperature = [recipe.ovenTemperature, recipe.oven_temperature, recipe.temperatureFour, recipe.temperature_four]
    .some((value) => Number(value) >= 100 && Number(value) <= 260);
  return hasStructuredOvenTemperature || /(?:au four|enfournez|enfourner|enfourne|cuire au four|cuisson au four|four prechauffe|four chaud|four a \d{2,3}\s*°?c)/i.test(text);
}

function extractOvenTemperature(instructions, recipe) {
  const structured = [recipe.ovenTemperature, recipe.oven_temperature, recipe.temperatureFour, recipe.temperature_four]
    .map(Number).find((value) => Number.isFinite(value) && value >= 100 && value <= 260);
  if (structured != null) return structured;
  const text = normalize(instructions);
  const matches = [...text.matchAll(/(\d{2,3})\s*°\s*c/g)];
  const values = matches.map((m) => Number(m[1])).filter((n) => n >= 100 && n <= 260);
  return values.length ? values[0] : null;
}

function extractOvenMinutes(instructions, timeCook, recipe) {
  const structured = [recipe.ovenMinutes, recipe.oven_minutes, recipe.ovenTime, recipe.oven_time, recipe.timeOven, recipe.timeFour, recipe.time_four]
    .map((value) => String(value ?? "").match(/(\d{1,3})\s*(?:min|minute)/i)?.[1])
    .map(Number).find((value) => Number.isFinite(value) && value > 0 && value <= 600);
  if (structured != null) return structured;
  const text = normalize(instructions);
  const sentences = text.split(/[.!?\n]+/);
  for (const sentence of sentences) {
    if (!/(four|enfournez|enfourner|enfourne)/.test(sentence)) continue;
    const range = sentence.match(/(\d{1,3})\s*(?:-|a|à|–)\s*(\d{1,3})\s*(?:min|minute)/);
    if (range) return Math.round((Number(range[1]) + Number(range[2])) / 2);
    const minutes = sentence.match(/(\d{1,3})\s*(?:min|minute)/);
    if (minutes) return Number(minutes[1]);
    const hours = sentence.match(/(\d+(?:[.,]\d+)?)\s*h(?:eure)?/);
    if (hours) return Math.round(Number(hours[1].replace(",", ".")) * 60);
  }
  const cooked = String(timeCook ?? "").match(/^(\d{1,3})\s*(?:min|minutes?)$/i);
  return cooked ? Number(cooked[1]) : null;
}

function migrateRecipe(recipe) {
  const instructions = getInstructions(recipe);
  const compatible = ovenCooking(instructions, recipe);
  const previous = {
    airfryer_compatible: recipe.airfryer_compatible,
    airfryer_temps: recipe.airfryer_temps,
    airfryer_temperature: recipe.airfryer_temperature,
  };
  if (!compatible) {
    recipe.airfryer_compatible = false;
    recipe.airfryer_temps = null;
    recipe.airfryer_temperature = null;
  } else {
    const ovenMinutes = extractOvenMinutes(instructions, recipe.timeCook, recipe);
    const ovenTemperature = extractOvenTemperature(instructions, recipe);
    recipe.airfryer_compatible = true;
    recipe.airfryer_temps = ovenMinutes == null ? null : Math.max(1, Math.round(ovenMinutes * 0.8));
    recipe.airfryer_temperature = ovenTemperature == null ? null : Math.max(80, ovenTemperature - 20);
  }
  const changed = Object.keys(previous).some((key) => previous[key] !== recipe[key]);
  const needsReview = compatible && (recipe.airfryer_temps == null || recipe.airfryer_temperature == null);
  return { changed, compatible, needsReview };
}

const files = fileArg ? [path.resolve(ROOT, fileArg)] : listJson(DATA_DIR);
if (!files.length) {
  console.error("Aucun fichier JSON à traiter.");
  process.exit(1);
}

let scanned = 0, changed = 0, compatible = 0, review = 0;
for (const file of files) {
  let data;
  try { data = JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) {
    console.warn("Ignoré (JSON invalide) : " + path.relative(ROOT, file) + " — " + error.message);
    continue;
  }
  const recipes = allRecipeObjects(data);
  if (!recipes.length) continue;
  let fileChanged = false;
  for (const recipe of recipes) {
    scanned++;
    const result = migrateRecipe(recipe);
    if (result.compatible) compatible++;
    if (result.needsReview) {
      review++;
      console.warn("À vérifier : " + (recipe.name ?? recipe.title) + " — durée/température du four incomplète.");
    }
    if (result.changed) { changed++; fileChanged = true; }
  }
  if (write && fileChanged) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log("Mis à jour : " + path.relative(ROOT, file));
  }
}

console.log("\nMigration Airfryer — " + (write ? "ÉCRITURE" : "SIMULATION"));
console.log("Recettes examinées : " + scanned);
console.log("Recettes compatibles four : " + compatible);
console.log("Recettes modifiées : " + changed);
console.log("Compatibles à vérifier (données incomplètes) : " + review);
if (!write) console.log("Aucun fichier modifié. Relancer avec --write pour enregistrer.");
