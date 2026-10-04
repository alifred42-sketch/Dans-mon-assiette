import Link from "next/link";
import { notFound } from "next/navigation";
import { carnet, getRecipe } from "@/lib/carnet";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DishMark } from "@/components/dish-mark";

export default async function RecettePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = getRecipe(id);
  if (!recipe) notFound();
  const weeks = [...new Set(carnet.plan.filter((p) => p.recipeId === recipe.id).map((p) => p.week))];

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <Link href="/recettes" className="text-sm text-primary hover:underline">
        ← Toutes les recettes
      </Link>
      <header className="space-y-3">
        <DishMark recipe={recipe} size="hero" />
        <h1 className="font-heading text-4xl leading-tight">{recipe.name}</h1>
        <div className="flex flex-wrap gap-2">
          {recipe.robot && <Badge>Mr Cuisine</Badge>}
          {recipe.tags.map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {recipe.timeMin} min · {recipe.servings} personnes · {recipe.difficulty}
        </p>
        {recipe.summary && <p className="text-muted-foreground">{recipe.summary}</p>}
      </header>
      <section>
        <h2 className="font-heading text-xl">Ingrédients</h2>
        {recipe.ingredients.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Ingrédients à compléter — cette fiche venait d’un menu sans liste détaillée.
          </p>
        ) : (
          <ul className="mt-2 divide-y">
            {recipe.ingredients.map((ing) => (
              <li key={ing.raw} className="py-2 text-sm">
                {ing.raw.replace(/🔗/g, "").trim()}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="font-heading text-xl">Préparation</h2>
        {recipe.steps.length === 0 ? (
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Préparer et peser les ingrédients.</li>
            <li>Cuire selon le plat (poêle, four ou Mr Cuisine).</li>
            <li>Servir avec les légumes ou la sauce indiqués.</li>
          </ol>
        ) : (
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
            {recipe.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        )}
      </section>
      {recipe.robotSearch && (
        <p className="rounded-xl bg-muted p-3 text-sm">
          Recherche Mr Cuisine : <strong>{recipe.robotSearch}</strong>
        </p>
      )}
      {weeks.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Au menu des semaines {weeks.slice(0, 8).join(", ")}
          {weeks.length > 8 ? "…" : ""}.
        </p>
      )}
      <Link href="/semaine" className={buttonVariants({ variant: "outline" })}>
        Retour à la semaine
      </Link>
    </article>
  );
}
