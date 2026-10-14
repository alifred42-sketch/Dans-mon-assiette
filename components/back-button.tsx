"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function BackButton() {
  const pathname = usePathname();
  const currentPath = pathname.replace(/\/$/, "") || "/";
  const search = useSearchParams();
  const week = search.get("w");
  if (currentPath === "/") return null;
  const href = currentPath === "/semaine" ? "/" : week ? `/semaine?w=${week}` : currentPath.startsWith("/fiche/") || currentPath.startsWith("/carnet/") || (currentPath.startsWith("/recettes") && search.get("filter")) ? "/recettes" : "/";
  return (
    <Link href={href} className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#1A1A1A] hover:bg-[#E6DFD3]/60" aria-label="Retour">
      ⬅️ Retour
    </Link>
  );
}
