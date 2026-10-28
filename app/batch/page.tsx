"use client";

import { displayRecipe } from "@/lib/recipe-display";
import { RecipeHandsFree } from "@/components/recipe-hands-free";
import { adaptGlutenFreeText, adaptLactoseFreeText, adaptNutFreeText } from "@/lib/ingredient-substitutions";
import { GlutenFreeSafetyNotice } from "@/components/gluten-free-safety-notice";
import { LactoseFreeSafetyNotice } from "@/components/lactose-free-safety-notice";
import { NutFreeSafetyNotice } from "@/components/nut-free-safety-notice";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { batchForWeek, clampWeek, currentIsoWeek, getRecipe, weekPlan, type PlanningPreferences } from "@/lib/carnet";
import { WeekPicker } from "@/components/week-picker";
import { Beef, Blender, Carrot, CookingPot, Container, Flame, Refrigerator, Utensils, Wheat, ShoppingCart, ChevronLeft, ChevronRight, ChefHat } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import { getFreezerPlan, readVirtualFreezer, saveFrozenMeal, markFrozenMealUsed, rescheduleFrozenMeal, type VirtualFrozenMeal } from "@/lib/freezer";

type Task = { id: string; title: string; detail?: string; timer?: string; timerMinutes?: number; group?: string };
function minutes(value?: string): number {
  if (!value) return 0;
  const text = value.toLocaleLowerCase("fr");
  const hours = Number(text.match(/(\d+)\s*(?:h|heure)/)?.[1] || 0);
  const mins = Number(text.match(/(\d+)\s*(?:min|minute)/)?.[1] || 0);
  return hours * 60 + mins;
}
function durationLabel(total: number): string {
  const safe = Math.max(0, Math.round(total));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return h ? (m ? `${h} h ${m.toString().padStart(2, "0")}` : `${h} h`) : `${m} min`;
}
function prettyDay(day: string) { return day.charAt(0) + day.slice(1).toLowerCase(); }

function addIngredientQuantities(step: string | undefined, ingredients: string[] = []): string | undefined {
  if (!step) return step;
  let result = step;
  for (const line of ingredients) {
    const match = line.match(/^(\d+(?:[.,]\d+)?\s*(?:(?:c\.?\s*à\s*(?:soupe|café))|kg|g|mg|ml|cl|l|tranches?|gousses?|pincées?|branches?|feuilles?)?)\s+(?:(?:de|du|des|d)\s*)?(.+)$/i);
    if (!match) continue;
    const quantity = match[1].trim();
    const ingredientName = match[2].replace(/[(),].*$/, "").trim();
    const words = ingredientName.split(/\s+/).filter((word) => word.length > 3 && !/^(avec|pour|frais|fraîche|fraiche|concassées|concassees|râpé|rape|coupé|coupee)$/i.test(word));
    const candidates = [ingredientName, ...words].filter(Boolean).sort((a, b) => b.length - a.length);
    for (const candidate of candidates) {
      const lower = result.toLocaleLowerCase("fr");
      const index = lower.indexOf(candidate.toLocaleLowerCase("fr"));
      if (index >= 0 && !/^\s*\([^)]*\)/.test(result.slice(index + candidate.length))) {
        result = result.slice(0, index) + result.slice(index, index + candidate.length) + " (" + quantity + ")" + result.slice(index + candidate.length);
        break;
      }
    }
  }
  return result;
}

function ingredientKind(value: string): "vegetable" | "protein" | "starch" | "storage" | "equipment" | "other" {
  const text = value.toLocaleLowerCase("fr");
  if (/poulet|dinde|bœuf|boeuf|viande|poisson|saumon|cabillaud|œuf|oeuf|thon|jambon|protéine|proteine|crevette|porc|agneau|steak|maquereau/.test(text)) return "protein";
  if (/courgette|carotte|tomate|poivron|oignon|échalote|echalote|poireau|champignon|brocoli|chou|épinard|epinard|concombre|pomme de terre|patate douce|aubergine|céleri|celeri|radis|navet|asperge|ail|herbes|salade|légume|legume|découpe|decoupe|laver|éplucher|eplucher/.test(text)) return "vegetable";
  if (/riz|pâte|pate|semoule|quinoa|pomme de terre|féculent|feculent|farine|lentille|pain/.test(text)) return "starch";
  if (/conteneur|contenant|étiquet|etiquet|frigo|réfrig|refriger|congél|congel|stockage|portion|assembler/.test(text)) return "storage";
  if (/four|robot|mr cuisine|monsieur cuisine|mixage|mixeur|poêle|poele|casserole|cuisson|feu|chauffer|mijot|rôtir|rotir/.test(text)) return "equipment";
  return "other";
}

function taskIcon(value: string) {
  const kind = ingredientKind(value);
  if (kind === "vegetable") return <Carrot aria-hidden="true" className="size-5" />;
  if (kind === "protein") return <Beef aria-hidden="true" className="size-5" />;
  if (kind === "starch") return <Wheat aria-hidden="true" className="size-5" />;
  if (kind === "storage") return <Refrigerator aria-hidden="true" className="size-5" />;
  if (/mixeur|robot|mr cuisine|monsieur cuisine|mixage/.test(value.toLocaleLowerCase("fr"))) return <Blender aria-hidden="true" className="size-5" />;
  if (/four|rôtir|rotir/.test(value.toLocaleLowerCase("fr"))) return <Flame aria-hidden="true" className="size-5" />;
  if (/poêle|poele|casserole|cuisson|feu/.test(value.toLocaleLowerCase("fr"))) return <CookingPot aria-hidden="true" className="size-5" />;
  if (/matériel|materiel|ustensile|planche|couteau/.test(value.toLocaleLowerCase("fr"))) return <Utensils aria-hidden="true" className="size-5" />;
  if (/contenant|bocal|boîte|boite/.test(value.toLocaleLowerCase("fr"))) return <Container aria-hidden="true" className="size-5" />;
  return <Utensils aria-hidden="true" className="size-5" />;
}

function kindStyle(value: string) {
  const kind = ingredientKind(value);
  if (kind === "vegetable") return { label: "Légumes", classes: "bg-[#E0EFDF] text-[#2F6B3B] ring-[#A8CBA5]" };
  if (kind === "protein") return { label: "Protéines", classes: "bg-[#DFEAFB] text-[#315F9E] ring-[#A8C2E8]" };
  if (kind === "starch") return { label: "Féculents", classes: "bg-[#FFF1C9] text-[#80600A] ring-[#E8D18A]" };
  if (kind === "storage") return { label: "Contenants", classes: "bg-[#E6DFD3] text-[#625747] ring-[#C8BDAA]" };
  if (kind === "equipment") return { label: "Matériel / cuisson", classes: "bg-[#F3E5D9] text-[#8C4C34] ring-[#DDB69F]" };
  return { label: "Préparation", classes: "bg-[#F2F2EE] text-[#555551] ring-[#DEDED7]" };
}

export default function BatchPage() {
  const search = useSearchParams();
  const requestedWeek = search.get("w");
  const manualWeek = search.get("manual") === "1";
  const [currentWeek, setCurrentWeek] = useState(() => currentIsoWeek());
  const week = manualWeek && requestedWeek ? clampWeek(requestedWeek) : currentWeek;
  const [recipeOverrides, setRecipeOverrides] = useState<Record<string, string>>({});
  const [preferences, setPreferences] = useState<PlanningPreferences>({});
  const [robotPriority, setRobotPriority] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [activeTimers, setActiveTimers] = useState<Record<string, number>>({});
  const [householdServings, setHouseholdServings] = useState(4);
  const [freezerItems, setFreezerItems] = useState<VirtualFrozenMeal[]>([]);

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
      try {
        const savedOverrides = JSON.parse(localStorage.getItem("cuisine-chic-ouf-recipe-switches") || "{}");
        setRecipeOverrides(getFreezerPlan(week, savedOverrides).overrides);
      } catch { setRecipeOverrides({}); }
      try {
        const saved = JSON.parse(localStorage.getItem("cuisine-chic-ouf-preferences") || "{}");
        setPreferences(saved); setRobotPriority(Boolean(saved.robot));
      } catch { setPreferences({}); setRobotPriority(false); }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cuisine-chic-ouf-plan-change", refresh);
    window.addEventListener("cuisine-chic-ouf-preferences-change", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("cuisine-chic-ouf-plan-change", refresh); window.removeEventListener("cuisine-chic-ouf-preferences-change", refresh); };
  }, []);
  const storageKey = `cuisine-chic-ouf-batch-v2-${week}`;
  useEffect(() => {
    setReady(false);
    try { setChecked(JSON.parse(localStorage.getItem(storageKey) || "{}")); } catch { setChecked({}); }
    setReady(true);
  }, [storageKey]);
  useEffect(() => {
    if (ready) { try { localStorage.setItem(storageKey, JSON.stringify(checked)); } catch { /* storage indisponible */ } }
  }, [checked, ready, storageKey]);

  const plan = weekPlan(week, recipeOverrides, preferences);
  const baseSlots = plan.filter((slot) => (slot.day === "MARDI" && slot.meal === "Soir") || (slot.day === "MERCREDI" && slot.meal === "Soir"));
  const recipes = baseSlots.map((slot) => {
    const source = getRecipe(slot.recipeId);
    return { slot, recipe: source ? displayRecipe(source) : undefined };
  }).filter((entry) => entry.recipe);
  const existingItems = batchForWeek(week, recipeOverrides, preferences).filter((item) => /protéine pivot|proteine pivot|féculent|feculent|soupe de saison|base soupe|base de saison/i.test(`${item.title} ${item.group || ""}`));
  const existingTask = (item: { id: string; title: string; detail?: string; group?: string; target?: string }): Task => ({
    id: `carnet-${item.id}`, title: item.title,
    detail: [item.detail, item.target].filter(Boolean).join(" · ") || undefined,
    group: item.group,
  });
  const existingPrepTasks = existingItems.filter((item) => /organisation|préparation|preparation|découpe|decoupe|laver|éplucher|eplucher|planche|féculent|feculent|protéine pivot|proteine pivot|base de saison|soupe de saison|base soupe/i.test(`${item.title} ${item.group || ""}`)).map(existingTask);
  const existingCookTasks = existingItems.filter((item) => /four|rôtir|rotir|gratin|cuisson au four|légumes rôtis|legumes rotis|robot|mr cuisine|monsieur cuisine|vitesse|mixage|cuisson vapeur|cuissons? simultanées?/i.test(`${item.title} ${item.group || ""}`)).map(existingTask);
  const existingStorageTasks = existingItems.filter((item) => /conservation|congél|congel|frigo|réfrigér|refriger|assemblage|jour j|montage|finition|servir/i.test(`${item.title} ${item.group || ""}`)).map(existingTask);
  const vegetablePattern = /courgette|carotte|tomate|poivron|oignon|échalote|echalote|poireau|champignon|brocoli|chou|épinard|epinard|concombre|pomme de terre|patate douce|aubergine|céleri|celeri|radis|navet|asperge|ail|herbes|salade/i;
  const prepTasks: Task[] = useMemo(() => {
    const ingredients = recipes.flatMap(({ recipe }) => (recipe?.ingredients || []).filter((ingredient) => vegetablePattern.test(ingredient)));
    const unique = Array.from(new Set(ingredients));
    if (!unique.length) return recipes.map(({ slot, recipe }) => ({ id: `prep-${slot.day}-${slot.meal}-${slot.recipeId}`, title: `Préparer et peser les ingrédients de ${recipe!.name}`, detail: "Suivre les quantités de la fiche recette." }));
    return unique.map((ingredient) => ({ id: `cut-${ingredient.toLocaleLowerCase("fr")}`, title: ingredient, detail: "Laver et découper si nécessaire, puis placer dans un récipient propre." }));
  }, [recipes]);
  const cookTasks: Task[] = recipes.map(({ slot, recipe }, index) => {
    const cookMinutes = minutes(recipe?.timeCook);
    const cookingStep = addIngredientQuantities(recipe?.steps.find((step) => /cuire|cuisson|mijot|four|poêle|poele|casserole|bouillir|rôtir|rotir|chauffer|feu/i.test(step)), recipe?.ingredients);
    const timer = cookMinutes > 0 ? `Lancer le minuteur · ${cookMinutes} min` : "Durée non renseignée — vérifier la fiche avant de démarrer";
    return {
      id: `cook-${slot.day}-${slot.meal}-${slot.recipeId}`,
      title: `Feu ${index + 1} — ${recipe?.name || slot.name}`,
      timer,
      timerMinutes: cookMinutes > 0 ? cookMinutes : undefined,
      detail: [cookingStep, recipe?.robot?.length ? `Option Monsieur Cuisine : ${recipe.robot.join(" → ")}` : ""].filter(Boolean).join(" "),
      group: "Cuissons en parallèle",
    };
  });
  const assemblyTasks: Task[] = recipes.map(({ slot, recipe }) => ({
    id: `assembly-${slot.day}-${slot.meal}-${slot.recipeId}`,
    title: `Assembler et étiqueter — ${recipe!.name}`,
    detail: `${prettyDay(slot.day)} soir : répartir en portions dans des contenants propres et fermés. Refroidir rapidement. Si le repas n'est pas prévu dans les 3 jours, congeler dès refroidissement et décongeler au réfrigérateur. Réfrigérateur : 3 jours maximum.`,
    group: `${prettyDay(slot.day)} · ${slot.meal}`,
  }));
  const combinedPrepTasks = [...prepTasks, ...existingPrepTasks];
  const combinedCookTasks = [...cookTasks, ...existingCookTasks];
  const combinedAssemblyTasks = [...assemblyTasks, ...existingStorageTasks];
  const tasks = [...combinedPrepTasks, ...combinedCookTasks, ...combinedAssemblyTasks];
  const done = tasks.filter((task) => checked[task.id]).length;
  const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const prepMinutes = recipes.reduce((sum, entry) => sum + minutes(entry.recipe?.timePrep), 0);
  const cookMinutes = recipes.reduce((sum, entry) => Math.max(sum, minutes(entry.recipe?.timeCook)), 0);
  const totalMinutes = prepMinutes + cookMinutes;
  const separateMinutes = recipes.reduce((sum, entry) => sum + minutes(entry.recipe?.timePrep) + minutes(entry.recipe?.timeCook), 0);
  const savedMinutes = Math.max(0, separateMinutes - totalMinutes);
  const currentVoiceTask = tasks[Math.min(voiceIndex, Math.max(0, tasks.length - 1))];

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (!Object.values(activeTimers).some((seconds) => seconds > 0)) return;
    const interval = window.setInterval(() => {
      setActiveTimers((current) => {
        const next = { ...current };
        for (const id of Object.keys(next)) {
          if (next[id] > 0) next[id] -= 1;
          if (next[id] <= 0) {
            delete next[id];
            if ("speechSynthesis" in window) {
              const utterance = new SpeechSynthesisUtterance("Le minuteur est terminé.");
              utterance.lang = "fr-FR";
              window.speechSynthesis.speak(utterance);
            }
          }
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [activeTimers]);

  const toggle = (id: string) => setChecked((previous) => ({ ...previous, [id]: !previous[id] }));

  function taskList(items: Task[]) {
    if (!items.length) return <p className="rounded-xl bg-[#F9F9F7] p-3 text-sm text-[#555551]">Aucune tâche disponible à partir des fiches de cette semaine.</p>;
    return <ul className="space-y-2">{items.map((task) => {
      const displayTitle = adaptNutFreeText(adaptLactoseFreeText(adaptGlutenFreeText(task.title, Boolean(preferences.sansGluten)), Boolean(preferences.sansLactose || (preferences as PlanningPreferences & { isLactoseFree?: boolean }).isLactoseFree)), Boolean((preferences as PlanningPreferences & { isNutFree?: boolean; sansFruitsCoque?: boolean }).isNutFree || (preferences as PlanningPreferences & { sansFruitsCoque?: boolean }).sansFruitsCoque));
      const displayDetail = task.detail ? adaptNutFreeText(adaptLactoseFreeText(adaptGlutenFreeText(task.detail, Boolean(preferences.sansGluten)), Boolean(preferences.sansLactose || (preferences as PlanningPreferences & { isLactoseFree?: boolean }).isLactoseFree)), Boolean((preferences as PlanningPreferences & { isNutFree?: boolean; sansFruitsCoque?: boolean }).isNutFree || (preferences as PlanningPreferences & { sansFruitsCoque?: boolean }).sansFruitsCoque)) : undefined;
      const displayGroup = task.group ? adaptNutFreeText(adaptLactoseFreeText(adaptGlutenFreeText(task.group, Boolean(preferences.sansGluten)), Boolean(preferences.sansLactose || (preferences as PlanningPreferences & { isLactoseFree?: boolean }).isLactoseFree)), Boolean((preferences as PlanningPreferences & { isNutFree?: boolean; sansFruitsCoque?: boolean }).isNutFree || (preferences as PlanningPreferences & { sansFruitsCoque?: boolean }).sansFruitsCoque)) : undefined;
      return (
      <li key={task.id} className={checked[task.id] ? "rounded-xl border border-[#8FA89B]/40 bg-[#8FA89B]/10" : "rounded-xl border border-[#E9E9E4] bg-white"}>
        {displayGroup ? <p className="rounded-t-xl bg-[#E6DFD3] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#2B2B2B]">{displayGroup}</p> : null}
        <label className="flex cursor-pointer items-start gap-3 p-3">
          <input type="checkbox" className="mt-1 size-6 shrink-0 accent-[#8FA89B]" checked={Boolean(checked[task.id])} onChange={() => toggle(task.id)} />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ${kindStyle(`${displayTitle} ${displayDetail || ""}`).classes}`}>{taskIcon(`${displayTitle} ${displayDetail || ""}`)}</span>
              <span className={checked[task.id] ? "font-semibold text-[#668775] line-through" : "font-semibold text-[#2B2B2B]"}>{displayTitle}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${kindStyle(`${displayTitle} ${displayDetail || ""}`).classes}`}><span aria-hidden="true" className="size-2 rounded-full bg-current" />{kindStyle(`${displayTitle} ${displayDetail || ""}`).label}</span>
            </span>
            {task.timer ? <span className="mt-2 flex flex-wrap items-center gap-2"><button type="button" disabled={!task.timerMinutes} onClick={() => setActiveTimers((current) => ({ ...current, [task.id]: (task.timerMinutes || 0) * 60 }))} className="inline-flex rounded-lg bg-[#D98A6C]/15 px-3 py-2 text-sm font-extrabold text-[#8C4C34] disabled:cursor-not-allowed disabled:opacity-50">⏱ {activeTimers[task.id] !== undefined ? "Redémarrer" : task.timer}</button>{activeTimers[task.id] !== undefined ? <><span role="timer" aria-live="off" className="rounded-lg bg-[#FBE3DF] px-3 py-2 font-mono text-sm font-extrabold text-[#A63D35]">{Math.floor(activeTimers[task.id] / 60)}:{String(activeTimers[task.id] % 60).padStart(2, "0")}</span><button type="button" onClick={() => setActiveTimers((current) => { const next = { ...current }; delete next[task.id]; return next; })} className="rounded-lg border border-[#E7AAA2] px-3 py-2 text-xs font-bold text-[#A63D35]">Réinitialiser</button></> : null}</span> : null}
            {displayDetail ? <span className="mt-2 block text-sm leading-relaxed text-[#555551]">{displayDetail}</span> : null}
          </span>
        </label>
        <div className="flex justify-end px-3 pb-3"><button type="button" onClick={() => { const index = tasks.findIndex((candidate) => candidate.id === task.id); if (index >= 0) { setVoiceIndex(index); setVoiceStatus(`Étape sélectionnée : ${task.title}`); speak(`${task.title}. ${task.detail || ""}`); } }} className="rounded-lg bg-[#176B5B] px-4 py-2 text-xs font-extrabold text-white">Préparer</button></div>
      </li>
    ); })}</ul>;
  }

  const weekRangeLabel = (weekNumber: number) => {
    const jan4 = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 4));
    const monday = new Date(jan4);
    monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (weekNumber - 1) * 7);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const fmt = (date: Date) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", timeZone: "UTC" }).format(date).toLocaleUpperCase("fr-FR");
    return `${fmt(monday)} - ${fmt(sunday)} (SEM ${weekNumber})`;
  };
  const currentStep = currentVoiceTask;
  return (
    <main className="min-h-dvh bg-transparent px-3 pb-28 pt-3 text-[#243B35] sm:px-5 sm:pb-28">
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <GlutenFreeSafetyNotice />
        <LactoseFreeSafetyNotice />
        <NutFreeSafetyNotice />

        <header className="sticky top-0 z-30 -mx-3 space-y-3 border-b border-[#C8DDD5] bg-[#EAF5F1]/95 px-3 pb-3 pt-2 backdrop-blur-md sm:-mx-5 sm:px-5">
          <div className="flex justify-center"><img src={`${BASE_PATH}/logo-cuisine-chic-ouf-v3.png`} alt="Cuisine Chic Ouf !" className="h-auto w-28 rounded-xl sm:w-32" /></div>
          <h1 className="text-center font-heading text-2xl font-extrabold tracking-wide text-[#176B5B] sm:text-3xl">MON BATCH COOKING</h1>
          <div className="mx-auto flex max-w-lg items-center justify-between gap-2 rounded-full border border-[#D9E8E2] bg-white px-2 py-1 shadow-sm">
            <a href={week > 1 ? `?w=${week - 1}&manual=1` : "#"} aria-label="Semaine précédente" onClick={(event) => { if (week <= 1) event.preventDefault(); }} className={`flex size-9 shrink-0 items-center justify-center rounded-full ${week > 1 ? "text-[#176B5B] hover:bg-[#EAF5F1]" : "text-gray-300"}`}><ChevronLeft className="size-5" /></a>
            <div className="min-w-0 text-center"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#668078]">Votre planning de la semaine</p><p className="truncate text-xs font-extrabold text-[#176B5B] sm:text-sm">{weekRangeLabel(week)}</p></div>
            <a href={week < 52 ? `?w=${week + 1}&manual=1` : "#"} aria-label="Semaine suivante" onClick={(event) => { if (week >= 52) event.preventDefault(); }} className={`flex size-9 shrink-0 items-center justify-center rounded-full ${week < 52 ? "text-[#176B5B] hover:bg-[#EAF5F1]" : "text-gray-300"}`}><ChevronRight className="size-5" /></a>
          </div>
          <div className="rounded-2xl border border-[#C8DDD5] bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] font-extrabold uppercase tracking-wide text-[#45645A] sm:text-xs"><span>Temps total estimé : {durationLabel(totalMinutes)}</span><span>Étapes validées : {done}/{tasks.length}</span></div>
            <div className="mt-2 flex items-center gap-3"><div role="progressbar" aria-label="Progression du batch cooking" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-3.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E3EEE9]"><div className="h-full rounded-full bg-[#197765] transition-all duration-300" style={{ width: `${progress}%` }} /></div><span className="w-10 text-right text-sm font-extrabold text-[#176B5B]">{progress}%</span></div>
          </div>
          {robotPriority ? <p className="rounded-xl border border-[#9AC7B8] bg-white p-3 text-sm font-bold text-[#176B5B]">🤖 Monsieur Cuisine activé : les réglages des fiches sont affichés en priorité.</p> : null}
        </header>

        <section aria-labelledby="handsfree-title" className="space-y-4 rounded-3xl border border-[#C8DDD5] bg-white p-4 shadow-sm sm:p-5">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#197765]">SECTION 1</p><h2 id="handsfree-title" className="mt-1 font-heading text-xl font-extrabold text-[#176B5B] sm:text-2xl">EN CUISINE</h2><p className="mt-1 text-xs leading-relaxed text-[#557067]">Les mêmes commandes que dans les fiches recettes : précédent, lecture/pause, suivant et commandes vocales.</p></div>
          <RecipeHandsFree
            steps={tasks.map((task) => [task.title, task.detail, task.timer].filter(Boolean).join(". "))}
            currentIndex={voiceIndex}
            onIndexChange={setVoiceIndex}
            onStepComplete={(index) => {
              const task = tasks[index];
              if (task) setChecked((previous) => ({ ...previous, [task.id]: true }));
            }}
          />
          <div className="rounded-2xl border border-[#B7D2C8] bg-[#F8FCFA] p-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#197765]">ÉTAPE {tasks.length ? Math.min(voiceIndex + 1, tasks.length) : 0}/{tasks.length}</p>
            {currentStep ? <><div className="mt-2 flex items-start gap-3"><span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ${kindStyle(`${currentStep.title} ${currentStep.detail || ""}`).classes}`}>{taskIcon(`${currentStep.title} ${currentStep.detail || ""}`)}</span><div className="min-w-0"><p className="font-extrabold leading-relaxed text-[#243B35]">{adaptNutFreeText(adaptLactoseFreeText(adaptGlutenFreeText(currentStep.title, Boolean(preferences.sansGluten)), Boolean(preferences.sansLactose || (preferences as PlanningPreferences & { isLactoseFree?: boolean }).isLactoseFree)), Boolean((preferences as PlanningPreferences & { isNutFree?: boolean; sansFruitsCoque?: boolean }).isNutFree || (preferences as PlanningPreferences & { sansFruitsCoque?: boolean }).sansFruitsCoque))}</p>{currentStep.detail ? <p className="mt-2 text-sm leading-relaxed text-[#557067]">{currentStep.detail}</p> : null}{currentStep.timer ? <button type="button" disabled={!currentStep.timerMinutes} onClick={() => setActiveTimers((current) => ({ ...current, [currentStep.id]: (currentStep.timerMinutes || 0) * 60 }))} className="mt-3 rounded-xl bg-[#FFF1C9] px-3 py-2 text-sm font-extrabold text-[#80600A] disabled:opacity-50">⏱ {currentStep.timer}</button> : null}{activeTimers[currentStep.id] !== undefined ? <p role="timer" className="mt-2 font-mono text-lg font-extrabold text-[#176B5B]">{Math.floor(activeTimers[currentStep.id] / 60)}:{String(activeTimers[currentStep.id] % 60).padStart(2, "0")}</p> : null}<p aria-live="polite" className="mt-3 text-xs font-semibold text-[#557067]">{voiceStatus}</p></div></div><button type="button" onClick={() => toggle(currentStep.id)} className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-extrabold ${checked[currentStep.id] ? "bg-[#E3EEE9] text-[#176B5B]" : "bg-[#176B5B] text-white"}`}>{checked[currentStep.id] ? "✓ ÉTAPE VALIDÉE — ANNULER" : "✓ VALIDER CETTE ÉTAPE"}</button></> : <p className="text-sm text-[#557067]">Aucune tâche disponible à partir des fiches de cette semaine.</p>}
          </div>
        </section>

        <details className="overflow-hidden rounded-3xl border border-[#C8DDD5] bg-white shadow-sm" open><summary className="cursor-pointer list-none bg-[#176B5B] px-4 py-4 text-base font-extrabold text-white marker:hidden sm:px-5">SECTION 2 : LE FIL CONDUCTEUR EN PARALLÈLE <span className="float-right">⌄</span></summary><div className="space-y-5 p-4 sm:p-5">
          <div id="etape-decoupes" className="space-y-3"><div><h3 className="font-heading text-lg font-extrabold text-[#176B5B]">ÉTAPE 1 — LES DÉCOUPES</h3><p className="text-sm text-[#557067]">Préparez les ingrédients en une seule fois. Cochez chaque tâche ou touchez « Préparer » pour l’afficher dans la section cuisine.</p></div>{taskList(combinedPrepTasks)}</div>
          <div className="border-t border-[#DCEAE4] pt-4"><div className="mb-3"><h3 className="font-heading text-lg font-extrabold text-[#176B5B]">ÉTAPE 2 — LES CUISSONS MULTI-FEUX + TIMERS</h3><p className="text-sm text-[#557067]">Lancez les cuissons compatibles en parallèle et utilisez les minuteurs des fiches.</p></div>{taskList(combinedCookTasks)}</div>
          <div className="border-t border-[#DCEAE4] pt-4"><div className="mb-3"><h3 className="font-heading text-lg font-extrabold text-[#176B5B]">ÉTAPE 3 — L’ASSEMBLAGE / STOCKAGE</h3><p className="text-sm text-[#557067]">Répartissez les portions, fermez et étiquetez les contenants. Réfrigérateur : 3 jours maximum ; congelez les portions destinées à plus tard.</p></div>{taskList(combinedAssemblyTasks)}</div>
        </div></details>

        <details className="overflow-hidden rounded-3xl border border-[#C8DDD5] bg-white shadow-sm"><summary className="cursor-pointer list-none bg-[#176B5B] px-4 py-4 text-base font-extrabold text-white marker:hidden sm:px-5">SECTION 3 : LA VICTOIRE 🏆 <span className="float-right">⌄</span></summary><div className="space-y-4 p-4 sm:p-5">
          {progress === 100 && tasks.length > 0 ? <p className="text-base font-extrabold leading-relaxed text-[#176B5B]">Bravo ! Vous avez terminé la session et économisé {durationLabel(savedMinutes)} ! 🎉</p> : <p className="text-sm font-bold leading-relaxed text-[#243B35]">Il reste {tasks.length - done} étape(s) pour terminer votre session. Temps gagné estimé une fois la session terminée : {durationLabel(savedMinutes)}.</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#EAF5F1] p-3"><p className="text-xs font-bold text-[#557067]">Préparation groupée</p><p className="mt-1 text-lg font-extrabold text-[#176B5B]">{durationLabel(totalMinutes)}</p></div><div className="rounded-2xl bg-[#EAF5F1] p-3"><p className="text-xs font-bold text-[#557067]">Préparations séparées</p><p className="mt-1 text-lg font-extrabold text-[#176B5B]">{durationLabel(separateMinutes)}</p></div></div>
          <p className="text-xs leading-relaxed text-[#557067]">Le gain est une estimation calculée à partir des durées présentes dans les fiches de recettes.</p>
          <div className="border-t border-[#DCEAE4] pt-4"><h3 className="font-heading text-lg font-extrabold text-[#176B5B]">RECETTES UTILISÉES POUR CETTE SESSION</h3>{recipes.length ? <>
            <ul className="mt-3 space-y-2">{recipes.map(({ slot, recipe }) => <li key={slot.day + "-" + slot.meal + "-" + slot.recipeId} className="rounded-xl bg-[#F4FAF7] p-3"><p className="font-bold text-[#243B35]">{prettyDay(slot.day)} SOIR : {recipe!.name}</p><p className="mt-1 text-xs text-[#557067]">Préparation : {recipe!.timePrep || "non renseignée"} · Cuisson : {recipe!.timeCook || "non renseignée"}{recipe!.servings ? " · " + recipe!.servings : ""}</p></li>)}</ul>
            {householdServings < 4 ? <div className="mt-3 rounded-xl border border-[#D8C7A8] bg-[#FFF8E9] p-3"><p className="text-sm font-bold text-[#6B4E20]">Congélateur virtuel — portions adaptées à votre foyer ({householdServings} personne{householdServings > 1 ? "s" : ""})</p><div className="mt-2 flex flex-wrap gap-2">{recipes.map(({ recipe }) => {
              const baseServings = Number.parseInt(recipe!.servings || "4", 10) || 4;
              const portions = Math.max(1, baseServings * 2 - householdServings);
              const availableWeek = ((week - 1 + 3) % 52) + 1;
              return <button key={recipe!.id} type="button" onClick={() => {
                saveFrozenMeal({ recipeId: recipe!.id, recipeName: recipe!.name, portions, preparedWeek: week });
                setFreezerItems(readVirtualFreezer());
                setVoiceStatus("Portions de " + recipe!.name + " enregistrées pour la semaine " + availableWeek + ".");
              }} className="rounded-xl bg-[#E6DFD3] px-3 py-2 text-left text-xs font-extrabold text-[#5D4B32]">Cuisiner en double et congeler {portions} portions · {recipe!.name}</button>;
            })}</div><p className="mt-2 text-xs text-[#6B4E20]">Les portions seront proposées automatiquement trois semaines plus tard et leurs ingrédients ne seront pas ajoutés aux courses de cette semaine-là.</p></div> : null}
          </> : <p className="mt-2 text-sm text-[#557067]">Aucune fiche repas disponible pour les bases prévues cette semaine.</p>}
          {freezerItems.some((item) => item.status !== "used") ? <div className="mt-4 rounded-xl border border-[#B9D7CC] bg-[#EDF7F2] p-3"><h4 className="font-bold text-[#176B5B]">Votre congélateur virtuel</h4><ul className="mt-2 space-y-2">{freezerItems.filter((item) => item.status !== "used").map((item) => <li key={item.id} className="rounded-lg bg-white p-3"><p className="text-sm font-bold">{item.recipeName} — {item.portions} portion(s)</p><p className="mt-1 text-xs text-[#557067]">{item.status === "scheduled" ? "Planifié semaine " + item.scheduledWeek + ", " + (item.scheduledDay || "") + " soir" : "Disponible semaine " + item.availableWeek}</p><div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => { markFrozenMealUsed(item.id); setFreezerItems(readVirtualFreezer()); }} className="rounded-lg bg-[#176B5B] px-3 py-2 text-xs font-bold text-white">Marquer consommé</button><button type="button" onClick={() => { rescheduleFrozenMeal(item.id, week >= 52 ? 1 : week + 1); setFreezerItems(readVirtualFreezer()); }} className="rounded-lg border border-[#B9D7CC] px-3 py-2 text-xs font-bold text-[#176B5B]">Replanifier</button></div></li>)}</ul></div> : null}</div>
        </div></details>
      </div>
      <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#C8DDD5] bg-white/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-md"><div className="mx-auto grid max-w-4xl grid-cols-2 gap-3"><a href="../courses/" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#B7D2C8] bg-white px-3 py-2 text-xs font-extrabold text-[#176B5B] shadow-sm sm:text-sm"><ShoppingCart className="size-4" /> MA LISTE DE COURSES</a><a href="./" aria-current="page" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#176B5B] px-3 py-2 text-xs font-extrabold text-white shadow-sm sm:text-sm"><ChefHat className="size-4" /> MON BATCH COOKING</a></div></nav>
    </main>
  );
}
