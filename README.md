# Dans mon assiette

Petite appli du carnet d’Aline, pour téléphone ou tablette Android. Pas de compte, pas d’abonnement.

- Choisir la semaine (1 à 52) change les repas
- Un plat n’est cliquable que s’il a **exactement** le même titre qu’une fiche
- Les courses se recalculent à partir de ces fiches
- Aucune recette inventée, aucune correspondance approximative

## Sur le téléphone (Android)

1. Ouvre l’adresse de l’appli dans Chrome
2. Menu (⋮) → **Ajouter à l’écran d’accueil**
3. L’icône s’ouvre comme une appli

## En local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:4317](http://localhost:4317).

Avec Docker : `docker compose up --build`, puis la même adresse.

## Données

Exportées depuis le tableur d’origine (`_APP_DATA` + `Fiche_Recette`) :

```bash
python3 scripts/export-carnet.py
```

Un repas n’est relié à une fiche que si les deux titres sont identiques. Sinon le plat reste visible, sans lien.
