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

  const menuNames = [
    ...new Set(carnet.plan.filter((p) => p.recipeId === recipe.id).map((p) => p.name)),
  ];
  const weeks = [...new Set(carnet.plan.filter((p) => p.recipeId === recipe.id).map((p) => p.week))];
  const ings = recipe.ingredients.filter((line) => line.trim());
  const shopIngs = ings.filter((line) => !isPlaceholderIngredient(line));
  const meta = [recipe.timePrep && `Préparation ${recipe.timePrep}`, recipe.timeCook && `Cuisson ${recipe.timeCook}`, recipe.servings]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="space-y-6">
      <Link href={`/?w=${week}`} className="text-sm text-primary underline underline-offset-4">
        ← Semaine {week}
      </Link>
      <header className="space-y-2">
        <h1 className="font-heading text-3xl leading-tight">{recipe.name}</h1>
        {menuNames.some((n) => n !== recipe.name) && (
          <p className="text-sm text-muted-foreground">Au menu : {menuNames.join(" · ")}</p>
        )}
        {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
        {weeks.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Semaines {weeks.slice(0, 10).join(", ")}
            {weeks.length > 10 ? "…" : ""}
          </p>
        )}
      </header>
      <section>
        <h2 className="font-heading text-xl">Ingrédients</h2>
        {ings.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Pas de liste dans cette fiche.</p>
        ) : (
          <ul className="mt-2 divide-y">
            {ings.map((line) => (
              <li key={line} className="py-2 text-sm leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
        )}
        {ings.length > 0 && shopIngs.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">Rien de cette fiche n’est ajouté aux courses.</p>
        )}
      </section>
      <section>
        <h2 className="font-heading text-xl">Préparation</h2>
        {recipe.steps.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Pas d’étapes dans cette fiche.</p>
        ) : (
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {recipe.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
      </section>
      {recipe.robot.length > 0 && (
        <section>
          <h2 className="font-heading text-xl">Mr Cuisine</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {recipe.robot.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}
      {recipe.notes.length > 0 && (
        <section>
          <h2 className="font-heading text-xl">Notes</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {recipe.notes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
