export type VirtualFrozenMeal = {
  id: string;
  recipeId: string;
  recipeName: string;
  portions: number;
  preparedWeek: number;
  availableWeek: number;
  status: "stored" | "scheduled" | "used";
  scheduledWeek?: number;
  scheduledDay?: string;
  scheduledMeal?: string;
};

const STORAGE_KEY = "cuisine-chic-ouf-virtual-freezer";
const DINNER_SLOTS = ["MARDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];

export function readVirtualFreezer(): VirtualFrozenMeal[] {
  if (typeof window === "undefined") return [];
  try {
    const data = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data.filter((item) => item && typeof item.recipeId === "string") : [];
  } catch {
    return [];
  }
}

function writeVirtualFreezer(items: VirtualFrozenMeal[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("cuisine-chic-ouf-freezer-change"));
  } catch {}
}

export function saveFrozenMeal(input: Omit<VirtualFrozenMeal, "id" | "status" | "availableWeek" | "scheduledWeek" | "scheduledDay" | "scheduledMeal">): VirtualFrozenMeal {
  const availableWeek = ((Math.max(1, Math.min(52, input.preparedWeek)) - 1 + 3) % 52) + 1;
  const item: VirtualFrozenMeal = {
    ...input,
    id: input.recipeId + "-week-" + input.preparedWeek + "-" + Date.now(),
    portions: Math.max(1, Math.round(input.portions)),
    availableWeek,
    status: "stored",
  };
  const current = readVirtualFreezer();
  writeVirtualFreezer([...current, item]);
  return item;
}

export function getFreezerPlan(week: number, manualOverrides: Record<string, string> = {}) {
  const items = readVirtualFreezer();
  const overrides = { ...manualOverrides };
  const slotKeys: string[] = [];
  const scheduled: VirtualFrozenMeal[] = [];
  const usedSlots = new Set<string>();
  const due = items.filter((item) => item.status === "stored" && item.availableWeek === week);
  for (const item of due) {
    const day = DINNER_SLOTS.find((candidate) => {
      const key = week + "|" + candidate + "|Soir";
      return !overrides[key] && !usedSlots.has(key);
    });
    if (!day) continue;
    const key = week + "|" + day + "|Soir";
    overrides[key] = item.recipeId;
    usedSlots.add(key);
    slotKeys.push(key);
    scheduled.push({ ...item, status: "scheduled", scheduledWeek: week, scheduledDay: day, scheduledMeal: "Soir" });
  }
  if (scheduled.length) {
    const scheduledById = new Map(scheduled.map((item) => [item.id, item]));
    writeVirtualFreezer(items.map((item) => scheduledById.get(item.id) || item));
  }
  return { overrides, slotKeys, scheduled };
}

export function markFrozenMealUsed(id: string) {
  const items = readVirtualFreezer();
  writeVirtualFreezer(items.map((item) => item.id === id ? { ...item, status: "used" } : item));
}

export function rescheduleFrozenMeal(id: string, week: number) {
  const items = readVirtualFreezer();
  writeVirtualFreezer(items.map((item) => item.id === id
    ? { ...item, status: "stored", availableWeek: Math.max(1, Math.min(52, week)), scheduledWeek: undefined, scheduledDay: undefined, scheduledMeal: undefined }
    : item));
}

export function virtualFreezerStorageKey() {
  return STORAGE_KEY;
}
