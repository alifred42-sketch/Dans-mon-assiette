"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function WeekPicker({ week, path }: { week: number; path: string }) {
  const prev = Math.max(1, week - 1);
  const next = Math.min(52, week + 1);
  const hrefFor = (n: number) => `${path === "/" ? "/" : path}?w=${n}`;

  function go(n: number) {
    window.location.assign(hrefFor(n));
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl bg-card px-2 py-2 ring-1 ring-foreground/10">
      {week > 1 ? (
        <a
          href={hrefFor(prev)}
          className="inline-flex size-12 items-center justify-center rounded-xl text-foreground hover:bg-muted"
          aria-label="Semaine précédente"
          onClick={(event) => {
            event.preventDefault();
            go(prev);
          }}
        >
          <ChevronLeft className="size-7" />
        </a>
      ) : (
        <span className="inline-flex size-12 items-center justify-center text-muted-foreground/40" aria-hidden>
          <ChevronLeft className="size-7" />
        </span>
      )}
      <div className="min-w-0 text-center">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Semaine</p>
        <label className="sr-only" htmlFor="week-select">
          Choisir la semaine
        </label>
        <select
          id="week-select"
          name="w"
          value={week}
          onChange={(event) => go(Number(event.currentTarget.value))}
          className="mt-0.5 max-w-full bg-transparent text-center font-heading text-2xl outline-none"
        >
          {Array.from({ length: 52 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      {week < 52 ? (
        <a
          href={hrefFor(next)}
          className="inline-flex size-12 items-center justify-center rounded-xl text-foreground hover:bg-muted"
          aria-label="Semaine suivante"
          onClick={(event) => {
            event.preventDefault();
            go(next);
          }}
        >
          <ChevronRight className="size-7" />
        </a>
      ) : (
        <span className="inline-flex size-12 items-center justify-center text-muted-foreground/40" aria-hidden>
          <ChevronRight className="size-7" />
        </span>
      )}
    </div>
  );
}
