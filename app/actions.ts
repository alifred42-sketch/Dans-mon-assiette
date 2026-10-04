"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CHECKED_COOKIE, OVERRIDE_COOKIE } from "@/lib/prefs";

export async function replaceMeal(formData: FormData) {
  const jar = await cookies();
  const key = String(formData.get("key") || "");
  const recipeId = String(formData.get("recipeId") ?? "");
  const week = String(formData.get("week") || "1");
  let overrides: Record<string, string | null> = {};
  try {
    overrides = JSON.parse(jar.get(OVERRIDE_COOKIE)?.value || "{}");
  } catch {
    overrides = {};
  }
  if (key) overrides[key] = recipeId === "" ? null : recipeId;
  jar.set(OVERRIDE_COOKIE, JSON.stringify(overrides), {
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  revalidatePath("/semaine");
  revalidatePath("/courses");
  revalidatePath("/batch");
  redirect(`/semaine?w=${week}`);
}

export async function clearWeekReplacements(formData: FormData) {
  const jar = await cookies();
  const week = String(formData.get("week") || "1");
  let overrides: Record<string, string | null> = {};
  try {
    overrides = JSON.parse(jar.get(OVERRIDE_COOKIE)?.value || "{}");
  } catch {
    overrides = {};
  }
  for (const k of Object.keys(overrides)) {
    if (k.startsWith(`${week}_`)) delete overrides[k];
  }
  jar.set(OVERRIDE_COOKIE, JSON.stringify(overrides), {
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  revalidatePath("/semaine");
  revalidatePath("/courses");
  revalidatePath("/batch");
  redirect(`/semaine?w=${week}`);
}

export async function toggleChecked(formData: FormData) {
  const jar = await cookies();
  const key = String(formData.get("key") || "");
  const week = String(formData.get("week") || "1");
  const servings = String(formData.get("n") || "2");
  let checked: Record<string, boolean> = {};
  try {
    checked = JSON.parse(jar.get(CHECKED_COOKIE)?.value || "{}");
  } catch {
    checked = {};
  }
  if (key) checked[key] = !checked[key];
  jar.set(CHECKED_COOKIE, JSON.stringify(checked), {
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  revalidatePath("/courses");
  redirect(`/courses?w=${week}&n=${servings}`);
}
