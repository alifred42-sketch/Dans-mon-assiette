import Link from "next/link";
import { batchForWeek } from "@/lib/carnet";
import { clampServings, clampWeek, getOverrides } from "@/lib/prefs";
import { WeekControls } from "@/components/week-controls";

export default async function BatchPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string; n?: string }>;
}) {
  const sp = await searchParams;
  const week = clampWeek(sp.w);
  const servings = clampServings(sp.n);
  const overrides = await getOverrides();
  const items = batchForWeek(week, overrides);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl">Batch · semaine {week}</h1>
          <p className="text-sm text-muted-foreground">
            Plats qui se préparent à l’avance ou au robot — plus les « Ligne source 5 » du tableur.
          </p>
        </div>
        <WeekControls week={week} servings={servings} path="/batch" />
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-muted/50 p-8 text-center text-sm text-muted-foreground">
          Rien d’évident à batcher cette semaine.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map(({ recipe, when }) => (
            <li key={recipe.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
              <Link href={`/recettes/${recipe.id}`} className="font-heading text-lg text-primary hover:underline">
                {recipe.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">Au menu : {when.join(" · ")}</p>
              {recipe.robotSearch && (
                <p className="mt-2 text-xs">Mr Cuisine → « {recipe.robotSearch} »</p>
              )}
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {recipe.ingredients.slice(0, 6).map((i) => (
                  <li key={i.raw}>{i.raw.replace(/🔗/g, "").trim()}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
