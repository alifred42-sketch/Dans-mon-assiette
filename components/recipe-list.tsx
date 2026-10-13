"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { matchingLines, matchesQuery } from "@/lib/search";
import { UtensilsCrossed, CookingPot, ShoppingCart, Droplets, Sprout, Sparkles, Timer, Martini, PartyPopper, BatteryLow, Bot, Flower2, Sun, Leaf, Snowflake, type LucideIcon } from "lucide-react";

const COLLECTION_ICONS: Record<string, LucideIcon> = { recettes: UtensilsCrossed, batchcooking: CookingPot, courses: ShoppingCart, sauces: Droplets, marinades: Sprout, epices: Sparkles, express: Timer, apero: Martini, invites: PartyPopper, fatiguee: BatteryLow, bonus: Sparkles, mrcuisine: Bot, printemps: Flower2, ete: Sun, automne: Leaf, hiver: Snowflake };

const COLLECTION_COLORS: Record<string, string> = {
  recettes: "#8FA89B", batchcooking: "#D98A6C", courses: "#E6DFD3", sauces: "#F4EAD4", marinades: "#EAD5C3", epices: "#F2D4C9", express: "#FAD2CB", apero: "#FCD5CE", invites: "#D0DBCE", fatiguee: "#EADAEC", bonus: "#E8ECEF", mrcuisine: "#E5E7EB", printemps: "#E2F0D9", ete: "#FCE4B5", automne: "#F3C6B1", hiver: "#E1EDF2",
};

export type RecipeListItem = {
  id: string;
  name: string;
  lines?: string[];
};

export function RecipeList({
  items,
  week,
  collections,
}: {
  items: RecipeListItem[];
  week?: number;
  collections?: { slug: string; name: string; count: number }[];
}) {
  const [q, setQ] = useState("");
  const query = q.trim();
  const filtered = useMemo(() => {
    return items
      .map((item) => {
        const hay = `${item.name}\n${(item.lines || []).join("\n")}`;
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

      {!query && collections && collections.length > 0 ? (
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
              <li key={`${item.id}-${query}`}>
                <Link
                  href={week ? `/fiche/${item.id}?w=${week}` : `/fiche/${item.id}`}
                  className="block rounded-2xl bg-card px-4 py-4 ring-1 ring-foreground/10"
                >
                  <p className="text-base leading-snug">{item.name}</p>
                  {hits.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {hits.slice(0, 8).map((line, index) => (
                        <li key={`${item.id}-hit-${index}`}>• {line}</li>
                      ))}
                    </ul>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
