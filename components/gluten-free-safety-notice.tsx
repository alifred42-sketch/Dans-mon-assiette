"use client";

import { useEffect, useState } from "react";

export function GlutenFreeSafetyNotice() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const refresh = () => {
      try {
        const prefs = JSON.parse(localStorage.getItem("cuisine-chic-ouf-preferences") || "{}");
        setEnabled(Boolean(prefs.sansGluten));
      } catch { setEnabled(false); }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cuisine-chic-ouf-preferences-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("cuisine-chic-ouf-preferences-change", refresh);
    };
  }, []);
  if (!enabled) return null;
  return (
    <aside role="alert" aria-live="polite" className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
      <h2 className="font-extrabold">💡 Aide à l’adaptation des recettes — sans gluten</h2>
      <p className="mt-2">Cette option aide à adapter certaines recettes en proposant des substitutions d’ingrédients. Elle ne certifie pas qu’une recette soit sans gluten et ne garantit pas qu’elle convienne aux personnes atteintes de maladie cœliaque. Vérifiez toujours la composition et l’étiquette de chaque produit, y compris les mentions de traces éventuelles, et évitez les contaminations croisées pendant la préparation.</p>
      <p className="mt-2 font-semibold">En cas de doute, n’utilisez pas le produit. Cette aide ne remplace ni la vérification des emballages ni les conseils d’un professionnel de santé.</p>
    </aside>
  );
}
