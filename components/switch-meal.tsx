"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Repeat2 } from "lucide-react";
import { seasonalReplacement, weekPlan, type PlanningPreferences } from "@/lib/carnet";

type Slot = { week: number; day: string; meal: string; name: string; recipeId: string | null };
type Props = { slot: Slot; onChanged?: () => void };

export function SwitchMeal({ slot, onChanged }: Props) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  function replaceMeal() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const key = "cuisine-chic-ouf-recipe-switches";
      const overrides = JSON.parse(localStorage.getItem(key) || "{}") as Record<string, string>;
      let preferences: PlanningPreferences = {};
      try { preferences = JSON.parse(localStorage.getItem("cuisine-chic-ouf-preferences") || "{}") as PlanningPreferences; } catch { preferences = {}; }
      const currentPlan = weekPlan(slot.week, overrides, preferences);
      const excludedIds = new Set(
        currentPlan
          .filter((item) => !(item.day === slot.day && item.meal === slot.meal))
          .map((item) => item.recipeId)
          .filter((id): id is string => Boolean(id)),
      );
      const replacement = seasonalReplacement(slot.week, slot.recipeId, excludedIds, preferences);
      if (!replacement) {
        setMessage("Aucune autre recette complète de saison disponible pour ce repas.");
        return;
      }
      overrides[`${slot.week}|${slot.day}|${slot.meal}`] = replacement.id;
      localStorage.setItem(key, JSON.stringify(overrides));
      window.dispatchEvent(new Event("cuisine-chic-ouf-plan-change"));
      onChanged?.();
      router.refresh();
      setMessage(`Remplacé par : ${replacement.name}`);
    } catch {
      setMessage("Le remplacement n’a pas pu être enregistré. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex items-center">
      <button
        type="button"
        onClick={replaceMeal}
        disabled={busy}
        aria-label={`Remplacer automatiquement le repas ${slot.meal} du ${slot.day.toLocaleLowerCase("fr")}`}
        title="Remplacer par une autre recette complète de saison"
        className="inline-flex size-7 items-center justify-center rounded-lg text-[#668775] transition hover:bg-[#8FA89B]/15 hover:text-[#466653] disabled:opacity-50"
      >
        <Repeat2 aria-hidden="true" className="size-4" />
      </button>
      {message ? <p role="status" className="mt-1 text-xs text-[#555551]">{message}</p> : null}
    </div>
  );
}
