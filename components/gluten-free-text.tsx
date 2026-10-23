"use client";

import { useEffect, useState } from "react";
import { adaptGlutenFreeText, adaptLactoseFreeText } from "@/lib/ingredient-substitutions";
import { CookingTimerText } from "@/components/cooking-timer-text";
import { ListenStep } from "@/components/listen-step";

function useDietaryAdaptations() {
  const [sansGluten, setSansGluten] = useState(false);
  const [isLactoseFree, setIsLactoseFree] = useState(false);
  useEffect(() => {
    const refresh = () => {
      try {
        const prefs = JSON.parse(localStorage.getItem("cuisine-chic-ouf-preferences") || "{}");
        setSansGluten(Boolean(prefs.sansGluten));
        setIsLactoseFree(Boolean(prefs.sansLactose || prefs.isLactoseFree));
      } catch { setSansGluten(false); setIsLactoseFree(false); }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cuisine-chic-ouf-preferences-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("cuisine-chic-ouf-preferences-change", refresh);
    };
  }, []);
  return { sansGluten, isLactoseFree };
}

export function GlutenFreeText({ text }: { text: string }) {
  const { sansGluten, isLactoseFree } = useDietaryAdaptations();
  return <>{adaptLactoseFreeText(adaptGlutenFreeText(text, sansGluten), isLactoseFree)}</>;
}

export function GlutenFreeTimerText({ text }: { text: string }) {
  const { sansGluten, isLactoseFree } = useDietaryAdaptations();
  const adapted = adaptLactoseFreeText(adaptGlutenFreeText(text, sansGluten), isLactoseFree);
  return <><CookingTimerText text={adapted} /><ListenStep text={adapted} /></>;
}
