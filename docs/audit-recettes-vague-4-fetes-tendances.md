# Audit des recettes festives et tendances — vague 4

Branche contrôlée : `travail-cuisine-chic-ouf-design`

## Périmètre

Contrôle structurel de quatre sources TypeScript de recettes de l'application :

| Source | Fiches repérées | Champs ingrédients | Champs étapes | Temps préparation/cuisson |
|---|---:|---:|---:|---:|
| `data/recettes-fetes-automne-sylvestre.ts` | 13 | 13 | 13 | 13 / 13 |
| `data/recettes-fetes-ete.ts` | 2 | 2 | 2 | 2 / 2 |
| `data/recettes-fetes-printemps.ts` | 5 | 5 | 5 | 5 / 5 |
| `data/recettes-tendances.ts` | 5 | 5 | 5 | 5 / 5 |
| **Total** | **25** | **25** | **25** | **25 / 25** |

Le contrôle a trouvé un champ `id` pour chacune des 25 fiches. Les références « recette 10 », « recette 17 », etc. trouvées dans les fichiers festifs sont dans les mentions de source du livre et ne sont pas, à elles seules, des liens vers une préparation à ajouter aux courses.

## Exemples de fiches dans le périmètre

- Velouté de potimarron au sirop d'érable.
- Pumpkin pie simplifiée.
- Mini-pavlovas aux fruits exotiques.
- Cocottes d'œufs festives aux épinards.
- Verrines étoilées au saumon fumé et crème de concombre.
- Roulés apéritifs « Clés de Sol ».
- Fougasse express aux olives et romarin.
- Chou-fleur rôti au paprika et sauce citronnée.
- Poulet méditerranéen au citron et à l'ail.
- Verrines pomme-poire, cannelle et skyr.

## Contrôles éditoriaux encore nécessaires

La présence de ces champs ne garantit pas que :
- chaque étape n'utilise que des ingrédients présents dans la fiche ;
- les quantités sont suffisantes et chiffrées ;
- les temps annoncés sont compatibles avec les étapes ;
- les préparations associées (par exemple une sauce citronnée ou une crème de concombre) sont correctement intégrées aux courses et au batch ;
- les catégories et filtres de fêtes sont cohérents.

Il faut aussi conserver la distinction entre une fiche apéritive/dessert/plat de fête et un repas midi/soir du planning régulier. Les recettes festives ne doivent pas être déplacées vers les 52 semaines automatiquement.

## État

Aucune recette ni menu n'a été modifié. Cette vague porte le total des sources JSON et TypeScript inspectées structurellement à **385 fiches** (360 JSON + 25 festives/tendances). Les recettes du fichier central `data/carnet.json` et le contrôle individuel de qualité culinaire restent à compléter.
