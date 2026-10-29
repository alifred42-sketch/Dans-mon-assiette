"use client";

import { useEffect, useState } from "react";
import { BookOpen, X } from "lucide-react";

const paragraphs = [
  "Tout a commencé un mardi soir à 18h42, devant un frigo désespérément vide et une question qui résonnait comme une alerte générale : « Qu’est-ce qu’on mange ce soir ? ». Entre la panne d'idées, la course au supermarché et la charge mentale de la semaine, nous avons dit STOP. Il était temps de cuisiner de bons petits plats variés, parfois avec l'aide magique de notre robot préféré, mais surtout... sans y laisser notre santé mentale !",
  "Cuisine Chic Ouf, c’est l’application pensée pour les vrais rythmes de vie. Nous avons planifié pour vous 52 semaines de menus ultra-variés, des sessions de batchcooking optimisées à la minute près (à la main ou au robot Monsieur Cuisine), et des listes de courses intelligentes qui se trient toutes seules.",
  "Notre promesse ? Du lundi au jeudi, on mange sain, frais et varié (Cuisine Chic). Le week-end, place aux burgers et aux pizzas maison sans prise de tête. Et le dimanche soir, une fois le batchcooking terminé, on s'assoit sur le canapé et on souffle enfin... (OUF !). Bienvenue dans l'aventure zéro charge mentale et 100 % gourmande !",
];

export function NotreHistoireModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#8FA89B] bg-white/90 px-5 py-3 text-sm font-extrabold text-[#214E4B] shadow-sm transition hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8FA89B]/50"
        aria-haspopup="dialog"
      >
        <BookOpen size={18} aria-hidden="true" />
        Notre histoire...
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#102F2D]/75 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="notre-histoire-title"
            className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-[#F9F9F7] text-[#1A1A1A] shadow-2xl ring-1 ring-white/50"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[#DCE5DE] bg-white/80 px-5 py-5 sm:px-8 sm:py-6">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#668775]">Cuisine Chic Ouf !</p>
                <h2 id="notre-histoire-title" className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-[#214E4B] sm:text-4xl">Notre Histoire</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#555551] sm:text-base">Moins de charge mentale. Plus de bons petits plats. Et un grand OUF !</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer la fenêtre Notre histoire" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#E7EEE8] text-[#214E4B] transition hover:bg-[#D6E4D9] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8FA89B]/50">
                <X size={23} />
              </button>
            </header>
            <div className="overflow-y-auto px-5 py-6 sm:px-8 sm:py-7">
              <div className="space-y-5 text-base leading-7 sm:text-lg sm:leading-8">
                {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              <div className="mt-7 rounded-2xl bg-[#8FA89B]/20 p-5 sm:p-6">
                <p className="font-heading text-2xl font-bold text-[#214E4B]">Alors, on mange quoi ce soir ?</p>
                <p className="mt-2 text-sm leading-relaxed text-[#555551] sm:text-base">Votre semaine est déjà organisée. À vous les bons moments !</p>
              </div>
            </div>
            <footer className="border-t border-[#DCE5DE] bg-white/90 p-4 sm:px-8 sm:py-5">
              <button type="button" onClick={() => setOpen(false)} className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#214E4B] px-6 py-4 text-lg font-black text-white shadow-lg transition hover:bg-[#173C39] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8FA89B]/60">
                Fermer
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
