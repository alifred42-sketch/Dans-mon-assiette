import { carnet, getCollections } from "@/lib/carnet";
import { recipeLines } from "@/lib/search";
import { RecipeList } from "@/components/recipe-list";

export default function RecettesPage() {
  const collections = getCollections()
    .filter((col) => col.recipeIds.length > 0)
    .map((col) => ({ slug: col.slug, name: col.name, count: col.recipeIds.length }));
  const recipes = [...carnet.recipes]
    .sort((a, b) => a.name.localeCompare(b.name, "fr"))
    .map((recipe) => ({ id: recipe.id, name: recipe.name, lines: recipeLines(recipe) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Carnet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tape un plat ou un ingrédient : seules les fiches qui correspondent restent, avec
          les lignes du tableur.
        </p>
      </div>
      <RecipeList items={recipes} collections={collections} />
    </div>
  );
}
