"use client";

import { useEffect, useState } from "react";
import { adaptGlutenFreeText } from "@/lib/ingredient-substitutions";
import { CookingTimerText } from "@/components/cooking-timer-text";
import { ListenStep } from "@/components/listen-step";

function useSansGluten() {
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
  return enabled;
}

export function GlutenFreeText({ text }: { text: string }) {
  const enabled = useSansGluten();
  return <>{adaptGlutenFreeText(text, enabled)}</>;
}

export function GlutenFreeTimerText({ text }: { text: string }) {
  const enabled = useSansGluten();
  const adapted = adaptGlutenFreeText(text, enabled);
  return <><CookingTimerText text={adapted} /><ListenStep text={adapted} /></>;
}
