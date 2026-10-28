export type RecipeSection = {
  title: string;
  lines: string[];
};

export type Recipe = {
  id: string;
  name: string;
  ingredients: string[];
  steps: string[];
  robot: string[];
  notes: string[];
  sections?: RecipeSection[];
  blurb?: string;
  source: string;
  timePrep?: string;
  timeCook?: string;
  servings?: string;
  image?: string;
  imageAlt?: string;
  imageSourceUrl?: string;
  imageCredit?: string;
  /** Airfryer conversion derived from explicit oven instructions; null means review needed. */
  airfryer_compatible?: boolean;
  airfryer_temps?: number | null;
  airfryer_temperature?: number | null;
  fete?: string;
  sous_fete?: string;
  regime?: string;
  sous_regime?: string;
  numero?: number;
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

export type Collection = {
  slug: string;
  name: string;
  blurb: string;
  recipeIds: string[];
};

export type Breakfast = {
  week: number;
  title: string;
  lines: string[];
};

export type Carnet = {
  title: string;
  subtitle: string;
  recipes: Recipe[];
  plan: PlanSlot[];
  batch: BatchItem[];
  courses: CourseRow[];
  collections: Collection[];
  breakfasts: Breakfast[];
};
