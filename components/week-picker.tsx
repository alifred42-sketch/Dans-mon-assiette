"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WeekPicker({ week, path }: { week: number; path: string }) {
  const router = useRouter();
  const go = (next: number) => {
    const w = Math.min(52, Math.max(1, next));
    router.push(`${path}?w=${w}`);
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-card px-2 py-2 ring-1 ring-foreground/10">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-12"
        disabled={week <= 1}
        onClick={() => go(week - 1)}
        aria-label="Semaine précédente"
      >
        <ChevronLeft className="size-6" />
      </Button>
      <div className="min-w-0 text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Semaine</p>
        <label className="sr-only" htmlFor="week-select">
          Choisir la semaine
        </label>
        <select
          id="week-select"
          value={week}
          onChange={(e) => go(Number(e.target.value))}
          className="mt-0.5 max-w-full bg-transparent text-center font-heading text-2xl outline-none"
        >
          {Array.from({ length: 52 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-12"
        disabled={week >= 52}
        onClick={() => go(week + 1)}
        aria-label="Semaine suivante"
      >
        <ChevronRight className="size-6" />
      </Button>
    </div>
  );
}
