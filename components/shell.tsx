"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, CookingPot, ShoppingCart, UtensilsCrossed } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { MealReminders } from "@/components/meal-reminders";
import { BASE_PATH } from "@/lib/base-path";

const NAV = [
  { href: "/semaine", label: "Semaine", icon: CalendarDays },
  { href: "/courses", label: "Courses", icon: ShoppingCart },
  { href: "/batch", label: "Batch", icon: CookingPot },
  { href: "/recettes", label: "Recettes", icon: UtensilsCrossed },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [showSplash, setShowSplash] = useState(false);
  useEffect(() => {
    // Affiche le splash uniquement lors de la toute première ouverture sur cet appareil.
    // La clé persistante empêche son retour lors des navigations et des visites suivantes.
    try {
      const seen = window.localStorage.getItem("cuisine-chic-ouf-splash-seen");
      if (seen) return;
      window.localStorage.setItem("cuisine-chic-ouf-splash-seen", "1");
      setShowSplash(true);
      const timer = window.setTimeout(() => setShowSplash(false), 3000);
      return () => window.clearTimeout(timer);
    } catch {
      // Si le stockage est indisponible, ne bloque jamais la navigation avec le splash.
      setShowSplash(false);
    }
  }, []);
  const week = search.get("w");
  const weekQuery = week ? `?w=${week}` : "";

  return (
    <div className="flex min-h-dvh flex-col bg-[#F9F9F7]">
      {showSplash ? <div className={`splash-screen fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#F9F9F7] px-6 py-8 text-center ${showSplash ? "splash-screen-visible" : "splash-screen-hidden"}`} role="status" aria-label="Cuisine Chic Ouf, chargement"><img src={`${BASE_PATH}/logo-cuisine-chic-ouf.png`} alt="Logo officiel CUISINE CHIC OUF !" className="block h-auto w-[min(86vw,560px)] max-w-full shrink-0 object-contain drop-shadow-[0_5px_14px_rgba(43,43,43,0.08)]" loading="eager" fetchPriority="high" /><p className="max-w-xl text-base font-normal leading-7 text-[#2B2B2B] sm:text-xl sm:leading-8">Pas de panique, on mange quoi ce soir ? 52 semaines de menus, du batchcooking simple et vos listes de courses automatisées. Cuisinez chic, respirez... OUF !</p></div> : null}
      <header className="sticky top-0 z-40 border-b border-[#E9E9E4] bg-[#F9F9F7]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-center px-4">
          <Link href="/" aria-label="CUISINE CHIC OUF !">
            <img src={`${BASE_PATH}/logo-cuisine-chic-ouf.png`} alt="Logo officiel CUISINE CHIC OUF !" className="block h-auto w-[min(54vw,260px)] max-w-full object-contain drop-shadow-[0_2px_6px_rgba(43,43,43,0.07)]" loading="eager" fetchPriority="high" />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-6"><BackButton />{children}<div className="mt-6"><MealReminders visible={pathname === "/semaine" || pathname === "/"} /></div><div className="mt-10 border-t border-[#E9E9E4] pt-5 text-center"><Link href="/notre-histoire" className="text-sm font-semibold text-[#668775] underline decoration-[#8FA89B]/50 underline-offset-4">Notre Histoire — pourquoi Cuisine Chic Ouf ?</Link></div></main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E9E9E4] bg-[#F9F9F7]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const href = `${item.href}${item.href === "/recettes" ? "" : weekQuery}`;
            const active =
              item.href === "/semaine"
                ? pathname === "/" || pathname === "/semaine"
                : item.href === "/recettes"
                  ? pathname.startsWith("/recettes") || pathname.startsWith("/carnet") || pathname.startsWith("/fiche")
                  : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={href}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  active ? "text-[#8FA89B]" : "text-[#777773]"
                }`}
              >
                <Icon className="size-6" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
