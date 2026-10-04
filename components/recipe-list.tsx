"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { matchesQuery } from "@/lib/search";

export type RecipeListItem = {
  id: string;
  name: string;
  text?: string;
};

export function RecipeList({
  items,
  week,
}: {
  items: RecipeListItem[];
  week?: number;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    try {
      return items.filter((item) => matchesQuery(`${item.name} ${item.text || ""}`, q));
    } catch {
      const fallback = q.trim().toLocaleLowerCase("fr");
      if (!fallback) return items;
      return items.filter((item) => item.name.toLocaleLowerCase("fr").includes(fallback));
    }
  }, [items, q]);

  return (
    <div className="space-y-3">
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
            defaultValue=""
            onInput={(event) => setQ(event.currentTarget.value)}
            placeholder="Nom, légume, fromage, Mr Cuisine…"
            className="h-12 w-full rounded-2xl bg-card px-4 text-base ring-1 ring-foreground/10 outline-none"
          />
        </label>
      </form>
      <p className="px-1 text-xs text-muted-foreground">
        {q.trim()
          ? `${filtered.length} recette${filtered.length > 1 ? "s" : ""} pour « ${q.trim()} »`
          : `${items.length} fiches`}
      </p>
      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-muted/70 p-6 text-center text-sm text-muted-foreground">
          Aucune recette pour « {q} ». Essaie un légume, un fromage ou un mot du nom.
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
          {filtered.map((item) => (
            <li key={item.id}>
              <Link
                href={week ? `/fiche/${item.id}?w=${week}` : `/fiche/${item.id}`}
                className="block px-4 py-4 text-base leading-snug"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
