import { cookies } from "next/headers";

export const OVERRIDE_COOKIE = "assiette-overrides";
export const CHECKED_COOKIE = "assiette-checked";

export function clampWeek(raw: string | undefined | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  return Math.min(52, Math.max(1, Math.round(n)));
}

export function clampServings(raw: string | undefined | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 2;
  return Math.min(6, Math.max(1, Math.round(n)));
}

export async function getOverrides(): Promise<Record<string, string | null>> {
  const jar = await cookies();
  try {
    return JSON.parse(jar.get(OVERRIDE_COOKIE)?.value || "{}");
  } catch {
    return {};
  }
}

export async function getChecked(): Promise<Record<string, boolean>> {
  const jar = await cookies();
  try {
    return JSON.parse(jar.get(CHECKED_COOKIE)?.value || "{}");
  } catch {
    return {};
  }
}
