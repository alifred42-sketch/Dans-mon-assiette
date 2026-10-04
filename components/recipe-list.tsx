"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export function RecipeList({
  items,
  week,
}: {
  items: { id: string; name: string }[];
  week?: number;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase("fr");
    if (!needle) return items;
    return items.filter((item) => item.name.toLocaleLowerCase("fr").includes(needle));
  }, [items, q]);

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="sr-only">Rechercher</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une recette"
          className="h-12 w-full rounded-2xl bg-card px-4 text-base ring-1 ring-foreground/10 outline-none"
        />
      </label>
      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-muted/70 p-6 text-center text-sm text-muted-foreground">
          Aucune recette pour « {q} ».
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
