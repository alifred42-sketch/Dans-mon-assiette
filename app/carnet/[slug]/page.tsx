import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection, recipesForCollection } from "@/lib/carnet";
import { recipeHaystack } from "@/lib/search";
import { RecipeList } from "@/components/recipe-list";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const col = getCollection(slug);
  if (!col) notFound();
  const recipes = recipesForCollection(slug);

  return (
    <div className="space-y-5">
      <Link href="/recettes" className="text-sm text-primary underline underline-offset-4">
        ← Carnet
      </Link>
      <div>
        <h1 className="font-heading text-3xl">{col.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{col.blurb}</p>
      </div>
      {recipes.length === 0 ? (
        <p className="rounded-2xl bg-muted/70 p-6 text-center text-sm text-muted-foreground">
          Rien dans cet onglet.
        </p>
      ) : (
        <RecipeList
          items={recipes.map((r) => ({ id: r.id, name: r.name, text: recipeHaystack(r) }))}
        />
      )}
    </div>
  );
}
