# Dans mon assiette

Carnet alimentaire d’Aline, nettoyé : **4 onglets**, 52 semaines, 720 plats, plus les 45 feuilles d’audit.

Fichier : [`public/Dans-mon-assiette.xlsx`](public/Dans-mon-assiette.xlsx)

| Onglet | Contenu |
| --- | --- |
| **Dashboard** | Les 52 semaines. Chaque plat est un lien interne vers sa fiche. |
| **Fiche_Recette** | Une ligne = une recette. « ← Semaine » ramène au menu. |
| **Courses** | Liste de courses. |
| **Batch** | Batch cooking. |

Le classeur `carnet_aline_52_semaines.xlsx` s’affiche dans Google Sheets. Les plats sont du texte : Sheets n’active pas tout seul les liens Excel.

Sur **cette même feuille** : **Extensions → Apps Script**, colle [`scripts/activer-liens-sheets.gs`](scripts/activer-liens-sheets.gs), exécute `activerLiens`. Chaque plat devient un lien vers sa fiche (`#gid` réel).

## Recréer le classeur

```bash
python3 scripts/build-xlsx.py
```

Le source d’origine doit être dans `/tmp/orig/sheet.xlsx`.
