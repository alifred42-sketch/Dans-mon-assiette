"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { clampWeek, shoppingForWeek } from "@/lib/carnet";
import { CheckList } from "@/components/check-list";
import { WeekPicker } from "@/components/week-picker";

export default function CoursesPage() {
  const search = useSearchParams();
  const week = clampWeek(search.get("w"));
  const [servingsByRecipe, setServingsByRecipe] = useState<Record<string, number>>({});
  useEffect(() => {
    const refresh = () => { try { setServingsByRecipe(JSON.parse(localStorage.getItem("assiette-recipe-servings") || "{}")); } catch { setServingsByRecipe({}); } };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("assiette-servings-change", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("assiette-servings-change", refresh); };
  }, []);
  const items = shoppingForWeek(week, servingsByRecipe).map((item) => ({
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
          Semaine {week}. Les quantités viennent des fiches, additionnées sur la
          semaine. S’il n’y a pas de grammage, le tableur n’en avait pas.
        </p>
      </div>
      <WeekPicker week={week} path="/courses" />
      <CheckList storageKey={`assiette-courses-${week}`} items={items} />
    </div>
  );
}
