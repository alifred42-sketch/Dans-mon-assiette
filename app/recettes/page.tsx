import { CUISINES, TAGS, filterRecipes } from "@/lib/carnet";
import { RecipeCard } from "@/components/recipe-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Search = { q?: string; cuisine?: string; tag?: string; more?: string };

export default async function RecettesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const cuisine = sp.cuisine || "";
  const tag = sp.tag || "";
  const limit = Math.max(60, Number(sp.more) || 60);
  const list = filterRecipes({ q, cuisine, tag });
  const href = (next: Partial<Search>) => {
    const p = new URLSearchParams();
    const qq = next.q ?? q;
    const cc = next.cuisine ?? cuisine;
    const tt = next.tag ?? tag;
    if (qq) p.set("q", qq);
    if (cc) p.set("cuisine", cc);
    if (tt) p.set("tag", tt);
    const s = p.toString();
    return s ? `/recettes?${s}` : "/recettes";
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl">Bibliothèque</h1>
        <p className="text-sm text-muted-foreground">
          Une recette peut avoir plusieurs étiquettes. Ce n’est plus un onglet par thème.
        </p>
      </div>
      <form action="/recettes" method="get" className="flex flex-wrap gap-2">
        {cuisine ? <input type="hidden" name="cuisine" value={cuisine} /> : null}
        {tag ? <input type="hidden" name="tag" value={tag} /> : null}
        <input
          name="q"
          defaultValue={q}
          data-autosubmit="input"
          placeholder="Rechercher (poulet, courgette, express…)"
          aria-label="Rechercher une recette"
          className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <button type="submit" className={buttonVariants()}>
          Filtrer
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        <Chip href={href({ cuisine: "" })} active={!cuisine}>
          Toutes cuisines
        </Chip>
        {CUISINES.map((c) => (
          <Chip key={c.id} href={href({ cuisine: c.id })} active={cuisine === c.id}>
            {c.label}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip href={href({ tag: "" })} active={!tag}>
          Tous les filtres
        </Chip>
        {TAGS.map((t) => (
          <Chip key={t.id} href={href({ tag: t.id })} active={tag === t.id}>
            {t.label}
          </Chip>
        ))}
      </div>
      <p className="text-sm text-muted-foreground" role="status">
        {list.length} recette{list.length > 1 ? "s" : ""}
        {q ? ` pour « ${q} »` : ""}
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
      {list.length > limit ? (
        <Link
          href={`${href({})}${href({}).includes("?") ? "&" : "?"}more=${limit + 60}`}
          className="block w-full rounded-2xl bg-muted py-3 text-center text-sm hover:bg-muted/80"
        >
          Afficher plus ({list.length - limit} restantes)
        </Link>
      ) : null}
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1 text-sm",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </Link>
  );
}
