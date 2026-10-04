import Link from "next/link";
import { carnet, shoppingForWeek } from "@/lib/carnet";
import { clampServings, clampWeek, getChecked, getOverrides } from "@/lib/prefs";
import { toggleChecked } from "@/app/actions";
import { WeekControls } from "@/components/week-controls";
import { buttonVariants } from "@/components/ui/button";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string; n?: string }>;
}) {
  const sp = await searchParams;
  const week = clampWeek(sp.w);
  const servings = clampServings(sp.n);
  const overrides = await getOverrides();
  const checked = await getChecked();
  const items = shoppingForWeek(week, overrides, servings);
  const remaining = items.filter((i) => !checked[`${week}_${i.key}`]).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl">Courses · semaine {week}</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} articles, {remaining} encore à prendre. Doublons fusionnés (plus 4 lignes « courgettes »).
          </p>
        </div>
        <WeekControls week={week} servings={servings} path="/courses" />
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-muted/50 p-8 text-center text-sm text-muted-foreground">
          Aucun ingrédient pour cette semaine. Choisis des repas dans le{" "}
          <Link href={`/semaine?w=${week}`} className="text-primary underline">
            semainier
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-6">
          {carnet.aisles.map((aisle) => {
            const group = items.filter((i) => i.aisle === aisle.id);
            if (!group.length) return null;
            return (
              <section key={aisle.id}>
                <h2 className="mb-2 font-heading text-lg">{aisle.label}</h2>
                <ul className="divide-y rounded-2xl bg-card ring-1 ring-foreground/8">
                  {group.map((item) => {
                    const key = `${week}_${item.key}`;
                    const done = !!checked[key];
                    return (
                      <li key={item.key} className="flex items-start gap-3 px-4 py-3">
                        <form action={toggleChecked}>
                          <input type="hidden" name="key" value={key} />
                          <input type="hidden" name="week" value={week} />
                          <input type="hidden" name="n" value={servings} />
                          <button
                            type="submit"
                            aria-pressed={done}
                            className={`mt-0.5 inline-flex size-5 items-center justify-center rounded border ${
                              done
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input bg-background"
                            }`}
                            aria-label={done ? "Retirer des cochés" : "Cocher"}
                          >
                            {done ? "✓" : ""}
                          </button>
                        </form>
                        <div className={done ? "text-muted-foreground line-through" : ""}>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.recipes.slice(0, 3).join(" · ")}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      <Link href={`/semaine?w=${week}&n=${servings}`} className={buttonVariants({ variant: "outline" })}>
        Modifier la semaine
      </Link>
    </div>
  );
}
