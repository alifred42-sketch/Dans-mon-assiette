import { carnet, getCollections } from "@/lib/carnet";
import { recipeLines } from "@/lib/search";
import { RecipeList } from "@/components/recipe-list";

const FILTER_LABELS: Record<string, string> = {
  sauces: "Sauces", marinades: "Marinades", epices: "Épices & aromates",
  express: "Recettes express", tired: "Je suis fatigué — idées faciles", "mr-cuisine": "Compatibles Mr Cuisine",
  apero: "Apéritifs", recevoir: "Pour recevoir", printemps: "Printemps", ete: "Été",
  automne: "Automne", hiver: "Hiver", bonus: "Bonus du carnet",
};

export default async function RecettesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const params = await searchParams;
  const filter = params.filter || "";
  const allCollections = getCollections();
  const collections = allCollections.filter((col) => col.recipeIds.length > 0).map((col) => ({ slug: col.slug, name: col.name, count: col.recipeIds.length }));
  const slugByFilter: Record<string, string> = {
    sauces: "sauces", marinades: "marinades", epices: "epices", express: "express",
    tired: "fatiguee", "mr-cuisine": "mrcuisine", apero: "apero", recevoir: "invites",
    printemps: "printemps", ete: "ete", automne: "automne", hiver: "hiver", bonus: "bonus",
  };
  const selectedCollection = allCollections.find((col) => col.slug === slugByFilter[filter]);
  const selectedIds = selectedCollection ? new Set(selectedCollection.recipeIds) : null;
  const recipes = carnet.recipes
    .filter((recipe) => !filter || (selectedIds ? selectedIds.has(recipe.id) : true))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .map((recipe) => ({ id: recipe.id, name: recipe.name, lines: recipeLines(recipe) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">{FILTER_LABELS[filter] || "Carnet de recettes"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filter ? `Sélection du carnet « ${FILTER_LABELS[filter] || filter} ». ${recipes.length} résultat(s).` : "Tape un plat ou un ingrédient : seules les fiches qui correspondent restent, avec les lignes du carnet."}
        </p>
      </div>
      {filter ? <a href="/recettes" className="inline-flex rounded-xl bg-[#8FA89B]/15 px-3 py-2 text-sm font-semibold text-[#668775]">Voir toutes les recettes</a> : null}
      <RecipeList items={recipes} collections={filter ? undefined : collections} />
    </div>
  );
}
