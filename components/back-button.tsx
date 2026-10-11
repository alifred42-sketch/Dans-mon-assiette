"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const pathname = usePathname();
  const search = useSearchParams();
  const week = search.get("w");
  if (pathname === "/") return null;
  const href = pathname === "/semaine" ? "/" : week ? `/semaine?w=${week}` : pathname.startsWith("/fiche/") || pathname.startsWith("/carnet/") || (pathname.startsWith("/recettes") && search.get("filter")) ? "/recettes" : "/";
  return (
    <Link href={href} className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#8FA89B] hover:bg-[#8FA89B]/10" aria-label="Retour">
      <ArrowLeft className="size-4" /> Retour
    </Link>
  );
}
