# Dans mon assiette

Carnet alimentaire d’Aline, nettoyé : **4 onglets**, 52 semaines, 720 plats, plus les 45 feuilles d’audit.

Fichier : [`public/Dans-mon-assiette.xlsx`](public/Dans-mon-assiette.xlsx)

| Onglet | Contenu |
| --- | --- |
| **Dashboard** | Les 52 semaines. Chaque plat est un lien interne vers sa fiche. |
| **Fiche_Recette** | Une ligne = une recette. « ← Semaine » ramène au menu. |
| **Courses** | Liste de courses. |
| **Batch** | Batch cooking. |

Les plats sont du **texte brut** (aucun hyperlien dans le `.xlsx` : Google Sheets vidait le fichier à l’ouverture).

## Ouvrir dans Google Sheets

**Si la feuille s’est ouverte blanche** (cas le plus fréquent) : sur cette feuille, **Extensions → Apps Script**, colle [`scripts/remplir-carnet.gs`](scripts/remplir-carnet.gs), exécute `creerCarnet`. Le carnet se remplit avec les liens cliquables.

Sinon :

1. [https://sheets.new](https://sheets.new)
2. **Fichier → Importer → Télécharger** `Dans-mon-assiette.xlsx`
3. **Remplacer le tableur**
4. Puis le script ci-dessus pour activer les liens.

## Recréer le classeur

```bash
python3 scripts/build-xlsx.py
```

Le source d’origine doit être dans `/tmp/orig/sheet.xlsx`.
