# Dans mon assiette

Carnet alimentaire d’Aline, repris depuis le Google Sheet (73 onglets, liens cassés, audits ChatGPT).

**Ici :** 52 semaines cliquables, bibliothèque de recettes, courses fusionnées, batch, « Je reçois » et « Surprends-moi ».  
**Pas encore :** 1000 photos maison, comptes, abonnements — ça, c’est le cap Cookomix.

## Lancer

```bash
npm install
npm run dev -- --port 4317
```

Ouvre [http://localhost:4317](http://localhost:4317).

## Fichier Excel propre

[`public/Dans-mon-assiette.xlsx`](public/Dans-mon-assiette.xlsx) — 6 onglets :

1. Accueil (vrais liens)
2. Planning (52 × midi/soir → fiche)
3. Recettes
4. Courses (semaine 1, doublons fusionnés)
5. Batch

À importer dans Google Sheets : Fichier → Importer.

## Données

Issues du classeur d’origine : `Planning_APP`, `BDD_Classique`, `BDD_MrCuisine`, plus les vraies recettes des onglets Express / Saisons / Apéro / Robot. Les 45 onglets AUDIT / V38–V52 / « images à intégrer » ont été écartés.
