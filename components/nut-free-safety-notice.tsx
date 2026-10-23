"use client";

import { useEffect, useState } from "react";

export function NutFreeSafetyNotice() {
  const [isNutFree, setIsNutFree] = useState(false);
  useEffect(() => {
    const refresh = () => {
      try {
        const prefs = JSON.parse(localStorage.getItem("cuisine-chic-ouf-preferences") || "{}");
        setIsNutFree(Boolean(prefs.sansFruitsCoque || prefs.isNutFree));
      } catch { setIsNutFree(false); }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cuisine-chic-ouf-preferences-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("cuisine-chic-ouf-preferences-change", refresh);
    };
  }, []);
  if (!isNutFree) return null;
  return (
    <aside role="alert" aria-live="polite" className="rounded-2xl border-2 border-red-600 bg-red-50 p-4 text-sm leading-relaxed text-red-950">
      <h2 className="font-extrabold">⚠️ Allergie aux fruits à coque : vigilance indispensable</h2>
      <p className="mt-2">Les substitutions proposées sont indicatives et ne garantissent pas qu’une recette ou un produit soit sans fruits à coque. Vérifiez systématiquement la liste complète des ingrédients et les avertissements de traces sur chaque emballage, y compris pour les graines, le tahini, les pignons, le pesto et les produits de remplacement.</p>
      <p className="mt-2 font-semibold">En cas d’allergie, évitez tout produit dont la sécurité n’est pas confirmée. Les contaminations croisées sont possibles ; cette aide ne remplace pas les étiquettes ni les conseils de votre allergologue.</p>
    </aside>
  );
}
