# Audit des identifiants de recettes cassés — vague 7

Branche : `travail-cuisine-chic-ouf-design`

## Résultat du rapprochement

Les 12 `recipeId` absents du catalogue utilisés dans les 52 semaines correspondent très probablement aux mêmes fiches présentes sous des identifiants normalisés `student-zero-cooking-XXX`, au lieu de `etudiant-zero-cuisson-XXX`. Les titres concordent avec les fiches du catalogue ; il s'agit donc d'une incohérence de convention d'identifiants, pas de 12 recettes introuvables.

| Semaine | Repas affiché | Identifiant utilisé actuellement | Fiche correspondante repérée |
|---:|---|---|---|
| 11 | Mug Cake Speculoos sans cuisson | `etudiant-zero-cuisson-020` | `student-zero-cooking-020` |
| 18 | Salade de pois chiches à la coppa et artichauts | `etudiant-zero-cuisson-031` | `student-zero-cooking-031` |
| 18 | Bowl de fromage blanc gourmand aux fruits | `etudiant-zero-cuisson-010` | `student-zero-cooking-010` |
| 21 | Trifle minute Banane & Chocolat | `etudiant-zero-cuisson-050` | `student-zero-cooking-050` |
| 23 | Mini-bagel sucré Banane & Chocolat | `etudiant-zero-cuisson-030` | `student-zero-cooking-030` |
| 26 | Salade de maïs, jambon et emmental | `etudiant-zero-cuisson-039` | `student-zero-cooking-039` |
| 29 | Soupe froide concombre, yaourt et menthe | `etudiant-zero-cuisson-037` | `student-zero-cooking-037` |
| 32 | Club sandwich thon, œuf dur et crudités | `etudiant-zero-cuisson-009` | `student-zero-cooking-009` |
| 33 | Salade de haricots blancs au thon et poivron | `etudiant-zero-cuisson-032` | `student-zero-cooking-032` |
| 34 | Salade de haricots rouges au thon | `etudiant-zero-cuisson-022` | `student-zero-cooking-022` |
| 39 | Wrap saumon fumé et pommes vertes | `etudiant-zero-cuisson-033` | `student-zero-cooking-033` |
| 52 | Salade de pois chiches au thon et persil | `etudiant-zero-cuisson-005` | `student-zero-cooking-005` |

## Action de correction à prévoir

Remplacer les 12 valeurs `recipeId` erronées dans les créneaux concernés par les identifiants existants `student-zero-cooking-XXX`, en gardant inchangés la semaine, le jour, le repas et le nom affiché. Avant d'appliquer la modification, le test doit confirmer pour chaque paire que les ingrédients et les étapes de la fiche cible sont complets et que les courses de ces semaines récupèrent bien la fiche.

Cette correction est isolée et ne demande pas de changer les menus. Elle n'a pas été appliquée pendant l'audit.
