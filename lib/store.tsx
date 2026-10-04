"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

  const goWeek = useCallback((w: number) => setWeek(Math.min(52, Math.max(1, w))), []);
  const setSlot = useCallback(
    (key: string, recipeId: string | null) =>
      setOverrides((prev) => ({ ...prev, [key]: recipeId })),
    []
  );
  const toggleChecked = useCallback(
    (key: string) => setChecked((prev) => ({ ...prev, [key]: !prev[key] })),
    []
  );
  const clearWeekOverrides = useCallback((w: number) => {
    setOverrides((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (k.startsWith(`${w}_`)) delete next[k];
      }
      return next;
    });
  }, []);

  const value = useMemo<Store>(
    () => ({
      ready,
      week,
      setWeek: goWeek,
      servings,
      setServings,
      overrides,
      setSlot,
      checked,
      toggleChecked,
      clearWeekOverrides,
    }),
    [ready, week, goWeek, servings, overrides, setSlot, checked, toggleChecked, clearWeekOverrides]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}
