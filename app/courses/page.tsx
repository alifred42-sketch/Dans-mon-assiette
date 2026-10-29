"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Apple, Carrot, ChevronDown, ChevronLeft, ChevronRight, Fish, ShoppingCart, Container, Heart } from "lucide-react";
import { clampWeek, currentIsoWeek, getRecipe, shoppingForWeek, weekPlan, DAYS, DAY_LABEL, type PlanningPreferences } from "@/lib/carnet";
import { CheckList } from "@/components/check-list";
import { adaptGlutenFreeText, adaptLactoseFreeText, adaptNutFreeText } from "@/lib/ingredient-substitutions";
import { GlutenFreeSafetyNotice } from "@/components/gluten-free-safety-notice";
import { LactoseFreeSafetyNotice } from "@/components/lactose-free-safety-notice";
import { NutFreeSafetyNotice } from "@/components/nut-free-safety-notice";
import { getFreezerPlan } from "@/lib/freezer";

const NON_INGREDIENT_PATTERN = /(?:verifier la cuisson|arroser du jus|servir immediatement|cuire au four|prechauffer le four|assaisonner le poisson|repartir les legumes|fruits de mer doivent|pour personnes|une recette ideale pour)/i;

function dateRangeForIsoWeek(week: number) {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (date: Date) => date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" }).toLocaleUpperCase("fr-FR");
  return `${fmt(monday)} - ${fmt(sunday)} ${sunday.getFullYear()}`;
}

export default function CoursesPage() {
  const search = useSearchParams();
  const requestedWeek = search.get("w");
  const manualWeek = search.get("manual") === "1";
  const [currentWeek, setCurrentWeek] = useState(() => currentIsoWeek());
  const week = manualWeek && requestedWeek ? clampWeek(requestedWeek) : currentWeek;
  const [servingsByRecipe, setServingsByRecipe] = useState<Record<string, number>>({});
  const [recipeOverrides, setRecipeOverrides] = useState<Record<string, string>>({});
  const [preferences, setPreferences] = useState<PlanningPreferences>({});
  const [extraCourseItems, setExtraCourseItems] = useState<string[]>([]);
  const [freezerSlotKeys, setFreezerSlotKeys] = useState<string[]>([]);
  const [openDay, setOpenDay] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"week" | "favorites">("week");
  const [favoriteRecipes, setFavoriteRecipes] = useState<Array<{ recipeId: string; name: string; ingredients: string[] }>>([]);
  const [favoriteChecked, setFavoriteChecked] = useState<Record<string, boolean>>({});
  const [openFavorite, setOpenFavorite] = useState<string>("");
  useEffect(() => {
    const refreshCurrentWeek = () => {
      if (search.get("manual") !== "1") setCurrentWeek(currentIsoWeek());
    };
    refreshCurrentWeek();
    const interval = window.setInterval(refreshCurrentWeek, 60_000);
    window.addEventListener("focus", refreshCurrentWeek);
    document.addEventListener("visibilitychange", refreshCurrentWeek);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshCurrentWeek);
      document.removeEventListener("visibilitychange", refreshCurrentWeek);
    };
  }, [search]);
  useEffect(() => {
    const refresh = () => {
      try { setServingsByRecipe(JSON.parse(localStorage.getItem("assiette-recipe-servings") || "{}")); } catch { setServingsByRecipe({}); }
      try {
        const savedOverrides = JSON.parse(localStorage.getItem("cuisine-chic-ouf-recipe-switches") || "{}");
        const freezerPlan = getFreezerPlan(week, savedOverrides);
        setRecipeOverrides(freezerPlan.overrides);
        setFreezerSlotKeys(freezerPlan.slotKeys);
      } catch { setRecipeOverrides({}); setFreezerSlotKeys([]); }
      try {
        const saved = JSON.parse(localStorage.getItem("cuisine-chic-ouf-preferences") || "{}");
        const householdServings = Number(localStorage.getItem("assiette-household-servings") || "4");
        setPreferences({ ...saved, householdServings: Number.isFinite(householdServings) ? householdServings : 4 });
      } catch { setPreferences({}); }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("assiette-servings-change", refresh);
    window.addEventListener("cuisine-chic-ouf-plan-change", refresh);
    window.addEventListener("cuisine-chic-ouf-preferences-change", refresh);
    window.addEventListener("cuisine-chic-ouf-freezer-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("assiette-servings-change", refresh);
      window.removeEventListener("cuisine-chic-ouf-plan-change", refresh);
      window.removeEventListener("cuisine-chic-ouf-preferences-change", refresh);
      window.removeEventListener("cuisine-chic-ouf-freezer-change", refresh);
    };
  }, [week]);

  useEffect(() => {
    const refreshFavorites = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("cuisine-chic-ouf-course-favorites") || "[]");
        setFavoriteRecipes(Array.isArray(saved) ? saved.filter((item) => item && typeof item.recipeId === "string" && typeof item.name === "string" && Array.isArray(item.ingredients)) : []);
      } catch { setFavoriteRecipes([]); }
      try { setFavoriteChecked(JSON.parse(localStorage.getItem("cuisine-chic-ouf-course-favorites-checked") || "{}")); } catch { setFavoriteChecked({}); }
    };
    refreshFavorites();
    window.addEventListener("storage", refreshFavorites);
    window.addEventListener("cuisine-chic-ouf-course-favorites-change", refreshFavorites);
    return () => {
      window.removeEventListener("storage", refreshFavorites);
      window.removeEventListener("cuisine-chic-ouf-course-favorites-change", refreshFavorites);
    };
  }, []);

  function toggleFavoriteIngredient(key: string) {
    setFavoriteChecked((previous) => {
      const next = { ...previous, [key]: !previous[key] };
      try { localStorage.setItem("cuisine-chic-ouf-course-favorites-checked", JSON.stringify(next)); } catch {}
      return next;
    });
  }

  useEffect(() => {
    const refreshExtras = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("assiette-courses-extra-" + week) || "[]");
        setExtraCourseItems(Array.isArray(saved) ? saved.filter((item) => typeof item === "string") : []);
      } catch { setExtraCourseItems([]); }
    };
    refreshExtras();
    window.addEventListener("storage", refreshExtras);
    window.addEventListener("cuisine-chic-ouf-courses-extra-change", refreshExtras);
    return () => {
      window.removeEventListener("storage", refreshExtras);
      window.removeEventListener("cuisine-chic-ouf-courses-extra-change", refreshExtras);
    };
  }, [week]);

  // Le calcul central du panier reste inchangé : mêmes données, quantités et regroupements.
  const items = useMemo(() => shoppingForWeek(week, servingsByRecipe, recipeOverrides, preferences, freezerSlotKeys)
    .filter((item) => !NON_INGREDIENT_PATTERN.test(item.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))
    .map((item) => ({ id: `${item.aisle}|${item.label}`, title: adaptNutFreeText(adaptLactoseFreeText(adaptGlutenFreeText(item.label, Boolean(preferences.sansGluten)), Boolean(preferences.sansLactose)), Boolean(preferences.sansFruitsCoque)), group: item.aisle }))
    .concat(extraCourseItems.map((item) => ({ id: "frigo|" + item, title: item, group: "Ajouts du Frigo Magique" }))), [week, servingsByRecipe, recipeOverrides, preferences, freezerSlotKeys, extraCourseItems]);

  const slots = useMemo(() => weekPlan(week, recipeOverrides, preferences), [week, recipeOverrides, preferences]);
  const daySlots = useMemo(() => DAYS.filter((day) => day !== "LUNDI").map((day) => ({
    day,
    meals: slots.filter((slot) => slot.day === day && slot.recipeId).map((slot) => {
      const recipe = getRecipe(slot.recipeId);
      return { meal: slot.meal, name: slot.name, ingredients: recipe?.ingredients || [] };
    }),
  })), [slots]);

  return (
    <main className="min-h-dvh bg-[#A8E6CF] px-4 pb-28 pt-5 font-sans uppercase text-black sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <GlutenFreeSafetyNotice />
        <LactoseFreeSafetyNotice />
        <NutFreeSafetyNotice />
        <header className="relative text-center">
          <div className="mb-3 flex items-center justify-between"><Link href="/" aria-label="Retour" className="text-2xl font-bold text-black">‹</Link><h1 className="font-heading text-2xl font-bold normal-case text-black sm:text-3xl">Mes Courses</h1><Link href="/compte" className="text-xs font-bold tracking-wide text-black">MON COMPTE</Link></div>
          <div className="mx-auto mt-3 flex max-w-xl items-center justify-between gap-2 rounded-2xl bg-white px-2 py-2 text-black shadow-sm">
            <button type="button" aria-label="Semaine précédente" disabled={week <= 1} onClick={() => { window.location.href = `/courses?w=${week - 1}&manual=1`; }} className="flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-[#EAF4F1] disabled:opacity-30"><ChevronLeft className="size-6" /></button>
            <p className="text-center text-xs font-black uppercase tracking-wide sm:text-sm">{dateRangeForIsoWeek(week)}</p>
            <button type="button" aria-label="Semaine suivante" disabled={week >= 52} onClick={() => { window.location.href = `/courses?w=${week + 1}&manual=1`; }} className="flex size-10 shrink-0 items-center justify-center rounded-xl hover:bg-[#EAF4F1] disabled:opacity-30"><ChevronRight className="size-6" /></button>
          </div>
          <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-black">Votre panier trié par rayons automatiquement. Cochez ce que vous avez, le reste remonte en vert.</p>\n          <div className="mx-auto mt-4 grid max-w-xl grid-cols-2 gap-2" role="tablist" aria-label="Navigation des courses"><button role="tab" aria-selected={activeTab === "week"} onClick={() => setActiveTab("week")} className={`rounded-2xl px-3 py-3 text-sm font-black ${activeTab === "week" ? "bg-white text-black shadow-sm ring-2 ring-black/10" : "bg-white/40 text-black"}`}>MA SEMAINE</button><button role="tab" aria-selected={activeTab === "favorites"} onClick={() => setActiveTab("favorites")} className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-black ${activeTab === "favorites" ? "bg-white text-black shadow-sm ring-2 ring-black/10" : "bg-white/40 text-black"}`}><Heart className="size-4"/> MES FAVORIS</button></div>
        </header>

        {activeTab === "week" ? <><section id="panier-global" className="space-y-3">
          <div className="flex items-center gap-2 px-1 text-[#2B2B2B]">
            <ShoppingCart className="size-5" />
            <h2 className="text-lg font-black uppercase tracking-wide">Mon panier par rayons</h2>
          </div>
          <div className="rounded-[20px] bg-white p-3 shadow-[0_6px_18px_rgba(0,0,0,0.12)] sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-[#214E4B]"><Fish className="size-5" /><h3 className="font-black uppercase">Poissonnerie & viandes</h3></div>
            <p className="mb-4 rounded-xl bg-[#F9F9F7] px-3 py-3 text-sm text-[#555551]">Les produits de ce rayon calculés pour la semaine apparaissent dans la liste ci-dessous.</p>
            <div className="mb-4 flex items-center gap-2 text-[#214E4B]"><Apple className="size-5" /><Carrot className="size-5" /><h3 className="font-black uppercase">Fruits & légumes</h3></div>
            <CheckList storageKey={`assiette-courses-${week}`} items={items} />
          </div>
        </section>

        <section className="space-y-2" aria-label="Ingrédients par jour">
          <h2 className="px-1 text-lg font-black uppercase tracking-wide text-black">Détail des menus par jour</h2>
          {daySlots.map(({ day, meals }) => {
            const expanded = openDay === day;
            return (
              <section key={day} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <button type="button" aria-expanded={expanded} onClick={() => setOpenDay(expanded ? "" : day)} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left font-black uppercase text-[#214E4B] hover:bg-[#F9F9F7]">
                  <span>👩‍🍳 {DAY_LABEL[day]} <span className="font-medium normal-case text-[#777]">({meals.length} repas)</span></span>
                  <ChevronDown className={`size-5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
                {expanded ? <div className="space-y-3 border-t border-[#E6DFD3] p-4">
                  {meals.length ? meals.map((meal, index) => (
                    <div key={`${meal.meal}-${index}`}>
                      <p className="font-bold text-[#1A1A1A]">{meal.meal} — {meal.name}</p>
                      {meal.ingredients.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#555551]">{meal.ingredients.map((ingredient, i) => <li key={i}>{ingredient}</li>)}</ul> : <p className="mt-1 text-sm text-[#777]">Les ingrédients sont inclus dans le panier global.</p>}
                    </div>
                  )) : <p className="text-sm text-[#777]">Aucun repas renseigné pour ce jour.</p>}
                </div> : null}
              </section>
            );
          })}
        </section></> : <section className="space-y-3" aria-label="Mes recettes favorites ajoutées aux courses">
          {favoriteRecipes.length === 0 ? <div className="rounded-2xl bg-white p-5 text-center text-sm font-semibold normal-case">Aucune recette ajoutée pour le moment. Depuis une fiche recette, utilise « Ajouter à la liste de courses ».</div> : favoriteRecipes.map((recipe) => {
            const expanded = openFavorite === recipe.recipeId;
            return <article key={recipe.recipeId} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <button type="button" aria-expanded={expanded} onClick={() => setOpenFavorite(expanded ? "" : recipe.recipeId)} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-4 py-4 text-left text-sm font-black text-black">
                <span>{recipe.name}</span><ChevronDown className={`size-5 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}/>
              </button>
              {expanded ? <ul className="space-y-1 border-t border-black/10 p-3">{recipe.ingredients.map((ingredient, index) => {
                const key = recipe.recipeId + "|" + index + "|" + ingredient;
                const done = Boolean(favoriteChecked[key]);
                return <li key={key}><label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-3 text-sm normal-case"><input type="checkbox" checked={done} onChange={() => toggleFavoriteIngredient(key)} className="mt-0.5 size-5 shrink-0 accent-[#8FA89B]"/><span className={done ? "text-gray-400 line-through" : "text-black"}>{ingredient}</span></label></li>;
              })}</ul> : null}
            </article>;
          })}
        </section>}

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-[#A8E6CF]/95 px-3 py-3 backdrop-blur">
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3">
            <a href="#panier-global" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-center text-xs font-black uppercase text-[#1A1A1A] shadow-sm ring-1 ring-black/10 sm:text-sm"><ShoppingCart className="size-4" /> Ma liste de courses</a>
            <Link href={`/batch?w=${week}&manual=1`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-center text-xs font-black uppercase text-black shadow-sm sm:text-sm"><Container className="size-4" /> Mon batch</Link>
          </div>
        </nav>
      </div>
    </main>
  );
}
