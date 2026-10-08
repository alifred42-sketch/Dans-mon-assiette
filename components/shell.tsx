"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, CookingPot, ShoppingCart, UtensilsCrossed } from "lucide-react";

const NAV = [
  { href: "/", label: "Semaine", icon: CalendarDays },
  { href: "/courses", label: "Courses", icon: ShoppingCart },
  { href: "/batch", label: "Batch", icon: CookingPot },
  { href: "/recettes", label: "Recettes", icon: UtensilsCrossed },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const week = search.get("w");
  const weekQuery = week ? `?w=${week}` : "";

  return (
    <div className="flex min-h-dvh flex-col bg-[#F9F9F7]">
      <header className="sticky top-0 z-40 border-b border-[#E9E9E4] bg-[#F9F9F7]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-center px-4">
          <Link href="/" aria-label="CUISINE CHIC OUF !">
            <img src="/logo-cuisine-chic-ouf.svg" alt="CUISINE CHIC OUF !" className="h-12 w-auto" />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E9E9E4] bg-[#F9F9F7]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const href = item.href === "/recettes" ? item.href : `${item.href}${weekQuery}`;
            const active =
              item.href === "/"
                ? pathname === "/"
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
