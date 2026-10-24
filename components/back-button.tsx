"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function BackButton() {
  const pathname = usePathname();
  const currentPath = pathname.replace(/\/$/, "") || "/";
  const search = useSearchParams();
  const week = search.get("w");
  if (currentPath === "/") return null;
  const href = currentPath === "/semaine" ? "/" : week ? `/semaine?w=${week}` : currentPath.startsWith("/fiche/") || currentPath.startsWith("/carnet/") || currentPath.startsWith("/mes-recettes") || (currentPath.startsWith("/recettes") && search.get("filter")) ? "/recettes" : "/";
  return (
    <Link href={href} className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-full border-2 border-[#7F9585] bg-[#F9F9F7]/90 px-4 py-2 text-sm font-semibold text-[#465B4C] shadow-sm transition-colors hover:bg-[#E6DFD3]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FA89B] focus-visible:ring-offset-2" aria-label="Retour">
      ⬅️ Retour
    </Link>
  );
}

