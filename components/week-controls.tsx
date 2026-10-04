"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useWeekNav } from "@/lib/week-url";
import { useStore } from "@/lib/store";

export function WeekControls() {
  const { week, setWeek } = useWeekNav();
  const { servings, setServings } = useStore();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-full bg-muted p-1">
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-full hover:bg-background"
          onClick={() => setWeek(week - 1)}
          aria-label="Semaine précédente"
        >
          <ChevronLeft className="size-4" />
        </button>
        <label className="flex min-w-28 items-center justify-center gap-1 text-sm font-medium">
          <span className="sr-only">Numéro de semaine</span>
          <select
            className="h-8 rounded-md bg-transparent px-1 text-center font-medium"
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            aria-label="Choisir la semaine"
          >
            {Array.from({ length: 52 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Semaine {n} / 52
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-full hover:bg-background"
          onClick={() => setWeek(week + 1)}
          aria-label="Semaine suivante"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        Portions
        <select
          className="h-8 rounded-lg border border-input bg-background px-2 text-foreground"
          value={servings}
          onChange={(e) => setServings(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
