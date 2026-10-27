"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, House, CalendarDays, ShoppingBasket, UserRound, Repeat2, Leaf, Flame, Boxes, ShoppingCart } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import { DAYS, DAY_LABEL, breakfastForWeek, clampWeek, currentIsoWeek, getRecipe, seasonLabel, weekPlan, type PlanningPreferences } from "@/lib/carnet";
import { MealReminders } from "@/components/meal-reminders";
import { SwitchMeal } from "@/components/switch-meal";

const TURQUOISE = "#4A9290";
const SOS_CORAL = "#F2A08F";
const FALLBACK_MEAL_IMAGE = "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=240&q=80";
const DAY_COLORS: Record<string, string> = { Lundi: "#F28C28", Mardi: "#E85D4A", Mercredi: "#8FAF9B", Jeudi: "#7C5CBF", Vendredi: "#F0B429", Samedi: "#E879A9", Dimanche: "#4A9290" };

function dateForIsoWeek(week: number) {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (date: Date) => date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  return `${fmt(monday)} au ${fmt(sunday)}`;
}

export default function WeekPage() {
  const search = useSearchParams();
  const [currentWeek, setCurrentWeek] = useState(() => currentIsoWeek());
  const [openDay, setOpenDay] = useState<string>("Lundi");
  const [recipeOverrides, setRecipeOverrides] = useState<Record<string, string>>({});
  const [preferences, setPreferences] = useState<PlanningPreferences>({});
  const [showSosIdeas, setShowSosIdeas] = useState(false);

  useEffect(() => {
    const refresh = () => {
      try { setRecipeOverrides(JSON.parse(localStorage.getItem("cuisine-chic-ouf-recipe-switches") || "{}")); } catch { setRecipeOverrides({}); }
      try { setPreferences(JSON.parse(localStorage.getItem("cuisine-chic-ouf-preferences") || "{}")); } catch { setPreferences({}); }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cuisine-chic-ouf-plan-change", refresh);
    window.addEventListener("cuisine-chic-ouf-preferences-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("cuisine-chic-ouf-plan-change", refresh);
      window.removeEventListener("cuisine-chic-ouf-preferences-change", refresh);
    };
  }, []);

  useEffect(() => {
    const refreshWeek = () => setCurrentWeek(currentIsoWeek());
    refreshWeek();
    const interval = window.setInterval(refreshWeek, 60_000);
    window.addEventListener("focus", refreshWeek);
    document.addEventListener("visibilitychange", refreshWeek);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWeek);
      document.removeEventListener("visibilitychange", refreshWeek);
    };
  }, []);

  const requestedWeek = search.get("w");
  const week = requestedWeek && search.get("manual") === "1" ? clampWeek(requestedWeek) : currentWeek;
  const slots = weekPlan(week, recipeOverrides, preferences);
  const dateRange = dateForIsoWeek(week);
  const season = seasonLabel(week);
  const previousWeek = Math.max(1, week - 1);
  const nextWeek = Math.min(52, week + 1);
  const breakfast = breakfastForWeek(week);
  const validatedSlotCount = slots.filter((slot) => Boolean(slot.recipeId)).length;
  const activeProfiles = [preferences.etudiant && "Étudiant", preferences.vegan && "Végan", preferences.vegetarien && "Végétarien", preferences.sansGluten && "Sans gluten", preferences.sansLactose && "Sans lactose", preferences.sansFruitsCoque && "Sans fruits à coque"].filter(Boolean);

  return (
    <main
      className="min-h-dvh w-full overflow-x-hidden bg-transparent pb-28 text-[#2B2B2B]"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
        <header className="text-center">
          <img src={`${BASE_PATH}/logo-cuisine-chic-ouf-v3.png`} alt="CUISINE CHIC OUF !" className="mx-auto mb-4 block h-auto w-[min(48vw,190px)] rounded-[20px] bg-[#F9F6EC] object-contain shadow-[0_8px_24px_rgba(0,0,0,0.2)]" loading="eager" />
          <div className="flex items-center justify-between gap-2">
            <button type="button" aria-label="Semaine précédente" disabled={week <= 1} onClick={() => { window.location.href = `/semaine?w=${previousWeek}&manual=1`; }} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/75 text-[#214E4B] shadow-sm transition hover:bg-white disabled:opacity-30"><ChevronLeft className="size-5" /></button>
            <h1 className="flex-1 text-xl font-black uppercase leading-tight tracking-tight text-[#2B2B2B] sm:text-3xl">Semaine du {dateRange}</h1>
            <button type="button" aria-label="Semaine suivante" disabled={week >= 52} onClick={() => { window.location.href = `/semaine?w=${nextWeek}&manual=1`; }} className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/75 text-[#214E4B] shadow-sm transition hover:bg-white disabled:opacity-30"><ChevronRight className="size-5" /></button>
          </div>
          <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#2B2B2B]/20 bg-white/60 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-[#2B2B2B] shadow-sm"><Leaf className="size-4" /> Sélection {season}</span>
        </header>

        <section>
          <button type="button" aria-expanded={showSosIdeas} onClick={() => setShowSosIdeas((shown) => !shown)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-3 py-3 text-center text-sm font-black leading-snug text-white shadow-sm transition hover:brightness-105 active:scale-[0.99] sm:text-base" style={{ backgroundColor: SOS_CORAL }}><Flame className="size-6 shrink-0" /> SOS FLEMME : 3 idées simples <ChevronDown className={`size-4 shrink-0 transition-transform ${showSosIdeas ? "rotate-180" : ""}`} /></button>
          {showSosIdeas ? <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3"><Link href="/recettes?filter=express" className="rounded-xl bg-[#FFF0E8] px-3 py-3 text-center text-xs font-extrabold text-[#9D4218] sm:text-sm">⚡ EXPRESS</Link><Link href="/recettes?filter=tired" className="rounded-xl bg-[#FFF0E8] px-3 py-3 text-center text-xs font-extrabold text-[#9D4218] sm:text-sm">😮‍💨 JE SUIS FATIGUÉ</Link><Link href="/recettes?filter=easy" className="rounded-xl bg-[#FFF0E8] px-3 py-3 text-center text-xs font-extrabold text-[#9D4218] sm:text-sm">🍽️ REPAS TOUT SIMPLE</Link></div> : null}
        </section>


        <aside className="rounded-2xl border border-[#2B2B2B]/15 bg-white/65 p-3 text-sm text-[#2B2B2B]"><strong>Planning vérifié :</strong> {validatedSlotCount}/{slots.length} créneaux utilisent une recette complète.{activeProfiles.length ? <span> Préférences : {activeProfiles.join(", ")}.</span> : null}</aside>
        <MealReminders />
        {breakfast && breakfast.lines.length > 0 ? <section className="rounded-2xl bg-white p-4 text-[#214E4B] shadow-sm"><h2 className="text-lg font-black">Petit-déjeuner</h2><ul className="mt-2 space-y-1 text-sm">{breakfast.lines.map((line, index) => <li key={index}>{line}</li>)}</ul></section> : null}
        <section aria-label="Planning des repas" className="space-y-2.5">
          {DAYS.map((day) => {
            const dayName = DAY_LABEL[day];
            const isOpen = openDay === day;
            const midi = slots.find((slot) => slot.day === day && slot.meal.toLowerCase() === "midi");
            const soir = slots.find((slot) => slot.day === day && slot.meal.toLowerCase() === "soir");
            return (
              <section key={day} className="overflow-hidden rounded-[20px] bg-transparent text-[#2B2B2B] shadow-[0_5px_16px_rgba(0,0,0,0.13)]">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenDay(isOpen ? "" : day)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 border-b-[5px] bg-transparent px-5 py-4 text-left transition sm:min-h-16 sm:px-6 hover:bg-transparent"
                  style={{ borderBottomColor: DAY_COLORS[day] || "#4A9290", backgroundColor: "transparent" }}
                >
                  <span className="text-left text-lg font-black uppercase tracking-[0.08em] text-[#2B2B2B] sm:text-xl">{dayName}</span>
                  <ChevronDown className={`size-5 shrink-0 text-[#4A9290] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen ? (
                  <div className="px-3 pb-2 sm:px-4">
                    <MealRow week={week} day={day} label="MIDI" slot={midi} />
                    <MealRow week={week} day={day} label="SOIR" slot={soir} />
                  </div>
                ) : null}
              </section>
            );
          })}
        </section>

        <section aria-label="Raccourcis de la semaine" className="mx-auto flex w-full max-w-2xl flex-row gap-3 pt-1"><Link href={`/courses?w=${week}&manual=1`} className="flex h-24 min-w-0 flex-1 flex-row items-center overflow-hidden rounded-2xl text-center shadow-[0_5px_14px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:brightness-105 active:scale-[0.97] sm:h-28 sm:rounded-2xl" style={{ backgroundColor: "#F5A623", color: "#183B3B" }}><img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85&v=4" alt="" loading="lazy" className="h-full w-[38%] min-w-0 object-cover" /><span className="flex min-w-0 flex-1 items-center justify-center gap-1 px-1 py-2 text-[10px] font-black sm:text-xs"><ShoppingCart className="size-4" /> MA LISTE DE COURSE</span></Link><Link href={`/batch?w=${week}&manual=1`} className="flex h-24 min-w-0 flex-1 flex-row items-center overflow-hidden rounded-2xl text-center shadow-[0_5px_14px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:brightness-105 active:scale-[0.97] sm:h-28 sm:rounded-2xl" style={{ backgroundColor: "#FFD928", color: "#183B3B" }}><img src="https://images.unsplash.com/photo-1606859191214-25806e8e2423?auto=format&fit=crop&w=900&q=85&v=8" alt="" loading="lazy" className="h-full w-[38%] min-w-0 object-cover" /><span className="flex min-w-0 flex-1 items-center justify-center gap-1 px-1 py-2 text-[10px] font-black sm:text-xs"><Boxes className="size-4" /> MON BATCH</span></Link></section>
      </div>

      <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/25 bg-[#245F5D]/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-[0_-6px_20px_rgba(0,0,0,0.16)] backdrop-blur-md">
        <div className="mx-auto grid max-w-3xl grid-cols-4 gap-1">
          <Link href="/" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-white/85 transition hover:bg-white/10" aria-label="Accueil">
            <House className="size-5" /><span className="text-[10px] font-bold sm:text-xs">Accueil</span>
          </Link>
          <Link href={`/semaine?w=${week}&manual=1`} aria-current="page" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-white/15 text-white shadow-inner" aria-label="Planning">
            <CalendarDays className="size-5" /><span className="text-[10px] font-black sm:text-xs">Planning</span>
          </Link>
          <Link href={`/courses?w=${week}`} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-white/85 transition hover:bg-white/10" aria-label="Liste de courses">
            <ShoppingBasket className="size-5" /><span className="text-[10px] font-bold sm:text-xs">Liste de courses</span>
          </Link>
          <Link href="/compte" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-white/85 transition hover:bg-white/10" aria-label="Profil">
            <UserRound className="size-5" /><span className="text-[10px] font-bold sm:text-xs">Profil</span>
          </Link>
        </div>
      </nav>
    </main>
  );
}

function MealRow({ week, day, label, slot }: {
  week: number;
  day: string;
  label: string;
  slot?: { name: string; recipeId: string | null; meal?: string };
}) {
  const recipe = getRecipe(slot?.recipeId);
  const name = slot?.name || "Repas non indiqué";
  const meal = label === "MIDI" ? "Midi" : "Soir";
  const time = [recipe?.timePrep, recipe?.timeCook].filter(Boolean).join(" + ") || "Temps variable";
  return (
    <div className="flex items-center gap-3 border-b border-[#EEF1EF] py-3 last:border-b-0">
      {recipe?.image ? (
        <img src={recipe.image} alt="" loading="lazy" className="size-[68px] shrink-0 rounded-xl object-cover sm:size-[76px]" />
      ) : (
        <img src={FALLBACK_MEAL_IMAGE} alt="" loading="lazy" className="size-[68px] shrink-0 rounded-xl object-cover sm:size-[76px]" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4A9290]">{label}</p>
        {recipe ? (
          <Link href={`/fiche/${recipe.id}?w=${week}`} className="mt-0.5 block text-sm font-extrabold leading-snug text-[#252B29] underline decoration-[#8FA89B]/70 underline-offset-2 sm:text-base">{name}</Link>
        ) : (
          <p className="mt-0.5 text-sm font-extrabold leading-snug text-[#252B29] sm:text-base">{name}</p>
        )}
        <p className="mt-1 text-xs font-medium text-[#727A76]">{time}</p>
        {recipe?.imageSourceUrl ? <p className="mt-1 text-[10px] text-[#727A76]">Photo : <a href={recipe.imageSourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">{recipe.imageCredit || "Pexels"}</a> / Pexels</p> : null}
      </div>
      {slot ? <SwitchMeal slot={{ week, day, meal, name, recipeId: slot.recipeId }} /> : (
        <span className="inline-flex size-8 items-center justify-center text-[#9CA9A3]" aria-hidden><Repeat2 className="size-4" /></span>
      )}
    </div>
  );
}
