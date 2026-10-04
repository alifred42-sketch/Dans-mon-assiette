import type { Recipe } from "./types";

export type DishKind = {
  id: string;
  label: string;
  hint: string;
};

const RULES: { id: string; label: string; hint: string; re: RegExp }[] = [
  { id: "wrap", label: "Wrap / tartine", hint: "wrap", re: /wrap|fajita|burger|tartine|sandwich/i },
  { id: "apero", label: "Apéro / verrine", hint: "verrine", re: /verrine|ap[eé]ro|rillettes|amuse/i },
  { id: "soupe", label: "Soupe / velouté", hint: "bol", re: /velout[eé]|soupe|potage|bouillon/i },
  { id: "dessert", label: "Dessert", hint: "dessert", re: /dessert|compote|chocolat|cr[eè]pe|g[aâ]teau|crème dessert/i },
  { id: "sauce", label: "Sauce", hint: "sauce", re: /^sauce\b|sauce skyr|sauce tomate|pesto|marinade/i },
  { id: "epices", label: "Épices", hint: "épices", re: /m[eé]lange |herbes de provence|épices/i },
  { id: "oeuf", label: "Œufs", hint: "œuf", re: /omelette|œuf|oeuf|cocotte|shakshuka|muffins sal/i },
  { id: "pates", label: "Pâtes / risotto", hint: "pâtes", re: /p[aâ]tes|lasagne|risotto|one pot/i },
  { id: "salade", label: "Salade", hint: "salade", re: /salade|crudit|bowl|taboul/i },
  { id: "legumineuses", label: "Légumineuses", hint: "lentilles", re: /lentille|dahl|pois chiche/i },
  { id: "poisson", label: "Poisson", hint: "poisson", re: /saumon|cabillaud|thon|maquereau|poisson|crevette|lieu|dorade|brandade|morue/i },
  { id: "volaille", label: "Volaille", hint: "poulet", re: /poulet|dinde|volaille|escalope/i },
  { id: "viande", label: "Viande", hint: "viande", re: /b[oœ]uf|steak|porc|veau|osso|chili|bolognaise|boulette|hach[eé]|filet mignon|parmentier/i },
  { id: "riz", label: "Riz", hint: "riz", re: /\briz\b/i },
  { id: "legumes", label: "Légumes", hint: "légumes", re: /ratatouille|courgette|l[eé]gume|poivron|gratin|farci/i },
];

export function dishKind(recipe: Pick<Recipe, "name" | "tags" | "category">): DishKind {
  const blob = `${recipe.name} ${recipe.category} ${recipe.tags.join(" ")}`;
  for (const rule of RULES) {
    if (rule.re.test(blob)) return { id: rule.id, label: rule.label, hint: rule.hint };
  }
  if (recipe.tags.includes("poisson")) return { id: "poisson", label: "Poisson", hint: "poisson" };
  if (recipe.tags.includes("volaille")) return { id: "volaille", label: "Volaille", hint: "poulet" };
  if (recipe.tags.includes("apero")) return { id: "apero", label: "Apéro / verrine", hint: "verrine" };
  if (recipe.tags.includes("dessert")) return { id: "dessert", label: "Dessert", hint: "dessert" };
  if (recipe.tags.includes("sauce")) return { id: "sauce", label: "Sauce", hint: "sauce" };
  return { id: "plat", label: "Plat", hint: "plat" };
}
