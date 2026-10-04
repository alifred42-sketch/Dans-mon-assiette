import { Shell } from "@/components/shell";
import { VanillaEnhance } from "@/components/vanilla-enhance";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      {children}
      <VanillaEnhance />
    </Shell>
  );
}
