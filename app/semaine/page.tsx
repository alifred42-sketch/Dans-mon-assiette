"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DAYS, DAY_LABEL, breakfastForWeek, clampWeek, getRecipe, seasonLabel, weekPlan } from "@/lib/carnet";
import { InstallApp } from "@/components/install-app";
import { MealReminders } from "@/components/meal-reminders";
import { WeekPicker } from "@/components/week-picker";
import { SwitchMeal } from "@/components/switch-meal";

export default function WeekPage() {
  const search = useSearchParams();
  const requestedWeek = search.get("w");
  const [currentWeek, setCurrentWeek] = useState(1);
  const [weekday, setWeekday] = useState(1);
  const [recipeOverrides, setRecipeOverrides] = useState<Record<string, string>>({});
  useEffect(() => {
    const refresh = () => { try { setRecipeOverrides(JSON.parse(localStorage.getItem("cuisine-chic-ouf-recipe-switches") || "{}")); } catch { setRecipeOverrides({}); } };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cuisine-chic-ouf-plan-change", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("cuisine-chic-ouf-plan-change", refresh); };
  }, []);
  useEffect(() => {
    const now = new Date();
    setWeekday(now.getDay());
    const monday = new Date(now.getFullYear(), 0, 1);
    const day = (now.getDay() + 6) % 7;
    const thisMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    const jan4 = new Date(now.getFullYear(), 0, 4);
    const jan4Day = (jan4.getDay() + 6) % 7;
    const firstMonday = new Date(now.getFullYear(), 0, 4 - jan4Day);
    const isoWeek = Math.floor((thisMonday.getTime() - firstMonday.getTime()) / 604800000) + 1;
    setCurrentWeek(Math.min(52, Math.max(1, isoWeek)));
  }, []);
  const week = requestedWeek ? clampWeek(requestedWeek) : currentWeek;
  const mondayDate = (() => { const now = new Date(); const d = new Date(now.getFullYear(), 0, 4); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + (week - 1) * 7); return d; })();
  const sundayDate = new Date(mondayDate); sundayDate.setDate(mondayDate.getDate() + 6);
  const dateRange = `${mondayDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} au ${sundayDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
  const slots = weekPlan(week, recipeOverrides);
  const breakfast = breakfastForWeek(week);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl leading-tight">Semaine du {dateRange}</h1>\n        <p className="mt-2 inline-flex rounded-full bg-[#F3C6B1] px-3 py-1 text-sm font-semibold text-[#1A1A1A]">Menus de saison : {seasonLabel(week)}</p>
        {breakfast?.title ? (
          <p className="mt-1 text-sm text-muted-foreground">{breakfast.title.replace(/^SEMAINE \d+\s+[—–-]\s+/i, "")}</p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Clique un plat pour ouvrir sa fiche.</p>
        )}
      </div>
      <InstallApp />

      {weekday === 1 ? <aside className="rounded-2xl border border-[#8FA89B]/30 bg-[#8FA89B]/15 p-4 text-sm font-semibold leading-relaxed text-[#2B2B2B]">Bon début de semaine ! Vos repas sont prêts à être assemblés, vous avez géré.</aside> : null}
      {weekday === 3 ? <aside className="rounded-2xl border border-[#8FA89B]/30 bg-[#8FA89B]/15 p-4 text-sm font-semibold leading-relaxed text-[#2B2B2B]">Déjà le milieu de la semaine ! Une petite baisse d'énergie ? N'oubliez pas notre bouton SOS Flemme si besoin. 😉</aside> : null}
      {weekday === 5 ? <aside className="rounded-2xl border border-[#D98A6C]/30 bg-[#F3C6B1]/35 p-4 text-sm font-semibold leading-relaxed text-[#2B2B2B]">C'est vendredi ! Rangez les tupperwares du batchcooking, place à la cuisine plaisir !</aside> : null}
      {weekday === 6 ? <aside className="rounded-2xl border border-[#D98A6C]/30 bg-[#F3C6B1]/35 p-4 text-sm font-semibold leading-relaxed text-[#2B2B2B]">Week-end en mode Cuisine Chic Ouf : on se fait plaisir sans se prendre la tête.</aside> : null}
      <WeekPicker week={week} path="/semaine" />
      <MealReminders />
      {breakfast && breakfast.lines.length > 0 ? (
        <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="font-heading text-lg">Petit-déjeuner</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {breakfast.lines.map((line, i) => (
              <li key={`breakfast-${i}`}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="rounded-2xl border border-[#EADAEC] bg-[#EADAEC]/65 p-4 shadow-[0_4px_12px_rgba(43,43,43,0.07)]">
        <p className="text-base font-bold text-[#1A1A1A]">🆘 SOS Flemme : 3 idées quand on n’a pas envie de cuisiner</p>
        <p className="mt-1 text-sm leading-6 text-[#2B2B2B]">Des solutions à portée de main, juste avant le planning de la semaine.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/recettes?filter=express" className="flex min-h-16 items-center justify-center rounded-2xl bg-[#FAD2CB] px-3 py-3 text-center text-sm font-semibold text-[#1A1A1A] shadow-[0_3px_9px_rgba(43,43,43,0.10)] transition hover:-translate-y-0.5">
            ⚡ Express
          </Link>
          <Link href="/recettes?filter=tired" className="flex min-h-16 items-center justify-center rounded-2xl bg-[#EADAEC] px-3 py-3 text-center text-sm font-semibold text-[#1A1A1A] shadow-[0_3px_9px_rgba(43,43,43,0.10)] transition hover:-translate-y-0.5">
            😮‍💨 Je suis fatigué(e)
          </Link>
          <Link href="/recettes?filter=easy" className="flex min-h-16 items-center justify-center rounded-2xl bg-[#D0DBCE] px-3 py-3 text-center text-sm font-semibold text-[#1A1A1A] shadow-[0_3px_9px_rgba(43,43,43,0.10)] transition hover:-translate-y-0.5">
            🍽️ Repas tout simple
          </Link>
        </div>
      </section>
      <div className="space-y-3">
        {DAYS.map((day) => {
          const midi = slots.find((s) => s.day === day && s.meal === "Midi");
          const soir = slots.find((s) => s.day === day && s.meal === "Soir");
          return (
            <section key={day} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
              <h2 className="mb-2 font-heading text-lg">{DAY_LABEL[day]}</h2>
              <MealRow week={week} day={day} meal="Midi" label="Midi" slot={midi} />
              <MealRow week={week} day={day} meal="Soir" label="Soir" slot={soir} />
            </section>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Link
          href={`/courses?w=${week}`}
          className="flex min-h-12 items-center justify-center rounded-2xl bg-primary px-4 text-center text-base font-semibold text-primary-foreground"
        >
          Courses
        </Link>
        <Link
          href={`/batch?w=${week}`}
          className="flex min-h-12 items-center justify-center rounded-2xl bg-card px-4 text-center text-base font-semibold ring-1 ring-foreground/15"
        >
          Batch
        </Link>
      </div>
    </div>
  );
}

function MealRow({
  week,
  label,
  day,
  meal,
  slot,
}: {
  week: number;
  label: string;
  day: string;
  meal: string;
  slot?: { name: string; recipeId: string | null };
}) {
  const recipe = getRecipe(slot?.recipeId);
  const name = slot?.name || "Repas non indiqué";
  return (
    <div className="border-t border-border/60 py-3 first:border-t-0 first:pt-0">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      {recipe ? (
        <Link
          href={`/fiche/${recipe.id}?w=${week}`}
          className="mt-1 block text-base font-medium text-primary underline decoration-primary/40 underline-offset-4"
        >
          {name}
        </Link>
      ) : (
        <p className="mt-1 text-base">{name}</p>
      )}
      {slot ? <SwitchMeal slot={{ week, day, meal, name, recipeId: slot.recipeId }} /> : null}
    </div>
  );
}
