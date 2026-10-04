# Dans mon assiette

Carnet alimentaire d’Aline, nettoyé : **4 onglets**, 52 semaines, 720 plats, plus les 45 feuilles d’audit.

Fichier : [`public/Dans-mon-assiette.xlsx`](public/Dans-mon-assiette.xlsx)

| Onglet | Contenu |
| --- | --- |
| **Dashboard** | Les 52 semaines. Chaque plat est un lien interne vers sa fiche. |
| **Fiche_Recette** | Une ligne = une recette. « ← Semaine » ramène au menu. |
| **Courses** | Liste de courses. |
| **Batch** | Batch cooking. |

Les plats sont du **texte** (plus de cellules vides). Les liens sont des **hyperliens Excel internes** (`Fiche_Recette!C7`), pas des formules `#gid=0`. Google Sheets les convertit tout seul au bon gid à l’import — c’est ce qui les rend cliquables.

## Ouvrir dans Google Sheets

1. Va sur [https://sheets.new](https://sheets.new) (feuille Google vide, dans ton Drive).
2. **Fichier → Importer → Télécharger** le `Dans-mon-assiette.xlsx`.
3. Choisis **Remplacer le tableur**.
4. Clique un plat souligné sur le Dashboard : ça saute à sa fiche.

Si un plat n’est pas cliquable après l’import : **Extensions → Apps Script**, colle [`scripts/activer-liens-sheets.gs`](scripts/activer-liens-sheets.gs), exécute `activerLiens`.

## Recréer le classeur

```bash
python3 scripts/build-xlsx.py
```

Le source d’origine doit être dans `/tmp/orig/sheet.xlsx`.
