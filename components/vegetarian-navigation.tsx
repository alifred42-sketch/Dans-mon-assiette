"use client";

import { useState } from "react";
import { BackButton } from "@/components/back-button";
import { RecipeList } from "@/components/recipe-list";
import { carnet } from "@/lib/carnet";
import { recipeLines } from "@/lib/search";

type LevelOne = "saison" | "technique";

const LEVELS: { id: LevelOne; label: string }[] = [
  { id: "saison", label: "☀️ Les Recettes de Saison" },
  { id: "technique", label: "🤖 Les Options Techniques & Express" },
];

const SUBFILTERS: Record<LevelOne, { id: string; label: string }[]> = {
  saison: [
    { id: "printemps_ete", label: "🌸 Printemps / Été" },
    { id: "automne_hiver", label: "🍂 Automne / Hiver" },
  ],
  technique: [
    { id: "robot", label: "🤖 Option Robot [Mr Cuisine]" },
    { id: "express", label: "⚡ Express (- de 20 min)" },
  ],
};

export function VegetarianNavigation({ showBack = true }: { showBack?: boolean }) {
  const [activeLevel, setActiveLevel] = useState<LevelOne | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const recipes = activeSub
    ? carnet.recipes.filter((recipe) => recipe.regime === "vegetarien" && recipe.sous_regime === activeSub)
    : [];
  const intro = "Des légumes sublimés, du fromage fondant et de la couleur dans l'assiette. Le plein de peps, tout simplement !";

  return (
    <section className="space-y-5">
      {showBack ? <BackButton /> : null}
      <header>
        <h1 className="font-heading text-2xl font-bold text-[#1A1A1A] sm:text-3xl">🥦 Végétarien</h1>
        <p className="mt-2 max-w-3xl text-sm font-normal leading-relaxed text-[#1A1A1A] sm:text-base">{intro}</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Choisir un grand livre végétarien">
        {LEVELS.map((level) => {
          const active = activeLevel === level.id;
          return (
            <button key={level.id} type="button" aria-pressed={active}
              onClick={() => {
                setActiveLevel(active ? null : level.id);
                setActiveSub(null);
              }}
              className={"min-h-16 rounded-2xl border px-4 py-4 text-left text-sm font-semibold text-[#1A1A1A] shadow-[0_4px_12px_rgba(43,43,43,0.09)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA89B] sm:text-base " + (active ? "border-[#8FA89B] bg-[#8FA89B]" : "border-white/70 bg-[#E2F0D9]")}>
              {level.label}
            </button>
          );
        })}
      </div>

      {activeLevel ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2" aria-label="Sous-filtres végétariens">
            {SUBFILTERS[activeLevel].map((sub) => {
              const active = activeSub === sub.id;
              return (
                <button key={sub.id} type="button" aria-pressed={active} onClick={() => setActiveSub(active ? null : sub.id)}
                  className={"rounded-full border px-3 py-2 text-sm font-medium text-[#1A1A1A] shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA89B] " + (active ? "border-[#8FA89B] bg-[#8FA89B]" : "border-[#E3DCD4] bg-[#E2F0D9] hover:border-[#8FA89B]")}>
                  {sub.label}
                </button>
              );
            })}
          </div>
          {activeSub ? (
            recipes.length > 0 ? (
              <div className="space-y-3" aria-live="polite">
                <h2 className="font-heading text-lg font-semibold text-[#1A1A1A]">{recipes.length} recette(s) dans cette rubrique</h2>
                <RecipeList items={recipes.map((recipe) => ({ id: recipe.id, name: recipe.name, lines: recipeLines(recipe) }))} />
              </div>
            ) : (
              <p className="rounded-2xl border border-[#E3DCD4] bg-[#F9F9F7] px-4 py-3 text-sm text-[#1A1A1A]" role="status">
                Cette rubrique est prête à accueillir ses recettes.
              </p>
            )
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
