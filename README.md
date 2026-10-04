# Dans mon assiette

Le carnet d’Aline, sur téléphone : les 52 semaines, les courses, le batch, et les onglets utiles (saisons, apéro, sauces, express…). Pas les feuilles d’audit.

- Chaque plat de la semaine ouvre sa fiche
- Été 1 et Été 2 sont regroupés, pareil pour Express, Bonus et Mr Cuisine
- Les courses et le batch viennent du tableur
- Rien n’est inventé

## Sur le téléphone

Adresse qui reste en ligne :

**https://katana5260.github.io/Dans-mon-assiette/**

1. Ouvre ce lien dans **Chrome**
2. Menu (⋮) → **Ajouter à l’écran d’accueil**
3. Si une ancienne icône ouvre « no tunnel » : supprime-la, puis réinstalle depuis ce lien

La recherche du carnet trouve un nom, un légume, un fromage ou « Mr Cuisine ».

## En local

```bash
npm install
npm run dev
```

Ouvre [http://localhost:4317](http://localhost:4317).

## Pour continuer le travail (humain ou IA)

Tout le projet est ici, pas besoin d’un dossier à part.

1. Ouvre le dépôt : https://github.com/katana5260/Dans-mon-assiette
2. Dans Cursor / Claude / ChatGPT, colle ce lien et dis : « continue ce projet »
3. Les recettes, menus, courses et batch sont dans `data/carnet.json` (export du tableur)
4. L’appli téléphone est dans `app/` (Next.js). Les courses avec quantités : `lib/shopping.ts`
5. Relancer l’export depuis le Excel : `python3 scripts/export-carnet.py` (le `.xlsx` source n’est pas obligatoire si on édite le JSON)

Règle du carnet : ne rien inventer. Si une fiche n’a pas la préparation ou un grammage, c’est que le tableur ne l’avait pas.

## Données

```bash
python3 scripts/export-carnet.py
```
