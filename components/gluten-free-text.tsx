"use client";

import { useEffect, useState } from "react";
import { adaptGlutenFreeText, adaptLactoseFreeText, adaptNutFreeText } from "@/lib/ingredient-substitutions";
import { CookingTimerText } from "@/components/cooking-timer-text";
import { ListenStep } from "@/components/listen-step";

function useDietaryAdaptations() {
  const [sansGluten, setSansGluten] = useState(false);
  const [isLactoseFree, setIsLactoseFree] = useState(false);
  const [isNutFree, setIsNutFree] = useState(false);
  useEffect(() => {
    const refresh = () => {
      try {
        const prefs = JSON.parse(localStorage.getItem("cuisine-chic-ouf-preferences") || "{}");
        setSansGluten(Boolean(prefs.sansGluten));
        setIsLactoseFree(Boolean(prefs.sansLactose || prefs.isLactoseFree));
        setIsNutFree(Boolean(prefs.sansFruitsCoque || prefs.isNutFree));
      } catch { setSansGluten(false); setIsLactoseFree(false); setIsNutFree(false); }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cuisine-chic-ouf-preferences-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("cuisine-chic-ouf-preferences-change", refresh);
    };
  }, []);
  return { sansGluten, isLactoseFree, isNutFree };
}

export function GlutenFreeText({ text }: { text: string }) {
  const { sansGluten, isLactoseFree, isNutFree } = useDietaryAdaptations();
  return <>{adaptNutFreeText(adaptLactoseFreeText(adaptGlutenFreeText(text, sansGluten), isLactoseFree), isNutFree)}</>;
}

export function GlutenFreeTimerText({ text }: { text: string }) {
  const { sansGluten, isLactoseFree, isNutFree } = useDietaryAdaptations();
  const adapted = adaptNutFreeText(adaptLactoseFreeText(adaptGlutenFreeText(text, sansGluten), isLactoseFree), isNutFree);
  return <><CookingTimerText text={adapted} /><ListenStep text={adapted} /></>;
}
