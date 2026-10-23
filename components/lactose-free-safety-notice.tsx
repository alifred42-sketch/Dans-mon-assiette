"use client";

import { useEffect, useState } from "react";

export function LactoseFreeSafetyNotice() {
  const [isLactoseFree, setIsLactoseFree] = useState(false);
  useEffect(() => {
    const refresh = () => {
      try {
        const prefs = JSON.parse(localStorage.getItem("cuisine-chic-ouf-preferences") || "{}");
        setIsLactoseFree(Boolean(prefs.sansLactose || prefs.isLactoseFree));
      } catch { setIsLactoseFree(false); }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cuisine-chic-ouf-preferences-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("cuisine-chic-ouf-preferences-change", refresh);
    };
  }, []);
  if (!isLactoseFree) return null;
  return (
    <aside role="status" aria-live="polite" className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
      <h2 className="font-extrabold">💡 Aide à l’adaptation des recettes — sans lactose</h2>
      <p className="mt-2">Cette option propose des substitutions indicatives pour certains ingrédients laitiers. Elle ne garantit pas que chaque recette ou produit soit sans lactose. Vérifiez les étiquettes et la composition des produits choisis, notamment les mentions relatives au lactose.</p>
      <p className="mt-2 font-semibold">En cas de doute, vérifiez auprès du fabricant ou d’un professionnel de santé. Cette aide ne remplace pas la lecture des emballages ni un avis médical.</p>
    </aside>
  );
}
