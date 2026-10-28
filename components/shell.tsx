"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { CalendarDays, CookingPot, ShoppingCart, UtensilsCrossed, UserRound, Heart, Refrigerator } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { MealReminders } from "@/components/meal-reminders";
import { BASE_PATH } from "@/lib/base-path";

const NAV = [
  { href: "/semaine", label: "Semaine", icon: CalendarDays, color: "#203552", activeText: "#FFFFFF" },
  { href: "/recettes", label: "Recettes", icon: UtensilsCrossed, color: "#D6B86A", activeText: "#302400" },
  { href: "/courses", label: "Courses", icon: ShoppingCart, color: "#83D6B0", activeText: "#173C2C" },
  { href: "/batch", label: "Batch", icon: CookingPot, color: "#F05B4E", activeText: "#FFFFFF" },
  { href: "/frigo-magique", label: "Frigo", icon: Refrigerator, color: "#8FA89B", activeText: "#173C2C" },
  { href: "/mes-recettes?tab=favoris", label: "Mes favoris", icon: Heart, color: "#E32636", activeText: "#FFFFFF" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [weekQuery, setWeekQuery] = useState("");

  useEffect(() => {
    const refreshWeek = () => {
      const week = new URLSearchParams(window.location.search).get("w");
      setWeekQuery(week ? `?w=${encodeURIComponent(week)}` : "");
    };
    refreshWeek();
    window.addEventListener("popstate", refreshWeek);
    return () => window.removeEventListener("popstate", refreshWeek);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col bg-transparent">
      <header className="sticky top-0 z-40 border-b border-[#E9E9E4] bg-white/35 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
          <Link href="/" aria-label="CUISINE CHIC OUF !">
            <img src={`${BASE_PATH}/logo-cuisine-chic-ouf-v3.png`} alt="Logo officiel CUISINE CHIC OUF !" className="block h-12 w-auto max-w-[200px] rounded-[14px] bg-[#F9F6EC] object-contain drop-shadow-[0_2px_6px_rgba(43,43,43,0.07)]" loading="eager" fetchPriority="high" />
          </Link>
          <Link
            href="/compte"
            aria-label="Mon compte"
            aria-current={pathname.startsWith("/compte") ? "page" : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold shadow-sm transition hover:brightness-95 sm:text-sm ${pathname.startsWith("/compte") ? "border-[#668775] bg-[#8FA89B] text-[#173C2C]" : "border-[#E9E9E4] bg-white/80 text-[#38534B]"}`}
          >
            <UserRound className="size-4 shrink-0" />
            <span>Mon compte</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-6">
        <Suspense fallback={null}><BackButton /></Suspense>
        <Suspense fallback={<div className="rounded-xl bg-white/70 p-4 text-sm text-[#214E4B]">Chargement de la page…</div>}>
          {children}
        </Suspense>
        <div className="mt-6"><MealReminders visible={pathname === "/semaine" || pathname === "/"} /></div>
        <div className="mt-10 border-t border-[#E9E9E4] pt-5 text-center">
          <Link href="/notre-histoire" className="text-sm font-semibold text-[#668775] underline decoration-[#8FA89B]/50 underline-offset-4">Notre Histoire — pourquoi Cuisine Chic Ouf ?</Link>
        </div>
      </main>
      <nav aria-label="Navigation principale" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E9E9E4] bg-[#F9F9F7]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto grid max-w-3xl grid-cols-6 gap-0.5 px-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const href = `${item.href}${item.href.startsWith("/mes-recettes") ? "" : item.href === "/recettes" ? "" : weekQuery}`;
            const active =
              item.href === "/semaine"
                ? pathname === "/" || pathname === "/semaine"
                : item.href === "/recettes"
                  ? pathname.startsWith("/recettes") || pathname.startsWith("/carnet") || pathname.startsWith("/fiche")
                  : item.href.startsWith("/mes-recettes")
                    ? pathname.startsWith("/mes-recettes")
                    : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-0.5 text-[10px] font-bold leading-tight transition-colors sm:text-xs ${active ? "shadow-sm" : "hover:bg-black/5"}`}
                style={{ backgroundColor: active ? item.color : "transparent", color: active ? item.activeText : item.color }}
              >
                <span className={`inline-flex items-center justify-center rounded-full p-1 ${active ? "bg-white/25 ring-1 ring-white/40" : ""}`}>
                  <Icon className="size-5 shrink-0 sm:size-6" style={{ color: active ? item.activeText : item.color }} />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
