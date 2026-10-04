import Link from "next/link";
import { DAYS, DAY_LABEL, clampWeek, getRecipe, weekPlan } from "@/lib/carnet";
import { WeekPicker } from "@/components/week-picker";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const { w } = await searchParams;
  const week = clampWeek(w);
  const slots = weekPlan(week);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl leading-tight">Semaine {week}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Clique un plat souligné pour ouvrir sa fiche. Un plat sans soulignement n’a pas de
          fiche certaine.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Sur Android : Chrome → menu ⋮ → Ajouter à l’écran d’accueil.
        </p>
      </div>
      <WeekPicker week={week} path="/" />
      <div className="space-y-3">
        {DAYS.map((day) => {
          const midi = slots.find((s) => s.day === day && s.meal === "Midi");
          const soir = slots.find((s) => s.day === day && s.meal === "Soir");
          return (
            <section key={day} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
              <h2 className="mb-2 font-heading text-lg">{DAY_LABEL[day]}</h2>
              <MealRow week={week} label="Midi" slot={midi} />
              <MealRow week={week} label="Soir" slot={soir} />
            </section>
          );
        })}
      </div>
      <Link
        href={`/courses?w=${week}`}
        className="flex min-h-12 items-center justify-center rounded-2xl bg-primary px-4 text-base font-semibold text-primary-foreground"
      >
        Courses de la semaine {week}
      </Link>
    </div>
  );
}

function MealRow({
  week,
  label,
  slot,
}: {
  week: number;
  label: string;
  slot?: { name: string; recipeId: string | null };
}) {
  const recipe = getRecipe(slot?.recipeId);
  return (
    <div className="border-t border-border/60 py-3 first:border-t-0 first:pt-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      {recipe ? (
        <Link
          href={`/fiche/${recipe.id}?w=${week}`}
          className="mt-1 block text-base font-medium text-primary underline decoration-primary/40 underline-offset-4"
        >
          {recipe.name}
        </Link>
      ) : (
        <p className="mt-1 text-base">{slot?.name || "Repas non indiqué"}</p>
      )}
    </div>
  );
}
