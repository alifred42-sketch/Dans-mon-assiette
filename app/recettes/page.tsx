"use client";

import { useEffect, useMemo, useState } from "react";
import { CUISINES, TAGS, filterRecipes } from "@/lib/carnet";
import { RecipeCard } from "@/components/recipe-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function RecettesPage() {
  const [q, setQ] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [tag, setTag] = useState("");
  const [limit, setLimit] = useState(60);
  const list = useMemo(() => filterRecipes({ q, cuisine, tag }), [q, cuisine, tag]);
  useEffect(() => {
    setLimit(60);
  }, [q, cuisine, tag]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl">Bibliothèque</h1>
        <p className="text-sm text-muted-foreground">
          Une recette peut avoir plusieurs étiquettes. Ce n’est plus un onglet par thème.
        </p>
      </div>
      <Input
        placeholder="Rechercher (poulet, courgette, express…)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Rechercher une recette"
      />
      <div className="flex flex-wrap gap-2">
        <Chip active={!cuisine} onClick={() => setCuisine("")}>
          Toutes cuisines
        </Chip>
        {CUISINES.map((c) => (
          <Chip key={c.id} active={cuisine === c.id} onClick={() => setCuisine(c.id)}>
            {c.label}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip active={!tag} onClick={() => setTag("")}>
          Tous les filtres
        </Chip>
        {TAGS.map((t) => (
          <Chip key={t.id} active={tag === t.id} onClick={() => setTag(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>
      <p className="text-sm text-muted-foreground" role="status">
        {list.length} recette{list.length > 1 ? "s" : ""}
        {q.trim() ? ` pour « ${q.trim()} »` : ""}
        {tag ? ` · filtre ${TAGS.find((t) => t.id === tag)?.label ?? tag}` : ""}
      </p>
      {list.length === 0 ? (
        <p className="rounded-2xl bg-muted/50 p-8 text-center text-sm text-muted-foreground">
          Aucune recette pour « {q || tag || cuisine || "ces filtres"} ». Essaie « poulet » ou « express ».
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.slice(0, limit).map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
      {list.length > limit && (
        <button
          type="button"
          className="w-full rounded-2xl bg-muted py-3 text-sm hover:bg-muted/80"
          onClick={() => setLimit((n) => n + 60)}
        >
          Afficher plus ({list.length - limit} restantes)
        </button>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-sm",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}
