export type Ingredient = {
  raw: string;
  key: string;
  aisle: string;
};

export type Recipe = {
  id: string;
  name: string;
  summary: string;
  category: string;
  cuisine: string;
  tags: string[];
  robot: boolean;
  robotSearch: string;
  servings: number;
  timeMin: number;
  difficulty: string;
  ingredients: Ingredient[];
  steps: string[];
  source: string;
};

export type PlanSlot = {
  week: number;
  day: string;
  meal: "midi" | "soir";
  recipeId: string | null;
  label: string;
};

export type Carnet = {
  title: string;
  subtitle: string;
  breakfast: { id: string; title: string; items: string[]; variants: string[] };
  recipes: Recipe[];
  plan: PlanSlot[];
  aisles: { id: string; label: string }[];
};
