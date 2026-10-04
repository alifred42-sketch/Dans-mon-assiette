import {
  Beef,
  Bird,
  CookingPot,
  CupSoda,
  Egg,
  Fish,
  Flower2,
  GlassWater,
  Leaf,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import { dishKind } from "@/lib/dish";
import type { Recipe } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = {
  soupe: Soup,
  poisson: Fish,
  volaille: Bird,
  viande: Beef,
  oeuf: Egg,
  wrap: Sandwich,
  salade: Salad,
  pates: Wheat,
  riz: Wheat,
  legumes: Leaf,
  legumineuses: Flower2,
  apero: GlassWater,
  dessert: CupSoda,
  sauce: CookingPot,
  epices: Flower2,
  plat: UtensilsCrossed,
} as const;

const TINT: Record<string, string> = {
  soupe: "bg-amber-100 text-amber-950",
  poisson: "bg-sky-100 text-sky-950",
  volaille: "bg-orange-100 text-orange-950",
  viande: "bg-rose-100 text-rose-950",
  oeuf: "bg-yellow-100 text-yellow-950",
  wrap: "bg-lime-100 text-lime-950",
  salade: "bg-emerald-100 text-emerald-950",
  pates: "bg-yellow-50 text-yellow-950",
  riz: "bg-stone-100 text-stone-800",
  legumes: "bg-green-100 text-green-950",
  legumineuses: "bg-orange-50 text-orange-950",
  apero: "bg-fuchsia-100 text-fuchsia-950",
  dessert: "bg-pink-100 text-pink-950",
  sauce: "bg-red-100 text-red-950",
  epices: "bg-amber-50 text-amber-950",
  plat: "bg-stone-100 text-stone-800",
};

export function DishMark({
  recipe,
  size = "card",
}: {
  recipe: Recipe;
  size?: "card" | "hero";
}) {
  const kind = dishKind(recipe);
  const Icon = ICONS[kind.id as keyof typeof ICONS] || UtensilsCrossed;
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        size === "hero" ? "rounded-2xl p-5" : "rounded-xl px-3 py-2",
        TINT[kind.id] || TINT.plat
      )}
      aria-label={`Type de plat : ${kind.label}`}
    >
      <Icon className={size === "hero" ? "size-10" : "size-6"} strokeWidth={1.5} />
      <div>
        <p className={cn("font-medium leading-tight", size === "hero" ? "text-base" : "text-xs")}>
          {kind.label}
        </p>
        {size === "hero" && (
          <p className="mt-1 text-sm opacity-80">Pictogramme du plat — pas une photo stock.</p>
        )}
      </div>
    </div>
  );
}
