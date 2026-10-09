"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Alternative = { id: string; name: string };
function scaleLine(line: string, factor: number) {
  if (factor === 1) return line;
  return line.replace(/\d+(?:[.,]\d+)?/g, (match) => {
    const n = Number(match.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0 || n > 1000) return match;
    const scaled = Math.round(n * factor * 100) / 100;
    return String(scaled).replace(".", ",");
  });
}

export function RecipeTools({ recipeId, ingredients, alternatives, baseServings = 4 }: { recipeId: string; ingredients: string[]; alternatives: Alternative[]; baseServings?: number }) {
  const [servings, setServings] = useState(baseServings);
  const [ready, setReady] = useState(false);
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem("assiette-recipe-servings") || "{}") as Record<string, number>; if (saved[recipeId]) setServings(saved[recipeId]); else setServings(baseServings); } catch {} setReady(true); }, [recipeId, baseServings]);
  useEffect(() => { if (!ready) return; try { const saved = JSON.parse(localStorage.getItem("assiette-recipe-servings") || "{}") as Record<string, number>; saved[recipeId] = servings; localStorage.setItem("assiette-recipe-servings", JSON.stringify(saved)); window.dispatchEvent(new CustomEvent("assiette-servings-change")); } catch {} }, [recipeId, servings, ready]);
  const [showSos, setShowSos] = useState(false);
  const scaled = useMemo(() => ingredients.map((line) => scaleLine(line, servings / baseServings)), [ingredients, servings]);
  return (
    <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-[#1A1A1A]">👥 Nombre de convives</h2>
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Retirer une personne" onClick={() => setServings(n => Math.max(1,n-1))} className="size-9 rounded-full bg-[#E6DFD3] text-lg font-bold">−</button>
          <strong className="min-w-5 text-center">{servings}</strong>
          <button type="button" aria-label="Ajouter une personne" onClick={() => setServings(n => Math.min(20,n+1))} className="size-9 rounded-full bg-[#8FA89B] text-lg font-bold text-white">+</button>
        </div>
      </div>
      <p className="text-xs text-[#6B6B67]">Quantités indicatives calculées à partir d’une base de {baseServings} personne{baseServings > 1 ? "s" : ""}.</p>
      <div className="space-y-2">
        <h3 className="font-heading text-lg font-semibold text-[#2B2B2B]">🛒 Ingrédients pour {servings} personne{servings > 1 ? "s" : ""}</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed">{scaled.map((line,i)=><li key={i}>{line}</li>)}</ul>
      </div>
      <button type="button" onClick={() => setShowSos(v => !v)} className="rounded-xl border border-[#E9E9E4] px-3 py-2 text-sm font-semibold text-[#1A1A1A]">😴 SOS Flemme — 3 idées rapides</button>
      {showSos && <div className="grid gap-2 sm:grid-cols-3">{alternatives.slice(0,3).map(a=><Link key={a.id} href={"/fiche/"+a.id} className="rounded-xl bg-[#EADAEC] p-3 text-sm font-semibold text-[#1A1A1A]">{a.name}</Link>)}</div>}
    </section>
  );
}
