"use client";

import { useSearchParams } from "next/navigation";
import { batchForWeek, clampWeek } from "@/lib/carnet";
import { CheckList } from "@/components/check-list";
import { WeekPicker } from "@/components/week-picker";

export default function BatchPage() {
  const search = useSearchParams();
  const week = clampWeek(search.get("w"));
  const items = batchForWeek(week);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl">Batch</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ce que le carnet prévoit de préparer en avance pour la semaine {week}.
        </p>
      </div>
      <WeekPicker week={week} path="/batch" />
      {items.length === 0 ? (
        <p className="rounded-2xl bg-muted/70 p-6 text-center text-sm text-muted-foreground">
          Rien de noté à préparer en avance pour cette semaine.
        </p>
      ) : (
        <CheckList storageKey={`assiette-batch-${week}`} items={items} />
      )}
    </div>
  );
}
