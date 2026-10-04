"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

export function WeekControls() {
  const { week, setWeek, servings, setServings } = useStore();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-full bg-muted p-1">
        <Button variant="ghost" size="icon-sm" onClick={() => setWeek(week - 1)} aria-label="Semaine précédente">
          <ChevronLeft />
        </Button>
        <span className="min-w-28 text-center text-sm font-medium">Semaine {week} / 52</span>
        <Button variant="ghost" size="icon-sm" onClick={() => setWeek(week + 1)} aria-label="Semaine suivante">
          <ChevronRight />
        </Button>
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
