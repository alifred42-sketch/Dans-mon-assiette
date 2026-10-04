import Link from "next/link";
import { carnet, getCollections } from "@/lib/carnet";
import { recipeHaystack } from "@/lib/search";
import { RecipeList } from "@/components/recipe-list";

export default function RecettesPage() {
  const collections = getCollections().filter((col) => col.recipeIds.length > 0);
  const recipes = [...carnet.recipes].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Carnet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les onglets utiles du fichier : saisons, apéro, sauces, express… Les feuilles
          d’audit ne sont pas là.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {collections.map((col) => (
          <Link
            key={col.slug}
            href={`/carnet/${col.slug}`}
            className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <p className="font-heading text-lg leading-tight">{col.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{col.recipeIds.length} fiches</p>
          </Link>
        ))}
      </div>
      <section className="space-y-3">
        <h2 className="font-heading text-xl">Toutes les fiches</h2>
        <RecipeList
          items={recipes.map((r) => ({ id: r.id, name: r.name, text: recipeHaystack(r) }))}
        />
      </section>
    </div>
  );
}
