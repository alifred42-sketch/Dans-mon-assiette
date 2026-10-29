"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const pathname = usePathname();
  const currentPath = pathname.replace(/\/$/, "") || "/";
  const search = useSearchParams();
  const week = search.get("w");
  if (currentPath === "/") return null;
  const href = currentPath === "/semaine" ? "/" : week ? `/semaine?w=${week}` : currentPath.startsWith("/fiche/") || currentPath.startsWith("/carnet/") || currentPath.startsWith("/mes-recettes") || (currentPath.startsWith("/recettes") && search.get("filter")) ? "/recettes" : "/";
  return (
    <Link href={href} className="app-header-back inline-flex size-10 items-center justify-center rounded-full text-black transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24795B]" aria-label="Retour" title="Retour">
      <ArrowLeft size={22} strokeWidth={2.25} aria-hidden="true" />
    </Link>
  );
}

