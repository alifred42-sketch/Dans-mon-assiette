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
  line = line.replace(/^(\d+(?:[.,]\d+)?)\s+[\p{Extended_Pictographic}\uFE0F]+\s*/u, "$1 ");
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
  else prefix = "1 portion de ";
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
  const flexibleLines = [
    "☀️ Option Midi copieux : ajoutez un féculent de secours selon votre faim.",
    "🌙 Option Soir copieux : ajustez les portions de légumes et de protéines selon votre faim.",
  ];
  for (const note of flexibleLines) if (!notes.some((existing) => existing.startsWith(note.slice(0, 20)))) notes.push(note);

  const sections = [...(recipe.sections || [])].map((section) => {
    if (/ingrédients|ingredients|🛒/i.test(section.title || "")) return { ...section, lines: ingredients };
    if (/préparation|preparation|👩‍🍳/i.test(section.title || "")) return { ...section, lines: steps };
    if (/temps|durée|duree|⏱️/i.test(section.title || "")) return { ...section, lines: ["⏱️ Préparation : " + timePrep, "🔥 Cuisson : " + timeCook, "👥 Pour " + servings] };
    if (/portions flexibles/i.test(section.title || "")) return { ...section, lines: flexibleLines };
    return section;
  });
  if (!sections.some((section) => /ingrédients|ingredients|🛒/i.test(section.title || ""))) sections.push({ title: "🛒 Ingrédients", lines: ingredients });
  if (!sections.some((section) => /préparation|preparation|👩‍🍳/i.test(section.title || ""))) sections.push({ title: "👩‍🍳 Préparation", lines: steps });
  if (!sections.some((section) => /temps|durée|duree|⏱️/i.test(section.title || ""))) sections.unshift({ title: "⏱️ Temps et portions", lines: ["⏱️ Préparation : " + timePrep, "🔥 Cuisson : " + timeCook, "👥 Pour " + servings] });
  if (!sections.some((section) => /portions flexibles/i.test(section.title || ""))) sections.push({ title: "🍽️ Portions flexibles", lines: flexibleLines });
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
  if (!isCompleteRecipe(recipe) || isSauceOrSideRecipe(recipe.name)) return false;
  const prep = durationMinutes(recipe.timePrep);
  const cook = durationMinutes(recipe.timeCook);
  if (prep === null || cook === null || prep < 0 || cook < 0) return false;
  if (!recipe.servings || !/\b\d+\b/.test(recipe.servings)) return false;
  const ingredients = (recipe.ingredients || []).filter((line) => line.trim() && !isPlaceholderIngredient(line));
  if (ingredients.length < 3 || ingredients.some((line) => !QUANTIFIED_INGREDIENT.test(line) && !SEASONING_ONLY.test(line.trim()))) return false;
  const steps = (recipe.steps || []).filter((line) => line.trim() && !/^(a completer|etapes a definir|mode d'emploi a ajouter)/i.test(line));
  return steps.length >= 3 && steps.every((step) => !/^(à compléter|etape à definir|étape à définir|mode d'emploi à ajouter)/i.test(step.trim()));
}

function isSauceOrSideRecipe(name: string): boolean {
  return /^(sauce|marinade|vinaigrette|pesto|coulis|mélange d'épices|melange d'epices|épices|epices|granola|confiture|compote|sirop|boisson|cocktail|tartinade|dip\b|crackers|gressins|biscuits apéritifs)/i.test(name.trim());
}

export type PlanningPreferences = {
  etudiant?: boolean; vegetarien?: boolean; vegan?: boolean;
  sansGluten?: boolean; sansLactose?: boolean; sansFruitsCoque?: boolean;
};

function profileAllows(recipe: Recipe, prefs: PlanningPreferences): boolean {
  const text = normalizedSeasonText([recipe.name, ...(recipe.ingredients || []), ...(recipe.steps || [])].join(" "));
  const regime = normalizedSeasonText(recipe.regime || "");
  const tags = normalizedSeasonText(recipe.sous_regime || "");
  if (prefs.vegan && regime !== "vegan") return false;
  if (prefs.vegetarien && !["vegan", "vegetarien", "vegetarian"].includes(regime)) return false;
  if (prefs.etudiant && !/etudiant|petit.?budget|economique|budget/.test(tags + " " + text)) return false;
  if (prefs.sansGluten && /(farine de ble|pain|pates|semoule|couscous|tortilla|wrap|chapelure|seitan|sauce soja(?! sans gluten))/.test(text)) return false;
  if (prefs.sansLactose && /(lait|creme|beurre|fromage|yaourt|skyr|ricotta|mozzarella|parmesan|feta)/.test(text)) return false;
  if (prefs.sansFruitsCoque && /(amande|noisette|noix|pistache|noix de cajou|pignon|cacahuete)/.test(text)) return false;
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
  const eligible = carnet.recipes.filter((recipe) => isValidatedRecipe(recipe) && profileAllows(recipe, preferences));
  const plantProfile = Boolean(preferences.vegan || preferences.vegetarien);
  const roleText = (recipe: Recipe) => normalizedSeasonText([recipe.name, ...(recipe.ingredients || [])].join(" "));
  const chooseRole = (pattern: RegExp, exclude: Set<string> = new Set<string>(), quick = false) =>
    eligible.filter((recipe) => {
      if (exclude.has(recipe.id) || !pattern.test(roleText(recipe))) return false;
      if (!quick) return true;
      const total = (durationMinutes(recipe.timePrep) || 0) + (durationMinutes(recipe.timeCook) || 0);
      return total <= 20;
    }).sort((a, b) => seasonalScore(b, season) - seasonalScore(a, season) || a.name.localeCompare(b.name, "fr"))[0];
  const reserved = new Set<string>();
  const fishOrPlant = chooseRole(plantProfile ? /tofu|pois chiches|lentilles|haricots|edamame|œufs|oeufs|omelette/ : /poisson|saumon|cabillaud|thon|maquereau|crevette|sardine|colin|lieu/, reserved, true);
  if (fishOrPlant) reserved.add(fishOrPlant.id);
  const pivot = chooseRole(plantProfile ? /tofu|pois chiches|lentilles|haricots|edamame|œufs|oeufs|omelette/ : /poulet|dinde|bœuf|boeuf|veau|porc|agneau|viande|steak/, reserved);
  if (pivot) reserved.add(pivot.id);
  const soup = eligible.filter((recipe) => !reserved.has(recipe.id) && /soupe|velouté|veloute|potage|bouillon/.test(roleText(recipe)) && seasonalScore(recipe, season) > 0).sort((a, b) => seasonalScore(b, season) - seasonalScore(a, season) || a.name.localeCompare(b.name, "fr"))[0];
  if (soup) reserved.add(soup.id);
  const pantry = chooseRole(/vide.?frigo|restes|anti.?gaspi|fond de placard/, reserved);
  if (pantry) reserved.add(pantry.id);
  const pleasures = eligible.filter((recipe) => !reserved.has(recipe.id) && /pizza|burger|lasagnes|tarte|crumble|fondant|dessert|gaufre|crêpe|crepe|pancake|festif|gourmand/.test(roleText(recipe))).sort((a, b) => seasonalScore(b, season) - seasonalScore(a, season) || a.name.localeCompare(b.name, "fr"));
  const matrix = new Map<string, { recipe: Recipe | null; name: string }>();
  const setRole = (day: string, meal: string, recipe: Recipe | undefined, fallback: string, name?: string) =>
    matrix.set(`${day}|${meal}`, { recipe: recipe || null, name: name || recipe?.name || fallback });
  setRole("LUNDI", "Soir", fishOrPlant, plantProfile ? "Aucune protéine végétale éclair validée" : "Aucun poisson éclair validé");
  setRole("MARDI", "Soir", pivot, "Aucun pivot protéiné complet validé");
  setRole("MERCREDI", "Midi", pivot, "Aucune portion pivot validée");
  setRole("MERCREDI", "Soir", soup, "Aucune soupe de saison complète validée");
  setRole("JEUDI", "Soir", pivot, "Seconde vie du pivot indisponible", pivot ? `Seconde vie — ${pivot.name}` : undefined);
  setRole("VENDREDI", "Midi", pantry, "Aucune recette Vide-Frigo complète validée");
  setRole("SAMEDI", "Midi", pleasures[0], "Aucun repas plaisir validé");
  setRole("SAMEDI", "Soir", pleasures[1], "Aucun repas plaisir validé");
  setRole("DIMANCHE", "Midi", pleasures[2], "Aucun repas plaisir validé");
  setRole("DIMANCHE", "Soir", pleasures[3], "Aucun repas plaisir validé");
  return slots.map((slot) => {
    const matrixSelection = matrix.get(`${slot.day}|${slot.meal}`);
    if (matrixSelection) {
      if (!matrixSelection.recipe) return { ...slot, name: matrixSelection.name, recipeId: null };
      used.add(matrixSelection.recipe.id);
      return { ...slot, name: matrixSelection.name, recipeId: matrixSelection.recipe.id };
    }
    const current = slot.recipeId ? recipesById.get(slot.recipeId) : undefined;
    const currentValid = current ? isValidatedRecipe(current) && profileAllows(current, preferences) : false;
    const currentScore = current ? seasonalScore(current, season) : 0;
    if (current && currentValid && currentScore > 0 && !used.has(current.id)) {
      used.add(current.id);
      return { ...slot, name: current.name };
    }
    const alternatives = eligible
      .filter((recipe) => !used.has(recipe.id) && recipe.id !== current?.id)
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

export function batchForWeek(week: number): { id: string; title: string; detail?: string; group?: string }[] {
  return (carnet.batch || [])
    .filter((item) => item.week === week)
    .map((item, i) => ({
      id: `${week}-${i}-${item.text}`,
      title: item.text,
      group: item.type || undefined,
    }));
}

export { shoppingForWeek } from "./shopping";
