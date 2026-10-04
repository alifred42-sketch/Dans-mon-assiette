"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function FicheBack({
  fromCol,
}: {
  fromCol?: { slug: string; name: string };
}) {
  const search = useSearchParams();
  const week = search.get("w");
  const href = week ? `/?w=${week}` : fromCol ? `/carnet/${fromCol.slug}` : "/recettes";
  const label = week ? `← Semaine ${week}` : fromCol ? `← ${fromCol.name}` : "← Carnet";
  return (
    <Link href={href} className="text-sm text-primary underline underline-offset-4">
      {label}
    </Link>
  );
}
