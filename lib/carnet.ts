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
  "r-286a260f09": { image: "https://images.pexels.com/photos/9026808/pexels-photo-9026808.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Wrap au thon et légumes", imageSourceUrl: "https://www.pexels.com/photo/green-leaves-on-white-ceramic-plate-9026808/", imageCredit: "I Own My Food Art" },
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
  "r-5e88cfd057": { image: "https://images.unsplash.com/photo-1733754514582-dff4d71c4c0e?auto=format&fit=crop&w=400&h=400&q=80&fm=webp&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0", imageAlt: "Velouté de poireaux et pommes de terre", imageSourceUrl: "https://unsplash.com/photos/a-bowl-of-soup-on-a-wooden-table-DhCXK1Q1VPk", imageCredit: "Meg von Haartman" },
  "r-67352b3d01": { image: "https://images.pexels.com/photos/35358037/pexels-photo-35358037/free-photo-of-delicious-chicken-stew-with-potatoes-and-peas.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poulet mijoté aux légumes dans une sauce", imageSourceUrl: "https://www.pexels.com/photo/delicious-chicken-stew-with-potatoes-and-peas-35358037/", imageCredit: "Muhammad Khawar Nazir" },
  "r-ac95798da5": { image: "https://images.pexels.com/photos/12918197/pexels-photo-12918197.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poisson blanc accompagné de tomates cerises", imageSourceUrl: "https://www.pexels.com/photo/fish-and-vegetables-on-table-12918197/", imageCredit: "Nadin Sh" },
  "r-0a588fec75": { image: "https://images.pexels.com/photos/10837796/pexels-photo-10837796.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Wrap au poulet et salade fraîche", imageSourceUrl: "https://www.pexels.com/photo/a-close-up-shot-of-a-delicious-wrap-10837796/", imageCredit: "HamZa NOUASRIA" },
  "r-af6f91eb76": { image: "https://images.pexels.com/photos/17894221/pexels-photo-17894221/free-photo-of-stuffed-tomatoes-served-in-a-restaurant.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Tomates farcies et gratinées", imageSourceUrl: "https://www.pexels.com/photo/stuffed-tomatoes-served-in-a-restaurant-17894221/", imageCredit: "Valeria Boltneva" },
  "r-4694f50d4c": { image: "https://images.pexels.com/photos/30578207/pexels-photo-30578207/free-photo-of-roasted-chicken-leg-with-herb-potatoes.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poulet rôti et pommes de terre aux herbes", imageSourceUrl: "https://www.pexels.com/photo/roasted-chicken-leg-with-herb-potatoes-30578207/", imageCredit: "Rinat Askarov" },
  "r-4085aadefb": { image: "https://images.pexels.com/photos/40190439/pexels-photo-40190439/free-photo-of-saumon-gastronomique-aux-courgettes-et-risotto-cremeux.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Saumon roulé dans la courgette et risotto", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/saumon-gastronomique-aux-courgettes-et-risotto-cremeux-40190439/", imageCredit: "Emre Uğurlu" },
  "r-622abb4fc0": { image: "https://images.unsplash.com/photo-1664187878525-b8ad94fe569b?auto=format&fit=crop&w=400&h=400&q=80&fm=webp&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0", imageAlt: "Hachis parmentier en plat à gratin", imageSourceUrl: "https://unsplash.com/photos/a-cup-of-tea-eYRKj0vwUu4", imageCredit: "David Trinks" },
  "r-fa22488bd2": { image: "https://images.pexels.com/photos/37653982/pexels-photo-37653982.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Curry de poulet servi avec du riz et des légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-chicken-curry-dish-with-sides-37653982/", imageCredit: "Muhammad Khawar Nazir" },
  "r-2fbacfb4db": { image: "https://images.pexels.com/photos/15869769/pexels-photo-15869769.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poisson et légumes disposés sur une plaque avant cuisson en papillote", imageSourceUrl: "https://www.pexels.com/photo/fish-being-prepared-with-vegetables-and-champignons-15869769/", imageCredit: "Kate Andreeshcheva" },
  "r-b2c728a846": { image: "https://images.pexels.com/photos/32981296/pexels-photo-32981296.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Bowl de poulet, riz, avocat et concombre", imageSourceUrl: "https://www.pexels.com/photo/healthy-poke-bowl-with-rice-and-vegetables-32981296/", imageCredit: "Julia K." },
  "r-8cff60f4c8": { image: "https://images.pexels.com/photos/6544221/pexels-photo-6544221.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Salade complète au thon, œufs durs et haricots verts", imageSourceUrl: "https://www.pexels.com/photo/tuna-and-green-bean-salad-with-egg-in-bowl-6544221/", imageCredit: "Alesia Kozik" },
  "r-4231745fd3": { image: "https://images.pexels.com/photos/36895692/pexels-photo-36895692.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Pâtes crémeuses au saumon et légumes", imageSourceUrl: "https://www.pexels.com/photo/creamy-broccoli-and-salmon-pasta-dish-36895692/", imageCredit: "Christina & Peter" },
  "r-40af79300d": { image: "https://images.pexels.com/photos/29535636/pexels-photo-29535636.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Lasagnes maison gratinées aux herbes et légumes", imageSourceUrl: "https://www.pexels.com/photo/freshly-baked-lasagna-with-herbs-and-vegetables-29535636/", imageCredit: "Nano Erdozain" },
  "r-3ff1d4abc1": { image: "https://images.pexels.com/photos/4871235/pexels-photo-4871235.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Sauce tomate maison en cours de préparation dans une casserole", imageSourceUrl: "https://www.pexels.com/photo/photo-of-a-black-spoon-in-a-pot-with-tomato-sauce-4871235/", imageCredit: "Kaboompics" },
  "r-7c7db17fc6": { image: "https://images.pexels.com/photos/27588102/pexels-photo-27588102.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Émincé de poulet sauté aux poivrons colorés", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-food-with-chicken-and-peppers-on-it-27588102/", imageCredit: "Collab Media" },
  "r-fd328fb9e5": { image: "https://images.pexels.com/photos/29653146/pexels-photo-29653146.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poisson blanc accompagné de purée de pommes de terre et légumes", imageSourceUrl: "https://www.pexels.com/photo/elegant-fish-dish-with-creamy-mashed-potatoes-29653146/", imageCredit: "Valeria Boltneva" },
  "r-a50c1dc350": { image: "https://images.pexels.com/photos/32727455/pexels-photo-32727455.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Gyro grec garni de poulet et crudités", imageSourceUrl: "https://www.pexels.com/photo/delicious-greek-gyro-wrap-held-in-bright-alleyway-32727455/", imageCredit: "Vincent Rivaud" },
  "r-a619df7801": { image: "https://images.pexels.com/photos/32986486/pexels-photo-32986486/free-photo-of-minimalist-overhead-shot-of-tzatziki-sauce.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Tzatziki crémeux dans un bol en verre sur fond blanc", imageSourceUrl: "https://www.pexels.com/photo/minimalist-overhead-shot-of-tzatziki-sauce-32986486/", imageCredit: "J KREATOR" },
  "r-d66b61b9c1": { image: "https://images.pexels.com/photos/20590322/pexels-photo-20590322.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Soupe de lentilles corail dans un bol blanc avec herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/delicious-soup-with-herbs-in-white-bowl-20590322/", imageCredit: "Galiya Tenisheva" },
  "r-8cf41134a5": { image: "https://images.pexels.com/photos/38986308/pexels-photo-38986308/free-photo-of-fresh-mackerel-with-tomatoes-and-spices.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Maquereau accompagné de tomates et d'épices, vue plongeante", imageSourceUrl: "https://www.pexels.com/photo/fresh-mackerel-with-tomatoes-and-spices-38986308/", imageCredit: "Masuma Rahaman" },
  "r-c8c2401e21": { image: "https://images.pexels.com/photos/5419333/pexels-photo-5419333.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Boulettes et légumes grillés sur une assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/slices-of-zucchini-and-tomato-on-white-ceramic-plate-5419333/", imageCredit: "Polina Tankilevitch" },
  "r-3a1d6f68c6": { image: "https://images.pexels.com/photos/37226786/pexels-photo-37226786/free-photo-of-delicious-cheesy-potato-gratin-with-fresh-salad.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Gratin de pommes de terre doré servi sur une planche en bois clair", imageSourceUrl: "https://www.pexels.com/photo/delicious-cheesy-potato-gratin-with-fresh-salad-37226786/", imageCredit: "Veronika Benz" },
  "r-7608384270": { image: "https://images.pexels.com/photos/13312316/pexels-photo-13312316.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Salade de poulet grillé et légumes frais dans une assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/vegetable-salad-with-chicken-breast-on-white-ceramic-plate-13312316/", imageCredit: "Nadin Sh" },
  "r-8bb158a3a6": { image: "https://images.pexels.com/photos/33682598/pexels-photo-33682598/free-photo-of-minimalist-chicken-wrap-on-white-plate.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Wrap au poulet présenté sur une assiette blanche et un fond neutre", imageSourceUrl: "https://www.pexels.com/photo/minimalist-chicken-wrap-on-white-plate-33682598/", imageCredit: "Sue Hsu" },
  "r-dceb04ad1c": { image: "https://images.pexels.com/photos/33922142/pexels-photo-33922142/free-photo-of-vegetable-frittata-with-fresh-bread-on-marble.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Frittata aux légumes et fromage sur une surface en marbre clair", imageSourceUrl: "https://www.pexels.com/photo/vegetable-frittata-with-fresh-bread-on-marble-33922142/", imageCredit: "Anya Dunes" },
  "r-f7790c5b1a": { image: "https://images.pexels.com/photos/12622125/pexels-photo-12622125.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poulet sauté aux champignons dans un bol blanc", imageSourceUrl: "https://www.pexels.com/photo/stir-fried-white-shimeji-mushroom-12622125/", imageCredit: "Vary Ann" },
  "r-c3947a1435": { image: "https://images.pexels.com/photos/343812/pexels-photo-343812.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Saumon accompagné de légumes colorés sur fond blanc", imageSourceUrl: "https://www.pexels.com/photo/egg-dish-343812/", imageCredit: "Jay Abrantes" },
  "r-9aa4c08507": { image: "https://images.pexels.com/photos/8999081/pexels-photo-8999081.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Maquereau grillé servi avec des accompagnements sur une assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/cooked-fish-on-white-ceramic-plate-8999081/", imageCredit: "makafood" },
  "r-3f16c360b7": { image: "https://images.pexels.com/photos/10338451/pexels-photo-10338451.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Soupe de poulet et légumes dans un bol", imageSourceUrl: "https://www.pexels.com/photo/chicken-soup-with-potatoes-and-carrots-10338451/", imageCredit: "Istvan Szabo" },
  "r-d3bd7726ab": { image: "https://images.pexels.com/photos/5150320/pexels-photo-5150320.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Tartine chaude au fromage, tomates et basilic", imageSourceUrl: "https://www.pexels.com/photo/toast-with-cheese-and-vegetables-5150320/", imageCredit: "ROMAN ODINTSOV" },
  "r-0a2e578f74": { image: "https://images.pexels.com/photos/4518840/pexels-photo-4518840.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Pâtes au saumon et légumes sur une assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/pasta-in-a-fork-on-a-white-surface-4518840/", imageCredit: "Polina Tankilevitch" },
  "r-8ab1afdf0b": { image: "https://images.pexels.com/photos/5175612/pexels-photo-5175612.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=400&h=400&fm=webp&q=80", imageAlt: "Poulet accompagné d'une purée de pommes de terre et de légumes", imageSourceUrl: "https://www.pexels.com/photo/fried-food-on-white-ceramic-plate-5175612/", imageCredit: "Shameel mukkath" },
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
  "r-c886bf140e": { image: "https://images.pexels.com/photos/4491396/pexels-photo-4491396.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sandwich au thon et à l'avocat sur assiette en céramique blanche", imageSourceUrl: "https://www.pexels.com/photo/avocado-toast-on-white-ceramic-plate-4491396/", imageCredit: "Adela Cristea" },
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
