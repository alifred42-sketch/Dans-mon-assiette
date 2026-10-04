# Dans mon assiette

Petite appli du carnet d’Aline, pour téléphone ou tablette Android. Pas de compte, pas d’abonnement.

- Choisir la semaine (flèches ou liste) change les repas
- Un plat n’est cliquable que s’il a **exactement** le même titre qu’une fiche
- Les courses viennent de la feuille officielle du tableur, par semaine
- Le batch cooking aussi : ce qui est noté à préparer en avance
- Aucune recette inventée

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

```bash
python3 scripts/export-carnet.py
python3 scripts/export-batch.py
```

Les repas viennent de `_APP_DATA` + `200 RECETTE`. Un repas n’est relié à une fiche que si les deux titres sont identiques. Sinon le plat reste visible, sans lien.

Les courses et le batch viennent de `_COURSES_DATA` et `_BATCH_DATA`.
