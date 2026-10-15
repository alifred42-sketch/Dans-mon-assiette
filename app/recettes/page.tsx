"use client";

import { carnet, getCollections } from "@/lib/carnet";
import { recipeLines } from "@/lib/search";
import { RecipeList } from "@/components/recipe-list";
import { VegetarianNavigation } from "@/components/vegetarian-navigation";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const CATEGORY_COPY: Record<string, string> = {
  "": "Inspirez, cliquez... cuisinez chic ! Vos bons petits plats de la semaine à portée de main.",
  sauces: "Le secret des grands chefs est dans la sauce. Des textures onctueuses et des saveurs intenses pour sublimer vos assiettes.",
  marinades: "Donnez du relief à vos viandes, poissons et légumes. Du temps pour infuser les saveurs, du peps à la dégustation !",
  epices: "Voyagez depuis votre cuisine. Le dosage parfait pour réveiller vos plats sans jamais vous brûler le palais.",
  express: "Moins de 15 minutes entre le placard et l'assiette. Rapide, efficace et terriblement gourmand.",
  apero: "Planches chics, tartinades express et gressins maison. Le rendez-vous convivial qui ouvre l'appétit sans prise de tête.",
  recevoir: "Mettez les petits plats dans les grands sans y laisser votre calme. Vos invités vont être bluffés, et vous aussi !",
  tired: "Alerte rouge à la flemme !🚨 Zéro courage ? Voici nos jokers du placard ultra-réconfortants prêts avec 3 ingrédients.",
  "mr-cuisine": "Votre robot s'occupe de tout. Lisez la consigne universelle, lancez les paramètres, et allez vous reposer.",
  bonus: "Le petit plus Cuisine Chic Ouf. Granola maison, astuces de conservation et petits secrets de chefs pour vous faciliter la vie.",
  printemps: "Le retour des légumes croquants, des herbes fraîches et de la légèreté. La cuisine se réveille avec le soleil !",
  ete: "Gaspachos glacés, salades colorées et grillades parfumées. Une cuisine fraîche et ensoleillée à savourer à l'ombre.",
  automne: "Les premiers champignons, les courges dorées et les douces odeurs de mijotés. Une cuisine cocooning et réconfortante.",
  hiver: "Veloutés brûlants, gratins dorés et plats conviviaux au coin du feu. Le réconfort absolu au cœur de la saison froide.",
};

const FILTER_LABELS: Record<string, string> = {
  sauces: "Sauces", marinades: "Marinades", epices: "Épices & aromates",
  express: "Recettes express", tired: "Je suis fatigué — idées faciles", "mr-cuisine": "Compatibles Mr Cuisine",
  apero: "Apéritifs", recevoir: "Pour recevoir", printemps: "Printemps", ete: "Été",
  automne: "Automne", hiver: "Hiver", bonus: "Bonus du carnet", vegetarien: "🥦 Végétarien",
};

function durationMinutes(value?: string): number | null {
  if (!value?.trim()) return null;
  const normalized = value.toLocaleLowerCase("fr");
  const hours = normalized.match(/(\d+)\s*(?:h|heure)/);
  const minutes = normalized.match(/(\d+)\s*(?:min|minute)/);
  if (hours || minutes) return (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  const numeric = normalized.match(/^\s*(\d+)\s*$/);
  return numeric ? Number(numeric[1]) : null;
}

export default function RecettesPage() {
  const [maxDuration, setMaxDuration] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || "";
  const allCollections = getCollections();
  const collections = allCollections.filter((col) => col.recipeIds.length > 0).map((col) => ({ slug: col.slug, name: col.name, count: col.recipeIds.length }));
  const slugByFilter: Record<string, string> = {
    sauces: "sauces", marinades: "marinades", epices: "epices", express: "express",
    tired: "fatiguee", "mr-cuisine": "mrcuisine", apero: "apero", recevoir: "invites",
    printemps: "printemps", ete: "ete", automne: "automne", hiver: "hiver", bonus: "bonus",
  };
  const selectedCollection = allCollections.find((col) => col.slug === slugByFilter[filter] && col.recipeIds.length > 0);
  const selectedIds = selectedCollection ? new Set(selectedCollection.recipeIds) : null;
  const fallbackFilter = (recipe: (typeof carnet.recipes)[number]) => {
    const hay = [recipe.name, recipe.blurb || "", ...recipeLines(recipe)].join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
    switch (filter) {
      case "sauces": return /sauce|vinaigrette|pesto|coulis|mayonnaise|beurre compose/.test(hay);
      case "marinades": return /marinade|mariner/.test(hay);
      case "epices": return /epice|aromate|assaisonnement|melange d'herbes/.test(hay);
      case "express": return /express|rapide|15 min|20 min|10 min/.test(hay) || (Number.parseInt(recipe.timePrep || "99", 10) + Number.parseInt(recipe.timeCook || "99", 10) <= 20);
      case "tired": return /fatigue|flemme|facile|sans cuisson|3 ingredients|rapide/.test(hay) || (recipe.steps.length > 0 && recipe.steps.length <= 4);
      case "mr-cuisine": return recipe.robot.length > 0;
      case "apero": return /aperitif|apero|verrine|tartinade|tapenade|toast/.test(hay);
      case "recevoir": return /invites|recevoir|festif|convivial|famille|repas de fete/.test(hay);
      case "printemps": return selectedIds ? false : /asperge|petit pois|radis|fraise|artichaut/.test(hay);
      case "ete": return /tomate|courgette|aubergine|melon|peche|barbecue|salade fraiche/.test(hay);
      case "automne": return /potimarron|courge|champignon|chataigne|pomme|poire|poireau/.test(hay);
      case "hiver": return /chou|endive|poireau|carotte|navet|veloute|soupe chaude/.test(hay);
      case "bonus": return recipe.notes.length > 0 || /astuce|variante|bonus|anti gaspi/.test(hay);
      default: return true;
    }
  };
  const matchingRecipes = carnet.recipes
    .filter((recipe) => !filter || (selectedIds ? selectedIds.has(recipe.id) : fallbackFilter(recipe)))
    .filter((recipe) => filter !== "tired" || (
      recipe.ingredients.filter((line) => line.trim() && !/^ingr[ée]dients à prévoir/i.test(line)).length >= 2 &&
      recipe.steps.filter((line) => line.trim()).length >= 2
    ))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  // Le SOS propose 5 recettes complètes par jour, avec une sélection qui tourne automatiquement.
  const dailyOffset = Math.floor(Date.now() / 86400000) % Math.max(1, matchingRecipes.length);
  const dailyRecipes = filter === "tired" && matchingRecipes.length > 5
    ? [...matchingRecipes.slice(dailyOffset), ...matchingRecipes.slice(0, dailyOffset)].slice(0, 5)
    : matchingRecipes;

  const timeFilteredRecipes = maxDuration === null
    ? dailyRecipes
    : dailyRecipes.filter((recipe) => {
        const prep = durationMinutes(recipe.timePrep);
        const cook = durationMinutes(recipe.timeCook);
        return prep !== null && cook !== null && prep + cook <= maxDuration;
      });
  const recipes = timeFilteredRecipes.map((recipe) => ({ id: recipe.id, name: recipe.name, lines: recipeLines(recipe) }));

  if (filter === "vegetarien") return <VegetarianNavigation showBack />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">{FILTER_LABELS[filter] || "Carnet de recettes"}</h1>
        <p className="mt-1 text-sm font-normal leading-relaxed text-[#2B2B2B]">{CATEGORY_COPY[filter] || CATEGORY_COPY[""]}</p>
        <p className="mt-1 text-xs text-muted-foreground">{filter ? `${recipes.length} résultat(s) dans cette sélection.` : "Tape un plat ou un ingrédient pour retrouver une fiche."}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {[15, 30, 45].map((minutes) => {
          const active = maxDuration === minutes;
          return (
            <button
              key={minutes}
              type="button"
              aria-pressed={active}
              onClick={() => setMaxDuration(active ? null : minutes)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA89B] ${active ? "border-[#8FA89B] bg-[#8FA89B] text-[#1A1A1A] shadow-inner" : "border-[#D8D8D0] bg-[#F9F9F7] text-[#1A1A1A] shadow-[0_2px_5px_rgba(26,26,26,0.07)] hover:border-[#8FA89B]"}`}
            >
              <span aria-hidden="true">⏱️</span> {minutes} min
            </button>
          );
        })}
      </div>
      {filter ? <a href="/recettes" className="inline-flex rounded-xl bg-[#8FA89B]/15 px-3 py-2 text-sm font-semibold text-[#668775]">Voir toutes les recettes</a> : null}
      {maxDuration !== null ? <p className="text-xs text-muted-foreground">{recipes.length} recette(s) en {maxDuration} minutes maximum. Clique à nouveau sur le filtre actif pour tout afficher.</p> : null}
      <RecipeList items={recipes} collections={filter ? undefined : collections} />
    </div>
  );
}
