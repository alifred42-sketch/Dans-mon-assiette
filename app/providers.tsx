import { RegisterSW } from "@/components/register-sw";
import { Shell } from "@/components/shell";

export function Providers({ children }: { children: React.ReactNode }) {
  // Ne pas placer Shell et toute l'application dans une Suspense globale :
  // useSearchParams sur une page enfant pouvait suspendre l'intégralité de l'interface
  // pendant l'export statique, laissant la navigation inutilisable si l'hydratation tarde.
  return (
    <>
      <RegisterSW />
      <Shell>{children}</Shell>
    </>
  );
}
