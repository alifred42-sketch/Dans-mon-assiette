import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function WeekControls({
  week,
  servings,
  path,
}: {
  week: number;
  servings: number;
  path: string;
}) {
  const prev = Math.max(1, week - 1);
  const next = Math.min(52, week + 1);
  const qs = (w: number, n = servings) => `${path}?w=${w}&n=${n}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-full bg-muted p-1">
        <Link
          href={qs(prev)}
          className="inline-flex size-8 items-center justify-center rounded-full hover:bg-background"
          aria-label="Semaine précédente"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <form action={path} className="flex items-center">
          <input type="hidden" name="n" value={servings} />
          <label className="sr-only" htmlFor="week-select">
            Numéro de semaine
          </label>
          <select
            id="week-select"
            name="w"
            defaultValue={week}
            data-autosubmit="change"
            className="h-8 min-w-28 rounded-md bg-transparent px-1 text-center text-sm font-medium"
            aria-label="Choisir la semaine"
          >
            {Array.from({ length: 52 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Semaine {n} / 52
              </option>
            ))}
          </select>
          <button type="submit" className="sr-only">
            Aller
          </button>
        </form>
        <Link
          href={qs(next)}
          className="inline-flex size-8 items-center justify-center rounded-full hover:bg-background"
          aria-label="Semaine suivante"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>
      <form action={path} className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="hidden" name="w" value={week} />
        <label htmlFor="servings-select">Portions</label>
        <select
          id="servings-select"
          name="n"
          defaultValue={servings}
          data-autosubmit="change"
          className="h-8 rounded-lg border border-input bg-background px-2 text-foreground"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <button type="submit" className="sr-only">
          Appliquer
        </button>
      </form>
    </div>
  );
}
