"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DAYS, DAY_LABEL, breakfastForWeek, clampWeek, getRecipe, weekPlan } from "@/lib/carnet";
import { InstallApp } from "@/components/install-app";
import { WeekPicker } from "@/components/week-picker";

export default function WeekPage() {
  const search = useSearchParams();
  const requestedWeek = search.get("w");
  const [currentWeek, setCurrentWeek] = useState(1);
  useEffect(() => {
    const now = new Date();
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
  const slots = weekPlan(week);
  const breakfast = breakfastForWeek(week);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl leading-tight">Semaine du {dateRange}</h1>
        {breakfast?.title ? (
          <p className="mt-1 text-sm text-muted-foreground">{breakfast.title.replace(/^SEMAINE \d+\s+[—–-]\s+/i, "")}</p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Clique un plat pour ouvrir sa fiche.</p>
        )}
      </div>
      <InstallApp />
      <WeekPicker week={week} path="/semaine" />
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
      <div className="space-y-3">
        {DAYS.map((day) => {
          const midi = slots.find((s) => s.day === day && s.meal === "Midi");
          const soir = slots.find((s) => s.day === day && s.meal === "Soir");
          return (
            <section key={day} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
              <h2 className="mb-2 font-heading text-lg">{DAY_LABEL[day]}</h2>
              <MealRow week={week} label="Midi" slot={midi} />
              <MealRow week={week} label="Soir" slot={soir} />
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
  slot,
}: {
  week: number;
  label: string;
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
    </div>
  );
}
