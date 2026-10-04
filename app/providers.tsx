import { Suspense } from "react";
import { Shell } from "@/components/shell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Chargement…</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
