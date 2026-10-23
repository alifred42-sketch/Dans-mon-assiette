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
      <h2 className="font-extrabold">⚠️ Important — vérifiez chaque ingrédient</h2>
      <p className="mt-2">Les substitutions automatiques sont indicatives et ne garantissent pas que la recette soit sans gluten ni adaptée à la maladie cœliaque. Vérifiez systématiquement l’étiquette et la composition de chaque produit, y compris les avertissements de traces éventuelles, et prévenez les contaminations croisées pendant la préparation.</p>
      <p className="mt-2 font-semibold">En cas de doute, n’utilisez pas le produit. Les mentions et conseils de l’application ne remplacent pas la vérification des emballages ni l’avis d’un professionnel de santé.</p>
    </aside>
  );
}
