import Link from "next/link";
import { DAYS, DAY_LABEL, carnet, getRecipe, weekPlan } from "@/lib/carnet";

function ficheId(week: number, day: string, meal: string) {
  return `fiche-${week}-${day}-${meal}`.toLowerCase();
}

export default function SheetsPage() {
  const weeks = Array.from({ length: 52 }, (_, i) => i + 1);
  const fiches = carnet.plan.map((slot) => {
    const recipe = getRecipe(slot.recipeId);
    return { slot, recipe, id: ficheId(slot.week, slot.day, slot.meal) };
  });

  return (
    <div className="-mx-4 bg-[#f8f9fa] px-2 pb-16 pt-2 text-[13px] text-[#202124] md:-mx-0">
      <div className="mb-2 flex items-center gap-2 border-b border-[#dadce0] bg-white px-3 py-2">
        <span className="font-medium text-[#188038]">Google Sheets</span>
        <span className="text-[#5f6368]">Dans-mon-assiette</span>
        <span className="rounded bg-[#e6f4ea] px-2 py-0.5 text-[11px] text-[#137333]">
          3 onglets · liens actifs
        </span>
      </div>
      <div className="mb-2 flex gap-1 px-1">
        <span className="rounded-t border border-b-0 border-[#dadce0] bg-white px-3 py-1 font-medium">
          Dashboard
        </span>
        <Link href="/courses" className="rounded-t px-3 py-1 text-[#5f6368] hover:bg-white">
          Courses
        </Link>
        <Link href="/batch" className="rounded-t px-3 py-1 text-[#5f6368] hover:bg-white">
          Batch
        </Link>
      </div>

      <p className="mb-2 px-2 text-[#5f6368]">
        Clique un plat souligné — ça ouvre sa fiche. Tu n’as rien à télécharger pour vérifier.
      </p>

      {weeks.map((week) => {
        const slots = weekPlan(week, {});
        const cell = (day: string, meal: "midi" | "soir") => {
          const slot = slots.find((s) => s.day === day && s.meal === meal);
          if (!slot) {
            return <td key={`${week}-${meal}-${day}`} className="border border-[#e0e0e0] bg-white p-2" />;
          }
          const href = slot.recipeId ? `/recettes/${slot.recipeId}` : `#${ficheId(week, day, meal)}`;
          return (
            <td key={`${week}-${meal}-${day}`} className="border border-[#e0e0e0] bg-[#fffcf6] p-1 text-center">
              <Link href={href} className="font-medium text-[#1a73e8] underline">
                {slot.label}
              </Link>
            </td>
          );
        };
        return (
          <table key={week} className="mb-4 w-full border-collapse bg-white">
            <thead>
              <tr>
                <th
                  colSpan={8}
                  className="border border-[#e0e0e0] bg-[#f6f1e6] px-3 py-2 text-left text-base text-[#4a5a3a]"
                >
                  SEMAINE {week}
                </th>
              </tr>
              <tr className="bg-[#4a5a3a] text-white">
                <th className="w-16 border border-[#3d4c30] p-2" />
                {DAYS.map((d) => (
                  <th key={d} className="border border-[#3d4c30] p-2 font-medium">
                    {DAY_LABEL[d]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th className="border border-[#e0e0e0] bg-white p-2 text-[#4a5a3a]">MIDI</th>
                {DAYS.map((d) => cell(d, "midi"))}
              </tr>
              <tr>
                <th className="border border-[#e0e0e0] bg-white p-2 text-[#4a5a3a]">SOIR</th>
                {DAYS.map((d) => cell(d, "soir"))}
              </tr>
            </tbody>
          </table>
        );
      })}

      <h2 className="mb-2 mt-8 px-2 text-lg font-medium text-[#4a5a3a]">Fiches recettes</h2>
      <div className="space-y-3">
        {fiches.map(({ slot, recipe, id }) => (
          <article
            key={id}
            id={id}
            className="rounded border border-[#dadce0] bg-white p-4"
          >
            <p className="text-xs text-[#5f6368]">
              Semaine {slot.week} · {DAY_LABEL[slot.day] || slot.day} · {slot.meal}
            </p>
            <h3 className="font-medium text-[#188038]">{slot.label}</h3>
            {recipe ? (
              <Link href={`/recettes/${recipe.id}`} className="text-sm text-[#1a73e8] underline">
                Ouvrir la fiche complète
              </Link>
            ) : (
              <p className="text-sm text-[#5f6368]">Fiche menu (pas de recette détaillée).</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

