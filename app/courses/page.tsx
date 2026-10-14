"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { clampWeek, currentIsoWeek, shoppingForWeek } from "@/lib/carnet";
import { CheckList } from "@/components/check-list";
import { WeekPicker } from "@/components/week-picker";

export default function CoursesPage() {
  const search = useSearchParams();
  const requestedWeek = search.get("w");
  const week = requestedWeek ? clampWeek(requestedWeek) : currentIsoWeek();
  const [servingsByRecipe, setServingsByRecipe] = useState<Record<string, number>>({});
  const [recipeOverrides, setRecipeOverrides] = useState<Record<string, string>>({});
  useEffect(() => {
    const refresh = () => { try { setServingsByRecipe(JSON.parse(localStorage.getItem("assiette-recipe-servings") || "{}")); } catch { setServingsByRecipe({}); } try { setRecipeOverrides(JSON.parse(localStorage.getItem("cuisine-chic-ouf-recipe-switches") || "{}")); } catch { setRecipeOverrides({}); } };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("assiette-servings-change", refresh);
    window.addEventListener("cuisine-chic-ouf-plan-change", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("assiette-servings-change", refresh); window.removeEventListener("cuisine-chic-ouf-plan-change", refresh); };
  }, []);
  const items = shoppingForWeek(week, servingsByRecipe, recipeOverrides).map((item) => ({
    id: `${item.aisle}|${item.label}`,
    title: item.label,
    detail: item.recipes.join(" · "),
    group: item.aisle,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl">Courses</h1>
        <p className="mt-1 text-sm font-normal leading-relaxed text-[#2B2B2B]">Votre panier trié par rayons automatiquement. Cochez ce que vous avez, le reste remonte en vert. Vos courses en 3 minutes chrono !</p>
        <p className="mt-1 text-xs text-muted-foreground">Semaine {week} · quantités regroupées à partir des fiches recettes.</p>
      </div>
      <WeekPicker week={week} path="/courses" />
      <CheckList storageKey={`assiette-courses-${week}`} items={items} />
    </div>
  );
}
