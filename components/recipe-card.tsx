import Link from "next/link";
import { Clock, Users } from "lucide-react";
import type { Recipe } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TINT: Record<string, string> = {
  francaise: "from-lime-100 to-stone-100",
  italienne: "from-emerald-100 to-stone-100",
  espagnole: "from-amber-100 to-stone-100",
  marocaine: "from-orange-100 to-stone-100",
  asiatique: "from-sky-100 to-stone-100",
  grecque: "from-cyan-100 to-stone-100",
  monde: "from-rose-100 to-stone-100",
};

export function RecipeCard({
  recipe,
  href,
  compact,
}: {
  recipe: Recipe;
  href?: string;
  compact?: boolean;
}) {
  const to = href ?? `/recettes/${recipe.id}`;
  return (
    <Link
      href={to}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/8 transition hover:-translate-y-0.5 hover:ring-primary/30"
    >
      <div
        className={cn(
          "relative flex items-end bg-gradient-to-br px-4 py-3",
          compact ? "h-20" : "h-28",
          TINT[recipe.cuisine] || "from-stone-100 to-stone-50"
        )}
      >
        <p className="font-heading text-base leading-snug text-foreground group-hover:text-primary">
          {recipe.name}
        </p>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex flex-wrap gap-1">
          {recipe.robot && <Badge variant="secondary">Mr Cuisine</Badge>}
          {recipe.tags.slice(0, compact ? 1 : 3).map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>
        {!compact && recipe.summary && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{recipe.summary}</p>
        )}
        <p className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {recipe.timeMin} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" />
            {recipe.servings} pers.
          </span>
          {recipe.ingredients.length === 0 && <span>Fiche à compléter</span>}
        </p>
      </div>
    </Link>
  );
}
