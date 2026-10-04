export default function TelechargerPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="font-heading text-3xl">Télécharger le classeur</h1>
      <p className="text-sm text-muted-foreground">
        Fichier propre : Accueil, Planning (52 semaines), Recettes, Courses, Batch. Les plats du
        planning ouvrent la fiche.
      </p>
      <a
        href="/api/telecharger"
        download="Dans-mon-assiette.xlsx"
        className="inline-flex items-center rounded-full bg-primary px-5 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
      >
        Enregistrer Dans-mon-assiette.xlsx
      </a>
      <script
        dangerouslySetInnerHTML={{
          __html: "window.location.replace('/api/telecharger')",
        }}
      />
    </div>
  );
}
