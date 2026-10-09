"use client";

import { useLayoutEffect, useRef, useState } from "react";

export type CheckItem = {
  id: string;
  title: string;
  detail?: string;
  group?: string;
};

function loadStore(key: string): Record<string, boolean> {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function CheckList({
  storageKey,
  items,
}: {
  storageKey: string;
  items: CheckItem[];
}) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);
  const touched = useRef(false);

  useLayoutEffect(() => {
    if (!touched.current) {
      setChecked(loadStore(storageKey));
    }
    setReady(true);
  }, [storageKey]);

  function toggle(id: string) {
    touched.current = true;
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
  const sortedItems = [...items].sort((a, b) => Number(!!checked[a.id]) - Number(!!checked[b.id]) || (a.group || "").localeCompare(b.group || "", "fr") || a.title.localeCompare(b.title, "fr"));
  const pending = sortedItems.filter((item) => !checked[item.id]);
  const doneItems = sortedItems.filter((item) => !!checked[item.id]);
  const renderGroup = (rows: CheckItem[]) => {
    let lastGroup: string | undefined;
    return rows.map((item) => {
      const done = !!checked[item.id];
      const showGroup = item.group && item.group !== lastGroup;
      lastGroup = item.group;
      return (
        <li key={item.id} className={done ? "opacity-50 transition-opacity" : "bg-[#8FA89B]/10 transition-colors"}>
          {showGroup ? <p className="bg-[#E6DFD3] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#2B2B2B]">{item.group}</p> : null}
          <label className="flex cursor-pointer items-start gap-3 px-4 py-4 [touch-action:manipulation]">
            <input type="checkbox" className="mt-1 size-7 shrink-0 accent-[#8FA89B]" checked={done} onChange={() => toggle(item.id)} />
            <span className={done ? "text-muted-foreground" : "text-[#668775]"}>
              <span className="block font-medium leading-snug">{item.title}</span>
              {item.detail ? <span className="mt-1 block text-xs text-muted-foreground no-underline">{item.detail}</span> : null}
            </span>
          </label>
        </li>
      );
    });
  };

