import Link from "next/link";
import { CalendarDays, CookingPot, Home, ShoppingCart, Sparkles, UtensilsCrossed } from "lucide-react";

const NAV = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/semaine", label: "Semaine", icon: CalendarDays },
  { href: "/recettes", label: "Recettes", icon: UtensilsCrossed },
  { href: "/courses", label: "Courses", icon: ShoppingCart },
  { href: "/batch", label: "Batch", icon: CookingPot },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="font-heading text-lg tracking-tight">
            Dans mon assiette
          </Link>
          <a
            href="/api/telecharger"
            download="Dans-mon-assiette.xlsx"
            className="rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground md:hidden"
          >
            Excel
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/surprends"
              className="ml-1 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-sm text-accent-foreground"
            >
              <Sparkles className="size-3.5" />
              Surprends-moi
            </Link>
            <a
              href="/api/telecharger"
              download="Dans-mon-assiette.xlsx"
              className="ml-2 rounded-full bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
            >
              Télécharger Excel
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-md md:hidden">
        <div className="grid grid-cols-5">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-muted-foreground"
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
