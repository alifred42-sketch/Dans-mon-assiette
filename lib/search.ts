import type { Recipe } from "./types";

export function foldText(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function recipeHaystack(recipe: Recipe): string {
  const parts = [
    recipe.name,
    recipe.blurb || "",
    recipe.source,
    recipe.timePrep || "",
    recipe.timeCook || "",
    ...(recipe.ingredients || []),
    ...(recipe.steps || []),
    ...(recipe.robot || []),
    ...(recipe.notes || []),
    ...(recipe.sections || []).flatMap((section) => [section.title, ...section.lines]),
  ];
  const folded = foldText(parts.filter(Boolean).join(" "));
  const words = folded.split(/[^a-z0-9]+/).filter((word) => word.length > 1);
  return Array.from(new Set(words)).join(" ");
}

export function matchesQuery(haystack: string, query: string): boolean {
  const needle = foldText(query).trim();
  if (!needle) return true;
  const words = needle.split(/\s+/).filter(Boolean);
  const hay = foldText(haystack);
  return words.every((word) => hay.includes(word));
}
