"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Heart } from "lucide-react";
import { useMemo, useState } from "react";
import { matchingLines, matchesQuery } from "@/lib/search";
import { UtensilsCrossed, CookingPot, ShoppingCart, Droplets, Sprout, Sparkles, Timer, Martini, PartyPopper, BatteryLow, Bot, Flower2, Sun, Leaf, Snowflake, type LucideIcon } from "lucide-react";

const COLLECTION_ICONS: Record<string, LucideIcon> = { recettes: UtensilsCrossed, batchcooking: CookingPot, courses: ShoppingCart, sauces: Droplets, marinades: Sprout, epices: Sparkles, express: Timer, apero: Martini, invites: PartyPopper, fatiguee: BatteryLow, bonus: Sparkles, mrcuisine: Bot, printemps: Flower2, ete: Sun, automne: Leaf, hiver: Snowflake };

const COLLECTION_COLORS: Record<string, string> = {
  recettes: "#8FA89B", batchcooking: "#D98A6C", courses: "#E6DFD3", sauces: "#F4EAD4", marinades: "#EAD5C3", epices: "#F2D4C9", express: "#FAD2CB", apero: "#FCD5CE", invites: "#D0DBCE", fatiguee: "#EADAEC", bonus: "#E8ECEF", mrcuisine: "#E5E7EB", printemps: "#E2F0D9", ete: "#FCE4B5", automne: "#F3C6B1", hiver: "#E1EDF2",
};

type CategoryCard = { label: string; href: string; color: string; textColor?: string; image: string };

const RECIPE_CATEGORY_CARDS: CategoryCard[] = [
  { label: "SAUCES", href: "/recettes?filter=sauces", color: "#63358A", image: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "MARINADES", href: "/recettes?filter=marinades", color: "#A8CD91", textColor: "#183B3B", image: "https://images.unsplash.com/photo-1765118527220-da9c7a560b13?auto=format&fit=crop&w=900&q=85&v=5" },
  { label: "ÉPICES", href: "/recettes?filter=epices", color: "#E85D4A", image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "EXPRESS", href: "/recettes?filter=express", color: "#F72585", image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=900&q=85&v=5" },
  { label: "APÉRO", href: "/recettes?filter=apero", color: "#F46B25", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "RECEVOIR", href: "/recettes?filter=recevoir", color: "#172554", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "JE SUIS FATIGUÉ", href: "/recettes?filter=tired", color: "#C7A6E8", image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "PRINTEMPS", href: "/recettes?filter=printemps", color: "#91D477", textColor: "#173E2C", image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "ÉTÉ", href: "/recettes?filter=ete", color: "#FFD43B", textColor: "#46390A", image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "AUTOMNE", href: "/recettes?filter=automne", color: "#D97732", image: "https://images.unsplash.com/photo-1570586437263-ab629fccc818?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "HIVER", href: "/recettes?filter=hiver", color: "#70D7EC", textColor: "#103C50", image: "https://images.unsplash.com/photo-1768238907887-023b7ac9f450?auto=format&fit=crop&w=900&q=85&v=5" },
  { label: "VÉGAN", href: "/vegan", color: "#237A45", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "VÉGÉTARIEN", href: "/vegetarien", color: "#A8DFA0", textColor: "#173E2C", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "ÉTUDIANT", href: "/etudiant-petit-budget", color: "#2563EB", image: "https://images.unsplash.com/photo-1770235622226-4b5ad88137d8?auto=format&fit=crop&w=900&q=85&v=8" },
  { label: "FÊTES", href: "/fetes", color: "#7F1D3B", image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=85&v=6" },
  { label: "BONUS", href: "/recettes?filter=bonus", color: "#4D7777", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "MR CUISINE", href: "/recettes?filter=mr-cuisine", color: "#456B87", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85&v=4" },
];

export type RecipeListItem = {
  id: string;
  name: string;
  lines?: string[];
};

export function RecipeList({
  items,
  week,
  collections,
  homeStyleCollections = false,
}: {
  items: RecipeListItem[];
  week?: number;
  collections?: { slug: string; name: string; count: number }[];
  homeStyleCollections?: boolean;
}) {
  const [q, setQ] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => { try { setFavorites(JSON.parse(localStorage.getItem("cuisine-chic-ouf-favorites") || "[]")); } catch { setFavorites([]); } }, []);
  function toggleFavorite(id: string) { const next = favorites.includes(id) ? favorites.filter(value => value !== id) : [...favorites, id]; setFavorites(next); try { localStorage.setItem("cuisine-chic-ouf-favorites", JSON.stringify(next)); window.dispatchEvent(new Event("cuisine-chic-ouf-favorites-change")); } catch {} }
  const query = q.trim();
  const filtered = useMemo(() => {
    return items
      .map((item) => {
        const hay = `${item.name}\\n${(item.lines || []).join("\\n")}`;
        if (!matchesQuery(hay, q)) return null;
        return { item, hits: query ? matchingLines(item.lines || [], q) : [] };
      })
      .filter((row): row is { item: RecipeListItem; hits: string[] } => row !== null);
  }, [items, q, query]);

  return (
    <div className="space-y-5">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label className="block">
          <span className="sr-only">Rechercher une recette</span>
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={q}
            onChange={(event) => setQ(event.target.value)}
            onInput={(event) => setQ(event.currentTarget.value)}
            placeholder="Nom, légume, fromage, Mr Cuisine…"
            className="h-12 w-full rounded-2xl bg-card px-4 text-base ring-1 ring-foreground/10 outline-none"
          />
        </label>
      </form>

      {!query && homeStyleCollections ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4" aria-label="Catégories du carnet de recettes">
          {RECIPE_CATEGORY_CARDS.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              aria-label={card.label}
              className="group flex aspect-square min-w-0 flex-col overflow-hidden rounded-2xl text-center shadow-[0_5px_14px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-1 hover:brightness-105 active:scale-[0.97] sm:rounded-3xl"
              style={{ backgroundColor: card.color }}
            >
              <img src={card.image} alt="" loading="lazy" className="h-[68%] w-full min-h-0 object-cover transition-transform duration-300 group-hover:scale-105" />
              <span className="flex min-h-0 flex-1 w-full items-center justify-center px-1 py-1 text-[10px] font-black leading-tight tracking-wide sm:text-xs md:text-sm" style={{ backgroundColor: card.color, color: card.textColor || "#FFFFFF" }}>
                {card.label}
              </span>
            </Link>
          ))}
        </div>
      ) : !query && collections && collections.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {collections.map((col) => {
            const Icon = COLLECTION_ICONS[col.slug] || UtensilsCrossed;
            return (
            <Link
              key={col.slug}
              href={`/carnet/${col.slug}`}
              style={{ backgroundColor: COLLECTION_COLORS[col.slug] || "#E8ECEF", boxShadow: "0 3px 10px rgba(26,26,26,0.08)" }}
              className="rounded-2xl p-4 text-[#1A1A1A] ring-1 ring-black/5 transition-shadow hover:shadow-md"
            >
              <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-white/55"><Icon aria-hidden="true" className="size-6 stroke-[1.6]" /></span>
              <p className="font-heading text-lg font-semibold leading-tight text-[#1A1A1A]">{col.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{col.count} fiches</p>
            </Link>
          );
          })}
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-heading text-xl">
          {query ? `Résultats pour « ${query} »` : "Toutes les fiches"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {filtered.length} recette{filtered.length > 1 ? "s" : ""}
        </p>
        {filtered.length === 0 ? (
          <p className="rounded-2xl bg-muted/70 p-6 text-center text-sm text-muted-foreground">
            Aucune recette pour « {query} ». Essaie un légume, un fromage ou un mot du nom.
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map(({ item, hits }) => (
              <li key={`${item.id}-${query}`} className="flex items-start gap-2 rounded-2xl bg-card p-3 ring-1 ring-foreground/10">
                <Link href={week ? `/fiche/${item.id}?w=${week}` : `/fiche/${item.id}`} className="min-w-0 flex-1 rounded-xl px-1 py-1">
                  <p className="text-base leading-snug">{item.name}</p>
                  {hits.length > 0 ? <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{hits.slice(0, 8).map((line, index) => <li key={`${item.id}-hit-${index}`}>• {line}</li>)}</ul> : null}
                </Link>
                <button type="button" aria-label={favorites.includes(item.id) ? "Retirer des favoris" : "Ajouter aux favoris"} aria-pressed={favorites.includes(item.id)} onClick={() => toggleFavorite(item.id)} className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${favorites.includes(item.id) ? "bg-[#F4C542]/25 text-[#B18B00]" : "bg-[#F9F9F7] text-[#777773]"}`}><Heart className="size-5" fill={favorites.includes(item.id) ? "currentColor" : "none"} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
