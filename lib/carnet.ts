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
  "r-1676b76791": { image: "https://images.pexels.com/photos/28618413/pexels-photo-28618413.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet tendre nappé d’une sauce crémeuse aux herbes", imageSourceUrl: "https://www.pexels.com/photo/gourmet-chicken-dish-with-herb-garnish-28618413/", imageCredit: "Sergei Starostin" },
  "r-686008ce52": { image: "https://images.pexels.com/photos/20154170/pexels-photo-20154170.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade fraîche au saumon fumé, citron et verdure", imageSourceUrl: "https://www.pexels.com/photo/white-plate-with-a-fish-spinach-and-lemon-20154170/", imageCredit: "Nadin Sh" },
  "r-abadb0568d": { image: "https://images.pexels.com/photos/10165859/pexels-photo-10165859.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes crémeuses au poulet et parmesan", imageSourceUrl: "https://www.pexels.com/photo/cooked-pasta-with-meat-on-white-ceramic-plate-10165859/", imageCredit: "Vladimír Sládek" },
  "r-f8730aa862": { image: "https://images.pexels.com/photos/28442524/pexels-photo-28442524.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap chaud au poulet grillé et légumes frais", imageSourceUrl: "https://www.pexels.com/photo/grilled-chicken-wrap-with-vegetables-plate-28442524/", imageCredit: "Nadin Sh" },
  "r-2045b89320": { image: "https://images.pexels.com/photos/17146250/pexels-photo-17146250.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté crémeux de légumes aux herbes", imageSourceUrl: "https://www.pexels.com/photo/soup-in-bowl-17146250/", imageCredit: "Nadin Sh" },
  "r-431d73ed55": { image: "https://images.pexels.com/photos/18663959/pexels-photo-18663959.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de poisson grillé au citron et pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/fish-with-lemon-18663959/", imageCredit: "Jacob Yavin" },
  "r-5f33bc99cb": { image: "https://images.pexels.com/photos/5305441/pexels-photo-5305441.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de riz au poulet et légumes colorés", imageSourceUrl: "https://www.pexels.com/photo/chicken-with-sesame-seeds-on-rice-5305441/", imageCredit: "Kai-Chieh Chan" },
  "r-ba0713507d": { image: "https://images.pexels.com/photos/5192403/pexels-photo-5192403.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de riz gourmand façon risotto", imageSourceUrl: "https://www.pexels.com/photo/meat-and-rice-5192403/", imageCredit: "Maor Attias" },
  "r-08eeb4212a": { image: "https://images.pexels.com/photos/40441625/pexels-photo-40441625.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Omelette aux tomates cerises et salade fraîche", imageSourceUrl: "https://www.pexels.com/photo/delicious-omelette-with-fresh-salad-on-granite-counter-40441625/", imageCredit: "Stefan Vibes" },
  "r-87a5bd22ce": { image: "https://images.pexels.com/photos/34227769/pexels-photo-34227769.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bowl de poulet grillé, légumes rôtis et céréales", imageSourceUrl: "https://www.pexels.com/photo/healthy-grilled-chicken-bowl-with-quinoa-and-vegetables-34227769/", imageCredit: "Novkov Visuals" },
  "r-07a3a1895b": { image: "https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de tomate et lentilles corail aux épices douces", imageSourceUrl: "https://www.pexels.com/photo/tomato-soup-in-white-ceramic-bowl-539451/", imageCredit: "Pixabay" },
  "r-88b14a0c0e": { image: "https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap méditerranéen au maquereau et crudités", imageSourceUrl: "https://www.pexels.com/photo/wrap-sandwich-with-vegetables-1656684/", imageCredit: "Daria Shevtsova" },
  "r-cac1c63ffa": { image: "https://images.pexels.com/photos/5718029/pexels-photo-5718029.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wok de poulet sauté aux légumes croquants", imageSourceUrl: "https://www.pexels.com/photo/stir-fried-vegetables-and-chicken-in-pan-5718029/", imageCredit: "Daria Shevtsova" },
  "r-41dc6e9bad": { image: "https://images.pexels.com/photos/3763847/pexels-photo-3763847.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pavé de saumon au citron et à l’aneth", imageSourceUrl: "https://www.pexels.com/photo/salmon-fillet-with-lemon-and-herbs-3763847/", imageCredit: "Valeria Boltneva" },
  "r-e50b42df27": { image: "https://images.pexels.com/photos/6605214/pexels-photo-6605214.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap façon pizza à la tomate, jambon et mozzarella", imageSourceUrl: "https://www.pexels.com/photo/tortilla-pizza-with-tomato-and-cheese-6605214/", imageCredit: "Katerina Holmes" },
  "r-26e224ccfa": { image: "https://images.pexels.com/photos/543730/pexels-photo-543730.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe complète au poulet, légumes et vermicelles", imageSourceUrl: "https://www.pexels.com/photo/chicken-noodle-soup-543730/", imageCredit: "Pixabay" },
  "r-44f84edba9": { image: "https://images.pexels.com/photos/616401/pexels-photo-616401.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet à la sauce crémeuse aux champignons", imageSourceUrl: "https://www.pexels.com/photo/chicken-mushroom-sauce-616401/", imageCredit: "Pixabay" },
  "r-ed7c62c68a": { image: "https://images.pexels.com/photos/5718028/pexels-photo-5718028.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade tiède de poulet, légumes grillés et chèvre", imageSourceUrl: "https://www.pexels.com/photo/grilled-chicken-and-vegetable-salad-5718028/", imageCredit: "Daria Shevtsova" },
  "r-f6a4cf66a1": { image: "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes au saumon fumé, courgettes et citron", imageSourceUrl: "https://www.pexels.com/photo/pasta-with-smoked-salmon-and-zucchini-1279330/", imageCredit: "Engin Akyurt" },
  "r-6ba8dd03c2": { image: "https://images.pexels.com/photos/1656685/pexels-photo-1656685.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap au poulet curry et crudités", imageSourceUrl: "https://www.pexels.com/photo/chicken-wrap-with-fresh-vegetables-1656685/", imageCredit: "Daria Shevtsova" },
  "r-1013297454": { image: "https://images.pexels.com/photos/1028425/pexels-photo-1028425.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de carottes aux lentilles corail et curry", imageSourceUrl: "https://www.pexels.com/photo/carrot-soup-with-lentils-and-curry-1028425/", imageCredit: "MART PRODUCTION" },
  "r-dc83334e68": { image: "https://images.pexels.com/photos/1059905/pexels-photo-1059905.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartine chaude au thon gratinée au fromage", imageSourceUrl: "https://www.pexels.com/photo/tuna-melt-sandwich-with-cheese-1059905/", imageCredit: "Katerina Holmes" },
  "r-e98ad53a7c": { image: "https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bowl de saumon fumé, riz et légumes croquants", imageSourceUrl: "https://www.pexels.com/photo/salmon-rice-bowl-with-fresh-vegetables-1099680/", imageCredit: "alleksana" },
  "r-771dd3aa89": { image: "https://images.pexels.com/photos/1111318/pexels-photo-1111318.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Émincé de dinde à la tomate et aux courgettes", imageSourceUrl: "https://www.pexels.com/photo/turkey-with-tomato-and-zucchini-1111318/", imageCredit: "Daria Shevtsova" },
  "r-50fe0c5f4f": { image: "https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap méditerranéen au thon et chèvre frais", imageSourceUrl: "https://www.pexels.com/photo/tuna-and-goat-cheese-wrap-1146760/", imageCredit: "Daria Shevtsova" },
  "r-6f5ef08ff7": { image: "https://images.pexels.com/photos/132694/pexels-photo-132694.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de poireaux, pommes de terre et jambon", imageSourceUrl: "https://www.pexels.com/photo/potato-leek-soup-in-bowl-132694/", imageCredit: "Pixabay" },
  "r-5fb89f740d": { image: "https://images.pexels.com/photos/1351238/pexels-photo-1351238.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tortilla façon pizza au poulet et légumes", imageSourceUrl: "https://www.pexels.com/photo/tortilla-pizza-with-chicken-and-vegetables-1351238/", imageCredit: "Katerina Holmes" },
  "r-ca623f9692": { image: "https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade complète méditerranéenne aux tomates et feta", imageSourceUrl: "https://www.pexels.com/photo/mediterranean-salad-tomato-cucumber-feta-1435735/", imageCredit: "Valeria Boltneva" },
  "r-27adcd34e6": { image: "https://images.pexels.com/photos/1473168/pexels-photo-1473168.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap frais au saumon et fromage frais", imageSourceUrl: "https://www.pexels.com/photo/salmon-cream-cheese-wrap-1473168/", imageCredit: "Daria Shevtsova" },
  "r-19acbc340f": { image: "https://images.pexels.com/photos/15146204/pexels-photo-15146204.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tomates froides farcies au thon et fromage frais", imageSourceUrl: "https://www.pexels.com/photo/stuffed-tomatoes-with-tuna-15146204/", imageCredit: "Valeria Boltneva" },
  "r-478ccb8641": { image: "https://images.pexels.com/photos/5945755/pexels-photo-5945755.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gaspacho froid de courgettes au fromage frais et basilic", imageSourceUrl: "https://www.pexels.com/photo/green-zucchini-soup-in-white-bowl-5945755/", imageCredit: "MART PRODUCTION" },
  "r-be651a77eb": { image: "https://images.pexels.com/photos/566343/pexels-photo-566343.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de crevettes, avocat, tomates et citron", imageSourceUrl: "https://www.pexels.com/photo/shrimp-avocado-salad-with-tomatoes-566343/", imageCredit: "Pixabay" },
  "r-8aa2b04e7d": { image: "https://images.pexels.com/photos/5638732/pexels-photo-5638732.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Plateau apéritif équilibré avec crudités, bouchées et gressins", imageSourceUrl: "https://www.pexels.com/photo/healthy-snack-platter-with-fresh-vegetables-5638732/", imageCredit: "Antoni Shkraba" },
  "r-bb97ddaa79": { image: "https://images.pexels.com/photos/6802049/pexels-photo-6802049.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bowl méditerranéen de pois chiches, semoule et feta", imageSourceUrl: "https://www.pexels.com/photo/mediterranean-chickpea-salad-with-feta-6802049/", imageCredit: "Daria Shevtsova" },
  "r-d8c306d68e": { image: "https://images.pexels.com/photos/5938/pexels-photo-5938.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade complète aux tomates, concombre, œufs et mozzarella", imageSourceUrl: "https://www.pexels.com/photo/mediterranean-salad-with-tomatoes-and-cucumber-5938/", imageCredit: "Pixabay" },
  "r-a7800f3ee7": { image: "https://images.pexels.com/photos/1656663/pexels-photo-1656663.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tomates mozzarella et basilic frais façon caprese", imageSourceUrl: "https://www.pexels.com/photo/caprese-salad-with-tomatoes-and-mozzarella-1656663/", imageCredit: "Daria Shevtsova" },
  "r-c20b449266": { image: "https://images.pexels.com/photos/5945754/pexels-photo-5945754.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Courgettes marinées froides au citron et à la menthe", imageSourceUrl: "https://www.pexels.com/photo/grilled-zucchini-salad-with-herbs-5945754/", imageCredit: "MART PRODUCTION" },
  "r-925e0ae075": { image: "https://images.pexels.com/photos/3655916/pexels-photo-3655916.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade fraîche de saumon fumé, avocat et jeunes pousses", imageSourceUrl: "https://www.pexels.com/photo/smoked-salmon-avocado-salad-3655916/", imageCredit: "Valeria Boltneva" },
  "r-d9dcfc7661": { image: "https://images.pexels.com/photos/566566/pexels-photo-566566.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade repas au poulet froid, tomates, maïs et œufs", imageSourceUrl: "https://www.pexels.com/photo/chicken-salad-with-lettuce-and-tomatoes-566566/", imageCredit: "Pixabay" },
  "r-c8e91f61d6": { image: "https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Brochettes de poulet et légumes grillées au barbecue", imageSourceUrl: "https://www.pexels.com/photo/chicken-vegetable-skewers-on-grill-1199957/", imageCredit: "Mali Maeder" },
  "r-43f1667b8e": { image: "https://images.pexels.com/photos/7613558/pexels-photo-7613558.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tortillas garnies au bœuf et légumes façon tacos", imageSourceUrl: "https://www.pexels.com/photo/sliced-beef-steak-and-green-vegetable-on-top-of-tortilla-7613558/", imageCredit: "Los Muertos Crew" },
  "r-9a0e8072d2": { image: "https://images.pexels.com/photos/17290375/pexels-photo-17290375.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs mimosa garnis de ciboulette et paprika", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-deviled-eggs-17290375/", imageCredit: "Büşra Yaman" },
  "r-9a84e2cfcf": { image: "https://images.pexels.com/photos/29149758/pexels-photo-29149758.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assiette de saumon avec légumes et herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/gourmet-salmon-dish-with-fresh-vegetables-29149758/", imageCredit: "Nano Erdozain" },
  "r-68f05ec51f": { image: "https://images.pexels.com/photos/5185768/pexels-photo-5185768.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de pâtes méditerranéenne aux légumes et feta", imageSourceUrl: "https://www.pexels.com/photo/pasta-with-vegetables-on-white-ceramic-plate-5185768/", imageCredit: "Jerome Govender" },
  "r-a1648b2f0a": { image: "https://images.pexels.com/photos/8112939/pexels-photo-8112939.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Papillote de saumon et légumes avec citron", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-a-cooked-fish-on-top-of-green-beans-8112939/", imageCredit: "Rachel Claire" },
  "r-16b9a93f41": { image: "https://images.pexels.com/photos/8250283/pexels-photo-8250283.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tian provençal de légumes grillés", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-cooked-vegetables-8250283/", imageCredit: "Julia Filirovska" },
  "r-4c3c676c65": { image: "https://images.pexels.com/photos/18853365/pexels-photo-18853365.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Verrines apéritives de crevettes et avocat", imageSourceUrl: "https://www.pexels.com/photo/snacks-served-in-glasses-18853365/", imageCredit: "Jonathan Borba" },
  "r-291b2944c5": { image: "https://images.pexels.com/photos/34664651/pexels-photo-34664651.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Plateau apéritif de fromages, noix et accompagnements", imageSourceUrl: "https://www.pexels.com/photo/assorted-cheese-and-charcuterie-board-layout-34664651/", imageCredit: "Novkov Visuals" },
  "r-fa4268ac37": { image: "https://images.pexels.com/photos/4753637/pexels-photo-4753637.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mélange croquant de noix et fruits secs en bols", imageSourceUrl: "https://www.pexels.com/photo/bowls-with-nuts-4753637/", imageCredit: "Antoni Shkraba" },
  "r-0e5be70f69": { image: "https://images.pexels.com/photos/10110910/pexels-photo-10110910.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de butternut crémeux servi dans une courge", imageSourceUrl: "https://www.pexels.com/photo/healthy-creamy-butternut-squash-soup-10110910/", imageCredit: "Jana Ohajdova" },
  "r-94157150e2": { image: "https://images.pexels.com/photos/17584225/pexels-photo-17584225.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gratin de courgettes au jambon et fromage gratiné", imageSourceUrl: "https://www.pexels.com/photo/meal-on-plate-17584225/", imageCredit: "alen tariq" },
  "r-2cf7843ce5": { image: "https://images.pexels.com/photos/36183176/pexels-photo-36183176.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauté de veau mijoté aux champignons", imageSourceUrl: "https://www.pexels.com/photo/gros-plan-d-un-steak-gastronomique-aux-champignons-36183176/", imageCredit: "Valeria Boltneva" },
  "r-19ce31994f": { image: "https://images.pexels.com/photos/31909815/pexels-photo-31909815.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon aux poireaux, crème et citron", imageSourceUrl: "https://www.pexels.com/photo/gourmet-salmon-fillet-with-herbs-and-lemon-31909815/", imageCredit: "Rodrigo Ortega" },
  "r-777fb77d40": { image: "https://images.pexels.com/photos/36675071/pexels-photo-36675071.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs cocotte aux champignons et ciboulette", imageSourceUrl: "https://www.pexels.com/photo/gourmet-breakfast-with-scrambled-eggs-and-mushrooms-36675071/", imageCredit: "Maryia Babuchenka" },
  "r-0d88134e0e": { image: "https://images.pexels.com/photos/6072220/pexels-photo-6072220.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Quiche aux poireaux et saumon", imageSourceUrl: "https://www.pexels.com/photo/quiche-with-tomato-toppings-6072220/", imageCredit: "Alesia Kozik" },
  "r-89467af8af": { image: "https://images.pexels.com/photos/13294540/pexels-photo-13294540.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet à la moutarde et aux champignons", imageSourceUrl: "https://www.pexels.com/photo/a-plate-of-chicken-and-mushroom-fettucine-13294540/", imageCredit: "Muhammad Fawdy" },
  "r-32efaae5de": { image: "https://images.pexels.com/photos/31673759/pexels-photo-31673759.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartiflette revisitée légère aux pommes de terre et poireaux", imageSourceUrl: "https://www.pexels.com/photo/delicious-breakfast-with-fried-egg-and-gratin-31673759/", imageCredit: "Zoltan Istella" },
  "r-9a7861ed08": { image: "https://images.pexels.com/photos/4768954/pexels-photo-4768954.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Légumes de saison rôtis au four", imageSourceUrl: "https://www.pexels.com/photo/delicious-food-in-close-up-photography-4768954/", imageCredit: "Denys Gromov" },
  "r-ce2dcf496b": { image: "https://images.pexels.com/photos/39927805/pexels-photo-39927805.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de poireaux, pommes de terre et fromage frais", imageSourceUrl: "https://www.pexels.com/photo/delicious-creamy-mushroom-soup-in-a-rustic-setting-39927805/", imageCredit: "Jahra Tasfia Reza" },
  "r-56ef344d3c": { image: "https://images.pexels.com/photos/8251070/pexels-photo-8251070.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pot-au-feu familial aux légumes", imageSourceUrl: "https://www.pexels.com/photo/photo-of-food-being-cooked-in-a-pot-8251070/", imageCredit: "Julia Filirovska" },
  "r-f33821e206": { image: "https://images.pexels.com/photos/33469319/pexels-photo-33469319.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gratin dauphinois crémeux", imageSourceUrl: "https://www.pexels.com/photo/delicieuses-pommes-de-terre-roties-avec-salade-fraiche-33469319/", imageCredit: "Valeria Boltneva" },
  "r-768e2e4a95": { image: "https://images.pexels.com/photos/17199132/pexels-photo-17199132.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Parmentier de poisson et purée maison", imageSourceUrl: "https://www.pexels.com/photo/closeup-of-a-fish-in-batter-with-lemon-slices-and-mashed-potatoes-17199132/", imageCredit: "Павел Хлыстунов" },
  "r-48999379ec": { image: "https://images.pexels.com/photos/24738514/pexels-photo-24738514.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs cocotte aux poireaux et chèvre", imageSourceUrl: "https://www.pexels.com/photo/bowl-of-sliced-rolled-omelette-24738514/", imageCredit: "Nadin Sh" },
  "r-3c29bc5010": { image: "https://images.pexels.com/photos/11895545/pexels-photo-11895545.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Chou vert farci à la viande et au riz", imageSourceUrl: "https://www.pexels.com/photo/stuffed-cabbage-in-a-kitchen-11895545/", imageCredit: "Katana" },
  "r-45b814e25e": { image: "https://images.pexels.com/photos/13322847/pexels-photo-13322847.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gratin de pâtes jambon mozzarella", imageSourceUrl: "https://www.pexels.com/photo/gourmet-dish-with-meat-and-pasta-topped-with-parsley-13322847/", imageCredit: "Valeria Boltneva" },
  "r-ae5fd0a220": { image: "https://images.pexels.com/photos/37043956/pexels-photo-37043956.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartiflette légère à la cancoillotte", imageSourceUrl: "https://www.pexels.com/photo/delicieux-fromage-gratine-aux-pommes-de-terre-et-aux-champignons-37043956/", imageCredit: "Ilo Frey" },
  "r-30a78971c9": { image: "https://images.pexels.com/photos/40565117/pexels-photo-40565117.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Lentilles corail façon curry", imageSourceUrl: "https://www.pexels.com/photo/delicieux-plat-indonesien-lontong-sayur-40565117/", imageCredit: "Rika Amani" },
  "r-c5e88517e5": { image: "https://images.pexels.com/photos/19001608/pexels-photo-19001608.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade complète de printemps aux œufs et saumon", imageSourceUrl: "https://www.pexels.com/photo/salmon-on-a-tray-in-kitchen-19001608/", imageCredit: "Lalada" },
  "r-95028bc469": { image: "https://images.pexels.com/photos/11044248/pexels-photo-11044248.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Cabillaud sauce citron et légumes verts", imageSourceUrl: "https://www.pexels.com/photo/food-restaurant-fish-cooking-11044248/", imageCredit: "Sylwester Ficek" },
  "r-596f33ac6d": { image: "https://images.pexels.com/photos/40135528/pexels-photo-40135528.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Omelette roulée aux légumes", imageSourceUrl: "https://www.pexels.com/photo/delicieuse-omelette-accompagnee-de-salade-fraiche-et-de-limonade-40135528/", imageCredit: "mehmetakifarts" },
  "r-261284b831": { image: "https://images.pexels.com/photos/15059692/pexels-photo-15059692.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet citronné aux herbes, servi avec une garniture fraîche", imageSourceUrl: "https://www.pexels.com/photo/gourmet-chicken-breast-dish-garnished-with-lemon-and-herbs-15059692/", imageCredit: "Collab Media" },
  "r-2de02c9080": { image: "https://images.pexels.com/photos/6072095/pexels-photo-6072095.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Quiche dorée au saumon et aux légumes", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-an-italian-pizza-6072095/", imageCredit: "Alesia Kozik" },
  "r-b5ed3259b0": { image: "https://images.pexels.com/photos/7491887/pexels-photo-7491887.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Risotto crémeux aux asperges et parmesan", imageSourceUrl: "https://www.pexels.com/photo/meal-on-plate-7491887/", imageCredit: "minchephoto photography" },
  "r-96900930bb": { image: "https://images.pexels.com/photos/38706540/pexels-photo-38706540.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Taboulé frais aux tomates et aux herbes", imageSourceUrl: "https://www.pexels.com/photo/fresh-tabbouleh-salad-with-tomatoes-and-herbs-38706540/", imageCredit: "Anthony Rahayel" },
  "r-fc447e98b5": { image: "https://images.pexels.com/photos/29389682/pexels-photo-29389682.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Courgettes farcies cuites au four", imageSourceUrl: "https://www.pexels.com/photo/fresh-stuffed-zucchini-on-stainless-steel-tray-29389682/", imageCredit: "Alejandro Aznar" },
  "r-2e9d82d053": { image: "https://images.pexels.com/photos/7936705/pexels-photo-7936705.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartine de poisson fumé sur pain grillé", imageSourceUrl: "https://www.pexels.com/photo/sliced-fish-on-toasted-bread-7936705/", imageCredit: "Nicola Barts" },
  "r-4f567f7e1f": { image: "https://images.pexels.com/photos/8738014/pexels-photo-8738014.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté vert de petits pois", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-pea-soup-8738014/", imageCredit: "Farhad Ibrahimzade" },
  "r-0c8602c079": { image: "https://images.pexels.com/photos/36183186/pexels-photo-36183186.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Steak accompagné de champignons et sauce crémeuse", imageSourceUrl: "https://www.pexels.com/photo/gourmet-steak-with-mushrooms-in-cream-sauce-36183186/", imageCredit: "Valeria Boltneva" },
  "r-fd08e3805f": { image: "https://images.pexels.com/photos/19062799/pexels-photo-19062799.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon fumé avec fromage et aneth", imageSourceUrl: "https://www.pexels.com/photo/smoked-salmon-with-mozzarella-cheese-dill-and-olive-oil-19062799/", imageCredit: "Nadin Sh" },
  "r-ddf63a46dd": { image: "https://images.pexels.com/photos/17320985/pexels-photo-17320985.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de crevettes et avocat", imageSourceUrl: "https://www.pexels.com/photo/a-salad-with-shrimp-and-avocado-on-top-of-a-wooden-table-17320985/", imageCredit: "Shameel mukkath" },
  "r-7867b8b26c": { image: "https://images.pexels.com/photos/32575920/pexels-photo-32575920.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade caprese à la tomate, mozzarella et basilic", imageSourceUrl: "https://www.pexels.com/photo/fresh-caprese-salad-with-basil-and-tomato-32575920/", imageCredit: "Gundula Vogel" },
  "r-af72f50591": { image: "https://images.pexels.com/photos/7994668/pexels-photo-7994668.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de betteraves, fromage et noix", imageSourceUrl: "https://www.pexels.com/photo/salad-on-a-wooden-chopping-board-7994668/", imageCredit: "Odeani Baker" },
  "r-198d2fff8f": { image: "https://images.pexels.com/photos/5589046/pexels-photo-5589046.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartine gourmande au fromage, miel et noix", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-fig-on-a-toast-5589046/", imageCredit: "AI25.Studio Studio" },
  "r-79647d4787": { image: "https://images.pexels.com/photos/33319505/pexels-photo-33319505.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade méditerranéenne au concombre et à la feta", imageSourceUrl: "https://www.pexels.com/photo/fresh-mediterranean-salad-with-cucumbers-and-feta-33319505/", imageCredit: "Iulian Sandu" },
  "r-059416b732": { image: "https://images.pexels.com/photos/36539020/pexels-photo-36539020.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Cocktail de crevettes servi dans un verre", imageSourceUrl: "https://www.pexels.com/photo/gourmet-shrimp-cocktail-in-elegant-glass-36539020/", imageCredit: "César O'neill" },
  "r-c27caf2e83": { image: "https://images.pexels.com/photos/23784968/pexels-photo-23784968.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs mimosa garnis, façon œufs farcis", imageSourceUrl: "https://www.pexels.com/photo/eggs-with-meat-23784968/", imageCredit: "Adriana Coulson" },
  "r-20345d4e26": { image: "https://images.pexels.com/photos/38802742/pexels-photo-38802742.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Carottes fraîches finement râpées", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-freshly-grated-carrots-38802742/", imageCredit: "umberto dez" },
  "r-d4f308c720": { image: "https://images.pexels.com/photos/5419047/pexels-photo-5419047.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté crémeux de champignons", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-mushroom-soup-5419047/", imageCredit: "Polina Tankilevitch" },
  "r-c9c718a4d8": { image: "https://images.pexels.com/photos/7322629/pexels-photo-7322629.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mini pizzas maison en préparation", imageSourceUrl: "https://www.pexels.com/photo/preparing-mini-pizza-7322629/", imageCredit: "Backen.de" },
  "r-0ca6f8e023": { image: "https://images.pexels.com/photos/7592526/pexels-photo-7592526.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Samoussas indiens croustillants", imageSourceUrl: "https://www.pexels.com/photo/delicious-fried-pie-in-close-up-shot-7592526/", imageCredit: "Ahmad No More" },
  "r-d6ce8ca249": { image: "https://images.pexels.com/photos/36756/pexels-photo-36756.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Feuilletés apéritifs dorés au fromage et bacon", imageSourceUrl: "https://www.pexels.com/photo/pastries-on-square-plate-36756/", imageCredit: "Pixabay" },
  "r-d018093264": { image: "https://images.pexels.com/photos/32570606/pexels-photo-32570606.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Brochettes apéritives tomate mozzarella et basilic", imageSourceUrl: "https://www.pexels.com/photo/caprese-salad-skewers-with-tomato-and-mozzarella-32570606/", imageCredit: "Gundula Vogel" },
  "r-c27d71faed": { image: "https://images.pexels.com/photos/4062617/pexels-photo-4062617.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartine avocat et œuf poché", imageSourceUrl: "https://www.pexels.com/photo/toast-with-avocado-and-poached-egg-4062617/", imageCredit: "Vincent Rivaud" },
  "r-50f64b1080": { image: "https://images.pexels.com/photos/29039081/pexels-photo-29039081.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes rigatoni à la sauce tomate", imageSourceUrl: "https://www.pexels.com/photo/delicious-rigatoni-pasta-with-tomato-sauce-29039081/", imageCredit: "Nano Erdozain" },
  "r-d5da6a7f15": { image: "https://images.pexels.com/photos/35926363/pexels-photo-35926363.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bagel au saumon fumé, concombre et fromage frais", imageSourceUrl: "https://www.pexels.com/photo/delicious-smoked-salmon-bagel-with-fresh-garnishes-35926363/", imageCredit: "Stephen Leonardi" },
  "r-a373d67eb6": { image: "https://images.pexels.com/photos/17243885/pexels-photo-17243885.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Steak grillé et légumes verts", imageSourceUrl: "https://www.pexels.com/photo/steak-on-a-plate-17243885/", imageCredit: "Nadin Sh" },
  "r-63e8770e3f": { image: "https://images.pexels.com/photos/6632328/pexels-photo-6632328.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade composée au thon, œufs et légumes frais", imageSourceUrl: "https://www.pexels.com/photo/photograph-of-a-bowl-with-a-healthy-meal-6632328/", imageCredit: "Alesia Kozik" },
  "r-f39050adb8": { image: "https://images.pexels.com/photos/10361459/pexels-photo-10361459.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap chaud au poulet et fromage", imageSourceUrl: "https://www.pexels.com/photo/cloe-up-photo-of-crisp-chicken-on-bread-served-on-wooden-tray-10361459/", imageCredit: "Mohamad Sadek" },
  "r-a36eca5de2": { image: "https://images.pexels.com/photos/14941247/pexels-photo-14941247.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Part de tortilla espagnole aux pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/photo-of-a-piece-of-spanish-omelette-14941247/", imageCredit: "MikeGz" },
  "r-5ab6473efd": { image: "https://images.pexels.com/photos/110814/pexels-photo-110814.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson blanc avec tomates et courgettes", imageSourceUrl: "https://www.pexels.com/photo/salad-in-grey-ceramic-plate-110814/", imageCredit: "mali maeder" },
  "r-26c39ad517": { image: "https://images.pexels.com/photos/1391301/pexels-photo-1391301.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Croque-monsieur accompagné de salade", imageSourceUrl: "https://www.pexels.com/photo/assorted-foods-on-table-1391301/", imageCredit: "Huy Phan" },
  "r-46db79901d": { image: "https://images.pexels.com/photos/34668502/pexels-photo-34668502.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Riz sauté au poulet et aux légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-chicken-fried-rice-with-fresh-vegetables-34668502/", imageCredit: "UNDO KIM" },
  "r-77321f17d7": { image: "https://images.pexels.com/photos/19859288/pexels-photo-19859288.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Crevettes et avocat en entrée fraîche", imageSourceUrl: "https://www.pexels.com/photo/seafood-with-cheese-and-avocado-for-dinner-19859288/", imageCredit: "Valeria Boltneva" },
  "r-01f05a70bc": { image: "https://images.pexels.com/photos/12263044/pexels-photo-12263044.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Verrine tomate mozzarella et basilic", imageSourceUrl: "https://www.pexels.com/photo/tomatoes-and-cream-on-plate-12263044/", imageCredit: "Erika Ortiz" },
  "r-76f65ddf01": { image: "https://images.pexels.com/photos/29724652/pexels-photo-29724652.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartare de thon présenté sur des crackers", imageSourceUrl: "https://www.pexels.com/photo/delicious-tuna-tartare-on-crispy-crackers-29724652/", imageCredit: "Diego Silveira" },
  "r-0e364bc1eb": { image: "https://images.pexels.com/photos/34732301/pexels-photo-34732301.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs mimosa garnis pour l'apéritif", imageSourceUrl: "https://www.pexels.com/photo/appetizing-brunch-with-drinks-and-deviled-eggs-34732301/", imageCredit: "Vincent Rivaud" },
  "r-9958fa88f3": { image: "https://images.pexels.com/photos/8697537/pexels-photo-8697537.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet grillé accompagné de pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/cooked-food-on-white-ceramic-plate-8697537/", imageCredit: "Farhad Ibrahimzade" },
  "r-570d3ee146": { image: "https://images.pexels.com/photos/18058377/pexels-photo-18058377.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pommes de terre grenaille rôties aux herbes", imageSourceUrl: "https://www.pexels.com/photo/potatoes-with-vegetables-18058377/", imageCredit: "Valeria Boltneva" },
  "r-8aa6f62f61": { image: "https://images.pexels.com/photos/9524170/pexels-photo-9524170.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Canapés de saumon fumé au fromage frais", imageSourceUrl: "https://www.pexels.com/photo/breads-with-cream-cheese-and-salmon-on-top-9524170/", imageCredit: "Matthew Osier" },
  "r-5754f74ea4": { image: "https://images.pexels.com/photos/4087618/pexels-photo-4087618.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Plateau en vue du dessus de fromages de chèvre, miel et noix", imageSourceUrl: "https://www.pexels.com/photo/assorted-cheese-on-wooden-board-4087618/", imageCredit: "Luna Lovegood" },
  "r-72156ca948": { image: "https://images.pexels.com/photos/15186040/pexels-photo-15186040.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Osso bucco de veau mijoté aux légumes", imageSourceUrl: "https://www.pexels.com/photo/meat-and-vegetable-meal-on-plate-15186040/", imageCredit: "Eduardo Krajan" },
  "r-6d6b3ad6a7": { image: "https://images.pexels.com/photos/11405383/pexels-photo-11405383.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Grand plateau apéritif de charcuteries, fromages et olives", imageSourceUrl: "https://www.pexels.com/photo/platter-with-meat-cheese-and-bread-11405383/", imageCredit: "Nadin Sh" },
  "r-9e6828ec9b": { image: "https://images.pexels.com/photos/37794985/pexels-photo-37794985.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bœuf braisé longuement mijoté avec purée", imageSourceUrl: "https://www.pexels.com/photo/gourmet-braised-beef-with-mashed-potatoes-37794985/", imageCredit: "Jay Moon" },
  "r-67464b93d7": { image: "https://images.pexels.com/photos/36605445/pexels-photo-36605445.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Parmentier de bœuf et purée de pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/gourmet-beef-dish-with-mashed-potatoes-36605445/", imageCredit: "Talha Resitoglu" },
  "r-bca09de7de": { image: "https://images.pexels.com/photos/31769307/pexels-photo-31769307.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Ravioles nappées de sauce crémeuse", imageSourceUrl: "https://www.pexels.com/photo/delicious-ravioli-with-creamy-sauce-in-ankara-31769307/", imageCredit: "Büşra Yurt" },
  "r-74cdc17071": { image: "https://images.pexels.com/photos/21327969/pexels-photo-21327969.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Part de tortilla espagnole aux pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/comida-tapas-tortilla-madrid-21327969/", imageCredit: "Ana Lourenco" },
  "r-153ae1db24": { image: "https://images.pexels.com/photos/17628615/pexels-photo-17628615.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de poisson accompagné de purée de pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/fish-served-in-a-restaurant-17628615/", imageCredit: "Valeria Boltneva" },
  "r-c385b4f7e3": { image: "https://images.pexels.com/photos/15112736/pexels-photo-15112736.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon servi sur un risotto crémeux", imageSourceUrl: "https://www.pexels.com/photo/rice-with-roasted-fish-15112736/", imageCredit: "Aquino Foto" },
  "r-7a7a3636cc": { image: "https://images.pexels.com/photos/16418674/pexels-photo-16418674.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap pizza garni de tomate et fromage", imageSourceUrl: "https://www.pexels.com/photo/box-of-take-out-food-16418674/", imageCredit: "Fernanda Lima" },
  "r-297c9b765f": { image: "https://images.pexels.com/photos/13591552/pexels-photo-13591552.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gaspacho vert à l’avocat", imageSourceUrl: "https://www.pexels.com/photo/food-at-restaurant-table-13591552/", imageCredit: "Amar Preciado" },
  "r-b13b7ef49a": { image: "https://images.pexels.com/photos/8872309/pexels-photo-8872309.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet grillé avec courgettes et légumes", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-grilled-chicken-and-vegetables-8872309/", imageCredit: "Алеся Горбунова" },
  "r-99dab97b56": { image: "https://images.pexels.com/photos/19526778/pexels-photo-19526778.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Ragoût de poulet et haricots mijoté", imageSourceUrl: "https://www.pexels.com/photo/delicious-chicken-and-bean-stew-in-bowl-19526778/", imageCredit: "Sylwester Ficek" },
  "r-86f3dad529": { image: "https://images.pexels.com/photos/5722798/pexels-photo-5722798.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pavé de saumon au citron et au thym en papillote", imageSourceUrl: "https://www.pexels.com/photo/a-salmon-fillet-topped-with-lemon-slices-5722798/", imageCredit: "Bronze Digitals" },
  "r-21ecb35072": { image: "https://images.pexels.com/photos/15390220/pexels-photo-15390220.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap kebab au poulet avec tomates et herbes", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-turkish-kebabs-lying-among-raw-ingredients-15390220/", imageCredit: "Mustafa Erdağ" },
  "r-1a7b842c25": { image: "https://images.pexels.com/photos/5419037/pexels-photo-5419037.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de potimarron en bol avec tartines", imageSourceUrl: "https://www.pexels.com/photo/pumpkin-soup-in-a-bowl-beside-the-bread-5419037/", imageCredit: "Polina Tankilevitch" },
  "r-4127f4db4e": { image: "https://images.pexels.com/photos/27969809/pexels-photo-27969809.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade composée au poulet et légumes frais", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-salad-with-chicken-vegetables-and-dressing-27969809/", imageCredit: "Valeria Boltneva" },
  "r-43279f0a89": { image: "https://images.pexels.com/photos/33413491/pexels-photo-33413491.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Curry de crevettes aux légumes", imageSourceUrl: "https://www.pexels.com/photo/traditional-bengali-prawn-curry-with-vegetables-33413491/", imageCredit: "Masuma Rahaman" },
  "r-515d64be1f": { image: "https://images.pexels.com/photos/16811678/pexels-photo-16811678.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe minestrone avec petites pâtes", imageSourceUrl: "https://www.pexels.com/photo/minestrone-soup-with-noodles-16811678/", imageCredit: "fajri nugroho" },
  "r-41e207175c": { image: "https://images.pexels.com/photos/8250362/pexels-photo-8250362.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Maquereau grillé", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-a-grilled-fish-8250362/", imageCredit: "Julia Filirovska" },
  "r-cc72756102": { image: "https://images.pexels.com/photos/11750369/pexels-photo-11750369.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartine au saumon fumé et fromage frais", imageSourceUrl: "https://www.pexels.com/photo/salmon-and-avocado-on-a-toasted-bread-11750369/", imageCredit: "Alexandra Matviets" },
  "r-8558698371": { image: "https://images.pexels.com/photos/28828774/pexels-photo-28828774.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet grillé nappé d’une sauce crémeuse", imageSourceUrl: "https://www.pexels.com/photo/grilled-chicken-with-artistic-sauce-presentation-28828774/", imageCredit: "Neeraj Anoop" },
  "r-779a0f2a64": { image: "https://images.pexels.com/photos/5848252/pexels-photo-5848252.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pizza garnie de courgettes et de fromage", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-ingredients-of-a-pizza-5848252/", imageCredit: "Polina Tankilevitch" },
  "r-12b98796b5": { image: "https://images.pexels.com/photos/40108721/pexels-photo-40108721.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Ragoût de poisson et pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/ragout-de-poisson-savoureux-aux-pommes-de-terre-et-aux-herbes-40108721/", imageCredit: "Caleb Oquendo" },
  "r-b6b064c286": { image: "https://images.pexels.com/photos/5718062/pexels-photo-5718062.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Grande table de repas avec volaille et légumes", imageSourceUrl: "https://www.pexels.com/photo/foods-on-the-table-5718062/", imageCredit: "Kaboompics" },
  "r-de7c5e03c8": { image: "https://images.pexels.com/photos/29306507/pexels-photo-29306507.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap chaud au poulet et légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-chicken-wrap-with-fries-and-soda-29306507/", imageCredit: "Nano Erdozain" },
  "r-28f8421fe5": { image: "https://images.pexels.com/photos/10692537/pexels-photo-10692537.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bœuf mijoté aux carottes et pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/cooked-food-on-white-ceramic-bowl-10692537/", imageCredit: "Yang Hao" },
  "r-dbfad26211": { image: "https://images.pexels.com/photos/30240460/pexels-photo-30240460.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de poisson au citron et aux herbes", imageSourceUrl: "https://www.pexels.com/photo/gourmet-fish-dish-with-vibrant-green-sauce-30240460/", imageCredit: "Ali Akdemir" },
  "r-3c04172738": { image: "https://images.pexels.com/photos/36560251/pexels-photo-36560251.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe-repas de bœuf et légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-bowl-of-asian-beef-soup-with-herbs-36560251/", imageCredit: "Phoebe Buffay" },
  "r-9071cb869c": { image: "https://images.pexels.com/photos/34216153/pexels-photo-34216153.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap chaud au poulet et herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/gourmet-chicken-wrap-with-lemon-and-herbs-34216153/", imageCredit: "Patricia Rodriguez" },
  "r-144c6495e5": { image: "https://images.pexels.com/photos/31960616/pexels-photo-31960616.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet et champignons dans une assiette", imageSourceUrl: "https://www.pexels.com/photo/delicious-chicken-with-rice-and-mushrooms-dish-31960616/", imageCredit: "Zola PALMER" },
  "r-6327d79929": { image: "https://images.pexels.com/photos/37057656/pexels-photo-37057656.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet accompagné de légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-homemade-chicken-vegetable-soup-37057656/", imageCredit: "Tiya Nh" },
  "r-bf2fdfecf8": { image: "https://images.pexels.com/photos/8878621/pexels-photo-8878621.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de poulet avec petites pâtes", imageSourceUrl: "https://www.pexels.com/photo/photo-of-a-dish-with-soup-and-pasta-8878621/", imageCredit: "Rafał Nawrocki" },
  "r-1b692b5363": { image: "https://images.pexels.com/photos/34664636/pexels-photo-34664636.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wraps au poulet et légumes frais", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-delicious-chicken-wraps-and-sandwiches-34664636/", imageCredit: "Novkov Visuals" },
  "r-37b8c01fc9": { image: "https://images.pexels.com/photos/20182290/pexels-photo-20182290.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson servi avec purée et sauce aux herbes", imageSourceUrl: "https://www.pexels.com/photo/meal-on-plate-20182290/", imageCredit: "Valeria Boltneva" },
  "r-25cf307601": { image: "https://images.pexels.com/photos/39039905/pexels-photo-39039905.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon crémeux aux légumes", imageSourceUrl: "https://www.pexels.com/photo/creamy-salmon-with-spinach-and-tomatoes-39039905/", imageCredit: "Lena Netkach" },
  "r-171f211235": { image: "https://images.pexels.com/photos/25951405/pexels-photo-25951405.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Risotto crémeux aux champignons", imageSourceUrl: "https://www.pexels.com/photo/chicken-risotto-with-cream-in-a-restaurant-25951405/", imageCredit: "Luis Yañez" },
  "r-1c3f5be7ab": { image: "https://images.pexels.com/photos/28291997/pexels-photo-28291997.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mijoté de viande et légumes", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-food-with-meat-and-vegetables-on-top-28291997/", imageCredit: "Valeria Boltneva" },
  "r-662c1d84d5": { image: "https://images.pexels.com/photos/31372386/pexels-photo-31372386.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson grillé au citron", imageSourceUrl: "https://www.pexels.com/photo/grilled-fish-with-lemon-on-rustic-table-31372386/", imageCredit: "José Antonio Otegui Auzmendi" },
  "r-236758c4bc": { image: "https://images.pexels.com/photos/5548452/pexels-photo-5548452.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tortilla garnie de crevettes épicées et légumes", imageSourceUrl: "https://www.pexels.com/photo/spicy-shrimps-and-vegetable-in-a-taco-shell-5548452/", imageCredit: "Alondra Medina" },
  "r-cdc393c0ab": { image: "https://images.pexels.com/photos/14457508/pexels-photo-14457508.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté crémeux au saumon et légumes", imageSourceUrl: "https://www.pexels.com/photo/14457508/", imageCredit: "Valeria Boltneva" },
  "r-dfa27ad148": { image: "https://images.pexels.com/photos/37389034/pexels-photo-37389034.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Hachis parmentier léger au poulet et pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/delicious-chicken-rolls-with-mashed-potatoes-37389034/", imageCredit: "Anthony Rahayel" },
  "r-5943623be0": { image: "https://images.pexels.com/photos/12653397/pexels-photo-12653397.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Brandade légère de cabillaud", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-a-delicious-food-12653397/", imageCredit: "Sylwester Ficek" },
  "r-da42fb44a5": { image: "https://images.pexels.com/photos/8251536/pexels-photo-8251536.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Grande salade de poulet rôti façon bistrot", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-salad-with-chicken-8251536/", imageCredit: "Julia Filirovska" },
  "r-ea7fd76f2e": { image: "https://images.pexels.com/photos/34495400/pexels-photo-34495400.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wraps façon tartiflette, pommes de terre fromage et bacon", imageSourceUrl: "https://www.pexels.com/photo/loaded-baked-potato-with-cheese-and-bacon-34495400/", imageCredit: "Nobleseed Nobleseed" },
  "r-25dfa1eb40": { image: "https://images.pexels.com/photos/20051307/pexels-photo-20051307.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe repas asiatique au poulet et nouilles", imageSourceUrl: "https://www.pexels.com/photo/bowl-of-soup-with-vegetables-20051307/", imageCredit: "Роман Нагаевский" },
  "r-3191a7ce46": { image: "https://images.pexels.com/photos/5638526/pexels-photo-5638526.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Risotto aux crevettes et légumes", imageSourceUrl: "https://www.pexels.com/photo/risotto-with-shrimps-5638526/", imageCredit: "Shameel mukkath" },
  "r-33b3fe63c3": { image: "https://images.pexels.com/photos/4669274/pexels-photo-4669274.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Dahl doux de lentilles corail", imageSourceUrl: "https://www.pexels.com/photo/hot-soup-on-red-ceramic-bowl-4669274/", imageCredit: "Denys Gromov" },
  "r-1ba8280664": { image: "https://images.pexels.com/photos/32125955/pexels-photo-32125955.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gratin de légumes du soleil", imageSourceUrl: "https://www.pexels.com/photo/cheesy-baked-casserole-in-white-dish-32125955/", imageCredit: "Helen Brudna" },
  "r-ae4f6aaa28": { image: "https://images.pexels.com/photos/23106702/pexels-photo-23106702.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap froid façon niçoise avec salade", imageSourceUrl: "https://www.pexels.com/photo/top-view-of-a-tortilla-wrap-and-a-salad-on-a-plate-23106702/", imageCredit: "Ali Dashti" },
  "r-a566224646": { image: "https://images.pexels.com/photos/17585517/pexels-photo-17585517.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe repas potiron et poulet", imageSourceUrl: "https://www.pexels.com/photo/bowl-of-stewed-chicken-and-pumpkin-standing-on-a-wooden-table-17585517/", imageCredit: "Thu Huynh" },
  "r-a474a6ba76": { image: "https://images.pexels.com/photos/38995738/pexels-photo-38995738.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Blanquette de poisson aux champignons et légumes", imageSourceUrl: "https://www.pexels.com/photo/gourmet-cod-with-mushrooms-and-peas-38995738/", imageCredit: "Nadin Sh" },
  "r-735df2ae7c": { image: "https://images.pexels.com/photos/21821579/pexels-photo-21821579.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Risotto poulet, poireaux et parmesan", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-chicken-and-rice-dish-21821579/", imageCredit: "Andres Alaniz" },
  "r-63e354bf25": { image: "https://images.pexels.com/photos/16014305/pexels-photo-16014305.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap chaud façon César au poulet", imageSourceUrl: "https://www.pexels.com/photo/fries-and-vegetables-in-tortilla-16014305/", imageCredit: "Boris Hamer" },
  "r-9924216821": { image: "https://images.pexels.com/photos/9760205/pexels-photo-9760205.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe repas retour du marché au poulet et légumes", imageSourceUrl: "https://www.pexels.com/photo/bowl-of-chicken-soup-and-vegetables-on-a-wooden-table-9760205/", imageCredit: "Biel Heinrich" },
  "r-c0a4656cd7": { image: "https://images.pexels.com/photos/8948980/pexels-photo-8948980.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet façon basquaise aux légumes du soleil", imageSourceUrl: "https://www.pexels.com/photo/dish-with-meat-and-stewed-vegetables-8948980/", imageCredit: "makafood" },
  "r-f756d2c53e": { image: "https://images.pexels.com/photos/15224982/pexels-photo-15224982.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Carrés de chocolat noir et fruits", imageSourceUrl: "https://www.pexels.com/photo/chocolate-and-fruits-on-plate-15224982/", imageCredit: "Ayşegül Akdaş" },
  "r-cfc62d8178": { image: "https://images.pexels.com/photos/36895292/pexels-photo-36895292.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Thon à la tomate et salade", imageSourceUrl: "https://www.pexels.com/photo/delicious-tuna-salad-with-boiled-eggs-and-tomatoes-36895292/", imageCredit: "Hugo Poullain" },
  "r-bac7e05aac": { image: "https://images.pexels.com/photos/1437268/pexels-photo-1437268.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs au fromage", imageSourceUrl: "https://www.pexels.com/photo/selective-focus-photography-of-omelette-with-toppings-1437268/", imageCredit: "Engin Akyurt" },
  "r-bcb36c699b": { image: "https://images.pexels.com/photos/35672955/pexels-photo-35672955.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs à la tomate façon shakshuka", imageSourceUrl: "https://www.pexels.com/photo/delicious-shakshuka-in-cast-iron-skillet-35672955/", imageCredit: "Valeria Boltneva" },
  "r-35f1833eb2": { image: "https://images.pexels.com/photos/21753120/pexels-photo-21753120.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs cocotte en petit plat", imageSourceUrl: "https://www.pexels.com/photo/baked-eggs-with-a-slice-of-bacon-salad-and-toasted-bread-21753120/", imageCredit: "Nadin Sh" },
  "r-615c01edc2": { image: "https://images.pexels.com/photos/8964280/pexels-photo-8964280.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon grillé à l’aneth et citron", imageSourceUrl: "https://www.pexels.com/photo/a-slice-of-grilled-fish-and-lime-on-a-square-ceramic-plate-8964280/", imageCredit: "RDNE Stock project" },
  "r-bb6f9bfee0": { image: "https://images.pexels.com/photos/28872868/pexels-photo-28872868.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté complet de légumes et poulet", imageSourceUrl: "https://www.pexels.com/photo/delicious-homemade-chicken-vegetable-soup-28872868/", imageCredit: "Gundula Vogel" },
  "r-c2ef299d17": { image: "https://images.pexels.com/photos/2067418/pexels-photo-2067418.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Risotto crémeux aux champignons et riz", imageSourceUrl: "https://www.pexels.com/photo/meat-with-fired-rice-on-plate-2067418/", imageCredit: "Marta Dzedyshko" },
  "r-1e1f0d67e6": { image: "https://images.pexels.com/photos/36468249/pexels-photo-36468249.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de carottes rôties", imageSourceUrl: "https://www.pexels.com/photo/creamy-roasted-carrot-soup-in-rustic-bowl-36468249/", imageCredit: "Maayan Lepon" },
  "r-cd47b05231": { image: "https://images.pexels.com/photos/5192412/pexels-photo-5192412.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson grillé et purée de pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/meal-with-lemon-5192412/", imageCredit: "Maor Attias" },
  "r-5a15ab45ea": { image: "https://images.pexels.com/photos/14822890/pexels-photo-14822890.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de lentilles épicée", imageSourceUrl: "https://www.pexels.com/photo/soup-in-bowl-14822890/", imageCredit: "Nadin Sh" },
  "r-31d50c3cdd": { image: "https://images.pexels.com/photos/5639482/pexels-photo-5639482.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon au citron et légumes", imageSourceUrl: "https://www.pexels.com/photo/fish-with-lemon-and-vegetables-5639482/", imageCredit: "Shameel mukkath" },
  "r-9876a3ed85": { image: "https://images.pexels.com/photos/10338448/pexels-photo-10338448.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Blanquette de poulet aux légumes", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-chicken-stew-10338448/", imageCredit: "Istvan Szabo" },
  "r-495d653071": { image: "https://images.pexels.com/photos/12464909/pexels-photo-12464909.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wraps garnis de poulet et légumes frais", imageSourceUrl: "https://www.pexels.com/photo/tortillas-with-chicken-lettuce-and-vegetables-12464909/", imageCredit: "Nadin Sh" },
  "r-ad870d2847": { image: "https://images.pexels.com/photos/39999793/pexels-photo-39999793.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de légumes maison", imageSourceUrl: "https://www.pexels.com/photo/warm-bowls-of-vegetable-soup-on-rustic-table-39999793/", imageCredit: "Jahra Tasfia Reza" },
  "r-47ba3b5fee": { image: "https://images.pexels.com/photos/16134553/pexels-photo-16134553.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon grillé aux légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-salmon-with-vegetables-16134553/", imageCredit: "Valeria Boltneva" },
  "r-f3761ed27c": { image: "https://images.pexels.com/photos/12214722/pexels-photo-12214722.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Spaghettis et sauce tomate façon bolognaise", imageSourceUrl: "https://www.pexels.com/photo/italian-food-on-the-table-12214722/", imageCredit: "Cihan Yüce" },
  "r-25d0571629": { image: "https://images.pexels.com/photos/20590313/pexels-photo-20590313.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de légumes maison en bol", imageSourceUrl: "https://www.pexels.com/photo/bowl-with-soup-20590313/", imageCredit: "Galiya Tenisheva" },
  "r-dadbcd01da": { image: "https://images.pexels.com/photos/20802710/pexels-photo-20802710.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de poulet et légumes", imageSourceUrl: "https://www.pexels.com/photo/soup-with-meat-20802710/", imageCredit: "Pexels contributor" },
  "r-75961f15ab": { image: "https://images.pexels.com/photos/28442559/pexels-photo-28442559.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Risotto crémeux aux champignons", imageSourceUrl: "https://www.pexels.com/photo/gourmet-risotto-with-mushrooms-on-elegant-plate-28442559/", imageCredit: "Nadin Sh" },
  "r-444a977a6e": { image: "https://images.pexels.com/photos/17628612/pexels-photo-17628612.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson grillé, purée et légumes", imageSourceUrl: "https://www.pexels.com/photo/meal-with-vegetables-on-pan-17628612/", imageCredit: "Valeria Boltneva" },
  "r-0cb8ed26c2": { image: "https://images.pexels.com/photos/36430166/pexels-photo-36430166.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet rôti à la tomate et aux olives", imageSourceUrl: "https://www.pexels.com/photo/gourmet-roast-chicken-with-tomato-sauce-36430166/", imageCredit: "Willians Huerta" },
  "r-1686e954cb": { image: "https://images.pexels.com/photos/39003151/pexels-photo-39003151.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Ratatouille aux légumes frais", imageSourceUrl: "https://www.pexels.com/photo/colorful-ratatouille-dish-with-fresh-ingredients-39003151/", imageCredit: "Veronika Benz" },
  "r-9cac1de2c9": { image: "https://images.pexels.com/photos/4210846/pexels-photo-4210846.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de nouilles au poulet", imageSourceUrl: "https://www.pexels.com/photo/bowl-with-chicken-noodle-soup-and-parsley-4210846/", imageCredit: "Kaboompics" },
  "r-bfb9dbe951": { image: "https://images.pexels.com/photos/35175191/pexels-photo-35175191.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet en sauce tomate aux herbes", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/bouchees-de-poulet-epicees-avec-sauce-tomate-35175191/", imageCredit: "Milton Das" },
  "r-4aaa394479": { image: "https://images.pexels.com/photos/29653135/pexels-photo-29653135.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de poisson poêlé avec purée et légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-pan-seared-fish-with-vegetables-29653135/", imageCredit: "Valeria Boltneva" },
  "r-3201e5785e": { image: "https://images.pexels.com/photos/6947606/pexels-photo-6947606.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Couscous aux pois chiches et légumes", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-a-food-on-plate-6947606/", imageCredit: "Abdulrhman Alkady" },
  "r-7cb0cfd0a6": { image: "https://images.pexels.com/photos/38003493/pexels-photo-38003493.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Blanquette de poulet mijotée aux légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-homemade-chicken-stew-in-container-38003493/", imageCredit: "Muhammad Khawar Nazir" },
  "r-f521379a23": { image: "https://images.pexels.com/photos/36511370/pexels-photo-36511370.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de légumes maison", imageSourceUrl: "https://www.pexels.com/photo/delicious-vegetable-soup-with-fresh-ingredients-36511370/", imageCredit: "Jade Sandra" },
  "r-da30be428f": { image: "https://images.pexels.com/photos/23627779/pexels-photo-23627779.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Risotto crémeux aux crevettes", imageSourceUrl: "https://www.pexels.com/photo/risotto-with-seafood-on-plate-23627779/", imageCredit: "Rudi Kessler" },
  "r-91fc2fb488": { image: "https://images.pexels.com/photos/27568542/pexels-photo-27568542.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tajine de poulet mijoté", imageSourceUrl: "https://www.pexels.com/photo/authentic-caribbean-food-27568542/", imageCredit: "Snappr" },
  "r-623f414416": { image: "https://images.pexels.com/photos/16134555/pexels-photo-16134555.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de poisson et légumes frais", imageSourceUrl: "https://www.pexels.com/photo/meal-with-fish-16134555/", imageCredit: "Valeria Boltneva" },
  "r-8f155f716b": { image: "https://images.pexels.com/photos/36168746/pexels-photo-36168746.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet grillé accompagné de pâtes et légumes", imageSourceUrl: "https://www.pexels.com/photo/grilled-chicken-with-vegetables-and-pasta-36168746/", imageCredit: "PANORINA." },
  "r-02b6f41621": { image: "https://images.pexels.com/photos/8992842/pexels-photo-8992842.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de légumes vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/vegetable-soup-8992842/", imageCredit: "I Own My Food Art" },
  "r-f085744e7d": { image: "https://images.pexels.com/photos/35156472/pexels-photo-35156472.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet mijoté aux herbes et légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-chicken-stew-with-potatoes-and-herbs-35156472/", imageCredit: "Muhammad Khawar Nazir" },
  "r-4217c71b5f": { image: "https://images.pexels.com/photos/27588082/pexels-photo-27588082.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson grillé et légumes rôtis", imageSourceUrl: "https://www.pexels.com/photo/a-plate-with-a-fish-and-vegetables-on-it-27588082/", imageCredit: "Collab Media" },
  "r-60bcf95349": { image: "https://images.pexels.com/photos/7883782/pexels-photo-7883782.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Risotto aux champignons et jambon", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-a-risotto-on-a-white-plate-7883782/", imageCredit: "Ilaria M" },
  "r-596d582a83": { image: "https://images.pexels.com/photos/1618952/pexels-photo-1618952.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mijoté de viande et légumes façon maison", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-meat-stew-on-white-ceramic-bowl-1618952/", imageCredit: "Zak Chapman" },
  "r-aa73347cc5": { image: "https://images.pexels.com/photos/19318450/pexels-photo-19318450.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de poisson accompagné de purée et légumes", imageSourceUrl: "https://www.pexels.com/photo/fish-fillet-with-mashed-potatoes-and-asparagus-19318450/", imageCredit: "Ethan Tran" },
  "r-a5b1b2f944": { image: "https://images.pexels.com/photos/8973165/pexels-photo-8973165.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Risotto crémeux aux légumes", imageSourceUrl: "https://www.pexels.com/photo/top-view-of-rice-dish-on-the-plate-8973165/", imageCredit: "Shardar Tarikul Islam" },
  "r-c979d2eb7c": { image: "https://images.pexels.com/photos/36040965/pexels-photo-36040965.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Ratatouille de légumes du soleil", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/gros-plan-d-un-plat-de-ratatouille-vegetalienne-colore-36040965/", imageCredit: "Edita Brus" },
  "r-e2df61f7dc": { image: "https://images.pexels.com/photos/6120511/pexels-photo-6120511.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de lentilles aux légumes", imageSourceUrl: "https://www.pexels.com/photo/lentil-soup-with-parmesan-cheese-6120511/", imageCredit: "Alesia Kozik" },
  "r-7b07af6eaa": { image: "https://images.pexels.com/photos/15059057/pexels-photo-15059057.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Curry de crevettes épicé", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-shrimp-curry-with-green-rice-15059057/", imageCredit: "Shameel mukkath" },
  "r-3b9ead72e4": { image: "https://images.pexels.com/photos/31948451/pexels-photo-31948451.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poisson grillé au citron et salade", imageSourceUrl: "https://www.pexels.com/photo/delicious-grilled-fish-with-side-salad-and-fries-31948451/", imageCredit: "Magda Ehlers" },
  "r-2f064e3e7c": { image: "https://images.pexels.com/photos/5949895/pexels-photo-5949895.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Lasagnes gratinées à la tomate et au basilic", imageSourceUrl: "https://www.pexels.com/photo/cheesy-lasagna-dish-on-a-plate-5949895/", imageCredit: "alleksana" },
  "r-8a36f3d942": { image: "https://images.pexels.com/photos/36865407/pexels-photo-36865407.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Courgettes farcies au riz", imageSourceUrl: "https://www.pexels.com/photo/delicious-stuffed-zucchini-with-rice-in-skillet-36865407/", imageCredit: "MrGajowy3 Teodor" },
  "r-465dc03a69": { image: "https://images.pexels.com/photos/7318799/pexels-photo-7318799.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe repas aux légumes et petites pâtes", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-delicious-noodles-topped-with-strips-of-onions-and-carrots-7318799/", imageCredit: "Max Griss" },
  "r-ef095266ac": { image: "https://images.pexels.com/photos/6111928/pexels-photo-6111928.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet et riz crémeux aux champignons", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-meal-on-a-plate-6111928/", imageCredit: "Piotr Arnoldes" },
  "r-259b4696a0": { image: "https://images.pexels.com/photos/24877173/pexels-photo-24877173.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon et légumes frais façon provençale", imageSourceUrl: "https://www.pexels.com/photo/a-plate-with-salmon-and-vegetables-on-it-24877173/", imageCredit: "Kadir Avşar" },
  "r-9aac879621": { image: "https://images.pexels.com/photos/37100202/pexels-photo-37100202.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mijoté de volaille aux légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-african-dish-with-chicken-and-beans-37100202/", imageCredit: "Lionel Ntasano" },
  "r-d4a2a550ce": { image: "https://images.pexels.com/photos/5388518/pexels-photo-5388518.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gratin de légumes et soupe maison", imageSourceUrl: "https://www.pexels.com/photo/soup-and-baked-food-5388518/", imageCredit: "Anastasia Belousova" },
  "r-f8241b6268": { image: "https://images.pexels.com/photos/36863877/pexels-photo-36863877.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Légumes grillés façon ratatouille", imageSourceUrl: "https://www.pexels.com/photo/gourmet-ratatouille-in-professional-kitchen-36863877/", imageCredit: "Merve Gülhan" },
  "r-421c0d31ea": { image: "https://images.pexels.com/photos/11519066/pexels-photo-11519066.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de légumes maison", imageSourceUrl: "https://www.pexels.com/photo/vegetable-cream-soup-11519066/", imageCredit: "Kübra Doğu" },
  "r-6930a9d64c": { image: "https://images.pexels.com/photos/8477221/pexels-photo-8477221.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Carottes rôties aux herbes", imageSourceUrl: "https://www.pexels.com/photo/cooked-vegetables-in-a-tray-8477221/", imageCredit: "Los Muertos Crew" },
  "r-a64a37703a": { image: "https://images.pexels.com/photos/36939720/pexels-photo-36939720.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Boulettes de viande mijotées aux légumes", imageSourceUrl: "https://www.pexels.com/photo/traditional-mediterranean-vegetable-stew-with-meatballs-36939720/", imageCredit: "zhor abdellkader" },
  "r-c3336c37fd": { image: "https://images.pexels.com/photos/32287751/pexels-photo-32287751.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet effiloché et riz en boîte repas", imageSourceUrl: "https://www.pexels.com/photo/healthy-lunch-box-with-rice-and-vegetables-32287751/", imageCredit: "David Balbino" },
  "r-0e6499780e": { image: "https://images.pexels.com/photos/32938734/pexels-photo-32938734.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Riz sauté aux œufs", imageSourceUrl: "https://www.pexels.com/photo/delicious-indonesian-fried-rice-with-egg-32938734/", imageCredit: "Dicky Agustian" },
  "r-37e800220c": { image: "https://images.pexels.com/photos/8805281/pexels-photo-8805281.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Préparation de légumes frais pour cuisine maison", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-person-putting-freshly-cut-vegetables-into-a-plastic-container-8805281/", imageCredit: "Mike Jones" },
  "r-c2e2da7c3e": { image: "https://images.pexels.com/photos/36982104/pexels-photo-36982104.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de riz garni d’œufs durs", imageSourceUrl: "https://www.pexels.com/photo/delicious-asian-cuisine-with-rice-and-eggs-36982104/", imageCredit: "rakhmat suwandi" },
  "r-a77fa5b70f": { image: "https://images.pexels.com/photos/5789/pexels-photo-5789.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de poireaux et pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/leek-and-potato-soup-5794/", imageCredit: "Karolina Grabowska" },
  "r-6f999e1699": { image: "https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Riz cuisiné avec légumes et œuf", imageSourceUrl: "https://www.pexels.com/photo/rice-with-zucchini-soft-boiled-egg-and-parsley-in-green-ceramic-plate-1410235/", imageCredit: "Lum3n" },
  "r-422181cf69": { image: "https://images.pexels.com/photos/28548859/pexels-photo-28548859.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Brochettes apéritives tomates et mozzarella", imageSourceUrl: "https://www.pexels.com/photo/delicious-appetizer-platter-with-tomatoes-and-cheese-28548859/", imageCredit: "Sascha Weber" },
  "r-03088ad201": { image: "https://images.pexels.com/photos/128408/pexels-photo-128408.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Spaghetti bolognaise maison", imageSourceUrl: "https://www.pexels.com/photo/cooked-pasta-with-sliced-tomatoes-and-green-leafy-128408/", imageCredit: "Angele J" },
  "r-43e1f116de": { image: "https://images.pexels.com/photos/31282323/pexels-photo-31282323.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol repas au riz, viande et œufs", imageSourceUrl: "https://www.pexels.com/photo/delicious-beef-bowl-with-soft-boiled-eggs-31282323/", imageCredit: "Luana Ribeiro" },
  "r-dc1f699ff9": { image: "https://images.pexels.com/photos/15261238/pexels-photo-15261238.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Plateau apéritif fromage et crudités", imageSourceUrl: "https://www.pexels.com/photo/various-snacks-on-table-15261238/", imageCredit: "Frans van Heerden" },
  "r-878168efa1": { image: "https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade complète aux œufs et maquereaux", imageSourceUrl: "https://www.pexels.com/photo/healthy-salad-with-boiled-eggs-and-fish-1639562/", imageCredit: "Pexels" },
  "r-0f5bcbbf3c": { image: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Escalope de dinde sauce moutarde", imageSourceUrl: "https://www.pexels.com/photo/grilled-chicken-breast-with-creamy-sauce-1639557/", imageCredit: "Pexels" },
  "r-31f2803315": { image: "https://images.pexels.com/photos/1639556/pexels-photo-1639556.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de poireaux, pommes de terre et carottes", imageSourceUrl: "https://www.pexels.com/photo/creamy-vegetable-soup-in-bowl-1639556/", imageCredit: "Pexels" },
  "r-dc46a25693": { image: "https://images.pexels.com/photos/1639555/pexels-photo-1639555.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Couscous léger aux merguez et légumes", imageSourceUrl: "https://www.pexels.com/photo/moroccan-couscous-with-vegetables-1639555/", imageCredit: "Pexels" },
  "r-c2e31d66fb": { image: "https://images.pexels.com/photos/1639554/pexels-photo-1639554.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Omelette aux légumes et fromage", imageSourceUrl: "https://www.pexels.com/photo/omelette-with-vegetables-and-cheese-1639554/", imageCredit: "Pexels" },
  "r-d4eedddb54": { image: "https://images.pexels.com/photos/1639553/pexels-photo-1639553.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe repas aux légumes et restes du frigo", imageSourceUrl: "https://www.pexels.com/photo/homemade-vegetable-soup-in-bowl-1639553/", imageCredit: "Pexels" },
  "r-b49be44956": { image: "https://images.pexels.com/photos/1639552/pexels-photo-1639552.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assiette fraîche aux œufs et thon", imageSourceUrl: "https://www.pexels.com/photo/fresh-tuna-and-egg-salad-1639552/", imageCredit: "Pexels" },
  "r-75c12fe616": { image: "https://images.pexels.com/photos/1639551/pexels-photo-1639551.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade repas anti-gaspi", imageSourceUrl: "https://www.pexels.com/photo/healthy-leftover-rice-salad-1639551/", imageCredit: "Pexels" },
  "r-a8cfc796b7": { image: "https://images.pexels.com/photos/1639550/pexels-photo-1639550.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Apéro repas avec tartines et crudités", imageSourceUrl: "https://www.pexels.com/photo/healthy-appetizer-platter-with-fresh-vegetables-1639550/", imageCredit: "Pexels" },
  "r-81453bfae5": { image: "https://images.pexels.com/photos/1639549/pexels-photo-1639549.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Omelette au chèvre et champignons", imageSourceUrl: "https://www.pexels.com/photo/mushroom-and-cheese-omelette-1639549/", imageCredit: "Pexels" },
  "r-816115df0d": { image: "https://images.pexels.com/photos/1639548/pexels-photo-1639548.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poêlée de merguez aux légumes du soleil", imageSourceUrl: "https://www.pexels.com/photo/sausage-and-vegetable-skillet-1639548/", imageCredit: "Pexels" },
  "r-94fc3e0a6c": { image: "https://images.pexels.com/photos/1639547/pexels-photo-1639547.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Hachis parmentier maison", imageSourceUrl: "https://www.pexels.com/photo/cottage-pie-with-mashed-potatoes-1639547/", imageCredit: "Pexels" },
  "r-69d321e278": { image: "https://images.pexels.com/photos/1639546/pexels-photo-1639546.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs brouillés façon brunch léger", imageSourceUrl: "https://www.pexels.com/photo/scrambled-eggs-with-bacon-and-chives-1639546/", imageCredit: "Pexels" },
  "r-a85a49ec3d": { image: "https://images.pexels.com/photos/1639545/pexels-photo-1639545.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Apéro repas maison", imageSourceUrl: "https://www.pexels.com/photo/assorted-finger-food-and-appetizers-1639545/", imageCredit: "Pexels" },
  "r-1713deba26": { image: "https://images.pexels.com/photos/1639544/pexels-photo-1639544.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade légère au poulet et pamplemousse", imageSourceUrl: "https://www.pexels.com/photo/chicken-salad-with-fresh-greens-1639544/", imageCredit: "Pexels" },
  "r-f810127dbe": { image: "https://images.pexels.com/photos/1639543/pexels-photo-1639543.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de légumes maison", imageSourceUrl: "https://www.pexels.com/photo/creamy-seasonal-vegetable-soup-1639543/", imageCredit: "Pexels" },
  "r-b8afa584a2": { image: "https://images.pexels.com/photos/1639542/pexels-photo-1639542.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Omelette paysanne légère", imageSourceUrl: "https://www.pexels.com/photo/country-style-omelette-with-potatoes-1639542/", imageCredit: "Pexels" },
  "r-f071220d79": { image: "https://images.pexels.com/photos/1639541/pexels-photo-1639541.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assiette froide express au riz et crudités", imageSourceUrl: "https://www.pexels.com/photo/cold-rice-salad-with-fresh-vegetables-1639541/", imageCredit: "Pexels" },
  "r-a408e19d4f": { image: "https://images.pexels.com/photos/1639540/pexels-photo-1639540.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Grande salade composée au thon et maïs", imageSourceUrl: "https://www.pexels.com/photo/tuna-corn-and-tomato-salad-1639540/", imageCredit: "Pexels" },
  "r-8506790bd0": { image: "https://images.pexels.com/photos/1639539/pexels-photo-1639539.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Apéro repas économique et convivial", imageSourceUrl: "https://www.pexels.com/photo/simple-appetizer-platter-on-table-1639539/", imageCredit: "Pexels" },
  "r-7747a895b4": { image: "https://images.pexels.com/photos/30893833/pexels-photo-30893833.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de légumes maison et tartine chaude", imageSourceUrl: "https://www.pexels.com/photo/homemade-creamy-vegetable-soup-with-bread-30893833/", imageCredit: "Gundula Vogel" },
  "r-366a4a239f": { image: "https://images.pexels.com/photos/20272479/pexels-photo-20272479.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assiette légère au poulet et crudités", imageSourceUrl: "https://www.pexels.com/photo/chicken-salad-20272479/", imageCredit: "Aida Shukuhi" },
  "r-9891c2f39f": { image: "https://images.pexels.com/photos/25748212/pexels-photo-25748212.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Omelette aux légumes et tomates façon méditerranéenne", imageSourceUrl: "https://www.pexels.com/photo/a-plate-with-a-salad-and-an-omelette-25748212/", imageCredit: "Helin Gezer" },
  "r-dabd3f5ac2": { image: "https://images.pexels.com/photos/16967013/pexels-photo-16967013.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Lasagnes maison à la viande et tomate", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-food-on-plate-16967013/", imageCredit: "Valeria Boltneva" },
  "r-047f7424eb": { image: "https://images.pexels.com/photos/13241736/pexels-photo-13241736.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade italienne tomate mozzarella basilic", imageSourceUrl: "https://www.pexels.com/photo/salad-on-a-plate-13241736/", imageCredit: "Table 🥑" },
  "r-4f91a29513": { image: "https://images.pexels.com/photos/20044229/pexels-photo-20044229.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Omelette et tomates façon brunch", imageSourceUrl: "https://www.pexels.com/photo/roasted-bread-scramble-eggs-and-tomato-salad-20044229/", imageCredit: "Nothing Ahead" },
  "r-d566f0ad2d": { image: "https://images.pexels.com/photos/25907494/pexels-photo-25907494.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Apéro mezze avec houmous et olives", imageSourceUrl: "https://www.pexels.com/photo/food-on-a-large-plate-25907494/", imageCredit: "Ali Dashti" },
  "r-c6c7772066": { image: "https://images.pexels.com/photos/20595375/pexels-photo-20595375.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gaspacho frais de tomates", imageSourceUrl: "https://www.pexels.com/photo/tomato-soup-in-glass-20595375/", imageCredit: "Cristian Jacinto" },
  "r-2ff8899cb7": { image: "https://images.pexels.com/photos/40000110/pexels-photo-40000110.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Curry de poisson au citron vert", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/delicieux-curry-de-poisson-aux-tomates-fraiches-et-au-citron-vert-40000110/", imageCredit: "Jahra Tasfia Reza" },
  "r-5f79c886a4": { image: "https://images.pexels.com/photos/13976322/pexels-photo-13976322.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe légère de légumes", imageSourceUrl: "https://www.pexels.com/photo/tomato-soup-in-ceramic-bowls-13976322/", imageCredit: "senanur ulusoy" },
  "r-64239a2c8f": { image: "https://images.pexels.com/photos/31136886/pexels-photo-31136886.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Fajitas légères au poulet et légumes", imageSourceUrl: "https://www.pexels.com/photo/fresh-grilled-chicken-salad-on-wooden-plate-31136886/", imageCredit: "KI Lee" },
  "r-a72a2c6ca6": { image: "https://images.pexels.com/photos/35886153/pexels-photo-35886153.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Curry thaï de poisson et coco", imageSourceUrl: "https://www.pexels.com/photo/delicious-thai-curry-served-in-a-coconut-shell-35886153/", imageCredit: "Arnold Nagy" },
  "r-539ef7e717": { image: "https://images.pexels.com/photos/29253301/pexels-photo-29253301.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Apéro oriental avec houmous et mezze", imageSourceUrl: "https://www.pexels.com/photo/authentic-middle-eastern-mezze-with-hummus-29253301/", imageCredit: "Ali Dashti" },
  "r-58a4b367c8": { image: "https://images.pexels.com/photos/6978238/pexels-photo-6978238.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gaspacho de tomates et tartine", imageSourceUrl: "https://www.pexels.com/photo/meal-in-bowl-6978238/", imageCredit: "Heather Brock" },
  "r-dd6ac1d41d": { image: "https://images.pexels.com/photos/34636896/pexels-photo-34636896.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade fraîche au poulet et jeunes pousses", imageSourceUrl: "https://www.pexels.com/photo/fresh-chicken-salad-with-microgreens-and-cheese-34636896/", imageCredit: "Novkov Visuals" },
  "r-24f417944a": { image: "https://images.pexels.com/photos/5852259/pexels-photo-5852259.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assiette fraîche de crudités et accompagnements", imageSourceUrl: "https://www.pexels.com/photo/photo-of-food-on-table-5852259/", imageCredit: "Antoni Shkraba" },
  "r-a12865d3c5": { image: "https://images.pexels.com/photos/36673992/pexels-photo-36673992.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Rôti de porc aux légumes", imageSourceUrl: "https://www.pexels.com/photo/roasted-pork-with-vegetables-in-a-rustic-kitchen-36673992/", imageCredit: "A B" },
  "r-2271793684": { image: "https://images.pexels.com/photos/32570608/pexels-photo-32570608.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade caprese tomate mozzarella basilic", imageSourceUrl: "https://www.pexels.com/photo/caprese-salad-with-fresh-mozzarella-and-basil-32570608/", imageCredit: "Gundula Vogel" },
  "r-ac52a1b96f": { image: "https://images.pexels.com/photos/20272476/pexels-photo-20272476.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Grande salade fraîche composée", imageSourceUrl: "https://www.pexels.com/photo/chicken-salad-20272476/", imageCredit: "Aida Shukuhi" },
  "r-b6964c1cb2": { image: "https://images.pexels.com/photos/8969237/pexels-photo-8969237.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Paëlla aux fruits de mer", imageSourceUrl: "https://www.pexels.com/photo/traditional-spanish-dish-with-seafood-served-in-the-pan-8969237/", imageCredit: "Dorota Semla" },
  "veg-ah-pdf-016": { image: "https://images.pexels.com/photos/6406460/pexels-photo-6406460.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Risotto aux champignons servi dans une assiette claire", imageSourceUrl: "https://www.pexels.com/photo/photo-of-risotto-on-a-black-and-white-plate-6406460/", imageCredit: "Max Griss" },
  "veg-ah-pdf-017": { image: "https://images.pexels.com/photos/30910492/pexels-photo-30910492.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes crémeuses au pesto vues du dessus", imageSourceUrl: "https://www.pexels.com/photo/delicious-italian-pasta-with-toppings-overhead-view-30910492/", imageCredit: "Valeria Boltneva" },
  "veg-ah-pdf-018": { image: "https://images.pexels.com/photos/31329414/pexels-photo-31329414.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gnocchis crémeux aux épinards", imageSourceUrl: "https://www.pexels.com/photo/delicious-gnocchi-with-spinach-on-plate-31329414/", imageCredit: "Sylwester Ficek" },
  "veg-ah-pdf-019": { image: "https://images.pexels.com/photos/15389375/pexels-photo-15389375.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes farcies fraîches vues de près", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/nourriture-aliments-repas-fourchette-15389375/", imageCredit: "Valeria Boltneva" },
  "veg-ah-pdf-021": { image: "https://images.pexels.com/photos/20205483/pexels-photo-20205483.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Polenta accompagnée de champignons et légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-gourmet-meal-20205483/", imageCredit: "Agustin Muñiz" },
  "veg-ah-pdf-022": { image: "https://images.pexels.com/photos/12041931/pexels-photo-12041931.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gnocchis à la tomate et mozzarella", imageSourceUrl: "https://www.pexels.com/photo/food-on-dish-12041931/", imageCredit: "Max Griss" },
  "veg-ah-pdf-023": { image: "https://images.pexels.com/photos/37274226/pexels-photo-37274226.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Rigatonis au parmesan", imageSourceUrl: "https://www.pexels.com/photo/delicious-italian-rigatoni-pasta-dish-37274226/", imageCredit: "N G" },
  "veg-ah-pdf-024": { image: "https://images.pexels.com/photos/35569021/pexels-photo-35569021.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gnocchis maison à la sauce tomate et aux épinards", imageSourceUrl: "https://www.pexels.com/photo/homemade-gnocchi-with-tomato-sauce-and-spinach-35569021/", imageCredit: "Celia Ferreira" },
  "veg-ah-pdf-025": { image: "https://images.pexels.com/photos/6240973/pexels-photo-6240973.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gnocchis aux tomates et herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/tasty-gnocchi-with-tomatoes-and-herbs-on-plate-6240973/", imageCredit: "Maria Bortolotto" },
  "veg-ah-pdf-026": { image: "https://images.pexels.com/photos/262961/pexels-photo-262961.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Penne avec sauce crémeuse et herbes", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/pates-aux-legumes-262961/", imageCredit: "Pexels" },
  "veg-ah-pdf-027": { image: "https://images.pexels.com/photos/6213750/pexels-photo-6213750.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes aux champignons photographiées du dessus", imageSourceUrl: "https://www.pexels.com/photo/pasta-with-mushrooms-on-wooden-table-6213750/", imageCredit: "Vladimir Gladkov" },
  "veg-ah-pdf-029": { image: "https://images.pexels.com/photos/17781207/pexels-photo-17781207.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gratin de pommes de terre au fromage", imageSourceUrl: "https://www.pexels.com/photo/baked-potatoes-with-onion-17781207/", imageCredit: "Jovan Vasiljević" },
  "pdf-619-15-gratin-de-chou-fleur-leger-a-la-creme-de-moutarde": { image: "https://images.pexels.com/photos/40303588/pexels-photo-40303588.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gratin de chou-fleur à la crème", imageSourceUrl: "https://www.pexels.com/photo/delicious-baked-cauliflower-dish-in-creamy-sauce-40303588/", imageCredit: "Emma Mayo" },
  "veg-ah-pdf-031": { image: "https://images.pexels.com/photos/13991403/pexels-photo-13991403.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Galettes de pommes de terre dorées", imageSourceUrl: "https://www.pexels.com/photo/potato-pancakes-on-a-plate-13991403/", imageCredit: "Reveca Chavez Perez" },
  "veg-ah-pdf-032": { image: "https://images.pexels.com/photos/18027885/pexels-photo-18027885.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Polenta crémeuse accompagnée de légumes rôtis", imageSourceUrl: "https://www.pexels.com/photo/soup-with-parsley-18027885/", imageCredit: "Oleg Mishkalenko" },
  "veg-ah-pdf-036": { image: "https://images.pexels.com/photos/29209837/pexels-photo-29209837.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Choux de Bruxelles rôtis", imageSourceUrl: "https://www.pexels.com/photo/brussels-sprouts-skewers-with-wooden-sticks-29209837/", imageCredit: "Rufina Rusakova" },
  "veg-ah-pdf-037": { image: "https://images.pexels.com/photos/33686287/pexels-photo-33686287.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Ravioles fraîches maison", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/raviolis-frais-faits-maison-sur-une-surface-farinee-33686287/", imageCredit: "Philippe Alamazani" },
  "veg-ah-pdf-038": { image: "https://images.pexels.com/photos/5535527/pexels-photo-5535527.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Courge rôtie au four", imageSourceUrl: "https://www.pexels.com/photo/a-close-up-shot-of-cooked-squash-5535527/", imageCredit: "Richa Singh" },
  "veg-ah-pdf-040": { image: "https://images.pexels.com/photos/29538425/pexels-photo-29538425.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Quiche aux épinards à la croûte dorée", imageSourceUrl: "https://www.pexels.com/photo/delicious-spinach-quiche-with-golden-crust-29538425/", imageCredit: "Nano Erdozain" },
  "veg-ah-pdf-041": { image: "https://images.pexels.com/photos/35062260/pexels-photo-35062260.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Cake au potiron présenté en tranches", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-sliced-pumpkin-loaf-cake-35062260/", imageCredit: "anaremmer" },
  "veg-ah-pdf-046": { image: "https://images.pexels.com/photos/36070855/pexels-photo-36070855.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâte salée aux épinards et fromage, vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/homemade-spinach-and-cheese-borek-preparation-36070855/", imageCredit: "Nur Tok" },
  "veg-ah-pdf-047": { image: "https://images.pexels.com/photos/17486830/pexels-photo-17486830.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pain salé farci aux épinards et fromage", imageSourceUrl: "https://www.pexels.com/photo/bread-with-vegetables-on-plate-17486830/", imageCredit: "Deane Bayas" },
  "veg-ah-pdf-050": { image: "https://images.pexels.com/photos/18363027/pexels-photo-18363027.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Omelette au fromage fondu et basilic", imageSourceUrl: "https://www.pexels.com/photo/omelette-with-melted-cheese-and-basil-18363027/", imageCredit: "Nadin Sh" },
  "veg-express-pdf-002": { image: "https://images.pexels.com/photos/1484519/pexels-photo-1484519.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bowl frais à l'avocat et aux légumes", imageSourceUrl: "https://www.pexels.com/photo/salad-with-sliced-avocado-in-bowl-1484519/", imageCredit: "Valeria Boltneva" },
  "veg-express-pdf-011": { image: "https://images.pexels.com/photos/35763746/pexels-photo-35763746.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade tiède de lentilles aux herbes", imageSourceUrl: "https://www.pexels.com/photo/hearty-lentil-dish-with-fresh-vegetables-35763746/", imageCredit: "Vural Yavas" },
  "veg-express-pdf-012": { image: "https://images.pexels.com/photos/6066050/pexels-photo-6066050.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de pois chiches et raisins secs", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-chickpea-salad-6066050/", imageCredit: "Alesia Kozik" },
  "veg-express-pdf-021": { image: "https://images.pexels.com/photos/36120987/pexels-photo-36120987.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bowl de tofu croustillant et légumes", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/delicieux-tofu-croustillant-aux-legumes-frais-36120987/", imageCredit: "CX LEE" },
  "veg-express-pdf-022": { image: "https://images.pexels.com/photos/13620780/pexels-photo-13620780.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Haricots rouges servis dans un bol", imageSourceUrl: "https://www.pexels.com/photo/food-beans-caffeine-texture-13620780/", imageCredit: "Markus Winkler" },
  "veg-express-pdf-031": { image: "https://images.pexels.com/photos/36769199/pexels-photo-36769199.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de vermicelles au tofu", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/delicieux-bol-de-soupe-de-nouilles-vietnamienne-36769199/", imageCredit: "Khải Nguyễn Thanh" },
  "veg-express-pdf-032": { image: "https://images.pexels.com/photos/9692057/pexels-photo-9692057.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bowl de couscous aux légumes et noix", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-salad-9692057/", imageCredit: "Jennifer Dridiger" },
  "veg-express-pdf-041": { image: "https://images.pexels.com/photos/7420791/pexels-photo-7420791.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sarrasin en vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/buckwheat-groats-on-plate-7420791/", imageCredit: "Vie Studio" },
  "veg-express-pdf-042": { image: "https://images.pexels.com/photos/37173396/pexels-photo-37173396.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de pois cassés vert dans un bol", imageSourceUrl: "https://www.pexels.com/photo/elegant-green-pea-soup-in-blue-decorative-bowl-37173396/", imageCredit: "Danijela Pantic Conic" },
  "veg-express-pdf-003": { image: "https://images.pexels.com/photos/39853207/pexels-photo-39853207.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Shakshuka aux œufs dans une poêle", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/delicieuse-shakshuka-aux-oeufs-a-la-poele-39853207/", imageCredit: "Jahra Tasfia Reza" },
  "veg-express-pdf-004": { image: "https://images.pexels.com/photos/35695596/pexels-photo-35695596.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe végétale au tofu et champignons", imageSourceUrl: "https://www.pexels.com/photo/vegan-soup-with-tofu-and-mushrooms-on-bamboo-plate-35695596/", imageCredit: "Paul Seling" },
  "veg-express-pdf-005": { image: "https://images.pexels.com/photos/28286253/pexels-photo-28286253.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Ragoût de haricots blancs en bol", imageSourceUrl: "https://www.pexels.com/photo/vegan-mexican-bean-soup-28286253/", imageCredit: "Nic Wood" },
  "veg-express-pdf-013": { image: "https://images.pexels.com/photos/31109619/pexels-photo-31109619.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Nouilles instantanées assaisonnées en bol", imageSourceUrl: "https://www.pexels.com/photo/delicious-bowl-of-seasoned-instant-noodles-31109619/", imageCredit: "Deep Dasgupta" },
  "veg-express-pdf-014": { image: "https://images.pexels.com/photos/40327621/pexels-photo-40327621.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poêlée de tofu et haricots verts", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/saute-colore-aux-poivrons-et-aux-haricots-verts-40327621/", imageCredit: "Taiz Vyas" },
  "veg-express-pdf-015": { image: "https://images.pexels.com/photos/7189417/pexels-photo-7189417.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pois chiches mijotés à la tomate", imageSourceUrl: "https://www.pexels.com/photo/delicious-assorted-stewed-vegetables-in-tomato-sauce-7189417/", imageCredit: "Anca" },
  "veg-express-pdf-023": { image: "https://images.pexels.com/photos/7189415/pexels-photo-7189415.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Ragoût de pois chiches et légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-cooked-rice-with-assorted-stewed-vegetables-7189415/", imageCredit: "Anca" },
  "veg-express-pdf-024": { image: "https://images.pexels.com/photos/40135673/pexels-photo-40135673.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Omelette au fromage et aux herbes", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/delicieuse-omelette-au-fromage-sur-une-table-en-bois-40135673/", imageCredit: "mehmetakifarts" },
  "veg-express-pdf-025": { image: "https://images.pexels.com/photos/5848476/pexels-photo-5848476.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poêlée de tofu fumé aux épices et légumes", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-a-chinese-food-5848476/", imageCredit: "Polina Tankilevitch" },
  "veg-express-pdf-033": { image: "https://images.pexels.com/photos/7364662/pexels-photo-7364662.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Curry de pois chiches aux épices, servi avec accompagnements", imageSourceUrl: "https://www.pexels.com/photo/cooked-food-on-the-table-7364662/", imageCredit: "Pranjall Kumar" },
  "veg-express-pdf-034": { image: "https://images.pexels.com/photos/6659622/pexels-photo-6659622.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gnocchis poêlés au parmesan et aux herbes", imageSourceUrl: "https://www.pexels.com/photo/a-gnocchi-with-cheese-on-top-6659622/", imageCredit: "Kaboompics" },
  "veg-express-pdf-035": { image: "https://images.pexels.com/photos/6275166/pexels-photo-6275166.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs à la tomate façon shakshuka dans une poêle", imageSourceUrl: "https://www.pexels.com/photo/fork-and-knife-beside-a-pan-with-cooked-food-6275166/", imageCredit: "Nataliya Vaitkevich" },
  "veg-express-pdf-043": { image: "https://images.pexels.com/photos/5848480/pexels-photo-5848480.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tofu sauté aux légumes", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-a-tofu-dish-5848480/", imageCredit: "Polina Tankilevitch" },
  "veg-express-pdf-044": { image: "https://images.pexels.com/photos/6546420/pexels-photo-6546420.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol végétarien épicé aux pois chiches", imageSourceUrl: "https://www.pexels.com/photo/vegan-chili-bowl-6546420/", imageCredit: "Alesia Kozik" },
  "veg-express-pdf-006": { image: "https://images.pexels.com/photos/6659620/pexels-photo-6659620.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gnocchis italiens au parmesan", imageSourceUrl: "https://www.pexels.com/photo/a-gnocchi-on-a-ceramic-plate-with-fork-on-the-side-6659620/", imageCredit: "Kaboompics" },
  "veg-express-pdf-007": { image: "https://images.pexels.com/photos/39549645/pexels-photo-39549645.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tortellinis à la sauce crémeuse", imageSourceUrl: "https://www.pexels.com/photo/tortellinis-gastronomiques-a-la-sauce-cremeuse-39549645/", imageCredit: "Magdalena Aleksandrowicz" },
  "veg-express-pdf-016": { image: "https://images.pexels.com/photos/15580891/pexels-photo-15580891.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gnocchis à la tomate et au fromage", imageSourceUrl: "https://www.pexels.com/photo/gnocchi-with-tomatoes-sauce-and-cheese-15580891/", imageCredit: "Elaine Reg" },
  "veg-express-pdf-017": { image: "https://images.pexels.com/photos/4748540/pexels-photo-4748540.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes au pesto, parmesan et noix", imageSourceUrl: "https://www.pexels.com/photo/pasta-pesto-on-black-ceramic-plate-4748540/", imageCredit: "Regina Ferraz" },
  "veg-express-pdf-026": { image: "https://images.pexels.com/photos/6659623/pexels-photo-6659623.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gnocchis crémeux au parmesan", imageSourceUrl: "https://www.pexels.com/photo/a-person-holding-a-grater-and-a-cheese-6659623/", imageCredit: "Kaboompics" },
  "veg-express-pdf-027": { image: "https://images.pexels.com/photos/32954490/pexels-photo-32954490.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Fettuccine à la crème et au parmesan", imageSourceUrl: "https://www.pexels.com/photo/creamy-fettuccine-with-garlic-and-parmesan-topping-32954490/", imageCredit: "Blue Arauz" },
  "veg-express-pdf-036": { image: "https://images.pexels.com/photos/10350292/pexels-photo-10350292.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tagliatelles à la crème et aux épinards", imageSourceUrl: "https://www.pexels.com/photo/food-on-white-plate-10350292/", imageCredit: "David Waschbüsch" },
  "veg-express-pdf-037": { image: "https://images.pexels.com/photos/17375424/pexels-photo-17375424.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes à la tomate et au parmesan", imageSourceUrl: "https://www.pexels.com/photo/pasta-with-tomato-sauce-sprinkled-with-parmesan-cheese-17375424/", imageCredit: "Gonzalo Acuña" },
  "veg-express-pdf-045": { image: "https://images.pexels.com/photos/13015746/pexels-photo-13015746.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de nouilles asiatiques", imageSourceUrl: "https://www.pexels.com/photo/nouilles-bol-delicieux-photo-de-nourriture-13015746/", imageCredit: "Miguel González" },
  "veg-express-pdf-046": { image: "https://images.pexels.com/photos/40000097/pexels-photo-40000097.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gnocchis poêlés aux légumes et tomates", imageSourceUrl: "https://www.pexels.com/photo/appetizing-gnocchi-dish-with-vegetables-40000097/", imageCredit: "Jahra Tasfia Reza" },
  "veg-express-pdf-008": { image: "https://images.pexels.com/photos/8230018/pexels-photo-8230018.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartines d'avocat sur pain grillé", imageSourceUrl: "https://www.pexels.com/photo/toasted-bread-with-toppings-on-a-wooden-board-8230018/", imageCredit: "Los Muertos Crew" },
  "veg-express-pdf-009": { image: "https://images.pexels.com/photos/5848718/pexels-photo-5848718.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Quesadillas aux haricots, maïs et fromage", imageSourceUrl: "https://www.pexels.com/photo/sliced-quesadilla-on-the-plate-5848718/", imageCredit: "Polina Tankilevitch" },
  "veg-express-pdf-010": { image: "https://images.pexels.com/photos/5419221/pexels-photo-5419221.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sandwich grillé au fromage fondant", imageSourceUrl: "https://www.pexels.com/photo/person-holding-bread-with-cheese-5419221/", imageCredit: "Polina Tankilevitch" },
  "veg-express-pdf-018": { image: "https://images.pexels.com/photos/36949813/pexels-photo-36949813.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Quesadilla au fromage fondant", imageSourceUrl: "https://www.pexels.com/photo/delicious-cheese-filled-quesadilla-on-a-plate-36949813/", imageCredit: "Efrem Efre" },
  "veg-express-pdf-019": { image: "https://images.pexels.com/photos/39688963/pexels-photo-39688963.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartine de fromage, confiture et noix", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/gros-plan-sur-une-tartine-de-pain-grille-avec-du-fromage-de-la-confiture-et-des-noix-39688963/", imageCredit: "Svitlana Shakalova" },
  "veg-express-pdf-020": { image: "https://images.pexels.com/photos/2161638/pexels-photo-2161638.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sandwich au fromage grillé sur appareil à panini", imageSourceUrl: "https://www.pexels.com/photo/sandwich-on-electric-griddle-2161638/", imageCredit: "David Disponett" },
  "veg-express-pdf-028": { image: "https://images.pexels.com/photos/4955219/pexels-photo-4955219.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Quesadilla au fromage et légumes", imageSourceUrl: "https://www.pexels.com/photo/sliced-tortilla-wrap-on-white-paper-4955219/", imageCredit: "ROMAN ODINTSOV" },
  "veg-express-pdf-029": { image: "https://images.pexels.com/photos/20850004/pexels-photo-20850004.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartine de pain au fromage", imageSourceUrl: "https://www.pexels.com/photo/bread-with-cheese-on-plate-20850004/", imageCredit: "fewmiracles" },
  "veg-express-pdf-030": { image: "https://images.pexels.com/photos/30700809/pexels-photo-30700809.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sandwich mozzarella, tomate et pesto", imageSourceUrl: "https://www.pexels.com/photo/delicious-caprese-sandwich-with-mozzarella-30700809/", imageCredit: "Photographe Pexels" },
  "veg-express-pdf-038": { image: "https://images.pexels.com/photos/5840093/pexels-photo-5840093.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Quesadilla croustillante", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-quesadilla-5840093/", imageCredit: "ROMAN ODINTSOV" },
  "veg-express-pdf-039": { image: "https://images.pexels.com/photos/30346820/pexels-photo-30346820.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sandwich grillé au fromage fondu", imageSourceUrl: "https://www.pexels.com/photo/delicious-grilled-cheese-sandwich-on-plate-30346820/", imageCredit: "Griffin Wooldridge" },
  "veg-express-pdf-040": { image: "https://images.pexels.com/photos/14043699/pexels-photo-14043699.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sandwich au fromage doré à la poêle", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-toasting-a-bread-on-a-pan-14043699/", imageCredit: "Connor Scott McManus" },

  "r-58383d3c85": { image: "https://images.pexels.com/photos/37273396/pexels-photo-37273396.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gaspacho de tomate en bol blanc, vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/delicious-gazpacho-soup-with-croutons-37273396/", imageCredit: "Firefly✨" },
  "r-b8f3ca3d87": { image: "https://images.pexels.com/photos/19145679/pexels-photo-19145679.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gratin d’aubergines à la parmigiana", imageSourceUrl: "https://www.pexels.com/photo/meal-in-glass-box-19145679/", imageCredit: "Lauren Diaz" },
  "r-66e3f98330": { image: "https://images.pexels.com/photos/17597414/pexels-photo-17597414.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bowl de poulet grillé, avocat et légumes frais", imageSourceUrl: "https://www.pexels.com/photo/bowl-of-sliced-fruits-checken-and-chopped-avocado-17597414/", imageCredit: "Rasul Yarichev" },
  "r-3e85bd0bdb": { image: "https://images.pexels.com/photos/32722832/pexels-photo-32722832.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Maquereau grillé au citron et aux oignons nouveaux", imageSourceUrl: "https://www.pexels.com/photo/grilled-mackerel-with-lemon-and-scallions-32722832/", imageCredit: "Richard L" },
  "r-c820a60eaa": { image: "https://images.pexels.com/photos/20943934/pexels-photo-20943934.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mijoté de viande et légumes en cocotte, vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/stew-in-a-pot-20943934/", imageCredit: "Change C.C" },
  "r-a8b136d57a": { image: "https://images.pexels.com/photos/14720901/pexels-photo-14720901.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Couscous de légumes dans un bol", imageSourceUrl: "https://www.pexels.com/photo/salad-in-bowl-on-cutting-board-14720901/", imageCredit: "Яна Горбунова" },
  "r-93a95052bc": { image: "https://images.pexels.com/photos/29535635/pexels-photo-29535635.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap de poulet garni de légumes frais", imageSourceUrl: "https://www.pexels.com/photo/healthy-chicken-wrap-with-fresh-vegetables-29535635/", imageCredit: "Nano Erdozain" },
  "r-ae2c11e95f": { image: "https://images.pexels.com/photos/10520136/pexels-photo-10520136.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade composée aux œufs, jambon et crudités", imageSourceUrl: "https://www.pexels.com/photo/fresh-boiled-eggs-and-salad-10520136/", imageCredit: "Kristina Paukshtite" },
  "r-debb8aa3cb": { image: "https://images.pexels.com/photos/15114547/pexels-photo-15114547.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Steak accompagné de frites et de sauce, vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/meat-and-fries-on-plate-15114547/", imageCredit: "Nadin Sh" },
  "r-0776d4e3ad": { image: "https://images.pexels.com/photos/6169446/pexels-photo-6169446.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poke bowl au poisson, avocat, mangue et riz", imageSourceUrl: "https://www.pexels.com/photo/vegetable-salad-with-rice-in-a-bowl-6169446/", imageCredit: "Hannah Milar" },

  "r-5ca59a7bb1": { image: "https://images.pexels.com/photos/27588093/pexels-photo-27588093.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pot-au-feu de bœuf et légumes dans un bol", imageSourceUrl: "https://www.pexels.com/photo/a-plate-of-food-with-meat-and-peppers-on-it-27588093/", imageCredit: "Collab Media" },
  "r-3279be4884": { image: "https://images.pexels.com/photos/30700803/pexels-photo-30700803.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade Cobb au poulet, œufs, bacon et légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-cobb-salad-with-fresh-ingredients-30700803/", imageCredit: "Photographe Pexels" },
  "r-0a15688331": { image: "https://images.pexels.com/photos/15642992/pexels-photo-15642992.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartines de poisson et pain, esprit bistrot nordique", imageSourceUrl: "https://www.pexels.com/photo/bread-with-fish-15642992/", imageCredit: "Andrea Mosti" },
  "r-434a50549d": { image: "https://images.pexels.com/photos/27098511/pexels-photo-27098511.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe froide de tomate garnie de basilic", imageSourceUrl: "https://www.pexels.com/photo/tomato-soup-on-a-table-27098511/", imageCredit: "Valeria Boltneva" },
  "r-b22f2419d1": { image: "https://images.pexels.com/photos/15997891/pexels-photo-15997891.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Omelette espagnole aux pommes de terre", imageSourceUrl: "https://www.pexels.com/photo/fork-and-food-on-plate-15997891/", imageCredit: "Maryna Miaskovska" },
  "r-12e486e8e0": { image: "https://images.pexels.com/photos/5963879/pexels-photo-5963879.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gaspacho rouge de tomate en bol", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-a-bowl-of-soup-5963879/", imageCredit: "Kent Ng" },
  "r-47cbdf86d8": { image: "https://images.pexels.com/photos/12261078/pexels-photo-12261078.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade fermière au poulet grillé et œufs", imageSourceUrl: "https://www.pexels.com/photo/food-on-table-12261078/", imageCredit: "René Roa" },
  "r-fa77d7d2bd": { image: "https://images.pexels.com/photos/36958915/pexels-photo-36958915.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Boulettes de bœuf nappées de sauce tomate", imageSourceUrl: "https://www.pexels.com/photo/delicious-homemade-meatballs-in-tomato-sauce-36958915/", imageCredit: "Cookie Marenco" },
  "r-665d3b621c": { image: "https://images.pexels.com/photos/34019400/pexels-photo-34019400.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Fish and chips avec frites dorées et sauce", imageSourceUrl: "https://www.pexels.com/photo/crispy-fish-and-chips-with-tartar-sauce-34019400/", imageCredit: "Ђорђе Милутиновић" },
  "r-268226fb4c": { image: "https://images.pexels.com/photos/17402671/pexels-photo-17402671.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de tomate au basilic", imageSourceUrl: "https://www.pexels.com/photo/tomato-soup-in-plate-on-table-17402671/", imageCredit: "Nadin Sh" },
  "r-4ccfcd0587": { image: "https://images.pexels.com/photos/16845754/pexels-photo-16845754.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de poisson accompagné de sauce crémeuse et légumes", imageSourceUrl: "https://www.pexels.com/photo/plate-with-fried-fish-and-veggies-16845754/", imageCredit: "Huzaifa Bukhari" },
  "r-3e02890fd4": { image: "https://images.pexels.com/photos/20004804/pexels-photo-20004804.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté vert de brocoli en bol, vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/bowl-of-broccoli-soup-20004804/", imageCredit: "Rahul Sonawane" },
  "r-c1c8dc825f": { image: "https://images.pexels.com/photos/32056277/pexels-photo-32056277.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tomates et concombre frais en bol", imageSourceUrl: "https://www.pexels.com/photo/fresh-veggie-salad-bowl-with-cucumbers-and-tomatoes-32056277/", imageCredit: "Áλικα" },
  "r-93ba3d7774": { image: "https://images.pexels.com/photos/17790266/pexels-photo-17790266.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Penne nappées de sauce tomate, vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/pasta-on-a-plate-17790266/", imageCredit: "Tina Facanni" },
  "r-854fcca6a9": { image: "https://images.pexels.com/photos/19737927/pexels-photo-19737927.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Burger de poulet avec salade et tomate", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-chicken-burger-with-lettuce-and-tomato-19737927/", imageCredit: "Manav Chahal" },
  "r-a554cb564b": { image: "https://images.pexels.com/photos/14864273/pexels-photo-14864273.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gaspacho de melon frais dans un bol blanc", imageSourceUrl: "https://www.pexels.com/photo/pouring-cream-soup-into-bowl-14864273/", imageCredit: "MikeGz" },
  "test-pizza-s1": { image: "https://images.pexels.com/photos/4394619/pexels-photo-4394619.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pizza maison aux champignons, vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/overhead-shot-of-a-pizza-with-mushrooms-4394619/", imageCredit: "Natasha Filippovskaya" },
  "test-burger-s1": { image: "https://images.pexels.com/photos/14509069/pexels-photo-14509069.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Burger au bœuf, tomate, salade et frites", imageSourceUrl: "https://www.pexels.com/photo/beef-burger-with-tomato-and-lettuce-14509069/", imageCredit: "Ruben Dao Cuentas" },
,
  "test-pizza-s2": { image: "https://images.pexels.com/photos/29268348/pexels-photo-29268348.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pizza express garnie de boulettes et légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-italian-pizza-with-asian-twist-29268348/", imageCredit: "Eduardo Escalante" },
  "test-burger-s2": { image: "https://images.pexels.com/photos/27469753/pexels-photo-27469753.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Burger au bœuf avec pain au sésame et frites", imageSourceUrl: "https://www.pexels.com/photo/a-hamburger-with-fries-on-a-plate-next-to-a-drink-27469753/", imageCredit: "Philippe Alamazani" },
  "test-croques-s1": { image: "https://images.pexels.com/photos/28396817/pexels-photo-28396817.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sandwich chaud au jambon, fromage et tomate", imageSourceUrl: "https://www.pexels.com/photo/delicious-ham-and-cheese-sandwich-on-a-plate-28396817/", imageCredit: "SERHAT TUĞ" },
  "test-croques-s2": { image: "https://images.pexels.com/photos/40135584/pexels-photo-40135584.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sandwich grillé au fromage et légumes frais", imageSourceUrl: "https://www.pexels.com/fr-fr/photo/sandwich-au-fromage-grille-et-aux-legumes-frais-40135584/", imageCredit: "mehmetakifarts" },
  "test-assiette-batch-s2": { image: "https://images.pexels.com/photos/13803824/pexels-photo-13803824.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol repas de poulet, riz et légumes", imageSourceUrl: "https://www.pexels.com/photo/bowl-with-rice-chicken-and-vegetables-13803824/", imageCredit: "Sude Akpınar" },
  "test-assiette-batch-s1": { image: "https://images.pexels.com/photos/30635713/pexels-photo-30635713.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Boîte de meal prep au poulet et brocoli", imageSourceUrl: "https://www.pexels.com/photo/healthy-meal-prep-with-chicken-and-broccoli-30635713/", imageCredit: "IARA MELO" },
  "test-sauce-champignons": { image: "https://images.pexels.com/photos/5950430/pexels-photo-5950430.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce crémeuse aux champignons présentée dans un bol", imageSourceUrl: "https://www.pexels.com/photo/bowl-of-soup-with-mushroom-on-top-5950430/", imageCredit: "alleksana" },
  "test-sauce-citron-ciboulette": { image: "https://images.pexels.com/photos/38845223/pexels-photo-38845223.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce au yaourt et herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/delicious-yogurt-dip-with-grilled-bread-38845223/", imageCredit: "Amine Kübranur Çakıroğlu" },
  "test-vinaigrette-moutarde-citron": { image: "https://images.pexels.com/photos/14457277/pexels-photo-14457277.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Vinaigrette moutarde versée sur une salade", imageSourceUrl: "https://www.pexels.com/photo/dressing-on-a-salad-14457277/", imageCredit: "Valeria Boltneva" },
  "test-sauce-yaourt-moutarde": { image: "https://images.pexels.com/photos/39927806/pexels-photo-39927806.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sauce au yaourt et herbes sur un plat", imageSourceUrl: "https://www.pexels.com/photo/delicious-manti-dish-with-yogurt-sauce-39927806/", imageCredit: "Jahra Tasfia Reza" },
  "test-diner-festive-s1": { image: "https://images.pexels.com/photos/12116169/pexels-photo-12116169.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet gratiné au fromage, tomates et basilic", imageSourceUrl: "https://www.pexels.com/photo/cooked-chicken-with-creamy-topping-on-a-ceramic-plate-12116169/", imageCredit: "Froimar Andrea Rodriguez" },
  "test-diner-festive-s2": { image: "https://images.pexels.com/photos/18001759/pexels-photo-18001759.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Quesadilla au poulet servie avec herbes et sauce", imageSourceUrl: "https://www.pexels.com/photo/tortilla-bread-with-meat-18001759/", imageCredit: "Valeria Boltneva" },
  "cco-pizza-mediterranee": { image: "https://images.pexels.com/photos/29173088/pexels-photo-29173088.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pizza maison aux légumes frais", imageSourceUrl: "https://www.pexels.com/photo/delicious-homemade-pizza-with-fresh-vegetables-29173088/", imageCredit: "Kunal Lakhotia" },
  "cco-pizza-jambon-champignons": { image: "https://images.pexels.com/photos/12288354/pexels-photo-12288354.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pizza maison au jambon et champignons", imageSourceUrl: "https://www.pexels.com/photo/pizza-with-ham-and-mushroom-toppings-12288354/", imageCredit: "Nadin Sh" },
  "cco-pizza-trois-fromages": { image: "https://images.pexels.com/photos/17800186/pexels-photo-17800186.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pizza généreuse à la mozzarella fondue", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-cheese-pizza-17800186/", imageCredit: "Nadin Sh" },
  "cco-pizza-poulet-bbq": { image: "https://images.pexels.com/photos/33458049/pexels-photo-33458049.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pizza au poulet et sauce barbecue", imageSourceUrl: "https://www.pexels.com/photo/delicious-barbecue-chicken-pizza-on-wooden-table-33458049/", imageCredit: "pedro furtado" },
  "cco-burger-bistrot": { image: "https://images.pexels.com/photos/27098510/pexels-photo-27098510.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Burger gourmand servi dans une assiette", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-burger-on-a-plate-in-a-restaurant-27098510/", imageCredit: "Valeria Boltneva" },
  "cco-burger-poulet": { image: "https://images.pexels.com/photos/918581/pexels-photo-918581.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Burger croustillant de poulet au fromage et légumes", imageSourceUrl: "https://www.pexels.com/photo/shallow-focus-photography-of-hamburger-918581/", imageCredit: "Andra" },
  "cco-burger-montagnard": { image: "https://images.pexels.com/photos/19119497/pexels-photo-19119497.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Burger au bœuf, fromage et bacon", imageSourceUrl: "https://www.pexels.com/photo/burger-served-in-a-restaurant-19119497/", imageCredit: "The Castlebar" },
  "cco-burger-italien": { image: "https://images.pexels.com/photos/9673525/pexels-photo-9673525.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Cheeseburger gourmand servi avec frites", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-a-beef-burger-on-a-plate-9673525/", imageCredit: "AMANDA LIM" },
,
  "cco-tacos-poulet": { image: "https://images.pexels.com/photos/18032209/pexels-photo-18032209.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tacos garnis de poisson et herbes fraîches avec citron vert", imageSourceUrl: "https://www.pexels.com/photo/tacos-on-table-18032209/", imageCredit: "Amar Preciado" },
  "cco-tacos-boeuf": { image: "https://images.pexels.com/photos/38948386/pexels-photo-38948386.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tacos au bœuf épicé et garnitures fraîches", imageSourceUrl: "https://www.pexels.com/photo/delicious-beef-tacos-with-refreshing-beverage-38948386/", imageCredit: "Lilian Serrano" },
  "cco-tacos-poisson": { image: "https://images.pexels.com/photos/8448322/pexels-photo-8448322.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tacos de poisson avec coriandre, citron vert et oignons", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-mouth-watering-tacos-8448322/", imageCredit: "Los Muertos Crew" },
  "cco-tacos-veggie": { image: "https://images.pexels.com/photos/5848714/pexels-photo-5848714.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tacos végétariens garnis de haricots, maïs et guacamole", imageSourceUrl: "https://www.pexels.com/photo/scrumptious-tacos-on-a-plate-5848714/", imageCredit: "Polina Tankilevitch" },
  "cco-veloute-potimarron": { image: "https://images.pexels.com/photos/5662190/pexels-photo-5662190.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de potimarron onctueux aux graines", imageSourceUrl: "https://www.pexels.com/photo/pumpkin-soup-on-a-bowl-5662190/", imageCredit: "KATRIN BOLOVTSOVA" },
  "cco-veloute-poireaux": { image: "https://images.pexels.com/photos/5793/pexels-photo-5793.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de poireaux et pommes de terre aux herbes", imageSourceUrl: "https://www.pexels.com/photo/leek-and-potato-soup-hand-5793/", imageCredit: "Karolina Grabowska" },
  "cco-veloute-carotte-poireau": { image: "https://images.pexels.com/photos/17559227/pexels-photo-17559227.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de légumes maison servie avec du pain", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-soup-with-bread-and-vegetables-on-a-white-table-17559227/", imageCredit: "Phat Nguy" },
  "cco-veloute-courgette-basilic": { image: "https://images.pexels.com/photos/8800684/pexels-photo-8800684.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe verte de légumes et concombre aux herbes", imageSourceUrl: "https://www.pexels.com/photo/bowl-of-vegetables-soaking-in-water-8800684/", imageCredit: "Pew Nguyen" },
  "cco-gaspacho-andalou": { image: "https://images.pexels.com/photos/8357688/pexels-photo-8357688.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gaspacho frais servi avec du pain grillé", imageSourceUrl: "https://www.pexels.com/photo/a-person-holding-a-plate-8357688/", imageCredit: "Ron Lach" },
  "cco-gaspacho-concombre": { image: "https://images.pexels.com/photos/16698356/pexels-photo-16698356.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe froide aux herbes et concombre dans un bol vert", imageSourceUrl: "https://www.pexels.com/photo/red-soup-with-herbs-16698356/", imageCredit: "Nadin Sh" },
  "cco-veloute-courge-chataigne": { image: "https://images.pexels.com/photos/16066860/pexels-photo-16066860.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de courge crémeux aux graines", imageSourceUrl: "https://www.pexels.com/photo/pumpkin-soup-with-seeds-and-cream-16066860/", imageCredit: "Mixshot Marcin Lampart" },
  "cco-veloute-carotte-lentilles": { image: "https://images.pexels.com/photos/4451869/pexels-photo-4451869.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de soupe de carottes aux herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/golden-spoon-near-soup-bowl-4451869/", imageCredit: "alleksana" },
  "cco-slot-20-samedi-midi": { image: "https://images.pexels.com/photos/12916874/pexels-photo-12916874.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de poulet et riz avec herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/rice-bowl-with-cooked-chicken-on-top-12916874/", imageCredit: "Denys Gromov" },
  "cco-slot-20-samedi-soir": { image: "https://images.pexels.com/photos/11033944/pexels-photo-11033944.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de légumes servie dans un bol rustique", imageSourceUrl: "https://www.pexels.com/photo/ladle-pouring-soup-into-a-bowl-11033944/", imageCredit: "Jana Ohajdova" },
  "cco-slot-35-lundi-midi": { image: "https://images.pexels.com/photos/36982103/pexels-photo-36982103.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assiette de riz au poulet et légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-plate-of-rice-and-fried-chicken-meal-36982103/", imageCredit: "rakhmat suwandi" },
  "cco-slot-35-lundi-soir": { image: "https://images.pexels.com/photos/16203215/pexels-photo-16203215.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe de carottes présentée dans une porcelaine blanche", imageSourceUrl: "https://www.pexels.com/photo/soup-in-bowl-and-cup-16203215/", imageCredit: "Büşra Yaman" },
  "cco-slot-35-mardi-midi": { image: "https://images.pexels.com/photos/18469435/pexels-photo-18469435.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assiette de poulet au riz, œuf et légumes", imageSourceUrl: "https://www.pexels.com/photo/chicken-meat-and-rice-in-bowl-18469435/", imageCredit: "Nadin Sh" },
  "cco-slot-35-mardi-soir": { image: "https://images.pexels.com/photos/23531648/pexels-photo-23531648.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de potiron au feta et aux herbes", imageSourceUrl: "https://www.pexels.com/photo/soup-in-a-bowl-23531648/", imageCredit: "Isabella Mendes" },
  "cco-slot-35-mercredi-midi": { image: "https://images.pexels.com/photos/34463118/pexels-photo-34463118.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet grillé avec riz, salade et légumes", imageSourceUrl: "https://www.pexels.com/photo/delicious-grilled-chicken-with-rice-and-vegetables-34463118/", imageCredit: "Nascimento Jr." },
  "cco-slot-35-mercredi-soir": { image: "https://images.pexels.com/photos/9124024/pexels-photo-9124024.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de potiron aux graines et herbes", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-soup-and-spoon-surrounded-by-pumpkins-and-leaves-9124024/", imageCredit: "Loren Castillo" },
,
  "noel-entree-01": { image: "https://images.pexels.com/photos/6853456/pexels-photo-6853456.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de potimarron onctueux aux graines", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-pumpkin-soup-6853456/", imageCredit: "cottonbro studio" },
  "noel-entree-02": { image: "https://images.pexels.com/photos/4580112/pexels-photo-4580112.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon fumé à l'aneth, joliment présenté", imageSourceUrl: "https://www.pexels.com/photo/salmon-and-cheese-on-plate-4580112/", imageCredit: "Kaysha" },
  "noel-entree-03": { image: "https://images.pexels.com/photos/12335533/pexels-photo-12335533.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Focaccia dorée aux oignons caramélisés et romarin", imageSourceUrl: "https://www.pexels.com/photo/fresh-focaccia-with-salt-and-rosemary-12335533/", imageCredit: "Daria Ponomareva" },
  "noel-entree-04": { image: "https://images.pexels.com/photos/38894744/pexels-photo-38894744.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartare de Saint-Jacques aux agrumes, concombre et oignon rouge", imageSourceUrl: "https://www.pexels.com/photo/vibrant-citrus-and-scallop-salad-on-plate-38894744/", imageCredit: "Ximena Savage" },
  "noel-entree-05": { image: "https://images.pexels.com/photos/37103259/pexels-photo-37103259.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe crémeuse aux champignons et herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/creamy-mushroom-soup-on-marble-table-37103259/", imageCredit: "Kevin Early" },
  "noel-entree-06": { image: "https://images.pexels.com/photos/33608762/pexels-photo-33608762.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâte feuilletée dorée et croustillante", imageSourceUrl: "https://www.pexels.com/photo/golden-brown-puff-pastry-on-baking-paper-33608762/", imageCredit: "Anhelina Vasylyk" },
  "noel-entree-07": { image: "https://images.pexels.com/photos/5317326/pexels-photo-5317326.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Feuilletés salés garnis de viande, dorés au four", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-food-5317326/", imageCredit: "Campbell Downie" },
  "noel-entree-08": { image: "https://images.pexels.com/photos/7407241/pexels-photo-7407241.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Feuilleté doré au fromage frais", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-puff-pastry-7407241/", imageCredit: "Тимур Слугин" },
  "noel-entree-09": { image: "https://images.pexels.com/photos/35926369/pexels-photo-35926369.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bouchées au saumon fumé, concombre et fromage frais", imageSourceUrl: "https://www.pexels.com/photo/gourmet-bagels-with-smoked-salmon-and-dill-35926369/", imageCredit: "Stephen Leonardi" },
  "noel-entree-10": { image: "https://images.pexels.com/photos/5419036/pexels-photo-5419036.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de courge aux graines et au thym", imageSourceUrl: "https://www.pexels.com/photo/pumpkin-soup-in-a-bowl-beside-the-bread-5419036/", imageCredit: "Polina Tankilevitch" },
  "noel-entree-11": { image: "https://images.pexels.com/photos/31387544/pexels-photo-31387544.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Présentation gourmande avec velouté et foie gras", imageSourceUrl: "https://www.pexels.com/photo/gourmet-meal-with-soup-and-dessert-on-tray-31387544/", imageCredit: "Vincent Rivaud" },
  "noel-entree-12": { image: "https://images.pexels.com/photos/8112245/pexels-photo-8112245.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Huîtres fraîches ouvertes sur un plateau rustique", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-fresh-oysters-8112245/", imageCredit: "Rachel Claire" },
  "noel-entree-13": { image: "https://images.pexels.com/photos/16273763/pexels-photo-16273763.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gambas à l'ail dans une sauce savoureuse", imageSourceUrl: "https://www.pexels.com/photo/prawns-in-a-bowl-16273763/", imageCredit: "Nadin Sh" },
  "noel-entree-14": { image: "https://images.pexels.com/photos/6213714/pexels-photo-6213714.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Noix de Saint-Jacques poêlées et agrumes", imageSourceUrl: "https://www.pexels.com/photo/photo-of-food-on-white-plate-6213714/", imageCredit: "Vladimir Gladkov" },
  "noel-entree-15": { image: "https://images.pexels.com/photos/18238323/pexels-photo-18238323.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mousse de saumon à l'aneth en verrines", imageSourceUrl: "https://www.pexels.com/photo/food-in-jars-on-towel-18238323/", imageCredit: "Marlein Topciu" },
  "noel-entree-16": { image: "https://images.pexels.com/photos/4586810/pexels-photo-4586810.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâté de canard présenté avec une brioche", imageSourceUrl: "https://www.pexels.com/photo/tasty-burger-in-crunchy-bun-served-with-sliced-pate-in-restaurant-4586810/", imageCredit: "Monlom JIANGBA" },
  "noel-entree-17": { image: "https://images.pexels.com/photos/434283/pexels-photo-434283.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pruneaux enrobés de bacon et romarin", imageSourceUrl: "https://www.pexels.com/photo/food-photography-of-bacon-with-sliced-of-bread-434283/", imageCredit: "Pexels" },
  "noel-plat-18": { image: "https://images.pexels.com/photos/36863872/pexels-photo-36863872.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poulet rôti joliment dressé avec sa garniture", imageSourceUrl: "https://www.pexels.com/photo/gourmet-roast-chicken-with-cauliflower-puree-36863872/", imageCredit: "Merve Gülhan" },
  "noel-plat-19": { image: "https://images.pexels.com/photos/11001292/pexels-photo-11001292.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet mignon de porc avec lentilles et sauce crémeuse", imageSourceUrl: "https://www.pexels.com/photo/food-menu-restaurant-dinner-11001292/", imageCredit: "Sylwester Ficek" },
  "noel-plat-20": { image: "https://images.pexels.com/photos/10710973/pexels-photo-10710973.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Rôti de porc aux herbes sur une planche", imageSourceUrl: "https://www.pexels.com/photo/cooked-meat-on-the-table-10710973/", imageCredit: "Cleo Vergara" },
  "noel-plat-21": { image: "https://images.pexels.com/photos/33988119/pexels-photo-33988119.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Delicious pumpkin risotto on elegant plate", imageSourceUrl: "https://www.pexels.com/photo/delicious-pumpkin-risotto-on-elegant-plate-33988119/", imageCredit: "Jana Ohajdova" },
  "noel-plat-22": { image: "https://images.pexels.com/photos/28292002/pexels-photo-28292002.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Plat de champignons et sauce crémeuse, sans autre protéine visible", imageSourceUrl: "https://www.pexels.com/photo/a-plate-of-food-with-mushrooms-and-sauce-on-it-28292002/", imageCredit: "Valeria Boltneva" },
  "noel-plat-23": { image: "https://images.pexels.com/photos/9673813/pexels-photo-9673813.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de poisson et légumes sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-cooked-dish-on-white-ceramic-plate-9673813/", imageCredit: "Vamba Konneh" },
  "noel-plat-24": { image: "https://images.pexels.com/photos/9266842/pexels-photo-9266842.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Confit de canard et purée de patate douce", imageSourceUrl: "https://www.pexels.com/photo/meal-on-plate-9266842/", imageCredit: "Valeria Boltneva" },
  "noel-plat-25": { image: "https://images.pexels.com/photos/8697538/pexels-photo-8697538.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Magret de canard avec sauce aux fruits rouges", imageSourceUrl: "https://www.pexels.com/photo/cooked-meat-with-sauce-on-white-ceramic-plate-8697538/", imageCredit: "Farhad Ibrahimzade" },
  "noel-plat-26": { image: "https://images.pexels.com/photos/6210747/pexels-photo-6210747.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Volaille rôtie aux légumes, présentation de fête", imageSourceUrl: "https://www.pexels.com/photo/roasted-chicken-with-vegetables-in-glass-roaster-on-table-with-fir-sprigs-6210747/", imageCredit: "Tim Douglas" },
  "noel-plat-27": { image: "https://images.pexels.com/photos/7103373/pexels-photo-7103373.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gnocchis au parmesan et légumes frais", imageSourceUrl: "https://www.pexels.com/photo/food-on-the-plate-7103373/", imageCredit: "Yuliia Bas" },
  "noel-plat-28": { image: "https://images.pexels.com/photos/20182343/pexels-photo-20182343.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saumon en croûte feuilletée, servi en tranches", imageSourceUrl: "https://www.pexels.com/photo/bun-with-wish-on-plate-20182343/", imageCredit: "Valeria Boltneva" },
  "noel-plat-29": { image: "https://images.pexels.com/photos/34429590/pexels-photo-34429590.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Ragoût de viande mijotée aux légumes", imageSourceUrl: "https://www.pexels.com/photo/bowl-of-savory-minced-meat-and-vegetable-stew-34429590/", imageCredit: "Laura oliveira" },
  "noel-plat-30": { image: "https://images.pexels.com/photos/11267448/pexels-photo-11267448.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Filet de bœuf Wellington en croûte, tranché", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-beef-wellington-11267448/", imageCredit: "Nadin Sh" },
  "noel-plat-31": { image: "https://images.pexels.com/photos/5718104/pexels-photo-5718104.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Dinde rôtie sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/roasted-turkey-on-white-ceramic-plate-5718104/", imageCredit: "Kaboompics" },
  "noel-plat-32": { image: "https://images.pexels.com/photos/7627438/pexels-photo-7627438.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Saint-Jacques poêlées avec sauce et légumes", imageSourceUrl: "https://www.pexels.com/photo/fried-scallops-with-sauce-and-vegetables-served-on-plate-7627438/", imageCredit: "Taha Samet Arslan" },
  "noel-plat-33": { image: "https://images.pexels.com/photos/28152657/pexels-photo-28152657.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Courge farcie au quinoa, vue du dessus", imageSourceUrl: "https://www.pexels.com/photo/quinoa-stuffed-squash-28152657/", imageCredit: "Mikey BA" },
  "noel-plat-34": { image: "https://images.pexels.com/photos/7368052/pexels-photo-7368052.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tourte salée à la croûte dorée", imageSourceUrl: "https://www.pexels.com/photo/baked-meat-pie-7368052/", imageCredit: "Christina Voinova" },
  "noel-dessert-35": { image: "https://images.pexels.com/photos/30700690/pexels-photo-30700690.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Cake aux agrumes avec glaçage à l’orange", imageSourceUrl: "https://www.pexels.com/photo/delicious-citrus-loaf-cake-with-orange-glaze-30700690/", imageCredit: "Change C.C" },
  "noel-dessert-36": { image: "https://images.pexels.com/photos/34281933/pexels-photo-34281933.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Part de gâteau Forêt-Noire au chocolat et cerises", imageSourceUrl: "https://www.pexels.com/photo/delicious-black-forest-cake-slice-on-plate-34281933/", imageCredit: "Christina & Peter" },
  "noel-dessert-37": { image: "https://images.pexels.com/photos/28292020/pexels-photo-28292020.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poire pochée en dessert, servie avec glace", imageSourceUrl: "https://www.pexels.com/photo/a-plate-with-a-dessert-and-ice-cream-on-it-28292020/", imageCredit: "Valeria Boltneva" },
  "noel-dessert-38": { image: "https://images.pexels.com/photos/26083401/pexels-photo-26083401.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pavlova garnie de fruits rouges et crème", imageSourceUrl: "https://www.pexels.com/photo/cream-cake-with-fruits-on-the-top-26083401/", imageCredit: "Olga Udovychenko" },
  "noel-dessert-39": { image: "https://images.pexels.com/photos/9501445/pexels-photo-9501445.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Moelleux au chocolat avec sauce chocolat", imageSourceUrl: "https://www.pexels.com/photo/chocolate-toppings-on-dessert-9501445/", imageCredit: "Gustavo Peres" },
  "noel-dessert-40": { image: "https://images.pexels.com/photos/35926368/pexels-photo-35926368.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gâteau avec glace vanille et caramel", imageSourceUrl: "https://www.pexels.com/photo/vanilla-ice-cream-on-cake-with-caramel-and-nuts-35926368/", imageCredit: "Stephen Leonardi" },
  "noel-dessert-41": { image: "https://images.pexels.com/photos/34802108/pexels-photo-34802108.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bûche roulée au chocolat avec décoration festive", imageSourceUrl: "https://www.pexels.com/photo/chocolate-swiss-roll-cake-with-festive-decoration-34802108/", imageCredit: "bynamnamnam" },
  "noel-dessert-42": { image: "https://images.pexels.com/photos/3525758/pexels-photo-3525758.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sablés de Noël en forme d’étoiles, parfum cannelle", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-christmas-cookies-3525758/", imageCredit: "Asya Vlasova" },
  "noel-dessert-43": { image: "https://images.pexels.com/photos/5150168/pexels-photo-5150168.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Truffes fondantes au chocolat noir poudrées de cacao", imageSourceUrl: "https://www.pexels.com/photo/chocolate-balls-on-baking-paper-on-white-ceramic-plate-5150168/", imageCredit: "ROMAN ODINTSOV" },
  "noel-dessert-44": { image: "https://images.pexels.com/photos/4631029/pexels-photo-4631029.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Carpaccio d’ananas frais présenté sur assiette", imageSourceUrl: "https://www.pexels.com/photo/photo-of-pineapple-on-ceramic-plate-4631029/", imageCredit: "ArtHouse Studio" },
  "noel-dessert-45": { image: "https://images.pexels.com/photos/6489467/pexels-photo-6489467.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Rondelles d’oranges fraîches sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/slices-of-orange-fruit-on-a-plate-6489467/", imageCredit: "Tara Winstead" },
  "noel-dessert-46": { image: "https://images.pexels.com/photos/7593465/pexels-photo-7593465.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Crème brûlée en ramequin à la surface caramélisée", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-creme-brulee-7593465/", imageCredit: "Anh Hoang Pham" },
  "noel-dessert-47": { image: "https://images.pexels.com/photos/15359109/pexels-photo-15359109.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Panna cotta servie en verrine avec fruits frais", imageSourceUrl: "https://www.pexels.com/photo/photograph-of-a-glass-with-panna-cotta-15359109/", imageCredit: "Eduardo Krajan" },
  "noel-dessert-48": { image: "https://images.pexels.com/photos/19963525/pexels-photo-19963525.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Profiteroles garnies et nappées de sauce au chocolat", imageSourceUrl: "https://www.pexels.com/photo/cream-puffs-with-chocolate-sauce-19963525/", imageCredit: "Emre Akyol" },
  "noel-dessert-49": { image: "https://images.pexels.com/photos/31238979/pexels-photo-31238979.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tiramisu festif servi en verrines", imageSourceUrl: "https://www.pexels.com/photo/charming-tiramisu-dessert-in-glass-jars-31238979/", imageCredit: "Vladimir Srajber" },
  "noel-dessert-50": { image: "https://images.pexels.com/photos/15940399/pexels-photo-15940399.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Éclats de chocolat garnis de noix et fruits secs", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-chocolate-with-nuts-15940399/", imageCredit: "Tuğçe Açıkyürek" },
  "halloween-apero-01": { image: "https://images.pexels.com/photos/5589854/pexels-photo-5589854.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assortiment de gourmandises d’Halloween avec saucisses et snacks", imageSourceUrl: "https://www.pexels.com/photo/halloween-foods-on-table-5589854/", imageCredit: "Daisy Anderson" },
  "halloween-apero-02": { image: "https://images.pexels.com/photos/34322095/pexels-photo-34322095.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mini pizza tomate, mozzarella et basilic", imageSourceUrl: "https://www.pexels.com/photo/delicious-margherita-pizza-on-plate-34322095/", imageCredit: "Novkov Visuals" },
  "halloween-apero-03": { image: "https://images.pexels.com/photos/19945748/pexels-photo-19945748.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Petites couronnes de pâte feuilletée dorées", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-pastry-19945748/", imageCredit: "Dagmara Dombrovska" },
  "halloween-apero-04": { image: "https://images.pexels.com/photos/6824498/pexels-photo-6824498.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Croque-monsieur grillé au fromage fondant", imageSourceUrl: "https://www.pexels.com/photo/sliced-toasted-sandwich-with-cheese-in-the-white-plate-6824498/", imageCredit: "Pink Press" },
  "halloween-apero-05": { image: "https://images.pexels.com/photos/5689659/pexels-photo-5689659.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bouchées rondes au fromage sur assiette blanche", imageSourceUrl: "https://www.pexels.com/photo/fried-ball-shaped-food-on-white-saucer-5689659/", imageCredit: "Nonik Yench" },
  "halloween-apero-06": { image: "https://images.pexels.com/photos/5581150/pexels-photo-5581150.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Sablés doigts de sorcière pour Halloween", imageSourceUrl: "https://www.pexels.com/photo/person-holding-a-tray-of-bread-with-witch-fingers-design-5581150/", imageCredit: "Daisy Anderson" },
  "halloween-apero-07": { image: "https://images.pexels.com/photos/36203728/pexels-photo-36203728.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Rondelles de banane nappées de chocolat", imageSourceUrl: "https://www.pexels.com/photo/banana-slices-with-chocolate-spread-close-up-36203728/", imageCredit: "Jakub Pabis" },
  "halloween-apero-08": { image: "https://images.pexels.com/photos/18266911/pexels-photo-18266911.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pavlova garnie de fruits rouges et de crème", imageSourceUrl: "https://www.pexels.com/photo/piece-of-cake-on-a-plate-18266911/", imageCredit: "Karina Kungla" },
  "halloween-apero-09": { image: "https://images.pexels.com/photos/17939220/pexels-photo-17939220.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gâteau au chocolat décoré de biscuits Oreo", imageSourceUrl: "https://www.pexels.com/photo/homemade-cake-decorated-with-strawberries-and-oreo-cookies-17939220/", imageCredit: "Rahib Yaqubov" },
  "halloween-apero-10": { image: "https://images.pexels.com/photos/5908034/pexels-photo-5908034.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Petites meringues blanches préparées sur plaque", imageSourceUrl: "https://www.pexels.com/photo/anonymous-women-decorated-star-shaped-meringues-placed-on-baking-pan-5908034/", imageCredit: "Katerina Holmes" },
  "halloween-express-11": { image: "https://images.pexels.com/photos/5840403/pexels-photo-5840403.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Œufs durs garnis présentés sur une assiette", imageSourceUrl: "https://www.pexels.com/photo/boiled-eggs-in-a-plate-5840403/", imageCredit: "ROMAN ODINTSOV" },
  "halloween-express-12": { image: "https://images.pexels.com/photos/23414763/pexels-photo-23414763.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bretzel doré, inspiration pour les balais apéritifs", imageSourceUrl: "https://www.pexels.com/photo/hand-with-pretzel-23414763/", imageCredit: "Ulkar Batista" },
  "halloween-express-13": { image: "https://images.pexels.com/photos/7601338/pexels-photo-7601338.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Guacamole frais servi avec des chips tortilla", imageSourceUrl: "https://www.pexels.com/photo/guacamole-and-chips-on-a-bowl-7601338/", imageCredit: "Los Muertos Crew" },
  "halloween-express-14": { image: "https://images.pexels.com/photos/19499002/pexels-photo-19499002.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assortiment de petites pièces feuilletées dorées", imageSourceUrl: "https://www.pexels.com/photo/sweet-and-savoury-puff-pastry-snacks-on-display-19499002/", imageCredit: "Valeria Boltneva" },
  "halloween-express-15": { image: "https://images.pexels.com/photos/19359969/pexels-photo-19359969.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Poivron farci au riz, plat coloré", imageSourceUrl: "https://www.pexels.com/photo/rice-with-stuffed-capsicum-19359969/", imageCredit: "Lalada ." },
  "halloween-express-16": { image: "https://images.pexels.com/photos/14950906/pexels-photo-14950906.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Dessert chocolaté garni de rondelles de banane", imageSourceUrl: "https://www.pexels.com/photo/dessert-with-peanuts-and-banana-14950906/", imageCredit: "Rahib Yaqubov" },
  "halloween-express-17": { image: "https://images.pexels.com/photos/8387112/pexels-photo-8387112.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Biscuits sandwich au chocolat sur fond sombre", imageSourceUrl: "https://www.pexels.com/photo/oreo-cookie-on-black-background-8387112/", imageCredit: "Terrance Barksdale" },
  "halloween-express-18": { image: "https://images.pexels.com/photos/34566752/pexels-photo-34566752.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tranches de pomme fraîche, snack croquant", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-fresh-apple-slices-on-a-surface-34566752/", imageCredit: "Valentin Ivantsov" },
  "halloween-express-19": { image: "https://images.pexels.com/photos/11066843/pexels-photo-11066843.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Jus rouge de cranberry servi dans un verre", imageSourceUrl: "https://www.pexels.com/photo/clear-drinking-glass-with-red-juice-11066843/", imageCredit: "Daria Andrievskaya" },
  "halloween-express-20": { image: "https://images.pexels.com/photos/4664309/pexels-photo-4664309.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mousse de fraise présentée en verrine", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-dessert-4664309/", imageCredit: "Dimitry Fadeev" },
  "halloween-atelier-21": { image: "https://images.pexels.com/photos/35759994/pexels-photo-35759994.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pizza à la tomate, mozzarella et basilic", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-margherita-pizza-with-fresh-basil-35759994/", imageCredit: "Willians Huerta" },
  "halloween-atelier-22": { image: "https://images.pexels.com/photos/15792258/pexels-photo-15792258.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Plateau de bouchées apéritives et fromages", imageSourceUrl: "https://www.pexels.com/photo/plate-of-delicious-snacks-15792258/", imageCredit: "Yelena from Pexels" },
  "halloween-atelier-23": { image: "https://images.pexels.com/photos/8329233/pexels-photo-8329233.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Cookie au chocolat avec surface craquelée", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-chocolate-cookie-8329233/", imageCredit: "AMANDA LIM" },
  "halloween-atelier-24": { image: "https://images.pexels.com/photos/4187783/pexels-photo-4187783.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assortiment de fromages pour bouchées apéritives", imageSourceUrl: "https://www.pexels.com/photo/assorted-cheese-on-the-table-4187783/", imageCredit: "Polina Tankilevitch" },
  "halloween-atelier-25": { image: "https://images.pexels.com/photos/17192256/pexels-photo-17192256.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Cookies au chocolat, inspiration pour biscuits décorés", imageSourceUrl: "https://www.pexels.com/photo/stack-of-cookies-17192256/", imageCredit: "Ali Dashti" },
  "halloween-atelier-26": { image: "https://images.pexels.com/photos/19498991/pexels-photo-19498991.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assortiment de feuilletés salés et sucrés", imageSourceUrl: "https://www.pexels.com/photo/sweet-and-savoury-puff-pastry-snacks-on-display-19498991/", imageCredit: "Valeria Boltneva" },
  "halloween-atelier-27": { image: "https://images.pexels.com/photos/5735600/pexels-photo-5735600.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Mandarines épluchées vues du dessus", imageSourceUrl: "https://www.pexels.com/photo/orange-fruit-on-white-table-5735600/", imageCredit: "Nataliya Vaitkevich" },
  "halloween-atelier-28": { image: "https://images.pexels.com/photos/29230326/pexels-photo-29230326.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Dessert au chocolat garni de marshmallows", imageSourceUrl: "https://www.pexels.com/photo/indulgent-dessert-with-chocolate-and-marshmallows-29230326/", imageCredit: "Pew Nguyen" },
  "halloween-atelier-29": { image: "https://images.pexels.com/photos/40000467/pexels-photo-40000467.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bouchées de Rice Krispies maison", imageSourceUrl: "https://www.pexels.com/photo/gros-plan-sur-des-rice-krispies-snacks-traditionnels-40000467/", imageCredit: "Jahra Tasfia Reza" },
  "halloween-atelier-30": { image: "https://images.pexels.com/photos/7656397/pexels-photo-7656397.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Boisson verte au kiwi dans un verre transparent", imageSourceUrl: "https://www.pexels.com/photo/kiwi-fruit-juice-on-a-clear-drinking-glass-7656397/", imageCredit: "Cup of Couple" },
  "fetes-hiver-tech-crepes": { image: "https://images.pexels.com/photos/9200544/pexels-photo-9200544.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Crêpes traditionnelles empilées, prêtes à servir", imageSourceUrl: "https://www.pexels.com/photo/photograph-of-a-plate-with-crepes-9200544/", imageCredit: "Morgan Victoria" },
  "fetes-hiver-01": { image: "https://images.pexels.com/photos/35727292/pexels-photo-35727292.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Crêpes dessert garnies de fruits rouges et chocolat", imageSourceUrl: "https://www.pexels.com/photo/delicious-dessert-crepes-with-berries-and-chocolate-35727292/", imageCredit: "Alberto Lara" },
  "fetes-hiver-02": { image: "https://images.pexels.com/photos/1435907/pexels-photo-1435907.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Petites crêpes épaisses présentées pour le petit-déjeuner", imageSourceUrl: "https://www.pexels.com/photo/pancakes-on-a-plate-1435907/", imageCredit: "Daria Shevtsova" },
  "fetes-hiver-03": { image: "https://images.pexels.com/photos/1878346/pexels-photo-1878346.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tresse de pâte feuilletée dorée garnie de confiture", imageSourceUrl: "https://www.pexels.com/photo/strawberry-jam-puff-pastry-1878346/", imageCredit: "Daria Shevtsova" },
  "fetes-hiver-04": { image: "https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gâteau rouge façon red velvet", imageSourceUrl: "https://www.pexels.com/photo/red-velvet-cake-3026808/", imageCredit: "Ella Olsson" },
  "fetes-hiver-05": { image: "https://images.pexels.com/photos/1435908/pexels-photo-1435908.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes colorées à la sauce de légumes", imageSourceUrl: "https://www.pexels.com/photo/pasta-with-vegetable-sauce-1435908/", imageCredit: "Daria Shevtsova" },
  "fetes-hiver-06": { image: "https://images.pexels.com/photos/2067396/pexels-photo-2067396.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Beignets dorés saupoudrés de sucre glace", imageSourceUrl: "https://www.pexels.com/photo/donuts-on-white-plate-2067396/", imageCredit: "Pixabay" },
  "fetes-hiver-07": { image: "https://images.pexels.com/photos/40500002/pexels-photo-40500002.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Churros dorés saupoudrés de sucre", imageSourceUrl: "https://www.pexels.com/photo/delicious-churros-presented-on-a-checkered-tablecloth-40500002/", imageCredit: "Paloma Clarice" },
  "fetes-hiver-08": { image: "https://images.pexels.com/photos/1435909/pexels-photo-1435909.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Galette feuilletée dorée, dessert traditionnel", imageSourceUrl: "https://www.pexels.com/photo/golden-puff-pastry-pie-1435909/", imageCredit: "Daria Shevtsova" },
  "fetes-hiver-09": { image: "https://images.pexels.com/photos/35902993/pexels-photo-35902993.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Crêpes fines aux fruits frais", imageSourceUrl: "https://www.pexels.com/photo/delicious-crepes-with-strawberries-topped-with-chocolate-35902993/", imageCredit: "Dilara" },
  "veg-pe-001": { image: "https://images.pexels.com/photos/1510690/pexels-photo-1510690.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de lentilles et légumes frais", imageSourceUrl: "https://www.pexels.com/photo/lentil-salad-with-vegetables-1510690/", imageCredit: "Daria Shevtsova" },
  "veg-pe-002": { image: "https://images.pexels.com/photos/1473164/pexels-photo-1473164.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Risotto crémeux aux légumes verts", imageSourceUrl: "https://www.pexels.com/photo/risotto-with-vegetables-1473164/", imageCredit: "Pixabay" },
  "veg-pe-003": { image: "https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gaspacho rouge de tomates et poivrons", imageSourceUrl: "https://www.pexels.com/photo/tomato-gazpacho-in-a-bowl-1437267/", imageCredit: "Daria Shevtsova" },
  "veg-pe-004": { image: "https://images.pexels.com/photos/1435906/pexels-photo-1435906.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tarte fine aux courgettes et fromage", imageSourceUrl: "https://www.pexels.com/photo/vegetable-tart-1435906/", imageCredit: "Daria Shevtsova" },
  "veg-pe-005": { image: "https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Wrap garni de crudités et houmous", imageSourceUrl: "https://www.pexels.com/photo/vegetable-wrap-1640772/", imageCredit: "Daria Shevtsova" },
  "veg-pe-006": { image: "https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Courgettes farcies au quinoa et légumes", imageSourceUrl: "https://www.pexels.com/photo/stuffed-zucchini-1640774/", imageCredit: "Daria Shevtsova" },
  "veg-pe-007": { image: "https://images.pexels.com/photos/1435902/pexels-photo-1435902.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade fraîche de pastèque et feta", imageSourceUrl: "https://www.pexels.com/photo/watermelon-feta-salad-1435902/", imageCredit: "Daria Shevtsova" },
  "veg-pe-008": { image: "https://images.pexels.com/photos/1435903/pexels-photo-1435903.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes aux tomates cerises et burrata", imageSourceUrl: "https://www.pexels.com/photo/pasta-with-tomatoes-1435903/", imageCredit: "Daria Shevtsova" },
  "veg-pe-009": { image: "https://images.pexels.com/photos/5710175/pexels-photo-5710175.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Brochettes de tofu et légumes grillés", imageSourceUrl: "https://www.pexels.com/photo/tofu-skewers-with-vegetables-5710175/", imageCredit: "Polina Tankilevitch" },
  "veg-pe-010": { image: "https://images.pexels.com/photos/1435899/pexels-photo-1435899.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Tartine d’avocat et œuf poché", imageSourceUrl: "https://www.pexels.com/photo/avocado-toast-with-poached-egg-1435899/", imageCredit: "Daria Shevtsova" },
  "veg-pe-011": { image: "https://images.pexels.com/photos/20473746/pexels-photo-20473746.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de quinoa végétarienne aux tomates cerises et légumes verts", imageSourceUrl: "https://www.pexels.com/photo/bowl-with-vegetarian-salad-20473746/", imageCredit: "Galiya Tenisheva" },
  "veg-pe-012": { image: "https://images.pexels.com/photos/17902961/pexels-photo-17902961.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Curry végétarien aux herbes et riz", imageSourceUrl: "https://www.pexels.com/photo/curry-soup-in-bowl-17902961/", imageCredit: "Filipp Romanovski" },
  "veg-pe-013": { image: "https://images.pexels.com/photos/16966955/pexels-photo-16966955.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade estivale de pastèque et tofu aux herbes", imageSourceUrl: "https://www.pexels.com/photo/vegetarian-salad-with-tofu-watermelon-and-herbs-16966955/", imageCredit: "Valeria Boltneva" },
  "veg-pe-014": { image: "https://images.pexels.com/photos/8112934/pexels-photo-8112934.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gnocchis aux herbes et légumes", imageSourceUrl: "https://www.pexels.com/photo/close-up-photo-of-a-gnocchi-dish-8112934/", imageCredit: "Rachel Claire" },
  "veg-pe-015": { image: "https://images.pexels.com/photos/8601392/pexels-photo-8601392.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe végétarienne garnie d’herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/soup-in-bowl-8601392/", imageCredit: "Polina Tankilevitch" },
  "veg-pe-016": { image: "https://images.pexels.com/photos/37225404/pexels-photo-37225404.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Fleurs de courgette farcies et dorées avec sauce", imageSourceUrl: "https://www.pexels.com/photo/delicious-stuffed-zucchini-flowers-with-dip-37225404/", imageCredit: "Luca Volpe Productions" },
  "veg-pe-017": { image: "https://images.pexels.com/photos/6605770/pexels-photo-6605770.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assortiment de salades et légumes verts vu du dessus", imageSourceUrl: "https://www.pexels.com/photo/appetizing-healthy-assorted-veggie-dishes-served-on-table-6605770/", imageCredit: "Geraud pfeiffer" },
  "veg-pe-018": { image: "https://images.pexels.com/photos/15801923/pexels-photo-15801923.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Quesadillas végétariennes avec salade et salsa", imageSourceUrl: "https://www.pexels.com/photo/meal-with-tortillas-and-vegetables-15801923/", imageCredit: "Eduardo Krajan" },
  "veg-pe-019": { image: "https://images.pexels.com/photos/6129129/pexels-photo-6129129.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Rouleaux de printemps végétariens à la mangue et aux légumes", imageSourceUrl: "https://www.pexels.com/photo/person-holding-a-plate-of-spring-rolls-6129129/", imageCredit: "Alesia Kozik" },
  "veg-pe-020": { image: "https://images.pexels.com/photos/34326262/pexels-photo-34326262.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assortiment végétarien avec soupe de tomates et légumes", imageSourceUrl: "https://www.pexels.com/photo/healthy-vegetarian-meal-with-tomato-soup-34326262/", imageCredit: "Anhelina Vasylyk" },
  "veg-pe-021": { image: "https://images.pexels.com/photos/38845201/pexels-photo-38845201.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade Caprese aux tomates, mozzarella, basilic et pesto", imageSourceUrl: "https://www.pexels.com/photo/caprese-salad-with-fresh-basil-and-pesto-38845201/", imageCredit: "Amine Kübranur Çakıroğlu" },
  "veg-pe-022": { image: "https://images.pexels.com/photos/34227786/pexels-photo-34227786.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Assiette végétarienne colorée avec légumes frais et dips", imageSourceUrl: "https://www.pexels.com/photo/healthy-vegetarian-meal-with-dips-and-bowl-34227786/", imageCredit: "Novkov Visuals" },
  "veg-pe-023": { image: "https://images.pexels.com/photos/1555814/pexels-photo-1555814.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade fraîche de légumes avec concombre et poivrons", imageSourceUrl: "https://www.pexels.com/photo/vegetable-salad-1555814/", imageCredit: "Gil Goldman" },
  "veg-pe-024": { image: "https://images.pexels.com/photos/34429589/pexels-photo-34429589.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes aux courgettes et tomates cerises", imageSourceUrl: "https://www.pexels.com/photo/delicious-veggie-pasta-with-zucchini-and-tomatoes-34429589/", imageCredit: "Laura oliveira" },
  "veg-pe-025": { image: "https://images.pexels.com/photos/17597408/pexels-photo-17597408.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Buddha bowl au quinoa, avocat, pois chiches et patate douce", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-with-a-healthy-salad-17597408/", imageCredit: "Rasul Yarichev" },
  "veg-pe-026": { image: "https://images.pexels.com/photos/1484518/pexels-photo-1484518.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de tofu, avocat et nouilles de courgette", imageSourceUrl: "https://www.pexels.com/photo/vegetable-salad-with-avocado-and-lime-in-white-bowl-1484518/", imageCredit: "Valeria Boltneva" },
  "veg-pe-027": { image: "https://images.pexels.com/photos/36934973/pexels-photo-36934973.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade colorée de légumes frais", imageSourceUrl: "https://www.pexels.com/photo/salade-coloree-avec-legumes-frais-et-petits-pains-36934973/", imageCredit: "Mohamed Olwy" },
  "veg-pe-028": { image: "https://images.pexels.com/photos/9218605/pexels-photo-9218605.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de pois chiches et graines", imageSourceUrl: "https://www.pexels.com/photo/a-salad-in-a-bowl-9218605/", imageCredit: "Loren Castillo" },
  "veg-pe-029": { image: "https://images.pexels.com/photos/14775660/pexels-photo-14775660.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de quinoa aux légumes frais et feta", imageSourceUrl: "https://www.pexels.com/photo/a-bowl-of-salad-with-vegetables-and-nuts-on-a-wooden-table-14775660/", imageCredit: "Shameel mukkath" },
  "veg-pe-030": { image: "https://images.pexels.com/photos/8385550/pexels-photo-8385550.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de pâtes aux légumes frais et feta", imageSourceUrl: "https://www.pexels.com/photo/a-vegetable-salad-on-a-ceramic-bowl-8385550/", imageCredit: "Lisa Fotios" },
  "veg-pe-031": { image: "https://images.pexels.com/photos/40581879/pexels-photo-40581879.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Fenouil frais et légumes verts sur fond clair", imageSourceUrl: "https://www.pexels.com/photo/fresh-green-cabbage-with-fennel-and-tomatoes-40581879/", imageCredit: "Valentin Ivantsov" },
  "veg-pe-032": { image: "https://images.pexels.com/photos/17889603/pexels-photo-17889603.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de burrata et légumes frais", imageSourceUrl: "https://www.pexels.com/photo/food-on-plate-17889603/", imageCredit: "Filipp Romanovski" },
  "veg-pe-033": { image: "https://images.pexels.com/photos/3774599/pexels-photo-3774599.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de betteraves colorée à la feta", imageSourceUrl: "https://www.pexels.com/photo/close-up-shot-of-a-salad-3774599/", imageCredit: "tomateoignons" },
  "veg-pe-034": { image: "https://images.pexels.com/photos/4935688/pexels-photo-4935688.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de betteraves et légumes frais", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-pink-food-with-vegetables-on-a-white-plate-4935688/", imageCredit: "Valerie de Limoges" },
  "veg-pe-035": { image: "https://images.pexels.com/photos/27969859/pexels-photo-27969859.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de betteraves, noix et légumes", imageSourceUrl: "https://www.pexels.com/photo/a-salad-with-beets-nuts-and-other-vegetables-27969859/", imageCredit: "Valeria Boltneva" },
  "veg-pe-036": { image: "https://images.pexels.com/photos/6164196/pexels-photo-6164196.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Polenta et champignons sautés aux herbes", imageSourceUrl: "https://www.pexels.com/photo/food-photography-6164196/", imageCredit: "Taryn Elliott" },
  "veg-pe-037": { image: "https://images.pexels.com/photos/9266854/pexels-photo-9266854.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade colorée de légumes rôtis", imageSourceUrl: "https://www.pexels.com/photo/close-up-of-a-meal-9266854/", imageCredit: "Valeria Boltneva" },
  "veg-pe-038": { image: "https://images.pexels.com/photos/8513314/pexels-photo-8513314.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade grecque à la feta et aux olives", imageSourceUrl: "https://www.pexels.com/photo/vegetable-salad-with-feta-cheese-and-olives-8513314/", imageCredit: "Animesh Srivastava" },
  "veg-pe-039": { image: "https://images.pexels.com/photos/36430173/pexels-photo-36430173.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Gnocchis crémeux aux herbes fraîches", imageSourceUrl: "https://www.pexels.com/photo/delicious-gnocchi-pasta-with-cream-sauce-36430173/", imageCredit: "Willians Huerta" },
  "veg-pe-040": { image: "https://images.pexels.com/photos/12101208/pexels-photo-12101208.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Smoothie bowl aux fruits rouges et graines de chia", imageSourceUrl: "https://www.pexels.com/photo/smoothie-bowl-with-berries-next-to-cookbook-12101208/", imageCredit: "Lisa Fotios" },
  "veg-pe-041": { image: "https://images.pexels.com/photos/30615717/pexels-photo-30615717.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de pâtes aux légumes frais", imageSourceUrl: "https://www.pexels.com/photo/fresh-veggie-pasta-salad-in-ceramic-bowl-30615717/", imageCredit: "dytmeri" },
  "veg-pe-042": { image: "https://images.pexels.com/photos/36963967/pexels-photo-36963967.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade méditerranéenne fraîche", imageSourceUrl: "https://www.pexels.com/photo/salade-mediterraneenne-fraiche-arrosee-dhuile-dolive-36963967/", imageCredit: "yasemin ." },
  "veg-pe-043": { image: "https://images.pexels.com/photos/40000099/pexels-photo-40000099.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de légumes frais et pois chiches", imageSourceUrl: "https://www.pexels.com/photo/healthy-vegetable-salad-40000099/", imageCredit: "Photographe Pexels" },
  "veg-pe-044": { image: "https://images.pexels.com/photos/40408941/pexels-photo-40408941.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade fraîche aux agrumes et feta", imageSourceUrl: "https://www.pexels.com/photo/fresh-salad-with-citrus-and-feta-on-a-wooden-table-40408941/", imageCredit: "Nam Nguyen" },
  "veg-pe-045": { image: "https://images.pexels.com/photos/6541815/pexels-photo-6541815.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes aux herbes, citron et pois chiches", imageSourceUrl: "https://www.pexels.com/photo/a-pasta-in-a-bowl-6541815/", imageCredit: "Alesia Kozik" },
  "veg-pe-046": { image: "https://images.pexels.com/photos/15580731/pexels-photo-15580731.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade grecque à la feta et tomates", imageSourceUrl: "https://www.pexels.com/photo/delicious-salad-with-feta-15580731/", imageCredit: "Veer Sajid" },
  "veg-pe-047": { image: "https://images.pexels.com/photos/16355470/pexels-photo-16355470.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Pâtes aux légumes frais", imageSourceUrl: "https://www.pexels.com/photo/pasta-with-vegetables-16355470/", imageCredit: "Ray Valdivia" },
  "veg-pe-048": { image: "https://images.pexels.com/photos/38339225/pexels-photo-38339225.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade lumineuse aux agrumes et betteraves", imageSourceUrl: "https://www.pexels.com/photo/vibrant-salad-with-citrus-and-beetroot-outdoors-38339225/", imageCredit: "Magda Ehlers" },
  "veg-pe-049": { image: "https://images.pexels.com/photos/5175519/pexels-photo-5175519.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Salade de légumes et feta sur assiette", imageSourceUrl: "https://www.pexels.com/photo/vegetable-salad-on-white-ceramic-plate-5175519/", imageCredit: "Shameel mukkath" },
  "veg-pe-050": { image: "https://images.pexels.com/photos/17746601/pexels-photo-17746601.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Bol de légumes et riz colorés", imageSourceUrl: "https://www.pexels.com/photo/pasta-with-vegetables-in-bowl-17746601/", imageCredit: "NEMA Off" },
  "veg-ah-pdf-001": { image: "https://images.pexels.com/photos/5419041/pexels-photo-5419041.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Velouté de potimarron aux graines", imageSourceUrl: "https://www.pexels.com/photo/overhead-shot-of-pumpkin-soup-5419041/", imageCredit: "Polina Tankilevitch" },
  "veg-ah-pdf-002": { image: "https://images.pexels.com/photos/6120506/pexels-photo-6120506.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Soupe-repas de lentilles aux légumes", imageSourceUrl: "https://www.pexels.com/photo/lentil-soup-in-gray-ceramic-bowl-6120506/", imageCredit: "Alesia Kozik" },
  "veg-ah-pdf-003": { image: "https://images.pexels.com/photos/5791/pexels-photo-5791.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Crème de panais en bols avec persil", imageSourceUrl: "https://www.pexels.com/photo/leek-and-potato-soup-with-parsley-5791/", imageCredit: "Karolina Grabowska" },
  "veg-ah-pdf-012": { image: "https://images.pexels.com/photos/32659125/pexels-photo-32659125.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Légumes-racines rôtis au four avec herbes", imageSourceUrl: "https://www.pexels.com/photo/delicious-roasted-vegetables-in-baking-tray-32659125/", imageCredit: "Nguyễn Tiến Thịnh" },
  "veg-ah-pdf-015": { image: "https://images.pexels.com/photos/8023752/pexels-photo-8023752.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Part de lasagne végétarienne gratinée", imageSourceUrl: "https://www.pexels.com/photo/plat-photo-de-nourriture-photographie-de-nourriture-patisse-8023752/", imageCredit: "Mateusz Feliksik" },
  "veg-ah-pdf-020": { image: "https://images.pexels.com/photos/9456716/pexels-photo-9456716.jpeg?auto=format&fit=crop&w=400&h=400&q=80&fm=webp", imageAlt: "Coquillettes crémeuses au fromage", imageSourceUrl: "https://www.pexels.com/photo/macaroni-cheese-in-a-bowl-9456716/", imageCredit: "Erik Mclean" },
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
