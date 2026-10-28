"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Refrigerator, Sparkles, ShoppingCart, ChevronDown } from "lucide-react";
import { carnet, currentIsoWeek, shoppingForWeek } from "@/lib/carnet";

const STOCK_KEY = "cuisine-chic-ouf-frigo-stock";
const EXTRA_PREFIX = "assiette-courses-extra-";

function fold(value: string) {
  return value.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/^\s*\d+(?:[.,]\d+)?\s*/, "").replace(/\b(?:kg|g|mg|l|cl|ml|cuilleres? a soupe|cuilleres? a cafe)\b/g, " ")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function ingredientLabel(value: string) {
  return value.split(/:\s*/, 1)[0].replace(/^\s*\d+(?:[.,]\d+)?\s*/, "").trim();
}
function categoryFor(value: string) {
  const v = fold(value);
  if (/courgette|carotte|tomate|oignon|poireau|salade|epinard|brocoli|chou|poivron|champignon|ail|pomme de terre|courge|concombre|legume/.test(v)) return "Légumes";
  if (/lait|creme|fromage|beurre|yaourt|skyr|oeuf|mozzarella|parmesan|feta/.test(v)) return "Crèmerie & œufs";
  if (/poulet|boeuf|porc|saumon|thon|cabillaud|poisson|jambon|dinde|saucisse/.test(v)) return "Viandes & poissons";
  if (/riz|pates|farine|lentille|pois chiche|haricot|huile|vinaigre|epice|curry|conserve|tomate concassee|bouillon|pain|semoule|couscous|quinoa/.test(v)) return "Épicerie";
  if (/pomme|poire|banane|fraise|framboise|orange|citron|fruit/.test(v)) return "Fruits";
  return "Autres";
}

type Match = { id: string; name: string; score: number; missing: string[]; matched: number; total: number };

export default function FrigoMagiquePage() {
  const [week, setWeek] = useState(1);
  const [query, setQuery] = useState("");
  const [customIngredient, setCustomIngredient] = useState("");
  const [stock, setStock] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [probable, setProbable] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ "Légumes": true, "Épicerie": true });

  useEffect(() => {
    const current = currentIsoWeek();
    setWeek(current);
    try {
      const saved = JSON.parse(localStorage.getItem(STOCK_KEY) || "[]");
      setStock(Array.isArray(saved) ? saved : []);
      const prefs = JSON.parse(localStorage.getItem("cuisine-chic-ouf-preferences") || "{}");
      const servings = JSON.parse(localStorage.getItem("assiette-recipe-servings") || "{}");
      const overrides = JSON.parse(localStorage.getItem("cuisine-chic-ouf-recipe-switches") || "{}");
      const prev = current === 1 ? 52 : current - 1;
      const checked = JSON.parse(localStorage.getItem("assiette-courses-" + prev) || "{}");
      const leftovers = shoppingForWeek(prev, servings, overrides, prefs)
        .filter((item) => !checked[item.aisle + "|" + item.label])
        .map((item) => ingredientLabel(item.label))
        .filter(Boolean);
      const unique = [...new Map(leftovers.map((item) => [fold(item), item])).values()].slice(0, 24);
      setProbable(unique);
      // Les restes probables sont cochés par défaut, sans effacer le stock déjà saisi.
      setStock((existing) => [...new Map([...unique, ...existing].map((item) => [fold(item), item])).values()]);
    } catch {
      setProbable([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STOCK_KEY, JSON.stringify(stock)); } catch {}
  }, [stock, ready]);

  function toggleIngredient(item: string) {
    setStock((current) => current.some((v) => fold(v) === fold(item))
      ? current.filter((v) => fold(v) !== fold(item))
      : [...current, item]);
  }
  function addIngredient() {
    const value = customIngredient.trim();
    if (!value) return;
    if (!stock.some((item) => fold(item) === fold(value))) setStock((items) => [...items, value]);
    setCustomIngredient("");
  }
  function addMissingToCourses(value: string) {
    try {
      const key = EXTRA_PREFIX + week;
      const current = JSON.parse(localStorage.getItem(key) || "[]");
      const next = Array.isArray(current) ? current : [];
      if (!next.some((item: string) => fold(item) === fold(value))) {
        localStorage.setItem(key, JSON.stringify([...next, value]));
      }
      window.dispatchEvent(new Event("cuisine-chic-ouf-courses-extra-change"));
    } catch {}
  }

  const groups = useMemo(() => {
    const all = [...new Map([...carnet.recipes.flatMap((r) => r.ingredients), ...stock, ...probable]
      .map((line) => [fold(ingredientLabel(line)), ingredientLabel(line)] as const).filter(([key, value]) => key && value)).values()];
    const filtered = all.filter((item) => !query || fold(item).includes(fold(query)));
    const grouped: Record<string, string[]> = {};
    for (const item of filtered) {
      const category = categoryFor(item);
      (grouped[category] ||= []).push(item);
    }
    return Object.fromEntries(Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, "fr")));
  }, [query, stock, probable]);

  const matches = useMemo<Match[]>(() => {
    if (!stock.length) return [];
    const pantry = stock.map(fold);
    return carnet.recipes.map((recipe) => {
      const ingredients = [...new Set(recipe.ingredients.map(ingredientLabel).filter((v) => v && !/sel|poivre|eau|herbes|épices|epices/i.test(v)))];
      if (!ingredients.length) return null;
      const found = ingredients.filter((ingredient) => {
        const candidate = fold(ingredient);
        return pantry.some((item) => item && (item.includes(candidate) || candidate.includes(item)));
      });
      const missing = ingredients.filter((ingredient) => !found.includes(ingredient));
      const score = Math.round((found.length / ingredients.length) * 100);
      if (missing.length > 2 || found.length === 0) return null;
      return { id: recipe.id, name: recipe.name, score, missing, matched: found.length, total: ingredients.length };
    }).filter((item): item is Match => item !== null)
      .sort((a, b) => b.score - a.score || a.missing.length - b.missing.length)
      .slice(0, 30);
  }, [stock]);

  const categories = ["Légumes", "Fruits", "Crèmerie & œufs", "Viandes & poissons", "Épicerie", "Autres"];
  return (
    <div className="space-y-6 pb-6 text-[#1A1A1A]">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#8FA89B]/20"><Refrigerator className="size-7 text-[#315E59]" /></span>
          <div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#668775]">Anti-gaspi intelligent</p><h1 className="font-heading text-3xl font-bold">Le Frigo Magique ✨</h1></div>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); addIngredient(); }} className="flex gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-[#D8D8D0] bg-white px-3 shadow-sm">
            <Search className="size-5 shrink-0 text-[#668775]" />
            <input value={customIngredient} onChange={(event) => setCustomIngredient(event.target.value)} placeholder="Ajouter un ingrédient oublié..." className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" />
          </label>
          <button type="submit" className="rounded-2xl bg-[#315E59] px-4 font-bold text-white" aria-label="Ajouter l’ingrédient"><Plus className="size-5" /></button>
        </form>
      </header>

      <section className="space-y-3 rounded-3xl border border-[#E4E9E1] bg-[#F4F8F1] p-4">
        <h2 className="flex items-center gap-2 font-heading text-xl font-bold"><Sparkles className="size-5 text-[#668775]" /> Vos restes probables</h2>
        <p className="text-sm text-[#555D52]">Les ingrédients non cochés dans les courses de la semaine précédente sont proposés automatiquement. Décoche ceux que tu n’as plus.</p>
        <div className="flex flex-wrap gap-2">
          {probable.length ? probable.map((item) => {
            const selected = stock.some((value) => fold(value) === fold(item));
            return <button key={item} type="button" aria-pressed={selected} onClick={() => toggleIngredient(item)} className={`rounded-full border px-3 py-2 text-sm font-semibold ${selected ? "border-[#6E9B79] bg-[#DDEEDB] text-[#254D30]" : "border-[#D8D8D0] bg-white text-[#777773] line-through"}`}>{selected ? "✓ " : ""}{item}</button>;
          }) : <p className="text-sm text-[#777773]">Aucun reste détecté pour le moment.</p>}
        </div>
      </section>

      <section className="space-y-3">
        <div><h2 className="font-heading text-xl font-bold">Frigo & Placards</h2><p className="text-sm text-muted-foreground">Coche les ingrédients que tu as sous la main.</p></div>
        <div className="flex flex-wrap gap-2">{stock.map((item) => <button key={item} type="button" onClick={() => toggleIngredient(item)} className="rounded-full bg-[#315E59] px-3 py-1.5 text-sm font-semibold text-white">{item} ×</button>)}</div>
        <div className="space-y-2">
          {categories.filter((category) => groups[category]?.length).map((category) => (
            <details key={category} open={Boolean(openGroups[category])} onToggle={(event) => setOpenGroups((prev) => ({ ...prev, [category]: (event.currentTarget as HTMLDetailsElement).open }))} className="overflow-hidden rounded-2xl border border-[#E7E5DE] bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-bold">{category}<ChevronDown className="size-4" /></summary>
              <div className="grid grid-cols-2 gap-2 p-3 pt-0 sm:grid-cols-3">
                {groups[category].map((item) => {
                  const checked = stock.some((value) => fold(value) === fold(item));
                  return <label key={item} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2 text-sm ${checked ? "border-[#8FA89B] bg-[#EAF4E8]" : "border-[#E7E5DE] bg-[#FAFAF7]"}`}><input type="checkbox" checked={checked} onChange={() => toggleIngredient(item)} className="size-4 accent-[#668775]" /><span>{item}</span></label>;
                })}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2"><div><h2 className="font-heading text-xl font-bold">Recettes possibles</h2><p className="text-sm text-muted-foreground">Correspondance par ingrédients, avec 2 ingrédients manquants maximum.</p></div><span className="rounded-full bg-[#EAF4E8] px-3 py-1 text-sm font-bold text-[#315E59]">{matches.length}</span></div>
        {!stock.length ? <p className="rounded-2xl bg-white p-5 text-sm text-muted-foreground">Ajoute ou coche quelques ingrédients pour lancer la recherche.</p> : matches.length ? matches.map((match) => (
          <article key={match.id} className="space-y-2 rounded-2xl border border-[#E7E5DE] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3"><h3 className="font-bold leading-snug">{match.name}</h3><span className="shrink-0 rounded-full bg-[#DDEEDB] px-2 py-1 text-xs font-extrabold text-[#315E59]">{match.score}%</span></div>
            <p className="text-xs text-muted-foreground">{match.matched}/{match.total} ingrédients présents</p>
            {match.missing.length ? <div className="flex flex-wrap items-center gap-2 text-sm"><span>Il vous manque :</span>{match.missing.map((item) => <span key={item} className="inline-flex items-center gap-1 rounded-full bg-[#F7F1E8] px-2 py-1">{item}<button type="button" title={"Ajouter " + item + " aux courses"} onClick={() => addMissingToCourses(item)} className="rounded-full p-0.5 text-[#315E59] hover:bg-white"><Plus className="size-4" /></button></span>)}</div> : <p className="text-sm font-semibold text-[#315E59]">Tous les ingrédients principaux sont là !</p>}
            <Link href={`/fiche/${match.id}`} className="inline-flex rounded-xl bg-[#315E59] px-3 py-2 text-sm font-bold text-white">Voir la recette</Link>
          </article>
        )) : <p className="rounded-2xl bg-white p-5 text-sm text-muted-foreground">Aucune recette ne correspond avec 2 ingrédients manquants maximum.</p>}
      </section>
      <Link href={`/courses?w=${week}&manual=1`} className="flex items-center justify-center gap-2 rounded-2xl bg-[#E6DFD3] px-4 py-3 font-bold text-[#2B2B2B]"><ShoppingCart className="size-5" /> Ouvrir mes courses de la semaine {week}</Link>
      {ready ? <p className="text-center text-xs text-muted-foreground">Stock enregistré sur cet appareil.</p> : null}
    </div>
  );
}
