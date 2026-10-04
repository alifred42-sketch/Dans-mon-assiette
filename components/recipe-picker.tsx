"use client";

import { useMemo, useState } from "react";
import { filterRecipes } from "@/lib/carnet";

export function RecipePicker({
  open,
  onOpenChange,
  onPick,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (id: string | null) => void;
  title: string;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => filterRecipes({ q }).slice(0, 40), [q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center"
      onClick={() => onOpenChange(false)}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-xl ring-1 ring-foreground/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border/70 p-4">
          <h2 id="picker-title" className="font-heading text-lg">
            Remplacer {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choisis une recette du carnet. Courses et batch se recalculent.
          </p>
        </div>
        <div className="space-y-3 overflow-y-auto p-4">
          <input
            autoFocus
            placeholder="Rechercher une recette…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <button
            type="button"
            className="w-full rounded-lg border border-border py-2 text-sm hover:bg-muted"
            onClick={() => onPick(null)}
          >
            Laisser ce repas vide
          </button>
          <ul className="divide-y">
            {list.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 py-3 text-left hover:text-primary"
                  onClick={() => onPick(r.id)}
                >
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {r.timeMin} min · {r.ingredients.length} ingrédients
                    {r.robot ? " · Mr Cuisine" : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {list.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune recette ne correspond.
            </p>
          )}
        </div>
        <div className="border-t border-border/70 p-3">
          <button
            type="button"
            className="w-full rounded-lg py-2 text-sm text-muted-foreground hover:bg-muted"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
