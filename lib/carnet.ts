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

export const CUISINES: { id: string; label: string }[] = [
  { id: "francaise", label: "Française" },
  { id: "italienne", label: "Italienne" },
  { id: "espagnole", label: "Espagnole" },
  { id: "marocaine", label: "Marocaine" },
  { id: "asiatique", label: "Asiatique" },
  { id: "grecque", label: "Grecque" },
  { id: "monde", label: "Monde" },
];

export const TAGS: { id: string; label: string }[] = [
  { id: "express", label: "Express" },
  { id: "mr-cuisine", label: "Mr Cuisine" },
  { id: "invites", label: "Invités" },
  { id: "apero", label: "Apéro & verrines" },
  { id: "batch", label: "Batch" },
  { id: "poisson", label: "Poisson" },
  { id: "volaille", label: "Volaille" },
  { id: "vegetarien", label: "Végétarien" },
  { id: "froid", label: "Froid / été" },
  { id: "soupe", label: "Soupes" },
  { id: "dessert", label: "Desserts" },
  { id: "sauce", label: "Sauces" },
  { id: "marinade", label: "Marinades" },
];

const recipesById = new Map(carnet.recipes.map((r) => [r.id, r]));

export function getRecipe(id: string | null | undefined): Recipe | undefined {
  if (!id) return undefined;
  return recipesById.get(id);
}

export function weekPlan(week: number, overrides: Record<string, string | null>): PlanSlot[] {
  return carnet.plan
    .filter((p) => p.week === week)
    .map((p) => {
      const key = slotKey(p.week, p.day, p.meal);
      if (key in overrides) {
        const recipeId = overrides[key];
        const recipe = getRecipe(recipeId);
        return { ...p, recipeId, label: recipe?.name || p.label };
      }
      return p;
    });
}

export function slotKey(week: number, day: string, meal: string): string {
  return `${week}_${day}_${meal}`;
}

export function shoppingForWeek(
  week: number,
  overrides: Record<string, string | null>,
  servings = 2
) {
  const slots = weekPlan(week, overrides);
  const bag = new Map<
    string,
    { key: string; aisle: string; label: string; recipes: string[]; count: number }
  >();
  for (const slot of slots) {
    const recipe = getRecipe(slot.recipeId);
    if (!recipe) continue;
    const scale = servings / (recipe.servings || 2);
    for (const ing of recipe.ingredients) {
      if (!ing.key || ing.key.length < 2) continue;
      const cur = bag.get(ing.key);
      const label = ing.raw.replace(/🔗/g, "").trim();
      if (cur) {
        cur.count += scale;
        if (!cur.recipes.includes(recipe.name)) cur.recipes.push(recipe.name);
      } else {
        bag.set(ing.key, {
          key: ing.key,
          aisle: ing.aisle,
          label,
          recipes: [recipe.name],
          count: scale,
        });
      }
    }
  }
  const aisleOrder = carnet.aisles.map((a) => a.id);
  return [...bag.values()].sort((a, b) => {
    const ai = aisleOrder.indexOf(a.aisle);
    const bi = aisleOrder.indexOf(b.aisle);
    if (ai !== bi) return ai - bi;
    return a.label.localeCompare(b.label, "fr");
  });
}

export function batchForWeek(week: number, overrides: Record<string, string | null>) {
  const slots = weekPlan(week, overrides);
  const seen = new Set<string>();
  const items: { recipe: Recipe; when: string[] }[] = [];
  for (const slot of slots) {
    const recipe = getRecipe(slot.recipeId);
    if (!recipe) continue;
    const batchy =
      recipe.robot ||
      recipe.tags.includes("batch") ||
      recipe.tags.includes("soupe") ||
      /sauce|bolognaise|chili|velouté|veloute|curry|dahl/i.test(recipe.name);
    if (!batchy) continue;
    if (seen.has(recipe.id)) {
      const found = items.find((i) => i.recipe.id === recipe.id);
      found?.when.push(`${DAY_LABEL[slot.day]} ${slot.meal}`);
      continue;
    }
    seen.add(recipe.id);
    items.push({
      recipe,
      when: [`${DAY_LABEL[slot.day]} ${slot.meal}`],
    });
  }
  return items;
}

export function filterRecipes(opts: {
  q?: string;
  cuisine?: string;
  tag?: string;
}): Recipe[] {
  const q = (opts.q || "").trim().toLowerCase();
  return carnet.recipes.filter((r) => {
    if (opts.cuisine && r.cuisine !== opts.cuisine) return false;
    if (opts.tag && !r.tags.includes(opts.tag) && !(opts.tag === "mr-cuisine" && r.robot))
      return false;
    if (!q) return true;
    const blob = `${r.name} ${r.category} ${r.tags.join(" ")} ${r.ingredients.map((i) => i.raw).join(" ")}`.toLowerCase();
    return blob.includes(q);
  });
}

export function surprise(opts: { tag?: string; cuisine?: string }): Recipe | undefined {
  const pool = filterRecipes(opts).filter((r) => r.ingredients.length > 0 && !r.tags.includes("sauce"));
  if (!pool.length) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function receiveMenu(guests: number, withApero: boolean): Recipe[] {
  const mains = carnet.recipes.filter(
    (r) =>
      (r.tags.includes("invites") || r.tags.includes("batch") || r.cuisine === "francaise") &&
      r.ingredients.length >= 3 &&
      !r.tags.includes("dessert") &&
      !r.tags.includes("sauce")
  );
  const aperos = carnet.recipes.filter((r) => r.tags.includes("apero") && r.ingredients.length > 0);
  const desserts = carnet.recipes.filter((r) => r.tags.includes("dessert"));
  const pick = (arr: Recipe[], n: number) =>
    [...arr].sort(() => Math.random() - 0.5).slice(0, n);
  const out: Recipe[] = [];
  if (withApero) out.push(...pick(aperos, guests > 4 ? 2 : 1));
  out.push(...pick(mains, 1));
  out.push(...pick(desserts, 1));
  return out;
}
