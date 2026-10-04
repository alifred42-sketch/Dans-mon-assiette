"use client";

import { useEffect, useMemo, useState } from "react";
import type { ShoppingItem } from "@/lib/carnet";

export function ShoppingList({ week, items }: { week: number; items: ShoppingItem[] }) {
  const storageKey = `assiette-courses-${week}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      setChecked(JSON.parse(localStorage.getItem(storageKey) || "{}"));
    } catch {
      setChecked({});
    }
  }, [storageKey]);

  const remaining = useMemo(
    () => items.filter((item) => !checked[item.label]).length,
    [items, checked]
  );

  function toggle(label: string) {
    setChecked((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-muted/70 p-6 text-center text-sm text-muted-foreground">
        Aucun ingrédient détaillé pour cette semaine. Les plats sans vraie liste restent
        visibles dans le menu, sans être inventés ici.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {items.length} articles · {remaining} encore à prendre. Recalculé dès que tu changes
        de semaine.
      </p>
      <ul className="divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
        {items.map((item) => {
          const done = !!checked[item.label];
          return (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => toggle(item.label)}
                className="flex w-full items-start gap-3 px-4 py-4 text-left"
              >
                <span
                  className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md border ${
                    done ? "border-primary bg-primary text-primary-foreground" : "border-input"
                  }`}
                  aria-hidden
                >
                  {done ? "✓" : ""}
                </span>
                <span className={done ? "text-muted-foreground line-through" : ""}>
                  <span className="block font-medium leading-snug">{item.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {item.recipes.join(" · ")}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
