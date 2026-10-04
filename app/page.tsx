import Link from "next/link";
import {
  CalendarDays,
  CookingPot,
  PartyPopper,
  ShoppingCart,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { carnet } from "@/lib/carnet";

const TILES = [
  { href: "/semaine", title: "Mes 52 semaines", text: "Midi et soir, un clic ouvre la fiche.", icon: CalendarDays },
  { href: "/recettes", title: "Mes recettes", text: `${carnet.recipes.length} fiches, filtres et recherche.`, icon: UtensilsCrossed },
  { href: "/courses", title: "Mes courses", text: "Liste fusionnée par rayon, pour la semaine affichée.", icon: ShoppingCart },
  { href: "/batch", title: "Mon batch", text: "Ce qui se prépare à l’avance, robot compris.", icon: CookingPot },
  { href: "/recois", title: "Je reçois", text: "Invités, apéro, menu et courses recalculés.", icon: PartyPopper },
  { href: "/surprends", title: "Surprends-moi", text: "Une recette du carnet, au hasard.", icon: Sparkles },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="max-w-2xl space-y-3">
        <p className="text-sm font-medium text-primary">Carnet nettoyé</p>
        <h1 className="font-heading text-4xl leading-tight md:text-5xl">
          52 semaines dans mon assiette
        </h1>
        <p className="text-base text-muted-foreground md:text-lg">
          {carnet.subtitle} Les 45 onglets d’audit ChatGPT ont disparu. Chaque plat est un vrai lien.
        </p>
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className="rounded-2xl bg-card p-5 ring-1 ring-foreground/8 transition hover:-translate-y-0.5 hover:ring-primary/30"
            >
              <Icon className="mb-3 size-6 text-primary" />
              <h2 className="font-heading text-xl">{tile.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{tile.text}</p>
            </Link>
          );
        })}
      </section>
      <p className="text-sm">
        <a href="/Dans-mon-assiette.xlsx" className="text-primary underline-offset-4 hover:underline">
          Télécharger le classeur propre (6 onglets, vrais liens)
        </a>
      </p>
      <section className="rounded-2xl bg-muted/60 p-5">
        <h2 className="font-heading text-lg">Petit-déjeuner (toute la semaine)</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
          {carnet.breakfast.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Variantes : {carnet.breakfast.variants.join(" · ")}
        </p>
      </section>
    </div>
  );
}
