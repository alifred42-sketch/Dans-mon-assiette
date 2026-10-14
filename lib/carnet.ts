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
      isCompleteRecipe(recipe) &&
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

function seasonalScore(recipe: Recipe, season: Season): number {
  if (!isCompleteRecipe(recipe)) return 0;
  const text = normalizedSeasonText([
    recipe.name,
    ...(recipe.ingredients || []),
    ...(recipe.sections || []).flatMap((section) => [section.title, ...section.lines]),
  ].join(" "));
  return SEASON_TERMS[season].reduce((score, term) => score + (text.includes(normalizedSeasonText(term)) ? 1 : 0), 0);
}

export function weekPlan(week: number, overrides: Record<string, string> = {}): PlanSlot[] {
  const slots = carnet.plan.filter((p) => p.week === week).map((slot) => {
    const id = overrides[`${slot.week}|${slot.day}|${slot.meal}`];
    const recipe = id ? recipesById.get(id) : undefined;
    return recipe ? { ...slot, recipeId: recipe.id, name: recipe.name } : slot;
  });
  const season = seasonForWeek(week);
  const used = new Set<string>();
  return slots.map((slot) => {
    const current = slot.recipeId ? recipesById.get(slot.recipeId) : undefined;
    const currentComplete = current ? isCompleteRecipe(current) : false;
    const currentScore = current ? seasonalScore(current, season) : 0;
    if (current && currentComplete && currentScore > 0 && !used.has(current.id)) {
      used.add(current.id);
      return { ...slot, name: current.name };
    }
    const completeAlternatives = carnet.recipes
      .filter((recipe) => isCompleteRecipe(recipe) && !used.has(recipe.id) && recipe.id !== current?.id)
      .map((recipe) => ({ recipe, score: seasonalScore(recipe, season) }))
      .sort((a, b) => b.score - a.score || a.recipe.name.localeCompare(b.recipe.name, "fr"));
    const replacement = completeAlternatives.find((item) => item.score > 0)?.recipe || completeAlternatives[0]?.recipe;
    if (!replacement) {
      if (current) used.add(current.id);
      return slot;
    }
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
