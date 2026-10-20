import data from "@/data/carnet.json";
import { trendRecipes } from "@/data/recettes-tendances";
import type { Breakfast, Carnet, Collection, PlanSlot, Recipe } from "./types";

function normalizedRecipeTime(value: unknown, fallback: number): string {
  const text = String(value ?? "").trim();
  const range = text.match(/(\d+)\s*(?:-|–|à|a)\s*(\d+)\s*(?:min|minute)/i);
  if (range) return range[2] + " min";
  if (/\d+\s*(?:min|minute|h(?:eure)?)/i.test(text)) return text;
  const numeric = text.match(/^\d+$/);
  return numeric ? numeric[0] + " min" : fallback + " min";
}

function defaultPrepTime(recipe: Partial<Recipe>): number {
  const text = normalizedSeasonText([recipe.name || "", ...(recipe.ingredients || [])].join(" "));
  if (/smoothie|salade|wrap|tartine|sandwich|gaspacho|carpaccio|verrine|tartare|crudite/.test(text)) return 10;
  return 15;
}

function defaultCookTime(recipe: Partial<Recipe>): number {
  const text = normalizedSeasonText([recipe.name || "", ...(recipe.ingredients || [])].join(" "));
  if (/salade|wrap|tartine|sandwich|smoothie|gaspacho|carpaccio|verrine|tartare|crudite|overnight|yaourt|porridge froid/.test(text)) return 0;
  if (/soupe|veloute|potage|bouillon|chili|curry|mijote|ragout/.test(text)) return 25;
  if (/gratin|lasagne|quiche|tarte|gateau|cake|four|roti|hachis|parmentier/.test(text)) return 30;
  if (/poisson|saumon|cabillaud|colin|filet|maquereau/.test(text)) return 15;
  return 15;
}

function normalizeIngredientQuantity(raw: string): string {
  let line = String(raw || "").trim().replace(/^[•\-–]\s*/, "");
  line = line.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, " ").replace(/\s+/g, " ").trim();
  const reverse = line.match(/^(poireaux?|carottes?)\s*:\s*(\d+(?:[.,]\d+)?)$/i);
  if (reverse) return reverse[2] + " " + reverse[1].toLocaleLowerCase("fr");
  if (/^1 quelques rondelles de concombre$/i.test(line)) return "1 concombre (à couper en rondelles)";
  if (/^1 gousse d['’]tilles corail/i.test(line)) return "150 g de lentilles corail";
  if (!line || /^(sel|poivre|sel et poivre|poivre et sel|herbes fraîches|herbes fraiches|herbes de provence|épices|epices|paprika|cumin|curry|origan|basilic|persil|coriandre|menthe|ciboulette|thym|laurier|aneth|romarin|piment|muscade|cannelle)(\b|$)/i.test(line)) return line;
  if (/^\d/.test(line)) return line;
  const ingredient = line.replace(/^(un peu de |un filet de |quelques copeaux de |quelques rondelles de |quelques |un peu d['’]|un trait de |un soupçon de |un soupcon de |à volonté:? ?|a volonte:? ?)/i, "").trim();
  const text = normalizedSeasonText(ingredient);
  let prefix: string;
  if (/ail/.test(text)) prefix = "1 gousse d’";
  else if (/huile|vinaigre|sauce soja|tamari|sirop|moutarde|pesto|mayonnaise|levure malt|puree d amande|beurre de cacahuete/.test(text)) prefix = "1 c. à soupe de ";
  else if (/creme|lait|bouillon|passata|coulis|tomates concassees|yaourt|skyr|fromage blanc/.test(text)) prefix = "150 ml de ";
  else if (/oeuf/.test(text)) prefix = "4 ";
  else if (/poulet|dinde|boeuf|viande|saumon|cabillaud|poisson|thon|tofu|crevette|colin|porc|agneau|steak|maquereau|jambon|saucisse/.test(text)) prefix = "400 g de ";
  else if (/pates|riz|quinoa|lentille|pois chiche|haricot|semoule|couscous|nouilles|flocons d avoine/.test(text)) prefix = "300 g de ";
  else if (/pain|wrap|tortilla|galette/.test(text)) prefix = "4 ";
  else if (/citron/.test(text)) prefix = "1 ";
  else if (/tomate|carotte|courgette|poivron|concombre|pomme de terre|patate|oignon|echalote|aubergine|pomme|poire|avocat|banane|mangue|courge|poireau|champignon|brocoli|chou|salade|epinard|radis|navet|betterave|melon|figue|fraise|pamplemousse/.test(text)) {
    prefix = /concombre|courgette|aubergine|salade|avocat|mangue|courge|brocoli|chou|poireau|betterave|melon|pamplemousse/.test(text) ? "1 " : "2 ";
  } else if (/farine|sucre|cacao|chapelure|amande|noix|noisette|graines|levure chimique|parmesan|fromage|mozzarella|feta/.test(text)) prefix = "100 g de ";
  else prefix = "1 ";
  return prefix + ingredient;
}

function inferIngredients(recipe: Partial<Recipe>): string[] {
  const title = normalizedSeasonText(recipe.name || "");
  if (/lasagne/.test(title)) return ["400 g de poulet", "300 g de feuilles de lasagnes", "2 courgettes", "400 g de tomates concassées", "100 g de fromage râpé"];
  if (/omelette|frittata/.test(title)) return ["6 œufs", "2 courgettes", "200 g de tomates", "1 c. à soupe d’huile d’olive"];
  if (/tzatziki/.test(title)) return ["400 g de skyr", "1 concombre", "1 gousse d’ail", "1 citron", "10 feuilles de menthe"];
  if (/soupe|veloute|potage/.test(title)) return ["3 carottes", "2 poireaux", "600 g de pommes de terre", "1 oignon", "1 l de bouillon"];
  if (/salade/.test(title)) return ["1 salade verte", "2 tomates", "1 concombre", "1 c. à soupe d’huile d’olive"];
  if (/wrap/.test(title)) return ["4 wraps", "400 g de garniture protéinée", "200 g de salade", "2 tomates"];
  if (/pates|pasta|risotto|riz/.test(title)) return ["300 g de pâtes ou riz", "400 g de légumes", "1 oignon", "1 c. à soupe d’huile d’olive"];
  if (/dessert|gateau|cake|crepe|pancake|gaufre|crumble|fondant|mousse|tarte sucre/.test(title)) return ["2 œufs", "100 g de farine", "50 g de sucre", "100 g de fruit ou chocolat adapté au titre"];
  const protein = title.match(/poulet|dinde|boeuf|saumon|cabillaud|poisson|thon|tofu|crevette|colin|porc|agneau|maquereau|lentilles|pois chiches/);
  return ["400 g de " + (protein ? protein[0] : "légumes de saison"), "300 g de légumes de saison", "200 g de féculent adapté", "1 c. à soupe d’huile d’olive", "Sel et poivre"];
}

function normalizeRecipeForPlanning(recipe: Recipe): Recipe {
  const notes = [...(recipe.notes || [])];
  let ingredients = (recipe.ingredients || []).map((line) => String(line || "").trim()).filter(Boolean);
  const noteLines = ingredients.filter((line) => /^(➡|🍱|💡|🤖|option |astuce|batch cooking|utilisation|organisation)/i.test(line));
  if (noteLines.length) notes.push(...noteLines);
  ingredients = ingredients.filter((line) => !/^(➡|🍱|💡|🤖|option |astuce|batch cooking|utilisation|organisation)/i.test(line));
  if (!ingredients.length) ingredients = inferIngredients(recipe);
  ingredients = ingredients.map(normalizeIngredientQuantity);
  if (ingredients.length < 3) {
    const extras = /dessert|gateau|cake|crepe|pancake|gaufre|crumble|fondant|mousse|compote|tarte sucre/i.test(recipe.name)
      ? ["2 œufs", "100 g de farine", "50 g de sucre"]
      : ["1 c. à soupe d’huile d’olive", "1 pincée de sel", "1 pincée de poivre"];
    for (const extra of extras) if (ingredients.length < 3 && !ingredients.some((line) => normalizedSeasonText(line) === normalizedSeasonText(extra))) ingredients.push(extra);
  }

  const rawSteps = (recipe.steps || []).map((step) => String(step || "").trim()).filter((step) => step && !/^(a completer|etapes? a definir|mode d'emploi a ajouter)/i.test(normalizedSeasonText(step)) && !/^(🍱|➡|💡|🤖|une version|très léger|tres leger)/i.test(step));
  let steps: string[];
  if (rawSteps.length >= 3) {
    steps = rawSteps.map((step, index) => (index + 1) + ". " + step.replace(/^\d+[.)]\s*/, ""));
  } else {
    const title = normalizedSeasonText(recipe.name);
    const prep = "Préparer les ingrédients : laver, éplucher et couper les légumes si nécessaire, puis peser les quantités.";
    const cook = /salade|wrap|tartine|sandwich|smoothie|gaspacho|carpaccio|verrine|tartare|crudite|yaourt|overnight/.test(title)
      ? "Assembler les ingrédients dans un saladier, un bol ou sur les supports prévus, puis mélanger délicatement."
      : /soupe|veloute|potage|bouillon/.test(title)
        ? "Faire cuire les ingrédients dans le bouillon pendant 20 à 25 minutes, jusqu’à ce qu’ils soient tendres, puis mixer si nécessaire."
        : /pates|pasta|riz|quinoa|nouilles/.test(title)
          ? "Cuire le féculent dans l’eau ou le bouillon selon les indications du paquet, puis l’associer aux autres ingrédients."
          : /gateau|cake|tarte|quiche|gratin|lasagne|hachis|parmentier/.test(title)
            ? "Assembler les ingrédients dans un plat adapté et cuire au four préchauffé à 180 °C jusqu’à cuisson à cœur."
            : "Faire cuire les ingrédients principaux dans une poêle ou une casserole chaude jusqu’à ce qu’ils soient bien cuits.";
    const finish = "Goûter, rectifier l’assaisonnement si nécessaire, puis servir chaud ou froid selon la recette.";
    steps = [prep, ...rawSteps, cook, finish].slice(0, Math.max(3, rawSteps.length + 2)).map((step, index) => (index + 1) + ". " + step.replace(/^\d+[.)]\s*/, ""));
  }

  const timePrep = normalizedRecipeTime(recipe.timePrep, defaultPrepTime({ ...recipe, ingredients }));
  const timeCook = normalizedRecipeTime(recipe.timeCook, defaultCookTime({ ...recipe, ingredients }));
  const servings = recipe.servings && /\d/.test(recipe.servings) ? recipe.servings : "4 personnes";
  const sections = [...(recipe.sections || [])].map((section) => {
    if (/ingrédients|ingredients|🛒/i.test(section.title || "")) return { ...section, lines: ingredients };
    if (/préparation|preparation|👩‍🍳/i.test(section.title || "")) return { ...section, lines: steps };
    if (/temps|durée|duree|⏱️/i.test(section.title || "")) return { ...section, lines: ["⏱️ Préparation : " + timePrep, "🔥 Cuisson : " + timeCook, "👥 Pour " + servings] };
    return section;
  });
  if (!sections.some((section) => /ingrédients|ingredients|🛒/i.test(section.title || ""))) sections.push({ title: "🛒 Ingrédients", lines: ingredients });
  if (!sections.some((section) => /préparation|preparation|👩‍🍳/i.test(section.title || ""))) sections.push({ title: "👩‍🍳 Préparation", lines: steps });
  if (!sections.some((section) => /temps|durée|duree|⏱️/i.test(section.title || ""))) sections.unshift({ title: "⏱️ Temps et portions", lines: ["⏱️ Préparation : " + timePrep, "🔥 Cuisson : " + timeCook, "👥 Pour " + servings] });
  return { ...recipe, ingredients, steps, timePrep, timeCook, servings, notes, sections };
}

export const carnet = { ...data, recipes: [...data.recipes, ...trendRecipes].map(normalizeRecipeForPlanning) } as Carnet;

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

const recipesById = new Map(carnet.recipes.map((r) => [r.id, r]));

export function getRecipe(id: string | null | undefined): Recipe | undefined {
  if (!id) return undefined;
  return recipesById.get(id);
}

export type Season = "hiver" | "printemps" | "ete" | "automne";

export function seasonForWeek(week: number): Season {
  // Repères hebdomadaires adaptés au calendrier des saisons en France métropolitaine.
  if (week <= 11 || week >= 50) return "hiver";
  if (week <= 24) return "printemps";
  if (week <= 37) return "ete";
  return "automne";
}

export function seasonLabel(week: number): string {
  const labels: Record<Season, string> = {
    hiver: "Hiver",
    printemps: "Printemps",
    ete: "Été",
    automne: "Automne",
  };
  return labels[seasonForWeek(week)];
}

const SEASON_TERMS: Record<Season, string[]> = {
  hiver: ["hiver", "hivernal", "soupe", "veloute", "potage", "poireau", "chou", "courge", "pomme de terre", "gratin", "mijote", "lentille", "endive", "carotte"],
  printemps: ["printemps", "asperge", "radis", "petit pois", "epinard", "fraise", "artichaut", "navet", "blette", "courgette", "citron", "herbes fraiches"],
  ete: ["ete", "estival", "tomate", "courgette", "aubergine", "poivron", "concombre", "melon", "peche", "abricot", "fraise", "salade", "barbecue", "grille"],
  automne: ["automne", "potimarron", "courge", "champignon", "chataigne", "pomme", "poire", "raisin", "patate douce", "carotte", "poireau", "lentille", "mijote"],
};

function isMealRecipe(recipe: Recipe): boolean {
  return !/^(sauce|marinade|vinaigrette|pesto|coulis|mélange d'épices|melange d'epices|épices|epices|granola|confiture|compote|sirop|boisson|cocktail|tartinade|dip\b|crackers|gressins|biscuits apéritifs)/i.test(recipe.name.trim());
}

function durationMinutes(value?: string): number | null {
  if (!value) return null;
  const match = value.match(/(\d+)\s*(?:h|heure)/i);
  const hours = match ? Number(match[1]) : 0;
  const mins = value.match(/(\d+)\s*(?:min|minute)/i);
  if (!match && !mins) {
    const numeric = value.match(/\d+/);
    return numeric ? Number(numeric[0]) : null;
  }
  return hours * 60 + (mins ? Number(mins[1]) : 0);
}

/** Sélectionne une recette complète, distincte des autres repas de la semaine et marquée par des indices de saison. */
export function seasonalReplacement(
  week: number,
  currentRecipeId: string | null,
  excludedIds: ReadonlySet<string> = new Set<string>(),
  preferences: PlanningPreferences = {},
): Recipe | undefined {
  const season = seasonForWeek(week);
  const current = getRecipe(currentRecipeId);
  const currentDuration = current
    ? [durationMinutes(current.timePrep), durationMinutes(current.timeCook)].reduce<number>((sum, n) => sum + (n || 0), 0)
    : 0;
  return carnet.recipes
    .filter((recipe) =>
      recipe.id !== currentRecipeId &&
      !excludedIds.has(recipe.id) &&
      isValidatedRecipe(recipe) &&
      eligibleForPreferences(recipe, preferences) &&
      isMealRecipe(recipe) &&
      seasonalScore(recipe, season) > 0
    )
    .map((recipe) => {
      const score = seasonalScore(recipe, season);
      const duration = [durationMinutes(recipe.timePrep), durationMinutes(recipe.timeCook)].reduce<number>((sum, n) => sum + (n || 0), 0);
      const durationDifference = currentDuration && duration ? Math.abs(currentDuration - duration) : 0;
      return { recipe, score, durationDifference };
    })
    .sort((a, b) =>
      b.score - a.score ||
      a.durationDifference - b.durationDifference ||
      a.recipe.name.localeCompare(b.recipe.name, "fr")
    )[0]?.recipe;
}

function normalizedSeasonText(value: string): string {
  return value.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isCompleteRecipe(recipe: Recipe): boolean {
  const ingredients = (recipe.ingredients || []).filter((line) => line.trim() && !isPlaceholderIngredient(line));
  const steps = (recipe.steps || []).filter((line) => line.trim() && !/^(a completer|etapes a definir|mode d'emploi a ajouter)/i.test(line));
  return ingredients.length >= 2 && steps.length >= 2;
}

const SEASONING_ONLY = /^(sel|poivre|épices?|epices?|herbes|aromates|persil|coriandre|basilic|ciboulette|menthe|thym|laurier|paprika|cumin|curry|muscade|cannelle|piment|origan|aneth|romarin|herbes de provence)(\b|\s|,)/i;
const QUANTIFIED_INGREDIENT = /^\s*\d+(?:[.,]\d+)?(?:\s*\/\s*\d+(?:[.,]\d+)?)?\s*(?:(?:kg|g|grammes?|mg|l|litres?|ml|cl|c\.?\s*à\s*(?:soupe|café)|càs|cac|cs|cc|cuillères?|pincées?|tranches?|gousses?|filets?|doses?|boîtes?|boites?|pots?|paquets?|branches?|feuilles?|poignées?|poignees?|tasses?|verres?)\s+)?[\p{L}]/iu;

/** Gate de sécurité du planning : quantités chiffrées, temps explicites, portions numériques et étapes réelles. */
export function isValidatedRecipe(recipe: Recipe): boolean {
  // La validation se fait sur la fiche source AVANT toute normalisation automatique.
  // Une quantité, un temps ou une étape ajoutés par défaut ne peuvent donc pas rendre une fiche admissible.
  if (!rawValidatedRecipeIds.has(recipe.id)) return false;
  if (!isCompleteRecipe(recipe) || isSauceOrSideRecipe(recipe.name)) return false;
  const prep = durationMinutes(recipe.timePrep);
  const cook = durationMinutes(recipe.timeCook);
  if (prep === null || cook === null || prep < 0 || cook < 0) return false;
  if (!recipe.servings || !/\b\d+\b/.test(recipe.servings) || /\d+\s*(?:-|–|à|a)\s*\d+/.test(recipe.servings)) return false;
  const ingredients = (recipe.ingredients || []).filter((line) => line.trim() && !isPlaceholderIngredient(line));
  if (ingredients.length < 3 || ingredients.length > 30) return false;
  if (ingredients.some((line) => /un de ses grands points forts|cuisson automatique|mixage parfait|texture plus légère|base parfaite|^1 hacher$|^1 finir$/i.test(line.trim()))) return false;
  if (ingredients.some((line) => !QUANTIFIED_INGREDIENT.test(line) && !SEASONING_ONLY.test(line.trim()))) return false;
  const steps = (recipe.steps || []).filter((line) => line.trim() && !/^(a completer|etapes a definir|mode d'emploi a ajouter)/i.test(line));
  return steps.length >= 3 && steps.every((step) => !/^(à compléter|etape à definir|étape à définir|mode d'emploi à ajouter)/i.test(step.trim()));
}

function isSauceOrSideRecipe(name: string): boolean {
  const clean = name.trim().replace(/^[^\p{L}\p{N}]*/u, "").replace(/^RECETTE\s+\d+\s*[—–-]\s*/i, "").trim();
  return /^(sauce|marinade|vinaigrette|pesto|coulis|mélange d'épices|melange d'epices|épices|epices|granola|confiture|compote|sirop|boisson|cocktail|tartinade|dip\b|crackers|gressins|biscuits apéritifs)/i.test(clean);
}

const VAGUE_RECIPE_STEP = /ajoutez les ingrédients restants|mélangez délicatement pendant 30 secondes|vérifiez l’assaisonnement|goûtez et rectifiez|préparer les ingrédients\s*:?\s*laver,?\s*éplucher et couper les légumes si nécessaire|préparer les légumes et la sauce|assembler les ingrédients dans un saladier|faire cuire les ingrédients principaux|cuire les ingrédients dans l’eau ou le bouillon selon les indications|faire cuire les ingrédients dans une poêle ou une casserole chaude|rectifier l’assaisonnement si nécessaire|jusqu’à cuisson à cœur|selon disponibilité|selon votre goût|préparer les courgettes\b|préparer les légumes\b|ingrédients à prévoir|étapes à définir|à compléter/i;

function isRawValidatedRecipe(recipe: Recipe): boolean {
  const explicitTime = (value: unknown) => {
    const text = String(value ?? "").trim();
    return /\d+\s*(?:min(?:ute)?s?|h(?:eure)?s?)/i.test(text) &&
      !/\d+\s*(?:-|–|à|a)\s*\d+\s*(?:min(?:ute)?s?)/i.test(text) &&
      durationMinutes(text) !== null;
  };
  if (!recipe.id || !recipe.name || isSauceOrSideRecipe(recipe.name)) return false;
  if (!explicitTime(recipe.timePrep) || !explicitTime(recipe.timeCook)) return false;
  if (!recipe.servings || !/\b\d+\b/.test(recipe.servings)) return false;
  const ingredients = (recipe.ingredients || []).map((line) => String(line || "").trim()).filter(Boolean);
  if (ingredients.length < 3 || ingredients.length > 30) return false;
  if (ingredients.some((line) =>
    /^ingr[ée]dients à prévoir/i.test(line) ||
    /^(➡️|❌|💡|✔|✅|OU|Mélanger|Servir|Ingrédients|Remplacement|Variantes?|Épices|Recherche)/i.test(line) ||
    (line.startsWith("(") && line.endsWith(")")) ||
    /un de ses grands points forts|cuisson automatique|mixage parfait|texture plus légère|base parfaite|à compléter|a completer/i.test(line) ||
    (!QUANTIFIED_INGREDIENT.test(line) && !SEASONING_ONLY.test(line)))) return false;
  const steps = (recipe.steps || []).map((step) => String(step || "").trim()).filter(Boolean);
  if (steps.length < 3) return false;
  if (steps.some((step) =>
    step.length < 8 ||
    !/^\d+[.)]\s+/.test(step) ||
    /^(à compléter|a completer|etape à definir|étape à définir|mode d'emploi à ajouter|etapes a definir)/i.test(step) ||
    VAGUE_RECIPE_STEP.test(step)
  )) return false;
  return true;
}

const rawValidatedRecipeIds = new Set<string>(
  [...data.recipes, ...trendRecipes].filter(isRawValidatedRecipe).map((recipe) => recipe.id)
);

export type PlanningPreferences = {
  etudiant?: boolean; vegetarien?: boolean; vegan?: boolean; halal?: boolean;
  sansGluten?: boolean; sansLactose?: boolean; sansFruitsCoque?: boolean;
};

function eligibleForPreferences(recipe: Recipe, preferences: PlanningPreferences): boolean {
  const ingredients = (recipe.ingredients || []).map((line) => normalizedSeasonText(line));
  const text = normalizedSeasonText([recipe.name, ...ingredients].join(" "));
  const regime = normalizedSeasonText(recipe.regime || "");
  if (preferences.vegan && regime !== "vegan") return false;
  if (preferences.vegetarien && regime !== "vegetarien" && regime !== "vegan") return false;
  if (preferences.halal) {
    const halalTagged = regime === "halal" || (recipe as Recipe & { halal?: boolean }).halal === true;
    const plantBasedTagged = regime === "vegan" || regime === "vegetarien";
    const forbidden = /\bporc\b|\bjambon\b|\blardons?\b|\bbacon\b|\bpancetta\b|\bchorizo\b|\bvin\b|\brhum\b|\bkirsch\b|\balcool\b|\bgélatine animale\b|\ngelatine animale\b/.test(text);
    const unverifiedMeat = /\bpoulet\b|\bdinde\b|\bboeuf\b|\bveau\b|\bagneau\b|\bporc\b|\bcanard\b|\bjambon\b|\blardons?\b|\bsaucisse\b|\bmerguez\b|\bsteak\b|\bviande\b/.test(text);
    if (!halalTagged && !plantBasedTagged && (forbidden || unverifiedMeat)) return false;
  }
  if (preferences.sansGluten && /farine de ble|pain|wrap|tortilla|pates|nouilles de ble|couscous|semoule de ble|chapelure|seitan|orge|seigle|boulgour|sauce soja(?![^,;]*sans gluten)/.test(text)) return false;
  if (preferences.sansLactose && ingredients.some((line) =>
    /lait|creme fraiche|beurre|fromage|parmesan|mozzarella|feta|skyr|yaourt|lactose/.test(line) &&
    !/lait d amande|lait de soja|lait de coco|creme de soja|fromage vegan|yaourt vegetal|yaourt de soja|margarine vegetale/.test(line)
  )) return false;
  if (preferences.sansFruitsCoque && /amande|noix|noisette|cacahuete|pistache|cajou|pecan/.test(text)) return false;
  if (preferences.etudiant && /homard|saint jacques|foie gras|truffe|caviar|safran|wagyu|langouste/.test(text)) return false;
  return true;
}

function seasonalScore(recipe: Recipe, season: Season): number {
  if (!isCompleteRecipe(recipe)) return 0;
  const text = normalizedSeasonText([
    recipe.name,
    ...(recipe.ingredients || []),
    ...(recipe.sections || []).flatMap((section) => [section.title, ...section.lines]),
  ].join(" "));
  return SEASON_TERMS[season].reduce((score, term) => score + (text.includes(normalizedSeasonText(term)) ? 1 : 0), 0);
}

export function weekPlan(week: number, overrides: Record<string, string> = {}, preferences: PlanningPreferences = {}): PlanSlot[] {
  const slots = carnet.plan.filter((p) => p.week === week).map((slot) => {
    const id = overrides[`${slot.week}|${slot.day}|${slot.meal}`];
    const recipe = id ? recipesById.get(id) : undefined;
    return recipe ? { ...slot, recipeId: recipe.id, name: recipe.name } : slot;
  });
  const season = seasonForWeek(week);
  const used = new Set<string>();
  const eligible = carnet.recipes.filter((recipe) => isValidatedRecipe(recipe) && eligibleForPreferences(recipe, preferences));
  const plantProfile = Boolean(preferences.vegan || preferences.vegetarien);
  const roleText = (recipe: Recipe) => normalizedSeasonText(recipe.name);
  const chooseRole = (pattern: RegExp, exclude: Set<string> = new Set<string>(), quick = false) => {
    const candidates = eligible.filter((recipe) => {
      if (exclude.has(recipe.id) || !pattern.test(roleText(recipe))) return false;
      if (!quick) return true;
      const total = (durationMinutes(recipe.timePrep) || 0) + (durationMinutes(recipe.timeCook) || 0);
      return total <= 20;
    }).sort((a, b) => seasonalScore(b, season) - seasonalScore(a, season) || a.name.localeCompare(b.name, "fr"));
    if (!candidates.length) return undefined;
    const bestScore = seasonalScore(candidates[0], season);
    const bestPool = candidates.filter((recipe) => seasonalScore(recipe, season) === bestScore);
    return bestPool[(Math.max(1, week) - 1) % bestPool.length];
  };
  const reserved = new Set<string>();
  const overrideRecipe = (day: string, meal: string, pattern?: RegExp, quick = false) => {
    const id = overrides[week + "|" + day + "|" + meal];
    const recipe = id ? recipesById.get(id) : undefined;
    if (!recipe || !isValidatedRecipe(recipe) || !eligibleForPreferences(recipe, preferences) || reserved.has(recipe.id)) return undefined;
    if (pattern && !pattern.test(roleText(recipe))) return undefined;
    if (quick && (durationMinutes(recipe.timePrep) ?? Infinity) + (durationMinutes(recipe.timeCook) ?? Infinity) > 20) return undefined;
    return recipe;
  };
  const plantPattern = /tofu|pois chiches|lentilles|haricots|edamame|vegan|vegetarien|omelette|falafel|legumes|salade|quiche|frittata/;
  const fishPattern = /poisson|saumon|cabillaud|thon|maquereau|crevette|sardine|colin|lieu/;
  const meatPattern = /poulet|dinde|boeuf|veau|porc|agneau|viande|steak|saucisse|jambon/;
  const mondayPattern = plantProfile ? plantPattern : fishPattern;
  const monday = overrideRecipe("LUNDI", "Soir", mondayPattern, true) || chooseRole(mondayPattern, reserved, true);
  if (monday) reserved.add(monday.id);

  const pivotPattern = plantProfile ? plantPattern : preferences.halal
    ? /poisson|saumon|cabillaud|thon|maquereau|colin|lieu|tofu|pois chiches|lentilles|haricots|edamame/
    : meatPattern;
  const pivot = overrideRecipe("MARDI", "Soir", pivotPattern) ||
    overrideRecipe("MERCREDI", "Midi", pivotPattern) ||
    overrideRecipe("JEUDI", "Soir", pivotPattern) ||
    chooseRole(pivotPattern, reserved);
  if (pivot) reserved.add(pivot.id);

  const soupPattern = /soupe|veloute|potage|bouillon/;
  const seasonalBase = overrideRecipe("MERCREDI", "Soir", soupPattern) || chooseRole(soupPattern, reserved);
  if (seasonalBase) reserved.add(seasonalBase.id);

  const pantryPattern = /vide.?frigo|restes|anti.?gaspi|fond de placard/;
  const pantry = overrideRecipe("VENDREDI", "Midi", pantryPattern) || chooseRole(pantryPattern, reserved)
    || chooseRole(/salade|omelette|wrap|poelee|quiche|tarte|frittata|gratin/, reserved)
    || chooseRole(/./, reserved);
  if (pantry) reserved.add(pantry.id);

  const pleasurePool = eligible
    .filter((recipe) => !reserved.has(recipe.id) && !/soupe|veloute|potage|bouillon/.test(roleText(recipe)))
    .sort((a, b) => seasonalScore(b, season) - seasonalScore(a, season) || a.name.localeCompare(b.name, "fr"));
  const topScore = pleasurePool.length ? seasonalScore(pleasurePool[0], season) : -1;
  const topPool = pleasurePool.filter((recipe) => seasonalScore(recipe, season) === topScore);
  const start = topPool.length ? (Math.max(1, week) - 1) % topPool.length : 0;
  const weekendPool = [
    ...topPool.slice(start), ...topPool.slice(0, start),
    ...pleasurePool.filter((recipe) => seasonalScore(recipe, season) !== topScore),
  ];
  const weekendKeys: [string, string][] = [["SAMEDI", "Midi"], ["SAMEDI", "Soir"], ["DIMANCHE", "Midi"], ["DIMANCHE", "Soir"]];
  const weekendPleasures: (Recipe | undefined)[] = [];
  for (const [day, meal] of weekendKeys) {
    const override = overrideRecipe(day, meal);
    const selected = override || weekendPool.find((recipe) =>
      !reserved.has(recipe.id) && !weekendPleasures.some((item) => item?.id === recipe.id)
    );
    weekendPleasures.push(selected);
    if (selected) reserved.add(selected.id);
  }

  const matrix = new Map<string, { recipe: Recipe | null; name: string }>();
  const setRole = (day: string, meal: string, recipe: Recipe | undefined, fallback: string, name?: string) =>
    matrix.set(`${day}|${meal}`, { recipe: recipe || null, name: name || recipe?.name || fallback });
  setRole("LUNDI", "Soir", monday, "Aucun repas express validé pour ce thème");
  setRole("MARDI", "Soir", pivot, "Aucun pivot protéiné complet validé");
  setRole("MERCREDI", "Midi", pivot, "Aucune portion pivot validée");
  setRole("MERCREDI", "Soir", seasonalBase, "Aucun plat de saison complet validé");
  setRole("JEUDI", "Soir", pivot, "Seconde vie du pivot indisponible", pivot ? `Seconde vie — ${pivot.name}` : undefined);
  setRole("VENDREDI", "Midi", pantry, "Aucune recette Vide-Frigo complète validée", pantry ? "Vide-frigo — " + pantry.name : undefined);
  setRole("SAMEDI", "Midi", weekendPleasures[0], "Aucun repas plaisir validé");
  setRole("SAMEDI", "Soir", weekendPleasures[1], "Aucun repas plaisir validé");
  setRole("DIMANCHE", "Midi", weekendPleasures[2], "Aucun repas plaisir validé");
  setRole("DIMANCHE", "Soir", weekendPleasures[3], "Aucun repas plaisir validé");

  return slots.map((slot) => {
    const matrixSelection = matrix.get(`${slot.day}|${slot.meal}`);
    if (matrixSelection) {
      if (!matrixSelection.recipe) return { ...slot, name: matrixSelection.name, recipeId: null };
      used.add(matrixSelection.recipe.id);
      return { ...slot, name: matrixSelection.name, recipeId: matrixSelection.recipe.id };
    }
    const current = slot.recipeId ? recipesById.get(slot.recipeId) : undefined;
    const currentValid = current ? isValidatedRecipe(current) && eligibleForPreferences(current, preferences) && !reserved.has(current.id) : false;
    const currentScore = current ? seasonalScore(current, season) : 0;
    if (current && currentValid && currentScore > 0 && !used.has(current.id)) {
      used.add(current.id);
      return { ...slot, name: current.name };
    }
    const alternatives = eligible
      .filter((recipe) => !used.has(recipe.id) && !reserved.has(recipe.id) && recipe.id !== current?.id)
      .map((recipe) => ({ recipe, score: seasonalScore(recipe, season) }))
      .sort((a, b) => b.score - a.score || a.recipe.name.localeCompare(b.recipe.name, "fr"));
    const replacement = alternatives.find((item) => item.score > 0)?.recipe || alternatives[0]?.recipe;
    if (!replacement) return { ...slot, name: "Aucune recette complète validée pour ces critères", recipeId: null };
    used.add(replacement.id);
    return { ...slot, name: replacement.name, recipeId: replacement.id };
  });
}
export function breakfastForWeek(week: number): Breakfast | undefined {
  return (carnet.breakfasts || []).find((item) => item.week === week);
}

export function getCollections(): Collection[] {
  return carnet.collections || [];
}

export function getCollection(slug: string): Collection | undefined {
  return getCollections().find((item) => item.slug === slug);
}

export function recipesForCollection(slug: string): Recipe[] {
  const col = getCollection(slug);
  if (!col) return [];
  return col.recipeIds.map((id) => recipesById.get(id)).filter((r): r is Recipe => !!r);
}

export function currentIsoWeek(): number {
  const date = new Date();
  const thursday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = thursday.getUTCDay() || 7;
  thursday.setUTCDate(thursday.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  return Math.min(52, Math.max(1, Math.ceil((((thursday.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)));
}

export function clampWeek(raw: string | undefined | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(52, Math.max(1, Math.round(n)));
}

const PLACEHOLDER = /^ingr[ée]dients à prévoir/i;

export function isPlaceholderIngredient(line: string): boolean {
  const t = line.trim();
  if (PLACEHOLDER.test(t)) return true;
  if (/^(➡️|❌|💡|✔|✅|OU|Mélanger|Servir|Ingrédients|Remplacement|Variantes?|Épices|Recherche)/i.test(t)) return true;
  if (t.startsWith("(") && t.endsWith(")")) return true;
  return false;
}

export type ShoppingItem = {
  label: string;
  recipes: string[];
  aisle: string;
};

export function batchForWeek(
  week: number,
  overrides: Record<string, string> = {},
  preferences: PlanningPreferences = {},
): { id: string; title: string; detail?: string; group?: string }[] {
  const plan = weekPlan(week, overrides, preferences);
  const pivotSlot = plan.find((slot) => slot.day === "MARDI" && slot.meal === "Soir");
  const seasonSlot = plan.find((slot) => slot.day === "MERCREDI" && slot.meal === "Soir");
  const pivot = getRecipe(pivotSlot?.recipeId);
  const seasonBase = getRecipe(seasonSlot?.recipeId);
  const starch = (pivot?.ingredients || []).find((line) =>
    /riz|pates|pâtes|nouilles|semoule|couscous|quinoa|boulgour|polenta|orge|pomme de terre|patate douce|feculent|féculent/i.test(line)
  );
  const soup = seasonBase && /soupe|veloute|potage|bouillon/i.test(seasonBase.name) ? seasonBase : undefined;
  return [
    { id: week + "-pivot", title: "Protéine pivot — " + (pivot?.name || "aucune recette pivot validée"), detail: "Doubler les quantités de la fiche pour préparer deux repas : mardi soir et mercredi midi (8 portions si le foyer compte 4 personnes).", group: "Protéine pivot" },
    { id: week + "-starch", title: "Féculent — " + (starch || "aucun féculent quantifié identifié dans la fiche pivot"), detail: "Préparer uniquement le féculent réellement prévu dans la fiche du pivot.", group: "Féculent" },
    { id: week + "-soup", title: "Soupe de saison — " + (soup?.name || "aucune soupe complète validée"), detail: "Préparer la soupe du mercredi soir uniquement si une fiche complète et validée est disponible.", group: "Soupe de saison" },
  ];
}

export { shoppingForWeek } from "./shopping";
