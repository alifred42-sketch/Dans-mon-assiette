import type { Recipe } from "./types";

export function foldText(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function recipeLines(recipe: Recipe): string[] {
  const seen = new Set<string>();
  const lines: string[] = [];
  const add = (raw: string | undefined) => {
    const line = (raw || "").replace(/\s+/g, " ").trim();
    if (!line || seen.has(line)) return;
    seen.add(line);
    lines.push(line);
  };
  for (const section of recipe.sections || []) {
    for (const line of section.lines) add(line);
  }
  for (const line of recipe.ingredients || []) add(line);
  for (const line of recipe.notes || []) add(line);
  for (const line of recipe.robot || []) add(line);
  return lines;
}

export function matchingLines(lines: string[], query: string): string[] {
  return lines.filter((line) => matchesQuery(line, query));
}

export function recipeHaystack(recipe: Recipe): string {
  return [recipe.name, ...recipeLines(recipe), recipe.source, recipe.blurb || ""].join(" ");
}

export function matchesQuery(haystack: string, query: string): boolean {
  const needle = foldText(query).trim();
  if (!needle) return true;
  const words = needle.split(/\s+/).filter(Boolean);
  const hay = foldText(haystack);
  return words.every((word) => hay.includes(word));
}
