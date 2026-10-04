"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Store = {
  ready: boolean;
  week: number;
  setWeek: (w: number) => void;
  servings: number;
  setServings: (n: number) => void;
  overrides: Record<string, string | null>;
  setSlot: (key: string, recipeId: string | null) => void;
  checked: Record<string, boolean>;
  toggleChecked: (key: string) => void;
  clearWeekOverrides: (week: number) => void;
};

const Ctx = createContext<Store | null>(null);
const KEY = "assiette-carnet-v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [week, setWeek] = useState(1);
  const [servings, setServings] = useState(2);
  const [overrides, setOverrides] = useState<Record<string, string | null>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.week) setWeek(parsed.week);
        if (parsed.servings) setServings(parsed.servings);
        if (parsed.overrides) setOverrides(parsed.overrides);
        if (parsed.checked) setChecked(parsed.checked);
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify({ week, servings, overrides, checked }));
  }, [ready, week, servings, overrides, checked]);

  const value = useMemo<Store>(
    () => ({
      ready,
      week,
      setWeek: (w) => setWeek(Math.min(52, Math.max(1, w))),
      servings,
      setServings,
      overrides,
      setSlot: (key, recipeId) =>
        setOverrides((prev) => ({ ...prev, [key]: recipeId })),
      checked,
      toggleChecked: (key) =>
        setChecked((prev) => ({ ...prev, [key]: !prev[key] })),
      clearWeekOverrides: (w) =>
        setOverrides((prev) => {
          const next = { ...prev };
          for (const k of Object.keys(next)) {
            if (k.startsWith(`${w}_`)) delete next[k];
          }
          return next;
        }),
    }),
    [ready, week, servings, overrides, checked]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}
