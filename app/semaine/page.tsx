import Link from "next/link";
import { DAYS, DAY_LABEL, filterRecipes, getRecipe, slotKey, weekPlan } from "@/lib/carnet";
import { dishKind } from "@/lib/dish";
import { clampServings, clampWeek, getOverrides } from "@/lib/prefs";
import { clearWeekReplacements, replaceMeal } from "@/app/actions";
import { WeekControls } from "@/components/week-controls";
import { buttonVariants } from "@/components/ui/button";

type Search = { w?: string; n?: string; replace?: string; rq?: string };

export default async function SemainePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const week = clampWeek(sp.w);
  const servings = clampServings(sp.n);
  const overrides = await getOverrides();
  const slots = weekPlan(week, overrides);
  const replace = sp.replace || "";
  const [replaceDay, replaceMealName] = replace.split("_");
  const replaceKey = replace ? slotKey(week, replaceDay, replaceMealName || "midi") : "";
  const replaceTitle =
    slots.find((s) => s.day === replaceDay && s.meal === replaceMealName)?.label || replace;
  const pickList = replace ? filterRecipes({ q: sp.rq }).slice(0, 40) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl">Semaine {week}</h1>
          <p className="text-sm text-muted-foreground">
            Clique un plat pour ouvrir la fiche. Remplace un repas : courses et batch suivent.
          </p>
        </div>
        <WeekControls week={week} servings={servings} path="/semaine" />
      </div>

      {replace ? (
        <section className="rounded-2xl bg-card p-4 ring-2 ring-primary">
          <h2 className="font-heading text-lg">Remplacer {replaceTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choisis une recette du carnet. Courses et batch se recalculent.
          </p>
          <form action="/semaine" className="mt-3 flex gap-2">
            <input type="hidden" name="w" value={week} />
            <input type="hidden" name="n" value={servings} />
            <input type="hidden" name="replace" value={replace} />
            <input
              name="rq"
              defaultValue={sp.rq || ""}
              data-autosubmit="input"
              placeholder="Rechercher une recette…"
              className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
            />
            <button type="submit" className={buttonVariants({ size: "sm" })}>
              Filtrer
            </button>
          </form>
          <form action={replaceMeal} className="mt-3">
            <input type="hidden" name="week" value={week} />
            <input type="hidden" name="key" value={replaceKey} />
            <input type="hidden" name="recipeId" value="" />
            <button type="submit" className="w-full rounded-lg border border-border py-2 text-sm hover:bg-muted">
              Laisser ce repas vide
            </button>
          </form>
          <ul className="mt-2 divide-y">
            {pickList.map((r) => (
              <li key={r.id}>
                <form action={replaceMeal}>
                  <input type="hidden" name="week" value={week} />
                  <input type="hidden" name="key" value={replaceKey} />
                  <input type="hidden" name="recipeId" value={r.id} />
                  <button type="submit" className="flex w-full flex-col items-start py-3 text-left hover:text-primary">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.timeMin} min · {r.ingredients.length} ingrédients
                      {r.robot ? " · Mr Cuisine" : ""}
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
          <Link href={`/semaine?w=${week}&n=${servings}`} className="mt-2 inline-block text-sm text-muted-foreground hover:underline">
            Annuler
          </Link>
        </section>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {DAYS.map((day) => {
          const midi = slots.find((s) => s.day === day && s.meal === "midi");
          const soir = slots.find((s) => s.day === day && s.meal === "soir");
          return (
            <article key={day} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
              <h2 className="mb-3 font-heading text-lg">{DAY_LABEL[day]}</h2>
              <MealRow week={week} servings={servings} day={day} meal="midi" label="Midi" slot={midi} />
              <MealRow week={week} servings={servings} day={day} meal="soir" label="Soir" slot={soir} />
            </article>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={`/courses?w=${week}&n=${servings}`} className={buttonVariants()}>
          Voir les courses de la semaine
        </Link>
        <Link href={`/batch?w=${week}&n=${servings}`} className={buttonVariants({ variant: "outline" })}>
          Voir le batch
        </Link>
        <form action={clearWeekReplacements}>
          <input type="hidden" name="week" value={week} />
          <button type="submit" className={buttonVariants({ variant: "ghost" })}>
            Annuler les remplacements
          </button>
        </form>
      </div>
    </div>
  );
}

function MealRow({
  week,
  servings,
  day,
  meal,
  label,
  slot,
}: {
  week: number;
  servings: number;
  day: string;
  meal: string;
  label: string;
  slot?: { recipeId: string | null; label: string };
}) {
  const recipe = getRecipe(slot?.recipeId);
  return (
    <div className="flex items-start justify-between gap-3 border-t border-border/60 py-3 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        {recipe ? (
          <div>
            <Link
              href={`/recettes/${recipe.id}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {recipe.name}
            </Link>
            <p className="text-xs text-muted-foreground">{dishKind(recipe).label}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{slot?.label || "Repas à préciser"}</p>
        )}
      </div>
      <Link
        href={`/semaine?w=${week}&n=${servings}&replace=${day}_${meal}`}
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        Remplacer
      </Link>
    </div>
  );
}
