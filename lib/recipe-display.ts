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
  const normalizedText = (value: string) => value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^\s*\d+[.)-]\s*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const ingredientNames = ingredients.map((line) => {
    const withoutQuantity = line.replace(/^\s*(?:\d+(?:[.,]\d+)?\s*)?(?:kg|g|mg|l|cl|ml)?\s*/i, "");
    return normalizedText(withoutQuantity.split(/[:(]/, 1)[0]);
  }).filter((line) => line.length >= 3);
  const rawSteps = (recipe.steps || []).filter((line) => line.trim());
  const displaySteps = rawSteps.filter((line, index) => {
    if (index !== 0) return true;
    const normalized = normalizedText(line);
    if (/^(ingredients?|liste des ingredients|a prevoir|pour cette recette)\\b/.test(normalized)) return false;
    const hasPreparationAction = /\\b(melange|melanger|coupe|couper|lave|laver|epluche|eplucher|chauffe|chauffer|cuire|faites|faire|ajoute|ajouter|verse|verser|mixez|mixer|assaisonne|assaisonner|incorpore|incorporer|fouette|fouetter|dispose|disposer|prechauffe|prechauffer|enfourne|enfourner|laisse|laisser|reservez|reserver|servez|servir|battez|battre|etalez|etaler|deposez|deposer)\\b/.test(normalized);
    if (hasPreparationAction) return true;
    const matchingIngredients = ingredientNames.filter((name) => normalized.includes(name));
    return matchingIngredients.length < Math.min(2, ingredientNames.length);
  });
  const steps = sauceOnly
    ? [...displaySteps.map((line) => {
        const key = line.trim().toLocaleLowerCase("fr");
        return vague[key] || line;
      }), pastaStep]
    : displaySteps.map((line) => {
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
