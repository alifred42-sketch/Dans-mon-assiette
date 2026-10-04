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
  const t = line.trim();
  if (PLACEHOLDER.test(t)) return true;
  if (/^(➡️|❌|💡|✔|✅|OU|Mélanger|Servir|Ingrédients|Remplacement)/i.test(t)) return true;
  if (t.startsWith("(") && t.endsWith(")")) return true;
  return false;
}

export type ShoppingItem = {
  label: string;
  recipes: string[];
  aisle: string;
};

const AISLE_ORDER = [
  "🥩 Viandes",
  "🐟 Poisson",
  "🥛 Frais",
  "🥚 Œufs",
  "🥕 Légumes & fruits",
  "🥫 Épicerie",
  "🛒 À vérifier",
];

function aisleRank(aisle: string): number {
  const i = AISLE_ORDER.indexOf(aisle);
  return i === -1 ? AISLE_ORDER.length : i;
}

export function batchForWeek(week: number): { id: string; title: string; detail?: string; group?: string }[] {
  return (carnet.batch || [])
    .filter((item) => item.week === week)
    .map((item, i) => ({
      id: `${week}-${i}-${item.text}`,
      title: item.text,
      group: item.type || undefined,
    }));
}

export function shoppingForWeek(week: number): ShoppingItem[] {
  const official = (carnet.courses || []).filter((row) => row.week === week);
  const bag = new Map<string, ShoppingItem>();

  if (official.length > 0) {
    for (const row of official) {
      const label = row.ingredient.trim();
      if (!label) continue;
      const key = `${row.aisle}|${label.toLocaleLowerCase("fr")}`;
      const cur = bag.get(key);
      if (cur) {
        if (row.dish && !cur.recipes.includes(row.dish)) cur.recipes.push(row.dish);
      } else {
        bag.set(key, { label, recipes: row.dish ? [row.dish] : [], aisle: row.aisle });
      }
    }
  } else {
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
          bag.set(key, { label, recipes: [recipe.name], aisle: "🛒 À vérifier" });
        }
      }
    }
  }

  return [...bag.values()].sort((a, b) => {
    const aisle = aisleRank(a.aisle) - aisleRank(b.aisle);
    if (aisle !== 0) return aisle;
    return a.label.localeCompare(b.label, "fr");
  });
}
