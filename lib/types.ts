export type Recipe = {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
};

export type PlanSlot = {
  week: number;
  day: string;
  meal: string;
  name: string;
  recipeId: string | null;
};

export type Carnet = {
  title: string;
  subtitle: string;
  recipes: Recipe[];
  plan: PlanSlot[];
};
