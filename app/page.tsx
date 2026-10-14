"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BASE_PATH } from "@/lib/base-path";
import { InstallApp } from "@/components/install-app";
import { UtensilsCrossed, CookingPot, ShoppingCart, Droplets, Sprout, Sparkles, Timer, Martini, PartyPopper, BatteryLow, Bot, Flower2, Sun, Leaf, Snowflake, type LucideIcon } from "lucide-react";

const categories: [string, string, string, LucideIcon][] = [
  ["Recettes", "#8FA89B", "/recettes", UtensilsCrossed],
  ["Batchcooking", "#D98A6C", "/batch", CookingPot],
  ["Courses", "#E6DFD3", "/courses", ShoppingCart],
  ["Sauces", "#F4EAD4", "/recettes?filter=sauces", Droplets],
  ["Marinades", "#EAD5C3", "/recettes?filter=marinades", Sprout],
  ["Épices", "#F2D4C9", "/recettes?filter=epices", Sparkles],
  ["Express", "#FAD2CB", "/recettes?filter=express", Timer],
  ["Apéro", "#FCD5CE", "/recettes?filter=apero", Martini],
  ["Recevoir", "#D0DBCE", "/recettes?filter=recevoir", PartyPopper],
  ["Je suis fatigué", "#EADAEC", "/recettes?filter=tired", BatteryLow],
  ["Bonus", "#E8ECEF", "/recettes?filter=bonus", Sparkles],
  ["Mr Cuisine", "#E5E7EB", "/recettes?filter=mr-cuisine", Bot],
  ["Printemps", "#E2F0D9", "/recettes?filter=printemps", Flower2],
  ["Été", "#FCE4B5", "/recettes?filter=ete", Sun],
  ["Automne", "#F3C6B1", "/recettes?filter=automne", Leaf],
  ["Hiver", "#E1EDF2", "/recettes?filter=hiver", Snowflake],
  ["🎉 Fêtes", "#FAD2CB", "/fetes", PartyPopper],
];

function getCurrentWeek() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const firstMonday = new Date(now.getFullYear(), 0, 4 - ((jan4.getDay() + 6) % 7));
  const week = Math.floor((monday.getTime() - firstMonday.getTime()) / 604800000) + 1;
  return Math.min(52, Math.max(1, week));
}

export default function HomePage() {
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    setCurrentWeek(getCurrentWeek());
  }, []);

  return (
    <main className="min-h-dvh bg-[#F9F9F7]">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-8 pb-14 text-center sm:px-8">
        <img src={`${BASE_PATH}/logo-cuisine-chic-ouf-v3.png`} alt="CUISINE CHIC OUF !" className="block h-auto w-[min(82vw,340px)] max-w-full shrink-0 rounded-[28px] bg-[#F9F6EC] object-contain drop-shadow-[0_5px_12px_rgba(43,43,43,0.10)]" loading="eager" fetchPriority="high" />
        <section className="mt-7 max-w-2xl">
          <h1 className="text-4xl font-black tracking-tight text-[#2B2B2B] sm:text-6xl">CUISINE CHIC OUF !</h1>

        </section>

        <Link
          href={`/semaine?w=${currentWeek}`}
          className="mt-8 inline-flex min-h-16 w-full max-w-md items-center justify-center rounded-[22px] bg-[#8FA89B] px-7 text-lg font-extrabold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
        >
          Sauver ma semaine !
        </Link>

        <Link
          href="/recettes?filter=tired"
          className="mt-5 flex w-full max-w-md items-center gap-4 rounded-2xl border border-[#EADAEC] bg-[#EADAEC] px-5 py-4 text-left text-[#1A1A1A] shadow-[0_4px_12px_rgba(43,43,43,0.09)] transition hover:-translate-y-0.5"
        >
          <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/70 text-2xl">🆘</span>
          <span>
            <span className="block text-base font-bold">SOS : j’ai pas le goût !</span>
            <span className="mt-1 block text-sm font-medium">Je suis fatigué ? Trouvons une recette simple, sans prise de tête.</span>
          </span>
          <span aria-hidden="true" className="ml-auto text-xl font-bold">›</span>
        </Link>

        <section className="mt-12 w-full">
          <div className="mb-5 text-left">
            <h2 className="text-2xl font-extrabold text-[#2B2B2B]">Tout est là pour vous simplifier la vie</h2>
            <p className="mt-1 text-sm text-[#6B6B67]">Choisissez votre envie du moment.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map(([label, color, href, Icon]) => {
              const destination = href.startsWith("/batch") || href.startsWith("/courses")
                ? `${href}?w=${currentWeek}`
                : href;
              return (
                <Link
                  key={label}
                  href={destination}
                  style={{ backgroundColor: color }}
                  className="flex min-h-24 items-center justify-center rounded-2xl px-3 py-4 text-center text-sm font-bold text-[#1A1A1A] shadow-[0_4px_12px_rgba(43,43,43,0.09)] transition hover:-translate-y-0.5"
                >
                  <span className="flex flex-col items-center gap-2"><Icon aria-hidden="true" className="size-6 stroke-[1.6]" />{label}</span>
                </Link>
              );
            })}
          </div>
        </section>
        <div className="mt-8 w-full max-w-md text-left"><InstallApp /></div>
      </div>
    </main>
  );
}
