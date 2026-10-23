"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, House, CalendarDays, ShoppingBasket, UserRound, Repeat2, Leaf, Flame, Boxes, ShoppingCart } from "lucide-react";
import { BASE_PATH } from "@/lib/base-path";
import { DAYS, DAY_LABEL, clampWeek, currentIsoWeek, getRecipe, seasonLabel, weekPlan, type PlanningPreferences } from "@/lib/carnet";
import { SwitchMeal } from "@/components/switch-meal";

const TURQUOISE = "#4A9290";
const SOS_CORAL = "#EFA778";
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
    window.addEventListener("focus", refreshWeek);
    document.addEventListener("visibilitychange", refreshWeek);
    return () => {
      window.removeEventListener("focus", refreshWeek);
      document.removeEventListener("visibilitychange", refreshWeek);
    };
  }, []);

  const requestedWeek = search.get("w");
  const week = requestedWeek && search.get("manual") === "1" ? clampWeek(requestedWeek) : (requestedWeek ? clampWeek(requestedWeek) : currentWeek);
  const slots = weekPlan(week, recipeOverrides, preferences);
  const dateRange = dateForIsoWeek(week);
  const season = seasonLabel(week);
  const previousWeek = Math.max(1, week - 1);
  const nextWeek = Math.min(52, week + 1);

  return (
    <main
      className="min-h-dvh w-full overflow-x-hidden pb-28 text-white"
      style={{
        backgroundColor: TURQUOISE,
        backgroundImage: "radial-gradient(ellipse at 12% 8%, rgba(190,235,220,0.62), transparent 42%), radial-gradient(ellipse at 90% 42%, rgba(112,196,187,0.58), transparent 48%), repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 5px)",
      }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
        <header className="text-center">
          <img src={`${BASE_PATH}/logo-cuisine-chic-ouf-v3.png`} alt="CUISINE CHIC OUF !" className="mx-auto mb-4 block h-auto w-[min(48vw,190px)] rounded-[20px] bg-[#F9F6EC] object-contain shadow-[0_8px_24px_rgba(0,0,0,0.2)]" loading="eager" />
          <h1 className="text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl">Semaine du {dateRange}</h1>
          <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-sm"><Leaf className="size-4" /> Sélection {season}</span>
        </header>

        <div className="flex items-center justify-between gap-2 rounded-2xl bg-white px-2 py-2 text-[#214E4B] shadow-[0_6px_18px_rgba(0,0,0,0.14)]">
          <button
            type="button"
            aria-label="Semaine précédente"
            disabled={week <= 1}
            onClick={() => { window.location.href = `/semaine?w=${previousWeek}&manual=1`; }}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl transition hover:bg-[#EAF4F1] disabled:opacity-30"
          ><ChevronLeft className="size-6" /></button>
          <p className="text-center text-base font-black uppercase tracking-wide sm:text-lg">Semaine {week}</p>
          <button
            type="button"
            aria-label="Semaine suivante"
            disabled={week >= 52}
            onClick={() => { window.location.href = `/semaine?w=${nextWeek}&manual=1`; }}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl transition hover:bg-[#EAF4F1] disabled:opacity-30"
          ><ChevronRight className="size-6" /></button>
        </div>

        <section>
          <button type="button" aria-expanded={showSosIdeas} onClick={() => setShowSosIdeas((shown) => !shown)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-3 py-3 text-center text-sm font-black leading-snug text-white shadow-sm transition hover:brightness-105 active:scale-[0.99] sm:text-base" style={{ backgroundColor: SOS_CORAL }}><Flame className="size-6 shrink-0" /> SOS FLEMME : 3 idées simples <ChevronDown className={`size-4 shrink-0 transition-transform ${showSosIdeas ? "rotate-180" : ""}`} /></button>
          {showSosIdeas ? <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3"><Link href="/recettes?filter=express" className="rounded-xl bg-[#FFF0E8] px-3 py-3 text-center text-xs font-extrabold text-[#9D4218] sm:text-sm">⚡ EXPRESS</Link><Link href="/recettes?filter=tired" className="rounded-xl bg-[#FFF0E8] px-3 py-3 text-center text-xs font-extrabold text-[#9D4218] sm:text-sm">😮‍💨 JE SUIS FATIGUÉ</Link><Link href="/recettes?filter=easy" className="rounded-xl bg-[#FFF0E8] px-3 py-3 text-center text-xs font-extrabold text-[#9D4218] sm:text-sm">🍽️ REPAS TOUT SIMPLE</Link></div> : null}
        </section>

        <section aria-label="Planning des repas" className="space-y-2.5">
          {DAYS.map((day) => {
            const dayName = DAY_LABEL[day];
            const isOpen = openDay === day;
            const midi = slots.find((slot) => slot.day === day && slot.meal.toLowerCase() === "midi");
            const soir = slots.find((slot) => slot.day === day && slot.meal.toLowerCase() === "soir");
            return (
              <section key={day} className="overflow-hidden rounded-[20px] bg-white text-[#2B2B2B] shadow-[0_5px_16px_rgba(0,0,0,0.13)]">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenDay(isOpen ? "" : day)}
                  className={`flex min-h-14 w-full items-center justify-between gap-3 border-b-[5px] px-5 py-4 text-left transition sm:min-h-16 sm:px-6 ${isOpen ? "" : "hover:bg-[#F7FAF9]"}`}
                  style={{ borderBottomColor: DAY_COLORS[day] || "#4A9290" }}
                >
                  <span className="text-base font-black uppercase tracking-[0.08em] sm:text-lg">{dayName}</span>
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

        <section aria-label="Raccourcis de la semaine" className="mx-auto grid w-full max-w-xl grid-cols-2 gap-3 pt-1"><Link href={`/courses?w=${week}`} className="flex h-36 min-w-0 flex-col overflow-hidden rounded-2xl text-center shadow-[0_5px_14px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:brightness-105 active:scale-[0.97] sm:h-40 sm:rounded-3xl" style={{ backgroundColor: "#F5A623", color: "#183B3B" }}><img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85&v=4" alt="" loading="lazy" className="h-[58%] w-full min-h-0 object-cover" /><span className="flex min-h-0 flex-1 items-center justify-center gap-1 px-1 py-2 text-[10px] font-black sm:text-xs"><ShoppingCart className="size-4" /> MA LISTE DE COURSE</span></Link><Link href={`/batch?w=${week}`} className="flex h-36 min-w-0 flex-col overflow-hidden rounded-2xl text-center shadow-[0_5px_14px_rgba(0,0,0,0.18)] transition hover:-translate-y-1 hover:brightness-105 active:scale-[0.97] sm:h-40 sm:rounded-3xl" style={{ backgroundColor: "#FFD928", color: "#183B3B" }}><img src="https://images.unsplash.com/photo-1606859191214-25806e8e2423?auto=format&fit=crop&w=900&q=85&v=8" alt="" loading="lazy" className="h-[58%] w-full min-h-0 object-cover" /><span className="flex min-h-0 flex-1 items-center justify-center gap-1 px-1 py-2 text-[10px] font-black sm:text-xs"><Boxes className="size-4" /> MON BATCH</span></Link></section>
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
      </div>
      {slot ? <SwitchMeal slot={{ week, day, meal, name, recipeId: slot.recipeId }} /> : (
        <span className="inline-flex size-8 items-center justify-center text-[#9CA9A3]" aria-hidden><Repeat2 className="size-4" /></span>
      )}
    </div>
  );
}
