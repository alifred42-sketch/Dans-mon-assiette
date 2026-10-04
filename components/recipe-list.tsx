"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { matchingLines, matchesQuery } from "@/lib/search";

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
          {collections.map((col) => (
            <Link
              key={col.slug}
              href={`/carnet/${col.slug}`}
              className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <p className="font-heading text-lg leading-tight">{col.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{col.count} fiches</p>
            </Link>
          ))}
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
