"use client";

import { useSearchParams } from "next/navigation";
import { clampWeek, shoppingForWeek } from "@/lib/carnet";
import { CheckList } from "@/components/check-list";
import { WeekPicker } from "@/components/week-picker";

export default function CoursesPage() {
  const search = useSearchParams();
  const week = clampWeek(search.get("w"));
  const items = shoppingForWeek(week).map((item) => ({
    id: `${item.aisle}|${item.label}`,
    title: item.label,
    detail: item.recipes.join(" · "),
    group: item.aisle,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl">Courses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Semaine {week}. Coche un ingrédient pour le barrer. Change de semaine pour
          recalculer.
        </p>
      </div>
      <WeekPicker week={week} path="/courses" />
      <CheckList storageKey={`assiette-courses-${week}`} items={items} />
    </div>
  );
}
