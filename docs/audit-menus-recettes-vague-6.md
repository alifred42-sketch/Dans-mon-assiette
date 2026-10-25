# Audit fonctionnel des recettes planifiées — vague 6

Branche : `travail-cuisine-chic-ouf-design`
Source : `data/carnet.json`

## Résultat du contrôle croisé menus ↔ fiches

- 728 créneaux planifiés sur 52 semaines ; les 52 semaines ont bien 14 créneaux chacune.
- 544 identifiants de recettes distincts sont référencés par les menus.
- 532 de ces identifiants sont résolus dans `data.recipes`.
- **12 identifiants planifiés sont absents du catalogue**, donc le lien vers la fiche recette ne peut pas fonctionner par cet identifiant.
- Parmi les 532 fiches planifiées qui existent, 3 n'ont pas un ou les deux temps renseignés et 2 déclenchent le contrôle de texte vague. Ces 5 fiches doivent être identifiées et vérifiées précisément avant correction.

Les 12 identifiants cassés sont :
`etudiant-zero-cuisson-020`, `etudiant-zero-cuisson-031`, `etudiant-zero-cuisson-010`, `etudiant-zero-cuisson-050`, `etudiant-zero-cuisson-030`, `etudiant-zero-cuisson-039`, `etudiant-zero-cuisson-037`, `etudiant-zero-cuisson-009`, `etudiant-zero-cuisson-032`, `etudiant-zero-cuisson-022`, `etudiant-zero-cuisson-033`, `etudiant-zero-cuisson-005`.

Le nom affiché permet de rechercher la bonne fiche, mais il ne suffit pas à changer automatiquement l'identifiant : certaines variantes ont des noms proches. Il faut retrouver la fiche exacte dans les sources de recettes et vérifier ingrédients/étapes avant de réparer ces liens.

## Contrôle de cohérence des ingrédients

Aucune fiche du catalogue ne manque entièrement de liste d'ingrédients ou d'étapes. Le contrôle automatique a toutefois repéré 7 lignes d'ingrédients contenant des choix ou formulations qui nécessitent une décision éditoriale, par exemple :
- « Crudités au choix (tomates cerises, maïs, bâtonnets de légumes coupés en dés): 200 g » ;
- « 2 cuillères à soupe de sauce au choix » ;
- « 100g de légumes surgelés au choix (mélange julienne ou wok) » ;
- « 4 pot de nouilles instantanées en cup (saveur au choix) ».

Ce ne sont pas forcément des erreurs, mais les choix non précisés peuvent rendre les listes de courses imprécises. Il faut choisir une option explicite ou indiquer clairement qu'il s'agit d'une substitution facultative et ne pas compter plusieurs options comme si elles étaient toutes nécessaires.

## Contrôle du classement repas / préparation

Le repérage par mots-clés ne suffit pas à déclarer une fiche mal classée : une « crème dessert » est un dessert, une « crème de panais » peut être une soupe, et une « purée complète » peut constituer un vrai plat. En revanche, les fiches comme « Crème fine de Gorgonzola pour Lasagnes de Butternut » doivent être vérifiées comme préparation liée plutôt que comme repas autonome. Le rapport identifie ce type de cas pour une revue humaine ; aucun reclassement automatique n'est appliqué.

## Règle de nommage

Les 192 titres avec numéros d'ordre et les 182 noms de créneaux qui les reprennent restent une priorité distincte. Les titres doivent être ramenés au nom lisible uniquement ; les identifiants techniques doivent rester stables pour ne pas casser les liens. Les renvois internes à une préparation doivent utiliser le nom de la préparation dans l'interface et une relation explicite par identifiant dans les données.

## Protection

Cette vague est une analyse uniquement : aucun plat planifié, aucune recette, aucun identifiant et aucune liste de courses n'a été modifié. La correction doit venir après résolution documentée des 12 identifiants manquants et audit des fiches concernées.
