import data from "@/data/carnet.json";
import { trendRecipes } from "@/data/recettes-tendances";
import type { Breakfast, Carnet, Collection, PlanSlot, Recipe } from "./types";

export const carnet = { ...data, recipes: [...data.recipes, ...trendRecipes] } as Carnet;

export const DAYS = [
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
  "DIMANCHE",
] as const;

export const DAY_LABEL: Record<string, string> = {
  LUNDI: "Lundi",
  MARDI: "Mardi",
  MERCREDI: "Mercredi",
  JEUDI: "Jeudi",
  VENDREDI: "Vendredi",
  SAMEDI: "Samedi",
  DIMANCHE: "Dimanche",
};

const recipesById = new Map(carnet.recipes.map((r) => [r.id, r]));

export function getRecipe(id: string | null | undefined): Recipe | undefined {
  if (!id) return undefined;
  return recipesById.get(id);
}

export type Season = "hiver" | "printemps" | "ete" | "automne";

export function seasonForWeek(week: number): Season {
  // Repères hebdomadaires adaptés au calendrier des saisons en France métropolitaine.
  if (week <= 11 || week >= 50) return "hiver";
  if (week <= 24) return "printemps";
  if (week <= 37) return "ete";
  return "automne";
}

export function seasonLabel(week: number): string {
  const labels: Record<Season, string> = {
    hiver: "Hiver",
    printemps: "Printemps",
    ete: "Été",
    automne: "Automne",
  };
  return labels[seasonForWeek(week)];
}

const SEASON_TERMS: Record<Season, string[]> = {
  hiver: ["hiver", "hivernal", "soupe", "veloute", "potage", "poireau", "chou", "courge", "pomme de terre", "gratin", "mijote", "lentille", "endive", "carotte"],
  printemps: ["printemps", "asperge", "radis", "petit pois", "epinard", "fraise", "artichaut", "navet", "blette", "courgette", "citron", "herbes fraiches"],
  ete: ["ete", "estival", "tomate", "courgette", "aubergine", "poivron", "concombre", "melon", "peche", "abricot", "fraise", "salade", "barbecue", "grille"],
  automne: ["automne", "potimarron", "courge", "champignon", "chataigne", "pomme", "poire", "raisin", "patate douce", "carotte", "poireau", "lentille", "mijote"],
};

function isMealRecipe(recipe: Recipe): boolean {
  return !/^(sauce|marinade|vinaigrette|pesto|coulis|mélange d'épices|melange d'epices|épices|epices|granola|confiture|compote|sirop|boisson|cocktail|tartinade|dip\b|crackers|gressins|biscuits apéritifs)/i.test(recipe.name.trim());
}

function durationMinutes(value?: string): number | null {
  if (!value) return null;
  const match = value.match(/(\d+)\s*(?:h|heure)/i);
  const hours = match ? Number(match[1]) : 0;
  const mins = value.match(/(\d+)\s*(?:min|minute)/i);
  if (!match && !mins) {
    const numeric = value.match(/\d+/);
    return numeric ? Number(numeric[0]) : null;
  }
  return hours * 60 + (mins ? Number(mins[1]) : 0);
}

/** Sélectionne une recette complète, distincte des autres repas de la semaine et marquée par des indices de saison. */
export function seasonalReplacement(
  week: number,
  currentRecipeId: string | null,
  excludedIds: ReadonlySet<string> = new Set<string>(),
): Recipe | undefined {
  const season = seasonForWeek(week);
  const current = getRecipe(currentRecipeId);
  const currentDuration = current
    ? [durationMinutes(current.timePrep), durationMinutes(current.timeCook)].reduce<number>((sum, n) => sum + (n || 0), 0)
    : 0;
  return carnet.recipes
    .filter((recipe) =>
      recipe.id !== currentRecipeId &&
      !excludedIds.has(recipe.id) &&
      isValidatedRecipe(recipe) &&
      isMealRecipe(recipe) &&
      seasonalScore(recipe, season) > 0
    )
    .map((recipe) => {
      const score = seasonalScore(recipe, season);
      const duration = [durationMinutes(recipe.timePrep), durationMinutes(recipe.timeCook)].reduce<number>((sum, n) => sum + (n || 0), 0);
      const durationDifference = currentDuration && duration ? Math.abs(currentDuration - duration) : 0;
      return { recipe, score, durationDifference };
    })
    .sort((a, b) =>
      b.score - a.score ||
      a.durationDifference - b.durationDifference ||
      a.recipe.name.localeCompare(b.recipe.name, "fr")
    )[0]?.recipe;
}

function normalizedSeasonText(value: string): string {
  return value.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isCompleteRecipe(recipe: Recipe): boolean {
  const ingredients = (recipe.ingredients || []).filter((line) => line.trim() && !isPlaceholderIngredient(line));
  const steps = (recipe.steps || []).filter((line) => line.trim() && !/^(a completer|etapes a definir|mode d'emploi a ajouter)/i.test(line));
  return ingredients.length >= 2 && steps.length >= 2;
}

const SEASONING_ONLY = /^(sel|poivre|épices?|epices?|herbes|aromates|persil|coriandre|basilic|ciboulette|menthe|thym|laurier|paprika|cumin|curry|muscade|cannelle|piment|origan|aneth|romarin|herbes de provence)(\b|\s|,)/i;
const QUANTIFIED_INGREDIENT = /^\s*\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?\s*(?:(?:kg|g|grammes?|mg|l|litres?|ml|cl|c\.?\s*à\s*(?:soupe|café)|càs|cac|cs|cc|cuillères?|pincées?|tranches?|gousses?|filets?|doses?|boîtes?|boites?|pots?|paquets?|branches?|feuilles?|poignées?|poignees?|tasses?|verres?)\s+)?[\p{L}]/iu;

/** Gate de sécurité du planning : quantités chiffrées, temps explicites, portions numériques et étapes réelles. */
export function isValidatedRecipe(recipe: Recipe): boolean {
  if (!isCompleteRecipe(recipe) || isSauceOrSideRecipe(recipe.name)) return false;
  const prep = durationMinutes(recipe.timePrep);
  const cook = durationMinutes(recipe.timeCook);
  if (prep === null || cook === null || prep < 0 || cook < 0) return false;
  if (!recipe.servings || !/\b\d+\b/.test(recipe.servings)) return false;
  const ingredients = (recipe.ingredients || []).filter((line) => line.trim() && !isPlaceholderIngredient(line));
  if (ingredients.length < 3 || ingredients.some((line) => !QUANTIFIED_INGREDIENT.test(line) && !SEASONING_ONLY.test(line.trim()))) return false;
  const steps = (recipe.steps || []).filter((line) => line.trim() && !/^(a completer|etapes a definir|mode d'emploi a ajouter)/i.test(line));
  return steps.length >= 3 && steps.every((step) => !/^(à compléter|etape à definir|étape à définir|mode d'emploi à ajouter)/i.test(step.trim()));
}

function isSauceOrSideRecipe(name: string): boolean {
  return /^(sauce|marinade|vinaigrette|pesto|coulis|mélange d'épices|melange d'epices|épices|epices|granola|confiture|compote|sirop|boisson|cocktail|tartinade|dip\b|crackers|gressins|biscuits apéritifs)/i.test(name.trim());
}

export type PlanningPreferences = {
  etudiant?: boolean; vegetarien?: boolean; vegan?: boolean; halal?: boolean;
  sansGluten?: boolean; sansLactose?: boolean; sansFruitsCoque?: boolean;
};

function profileAllows(recipe: Recipe, prefs: PlanningPreferences): boolean {
  const text = normalizedSeasonText([recipe.name, ...(recipe.ingredients || []), ...(recipe.steps || [])].join(" "));
  const regime = normalizedSeasonText(recipe.regime || "");
  const tags = normalizedSeasonText(recipe.sous_regime || "");
  if (prefs.vegan && regime !== "vegan") return false;
  if (prefs.vegetarien && !["vegan", "vegetarien", "vegetarian"].includes(regime)) return false;
  if (prefs.etudiant && !/etudiant|petit.?budget|economique|budget/.test(tags + " " + text)) return false;
  if (prefs.halal && (/(porc|lardon|jambon|bacon|saucisse de porc|vin blanc|vin rouge|rhum|cognac|porto|alcool)/.test(text) || !/halal/.test(regime + " " + tags + " " + text))) return false;
  if (prefs.sansGluten && /(farine de ble|pain|pates|semoule|couscous|tortilla|wrap|chapelure|seitan|sauce soja(?! sans gluten))/.test(text)) return false;
  if (prefs.sansLactose && /(lait|creme|beurre|fromage|yaourt|skyr|ricotta|mozzarella|parmesan|feta)/.test(text)) return false;
  if (prefs.sansFruitsCoque && /(amande|noisette|noix|pistache|noix de cajou|pignon|cacahuete)/.test(text)) return false;
  return true;
}

function seasonalScore(recipe: Recipe, season: Season): number {
  if (!isCompleteRecipe(recipe)) return 0;
  const text = normalizedSeasonText([
    recipe.name,
    ...(recipe.ingredients || []),
    ...(recipe.sections || []).flatMap((section) => [section.title, ...section.lines]),
  ].join(" "));
  return SEASON_TERMS[season].reduce((score, term) => score + (text.includes(normalizedSeasonText(term)) ? 1 : 0), 0);
}

export function weekPlan(week: number, overrides: Record<string, string> = {}, preferences: PlanningPreferences = {}): PlanSlot[] {
  const slots = carnet.plan.filter((p) => p.week === week).map((slot) => {
    const id = overrides[`${slot.week}|${slot.day}|${slot.meal}`];
    const recipe = id ? recipesById.get(id) : undefined;
    return recipe ? { ...slot, recipeId: recipe.id, name: recipe.name } : slot;
  });
  const season = seasonForWeek(week);
  const used = new Set<string>();
  const eligible = carnet.recipes.filter((recipe) => isValidatedRecipe(recipe) && profileAllows(recipe, preferences));
  const plantProfile = Boolean(preferences.vegan || preferences.vegetarien);
  const roleText = (recipe: Recipe) => normalizedSeasonText([recipe.name, ...(recipe.ingredients || [])].join(" "));
  const chooseRole = (pattern: RegExp, exclude: Set<string> = new Set<string>()) =>
    eligible.filter((recipe) => !exclude.has(recipe.id) && pattern.test(roleText(recipe)))
      .sort((a, b) => seasonalScore(b, season) - seasonalScore(a, season) || a.name.localeCompare(b.name, "fr"))[0];
  const reserved = new Set<string>();
  const fishOrPlant = chooseRole(plantProfile ? /tofu|pois chiches|lentilles|haricots|edamame|œufs|oeufs|omelette/ : /poisson|saumon|cabillaud|thon|maquereau|crevette|sardine|colin|lieu/, reserved);
  if (fishOrPlant) reserved.add(fishOrPlant.id);
  const pivot = chooseRole(plantProfile ? /tofu|pois chiches|lentilles|haricots|edamame|œufs|oeufs|omelette/ : /poulet|dinde|bœuf|boeuf|veau|porc|agneau|viande|steak/, reserved);
  if (pivot) reserved.add(pivot.id);
  const soup = chooseRole(/soupe|velouté|veloute|potage|bouillon/, reserved);
  if (soup) reserved.add(soup.id);
  const pantry = chooseRole(/wrap|salade|omelette|tartine|riz sauté|riz saute|poêlée|poelee|vide.?frigo/, reserved);
  if (pantry) reserved.add(pantry.id);
  const pleasures = eligible.filter((recipe) => !reserved.has(recipe.id) && /pizza|burger|lasagnes|tarte|crumble|fondant|dessert|gaufre|crêpe|crepe|pancake|festif|gourmand/.test(roleText(recipe))).sort((a, b) => seasonalScore(b, season) - seasonalScore(a, season) || a.name.localeCompare(b.name, "fr"));
  const matrix = new Map<string, { recipe: Recipe | null; name: string }>();
  const setRole = (day: string, meal: string, recipe: Recipe | undefined, fallback: string, name?: string) =>
    matrix.set(`${day}|${meal}`, { recipe: recipe || null, name: name || recipe?.name || fallback });
  setRole("LUNDI", "Soir", fishOrPlant, plantProfile ? "Aucune protéine végétale éclair validée" : "Aucun poisson éclair validé");
  setRole("MARDI", "Soir", pivot, "Aucun pivot protéiné complet validé");
  setRole("MERCREDI", "Midi", pivot, "Aucune portion pivot validée");
  setRole("MERCREDI", "Soir", soup, "Aucune soupe de saison complète validée");
  setRole("JEUDI", "Soir", pivot, "Seconde vie du pivot indisponible", pivot ? `Seconde vie — ${pivot.name}` : undefined);
  setRole("VENDREDI", "Midi", pantry, "Aucune recette Vide-Frigo complète validée");
  setRole("SAMEDI", "Midi", pleasures[0], "Aucun repas plaisir validé");
  setRole("SAMEDI", "Soir", pleasures[1], "Aucun repas plaisir validé");
  setRole("DIMANCHE", "Midi", pleasures[2], "Aucun repas plaisir validé");
  setRole("DIMANCHE", "Soir", pleasures[3], "Aucun repas plaisir validé");
  return slots.map((slot) => {
    const matrixSelection = matrix.get(`${slot.day}|${slot.meal}`);
    if (matrixSelection) {
      if (!matrixSelection.recipe) return { ...slot, name: matrixSelection.name, recipeId: null };
      used.add(matrixSelection.recipe.id);
      return { ...slot, name: matrixSelection.name, recipeId: matrixSelection.recipe.id };
    }
    const current = slot.recipeId ? recipesById.get(slot.recipeId) : undefined;
    const currentValid = current ? isValidatedRecipe(current) && profileAllows(current, preferences) : false;
    const currentScore = current ? seasonalScore(current, season) : 0;
    if (current && currentValid && currentScore > 0 && !used.has(current.id)) {
      used.add(current.id);
      return { ...slot, name: current.name };
    }
    const alternatives = eligible
      .filter((recipe) => !used.has(recipe.id) && recipe.id !== current?.id)
      .map((recipe) => ({ recipe, score: seasonalScore(recipe, season) }))
      .sort((a, b) => b.score - a.score || a.recipe.name.localeCompare(b.recipe.name, "fr"));
    const replacement = alternatives.find((item) => item.score > 0)?.recipe || alternatives[0]?.recipe;
    if (!replacement) return { ...slot, name: "Aucune recette complète validée pour ces critères", recipeId: null };
    used.add(replacement.id);
    return { ...slot, name: replacement.name, recipeId: replacement.id };
  });
}
export function breakfastForWeek(week: number): Breakfast | undefined {
  return (carnet.breakfasts || []).find((item) => item.week === week);
}

export function getCollections(): Collection[] {
  return carnet.collections || [];
}

export function getCollection(slug: string): Collection | undefined {
  return getCollections().find((item) => item.slug === slug);
}

export function recipesForCollection(slug: string): Recipe[] {
  const col = getCollection(slug);
  if (!col) return [];
  return col.recipeIds.map((id) => recipesById.get(id)).filter((r): r is Recipe => !!r);
}

export function currentIsoWeek(): number {
  const date = new Date();
  const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = thursday.getUTCDay() || 7;
  thursday.setUTCDate(thursday.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  return Math.min(52, Math.max(1, Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)));
}

export function clampWeek(raw: string | undefined | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(52, Math.max(1, Math.round(n)));
}

const PLACEHOLDER = /^ingr[ée]dients à prévoir/i;

export function isPlaceholderIngredient(line: string): boolean {
  const t = line.trim();
  if (PLACEHOLDER.test(t)) return true;
  if (/^(➡️|❌|💡|✔|✅|OU|Mélanger|Servir|Ingrédients|Remplacement|Variantes?|Épices|Recherche)/i.test(t)) return true;
  if (t.startsWith("(") && t.endsWith(")")) return true;
  return false;
}

export type ShoppingItem = {
  label: string;
  recipes: string[];
  aisle: string;
};

export function batchForWeek(week: number): { id: string; title: string; detail?: string; group?: string }[] {
  return (carnet.batch || [])
    .filter((item) => item.week === week)
    .map((item, i) => ({
      id: `${week}-${i}-${item.text}`,
      title: item.text,
      group: item.type || undefined,
    }));
}

export { shoppingForWeek } from "./shopping";
