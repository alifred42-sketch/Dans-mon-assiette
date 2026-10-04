import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3 py-10 text-center">
      <h1 className="font-heading text-2xl">Page introuvable</h1>
      <p className="text-sm text-muted-foreground">Cette fiche ou cette page n’existe pas.</p>
      <Link href="/" className="inline-block text-primary underline underline-offset-4">
        Retour à la semaine
      </Link>
    </div>
  );
}
