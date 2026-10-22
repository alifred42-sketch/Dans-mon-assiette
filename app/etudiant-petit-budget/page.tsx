"use client";

import Link from "next/link";
import { useState } from "react";
import { carnet } from "@/lib/carnet";
import { recipeLines } from "@/lib/search";
import { RecipeList } from "@/components/recipe-list";
import type { Recipe } from "@/lib/types";
import { ArrowLeft, CookingPot, Soup, Microwave, Salad, Coffee, Sparkles } from "lucide-react";

type Book = "cuisson-unique" | "fast-chic";

const BOOKS: { id: Book; label: string; description: string; icon: typeof CookingPot }[] = [
  { id: "cuisson-unique", label: "🍳 Les Options de Cuisson Unique", description: "Un seul ustensile, moins de vaisselle.", icon: CookingPot },
  { id: "fast-chic", label: "🥗 Le Fast-Chic & Les Tendances", description: "Des repas malins, rapides et dans l'air du temps.", icon: Salad },
];

const FILTERS: Record<Book, { id: string; label: string; icon: typeof CookingPot; description: string }[]> = {
  "cuisson-unique": [
    { id: "one_pan", label: "🍳 100% Poêle (One-Pan)", icon: CookingPot, description: "Tout cuit dans une seule poêle." },
    { id: "one_pot", label: "🫕 100% Casserole", icon: Soup, description: "Un seul faitout ou une seule casserole." },
    { id: "micro_ondes", label: "🍿 Le Micro-ondes magique", icon: Microwave, description: "Des solutions rapides au micro-ondes." },
  ],
  "fast-chic": [
    { id: "zero_cuisson", label: "🥗 Zéro cuisson (Salades & Assemblages)", icon: Salad, description: "Des repas frais, sans allumer les plaques." },
    { id: "bouilloire_grill_pain", label: "☕ Système D (Bouilloire et Grille-pain)", icon: Coffee, description: "Des astuces simples avec le matériel du quotidien." },
    { id: "tendances", label: "✨ Les 12 Recettes Tendances", icon: Sparkles, description: "Douze idées modernes et petit budget." },
  ],
};

export default function EtudiantPetitBudgetPage() {
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const selectedFilter = activeBook ? FILTERS[activeBook].find((item) => item.id === activeFilter) : null;

  return (
    <main className="min-h-dvh bg-[#F9F9F7] px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#E6DFD3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA89B]">
          <ArrowLeft aria-hidden="true" className="size-4" /> Retour
        </Link>

        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#6B6B67]">Le carnet malin</p>
          <h1 className="font-heading text-3xl font-extrabold text-[#1A1A1A] sm:text-4xl">🎓 Étudiant & Petit Budget</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-[#2B2B2B] sm:text-base">
            Des idées économiques et pratiques, organisées selon le matériel disponible et le temps que l’on souhaite passer en cuisine.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Choisir un grand livre">
          {BOOKS.map((book) => {
            const Icon = book.icon;
            const active = activeBook === book.id;
            return (
              <button key={book.id} type="button" aria-pressed={active}
                onClick={() => { setActiveBook(active ? null : book.id); setActiveFilter(null); }}
                className={"flex min-h-28 items-start gap-4 rounded-2xl border px-5 py-5 text-left text-[#1A1A1A] shadow-[0_4px_12px_rgba(43,43,43,0.09)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA89B] " + (active ? "border-[#8FA89B] bg-[#D8E2DB]" : "border-[#D8D1C7] bg-[#E6DFD3]")}>
                <Icon aria-hidden="true" className="mt-1 size-7 shrink-0" />
                <span>
                  <span className="block font-bold">{book.label}</span>
                  <span className="mt-1 block text-sm font-normal">{book.description}</span>
                </span>
              </button>
            );
          })}
        </section>

        {activeBook ? (
          <section className="space-y-4" aria-label="Sous-catégories">
            <h2 className="font-heading text-xl font-bold text-[#1A1A1A]">Choisissez votre méthode</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FILTERS[activeBook].map((filter) => {
                const Icon = filter.icon;
                const active = activeFilter === filter.id;
                return (
                  <button key={filter.id} type="button" aria-pressed={active} onClick={() => setActiveFilter(active ? null : filter.id)}
                    className={"flex min-h-20 items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-semibold text-[#1A1A1A] shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA89B] " + (active ? "border-[#8FA89B] bg-[#D8E2DB]" : "border-[#D8D1C7] bg-[#E6DFD3]")}>
                    <Icon aria-hidden="true" className="size-5 shrink-0" />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
            {selectedFilter ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#D8D1C7] bg-white/70 p-5 text-[#1A1A1A]" role="status">
                  <h3 className="font-bold">{selectedFilter.label}</h3>
                  <p className="mt-1 text-sm">{selectedFilter.description}</p>
                </div>
                {selectedFilter.id === "one_pan" || selectedFilter.id === "one_pot" || selectedFilter.id === "micro_ondes" || selectedFilter.id === "zero_cuisson" ? (
                  <RecipeList
                    items={carnet.recipes
                      .filter((recipe) => { const tagged = recipe as Recipe & { profil?: string; sous_etudiant?: string }; return tagged.profil === "etudiant" && tagged.sous_etudiant === selectedFilter.id; })
                      .map((recipe) => ({ id: recipe.id, name: recipe.name, lines: recipeLines(recipe) }))}
                  />
                ) : (
                  <p className="rounded-2xl border border-[#D8D1C7] bg-white/70 p-5 text-sm text-[#5D625E]">
                    Les recettes de cette sous-catégorie seront affichées ici après leur intégration.
                  </p>
                )}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
