import { TAGS, surprise } from "@/lib/carnet";
import { RecipeCard } from "@/components/recipe-card";
import { buttonVariants } from "@/components/ui/button";

type Search = { tag?: string; seed?: string };

export default async function SurprendsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const tag = sp.tag || "";
  const seed = Math.max(0, Number(sp.seed) || 0);
  const recipe = seed > 0 ? surprise({ tag, seed }) : undefined;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Surprends-moi</h1>
        <p className="text-sm text-muted-foreground">
          Une recette du carnet, pas une invention. Tu peux limiter au express, au poisson, au robot…
        </p>
      </div>
      <form action="/surprends" method="get" className="space-y-4">
        <label className="block text-sm">
          Envie
          <select
            name="tag"
            defaultValue={tag}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2"
          >
            <option value="">Peu importe</option>
            {TAGS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <input type="hidden" name="seed" value={seed + 1} />
        <button type="submit" className={`${buttonVariants()} w-full`}>
          Tirer une recette
        </button>
      </form>
      {recipe ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Tirage n°{seed}</p>
          <RecipeCard recipe={recipe} />
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">Clique pour piocher dans le carnet.</p>
      )}
    </div>
  );
}
