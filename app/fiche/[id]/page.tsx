import Link from "next/link";
import { notFound } from "next/navigation";
import { carnet, clampWeek, getRecipe, isPlaceholderIngredient } from "@/lib/carnet";

export default async function FichePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ w?: string }>;
}) {
  const { id } = await params;
  const { w } = await searchParams;
  const week = clampWeek(w);
  const recipe = getRecipe(id);
  if (!recipe) notFound();

  const weeks = [...new Set(carnet.plan.filter((p) => p.recipeId === recipe.id).map((p) => p.week))];
  const ings = recipe.ingredients.filter((line) => line.trim());
  const realIngs = ings.filter((line) => !isPlaceholderIngredient(line));

  return (
    <article className="space-y-6">
      <Link href={`/?w=${week}`} className="text-sm text-primary underline underline-offset-4">
        ← Semaine {week}
      </Link>
      <header>
        <h1 className="font-heading text-3xl leading-tight">{recipe.name}</h1>
        {weeks.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            Au menu des semaines {weeks.slice(0, 10).join(", ")}
            {weeks.length > 10 ? "…" : ""}.
          </p>
        )}
      </header>
      <section>
        <h2 className="font-heading text-xl">Ingrédients</h2>
        {ings.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Pas de liste dans la fiche d’origine.</p>
        ) : (
          <ul className="mt-2 divide-y">
            {ings.map((line) => (
              <li key={line} className="py-2 text-sm leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
        )}
        {ings.length > 0 && realIngs.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Cette fiche n’a pas de liste détaillée : elle n’ajoute rien aux courses.
          </p>
        )}
      </section>
      <section>
        <h2 className="font-heading text-xl">Préparation</h2>
        {recipe.steps.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Pas d’étapes dans la fiche d’origine.</p>
        ) : (
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {recipe.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}
