"use client";

import { useState } from "react";
import { BackButton } from "@/components/back-button";
import { carnet } from "@/lib/carnet";
import { recipeLines } from "@/lib/search";
import { RecipeList } from "@/components/recipe-list";

const BOOKS = [
  {
    id: "noel",
    label: "🎄 Grand Livre de Noël",
    color: "#FAD2CB",
    subs: [
      ["entrees", "🥗 Entrées"],
      ["plats-principaux", "🍽️ Plats Principaux"],
      ["desserts", "🍰 Desserts"],
    ],
  },
  {
    id: "halloween",
    label: "🎃 Grimoire d'Halloween",
    color: "#EAD5C3",
    subs: [
      ["aperos-terrifiants", "🥂 Apéros Terrifiants"],
      ["plats-express", "⚡ Plats Express"],
      ["atelier-monstres", "🧙‍♀️ Atelier P'tits Monstres"],
      ["potions-cocktails", "🧪 Potions & Cocktails"],
    ],
  },
  {
    id: "annee",
    label: "🥳 Fêtes de l'Année",
    color: "#E2F0D9",
    subs: [
      ["hiver", "❄️ Fêtes d'Hiver"],
      ["printemps", "🌸 Fêtes de Printemps"],
      ["ete-convivialite", "☀️ Été & Convivialité"],
      ["automne-sylvestre", "🍂 Automne & Sylvestre"],
    ],
  },
] as const;

type BookId = (typeof BOOKS)[number]["id"];

export function FetesNavigation({ showBack = false }: { showBack?: boolean }) {
  const [activeBook, setActiveBook] = useState<BookId | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const selectedBook = BOOKS.find((book) => book.id === activeBook);
  const selectedRecipes = activeBook && activeSub ? carnet.recipes.filter((recipe) => (activeBook === "annee" ? ["annee", "fetes_annee", "fetes-annee"].includes(recipe.fete || "") : recipe.fete === activeBook) && recipe.sous_fete === (activeBook === "noel" && activeSub === "plats-principaux" ? "plats" : activeBook === "halloween" && activeSub === "aperos-terrifiants" ? "aperos" : activeBook === "halloween" && activeSub === "plats-express" ? "express" : activeBook === "halloween" && activeSub === "atelier-monstres" ? "atelier" : activeSub)) : [];

  return (
    <section className="space-y-5">
      {showBack ? <BackButton /> : null}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1A1A1A] sm:text-3xl">🎉 Fêtes</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#1A1A1A] sm:text-base">
          Noël, Halloween, Pâques... Mettez les petits plats dans les grands sans y laisser votre calme. Sortez les paillettes, on gère le reste !
        </p>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Choisir un grand livre de fêtes">
        {BOOKS.map((book) => {
          const active = activeBook === book.id;
          return (
            <button
              key={book.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setActiveBook(active ? null : book.id);
                setActiveSub(null);
              }}
              style={{ backgroundColor: active ? "#8FA89B" : book.color }}
              className={`rounded-2xl border px-4 py-3 text-sm font-semibold text-[#1A1A1A] shadow-[0_4px_12px_rgba(43,43,43,0.09)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA89B] ${active ? "border-[#8FA89B]" : "border-white/70"}`}
            >
              {book.label}
            </button>
          );
        })}
      </div>

      {selectedBook ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">{selectedBook.label}</h2>
          <div className="flex flex-wrap gap-2" aria-label={`Sous-catégories de ${selectedBook.label}`}>
            {selectedBook.subs.map(([id, label]) => {
              const active = activeSub === id;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveSub(active ? null : id)}
                  className={`rounded-full border px-3 py-2 text-sm font-medium text-[#1A1A1A] shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA89B] ${active ? "border-[#8FA89B] bg-[#8FA89B]" : "border-[#E3DCD4] bg-[#F9F9F7] hover:border-[#8FA89B]"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {activeSub ? (selectedRecipes.length > 0 ? (
            <div className="space-y-3" aria-live="polite">
              <h3 className="font-heading text-lg text-[#1A1A1A]">{selectedRecipes.length} recette(s) dans cette rubrique</h3>
              <RecipeList items={selectedRecipes.map((recipe) => ({ id: recipe.id, name: `${String(recipe.numero || "").padStart(2, "0")}. ${recipe.name}`, lines: recipeLines(recipe) }))} />
            </div>
          ) : (
            <p className="rounded-2xl border border-[#E3DCD4] bg-[#F9F9F7] px-4 py-3 text-sm text-[#1A1A1A]" role="status">
              Cette rubrique est prête à accueillir ses recettes.
            </p>
          )) : null}
        </div>
      ) : null}
    </section>
  );
}
