"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { carnet, getRecipe, isPlaceholderIngredient } from "@/lib/carnet";

type Slot = { week: number; day: string; meal: string; name: string; recipeId: string | null };
type Props = { slot: Slot; onChanged?: () => void };

function complete(id: string | null) {
  const recipe = getRecipe(id);
  if (!recipe) return false;
  const ingredients = recipe.ingredients.filter((x) => x.trim() && !isPlaceholderIngredient(x));
  const steps = recipe.steps.filter((x) => x.trim());
  return ingredients.length >= 2 && steps.length >= 2;
}

export function SwitchMeal({ slot, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(slot.recipeId || "");
  const router = useRouter();
  useEffect(() => { setSelected(slot.recipeId || ""); }, [slot.recipeId]);
  const alternatives = carnet.recipes
    .filter((r) => r.id !== slot.recipeId && complete(r.id))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  function save() {
    if (!selected) return;
    try {
      const key = "cuisine-chic-ouf-recipe-switches";
      const current = JSON.parse(localStorage.getItem(key) || "{}") as Record<string, string>;
      current[`${slot.week}|${slot.day}|${slot.meal}`] = selected;
      localStorage.setItem(key, JSON.stringify(current));
      window.dispatchEvent(new Event("cuisine-chic-ouf-plan-change"));
      setOpen(false);
      onChanged?.();
      router.refresh();
    } catch {
      setOpen(false);
    }
  }

  return (
    <div className="mt-2">
      <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-xl border border-[#8FA89B]/60 px-3 py-2 text-sm font-semibold text-[#1A1A1A] shadow-sm hover:bg-[#8FA89B]/10">
        ⇄ Changer cette recette
      </button>
      {open ? (
        <div className="mt-2 rounded-2xl border border-[#E9E9E4] bg-white p-3 shadow-md">
          <label className="mb-2 block text-sm font-semibold" htmlFor={`switch-${slot.week}-${slot.day}-${slot.meal}`}>Choisir une autre recette complète</label>
          <select id={`switch-${slot.week}-${slot.day}-${slot.meal}`} value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full rounded-xl border border-[#D8D8D2] bg-white p-3 text-sm text-[#1A1A1A]">
            {alternatives.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={save} className="rounded-xl bg-[#8FA89B] px-4 py-2 text-sm font-bold text-white shadow-sm">Valider</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm font-semibold">Annuler</button>
          </div>
          <p className="mt-2 text-xs text-[#6B6B67]">Les courses sont recalculées à partir de la recette choisie.</p>
        </div>
      ) : null}
    </div>
  );
}
