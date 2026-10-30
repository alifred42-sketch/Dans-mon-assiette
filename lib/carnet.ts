import data from "@/data/carnet.json";
import pdfRecipeOverrides619 from "@/data/recettes-619.json";
import pdfRecipeOverrides800 from "@/data/recettes-800.json";
import pdfRecipeOverrides899 from "@/data/recettes-899.json";
import pdfRecipeOverrides1001 from "@/data/recettes-1001.json";
import pdfRecipeOverrides1024 from "@/data/recettes-1024.json";
import { trendRecipes } from "@/data/recettes-tendances";
import { springFestivalRecipes } from "@/data/recettes-fetes-printemps";
import { summerFestivalRecipes } from "@/data/recettes-fetes-ete";
import { autumnSylvestreRecipes } from "@/data/recettes-fetes-automne-sylvestre";
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
  if (/^une pincée\b/i.test(line)) return line;
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
  const recipeTags = recipe as Recipe & { sous_etudiant?: string };
  const isPdfTrendRecipe = recipeTags.sous_etudiant === "tendances" && recipe.source.includes("RECETTES ETUDIANTS - LES 12 RECETTES TENDANCES");
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

  const timePrep = isPdfTrendRecipe && !recipe.timePrep ? undefined : normalizedRecipeTime(recipe.timePrep, defaultPrepTime({ ...recipe, ingredients }));
  const timeCook = isPdfTrendRecipe && !recipe.timeCook ? undefined : normalizedRecipeTime(recipe.timeCook, defaultCookTime({ ...recipe, ingredients }));
  const servings = recipe.servings && /\d/.test(recipe.servings) ? recipe.servings : "4 personnes";
  const sections = [...(recipe.sections || [])].map((section) => {
    if (/ingrédients|ingredients|🛒/i.test(section.title || "")) return { ...section, lines: ingredients };
    if (/préparation|preparation|👩‍🍳/i.test(section.title || "")) return { ...section, lines: steps };
    if (/temps|durée|duree|⏱️/i.test(section.title || "")) return isPdfTrendRecipe ? { ...section, lines: ["👥 Pour " + servings] } : { ...section, lines: ["⏱️ Préparation : " + timePrep, "🔥 Cuisson : " + timeCook, "👥 Pour " + servings] };
    return section;
  });
  if (!sections.some((section) => /ingrédients|ingredients|🛒/i.test(section.title || ""))) sections.push({ title: "🛒 Ingrédients", lines: ingredients });
  if (!sections.some((section) => /préparation|preparation|👩‍🍳/i.test(section.title || ""))) sections.push({ title: "👩‍🍳 Préparation", lines: steps });
  if (!isPdfTrendRecipe && !sections.some((section) => /temps|durée|duree|⏱️/i.test(section.title || ""))) sections.unshift({ title: "⏱️ Temps et portions", lines: ["⏱️ Préparation : " + timePrep, "🔥 Cuisson : " + timeCook, "👥 Pour " + servings] });
  return { ...recipe, ingredients, steps, timePrep, timeCook, servings, notes, sections };
}

function recipeMatchKey(value: string): string {
  return normalizedSeasonText(value).replace(/^[0-9]+\.\s*/, "").replace(/[^a-z0-9]+/g, " ").trim();
}

/** Fiches qui décrivent une préparation, une sauce ou un plat dont la cuisson principale
 * n'est pas réalisable dans le panier Airfryer. Elles restent non marquées à cette étape. */
const AIRFRYER_EXCLUDED_RECIPE_NAMES = new Set([
  "sauce legumes rotis mixes",
  "sauce poivrons grilles",
  "marinade patate douce pommes de terre",
  "melange frites au four version bistrot",
  "veloute de legumes rotis chevre frais",
  "soupe tartine chaude",
  "gaspacho courgette basilic tartare de thon",
  "soupe froide de poivrons rouges rotis au mascarpone",
  "veloute de chou fleur roti et ail doux",
  "appareil a quiche maison",
  "pate a pizza maison",
  "barbecue entre amis",
  "verrine fraises skyr crumble d avoine",
  "oeufs mimosa maison",
  "roti de porc aux legumes",
  "wrap chaud saumon poireaux fondants",
  "gateau au yaourt revisite",
  "mug quesadilla crousti fondante",
  "appareil a clafoutis rustique aux tomates cerises romarin",
  "appareil a flan de potimarron au beaufort",
  "farce aux champignons et comte pour courge farcie",
]);

type PdfRecipeEntry = {
  recipe: (typeof pdfRecipeOverrides800)[number] | (typeof pdfRecipeOverrides619)[number] | (typeof pdfRecipeOverrides899)[number] | (typeof pdfRecipeOverrides1001)[number] | (typeof pdfRecipeOverrides1024)[number];
  source: "RECETTES 619.pdf" | "RECETTES 800.pdf" | "RECETTES 899.pdf" | "RECETTES 1000.pdf" | "RECETTES 1024.pdf";
  id: string;
};

const pdfRecipeEntries: PdfRecipeEntry[] = [
  ...pdfRecipeOverrides800.map((recipe) => ({
    recipe,
    source: "RECETTES 800.pdf" as const,
    id: recipe.id || `pdf-800-${recipe.sourceNumber}`,
  })),
  ...pdfRecipeOverrides899.map((recipe) => ({
    recipe,
    source: "RECETTES 899.pdf" as const,
    id: recipe.id || `pdf-899-${recipe.sourceNumber}`,
  })),
  ...pdfRecipeOverrides1001.map((recipe) => ({
    recipe,
    source: "RECETTES 1000.pdf" as const,
    id: recipe.id || `pdf-1001-${recipe.sourceNumber}`,
  })),
  ...pdfRecipeOverrides1024.map((recipe) => ({
    recipe,
    source: "RECETTES 1024.pdf" as const,
    id: recipe.id || `pdf-1024-${recipe.sourceNumber}`,
  })),
  ...pdfRecipeOverrides619.map((recipe, index) => ({
    recipe,
    source: "RECETTES 619.pdf" as const,
    id: `pdf-619-${index + 1}-${recipeMatchKey(recipe.name).replace(/\\s+/g, "-")}`,
  })),
];

const usedPdfRecipeIds = new Set<string>();

const recipesWithPdfOverrides = [...data.recipes, ...trendRecipes].map((recipe) => {
  const key = recipeMatchKey(recipe.name);
  const replacementEntry = pdfRecipeEntries.find(
    (entry) => !usedPdfRecipeIds.has(entry.id) && recipeMatchKey(entry.recipe.name) === key,
  );
  if (!replacementEntry) return recipe;
  usedPdfRecipeIds.add(replacementEntry.id);
  const replacement = replacementEntry.recipe;
  return {
    ...recipe,
    ingredients: replacement.ingredients,
    steps: replacement.steps,
    timePrep: replacement.timePrep,
    timeCook: replacement.timeCook || "0 min",
    servings: replacement.servings,
    source: replacementEntry.source,
  };
});

// Chaque fiche non utilisée pour remplacer un titre strictement identique est ajoutée
// comme recette distincte, y compris les fiches portant un titre en doublon.
const unmatchedPdfRecipes: Recipe[] = pdfRecipeEntries
  .filter((entry) => !usedPdfRecipeIds.has(entry.id) && entry.source !== "RECETTES 899.pdf")
  .map((entry) => ({
    ...entry.recipe,
    id: entry.id,
    robot: [],
    notes: [],
    source: entry.source,
  }));

const firstTwentyRecipeImages: Record<string, { image: string; imageAlt: string; imageSourceUrl: string; imageCredit: string }> = {
  "r-b6bee72546": { image: "https://images.pexels.com/photos/14774691/pexels-photo-14774691.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Wrap poulet crudités", imageSourceUrl: "https://www.pexels.com/photo/a-wrap-with-meat-and-vegetables-on-a-plate-14774691/", imageCredit: "Shameel mukkath" },
  "r-027c5f4f20": { image: "https://images.pexels.com/photos/16273766/pexels-photo-16273766.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Cabillaud ou poisson et pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/fish-and-potatoes-on-a-plate-16273766/", imageCredit: "Nadin Sh" },
  "r-6f3fa27bf5": { image: "https://images.pexels.com/photos/36430162/pexels-photo-36430162.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Risotto crémeux aux courgettes", imageSourceUrl: "https://www.pexels.com/photo/creamy-risotto-with-zucchini-slices-on-plate-36430162/", imageCredit: "Willians Huerta" },
  "r-eec2386df3": { image: "https://images.pexels.com/photos/31064161/pexels-photo-31064161.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poulet rôti aux légumes", imageSourceUrl: "https://www.pexels.com/photo/gourmet-roasted-chicken-with-vegetables-31064161/", imageCredit: "Mahmoud Salem" },
  "r-c9d038ac38": { image: "https://images.pexels.com/photos/37648023/pexels-photo-37648023.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Salade de poulet et crudités", imageSourceUrl: "https://www.pexels.com/photo/colorful-chicken-salad-bowl-with-fresh-vegetables-37648023/", imageCredit: "Tochukwu Ekeh" },
  "r-286a260f09": { image: "https://images.unsplash.com/photo-1626700051175-6518c4793fde?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Wrap thon crudités", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-191ad7474a": { image: "https://images.pexels.com/photos/35646479/pexels-photo-35646479.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Lentilles corail et poivrons", imageSourceUrl: "https://www.pexels.com/photo/rustic-lentil-stew-with-red-bell-peppers-35646479/", imageCredit: "Vural Yavas" },
  "r-103073cf0c": { image: "https://images.pexels.com/photos/19409026/pexels-photo-19409026.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Melon et prosciutto", imageSourceUrl: "https://www.pexels.com/photo/woman-eating-appetizer-in-a-restaurant-19409026/", imageCredit: "Nadin Sh" },
  "r-b03b260268": { image: "https://images.pexels.com/photos/13163534/pexels-photo-13163534.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Burger et frites", imageSourceUrl: "https://www.pexels.com/photo/delicious-burger-and-fries-serving-13163534/", imageCredit: "Aleksey Bystrov" },
  "r-c1ed1606a4": { image: "https://images.pexels.com/photos/26161037/pexels-photo-26161037.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Omelette et salade", imageSourceUrl: "https://www.pexels.com/photo/omelette-with-vegetable-salad-26161037/", imageCredit: "Serdar Göksu" },
  "r-ceea7b5051": { image: "https://images.pexels.com/photos/29653125/pexels-photo-29653125.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Pâtes crémeuses au saumon", imageSourceUrl: "https://www.pexels.com/photo/delicious-creamy-pasta-with-salmon-and-herbs-29653125/", imageCredit: "Valeria Boltneva" },
  "r-9f72f3e182": { image: "https://images.pexels.com/photos/5794/pexels-photo-5794.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Soupe poireaux pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/leek-and-potato-soup-5794/", imageCredit: "Karolina Grabowska" },
  "r-e99302c7e8": { image: "https://images.pexels.com/photos/14537687/pexels-photo-14537687.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Saumon au four et légumes", imageSourceUrl: "https://www.pexels.com/photo/dish-with-baked-salmon-and-vegetables-14537687/", imageCredit: "Cristian Mihaila" },
  "r-4c28f40550": { image: "https://images.pexels.com/photos/37417629/pexels-photo-37417629.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Maquereau grillé et salade", imageSourceUrl: "https://www.pexels.com/photo/grilled-mackerel-with-fresh-tomato-and-herb-salad-37417629/", imageCredit: "Husien Bisky" },
  "r-4a83bb2c6f": { image: "https://images.pexels.com/photos/9213869/pexels-photo-9213869.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poulet aux courgettes et légumes", imageSourceUrl: "https://www.pexels.com/photo/white-ceramic-bowl-with-noodle-and-chicken-9213869/", imageCredit: "Loren Castillo" },
  "r-1aceae48da": { image: "https://images.pexels.com/photos/38706545/pexels-photo-38706545.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Courgettes farcies", imageSourceUrl: "https://www.pexels.com/photo/traditional-lebanese-stuffed-zucchini-dish-38706545/", imageCredit: "Anthony Rahayel" },
  "r-8cb821d384": { image: "https://images.pexels.com/photos/6145896/pexels-photo-6145896.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Salade fraîche de lentilles corail et courgettes", imageSourceUrl: "https://www.pexels.com/photo/green-vegetable-on-white-ceramic-plate-6145896/", imageCredit: "Anna Pyshniuk" },
  "r-f1341c9e59": { image: "https://images.pexels.com/photos/6210955/pexels-photo-6210955.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poulet rôti aux légumes", imageSourceUrl: "https://www.pexels.com/photo/appetizing-roasted-chicken-with-vegetables-in-baking-dish-6210955/", imageCredit: "Tim Douglas" },
  "r-ea69524e92": { image: "https://images.pexels.com/photos/89238/pexels-photo-89238.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Œufs et légumes à la poêle", imageSourceUrl: "https://www.pexels.com/photo/fried-eggs-with-tomatoes-89238/", imageCredit: "Ela Haney" },
  "r-4261d5727b": { image: "https://images.pexels.com/photos/34759945/pexels-photo-34759945.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Saumon au four aux légumes et sauce", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/plat-de-saumon-gastronomique-aux-legumes-et-a-la-sauce-34759945/", imageCredit: "This And No Internet 25" },
  "r-0e4a0d3bc8": { image: "https://images.pexels.com/photos/6066052/pexels-photo-6066052.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Riz au poulet et légumes colorés", imageSourceUrl: "https://www.pexels.com/photo/dinner-dish-with-rice-chicken-and-vegetables-6066052/", imageCredit: "Alesia Kozik" },
  "r-4386e60c58": { image: "https://images.pexels.com/photos/12664800/pexels-photo-12664800.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Saumon fumé, fromage frais et crudités sur pain complet", imageSourceUrl: "https://www.pexels.com/photo/bread-with-fish-and-vegetables-toppings-12664800/", imageCredit: "Gonzalo Acuña" },
  "r-5e88cfd057": { image: "https://images.unsplash.com/photo-1607532941433-304659e8198a?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Velouté courgettes poireaux", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-67352b3d01": { image: "https://images.pexels.com/photos/35358037/pexels-photo-35358037/free-photo-of-delicious-chicken-stew-with-potatoes-and-peas.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poulet mijoté aux légumes dans une sauce", imageSourceUrl: "https://www.pexels.com/photo/delicious-chicken-stew-with-potatoes-and-peas-35358037/", imageCredit: "Muhammad Khawar Nazir" },
  "r-ac95798da5": { image: "https://images.pexels.com/photos/12918197/pexels-photo-12918197.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poisson blanc accompagné de tomates cerises", imageSourceUrl: "https://www.pexels.com/photo/fish-and-vegetables-on-table-12918197/", imageCredit: "Nadin Sh" },
  "r-0a588fec75": { image: "https://images.pexels.com/photos/10837796/pexels-photo-10837796.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Wrap au poulet et salade fraîche", imageSourceUrl: "https://www.pexels.com/photo/a-close-up-shot-of-a-delicious-wrap-10837796/", imageCredit: "HamZa NOUASRIA" },
  "r-af6f91eb76": { image: "https://images.pexels.com/photos/17894221/pexels-photo-17894221/free-photo-of-stuffed-tomatoes-served-in-a-restaurant.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Tomates farcies et gratinées", imageSourceUrl: "https://www.pexels.com/photo/stuffed-tomatoes-served-in-a-restaurant-17894221/", imageCredit: "Valeria Boltneva" },
  "r-4694f50d4c": { image: "https://images.pexels.com/photos/30578207/pexels-photo-30578207/free-photo-of-roasted-chicken-leg-with-herb-potatoes.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poulet rôti et pommes de terre aux herbes", imageSourceUrl: "https://www.pexels.com/photo/roasted-chicken-leg-with-herb-potatoes-30578207/", imageCredit: "Rinat Askarov" },
  "r-4085aadefb": { image: "https://images.pexels.com/photos/40190439/pexels-photo-40190439/free-photo-of-saumon-gastronomique-aux-courgettes-et-risotto-cremeux.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Saumon roulé dans la courgette et risotto", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/saumon-gastronomique-aux-courgettes-et-risotto-cremeux-40190439/", imageCredit: "Emre Uğurlu" },
  "r-622abb4fc0": { image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Hachis parmentier poulet", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-fa22488bd2": { image: "https://images.pexels.com/photos/37653982/pexels-photo-37653982.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Curry de poulet servi avec du riz et des légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-chicken-curry-dish-with-sides-37653982/", imageCredit: "Muhammad Khawar Nazir" },
  "r-2fbacfb4db": { image: "https://images.pexels.com/photos/15869769/pexels-photo-15869769.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poisson et légumes disposés sur une plaque avant cuisson en papillote", imageSourceUrl: "https://www.pexels.com/photo/fish-being-prepared-with-vegetables-and-champignons-15869769/", imageCredit: "Kate Andreeshcheva" },
  "r-b2c728a846": { image: "https://images.pexels.com/photos/32981296/pexels-photo-32981296.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Bowl de poulet, riz, avocat et concombre", imageSourceUrl: "https://www.pexels.com/photo/healthy-poke-bowl-with-rice-and-vegetables-32981296/", imageCredit: "Julia K." },
  "r-8cff60f4c8": { image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Salade complète pommes de terre", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-4231745fd3": { image: "https://images.pexels.com/photos/36895692/pexels-photo-36895692.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Pâtes crémeuses au saumon et légumes", imageSourceUrl: "https://www.pexels.com/photo/creamy-broccoli-and-salmon-pasta-dish-36895692/", imageCredit: "Christina & Peter" },
  "r-40af79300d": { image: "https://images.pexels.com/photos/29535636/pexels-photo-29535636.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Lasagnes maison gratinées aux herbes et légumes", imageSourceUrl: "https://www.pexels.com/photo/freshly-baked-lasagna-with-herbs-and-vegetables-29535636/", imageCredit: "Nano Erdozain" },
  "r-3ff1d4abc1": { image: "https://images.pexels.com/photos/4871235/pexels-photo-4871235.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Sauce tomate maison en cours de préparation dans une casserole", imageSourceUrl: "https://www.pexels.com/photo/photo-of-a-black-spoon-in-a-pot-with-tomato-sauce-4871235/", imageCredit: "Kaboompics" },
  "r-7c7db17fc6": { image: "https://images.pexels.com/photos/27588102/pexels-photo-27588102.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Émincé de poulet sauté aux poivrons colorés", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-food-with-chicken-and-peppers-on-it-27588102/", imageCredit: "Collab Media" },
  "r-fd328fb9e5": { image: "https://images.pexels.com/photos/29653146/pexels-photo-29653146.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poisson blanc accompagné de purée de pommes de terre et légumes", imageSourceUrl: "https://www.pexels.com/photo/elegant-fish-dish-with-creamy-mashed-potatoes-29653146/", imageCredit: "Valeria Boltneva" },
  "r-a50c1dc350": { image: "https://images.pexels.com/photos/32727455/pexels-photo-32727455.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Gyro grec garni de poulet et crudités", imageSourceUrl: "https://www.pexels.com/photo/delicious-greek-gyro-wrap-held-in-bright-alleyway-32727455/", imageCredit: "Vincent Rivaud" },
  "r-a619df7801": { image: "https://images.pexels.com/photos/32986486/pexels-photo-32986486/free-photo-of-minimalist-overhead-shot-of-tzatziki-sauce.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Tzatziki crémeux dans un bol en verre sur fond blanc", imageSourceUrl: "https://www.pexels.com/photo/minimalist-overhead-shot-of-tzatziki-sauce-32986486/", imageCredit: "J KREATOR" },
  "r-d66b61b9c1": { image: "https://images.pexels.com/photos/20590322/pexels-photo-20590322.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Soupe de lentilles corail dans un bol blanc avec herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/delicious-soup-with-herbs-in-white-bowl-20590322/", imageCredit: "Galiya Tenisheva" },
  "r-8cf41134a5": { image: "https://images.pexels.com/photos/38986308/pexels-photo-38986308/free-photo-of-fresh-mackerel-with-tomatoes-and-spices.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Maquereau accompagné de tomates et d'épices, vue plongeante", imageSourceUrl: "https://www.pexels.com/photo/fresh-mackerel-with-tomatoes-and-spices-38986308/", imageCredit: "Masuma Rahaman" },
  "r-c8c2401e21": { image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Boulettes de poulet", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-3a1d6f68c6": { image: "https://images.pexels.com/photos/37226786/pexels-photo-37226786/free-photo-of-delicious-cheesy-potato-gratin-with-fresh-salad.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Gratin de pommes de terre doré servi sur une planche en bois clair", imageSourceUrl: "https://www.pexels.com/photo/delicious-cheesy-potato-gratin-with-fresh-salad-37226786/", imageCredit: "Veronika Benz" },
  "r-7608384270": { image: "https://images.pexels.com/photos/13312316/pexels-photo-13312316.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Salade de poulet grillé et légumes frais dans une assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/vegetable-salad-with-chicken-breast-on-white-ceramic-plate-13312316/", imageCredit: "Nadin Sh" },
  "r-8bb158a3a6": { image: "https://images.pexels.com/photos/33682598/pexels-photo-33682598/free-photo-of-minimalist-chicken-wrap-on-white-plate.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Wrap au poulet présenté sur une assiette blanche et un fond neutre", imageSourceUrl: "https://www.pexels.com/photo/minimalist-chicken-wrap-on-white-plate-33682598/", imageCredit: "Sue Hsu" },
  "r-dceb04ad1c": { image: "https://images.pexels.com/photos/33922142/pexels-photo-33922142/free-photo-of-vegetable-frittata-with-fresh-bread-on-marble.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Frittata aux légumes et fromage sur une surface en marbre clair", imageSourceUrl: "https://www.pexels.com/photo/vegetable-frittata-with-fresh-bread-on-marble-33922142/", imageCredit: "Anya Dunes" },
  "r-f7790c5b1a": { image: "https://images.pexels.com/photos/12622125/pexels-photo-12622125.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poulet sauté aux champignons dans un bol blanc", imageSourceUrl: "https://www.pexels.com/photo/stir-fried-white-shimeji-mushroom-12622125/", imageCredit: "Vary Ann" },
  "r-c3947a1435": { image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Saumon teriyaki", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-9aa4c08507": { image: "https://images.pexels.com/photos/8999081/pexels-photo-8999081.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Maquereau grillé servi avec des accompagnements sur une assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/cooked-fish-on-white-ceramic-plate-8999081/", imageCredit: "makafood" },
  "r-3f16c360b7": { image: "https://images.pexels.com/photos/10338451/pexels-photo-10338451.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Soupe de poulet et légumes dans un bol", imageSourceUrl: "https://www.pexels.com/photo/chicken-soup-with-potatoes-and-carrots-10338451/", imageCredit: "Istvan Szabo" },
  "r-d3bd7726ab": { image: "https://images.pexels.com/photos/5150320/pexels-photo-5150320.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Tartine chaude au fromage, tomates et basilic", imageSourceUrl: "https://www.pexels.com/photo/toast-with-cheese-and-vegetables-5150320/", imageCredit: "ROMAN ODINTSOV" },
  "r-0a2e578f74": { image: "https://images.pexels.com/photos/4518840/pexels-photo-4518840.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Pâtes au saumon et légumes sur une assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/pasta-in-a-fork-on-a-white-surface-4518840/", imageCredit: "Polina Tankilevitch" },
  "r-8ab1afdf0b": { image: "https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Parmentier de poulet", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-4b379875ab": { image: "https://images.pexels.com/photos/36351896/pexels-photo-36351896.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poulet grillé et légumes frais dans une assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/delicious-grilled-chicken-with-vegetables-on-plate-36351896/", imageCredit: "Masuma Rahaman" },
  "r-d6b315c75e": { image: "https://images.pexels.com/photos/28128244/pexels-photo-28128244.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Saumon accompagné de légumes rôtis et d'une garniture crémeuse", imageSourceUrl: "https://www.pexels.com/photo/a-white-plate-topped-with-fish-and-vegetables-28128244/", imageCredit: "Hannah Barata" },
  "r-b20d266658": { image: "https://images.pexels.com/photos/16022887/pexels-photo-16022887.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Wrap au poulet et aux légumes frais sur une assiette", imageSourceUrl: "https://www.pexels.com/photo/doner-on-plate-16022887/", imageCredit: "Valeria Boltneva" },
  "r-c450588386": { image: "https://images.pexels.com/photos/36895293/pexels-photo-36895293.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Salade de thon et d'œufs avec des légumes frais dans un bol blanc", imageSourceUrl: "https://www.pexels.com/photo/delicious-tuna-and-egg-salad-with-fresh-vegetables-36895293/", imageCredit: "Hugo Poullain" },
  "r-7f48b55eec": { image: "https://images.pexels.com/photos/8257438/pexels-photo-8257438.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Bol de yaourt et de fruits frais sur une surface claire", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-with-fruits-and-yogurt-8257438/", imageCredit: "Valeriya Kobzar" },

  "r-2815a69a28": { image: "https://images.pexels.com/photos/13950821/pexels-photo-13950821.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Overnight oats à la pomme et à la cannelle, vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/bowl-of-oatmeal-on-a-wooden-tray-13950821/", imageCredit: "Wil Carranza" },
  "r-7b8723ca0e": { image: "https://images.pexels.com/photos/34516543/pexels-photo-34516543.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Muffins salés aux herbes présentés en vue plongeante", imageSourceUrl: "https://www.pexels.com/photo/fresh-herb-muffins-with-tea-on-checkered-cloth-34516543/", imageCredit: "İdil Ceren Çelikler" },
  "r-1521ded2c8": { image: "https://images.pexels.com/photos/8696559/pexels-photo-8696559.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson blanc grillé aux herbes et au citron sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/cooked-fish-on-white-ceramic-plate-8696559/", imageCredit: "Farhad Ibrahimzade" },
  "r-02ecf13059": { image: "https://images.pexels.com/photos/16510619/pexels-photo-16510619.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet rôti au citron et aux légumes, vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/top-view-of-roasted-chicken-on-a-pan-with-fresh-vegetables-lying-around-on-the-table-16510619/", imageCredit: "Sternsteiger Stahlwaren" },
  "r-9e331c3da5": { image: "https://images.pexels.com/photos/9213909/pexels-photo-9213909.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade complète au poulet et tomates cerises sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/a-plate-of-vegetable-salad-with-chicken-and-mashed-potato-9213909/", imageCredit: "Loren Castillo" },
  "r-b2b3918bfe": { image: "https://images.pexels.com/photos/5175523/pexels-photo-5175523.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Risotto crémeux au poulet et aux herbes", imageSourceUrl: "https://www.pexels.com/photo/food-on-brown-ceramic-bowl-5175523/", imageCredit: "Shameel mukkath" },
  "r-b1aca4b04c": { image: "https://images.pexels.com/photos/36378584/pexels-photo-36378584.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Cabillaud croustillant aux herbes servi sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/herb-crusted-baked-fish-on-white-plate-36378584/", imageCredit: "Masuma Rahaman" },
  "r-c886bf140e": { image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Wrap thon avocat", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-1fe9ba7717": { image: "https://images.pexels.com/photos/17321119/pexels-photo-17321119.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet mijoté à la tomate et aux herbes dans une poêle", imageSourceUrl: "https://www.pexels.com/photo/a-pan-with-chicken-and-tomato-sauce-on-top-17321119/", imageCredit: "Shameel mukkath" },
  "r-8475d1cf91": { image: "https://images.pexels.com/photos/18001763/pexels-photo-18001763.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Galettes de pommes de terre croustillantes accompagnées de saumon fumé", imageSourceUrl: "https://www.pexels.com/photo/fried-chops-with-salmon-salad-and-sauce-18001763/", imageCredit: "Valeria Boltneva" },

  "r-08fd2e4a38": { image: "https://images.pexels.com/photos/5133763/pexels-photo-5133763.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade fraîche aux œufs durs et crudités sur assiette claire", imageSourceUrl: "https://www.pexels.com/photo/fresh-vegetable-salad-with-boiled-eggs-on-white-ceramic-plate-5133763/", imageCredit: "Yvis Rivas" },
  "r-1fa9d156b4": { image: "https://images.pexels.com/photos/9218753/pexels-photo-9218753.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet curry doux accompagné de légumes et de riz", imageSourceUrl: "https://www.pexels.com/photo/a-meal-on-a-plate-9218753/", imageCredit: "Loren Castillo" },
  "r-1c67d35523": { image: "https://images.pexels.com/photos/37069897/pexels-photo-37069897.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon grillé servi avec des légumes verts sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/grilled-salmon-with-vegetables-and-greens-37069897/", imageCredit: "Filipa Moreira" },
  "r-201811f784": { image: "https://images.pexels.com/photos/16824040/pexels-photo-16824040.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gratin méditerranéen de légumes avec courgettes et tomates", imageSourceUrl: "https://www.pexels.com/photo/meal-with-vegetables-16824040/", imageCredit: "Tom Wielspütz" },
  "r-d22e0918ca": { image: "https://images.pexels.com/photos/39994554/pexels-photo-39994554.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap au poulet et aux légumes frais", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/delicieux-wrap-au-poulet-pret-a-deguster-39994554/", imageCredit: "Albert Kayenda" },
  "r-ef75c2304d": { image: "https://images.pexels.com/photos/36430154/pexels-photo-36430154.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon servi sur risotto crémeux avec courgettes", imageSourceUrl: "https://www.pexels.com/photo/gourmet-salmon-with-zucchini-and-risotto-36430154/", imageCredit: "Willians Huerta" },
  "r-0e0f234326": { image: "https://images.pexels.com/photos/6419606/pexels-photo-6419606.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Shakshuka aux œufs et tomates, vue plongeante", imageSourceUrl: "https://www.pexels.com/photo/a-shakshuka-with-eggs-6419606/", imageCredit: "Polina Tankilevitch" },
  "r-8ac4802de7": { image: "https://images.pexels.com/photos/33277586/pexels-photo-33277586.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon nappé d'une sauce crémeuse avec légumes frais", imageSourceUrl: "https://www.pexels.com/photo/delicious-salmon-meal-with-vegetables-33277586/", imageCredit: "Nahid Alimemmedov" },
  "r-c9cb14485f": { image: "https://images.pexels.com/photos/17989471/pexels-photo-17989471.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Boulettes en sauce tomate garnies de légumes frais", imageSourceUrl: "https://www.pexels.com/photo/meatballs-in-sauce-17989471/", imageCredit: "Wijs (Wise)" },
  "r-9f56f26c45": { image: "https://images.pexels.com/photos/38103943/pexels-photo-38103943.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gratin de pommes de terre crémeux et doré au fromage", imageSourceUrl: "https://www.pexels.com/photo/delicious-creamy-baked-potato-casserole-38103943/", imageCredit: "Hilal Diken" },

  "r-ca3320f5ec": { image: "https://images.pexels.com/photos/17646241/pexels-photo-17646241.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wraps de laitue garnis de saumon frais", imageSourceUrl: "https://www.pexels.com/photo/healthy-lunch-with-lettuce-17646241/", imageCredit: "Nadin Sh" },
  "r-93ec53d92f": { image: "https://images.pexels.com/photos/33515064/pexels-photo-33515064.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes crémeuses au poulet avec herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/delicious-creamy-chicken-pasta-dish-33515064/", imageCredit: "SONNIE WING" },
  "r-e74139914e": { image: "https://images.pexels.com/photos/8934919/pexels-photo-8934919.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de lentilles et légumes dans un bol blanc", imageSourceUrl: "https://www.pexels.com/photo/vegetable-salad-on-white-ceramic-bowl-8934919/", imageCredit: "makafood" },
  "r-14341387d6": { image: "https://images.pexels.com/photos/10172749/pexels-photo-10172749.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de poulet et nouilles garnie d'herbes", imageSourceUrl: "https://www.pexels.com/photo/a-close-up-shot-of-noodles-in-a-bowl-10172749/", imageCredit: "Jana Ohajdova" },
  "r-5061ddc84e": { image: "https://images.pexels.com/photos/12077978/pexels-photo-12077978.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe onctueuse de lentilles corail aux épices", imageSourceUrl: "https://www.pexels.com/photo/turkish-creamy-soup-12077978/", imageCredit: "Alex Bayev" },
  "r-2687b67896": { image: "https://images.pexels.com/photos/20182304/pexels-photo-20182304.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson servi dans une sauce crémeuse", imageSourceUrl: "https://www.pexels.com/photo/fish-in-sauce-for-dinner-20182304/", imageCredit: "Valeria Boltneva" },
  "r-8b97b45460": { image: "https://images.pexels.com/photos/17200361/pexels-photo-17200361.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap façon kebab au poulet et crudités", imageSourceUrl: "https://www.pexels.com/photo/delicious-kebab-with-meat-lettuce-tomato-red-onion-and-sauce-with-french-fries-and-sauce-17200361/", imageCredit: "Саша Алалыкин" },
  "r-b5d84e8dfe": { image: "https://images.pexels.com/photos/35736457/pexels-photo-35736457.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet rôti accompagné de champignons et pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/indonesian-grilled-chicken-with-vegetables-35736457/", imageCredit: "Riandy Saputra" },
  "r-c2861ee706": { image: "https://images.pexels.com/photos/8892364/pexels-photo-8892364.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de yaourt aux fruits rouges et granola vu du dessus", imageSourceUrl: "https://www.pexels.com/photo/a-top-view-of-a-yogurt-bowl-8892364/", imageCredit: "Anastasia Belousova" },
  "r-904e0943b1": { image: "https://images.pexels.com/photos/32039641/pexels-photo-32039641.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gratin de légumes au fromage dans un plat blanc", imageSourceUrl: "https://www.pexels.com/photo/cheesy-vegetable-baked-casserole-in-white-dish-32039641/", imageCredit: "Sylwester Ficek" },

  "r-530be65cae": { image: "https://images.pexels.com/photos/31233887/pexels-photo-31233887.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet crémeux aux champignons servi avec des herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/delicious-creamy-mushroom-chicken-dish-31233887/", imageCredit: "Mahmoud Salem" },
  "r-85cce941ee": { image: "https://images.pexels.com/photos/12266289/pexels-photo-12266289.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de saumon accompagné de légumes colorés", imageSourceUrl: "https://www.pexels.com/photo/overhead-shot-of-a-dish-with-fish-12266289/", imageCredit: "Nadin Sh" },
  "r-65f878753c": { image: "https://images.pexels.com/photos/20793370/pexels-photo-20793370.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pizza garnie de jambon et de mozzarella fondante", imageSourceUrl: "https://www.pexels.com/photo/delicious-pizza-in-close-up-view-20793370/", imageCredit: "Emiliano Vittoriosi" },
  "r-bcd8f8b73e": { image: "https://images.pexels.com/photos/17780275/pexels-photo-17780275.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bowl coloré de crudités et saumon fumé", imageSourceUrl: "https://www.pexels.com/photo/bowl-with-salad-17780275/", imageCredit: "Nadin Sh" },
  "r-3822ce960b": { image: "https://images.pexels.com/photos/5862147/pexels-photo-5862147.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Dessert gourmand au yaourt et au chocolat", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-a-glass-of-chocolate-yogurt-5862147/", imageCredit: "Alvaro Avivar" },
  "r-94dd4ec92d": { image: "https://images.pexels.com/photos/6916860/pexels-photo-6916860.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet mijoté accompagné de pommes de terre et d'herbes", imageSourceUrl: "https://www.pexels.com/photo/cooked-chicken-and-potatoes-on-a-ceramic-plate-6916860/", imageCredit: "Laurent Planson Crequer" },
  "r-8221a6ec1c": { image: "https://images.pexels.com/photos/27294734/pexels-photo-27294734.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson grillé avec tomates cerises, citron et herbes", imageSourceUrl: "https://www.pexels.com/photo/a-fish-dish-with-tomatoes-bread-and-herbs-27294734/", imageCredit: "Valeria Boltneva" },
  "r-854b6e3c3d": { image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Wrap chèvre chaud", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-6412e86059": { image: "https://images.pexels.com/photos/9213882/pexels-photo-9213882.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes de courgettes avec poulet et légumes", imageSourceUrl: "https://www.pexels.com/photo/a-close-up-shot-of-a-pasta-dish-9213882/", imageCredit: "Loren Castillo" },
  "r-fe4a625a80": { image: "https://images.pexels.com/photos/19396430/pexels-photo-19396430.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de pommes de terre garnie d'aneth frais", imageSourceUrl: "https://www.pexels.com/photo/potato-salad-with-caviar-19396430/", imageCredit: "Nadin Sh" },

  "r-a2d1c90f9f": { image: "https://images.pexels.com/photos/39886178/pexels-photo-39886178.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pommes cuites au four parfumées à la cannelle", imageSourceUrl: "https://www.pexels.com/photo/baked-cinnamon-apples-in-cozy-kitchen-setting-39886178/", imageCredit: "Dinara Ashurova" },
  "r-0f8db20af1": { image: "https://images.pexels.com/photos/36351895/pexels-photo-36351895.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet rôti au romarin, citron et légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-rosemary-chicken-with-vegetables-36351895/", imageCredit: "Masuma Rahaman" },
  "r-75be992a34": { image: "https://images.pexels.com/photos/14537684/pexels-photo-14537684.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pavé de saumon grillé avec légumes rôtis et citron", imageSourceUrl: "https://www.pexels.com/photo/grilled-vegetables-and-fish-served-on-white-plate-14537684/", imageCredit: "Cristian Mihaila" },
  "r-2c7595faf1": { image: "https://images.pexels.com/photos/31631255/pexels-photo-31631255.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wraps garnis servis avec une salade fraîche", imageSourceUrl: "https://www.pexels.com/photo/delicious-wraps-with-fresh-salad-on-plate-31631255/", imageCredit: "Mediha Ekici" },
  "r-b956c07118": { image: "https://images.pexels.com/photos/34668501/pexels-photo-34668501.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Riz sauté au poulet et aux légumes frais", imageSourceUrl: "https://www.pexels.com/photo/delicious-chicken-fried-rice-with-fresh-vegetables-34668501/", imageCredit: "UNDO KIM" },
  "r-bdd0330d4f": { image: "https://images.pexels.com/photos/29990630/pexels-photo-29990630.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade grecque fraîche à la feta et au concombre", imageSourceUrl: "https://www.pexels.com/photo/fresh-greek-salad-with-feta-cheese-and-cucumbers-29990630/", imageCredit: "Oleg Kuzma" },
  "r-d319909cc0": { image: "https://images.pexels.com/photos/32080629/pexels-photo-32080629.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mousse au chocolat onctueuse servie dans un bol", imageSourceUrl: "https://www.pexels.com/photo/delicious-chocolate-mousse-dessert-on-table-32080629/", imageCredit: "Esra Afşar" },
  "r-8e7e5118c9": { image: "https://images.pexels.com/photos/36715445/pexels-photo-36715445.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet mijoté aux tomates dans une casserole", imageSourceUrl: "https://www.pexels.com/photo/cooking-chicken-with-tomatoes-on-stove-36715445/", imageCredit: "Muhammad Khawar Nazir" },
  "r-83bc282530": { image: "https://images.pexels.com/photos/37367757/pexels-photo-37367757.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson blanc cuit au four avec citron et herbes", imageSourceUrl: "https://www.pexels.com/photo/delicious-baked-fish-with-lemon-and-herbs-37367757/", imageCredit: "Mahi Mog" },
  "r-db6641e339": { image: "https://images.unsplash.com/photo-1626700051175-6518c4793fde?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Wrap nordique", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },

  "r-e7670ca0f2": { image: "https://images.pexels.com/photos/32986098/pexels-photo-32986098.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Orzo crémeux aux légumes rôtis dans un bol", imageSourceUrl: "https://www.pexels.com/photo/creamy-orzo-pasta-with-roasted-vegetables-32986098/", imageCredit: "Marta Dzedyshko" },
  "r-4719d3da8c": { image: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade fraîche au poulet et morceaux de pomme", imageSourceUrl: "https://www.pexels.com/photo/vegetable-salad-on-plate-1640777/", imageCredit: "JÉSHOOTS" },
  "r-814d8b0cfd": { image: "https://images.pexels.com/photos/830894/pexels-photo-830894.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tranches de banana bread maison", imageSourceUrl: "https://www.pexels.com/photo/sliced-banana-bread-on-white-ceramic-plate-830894/", imageCredit: "Rachael Gorjestani" },
  "r-8bea47c869": { image: "https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet doré au miel et à la moutarde", imageSourceUrl: "https://www.pexels.com/photo/cooked-chicken-on-white-ceramic-plate-376464/", imageCredit: "Pixabay" },
  "r-6aa446b619": { image: "https://images.pexels.com/photos/3296279/pexels-photo-3296279.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson blanc rôti aux tomates et herbes méditerranéennes", imageSourceUrl: "https://www.pexels.com/photo/cooked-fish-with-tomatoes-on-plate-3296279/", imageCredit: "Valeria Boltneva" },
  "r-dd64aaf43a": { image: "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade César au poulet, laitue et copeaux de parmesan", imageSourceUrl: "https://www.pexels.com/photo/vegetable-salad-on-plate-461198/", imageCredit: "Kaboompics.com" },
  "r-0142899090": { image: "https://images.pexels.com/photos/5638527/pexels-photo-5638527.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes crémeuses au saumon et épinards", imageSourceUrl: "https://www.pexels.com/photo/creamy-pasta-with-spinach-and-salmon-5638527/", imageCredit: "Antoni Shkraba Studio" },
  "r-ac96fb6010": { image: "https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de chèvre chaud et noix sur jeunes pousses", imageSourceUrl: "https://www.pexels.com/photo/salad-with-cheese-on-white-plate-1211887/", imageCredit: "Pixabay" },
  "r-7bc79cb546": { image: "https://images.pexels.com/photos/1132558/pexels-photo-1132558.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poires rôties parfumées à la cannelle et aux amandes", imageSourceUrl: "https://www.pexels.com/photo/sliced-pears-on-white-plate-1132558/", imageCredit: "Pixabay" },
  "r-e04a817134": { image: "https://images.pexels.com/photos/3296398/pexels-photo-3296398.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de poisson aux amandes et citron", imageSourceUrl: "https://www.pexels.com/photo/cooked-fish-on-white-ceramic-plate-3296398/", imageCredit: "Valeria Boltneva" },

  "r-c73f799f72": { image: "https://images.pexels.com/photos/28896610/pexels-photo-28896610.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet et champignons dans une préparation crémeuse", imageSourceUrl: "https://www.pexels.com/photo/delicious-creamy-chicken-and-mushroom-soup-28896610/", imageCredit: "ahmed kh. jami" },
  "r-5ff12b1c43": { image: "https://images.pexels.com/photos/27668696/pexels-photo-27668696.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap frais garni de légumes croquants", imageSourceUrl: "https://www.pexels.com/photo/a-sandwich-with-lettuce-and-tomatoes-on-a-wooden-board-27668696/", imageCredit: "Valeria Boltneva" },
  "r-97b2f9cdef": { image: "https://images.pexels.com/photos/10802307/pexels-photo-10802307.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes crémeuses aux courgettes préparées dans une poêle", imageSourceUrl: "https://www.pexels.com/photo/a-delicious-pasta-dish-in-a-pan-10802307/", imageCredit: "Anna Guerrero" },
  "r-f0d58d2216": { image: "https://images.pexels.com/photos/6632310/pexels-photo-6632310.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade fraîche de poisson et légumes dans un bol", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-a-meal-with-chickpeas-and-onions-6632310/", imageCredit: "Alesia Kozik" },
  "r-2c1b8afcb0": { image: "https://images.pexels.com/photos/36824683/pexels-photo-36824683.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Verrine de yaourt aux fraises et crumble", imageSourceUrl: "https://www.pexels.com/photo/delicious-layered-parfait-with-fresh-strawberries-36824683/", imageCredit: "Gizem Gökce" },
  "r-575d077fa8": { image: "https://images.pexels.com/photos/36430167/pexels-photo-36430167.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet à la tomate accompagné d'olives et d'herbes", imageSourceUrl: "https://www.pexels.com/photo/gourmet-chicken-dish-with-tomato-sauce-36430167/", imageCredit: "Willians Huerta" },
  "r-1649246eba": { image: "https://images.pexels.com/photos/18663958/pexels-photo-18663958.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de poisson blanc au citron et au basilic", imageSourceUrl: "https://www.pexels.com/photo/fish-with-lemon-18663958/", imageCredit: "Jacob Yavin" },
  "r-33676118e1": { image: "https://images.pexels.com/photos/19202827/pexels-photo-19202827.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Club sandwich garni de jambon, salade et tomate", imageSourceUrl: "https://www.pexels.com/photo/blt-sandwiches-in-close-up-19202827/", imageCredit: "Nano Erdozain" },
  "r-cd4732688b": { image: "https://images.pexels.com/photos/31109620/pexels-photo-31109620.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes crémeuses aux légumes et herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/creamy-penne-pasta-with-vegetables-31109620/", imageCredit: "Deep Dasgupta" },
  "r-ac41aa7880": { image: "https://images.pexels.com/photos/27612526/pexels-photo-27612526.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson grillé servi avec des pommes de terre et une sauce légère", imageSourceUrl: "https://www.pexels.com/photo/a-plate-with-a-fish-and-potatoes-on-it-27612526/", imageCredit: "Collab Media" },
  "r-d197629970": { image: "https://images.pexels.com/photos/9093555/pexels-photo-9093555.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pêches rôties dorées, nappées de miel et parsemées d’amandes", imageSourceUrl: "https://www.pexels.com/photo/peches-ice-cream-on-top-9093555/", imageCredit: "Matthew Osier" },
  "r-957c974540": { image: "https://images.pexels.com/photos/2494648/pexels-photo-2494648.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet rôti accompagné de légumes colorés dans une assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/cooked-food-on-plate-2494648/", imageCredit: "Nishant Aneja" },
  "r-04b6e91cc3": { image: "https://images.pexels.com/photos/20182302/pexels-photo-20182302.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de poisson accompagné de pommes de terre et de citron", imageSourceUrl: "https://www.pexels.com/photo/potatoes-and-fish-in-a-meal-20182302/", imageCredit: "Valeria Boltneva" },
  "r-178fbace86": { image: "https://images.pexels.com/photos/29535640/pexels-photo-29535640.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap au poulet, avocat et légumes frais", imageSourceUrl: "https://www.pexels.com/photo/fresh-chicken-wrap-with-avocado-and-veggies-29535640/", imageCredit: "Nano Erdozain" },
  "r-b6703781a3": { image: "https://images.pexels.com/photos/36895704/pexels-photo-36895704.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes crémeuses au saumon et brocolis", imageSourceUrl: "https://www.pexels.com/photo/creamy-pasta-with-broccoli-and-salmon-delight-36895704/", imageCredit: "Christina & Peter" },
  "r-17a1ecc3b7": { image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Salade chèvre poulet noix", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-e8952bdaf2": { image: "https://images.pexels.com/photos/7839801/pexels-photo-7839801.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Fruits cuits en morceaux dans un bol, relevés de cannelle", imageSourceUrl: "https://www.pexels.com/photo/sliced-apple-on-bowl-7839801/", imageCredit: "Dimitris Chatzoulis" },
  "r-1aff7d1098": { image: "https://images.pexels.com/photos/21517324/pexels-photo-21517324.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet doré servi avec des légumes colorés", imageSourceUrl: "https://www.pexels.com/photo/fried-chicken-with-mushrooms-and-vegetables-21517324/", imageCredit: "Change C.C" },
  "r-d85f5b4f2c": { image: "https://images.pexels.com/photos/12932683/pexels-photo-12932683.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson cuit accompagné de légumes et de citron", imageSourceUrl: "https://www.pexels.com/photo/dish-with-roasted-fish-and-vegetables-12932683/", imageCredit: "Atlantic Ambience" },
  "r-21c48b02e9": { image: "https://images.pexels.com/photos/364657/pexels-photo-364657.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wraps de courgettes garnis de poulet grillé et d’herbes", imageSourceUrl: "https://www.pexels.com/photo/cooked-food-with-toppings-364657/", imageCredit: "Daniela Elena Tentis" },
  "r-930e6e8673": { image: "https://images.pexels.com/photos/20115313/pexels-photo-20115313.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "One Pot de pâtes au poulet et à la sauce tomate, parsemé de basilic", imageSourceUrl: "https://www.pexels.com/photo/penne-pasta-with-tomato-sauce-and-chicken-20115313/", imageCredit: "Amit Fulwaria" },
  "r-fd1caa9287": { image: "https://images.pexels.com/photos/27672770/pexels-photo-27672770.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pavé de saumon grillé servi avec du riz aux herbes et du citron", imageSourceUrl: "https://www.pexels.com/photo/a-plate-with-salmon-and-rice-on-it-27672770/", imageCredit: "Nadin Sh" },
  "r-0c10d7a1eb": { image: "https://images.pexels.com/photos/16010591/pexels-photo-16010591.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Crumble maison aux pommes et fruits rouges, avec fruits frais", imageSourceUrl: "https://www.pexels.com/photo/delicious-healthy-breakfast-16010591/", imageCredit: "Marlein Topciu" },
  "r-5e225b83b2": { image: "https://images.pexels.com/photos/6952392/pexels-photo-6952392.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Boulettes de poulet aux herbes servies avec des pâtes", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-a-delicious-pasta-on-a-plate-6952392/", imageCredit: "Kaboompics" },
  "r-73692456a3": { image: "https://images.pexels.com/photos/4931409/pexels-photo-4931409.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon doré accompagné de légumes verts et d’une sauce moutarde", imageSourceUrl: "https://www.pexels.com/photo/fried-salmon-on-asparagus-with-honey-mustard-dipping-sauce-4931409/", imageCredit: "Rodrigo Santos" },
  "r-4e7d1bf505": { image: "https://images.pexels.com/photos/27565827/pexels-photo-27565827.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tortillas garnies de poulet, maïs et légumes façon mexicaine", imageSourceUrl: "https://www.pexels.com/photo/two-tortillas-with-chicken-and-corn-on-them-27565827/", imageCredit: "Philippe Alamazani" },
  "r-44d263ba31": { image: "https://images.pexels.com/photos/32125954/pexels-photo-32125954.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gratin de légumes doré au fromage dans un plat blanc", imageSourceUrl: "https://www.pexels.com/photo/cheesy-vegetable-casserole-in-white-baking-dish-32125954/", imageCredit: "Helen Brudna" },
  "r-90aa107c6e": { image: "https://images.pexels.com/photos/32351956/pexels-photo-32351956.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade méditerranéenne au poulet, avocat et légumes frais", imageSourceUrl: "https://www.pexels.com/photo/mexican-chicken-and-avocado-salad-close-up-32351956/", imageCredit: "DΛVΞ GΛRCIΛ" },
  "r-c5820b31fc": { image: "https://images.pexels.com/photos/33312981/pexels-photo-33312981.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Brownie au chocolat gourmand, à la texture fondante", imageSourceUrl: "https://www.pexels.com/photo/delicieux-dessert-brownie-au-chocolat-avec-garnitures-33312981/", imageCredit: "Büşra Yurt" },
  "r-7a4d6998a5": { image: "https://images.pexels.com/photos/12089281/pexels-photo-12089281.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Curry de poulet doux servi dans un bol avec des herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-food-in-a-bowl-12089281/", imageCredit: "Yassir Abbas" },
  "r-0b1d0c5181": { image: "https://images.pexels.com/photos/20330569/pexels-photo-20330569.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "cooked salmon with greens and creamy sauce", imageSourceUrl: "https://www.pexels.com/photo/meal-on-plate-20330569/", imageCredit: "Çisel Bozar" },
  "r-748d34c381": { image: "https://images.pexels.com/photos/15010305/pexels-photo-15010305.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "chicken wrap filled with vegetables and cheese", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-a-burrito-15010305/", imageCredit: "Natan Machado Fotografia Gastronômica" },
  "r-217c20183c": { image: "https://images.pexels.com/photos/39107658/pexels-photo-39107658.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "creamy salmon pasta with tomatoes and greens", imageSourceUrl: "https://www.pexels.com/photo/pates-gourmandes-au-saumon-et-aux-epinards-39107658/", imageCredit: "Lena Netkach" },
  "r-8dc6cb6359": { image: "https://images.pexels.com/photos/15611222/pexels-photo-15611222.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "colorful bowl with vegetables and eggs", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-with-vegetables-and-an-egg-15611222/", imageCredit: "Nadin Sh" },
  "r-d6a6f34570": { image: "https://images.pexels.com/photos/28377761/pexels-photo-28377761.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "cheesecake slice topped with mixed berries", imageSourceUrl: "https://www.pexels.com/photo/delicious-berry-cheesecake-slice-on-a-plate-28377761/", imageCredit: "Zehra K." },
  "r-bf7a581746": { image: "https://images.pexels.com/photos/33795738/pexels-photo-33795738.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "grilled chicken breast served with fresh herbs", imageSourceUrl: "https://www.pexels.com/photo/grilled-chicken-breast-with-herb-garnish-33795738/", imageCredit: "Philippe Alamazani" },
  "r-744f060ece": { image: "https://images.pexels.com/photos/28191271/pexels-photo-28191271.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "cod with vegetables and creamy sauce", imageSourceUrl: "https://www.pexels.com/photo/a-white-plate-with-fish-and-vegetables-on-it-28191271/", imageCredit: "Bingqian Li" },
  "r-046713ed10": { image: "https://images.pexels.com/photos/17780265/pexels-photo-17780265.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "smoked salmon and avocado with fresh greens", imageSourceUrl: "https://www.pexels.com/photo/an-avocado-and-salmon-toast-17780265/", imageCredit: "Nadin Sh" },
  "r-b512566901": { image: "https://images.pexels.com/photos/29535637/pexels-photo-29535637.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "homemade vegetable lasagna with fresh herbs", imageSourceUrl: "https://www.pexels.com/photo/freshly-baked-lasagna-with-herbs-and-vegetables-29535637/", imageCredit: "Nano Erdozain" },
  "r-057205b4c5": { image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Bowl chaud poulet légumes", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-a10bc58641": { image: "https://images.pexels.com/photos/34015064/pexels-photo-34015064.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Crème dessert chocolat onctueuse, vue du dessus sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/elegant-chocolate-dessert-on-white-plate-34015064/", imageCredit: "Surya Ganesh" },
  "r-67637bdf45": { image: "https://images.pexels.com/photos/5713768/pexels-photo-5713768.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Volaille aux champignons et salade, dressage clair", imageSourceUrl: "https://www.pexels.com/photo/cooked-chicken-and-salad-on-creamy-mushrooms-5713768/", imageCredit: "Farhad Ibrahimzade" },
  "r-0c576a3884": { image: "https://images.pexels.com/photos/14269237/pexels-photo-14269237.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saucisses, pommes de terre et chou dans une assiette rustique", imageSourceUrl: "https://www.pexels.com/photo/sausages-and-potatoes-meal-14269237/", imageCredit: "James Servant" },
  "r-e200ae19d3": { image: "https://images.pexels.com/photos/24738508/pexels-photo-24738508.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de nouilles asiatiques au poulet et légumes colorés", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-chicken-noodles-dish-24738508/", imageCredit: "Nadin Sh" },
  "r-ee748aed00": { image: "https://images.pexels.com/photos/12720645/pexels-photo-12720645.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes aux boulettes et sauce tomate sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/a-spaghetti-with-meatballs-on-a-ceramic-plate-12720645/", imageCredit: "Hexuye Ye" },
  "r-131fda95c8": { image: "https://images.pexels.com/photos/15779235/pexels-photo-15779235.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet grillé et concombre frais en vue plongeante", imageSourceUrl: "https://www.pexels.com/photo/meal-on-plate-15779235/", imageCredit: "iPhone Snaps" },
  "r-bd28f91212": { image: "https://images.pexels.com/photos/34636420/pexels-photo-34636420.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bœuf mijoté et légumes colorés sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/delicious-beef-stew-with-vegetables-on-plate-34636420/", imageCredit: "Novkov Visuals" },
  "r-ce9fcc721e": { image: "https://images.pexels.com/photos/9814694/pexels-photo-9814694.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Riz cantonais aux légumes photographié du dessus", imageSourceUrl: "https://www.pexels.com/photo/overhead-shot-of-fried-rice-in-a-bowl-9814694/", imageCredit: "Carlos Lopez" },
  "r-cd7afc007b": { image: "https://images.pexels.com/photos/12557543/pexels-photo-12557543.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assiette de pâtes carbonara vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/overhead-shot-of-a-plate-of-carbonara-12557543/", imageCredit: "Alejandro Aznar" },
  "r-548c345e0f": { image: "https://images.unsplash.com/photo-1585938338392-50a59970d2de?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Assiette orientale houmous poulet", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-db349daa26": { image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Pizza poulet légumes", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-1604da1a6a": { image: "https://images.pexels.com/photos/9027521/pexels-photo-9027521.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Samoussas croustillants et chutneys sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/crunchy-samosa-over-a-ceramic-plate-9027521/", imageCredit: "I Own My Food Art" },
  "r-296b0f4e6d": { image: "https://images.pexels.com/photos/20182311/pexels-photo-20182311.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon nappé de sauce avec brocoli sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-salmon-in-sauce-with-broccoli-20182311/", imageCredit: "Valeria Boltneva" },
  "r-82e5949ca8": { image: "https://images.pexels.com/photos/1618929/pexels-photo-1618929.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Couscous marocain aux légumes servi dans une assiette", imageSourceUrl: "https://www.pexels.com/photo/cooked-dish-1618929/", imageCredit: "Zak Chapman" },
  "r-4b1467579a": { image: "https://images.pexels.com/photos/9883451/pexels-photo-9883451.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Courgettes dorées au fromage, plat clair", imageSourceUrl: "https://www.pexels.com/photo/fried-zucchini-slices-with-cottage-cheese-9883451/", imageCredit: "fatma benli" },
  "r-3366e1335d": { image: "https://images.pexels.com/photos/19051902/pexels-photo-19051902.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de thon et œufs dans un bol en céramique", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-tuna-salad-with-eggs-19051902/", imageCredit: "Nadin Sh" },
  "r-b249d80354": { image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Nouilles chinoises bœuf légumes", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-61050083ca": { image: "https://images.pexels.com/photos/30325091/pexels-photo-30325091.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Steak et frites servis sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/juicy-sliced-beef-steak-with-crispy-fries-30325091/", imageCredit: "Anthony Rahayel" },
  "r-fffc139d41": { image: "https://images.pexels.com/photos/5863621/pexels-photo-5863621.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Boulettes en sauce tomate et riz, vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/white-rice-and-meat-loafs-in-chili-and-tomato-sauce-5863621/", imageCredit: "Rachel Claire" },
  "r-79f9f3b7c4": { image: "https://images.pexels.com/photos/34636423/pexels-photo-34636423.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pommes de terre et lardons dorés sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/gourmet-bacon-and-potato-dish-on-white-plate-34636423/", imageCredit: "Novkov Visuals" },
  "r-85fc3629ae": { image: "https://images.pexels.com/photos/24738519/pexels-photo-24738519.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet sauté aux légumes et riz", imageSourceUrl: "https://www.pexels.com/photo/chicken-with-rice-with-sesame-seeds-and-vegetables-24738519/", imageCredit: "Nadin Sh" },
  "r-c6e74462e7": { image: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Gratin courgettes ricotta jambon", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-0487b25e70": { image: "https://images.pexels.com/photos/29849803/pexels-photo-29849803.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Toast au saumon fumé et fromage frais", imageSourceUrl: "https://www.pexels.com/photo/delicious-smoked-salmon-on-toast-with-cream-cheese-29849803/", imageCredit: "Sara Free" },
  "r-970c91ba88": { image: "https://images.pexels.com/photos/37045066/pexels-photo-37045066.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet aux champignons et sauce légère", imageSourceUrl: "https://www.pexels.com/photo/gourmet-chicken-dish-with-mushrooms-and-greens-37045066/", imageCredit: "Nadin Sh" },
  "r-5c7f347d45": { image: "https://images.pexels.com/photos/10078271/pexels-photo-10078271.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet épicé en sauce avec riz", imageSourceUrl: "https://www.pexels.com/photo/cooked-food-on-stainless-steel-bowl-10078271/", imageCredit: "Saveurs Secretes" },
  "r-8ff611b414": { image: "https://images.pexels.com/photos/15813476/pexels-photo-15813476.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes crémeuses aux tomates et basilic", imageSourceUrl: "https://www.pexels.com/photo/delicious-pasta-on-plate-on-table-15813476/", imageCredit: "Dextar Studio" },
  "r-d54ee232e0": { image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Bowl grec poulet feta houmous", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-9c0c81424f": { image: "https://images.pexels.com/photos/18674110/pexels-photo-18674110.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Ravioles nappées de sauce crémeuse", imageSourceUrl: "https://www.pexels.com/photo/ravioli-served-in-sauce-with-cream-18674110/", imageCredit: "Nadin Sh" },
  "r-50e9f84517": { image: "https://images.pexels.com/photos/14866629/pexels-photo-14866629.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Chili con carne maison", imageSourceUrl: "https://www.pexels.com/photo/hand-holding-a-bowl-with-chilli-con-carne-14866629/", imageCredit: "Nadin Sh" },
  "r-b90dd4f2c7": { image: "https://images.pexels.com/photos/4765652/pexels-photo-4765652.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tortilla espagnole aux pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/overhead-shot-of-a-slice-of-spanish-omelet-4765652/", imageCredit: "Maxi Gagliano" },
  "r-86fb2988d0": { image: "https://images.pexels.com/photos/32604529/pexels-photo-32604529.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Chou farci maison", imageSourceUrl: "https://www.pexels.com/photo/stuffed-cabbage-rolls-on-a-plate-traditional-dish-32604529/", imageCredit: "Nour Alhoda" },
  "r-934c884001": { image: "https://images.pexels.com/photos/5638532/pexels-photo-5638532.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Plat de poisson et pommes de terre crémeuses", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-fish-meal-on-plate-5638532/", imageCredit: "Shameel mukkath" },
  "r-fdf3b6311b": { image: "https://images.pexels.com/photos/6223230/pexels-photo-6223230.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes ricotta, tomates et basilic", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-delicious-food-6223230/", imageCredit: "Antonius Ferret" },
  "r-f8fd15f1a2": { image: "https://images.pexels.com/photos/37279731/pexels-photo-37279731.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Riz sauté thaï au poulet et œuf", imageSourceUrl: "https://www.pexels.com/photo/delicious-thai-fried-chicken-with-rice-and-eggs-37279731/", imageCredit: "Josh Eleazar" },
  "r-fcac441e35": { image: "https://images.pexels.com/photos/36061358/pexels-photo-36061358.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Steak grillé et légumes rôtis", imageSourceUrl: "https://www.pexels.com/photo/grilled-beef-steak-with-vegetables-and-sauce-36061358/", imageCredit: "Nadin Sh" },
  "r-6e0eb13534": { image: "https://images.pexels.com/photos/28734803/pexels-photo-28734803.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Verrines de yaourt aux fruits rouges", imageSourceUrl: "https://www.pexels.com/photo/delicious-berry-and-yogurt-parfaits-with-granola-28734803/", imageCredit: "Giordano" },
  "r-76033d4d4b": { image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Wrap chaud poulet St Môret", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-55df4a046d": { image: "https://images.pexels.com/photos/24778216/pexels-photo-24778216.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet grillé et légumes en bol", imageSourceUrl: "https://www.pexels.com/photo/chicken-and-rice-in-a-bowl-24778216/", imageCredit: "Ayat Shahin" },
  "r-b17bf4bbeb": { image: "https://images.pexels.com/photos/5555791/pexels-photo-5555791.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de courgettes onctueux", imageSourceUrl: "https://www.pexels.com/photo/person-pouring-soup-on-white-ceramic-bowl-5555791/", imageCredit: "Bert Christiaens" },
  "r-7715637c6c": { image: "https://images.pexels.com/photos/36546509/pexels-photo-36546509.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce tomate maison en préparation", imageSourceUrl: "https://www.pexels.com/photo/homemade-tomato-sauce-canning-process-36546509/", imageCredit: "Valentina Sergi" },

  "r-190641843a": { image: "https://images.pexels.com/photos/27588117/pexels-photo-27588117.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Purée de carottes et pommes de terre maison", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-food-with-carrots-and-onions-27588117/", imageCredit: "Collab Media" },
  "r-627302c625": { image: "https://images.pexels.com/photos/35712528/pexels-photo-35712528.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs cocotte aux herbes servis au brunch", imageSourceUrl: "https://www.pexels.com/photo/elegant-outdoor-brunch-with-baked-eggs-35712528/", imageCredit: "Will Worsham" },
  "r-505f3338a3": { image: "https://images.pexels.com/photos/31779539/pexels-photo-31779539.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Risotto crémeux aux champignons et parmesan", imageSourceUrl: "https://www.pexels.com/photo/delicious-mushroom-risotto-with-parmesan-cheese-31779539/", imageCredit: "Adriano Bragi" },
  "r-9b996df25a": { image: "https://images.pexels.com/photos/26424747/pexels-photo-26424747.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe à l’oignon gratinée façon bistrot", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-meal-26424747/", imageCredit: "Laura Paredis" },
  "r-4ce28d774d": { image: "https://images.pexels.com/photos/14056735/pexels-photo-14056735.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Crème dessert au chocolat servie en verrine", imageSourceUrl: "https://www.pexels.com/photo/ice-cream-in-glass-14056735/", imageCredit: "Ioana Motoc" },
  "r-8c62c53b61": { image: "https://images.pexels.com/photos/8896835/pexels-photo-8896835.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Compote de pommes et cannelle maison", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-jar-of-apple-sauce-8896835/", imageCredit: "Mara Cotta" },
  "r-4d5e2c63aa": { image: "https://images.pexels.com/photos/35057730/pexels-photo-35057730.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pile de crêpes maison dorées", imageSourceUrl: "https://www.pexels.com/photo/stack-of-fresh-homemade-crepes-on-plate-35057730/", imageCredit: "Natalia S" },
  "r-f1352e28e6": { image: "https://images.pexels.com/photos/33658045/pexels-photo-33658045.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pain complet maison aux graines", imageSourceUrl: "https://www.pexels.com/photo/fresh-homemade-bread-with-seeds-on-top-close-up-33658045/", imageCredit: "Anhelina Vasylyk" },
  "r-1aff5ca09b": { image: "https://images.pexels.com/photos/8392459/pexels-photo-8392459.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Part de lasagnes bolognaises maison", imageSourceUrl: "https://www.pexels.com/photo/lasagna-putting-on-white-plate-8392459/", imageCredit: "Anna Guerrero" },
  "r-21c5d3d2ba": { image: "https://images.pexels.com/photos/35156470/pexels-photo-35156470.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Blanquette de poulet mijotée aux légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-chicken-stew-with-potatoes-and-herbs-35156470/", imageCredit: "Muhammad Khawar Nazir" },
  "r-24aeaed5b9": { image: "https://images.pexels.com/photos/15881322/pexels-photo-15881322.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Chili con carne maison aux haricots rouges", imageSourceUrl: "https://www.pexels.com/photo/chili-con-carne-stew-15881322/", imageCredit: "Julias Torten und Törtchen" },
  "r-52e8e85167": { image: "https://images.pexels.com/photos/23897674/pexels-photo-23897674.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Curry de poulet servi avec du riz", imageSourceUrl: "https://www.pexels.com/photo/curry-chicken-in-bowl-on-table-23897674/", imageCredit: "Dee Dave" },
  "r-ed96c4899e": { image: "https://images.pexels.com/photos/7474079/pexels-photo-7474079.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson accompagné d’une purée de pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-fish-dish-7474079/", imageCredit: "Valeria Boltneva" },
  "r-3ad7aa939f": { image: "https://images.pexels.com/photos/38722282/pexels-photo-38722282.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poivrons farcis au riz", imageSourceUrl: "https://www.pexels.com/photo/delicious-stuffed-bell-peppers-with-walnuts-38722282/", imageCredit: "fewmiracles" },
  "r-f5d1d509b0": { image: "https://images.pexels.com/photos/38934831/pexels-photo-38934831.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Boulettes maison nappées de sauce tomate", imageSourceUrl: "https://www.pexels.com/photo/delicious-meatballs-on-rice-with-tomato-sauce-38934831/", imageCredit: "FOX" },
  "r-34ef9f1b64": { image: "https://images.pexels.com/photos/34985106/pexels-photo-34985106.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gratin dauphinois doré et fondant", imageSourceUrl: "https://www.pexels.com/photo/golden-baked-potato-gratin-in-ceramic-dish-34985106/", imageCredit: "Golboo Maghooli" },
  "r-415aece0d7": { image: "https://images.pexels.com/photos/7474370/pexels-photo-7474370.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Quiche maison dorée servie avec des herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/tasty-quiche-on-plate-with-greens-in-restaurant-7474370/", imageCredit: "Valeria Boltneva" },
  "r-185194203e": { image: "https://images.pexels.com/photos/40590586/pexels-photo-40590586.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâte à pizza maison fraîchement étalée", imageSourceUrl: "https://www.pexels.com/photo/homemade-pizza-dough-preparation-process-40590586/", imageCredit: "Semanur Çoban" },
  "r-0f4e91c956": { image: "https://images.pexels.com/photos/26898062/pexels-photo-26898062.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pancakes protéinés aux fruits rouges", imageSourceUrl: "https://www.pexels.com/photo/stack-of-pancakes-with-strawberries-and-powdered-sugar-26898062/", imageCredit: "Alena Evseenko" },
  "r-14aa59c57e": { image: "https://images.pexels.com/photos/26272302/pexels-photo-26272302.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Part de gâteau au yaourt maison", imageSourceUrl: "https://www.pexels.com/photo/yogurt-cake-with-cherries-26272302/", imageCredit: "Pervane Mustafa27" },

  "r-0afd842152": { image: "https://images.pexels.com/photos/34474034/pexels-photo-34474034.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Part de flan pâtissier maison à la crème", imageSourceUrl: "https://www.pexels.com/photo/delicious-slice-of-creamy-flan-dessert-34474034/", imageCredit: "Laura oliveira" },
  "r-e6ef289c1b": { image: "https://images.pexels.com/photos/6261274/pexels-photo-6261274.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mousse au chocolat onctueuse en verrine", imageSourceUrl: "https://www.pexels.com/photo/chocolate-mousse-in-tall-glass-6261274/", imageCredit: "Eva Bronzini" },
  "r-1c4329d6f0": { image: "https://images.pexels.com/photos/37103257/pexels-photo-37103257.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet aux poivrons façon basquaise", imageSourceUrl: "https://www.pexels.com/photo/delicious-thai-basil-chicken-dish-on-plate-37103257/", imageCredit: "Kevin Early" },
  "r-b8c81518b8": { image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Blanquette de veau", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-8250ffc152": { image: "https://images.pexels.com/photos/33060392/pexels-photo-33060392.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Porc rôti accompagné de moutarde", imageSourceUrl: "https://www.pexels.com/photo/hearty-bavarian-pork-knuckle-dinner-at-a-restaurant-33060392/", imageCredit: "Max W" },
  "r-4b8db26421": { image: "https://images.pexels.com/photos/34636462/pexels-photo-34636462.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bœuf bourguignon mijoté aux légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-beef-stew-with-vegetables-on-plate-34636462/", imageCredit: "Novkov Visuals" },
  "r-7d7c6a6118": { image: "https://images.pexels.com/photos/37271311/pexels-photo-37271311.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saucisses mijotées façon orientale", imageSourceUrl: "https://www.pexels.com/photo/traditional-sauerkraut-stew-with-sausage-in-bowl-37271311/", imageCredit: "Veronika Benz" },
  "r-806ae50db7": { image: "https://images.pexels.com/photos/36916123/pexels-photo-36916123.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Couscous maison à l’agneau et aux légumes", imageSourceUrl: "https://www.pexels.com/photo/traditional-moroccan-couscous-with-lamb-and-vegetables-36916123/", imageCredit: "BOCHRA bouneb" },
  "r-cf3eca399d": { image: "https://images.pexels.com/photos/20505440/pexels-photo-20505440.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon nappé d’une sauce crémeuse", imageSourceUrl: "https://www.pexels.com/photo/fish-in-bowl-on-plate-20505440/", imageCredit: "Valeria Boltneva" },
  "r-7ac321af8c": { image: "https://images.pexels.com/photos/12653398/pexels-photo-12653398.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de poisson aux tomates et herbes provençales", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-gourmet-meal-12653398/", imageCredit: "Sylwester Ficek" },
  "r-cac89622a2": { image: "https://images.pexels.com/photos/6248797/pexels-photo-6248797.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce bolognaise maison en train de mijoter", imageSourceUrl: "https://www.pexels.com/photo/crop-person-stirring-tomato-sauce-against-meatballs-in-kitchen-6248797/", imageCredit: "Gary Barnes" },
  "r-ff99d9e090": { image: "https://images.pexels.com/photos/40135526/pexels-photo-40135526.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Dahl de lentilles corail aux épices", imageSourceUrl: "https://www.pexels.com/photo/delicious-red-lentil-soup-with-croutons-and-lemon-40135526/", imageCredit: "mehmetakifarts" },
  "r-538fe567c8": { image: "https://images.pexels.com/photos/34439457/pexels-photo-34439457.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Riz cantonais sauté aux œufs et légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-fried-rice-breakfast-bowl-with-egg-34439457/", imageCredit: "Jb Moordiana" },
  "r-5896f01ad1": { image: "https://images.pexels.com/photos/36878063/pexels-photo-36878063.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Paëlla maison aux fruits de mer dans sa poêle", imageSourceUrl: "https://www.pexels.com/photo/delicious-homemade-seafood-paella-in-pan-36878063/", imageCredit: "Zakhar Vozhdaienko" },
  "r-3a7b357b85": { image: "https://images.pexels.com/photos/5662123/pexels-photo-5662123.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de courge onctueux aux graines", imageSourceUrl: "https://www.pexels.com/photo/a-close-up-shot-of-a-bowl-of-pumpkin-soup-5662123/", imageCredit: "KATRIN BOLOVTSOVA" },
  "r-45b3ac4798": { image: "https://images.pexels.com/photos/34429656/pexels-photo-34429656.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de tomate au basilic dans un bol blanc", imageSourceUrl: "https://www.pexels.com/photo/bowl-of-creamy-tomato-soup-with-herbs-34429656/", imageCredit: "Iulian Sandu" },
  "r-089cee7987": { image: "https://images.pexels.com/photos/34429655/pexels-photo-34429655.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de carottes crémeux aux herbes", imageSourceUrl: "https://www.pexels.com/photo/creamy-carrot-soup-with-fresh-herbs-34429655/", imageCredit: "Iulian Sandu" },
  "r-2ca8d6a24c": { image: "https://images.pexels.com/photos/32795463/pexels-photo-32795463.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de courgettes aux herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/delicious-vegetable-soup-in-rustic-setting-32795463/", imageCredit: "Helen Brudna" },
  "r-425ae8fe60": { image: "https://images.pexels.com/photos/11865617/pexels-photo-11865617.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe à l’oignon gratinée au fromage", imageSourceUrl: "https://www.pexels.com/photo/soup-with-cheese-and-meat-11865617/", imageCredit: "Lisa Kostina" },
  "r-e79335a6fc": { image: "https://images.pexels.com/photos/39927557/pexels-photo-39927557.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de champignons aux herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/creamy-mushroom-soup-with-fresh-garnish-39927557/", imageCredit: "Jahra Tasfia Reza" },

  "r-1e76dc3c99": { image: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Œufs mimosa", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-4eb3e0935b": { image: "https://images.pexels.com/photos/5836630/pexels-photo-5836630.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Plat salé gratiné aux légumes et au fromage", imageSourceUrl: "https://www.pexels.com/photo/5836630/", imageCredit: "ROMAN ODINTSOV" },
  "r-1a027a4e41": { image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Crêpes salées", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-bc488517c3": { image: "https://images.pexels.com/photos/5531292/pexels-photo-5531292.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Plat mijoté avec pommes de terre fondantes", imageSourceUrl: "https://www.pexels.com/photo/5531292/", imageCredit: "Rachel Claire" },
  "r-28a62501be": { image: "https://images.pexels.com/photos/23384616/pexels-photo-23384616.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mélange de légumes et pois chiches frais", imageSourceUrl: "https://www.pexels.com/photo/23384616/", imageCredit: "Adrianna CA" },
  "r-de1aff336d": { image: "https://images.pexels.com/photos/15529479/pexels-photo-15529479.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de tomate onctueuse et colorée", imageSourceUrl: "https://www.pexels.com/photo/15529479/", imageCredit: "ALINA MATVEYCHEVA" },
  "r-cca632b0a5": { image: "https://images.pexels.com/photos/8697516/pexels-photo-8697516.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes nappées d’une sauce crémeuse", imageSourceUrl: "https://www.pexels.com/photo/8697516/", imageCredit: "Farhad Ibrahimzade" },
  "r-9d21738040": { image: "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Pesto maison basilic", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-7e83748f10": { image: "https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assortiment de légumes frais pour ratatouille", imageSourceUrl: "https://www.pexels.com/photo/flat-lay-photography-of-variety-of-vegetables-1435904/", imageCredit: "Engin Akyurt" },
  "r-f7eaf272ce": { image: "https://images.unsplash.com/photo-1590412200988-a436bb705300?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Œufs shakshuka", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-0ead00f1d6": { image: "https://images.unsplash.com/photo-1607532941433-304659e8198a?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Fondue de poireaux", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-5a33ccfcfe": { image: "https://images.pexels.com/photos/37286900/pexels-photo-37286900.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol coloré de légumes et sauce légère", imageSourceUrl: "https://www.pexels.com/photo/37286900/", imageCredit: "casa lalla takerkoust" },
  "r-63725d1501": { image: "https://images.pexels.com/photos/8896839/pexels-photo-8896839.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Confiture et compotée maison en bocal", imageSourceUrl: "https://www.pexels.com/photo/8896839/", imageCredit: "Mara Cotta" },
  "r-e585033a15": { image: "https://images.pexels.com/photos/17628617/pexels-photo-17628617.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Plat chaud à la poêle avec sauce crémeuse", imageSourceUrl: "https://www.pexels.com/photo/17628617/", imageCredit: "Valeria Boltneva" },
  "r-e0673ba2c7": { image: "https://images.pexels.com/photos/5779899/pexels-photo-5779899.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Préparation maison fruitée et brillante", imageSourceUrl: "https://www.pexels.com/photo/5779899/", imageCredit: "RDNE Stock project" },
  "r-520e2105e0": { image: "https://images.pexels.com/photos/10003794/pexels-photo-10003794.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Préparation maison onctueuse dans un bol", imageSourceUrl: "https://www.pexels.com/photo/10003794/", imageCredit: "Karen Laårk Boshoff" },
  "r-8fba3255e5": { image: "https://images.pexels.com/photos/32153515/pexels-photo-32153515.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Courgettes grillées et légumes dorés", imageSourceUrl: "https://www.pexels.com/photo/32153515/", imageCredit: "Ahmet ÇÖTÜR" },
  "r-127e5d9b9c": { image: "https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Flan salé aux légumes", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },
  "r-2d1e6933e4": { image: "https://images.pexels.com/photos/8392454/pexels-photo-8392454.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet rôti doré accompagné de légumes", imageSourceUrl: "https://www.pexels.com/photo/8392454/", imageCredit: "Anna Guerrero" },
  "r-6a536a8796": { image: "https://images.unsplash.com/photo-1571266028243-e4bb33394de9?auto=format&fit=crop&w=800&h=800&q=85", imageAlt: "Sauce skyr citron", imageSourceUrl: "https://unsplash.com", imageCredit: "Unsplash" },

  "r-0aff2c7b56": { image: "https://images.unsplash.com/photo-1470338950318-40320a722782?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Légumes rôtis servis dans une assiette blanche", imageSourceUrl: "https://unsplash.com/photos/vegetable-dish-on-white-plate-oFljzK61O1s", imageCredit: "Adam Jaime" },
  "r-01dfb0c638": { image: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de yaourt frais avec citron et herbes", imageSourceUrl: "https://unsplash.com/photos/a-bowl-of-yogurt-with-a-spoon-in-it-NFHeBysjCTI", imageCredit: "micheile henderson" },
  "r-ed136e86f9": { image: "https://images.unsplash.com/photo-1672372536975-c2da9648f64a?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce blanche au yaourt et aux herbes dans un bol", imageSourceUrl: "https://unsplash.com/photos/a-bowl-of-yogurt-with-a-sprig-of-rosemary-7BxTglPGu4o", imageCredit: "Tuyen Vo" },
  "r-d810d08dfd": { image: "https://images.pexels.com/photos/33674388/pexels-photo-33674388/free-photo-of-delicious-caesar-salad-with-croutons.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade César fraîche avec croûtons et parmesan dans un bol blanc", imageSourceUrl: "https://www.pexels.com/photo/delicious-caesar-salad-with-croutons-33674388/", imageCredit: "pedro furtado" },
  "r-f057cd27f7": { image: "https://images.unsplash.com/photo-1683264039250-11a08b0487f5?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce jaune onctueuse dans un petit bol", imageSourceUrl: "https://unsplash.com/photos/a-bowl-filled-with-yellow-sauce-on-top-of-a-table-yGVumM-S4Jg", imageCredit: "Zhang liven" },
  "r-be34bab262": { image: "https://images.unsplash.com/photo-1591120583691-49d2741e55da?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tzatziki et houmous servis dans un bol en céramique", imageSourceUrl: "https://unsplash.com/photos/white-ceramic-bowl-with-yellow-and-green-dish-kQloRmVQYIs", imageCredit: "Mor Shani" },
  "r-ed67aa8240": { image: "https://images.pexels.com/photos/18530635/pexels-photo-18530635/free-photo-of-fries-with-choice-of-sauces.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauces à tremper présentées en petits bols sur fond blanc", imageSourceUrl: "https://www.pexels.com/photo/fries-with-choice-of-sauces-18530635/", imageCredit: "Click Jeth" },
  "r-711331ddec": { image: "https://images.unsplash.com/photo-1575919159574-e49dc9e1228f?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce rouge maison servie dans un bol", imageSourceUrl: "https://unsplash.com/photos/bowl-with-sauce-fpEJSJ9mxAw", imageCredit: "jaikishan patel" },
  "r-e85586d79b": { image: "https://images.unsplash.com/photo-1755356335951-a6a53011ef45?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pot de pesto au basilic avec tomates et pignons", imageSourceUrl: "https://unsplash.com/fr/photos/pot-de-pesto-au-basilic-tomates-pignons-de-pin-et-fromage-uZztg6mXtlA", imageCredit: "Lisa Wolters" },
  "r-1ff349ef48": { image: "https://images.unsplash.com/photo-1631311695255-8dde6bf96cb5?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de légumes frais accompagné de sauce", imageSourceUrl: "https://unsplash.com/photos/a-bowl-filled-with-vegetables-and-dressing-next-to-a-glass-of-milk-Pqt1yIF-Fw0", imageCredit: "Caroline Green" },
  "r-a4f8af9be1": { image: "https://images.unsplash.com/photo-1771089278772-7ad0d9c03f2f?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol crémeux aux champignons et au persil", imageSourceUrl: "https://unsplash.com/photos/bowl-of-creamy-mushroom-soup-with-garnish-on-table-GjwUs-RRzYk", imageCredit: "David Todd McCarty" },
  "r-b07360fd58": { image: "https://images.unsplash.com/photo-1737113558898-283f21bfcaa7?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de sauce tomate maison", imageSourceUrl: "https://unsplash.com/photos/a-bowl-of-tomato-sauce-sitting-on-a-table-59qT6GuXlYk", imageCredit: "Roman Hnydin" },
  "r-8cfb8fe28b": { image: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce tomate fraîche avec tomates et persil", imageSourceUrl: "https://unsplash.com/photos/tomato-and-tomato-puree-with-parsley-in-bowl-FzB_512zvP0", imageCredit: "Dennis Klein" },
  "r-597a60e2de": { image: "https://images.unsplash.com/photo-1517244906-fa053b624b06?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce blanche crémeuse dans un bol", imageSourceUrl: "https://unsplash.com/photos/food-with-white-sauce-in-gray-bowl-gVOvZFcYBMY", imageCredit: "Odiseo Castrejon" },
  "r-e692c705a1": { image: "https://images.pexels.com/photos/15611223/pexels-photo-15611223/free-photo-of-soup-in-bowl-on-table.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gnocchis nappés de sauce crémeuse aux champignons", imageSourceUrl: "https://www.pexels.com/photo/soup-in-bowl-on-table-15611223/", imageCredit: "Nadin Sh" },
  "r-23de17a7d0": { image: "https://images.unsplash.com/photo-1772730064951-89b427965dbc?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de tikka masala crémeux avec menthe fraîche", imageSourceUrl: "https://unsplash.com/photos/a-bowl-of-creamy-chicken-tikka-masala-with-mint-leaves-GOw8q6bRTRM", imageCredit: "Mohammad Fahim" },
  "r-e91edd3409": { image: "https://images.unsplash.com/photo-1517314597476-e1788060b6cb?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Plat marocain en bol façon tajine", imageSourceUrl: "https://unsplash.com/photos/flavored-food-on-bowl-beside-plate-on-top-of-table-wGzO3Qvp98Q", imageCredit: "Annie Spratt" },
  "r-a699ffc3fe": { image: "https://images.pexels.com/photos/10075980/pexels-photo-10075980.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce curry verte avec épices et ail", imageSourceUrl: "https://www.pexels.com/photo/curry-soup-served-in-a-kitchen-10075980/", imageCredit: "Noemí Jiménez" },
  "r-c10747f72a": { image: "https://images.unsplash.com/photo-1524257062421-04872383ea43?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce bolognaise à la viande hachée dans un bol", imageSourceUrl: "https://unsplash.com/photos/white-ceramic-bowl-with-brown-scoope-6S27S6pZ6o0", imageCredit: "Jennifer Pallian" },
  "r-8f0b77a830": { image: "https://images.unsplash.com/photo-1560434019-4558f9a9e2a1?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes carbonara avec sauce crémeuse", imageSourceUrl: "https://unsplash.com/photos/bowl-of-pasta-QuFm328PV88", imageCredit: "Pinar Kucuk" },
  "r-5d0275bd29": { image: "https://images.pexels.com/photos/18363031/pexels-photo-18363031.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Préparation crémeuse blanche avec légumes frais dans un bol", imageSourceUrl: "https://www.pexels.com/photo/meal-in-bowl-18363031/", imageCredit: "Nadin Sh" },
  "r-0f052d9c9b": { image: "https://images.pexels.com/photos/29908848/pexels-photo-29908848.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assortiment de sauces et dips méditerranéens en petits bols", imageSourceUrl: "https://www.pexels.com/photo/assorted-dips-in-decorative-bowls-on-wooden-board-29908848/", imageCredit: "Snappr" },
  "r-66e7b3d12b": { image: "https://images.pexels.com/photos/8992935/pexels-photo-8992935.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce épicée servie dans un petit bol en verre", imageSourceUrl: "https://www.pexels.com/photo/green-dumplings-with-sauce-8992935/", imageCredit: "I Own My Food Art" },
  "r-3377862991": { image: "https://images.pexels.com/photos/8053728/pexels-photo-8053728.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce blanche crémeuse aux herbes, ail et olives dans un bol", imageSourceUrl: "https://www.pexels.com/photo/a-flatlay-of-a-white-sauce-in-a-glass-bowl-8053728/", imageCredit: "Demian Grygorchuk" },
  "r-b0d7f88c40": { image: "https://images.pexels.com/photos/5899669/pexels-photo-5899669.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Petits bols de sauces variées présentés sur fond clair", imageSourceUrl: "https://www.pexels.com/photo/hand-touching-sauce-in-small-bowl-5899669/", imageCredit: "cottonbro studio" },
  "r-ffab58c92c": { image: "https://images.pexels.com/photos/25813798/pexels-photo-25813798.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de sauce moutarde crémeuse", imageSourceUrl: "https://www.pexels.com/photo/creamy-food-in-bowl-25813798/", imageCredit: "Merve" },
  "r-0a4deb6e49": { image: "https://images.pexels.com/photos/9213857/pexels-photo-9213857.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Vinaigrette versée sur des crudités fraîches", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-a-person-pouring-salad-dressing-into-vegetables-9213857/", imageCredit: "Loren Castillo" },
  "r-81a47c2b6e": { image: "https://images.pexels.com/photos/20185222/pexels-photo-20185222.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce verte aux herbes fraîchement versée dans un bol", imageSourceUrl: "https://www.pexels.com/photo/hand-pouring-sauce-to-food-in-bowl-20185222/", imageCredit: "Filipp Romanovski" },
  "r-f3c93751c3": { image: "https://images.pexels.com/photos/20230770/pexels-photo-20230770.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sélection de petits bols de mezzés et de préparations à tartiner", imageSourceUrl: "https://www.pexels.com/photo/bowls-with-food-20230770/", imageCredit: "Sami Abdullah" },
  "r-0f5bc800ca": { image: "https://images.pexels.com/photos/5899670/pexels-photo-5899670.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Vue du dessus de plusieurs sauces et dips dans des bols", imageSourceUrl: "https://www.pexels.com/photo/top-view-of-bowls-with-different-sauces-5899670/", imageCredit: "cottonbro studio" },
  "r-5e0d4a15ca": { image: "https://images.pexels.com/photos/7214482/pexels-photo-7214482.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce crémeuse aux fines herbes et à la ciboulette dans un bol", imageSourceUrl: "https://www.pexels.com/photo/photo-of-bread-near-tartar-sauce-7214482/", imageCredit: "Hanna Pad" },
  "r-f505361e63": { image: "https://images.pexels.com/photos/15781256/pexels-photo-15781256.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Préparation verte à l’avocat et aux herbes vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/soup-with-avocado-15781256/", imageCredit: "Nadin Sh" },
  "r-7404843379": { image: "https://images.pexels.com/photos/5604824/pexels-photo-5604824.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pesto maison au basilic dans un pot avec ail et feuilles fraîches", imageSourceUrl: "https://www.pexels.com/photo/pesto-sauce-in-glass-jar-with-basil-leaves-5604824/", imageCredit: "thea a" },
  "r-d34e4eb000": { image: "https://images.pexels.com/photos/6419580/pexels-photo-6419580.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assortiment de dips crémeux et de sauces maison", imageSourceUrl: "https://www.pexels.com/photo/person-holding-various-hummus-6419580/", imageCredit: "Polina Tankilevitch" },
  "r-85d0dcbaa2": { image: "https://images.pexels.com/photos/29935191/pexels-photo-29935191.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Petits bols de sauces et condiments présentés avec des accompagnements", imageSourceUrl: "https://www.pexels.com/photo/assorted-platter-with-fried-chicken-and-sauces-29935191/", imageCredit: "khezez" },
  "r-89cac3eec0": { image: "https://images.pexels.com/photos/15627900/pexels-photo-15627900.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce tomate maison dans un plat blanc avec basilic frais", imageSourceUrl: "https://www.pexels.com/photo/plate-with-tomato-sauce-on-table-15627900/", imageCredit: "Rene Strgar" },
  "r-89c1a2bc15": { image: "https://images.pexels.com/photos/18354019/pexels-photo-18354019.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salsa et pesto frais dans des bols blancs vus du dessus", imageSourceUrl: "https://www.pexels.com/photo/spoon-and-bowls-18354019/", imageCredit: "Stephen Leonardi" },
  "r-4356461b3b": { image: "https://images.pexels.com/photos/20809056/pexels-photo-20809056.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Champignons crémeux nappés d’une sauce à l’ail et aux herbes", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-soup-with-mushrooms-20809056/", imageCredit: "Patrick" },
  "r-42d55c2112": { image: "https://images.pexels.com/photos/17869140/pexels-photo-17869140.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce au yaourt et chutney aux herbes servis en petits bols", imageSourceUrl: "https://www.pexels.com/photo/plate-of-small-uttapam-17869140/", imageCredit: "Lunarly" },
  "r-a2385c8974": { image: "https://images.pexels.com/photos/38648778/pexels-photo-38648778.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce verte fraîche servie à côté d’un plat de fruits de mer", imageSourceUrl: "https://www.pexels.com/photo/delicious-seafood-medley-of-prawns-and-clams-38648778/", imageCredit: "JuJu" },
  "r-6116939142": { image: "https://images.pexels.com/photos/7166546/pexels-photo-7166546.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce rouge épicée servie dans un bol avec une cuillère", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-a-chili-sauce-on-a-bowl-7166546/", imageCredit: "Teja J" },
  "r-a46551cd3f": { image: "https://images.pexels.com/photos/9606133/pexels-photo-9606133.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce maison préparée pour garnir un burger", imageSourceUrl: "https://www.pexels.com/photo/man-preparing-sauce-for-hamburger-9606133/", imageCredit: "Airam Dato-on" },
  "r-08d99317f5": { image: "https://images.pexels.com/photos/10489233/pexels-photo-10489233.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce tomate généreuse pour une bolognaise familiale", imageSourceUrl: "https://www.pexels.com/photo/meal-with-pasta-and-sauce-10489233/", imageCredit: "Jana Ohajdova" },
  "r-68d1f430fd": { image: "https://images.pexels.com/photos/14537690/pexels-photo-14537690.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Curry crémeux aux épices et aux herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-dish-with-sauce-14537690/", imageCredit: "Cristian Mihaila" },
  "r-0b46f44a1f": { image: "https://images.pexels.com/photos/5250392/pexels-photo-5250392.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Dip de poivrons rouges servi dans un petit bol en céramique", imageSourceUrl: "https://www.pexels.com/photo/stuffed-peppers-and-dip-served-on-ceramic-plates-5250392/", imageCredit: "Kate" },
  "r-35f255bf02": { image: "https://images.pexels.com/photos/13991930/pexels-photo-13991930.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce fromagère crémeuse servie avec des frites", imageSourceUrl: "https://www.pexels.com/photo/woman-eating-french-fries-with-sauce-13991930/", imageCredit: "Nadin Sh" },
  "r-ac143ab639": { image: "https://images.pexels.com/photos/8477053/pexels-photo-8477053.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Huile d’olive versée sur du poulet cru pour la marinade", imageSourceUrl: "https://www.pexels.com/photo/a-food-preparation-photo-8477053/", imageCredit: "Los Muertos Crew" },
  "r-aef573f3e9": { image: "https://images.pexels.com/photos/11703280/pexels-photo-11703280.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assortiment coloré d’épices pour une marinade Tex-Mex", imageSourceUrl: "https://www.pexels.com/photo/assorted-herbs-and-spices-in-the-market-11703280/", imageCredit: "Nishant Aneja" },
  "r-504ccafb94": { image: "https://images.pexels.com/photos/9219083/pexels-photo-9219083.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet préparé avec citron et romarin pour une marinade grecque", imageSourceUrl: "https://www.pexels.com/photo/cooking-chicken-with-herbs-9219083/", imageCredit: "Loren Castillo" },
  "r-298329f096": { image: "https://images.pexels.com/photos/9814566/pexels-photo-9814566.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce barbecue et ingrédients pour une marinade fumée", imageSourceUrl: "https://www.pexels.com/photo/burger-on-brown-wooden-table-9814566/", imageCredit: "carlos lopez" },
  "r-71976bc5c2": { image: "https://images.pexels.com/photos/7353380/pexels-photo-7353380.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet aux épices indiennes avec herbes fraîches et citron vert", imageSourceUrl: "https://www.pexels.com/photo/biryani-de-poulet-frit-avec-citrons-et-poivrons-7353380/", imageCredit: "Chait Goli" },
  "r-6536cd83a4": { image: "https://images.pexels.com/photos/12732556/pexels-photo-12732556.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bœuf mariné aux herbes et aux épices vu du dessus", imageSourceUrl: "https://www.pexels.com/photo/close-up-photography-of-marinated-meat-in-a-pan-12732556/", imageCredit: "Avraami Barri" },
  "r-5e0dbe7f91": { image: "https://images.pexels.com/photos/18976994/pexels-photo-18976994.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce crémeuse maison présentée dans un bol en céramique", imageSourceUrl: "https://www.pexels.com/photo/homemade-sauce-in-a-bowl-18976994/", imageCredit: "Valeria Boltneva" },
  "r-f8f03a0136": { image: "https://images.pexels.com/photos/6896034/pexels-photo-6896034.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson mariné garni de citron et d’herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/milkfish-with-vegetable-toppings-6896034/", imageCredit: "Eiliv Aceron" },
  "r-40469275db": { image: "https://images.pexels.com/photos/19635602/pexels-photo-19635602.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson aux poivrons rouges façon provençale", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-seafood-19635602/", imageCredit: "Gurbet Aslan" },
  "r-6aabb8fd2b": { image: "https://images.pexels.com/photos/4453879/pexels-photo-4453879.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Épices orientales variées pour une marinade marocaine", imageSourceUrl: "https://www.pexels.com/photo/collection-of-dry-oriental-spices-in-street-bazaar-4453879/", imageCredit: "Jacob Moseholt" },
  "r-09e623b38b": { image: "https://images.pexels.com/photos/8155559/pexels-photo-8155559.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Ingrédients frais et huile d’olive pour une marinade de légumes", imageSourceUrl: "https://www.pexels.com/photo/herbs-and-spices-over-a-table-8155559/", imageCredit: "Valeriya Kobzar" },
  "r-b4b0610f04": { image: "https://images.pexels.com/photos/7966784/pexels-photo-7966784.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Épices en bols et cuillères pour assaisonner pommes de terre et patates douces", imageSourceUrl: "https://www.pexels.com/photo/top-view-of-various-spices-in-pots-7966784/", imageCredit: "jianwei zhu" },
  "r-2b72316717": { image: "https://images.pexels.com/photos/8329339/pexels-photo-8329339.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Herbes séchées variées présentées dans de petits bols blancs", imageSourceUrl: "https://www.pexels.com/photo/herbs-in-bowls-8329339/", imageCredit: "Anna Pou" },
  "r-943f15fbe2": { image: "https://images.pexels.com/photos/5480193/pexels-photo-5480193.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Herbes et épices pilées au mortier pour un mélange spécial poulet", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-woman-mixing-herbs-and-spices-5480193/", imageCredit: "Yan Krukau" },
  "r-e5b6c7beb1": { image: "https://images.pexels.com/photos/13046454/pexels-photo-13046454.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Épices colorées et piments pour un mélange fajitas Tex-Mex", imageSourceUrl: "https://www.pexels.com/photo/photo-of-bowls-with-bell-pepper-and-spices-13046454/", imageCredit: "Angela Khebou" },
  "r-bbee576cfa": { image: "https://images.pexels.com/photos/32281630/pexels-photo-32281630.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assortiment d’épices en bols pour relever le poulet", imageSourceUrl: "https://www.pexels.com/photo/assorted-spices-in-black-bowls-flat-lay-32281630/", imageCredit: "Joel Camelot" },
  "r-cc0110cfac": { image: "https://images.pexels.com/photos/4871131/pexels-photo-4871131.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Herbes séchées et épices pour un mélange grec", imageSourceUrl: "https://www.pexels.com/photo/flatlay-photography-of-herbs-and-spices-on-a-wooden-platter-4871131/", imageCredit: "Kaboompics.com" },
  "r-05b735f44d": { image: "https://images.pexels.com/photos/8108018/pexels-photo-8108018.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assortiment d’herbes séchées pour salades méditerranéennes", imageSourceUrl: "https://www.pexels.com/photo/assorted-dried-herbs-and-spices-over-a-marble-top-table-8108018/", imageCredit: "MART PRODUCTION" },
  "r-0fb1660969": { image: "https://images.pexels.com/photos/6439856/pexels-photo-6439856.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Origan, basilic et épices pour un mélange italien", imageSourceUrl: "https://www.pexels.com/photo/various-herbs-and-spices-on-wooden-spoons-6439856/", imageCredit: "J R" },
  "r-b98c773116": { image: "https://images.pexels.com/photos/37733240/pexels-photo-37733240.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Légumes rôtis au four avec pommes de terre, carottes et herbes", imageSourceUrl: "https://www.pexels.com/photo/roasted-carrots-and-potatoes-with-herbs-37733240/", imageCredit: "DaMLa" },
  "r-39b79f5312": { image: "https://images.pexels.com/photos/31852186/pexels-photo-31852186.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mélange d’épices colorées pour tajine marocain", imageSourceUrl: "https://www.pexels.com/photo/colorful-spice-arrangement-on-dark-background-31852186/", imageCredit: "Christopher Welsch Leveroni" },
  "r-7e9ac7cf02": { image: "https://images.pexels.com/photos/33831200/pexels-photo-33831200.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Épices marocaines colorées pour assaisonner le poulet", imageSourceUrl: "https://www.pexels.com/photo/colorful-array-of-spices-on-dark-background-33831200/", imageCredit: "Christopher Welsch Leveroni" },
  "r-c526145b8c": { image: "https://images.pexels.com/photos/6690933/pexels-photo-6690933.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poudres de curry et épices indiennes sur fond clair", imageSourceUrl: "https://www.pexels.com/photo/colored-powder-spices-on-a-marble-surface-6690933/", imageCredit: "Tara Winstead" },
  "r-d7a5212511": { image: "https://images.pexels.com/photos/33694449/pexels-photo-33694449.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assortiment d’épices indiennes pour légumes au curry", imageSourceUrl: "https://www.pexels.com/photo/colorful-assortment-of-indian-spices-on-plate-33694449/", imageCredit: "Kitchen Se Dil Tak by Anjum Ansari" },
  "r-30b15ff2e3": { image: "https://images.pexels.com/photos/7976107/pexels-photo-7976107.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Épices et herbes pour un mélange citronné destiné au poisson", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-spices-on-a-spoon-7976107/", imageCredit: "Berkay AK" },
  "r-b6e0c1f1bb": { image: "https://images.pexels.com/photos/5107127/pexels-photo-5107127.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Herbes séchées et épices pour légumes rôtis au four", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-herbs-and-spices-5107127/", imageCredit: "Taryn Elliott" },
  "r-cf9d5e66cb": { image: "https://images.pexels.com/photos/32784058/pexels-photo-32784058.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pommes de terre rôties dorées aux herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/golden-roasted-potatoes-with-fresh-herbs-32784058/", imageCredit: "Adonyi Gábor" },
  "r-c52e7c5a0c": { image: "https://images.pexels.com/photos/2632292/pexels-photo-2632292.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mélange de poudres d’épices pour frites au four", imageSourceUrl: "https://www.pexels.com/photo/seasoning-powders-2632292/", imageCredit: "Aditya Moses" },
  "r-a59202e976": { image: "https://images.pexels.com/photos/4617525/pexels-photo-4617525.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Patates douces dorées en morceaux avec herbes et épices", imageSourceUrl: "https://www.pexels.com/photo/yummy-fried-batata-on-white-surface-4617525/", imageCredit: "Damir Mijailovic" },
  "r-6a927551a7": { image: "https://images.pexels.com/photos/678414/pexels-photo-678414.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Épices variées en bols pour parfumer riz et semoule", imageSourceUrl: "https://www.pexels.com/photo/assorted-spices-near-white-ceramic-bowls-678414/", imageCredit: "Mareefe" },
  "r-b5131d111b": { image: "https://images.pexels.com/photos/30089164/pexels-photo-30089164.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mélange coloré d’herbes et d’épices pour salades fraîches", imageSourceUrl: "https://www.pexels.com/photo/vibrant-spices-and-herbs-flat-lay-culinary-art-30089164/", imageCredit: "madhu sai pavan" },
  "r-376d7c7d61": { image: "https://images.pexels.com/photos/12310569/pexels-photo-12310569.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Omelette complète au fromage et aux herbes façon bistrot", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-egg-and-cheese-omelette-12310569/", imageCredit: "Lloyd Mitchel Guanzon" },
  "r-0590c1550b": { image: "https://images.pexels.com/photos/35212376/pexels-photo-35212376.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon fumé, fromage frais et concombre en bouchées fraîches", imageSourceUrl: "https://www.pexels.com/photo/gourmet-smoked-salmon-appetizers-on-cucumber-base-35212376/", imageCredit: "Natalia S" },
  "r-cc1cb0b455": { image: "https://images.pexels.com/photos/5379639/pexels-photo-5379639.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes crémeuses au parmesan dans un bol blanc", imageSourceUrl: "https://www.pexels.com/photo/close-up-view-of-a-pasta-dish-on-white-ceramic-bowl-5379639/", imageCredit: "Engin Akyurt" },
  "r-5683efa1c7": { image: "https://images.pexels.com/photos/36997460/pexels-photo-36997460.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap de tortilla au saumon frais avec garniture verte", imageSourceUrl: "https://www.pexels.com/photo/delicious-salmon-tortilla-wrap-on-slate-platter-36997460/", imageCredit: "Project of food" },
  "r-6d9464bdf0": { image: "https://images.pexels.com/photos/25205263/pexels-photo-25205263.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Steak gourmand nappé de sauce au poivre", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-gourmet-dish-on-a-plate-25205263/", imageCredit: "Adriano Bragi" },
  "r-860ef4c338": { image: "https://images.pexels.com/photos/11218687/pexels-photo-11218687.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Croque gourmand au fromage et à la tomate", imageSourceUrl: "https://www.pexels.com/photo/sandwiches-with-mozzarella-and-cherry-tomatoes-11218687/", imageCredit: "Mathias Reding" },
  "r-74cdec1e1f": { image: "https://images.pexels.com/photos/4409496/pexels-photo-4409496.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bruschetta à la tomate et mozzarella sur pain grillé", imageSourceUrl: "https://www.pexels.com/photo/pain-nourriture-aliments-sain-4409496/", imageCredit: "Nadezhda Moryak" },
  "r-1a84754dd9": { image: "https://images.pexels.com/photos/30855418/pexels-photo-30855418.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs brouillés aux tomates dans une poêle", imageSourceUrl: "https://www.pexels.com/photo/delicious-homemade-scrambled-eggs-with-tomatoes-30855418/", imageCredit: "Markus Winkler" },
  "r-a7d1d79544": { image: "https://images.pexels.com/photos/8697543/pexels-photo-8697543.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Crevettes à l’ail et au citron avec herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/cooked-food-on-black-ceramic-bowl-8697543/", imageCredit: "Farhad Ibrahimzade" },
  "r-98311d04fe": { image: "https://images.pexels.com/photos/8878619/pexels-photo-8878619.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe verte onctueuse servie dans un bol", imageSourceUrl: "https://www.pexels.com/photo/photograph-of-a-green-soup-near-a-menu-8878619/", imageCredit: "Rafał Nawrocki" },
  "r-24b005c4bf": { image: "https://images.pexels.com/photos/8055161/pexels-photo-8055161.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs brouillés cuits à la poêle", imageSourceUrl: "https://www.pexels.com/photo/a-person-cooking-scrambled-eggs-8055161/", imageCredit: "Annushka Ahuja" },
  "r-dfd656eac7": { image: "https://images.pexels.com/photos/11960540/pexels-photo-11960540.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wraps au thon garnis et nappés de sauce", imageSourceUrl: "https://www.pexels.com/photo/cooked-food-on-the-plate-11960540/", imageCredit: "Dima Valkov" },
  "r-5c706b445e": { image: "https://images.pexels.com/photos/16482466/pexels-photo-16482466.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartines et garniture marine au poisson grillé", imageSourceUrl: "https://www.pexels.com/photo/seafood-on-plate-16482466/", imageCredit: "Nadin Sh" },
};

export const carnet = {
  ...data,
  recipes: [...recipesWithPdfOverrides, ...unmatchedPdfRecipes, ...springFestivalRecipes, ...summerFestivalRecipes, ...autumnSylvestreRecipes].map((recipe) => {
    const normalized = normalizeRecipeForPlanning(recipe);
    const airfryerSafe = AIRFRYER_EXCLUDED_RECIPE_NAMES.has(recipeMatchKey(normalized.name))
      ? { ...normalized, airfryer_compatible: false, airfryer_temps: null, airfryer_temperature: null }
      : normalized;
    return firstTwentyRecipeImages[airfryerSafe.id] ? { ...airfryerSafe, ...firstTwentyRecipeImages[airfryerSafe.id] } : airfryerSafe;
  }),
} as Carnet;

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

/**
 * Associe chaque numéro de semaine à son mois via le jeudi de la semaine ISO.
 * 2026 sert d'année de référence fixe pour que les 52 semaines du carnet ne
 * changent pas de saison selon l'année où l'application est ouverte.
 */
export function monthForWeek(week: number): number {
  // Les semaines sont rattachées à l'année civile courante : pas de calendrier 2026 figé.
  // Le jeudi détermine le mois de la semaine ISO, y compris lorsqu'elle chevauche deux mois.
  const safeWeek = Math.min(52, Math.max(1, Math.round(week)));
  const year = new Date().getFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const weekday = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - weekday + 1 + (safeWeek - 1) * 7);
  const thursday = new Date(monday);
  thursday.setUTCDate(monday.getUTCDate() + 3);
  return thursday.getUTCMonth() + 1;
}

export function monthLabelForWeek(week: number): string {
  const date = new Date(Date.UTC(new Date().getFullYear(), monthForWeek(week) - 1, 15));
  return date.toLocaleDateString("fr-FR", { month: "long", timeZone: "UTC" });
}

export function seasonForWeek(week: number): Season {
  // Saison calculée depuis le mois de la semaine ISO, selon les repères de
  // disponibilité des produits en France métropolitaine.
  const month = monthForWeek(week);
  if ([12, 1, 2].includes(month)) return "hiver";
  if ([3, 4, 5].includes(month)) return "printemps";
  if ([6, 7, 8].includes(month)) return "ete";
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

// Sélection éditoriale : corrections ciblées des menus de saison. Les substitutions
// demandées par l'utilisateur restent prioritaires ; courses et batch utilisent weekPlan().
const CURATED_PLAN_RECIPE_OVERRIDES: Record<string, string> = {
  "2|LUNDI|Soir": "r-9b996df25a", // soupe à l'oignon en hiver, à la place du gaspacho
  "6|LUNDI|Soir": "r-0e5be70f69", // soupe poireaux-carottes en hiver
  "6|DIMANCHE|Soir": "r-86fb2988d0", // remplacer le doublon de burger par un plat d'hiver
  "37|VENDREDI|Soir": "r-3a7b357b85", // velouté de courge au lieu du gaspacho
  "47|VENDREDI|Soir": "r-9f72f3e182", // soupe d'automne au lieu du gaspacho
  "48|VENDREDI|Soir": "r-0a2e578f74", // un vrai dîner à la place du dessert seul
  "38|SAMEDI|Soir": "r-0d88134e0e",
  "38|DIMANCHE|Soir": "r-2cf7843ce5",
  "39|SAMEDI|Soir": "r-89467af8af",
  "39|DIMANCHE|Soir": "r-32efaae5de",
  "40|SAMEDI|Soir": "r-56ef344d3c",
  "40|DIMANCHE|Soir": "r-768e2e4a95",
  "41|SAMEDI|Soir": "r-3c29bc5010",
  "41|DIMANCHE|Soir": "r-45b814e25e",
  "42|SAMEDI|Soir": "r-f33821e206",
  "42|DIMANCHE|Soir": "veg-ah-pdf-009",
  "43|SAMEDI|Soir": "r-777fb77d40",
  "43|DIMANCHE|Soir": "r-ae5fd0a220",
  "44|SAMEDI|Soir": "veg-ah-pdf-035",
  "44|DIMANCHE|Soir": "r-30a78971c9",
  "45|SAMEDI|Soir": "r-48999379ec",
  "45|DIMANCHE|Soir": "r-19ce31994f",
  "46|SAMEDI|Soir": "veg-ah-pdf-042",
  "46|DIMANCHE|Soir": "r-0c576a3884",
  "47|SAMEDI|Soir": "veg-ah-pdf-007",
  "47|DIMANCHE|Soir": "r-79f9f3b7c4",
  "48|SAMEDI|Soir": "veg-ah-pdf-011",
  "48|DIMANCHE|Soir": "veg-ah-pdf-010",
  "49|SAMEDI|Soir": "veg-ah-pdf-039",
  "49|DIMANCHE|Soir": "vegan-automne-hiver-012",
  "50|SAMEDI|Soir": "veg-ah-pdf-034",
  "50|DIMANCHE|Soir": "veg-ah-pdf-004",
  "51|SAMEDI|Soir": "veg-ah-pdf-044",
  "51|DIMANCHE|Soir": "r-19ce31994f",
  "52|SAMEDI|Soir": "noel-plat-27",
  "52|DIMANCHE|Soir": "r-48999379ec",
};

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
      isSeasonCompatible(recipe, season, monthForWeek(week)) &&
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

function isSeasonCompatible(recipe: Recipe, season: Season, month: number): boolean {
  const title = normalizedSeasonText(recipe.name || "");
  const text = normalizedSeasonText([recipe.name, ...(recipe.ingredients || [])].join(" "));
  const summerOnly = /gaspacho|gazpacho|soupe froide|soupe glacee|veloute froid|melon|pasteque|estival|estivale|\bd ete\b|\bde ete\b|aux legumes du soleil/i;
  const winterOnly = /hivernal|hivernale|\bd hiver\b|\bde hiver\b|de noel|potimarron|chataigne|chataignes|endive|chou de bruxelles/i;
  if (season !== "ete" && summerOnly.test(title)) return false;
  if ((season === "ete" || season === "printemps") && winterOnly.test(title)) return false;
  if (season === "printemps" && /de noel/i.test(title)) return false;

  // Fenêtres indicatives de disponibilité des produits frais en France métropolitaine.
  // Les conserves, coulis et produits surgelés ne sont pas considérés hors saison.
  const seasonalWindows: { pattern: RegExp; months: number[] }[] = [
    { pattern: /\b(?:tomates?|tomate cerise)\b/i, months: [6, 7, 8, 9] },
    { pattern: /\bcourgettes?\b/i, months: [6, 7, 8, 9, 10] },
    { pattern: /\baubergines?\b/i, months: [7, 8, 9] },
    { pattern: /\bpoivrons?\b/i, months: [7, 8, 9, 10] },
    { pattern: /\bconcombres?\b/i, months: [5, 6, 7, 8, 9] },
    { pattern: /\bmelons?\b/i, months: [6, 7, 8, 9] },
    { pattern: /\b(?:pasteques?|peches?|nectarines?)\b/i, months: [6, 7, 8, 9] },
    { pattern: /\babricots?\b/i, months: [6, 7, 8] },
    { pattern: /\b(?:fraises?|framboises?|groseilles?)\b/i, months: [4, 5, 6, 7, 8, 9] },
    { pattern: /\basperges?\b/i, months: [3, 4, 5, 6] },
    { pattern: /\bharicots verts?\b/i, months: [6, 7, 8, 9, 10] },
    { pattern: /\bpotimarrons?\b/i, months: [9, 10, 11, 12, 1, 2] },
    { pattern: /\bcourges? butternut\b/i, months: [9, 10, 11, 12, 1, 2] },
    { pattern: /\bchataignes?\b/i, months: [9, 10, 11, 12] },
    { pattern: /\bchoux? de bruxelles\b/i, months: [9, 10, 11, 12, 1, 2, 3] },
    { pattern: /\bendives?\b/i, months: [10, 11, 12, 1, 2, 3, 4] },
    { pattern: /\bpanais\b/i, months: [10, 11, 12, 1, 2, 3] },
    { pattern: /\bclementines?\b/i, months: [11, 12, 1, 2] },
    { pattern: /\bmandarines?\b/i, months: [11, 12, 1, 2] },
    { pattern: /\bpoireaux?\b/i, months: [9, 10, 11, 12, 1, 2, 3, 4] },
    { pattern: /\b(?:pommes?|poires?)\b/i, months: [8, 9, 10, 11, 12, 1, 2, 3, 4, 5] },
  ];
  const preserved = /conserve|concassee|concassees|coulis|passata|en boite|en conserve|surgel|tomates pelees|concentre de tomate|compote|confiture/i;
  for (const rawLine of recipe.ingredients || []) {
    const line = normalizedSeasonText(rawLine);
    if (preserved.test(line)) continue;
    if (seasonalWindows.some((rule) => rule.pattern.test(line) && !rule.months.includes(month))) return false;
  }
  if (season === "hiver" && /gaspacho|gazpacho|soupe froide|veloute froid/.test(text)) return false;
  return true;
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
  return /^(sauce|marinade|vinaigrette|pesto|coulis|mélange d'épices|melange d'epices|épices|epices|granola|confiture|compote|sirop|boisson|cocktail|tartinade|dip\b|crackers|gressins|biscuits apéritifs|rillettes|ail et persil mixés|mélange d'ail|oeufs durs prêts|œufs durs prêts|citrouilles mandarines|marshmallows fantômes|shirley temple|élixir|elixir|philtre|spritz|bloody mary|punch sanguin|assiette de restes|assiette légère de fin de semaine|cake de noël|bûche|buche|mendiants|crème pâtissière|creme patissiere|tapioca au lait|dessert|gâteau|gateau|tiramisu|brownie|cookies?|pâtisserie|patisserie)/i.test(clean);
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
  etudiant?: boolean; vegetarien?: boolean; isVegetarian?: boolean; vegan?: boolean; isVegan?: boolean; halal?: boolean;
  sansGluten?: boolean; sansLactose?: boolean; sansFruitsCoque?: boolean; placardVide?: boolean; householdServings?: number;
};

/** Le profil vegan n'accepte que les fiches explicitement étiquetées vegan
 * et dont les ingrédients ne révèlent aucun produit d'origine animale. */
export function isVeganRecipe(recipe: Recipe): boolean {
  if (normalizedSeasonText(recipe.regime || "") !== "vegan") return false;
  const ingredients = (recipe.ingredients || []).map((line) => normalizedSeasonText(line));
  const animalIngredient = /\b(viande|boeuf|veau|porc|poulet|dinde|canard|agneau|jambon|lardons?|bacon|pancetta|saucisse|merguez|poisson|saumon|cabillaud|thon|maquereau|crevette|crevettes|moule|moules|huitre|huitres|oeuf|oeufs|miel|gelatine|gelatine animale|lait|beurre|fromage|parmesan|mozzarella|feta|chevre|yaourt|skyr|fromage blanc|creme fraiche|lactose|lard)\b/;
  return ingredients.every((line) => {
    if (/\b(lait|yaourt|creme)\b/.test(line) && /\b(vegetal|soja|amande|avoine|coco|riz)\b/.test(line)) return !/\b(oeuf|miel|gelatine|viande|poisson|fromage|beurre|lard|lait\s+(?!de\s+(soja|coco|amande|avoine|riz)))/.test(line);
    if (/\b(beurre)\b/.test(line) && /\b(cacahuete|amande|noisette|noix)\b/.test(line)) return !/\b(oeuf|miel|gelatine|viande|poisson|lait|fromage|beurre laitier)\b/.test(line);
    if (/\b(fromage)\b/.test(line) && /\b(vegan|vegetal)\b/.test(line)) return !/\b(oeuf|miel|gelatine|viande|poisson|lait)\b/.test(line);
    if (/\b(creme)\b/.test(line) && /\b(soja|coco|vegetale|vegetal)\b/.test(line)) return !/\b(oeuf|miel|gelatine|viande|poisson|lait|fromage|beurre)\b/.test(line);
    return !animalIngredient.test(line);
  });
}


/** Filtre végétarien strict : les œufs et produits laitiers sont autorisés,
 * mais les ingrédients de viande, volaille, charcuterie, poisson et fruits de mer sont exclus. */
export function isVegetarianRecipe(recipe: Recipe): boolean {
  const ingredients = (recipe.ingredients || []).map((line) => normalizedSeasonText(line)).filter(Boolean);
  if (ingredients.length === 0) return false; // Une fiche sans ingrédients vérifiables ne passe pas le filtre strict.
  const animalMeatOrSeafood = /\b(viande|boeuf|veau|porc|poulet|dinde|canard|agneau|mouton|lapin|jambon|lardons?|bacon|pancetta|chorizo|saucisse|merguez|charcuterie|steak|escalope|cotelette|boulette de viande|gelatine animale|poisson|saumon|cabillaud|thon|maquereau|sardine|anchois|colin|lieu noir|truite|bar|dorade|haddock|surimi|crevette|gambas|langoustine|homard|crabe|moule|huitre|coquille saint jacques|saint jacques|calamar|seiche|poulpe|fruits de mer)\b/;
  return ingredients.every((line) => !animalMeatOrSeafood.test(line));
}

function eligibleForPreferences(recipe: Recipe, preferences: PlanningPreferences): boolean {
  const ingredients = (recipe.ingredients || []).map((line) => normalizedSeasonText(line));
  const text = normalizedSeasonText([recipe.name, ...ingredients].join(" "));
  const regime = normalizedSeasonText(recipe.regime || "");
  if ((preferences.isVegan || preferences.vegan) && !isVeganRecipe(recipe)) return false;
  if ((preferences.isVegetarian || preferences.vegetarien) && !isVegetarianRecipe(recipe)) return false;
  if (preferences.halal) {
    const halalTagged = regime === "halal" || (recipe as Recipe & { halal?: boolean }).halal === true;
    const plantBasedTagged = regime === "vegan" || regime === "vegetarien";
    const forbidden = /\bporc\b|\bjambon\b|\blardons?\b|\bbacon\b|\bpancetta\b|\bchorizo\b|\bvin\b|\brhum\b|\bkirsch\b|\balcool\b|\bgélatine animale\b|\ngelatine animale\b/.test(text);
    const unverifiedMeat = /\bpoulet\b|\bdinde\b|\bboeuf\b|\bveau\b|\bagneau\b|\bporc\b|\bcanard\b|\bjambon\b|\blardons?\b|\bsaucisse\b|\bmerguez\b|\bsteak\b|\bviande\b/.test(text);
    if (!halalTagged && !plantBasedTagged && (forbidden || unverifiedMeat)) return false;
  }
  // Les ingrédients couverts par le dictionnaire sont adaptés à l’affichage ; les sources de gluten non couvertes restent exclues du planning.
  if (preferences.sansGluten && /wrap|tortilla|nouilles de ble|couscous|semoule de ble|seitan|orge|seigle|boulgour/.test(text)) return false;
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

function isFourthWeekOfMonth(week: number): boolean {
  const year = new Date().getFullYear();
  const jan4 = new Date(year, 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (Math.max(1, Math.min(52, week)) - 1) * 7);
  return monday.getDate() >= 22;
}

function pantryIngredientRatio(recipe: Recipe): number {
  const lines = (recipe.ingredients || []).filter((line) => line.trim());
  if (!lines.length) return 0;
  const pantry = /lentilles|pois chiches|haricots secs|riz|pates|semoule|couscous|boulgour|farine|conserve|tomates concassees|thon en boite|mais en boite|bouillon|huile|vinaigre|epices|flocons d avoine|polenta|quinoa|legumes surgeles/i;
  return lines.filter((line) => pantry.test(normalizedSeasonText(line))).length / lines.length;
}

function budgetRecipeScore(recipe: Recipe): number {
  const text = normalizedSeasonText([recipe.name, ...(recipe.ingredients || [])].join(" "));
  let score = 0;
  for (const token of ["lentille", "oeuf", "pomme de terre", "riz", "pates", "pois chiche", "haricot", "conserve", "tomate", "semoule", "sardine", "thon", "carotte", "chou", "polenta"]) {
    if (text.includes(token)) score += 1;
  }
  return score;
}

function isMainDishCandidate(recipe: Recipe): boolean {
  const name = normalizedSeasonText(recipe.name);
  const notAMainDish = /(?:dessert|snack|truffes?|bonbons?|cookies?|biscuits? sucre|brownies?|mousse au chocolat|panna cotta|tiramisu|compote|granola|energy balls|boules d energie|barres energetiques|gaufres? sucrees|crepes sucrees|fondants? au chocolat|rochers coco|madeleines|financiers|muffins? sucrees?|chips|pop.?corn|bonbons|sucettes|mendiants|buche|bouchees chocolatees|bouchees aperitives|mini.?feuilletes|gressins|crackers|tartinade|dip\b|cocktail|mocktail|smoothie|boisson|bananes? roties?|banana bread|pain perdu|salade de fruits|fruits au chocolat|bowl de (?:skyr|fromage blanc|yaourt)|skyr aux fruits|fromage blanc aux fruits|bowl sucre)/i;
  return !notAMainDish.test(name) && !isSauceOrSideRecipe(recipe.name);
}

function mainDishCategory(recipe: Recipe | undefined): string {
  if (!recipe) return "inconnu";
  const name = normalizedSeasonText(recipe.name);
  if (/soupe|veloute|potage|bouillon/.test(name)) return "soupe";
  if (/salade|taboule|crudite/.test(name)) return "salade";
  if (/pates|spaghetti|lasagnes|ravioles|gnocchi|nouilles/.test(name)) return "pates";
  if (/riz|risotto|paella/.test(name)) return "riz";
  if (/pizza|flam/.test(name)) return "pizza";
  if (/quiche|tarte salee|cake sale|frittata/.test(name)) return "quiche";
  if (/wrap|tacos|quesadilla|burrito|fajitas/.test(name)) return "wrap-tacos";
  if (/burger|croque|sandwich|hot.?dog/.test(name)) return "sandwich";
  if (/gratin|hachis parmentier|crumble sale/.test(name)) return "gratin";
  if (/chili|con carne/.test(name)) return "chili";
  if (/curry|dahl|dal/.test(name)) return "curry";
  if (/omelette|oeufs|oeuf/.test(name)) return "oeufs";
  if (/poisson|saumon|cabillaud|thon|maquereau|colin|crevettes?|sardines?/.test(name)) return "poisson";
  if (/poulet|dinde|boeuf|veau|porc|agneau|steak|saucisse|jambon/.test(name)) return "viande";
  if (/poelee|legumes rotis|legumes farcis|ratatouille/.test(name)) return "legumes";
  return "plat";
}

function recipePillars(recipe: Recipe): { vegetables: Set<string>; starches: Set<string>; proteins: Set<string> } {
  const text = normalizedSeasonText([recipe.name, ...(recipe.ingredients || [])].join(" "));
  const collect = (tokens: string[]) => new Set(tokens.filter((token) => text.includes(token)));
  return {
    vegetables: collect(["courgette", "carotte", "tomate", "poivron", "poireau", "brocoli", "chou", "epinard", "aubergine", "courge", "potimarron", "champignon", "concombre", "haricot vert", "artichaut", "asperge", "navet", "panais", "fenouil", "endive", "betterave", "radis", "salade", "blette", "celeri"]),
    starches: collect(["pates", "spaghetti", "lasagne", "riz", "pomme de terre", "patate douce", "quinoa", "semoule", "couscous", "boulgour", "polenta", "pain", "tortilla", "nouilles", "orge"]),
    proteins: collect(["poulet", "dinde", "boeuf", "veau", "porc", "agneau", "canard", "saumon", "cabillaud", "thon", "maquereau", "colin", "poisson", "crevette", "sardine", "oeuf", "lentille", "pois chiche", "haricot rouge", "tofu", "tempeh"]),
  };
}

const TRANSFORMATION_TOKENS = ["pois chiches", "lentilles", "haricots", "poulet", "dinde", "boeuf", "veau", "porc", "agneau", "saumon", "cabillaud", "thon", "maquereau", "colin", "lieu", "crevette", "tofu", "falafel", "oeuf"];
const transformationTokenCache = new WeakMap<Recipe, Set<string>>();

function transformationTokens(recipe: Recipe): Set<string> {
  const cached = transformationTokenCache.get(recipe);
  if (cached) return cached;
  const text = normalizedSeasonText([recipe.name, ...(recipe.ingredients || [])].join(" "));
  const found = new Set(TRANSFORMATION_TOKENS.filter((token) => text.includes(normalizedSeasonText(token))));
  transformationTokenCache.set(recipe, found);
  return found;
}

function sharesPivotIngredient(candidate: Recipe, pivot: Recipe): boolean {
  const pivotTokens = transformationTokens(pivot);
  const candidateTokens = transformationTokens(candidate);
  return [...pivotTokens].some((token) => candidateTokens.has(token));
}

function fitsWeeklyPillarCaps(candidate: Recipe, selected: Recipe[]): boolean {
  const combined = [...selected, candidate].map(recipePillars);
  const count = (key: "vegetables" | "starches" | "proteins") => new Set(combined.flatMap((entry) => [...entry[key]])).size;
  return count("vegetables") <= 3 && count("starches") <= 2 && count("proteins") <= 2;
}

function enforceDinnerCategoryCooldown(
  slots: PlanSlot[],
  eligible: Recipe[],
  reserved: Set<string>,
  week: number,
  preferences: PlanningPreferences,
  season: Season,
  previousDinnerCategories: string[] = [],
  daughterPivotRecipe?: Recipe,
): PlanSlot[] {
  const days = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];
  const result = [...slots];
  // Les deux derniers dîners sont pris en compte : le déjeuner du lendemain
  // reprend les restes, donc une catégorie ne doit pas revenir dans la fenêtre de 48 h.
  const recentCategories = previousDinnerCategories.filter((category) => category && category !== "inconnu").slice(-2);
  const selectedDinners: Recipe[] = [];
  for (const day of days) {
    const index = result.findIndex((slot) => slot.day === day && slot.meal === "Soir");
    if (index < 0) continue;
    const current = result[index];
    const recipe = current.recipeId ? recipesById.get(current.recipeId) : undefined;
    const category = mainDishCategory(recipe);
    const invalid = !recipe || !isMainDishCandidate(recipe);
    const repeated = Boolean(category && recentCategories.includes(category));
    const exceedsPillars = Boolean(recipe && !fitsWeeklyPillarCaps(recipe, selectedDinners));
    if (invalid || repeated || exceedsPillars) {
      const alreadyUsed = new Set(result.filter((slot, slotIndex) => slotIndex !== index && slot.recipeId).map((slot) => slot.recipeId as string));
      const candidates = eligible.filter((candidate) =>
        !alreadyUsed.has(candidate.id) && !reserved.has(candidate.id) && candidate.id !== current.recipeId &&
        isMainDishCandidate(candidate) && isValidatedRecipe(candidate) &&
        eligibleForPreferences(candidate, preferences) && isSeasonCompatible(candidate, season, monthForWeek(week)) &&
        !recentCategories.includes(mainDishCategory(candidate)) &&
        // Si le dîner du jeudi est la recette fille, toute correction de diversité doit
        // conserver un ingrédient du pivot du mardi (sauf choix explicite de l’utilisatrice).
        (day !== "JEUDI" || !daughterPivotRecipe || sharesPivotIngredient(candidate, daughterPivotRecipe)) &&
        fitsWeeklyPillarCaps(candidate, selectedDinners)
      ).sort((a, b) => seasonalScore(b, season) - seasonalScore(a, season) || a.name.localeCompare(b.name, "fr"));
      // Si les rôles réservés bloquent toutes les options, réutiliser une recette non
      // déjà présente dans un autre créneau plutôt que laisser passer une répétition ou
      // dépasser les plafonds de piliers. Le filtre des créneaux utilisés reste prioritaire.
      const fallbackCandidates = candidates.length ? candidates : eligible.filter((candidate) =>
        !alreadyUsed.has(candidate.id) && candidate.id !== current.recipeId &&
        isMainDishCandidate(candidate) && isValidatedRecipe(candidate) &&
        eligibleForPreferences(candidate, preferences) && isSeasonCompatible(candidate, season, monthForWeek(week)) &&
        !recentCategories.includes(mainDishCategory(candidate)) &&
        (day !== "JEUDI" || !daughterPivotRecipe || sharesPivotIngredient(candidate, daughterPivotRecipe)) &&
        fitsWeeklyPillarCaps(candidate, selectedDinners)
      ).sort((a, b) => seasonalScore(b, season) - seasonalScore(a, season) || a.name.localeCompare(b.name, "fr"));
      const replacement = fallbackCandidates[(Math.max(1, week + days.indexOf(day)) - 1) % Math.max(1, fallbackCandidates.length)];
      if (replacement) {
        result[index] = { ...current, recipeId: replacement.id, name: replacement.name };
        recentCategories.push(mainDishCategory(replacement));
        if (recentCategories.length > 2) recentCategories.shift();
        selectedDinners.push(replacement);
      } else {
        if (invalid) result[index] = { ...current, recipeId: null, name: "Aucun plat principal complet validé pour ce créneau" };
        if (!invalid) {
          recentCategories.push(category);
          if (recentCategories.length > 2) recentCategories.shift();
          selectedDinners.push(recipe!);
        }
      }
    } else {
      recentCategories.push(category);
      if (recentCategories.length > 2) recentCategories.shift();
      if (recipe) selectedDinners.push(recipe);
    }
  }
  return result;
}

function computeWeekPlan(
  week: number,
  overrides: Record<string, string> = {},
  preferences: PlanningPreferences = {},
  applyLeftovers = true,
  applyBoundaryCooldown = true,
): PlanSlot[] {
  const slots = carnet.plan.filter((p) => p.week === week).map((slot) => {
    const id = overrides[`${slot.week}|${slot.day}|${slot.meal}`];
    const recipe = id ? recipesById.get(id) : undefined;
    return recipe ? { ...slot, recipeId: recipe.id, name: recipe.name } : slot;
  });
  const season = seasonForWeek(week);
  const used = new Set<string>();
  const plannedRecipeIds = new Set(carnet.plan.map((slot) => slot.recipeId).filter(Boolean));
  const budgetWeek = isFourthWeekOfMonth(week);
  const eligibleCandidates = carnet.recipes
    .filter((recipe) => isValidatedRecipe(recipe) && isMainDishCandidate(recipe) && eligibleForPreferences(recipe, preferences) && isSeasonCompatible(recipe, season, monthForWeek(week)))
    .sort((a, b) => {
      if (preferences.placardVide) return pantryIngredientRatio(b) - pantryIngredientRatio(a) || a.name.localeCompare(b.name, "fr");
      if (budgetWeek) return budgetRecipeScore(b) - budgetRecipeScore(a) || a.name.localeCompare(b.name, "fr");
      return Number(plannedRecipeIds.has(b.id)) - Number(plannedRecipeIds.has(a.id)) || a.name.localeCompare(b.name, "fr");
    });
  // Exact duplicate cards from overlapping PDF imports must not get extra weight in weekly recipe selection.
  // The full cards remain available in their source collections; only the planning pool is deduplicated.
  const seenRecipeContent = new Set<string>();
  const eligible = eligibleCandidates.filter((recipe) => {
    const contentKey = [
      normalizedSeasonText(recipe.name),
      ...(recipe.ingredients || []).map((line) => normalizedSeasonText(line)).sort(),
      ...(recipe.steps || []).map((step) => normalizedSeasonText(String(step).replace(/^\d+[.)]\s*/, ""))).sort(),
    ].join("|");
    if (seenRecipeContent.has(contentKey)) return false;
    seenRecipeContent.add(contentKey);
    return true;
  });
  const plantProfile = Boolean(preferences.isVegan || preferences.vegan || preferences.isVegetarian || preferences.vegetarien);
  const roleText = (recipe: Recipe) => normalizedSeasonText(recipe.name);
  const chooseRole = (pattern: RegExp, exclude: Set<string> = new Set<string>(), quick = false) => {
    const candidates = eligible.filter((recipe) => {
      if (exclude.has(recipe.id) || !pattern.test(roleText(recipe))) return false;
      if (!quick) return true;
      const total = (durationMinutes(recipe.timePrep) || 0) + (durationMinutes(recipe.timeCook) || 0);
      return total <= 20;
    }).sort((a, b) => (preferences.placardVide ? pantryIngredientRatio(b) - pantryIngredientRatio(a) : budgetWeek ? budgetRecipeScore(b) - budgetRecipeScore(a) : 0) || seasonalScore(b, season) - seasonalScore(a, season) || a.name.localeCompare(b.name, "fr"));
    if (!candidates.length) return undefined;
    const bestScore = seasonalScore(candidates[0], season);
    const topPriority = preferences.placardVide ? pantryIngredientRatio(candidates[0]) : budgetWeek ? budgetRecipeScore(candidates[0]) : null;
    const bestPool = candidates.filter((recipe) =>
      seasonalScore(recipe, season) === bestScore &&
      (topPriority === null || (preferences.placardVide ? pantryIngredientRatio(recipe) : budgetRecipeScore(recipe)) === topPriority)
    );
    return bestPool[(Math.max(1, week) - 1) % bestPool.length];
  };
  const reserved = new Set<string>();
  const overrideRecipe = (day: string, meal: string, pattern?: RegExp, quick = false) => {
    const key = week + "|" + day + "|" + meal;
    const userId = overrides[key];
    const curatedId = CURATED_PLAN_RECIPE_OVERRIDES[key];
    const isCurated = !userId && Boolean(curatedId);
    const id = userId || curatedId;
    const recipe = id ? recipesById.get(id) : undefined;
    if (!recipe || !isValidatedRecipe(recipe) || !isMainDishCandidate(recipe) || !eligibleForPreferences(recipe, preferences) || !isSeasonCompatible(recipe, season, monthForWeek(week))) return undefined;
    if (isCurated && preferences.placardVide && pantryIngredientRatio(recipe) < 0.8) return undefined;
    if (isCurated && budgetWeek && budgetRecipeScore(recipe) < 2) return undefined;
    // Les choix éditoriaux doivent être respectés même s'ils ne correspondent pas au rôle
    // automatique (ex. soupe en début de semaine) ; les préférences et changements utilisateur restent prioritaires.
    if (!isCurated && reserved.has(recipe.id)) return undefined;
    if (!isCurated && pattern && !pattern.test(roleText(recipe))) return undefined;
    if (!isCurated && quick && (durationMinutes(recipe.timePrep) ?? Infinity) + (durationMinutes(recipe.timeCook) ?? Infinity) > 20) return undefined;
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
    chooseRole(pivotPattern, reserved);
  if (pivot) reserved.add(pivot.id);

  const soupPattern = /soupe|veloute|potage|bouillon/;
  const seasonalBase = overrideRecipe("MERCREDI", "Soir", soupPattern) || chooseRole(soupPattern, reserved);
  if (seasonalBase) reserved.add(seasonalBase.id);

  // Le dîner du jeudi transforme le même ingrédient pivot dans une recette différente.
  const pivotText = pivot ? normalizedSeasonText([pivot.name, ...(pivot.ingredients || [])].join(" ")) : "";
  const pivotTokens = ["pois chiches", "lentilles", "haricots", "poulet", "dinde", "bœuf", "boeuf", "veau", "porc", "agneau", "saumon", "cabillaud", "thon", "maquereau", "colin", "lieu", "crevette", "tofu", "falafel", "œuf", "oeuf"];
  // Une recette fille doit réellement réutiliser au moins un ingrédient pivot.
  // On compare tous les ingrédients pivots présents, pas seulement le premier trouvé.
  const activePivotTokens = pivotTokens.filter((token) => pivotText.includes(normalizedSeasonText(token)));
  const sharedPivotScore = (recipe: Recipe) => {
    const text = normalizedSeasonText([recipe.name, ...(recipe.ingredients || [])].join(" "));
    return activePivotTokens.reduce((score, token) => score + (text.includes(normalizedSeasonText(token)) ? 1 : 0), 0);
  };
  const thursdayOverrideCandidate = overrideRecipe("JEUDI", "Soir");
  // Les choix éditoriaux automatiques ne priment pas sur la règle mère/fille.
  // Une substitution manuelle reste prioritaire, même si elle ne réutilise pas le pivot.
  const thursdayOverride = thursdayOverrideCandidate && (
    Boolean(overrides[`${week}|JEUDI|Soir`]) || sharedPivotScore(thursdayOverrideCandidate) > 0
  ) ? thursdayOverrideCandidate : undefined;
  const transformedCandidates = eligible
    .filter((recipe) => !reserved.has(recipe.id) && recipe.id !== pivot?.id && !/soupe|veloute|potage|bouillon/.test(roleText(recipe)))
    .filter((recipe) => sharedPivotScore(recipe) > 0)
    .sort((a, b) => sharedPivotScore(b) - sharedPivotScore(a) || seasonalScore(b, season) - seasonalScore(a, season) || (preferences.placardVide ? pantryIngredientRatio(b) - pantryIngredientRatio(a) : budgetWeek ? budgetRecipeScore(b) - budgetRecipeScore(a) : 0) || a.name.localeCompare(b.name, "fr"));
  const fallbackTransformations = transformedCandidates
    .filter((recipe) => (plantProfile ? plantPattern : meatPattern).test(roleText(recipe)));
  const transformedPivot = thursdayOverride || (preferences.householdServings != null && preferences.householdServings >= 4
    ? chooseRole(plantProfile ? plantPattern : meatPattern, reserved)
    : transformedCandidates[(Math.max(1, week) - 1) % Math.max(1, transformedCandidates.length)] || fallbackTransformations[0]);
  if (transformedPivot) reserved.add(transformedPivot.id);

  const pleasurePool = eligible
    .filter((recipe) => !reserved.has(recipe.id) && !/soupe|veloute|potage|bouillon/.test(roleText(recipe)))
    .sort((a, b) => seasonalScore(b, season) - seasonalScore(a, season) || (preferences.placardVide ? pantryIngredientRatio(b) - pantryIngredientRatio(a) : budgetWeek ? budgetRecipeScore(b) - budgetRecipeScore(a) : 0) || a.name.localeCompare(b.name, "fr"));
  const topScore = pleasurePool.length ? seasonalScore(pleasurePool[0], season) : -1;
  const topPool = pleasurePool.filter((recipe) => seasonalScore(recipe, season) === topScore);
  const start = topPool.length ? (Math.max(1, week) - 1) % topPool.length : 0;
  const weekendPool = [
    ...topPool.slice(start), ...topPool.slice(0, start),
    ...pleasurePool.filter((recipe) => seasonalScore(recipe, season) !== topScore),
  ];
  const weekendKeys: [string, string][] = [["VENDREDI", "Soir"], ["SAMEDI", "Soir"], ["DIMANCHE", "Soir"]];
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
  setRole("JEUDI", "Soir", transformedPivot, "Aucune transformation différente du pivot validée");
  setRole("VENDREDI", "Soir", weekendPleasures[0], "Aucun repas plaisir validé");
  setRole("SAMEDI", "Soir", weekendPleasures[1], "Aucun repas plaisir validé");
  setRole("DIMANCHE", "Soir", weekendPleasures[2], "Aucun repas plaisir validé");

  const result = slots.map((slot) => {
    const matrixSelection = matrix.get(`${slot.day}|${slot.meal}`);
    if (matrixSelection) {
      if (!matrixSelection.recipe) return { ...slot, name: matrixSelection.name, recipeId: null };
      used.add(matrixSelection.recipe.id);
      return { ...slot, name: matrixSelection.name, recipeId: matrixSelection.recipe.id };
    }
    const current = slot.recipeId ? recipesById.get(slot.recipeId) : undefined;
    const currentValid = current ? isValidatedRecipe(current) && isMainDishCandidate(current) && eligibleForPreferences(current, preferences) && isSeasonCompatible(current, season, monthForWeek(week)) && (!preferences.placardVide || pantryIngredientRatio(current) >= 0.8) && (!budgetWeek || budgetRecipeScore(current) >= 2) && !reserved.has(current.id) : false;
    const currentScore = current ? seasonalScore(current, season) : 0;
    if (current && currentValid && currentScore > 0 && !used.has(current.id)) {
      used.add(current.id);
      return { ...slot, name: current.name };
    }
    const alternatives = eligible
      .filter((recipe) => !used.has(recipe.id) && !reserved.has(recipe.id) && recipe.id !== current?.id)
      .map((recipe) => ({ recipe, score: seasonalScore(recipe, season) }))
      .sort((a, b) => (preferences.placardVide ? pantryIngredientRatio(b.recipe) - pantryIngredientRatio(a.recipe) : budgetWeek ? budgetRecipeScore(b.recipe) - budgetRecipeScore(a.recipe) : 0) || b.score - a.score || a.recipe.name.localeCompare(b.recipe.name, "fr"));
    const preferredAlternatives = preferences.placardVide ? alternatives.filter((item) => pantryIngredientRatio(item.recipe) >= 0.8) : budgetWeek ? alternatives.filter((item) => budgetRecipeScore(item.recipe) >= 2) : alternatives;
    const replacement = preferredAlternatives.find((item) => item.score > 0)?.recipe || preferredAlternatives[0]?.recipe || alternatives.find((item) => item.score > 0)?.recipe || alternatives[0]?.recipe;
    if (!replacement) return { ...slot, name: "Aucune recette complète validée pour ces critères", recipeId: null };
    used.add(replacement.id);
    return { ...slot, name: replacement.name, recipeId: replacement.id };
  });
  let previousDinnerCategories: string[] = [];
  if (applyBoundaryCooldown) {
    // La frontière du lundi respecte aussi le dîner du samedi précédent : les déjeuners
    // intermédiaires sont les restes, et prolongent la fenêtre anti-répétition de 48 h.
    const previousWeek = week === 1 ? 52 : week - 1;
    const previousPlanForBoundary = weekPlan(previousWeek, overrides, preferences, false, false);
    previousDinnerCategories = ["SAMEDI", "DIMANCHE"].map((day) => {
      const dinner = previousPlanForBoundary.find((slot) => slot.day === day && slot.meal === "Soir");
      return mainDishCategory(getRecipe(dinner?.recipeId));
    });
  }
  const daughterPivotRecipe = overrides[`${week}|JEUDI|Soir`] ? undefined : pivot;
  const safeResult = enforceDinnerCategoryCooldown(result, eligible, reserved, week, preferences, season, previousDinnerCategories, daughterPivotRecipe);
  if (!applyLeftovers) return safeResult;

  // Tous les déjeuners reprennent le dîner de la veille. Une substitution explicite
  // faite par l'utilisateur au déjeuner reste prioritaire.
  const previousWeek = week === 1 ? 52 : week - 1;
  const previousPlan = weekPlan(previousWeek, overrides, preferences, false, false);
  const previousDay: Record<string, string> = {
    MARDI: "LUNDI",
    MERCREDI: "MARDI",
    JEUDI: "MERCREDI",
    VENDREDI: "JEUDI",
    SAMEDI: "VENDREDI",
    DIMANCHE: "SAMEDI",
  };
  // Important : conserver les corrections de sécurité/diversité appliquées juste au-dessus.
  return safeResult.map((slot) => {
    if (slot.meal !== "Midi") return slot;
    const overrideId = overrides[`${slot.week}|${slot.day}|${slot.meal}`];
    if (overrideId) {
      const switched = recipesById.get(overrideId);
      if (switched && isValidatedRecipe(switched) && eligibleForPreferences(switched, preferences) && isSeasonCompatible(switched, season, monthForWeek(week))) {
        return { ...slot, recipeId: switched.id, name: switched.name };
      }
    }
    const sourcePlan = slot.day === "LUNDI" ? previousPlan : safeResult;
    const dinnerDay = slot.day === "LUNDI" ? "DIMANCHE" : previousDay[slot.day];
    const dinner = sourcePlan.find((item) => item.day === dinnerDay && item.meal === "Soir");
    const recipe = getRecipe(dinner?.recipeId);
    if (!dinner?.recipeId || !recipe) return slot;
    return { ...slot, recipeId: recipe.id, name: "Restes du dîner — " + recipe.name };
  });

}

/**
 * Cache mémoire du planning calculé. Batch et Courses demandaient plusieurs fois
 * exactement le même planning, et chaque calcul retraitait le catalogue complet.
 * Les paramètres font partie de la clé afin de ne jamais réutiliser un planning
 * calculé pour une autre semaine, un autre profil ou d'autres changements manuels.
 */
const weekPlanCache = new Map<string, PlanSlot[]>();

export function weekPlan(
  week: number,
  overrides: Record<string, string> = {},
  preferences: PlanningPreferences = {},
  applyLeftovers = true,
  applyBoundaryCooldown = true,
): PlanSlot[] {
  const key = JSON.stringify([week, overrides, preferences, applyLeftovers, applyBoundaryCooldown]);
  const cached = weekPlanCache.get(key);
  if (cached) return cached;
  const result = computeWeekPlan(week, overrides, preferences, applyLeftovers, applyBoundaryCooldown);
  // Cache borné : les changements successifs de semaine/profil ne gardent pas
  // une quantité illimitée de résultats dans la mémoire de l'application.
  if (weekPlanCache.size >= 80) weekPlanCache.clear();
  weekPlanCache.set(key, result);
  return result;
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
