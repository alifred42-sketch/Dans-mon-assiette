"use client";

import { useMemo, useState } from "react";
import { filterRecipes } from "@/lib/carnet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto sm:max-w-none">
        <SheetHeader>
          <SheetTitle>Remplacer {title}</SheetTitle>
          <SheetDescription>
            Choisis une recette du carnet. Courses et batch se recalculent tout seuls.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-6">
          <Input
            placeholder="Rechercher une recette…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Button variant="outline" className="w-full" onClick={() => onPick(null)}>
            Laisser ce repas vide
          </Button>
          <ul className="divide-y">
            {list.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start gap-0.5 py-3 text-left"
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
      </SheetContent>
    </Sheet>
  );
}
