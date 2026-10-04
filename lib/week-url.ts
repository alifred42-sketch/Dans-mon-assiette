"use client";

import { useEffect } from "react";
import { useStore } from "./store";

/** Lit ?w= au chargement et l’écrit quand on change de semaine. */
export function useWeekNav() {
  const { week, setWeek } = useStore();

  useEffect(() => {
    const apply = () => {
      const raw = Number(new URLSearchParams(window.location.search).get("w"));
      if (raw >= 1 && raw <= 52) setWeek(raw);
    };
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, [setWeek]);

  const go = (w: number) => {
    const next = Math.min(52, Math.max(1, w));
    setWeek(next);
    const url = new URL(window.location.href);
    url.searchParams.set("w", String(next));
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  return { week, setWeek: go };
}
