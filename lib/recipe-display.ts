import type { Recipe } from "./types";
import { isPlaceholderIngredient } from "./carnet";

const vague: Record<string, string> = {
  poisson: "4 filets de cabillaud",
  patate: "600 g de pommes de terre",
  "pommes de terre": "600 g de pommes de terre",
};

function isSauceOnly(recipe: Recipe): boolean {
  const name = recipe.name.toLocaleLowerCase("fr");
  const sauceName = /\b(sauce tomate|bolognaise maison|sauce bolognaise|coulis de tomate)\b/.test(name);
  const mealName = /\b(pates|pâtes|riz|poulet|poisson|viande|lasagnes|pizza|gratin)\b/.test(name);
  return sauceName && !mealName;
}

export function displayRecipe(recipe: Recipe): Recipe {
  const sauceOnly = isSauceOnly(recipe);
  const name = sauceOnly ? `Pâtes fraîches et ${recipe.name.toLocaleLowerCase("fr")}` : recipe.name;
  const baseIngredients = (recipe.ingredients || []).map((line) => {
    const key = line.trim().toLocaleLowerCase("fr").replace(/^\d+\s*/, "");
    return vague[key] || line;
  }).filter((line) => line.trim() && !isPlaceholderIngredient(line));
  const ingredients = sauceOnly
    ? [...baseIngredients, "400 g de pâtes fraîches", "Gros sel pour la cuisson"]
    : baseIngredients;
  const pastaStep = "Cuire les pâtes fraîches dans une grande casserole d'eau bouillante salée selon le temps indiqué sur le paquet, puis les mélanger à la sauce chaude avant de servir.";
  const steps = sauceOnly
    ? [...(recipe.steps || []).filter((line) => line.trim()), pastaStep]
    : (recipe.steps || []).map((line) => {
        const key = line.trim().toLocaleLowerCase("fr");
        return vague[key] || line;
      });
  return { ...recipe, name, ingredients: [...new Set(ingredients)], steps: [...new Set(steps)] };
}

export function isSauceOnlyRecipe(recipe: Recipe): boolean {
  return isSauceOnly(recipe);
}

export function resolveVagueIngredient(line: string): string {
  const key = line.trim().toLocaleLowerCase("fr").replace(/^\d+\s*/, "");
  return vague[key] || line;
}
