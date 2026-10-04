"use client";

import Link from "next/link";
import { useState } from "react";
import { DAYS, DAY_LABEL, getRecipe, slotKey, weekPlan } from "@/lib/carnet";
import { dishKind } from "@/lib/dish";
import { useStore } from "@/lib/store";
import { RecipePicker } from "@/components/recipe-picker";
import { WeekControls } from "@/components/week-controls";
import { Button, buttonVariants } from "@/components/ui/button";

export default function SemainePage() {
  const { week, overrides, setSlot, clearWeekOverrides } = useStore();
  const slots = weekPlan(week, overrides);
  const [pick, setPick] = useState<{ key: string; title: string } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl">Semaine {week}</h1>
          <p className="text-sm text-muted-foreground">
            Clique un plat pour ouvrir la fiche. Remplace un repas : courses et batch suivent.
          </p>
        </div>
        <WeekControls />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {DAYS.map((day) => {
          const midi = slots.find((s) => s.day === day && s.meal === "midi");
          const soir = slots.find((s) => s.day === day && s.meal === "soir");
          return (
            <article key={day} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/8">
              <h2 className="mb-3 font-heading text-lg">{DAY_LABEL[day]}</h2>
              <MealRow
                label="Midi"
                slot={midi}
                onReplace={() =>
                  setPick({
                    key: slotKey(week, day, "midi"),
                    title: midi?.label || "midi",
                  })
                }
              />
              <MealRow
                label="Soir"
                slot={soir}
                onReplace={() =>
                  setPick({
                    key: slotKey(week, day, "soir"),
                    title: soir?.label || "soir",
                  })
                }
              />
            </article>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/courses" className={buttonVariants()}>
          Voir les courses de la semaine
        </Link>
        <Link href="/batch" className={buttonVariants({ variant: "outline" })}>
          Voir le batch
        </Link>
        <Button variant="ghost" onClick={() => clearWeekOverrides(week)}>
          Annuler les remplacements
        </Button>
      </div>
      <RecipePicker
        open={!!pick}
        onOpenChange={(o) => !o && setPick(null)}
        title={pick?.title || ""}
        onPick={(id) => {
          if (pick) setSlot(pick.key, id);
          setPick(null);
        }}
      />
    </div>
  );
}

function MealRow({
  label,
  slot,
  onReplace,
}: {
  label: string;
  slot?: { recipeId: string | null; label: string };
  onReplace: () => void;
}) {
  const recipe = getRecipe(slot?.recipeId);
  return (
    <div className="flex items-start justify-between gap-3 border-t border-border/60 py-3 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        {recipe ? (
          <div>
            <Link href={`/recettes/${recipe.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
              {recipe.name}
            </Link>
            <p className="text-xs text-muted-foreground">{dishKind(recipe).label}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{slot?.label || "Repas à préciser"}</p>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onReplace}>
        Remplacer
      </Button>
    </div>
  );
}
