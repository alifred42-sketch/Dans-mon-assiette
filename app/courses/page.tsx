"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { clampWeek, currentIsoWeek, shoppingForWeek, type PlanningPreferences } from "@/lib/carnet";
import { CheckList } from "@/components/check-list";
import { WeekPicker } from "@/components/week-picker";

export default function CoursesPage() {
  const search = useSearchParams();
  const requestedWeek = search.get("w");
  const manualWeek = search.get("manual") === "1";
  const [currentWeek, setCurrentWeek] = useState(() => currentIsoWeek());
  const week = manualWeek && requestedWeek ? clampWeek(requestedWeek) : currentWeek;
  useEffect(() => {
    const refreshCurrentWeek = () => {
      if (search.get("manual") !== "1") setCurrentWeek(currentIsoWeek());
    };
    refreshCurrentWeek();
    window.addEventListener("focus", refreshCurrentWeek);
    document.addEventListener("visibilitychange", refreshCurrentWeek);
    return () => {
      window.removeEventListener("focus", refreshCurrentWeek);
      document.removeEventListener("visibilitychange", refreshCurrentWeek);
    };
  }, [search]);
  const [servingsByRecipe, setServingsByRecipe] = useState<Record<string, number>>({});
  const [recipeOverrides, setRecipeOverrides] = useState<Record<string, string>>({});
  const [preferences, setPreferences] = useState<PlanningPreferences>({});
  useEffect(() => {
    const refresh = () => { try { setServingsByRecipe(JSON.parse(localStorage.getItem("assiette-recipe-servings") || "{}")); } catch { setServingsByRecipe({}); } try { setRecipeOverrides(JSON.parse(localStorage.getItem("cuisine-chic-ouf-recipe-switches") || "{}")); } catch { setRecipeOverrides({}); } try { setPreferences(JSON.parse(localStorage.getItem("cuisine-chic-ouf-preferences") || "{}")); } catch { setPreferences({}); } };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("assiette-servings-change", refresh);
    window.addEventListener("cuisine-chic-ouf-plan-change", refresh);
    window.addEventListener("cuisine-chic-ouf-preferences-change", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("assiette-servings-change", refresh); window.removeEventListener("cuisine-chic-ouf-plan-change", refresh); window.removeEventListener("cuisine-chic-ouf-preferences-change", refresh); };
  }, []);
  const nonIngredientPattern = /(?:verifier la cuisson|arroser du jus|servir immediatement|cuire au four|prechauffer le four|assaisonner le poisson|repartir les legumes|fruits de mer doivent|pour personnes|une recette ideale pour)/i;
  const items = shoppingForWeek(week, servingsByRecipe, recipeOverrides, preferences)
    .filter((item) => !nonIngredientPattern.test(item.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))
    .map((item) => ({
      id: `${item.aisle}|${item.label}`,
      title: item.label,
      group: item.aisle,
    }));

  return (
    <main className="min-h-dvh w-full bg-[#F9F9F7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-5">
        <div>
          <h1 className="font-heading text-3xl">Courses</h1>
          <p className="mt-1 text-sm font-normal leading-relaxed text-[#2B2B2B]">Votre panier trié par rayons automatiquement. Cochez ce que vous avez, le reste remonte en vert. Vos courses en 3 minutes chrono !</p>
          <p className="mt-1 text-xs text-muted-foreground">Semaine {week} · quantités regroupées à partir des fiches recettes.</p>
        </div>
        <WeekPicker week={week} path="/courses" />
        <CheckList storageKey={`assiette-courses-${week}`} items={items} />
      </div>
    </main>
  );
}
