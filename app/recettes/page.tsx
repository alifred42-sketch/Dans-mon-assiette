import Link from "next/link";
import { carnet } from "@/lib/carnet";

export default function RecettesPage() {
  const recipes = [...carnet.recipes].sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl">Recettes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {recipes.length} fiches du carnet. Aucune recette ajoutée.
        </p>
      </div>
      {recipes.length === 0 ? (
        <p className="rounded-2xl bg-muted/70 p-6 text-center text-sm text-muted-foreground">
          Aucune fiche dans le carnet.
        </p>
      ) : (
        <ul className="divide-y rounded-2xl bg-card ring-1 ring-foreground/10">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <Link href={`/fiche/${recipe.id}`} className="block px-4 py-4 text-base leading-snug">
                {recipe.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
