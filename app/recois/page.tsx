import { receiveMenu } from "@/lib/carnet";
import { RecipeCard } from "@/components/recipe-card";
import { buttonVariants } from "@/components/ui/button";

type Search = { guests?: string; apero?: string | string[]; seed?: string };

export default async function RecoisPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const guests = Math.min(12, Math.max(2, Number(sp.guests) || 6));
  const aperoRaw = sp.apero;
  const aperoParts = aperoRaw == null ? ["1"] : Array.isArray(aperoRaw) ? aperoRaw : [aperoRaw];
  const apero = aperoParts.includes("1");
  const seed = Math.max(1, Number(sp.seed) || 1);
  const menu = receiveMenu(guests, apero, seed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Je reçois</h1>
        <p className="text-sm text-muted-foreground">
          Un menu tiré du carnet, pas d’un générateur fantôme. Les quantités suivent le nombre d’invités.
        </p>
      </div>
      <form action="/recois" method="get" className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Invités
            <input
              name="guests"
              type="number"
              min={2}
              max={12}
              defaultValue={guests}
              className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2"
            />
          </label>
          <label className="flex items-end gap-2 pb-1 text-sm">
            <input type="hidden" name="apero" value="0" />
            <input type="checkbox" name="apero" value="1" defaultChecked={apero} />
            Apéritif dînatoire
          </label>
        </div>
        <input type="hidden" name="seed" value={seed + 1} />
        <button type="submit" className={buttonVariants()}>
          Composer un autre menu
        </button>
      </form>
      <p className="text-sm text-muted-foreground">Menu n°{seed}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {menu.map((r) => (
          <RecipeCard key={`${r.id}-${seed}`} recipe={r} />
        ))}
      </div>
      {menu.length === 0 && (
        <p className="text-sm text-muted-foreground">Pas assez de fiches « invités » pour composer.</p>
      )}
      <p className="text-sm text-muted-foreground">
        Compte environ {Math.round(guests * 12)} à {Math.round(guests * 18)} € de courses selon les saisons
        (repère, pas un tarif figé).
      </p>
    </div>
  );
}
