export type Recipe = {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
  robot: string[];
  notes: string[];
  source: string;
  timePrep?: string;
  timeCook?: string;
  servings?: string;
};

export type PlanSlot = {
  week: number;
  day: string;
  meal: string;
  name: string;
  recipeId: string | null;
};

export type BatchItem = {
  week: number;
  text: string;
  type: string;
};

export type CourseRow = {
  week: number;
  dish: string;
  ingredient: string;
  aisle: string;
};

export type Carnet = {
  title: string;
  subtitle: string;
  recipes: Recipe[];
  plan: PlanSlot[];
  batch: BatchItem[];
  courses: CourseRow[];
};
