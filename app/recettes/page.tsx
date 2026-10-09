import { carnet, getCollections } from "@/lib/carnet";
import { recipeLines } from "@/lib/search";
import { RecipeList } from "@/components/recipe-list";

const FILTER_LABELS: Record<string, string> = {
  sauces: "Sauces", marinades: "Marinades", epices: "Épices & aromates",
  express: "Recettes express", apero: "Apéritifs", recevoir: "Pour recevoir",
  tired: "Je suis fatigué — idées faciles", "mr-cuisine": "Compatibles Mr Cuisine",
  printemps: "Printemps", ete: "Été", automne: "Automne", hiver: "Hiver", bonus: "Bonus du carnet",
};

function hasRobot(recipe: (typeof carnet.recipes)[number]) {
  return (recipe.robot || []).some((line) => line.trim().length > 0);
}
function isEasy(recipe: (typeof carnet.recipes)[number]) {
  const minutes = Number((recipe.timePrep || "").match(/\d+/)?.[0] || 999);
  return minutes <= 20 || /express|rapide|flemme|minute|sans cuisson/i.test(recipe.name + " " + recipe.blurb);
}
function matchesFilter(recipe: (typeof carnet.recipes)[number], filter: string, bonusIds: Set<string>) {
  const text = [recipe.name, recipe.blurb || "", ...recipe.ingredients, ...recipe.sections?.flatMap(s => [s.title, ...s.lines]) || []].join(" ").toLocaleLowerCase("fr");
  switch (filter) {
    case "sauces": return /sauce|vinaigrette|pesto|dip|mayonnaise|coulis|crème d'accompagnement/.test(recipe.name.toLocaleLowerCase("fr"));
    case "marinades": return /marinade|mariner/.test(recipe.name.toLocaleLowerCase("fr"));
    case "epices": return /épice|epice|mélange aromatique|assaisonnement/.test(recipe.name.toLocaleLowerCase("fr"));
    case "express": return isEasy(recipe);
    case "tired": return isEasy(recipe);
    case "mr-cuisine": return hasRobot(recipe);
    case "apero": return /apéro|apéritif|verrine|tartinade|bouchée|toast|dip/.test(text);
    case "recevoir": return /festif|invités|invités|famille|convives|rôti|roti|gratin|lasagne/.test(text);
    case "printemps": return /asperge|radis|petit pois|fève|fraise|épinard|epinard|artichaut/.test(text);
    case "ete": return /courgette|tomate|aubergine|melon|pastèque|poivron|concombre|pêche|abricot/.test(text);
    case "automne": return /courge|potimarron|citrouille|champignon|poireau|pomme|poire|châtaigne|chataigne/.test(text);
    case "hiver": return /chou|endive|clémentine|clementine|orange|carotte|poireau|pomme de terre|velouté|veloute/.test(text);
    case "bonus": return bonusIds.has(recipe.id);
    default: return true;
  }
}

export default async function RecettesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const params = await searchParams;
  const filter = params.filter || "";
  const collections = getCollections().filter((col) => col.recipeIds.length > 0).map((col) => ({ slug: col.slug, name: col.name, count: col.recipeIds.length }));
  const bonusIds = new Set(getCollections().flatMap((col) => col.recipeIds));
  const recipes = carnet.recipes.filter((recipe) => matchesFilter(recipe, filter, bonusIds))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .map((recipe) => ({ id: recipe.id, name: recipe.name, lines: recipeLines(recipe) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">{FILTER_LABELS[filter] || "Carnet de recettes"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filter ? `Sélection automatique à partir des informations présentes dans les fiches. ${recipes.length} résultat(s).` : "Tape un plat ou un ingrédient : seules les fiches qui correspondent restent, avec les lignes du carnet."}
        </p>
      </div>
      {filter ? <a href="/recettes" className="inline-flex rounded-xl bg-[#8FA89B]/15 px-3 py-2 text-sm font-semibold text-[#668775]">Voir toutes les recettes</a> : null}
      <RecipeList items={recipes} collections={filter ? undefined : collections} />
    </div>
  );
}
