"use client";

import { useEffect, useState } from "react";

export type CheckItem = {
  id: string;
  title: string;
  detail?: string;
  group?: string;
};

export function CheckList({
  storageKey,
  items,
}: {
  storageKey: string;
  items: CheckItem[];
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setChecked(JSON.parse(localStorage.getItem(storageKey) || "{}"));
    } catch {
      setChecked({});
    }
    setReady(true);
  }, [storageKey]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-muted/70 p-6 text-center text-sm text-muted-foreground">
        Rien à afficher pour cette semaine.
      </p>
    );
  }

  const remaining = items.filter((item) => !checked[item.id]).length;
  let lastGroup: string | undefined;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {items.length} lignes · {ready ? remaining : items.length} encore à faire.
      </p>
      <ul className="divide-y overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
        {items.map((item) => {
          const done = ready && !!checked[item.id];
          const showGroup = item.group && item.group !== lastGroup;
          lastGroup = item.group;
          return (
            <li key={item.id}>
              {showGroup ? (
                <p className="bg-muted/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.group}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={done}
                className="flex w-full items-start gap-3 px-4 py-4 text-left [touch-action:manipulation]"
              >
                <span
                  className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold ${
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-foreground/40 bg-background"
                  }`}
                  aria-hidden
                >
                  {done ? "✓" : ""}
                </span>
                <span className={done ? "text-muted-foreground line-through" : ""}>
                  <span className="block font-medium leading-snug">{item.title}</span>
                  {item.detail ? (
                    <span className="mt-1 block text-xs text-muted-foreground no-underline">
                      {item.detail}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
