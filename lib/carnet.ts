import data from "@/data/carnet.json";
import type { Carnet, PlanSlot, Recipe } from "./types";

export const carnet = data as Carnet;

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

export function weekPlan(week: number): PlanSlot[] {
  return carnet.plan.filter((p) => p.week === week);
}

export function clampWeek(raw: string | undefined | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(52, Math.max(1, Math.round(n)));
}

const PLACEHOLDER = /^ingr[ée]dients à prévoir/i;

export function isPlaceholderIngredient(line: string): boolean {
  return PLACEHOLDER.test(line.trim());
}

export type ShoppingItem = {
  label: string;
  recipes: string[];
};

export function shoppingForWeek(week: number): ShoppingItem[] {
  const bag = new Map<string, ShoppingItem>();
  for (const slot of weekPlan(week)) {
    const recipe = getRecipe(slot.recipeId);
    if (!recipe) continue;
    for (const raw of recipe.ingredients) {
      const label = raw.replace(/🔗/g, "").trim();
      if (!label || isPlaceholderIngredient(label)) continue;
      const key = label.toLocaleLowerCase("fr");
      const cur = bag.get(key);
      if (cur) {
        if (!cur.recipes.includes(recipe.name)) cur.recipes.push(recipe.name);
      } else {
        bag.set(key, { label, recipes: [recipe.name] });
      }
    }
  }
  return [...bag.values()].sort((a, b) => a.label.localeCompare(b.label, "fr"));
}
