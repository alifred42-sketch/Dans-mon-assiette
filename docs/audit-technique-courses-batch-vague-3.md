# Audit technique — calcul des courses, liens de préparations et batch cooking

Branche inspectée : `travail-cuisine-chic-ouf-design`

Fichiers lus : `lib/carnet.ts`, `lib/shopping.ts`, `lib/recipe-display.ts`, `app/courses/page.tsx`, `app/batch/page.tsx`, ainsi que `scripts/check-carnet.mjs`.

Cette passe inspecte la logique applicative ; elle ne modifie aucun fichier fonctionnel ni aucune recette des 52 semaines.

## Points techniques confirmés à corriger dans une phase dédiée

### T1 — L'association plat → sauce/marinade dépend d'une détection textuelle fragile

Dans `lib/shopping.ts`, `findLinkedSauce()` cherche uniquement des fiches dont le titre contient certains mots (sauce, marinade, vinaigrette, pesto, coulis), puis cherche le titre complet de la préparation dans le texte d'une ligne d'ingrédient du plat.

Conséquences :
- Une recette qui dit seulement « pesto (recette 32) », « mélange curry (recette 7) » ou « marinade » sans reprendre exactement le titre de la fiche liée ne garantit pas que cette préparation soit retrouvée.
- Les références numérotées des fiches importées ne sont pas résolues en relation fiable par identifiant dans cette fonction.
- Les sauces et marinades qui ne sont pas nommées explicitement dans une ligne d'ingrédient peuvent ne pas être ajoutées au panier.

**Risque utilisateur :** ingrédients manquants dans la liste de courses alors que la recette demande une préparation liée.

**Correction cible :** relation explicite par identifiant entre le plat et chaque préparation nécessaire ; la liste de courses parcourt les ingrédients du plat et ceux de ses préparations liées, met à l'échelle chaque quantité selon les portions, puis agrège les ingrédients équivalents. Le texte seul ne doit plus être le seul mécanisme de liaison.

### T2 — La normalisation actuelle fusionne certaines variantes qui doivent rester distinctes

Dans `canonicalIngredient()`, plusieurs règles effacent des différences de produits, notamment :
- oignon jaune, blanc, rouge et nouveau deviennent tous « oignon » ;
- poivrons rouges, verts et jaunes deviennent « poivron » ;
- plusieurs types de crème sont ramenés à « creme ».

Cela peut masquer une différence demandée par la recette. À l'inverse, des variantes d'écriture vraiment équivalentes devraient être unifiées.

**Correction cible :** un référentiel d'ingrédients contrôlé qui regroupe les synonymes sûrs, mais préserve les variantes culinaires pertinentes : couleur/variété lorsqu'elle est spécifiée, type de crème, frais vs conserve, cru vs cuit si cela change l'achat, huile d'olive vs huile de sésame, tomate fraîche vs tomate concassée, etc. Les unités ne doivent être converties que lorsqu'elles sont compatibles.

### T3 — Le calcul des courses s'appuie sur des sources historiques en plus des fiches

`shoppingForWeek()` agrège les ingrédients des recettes actives et ajoute ensuite les lignes historiques de `carnet.courses` si elles concernent un plat encore au planning. Ce mécanisme est utile en secours, mais il faut vérifier qu'il n'introduit pas de quantités manquantes, de lignes anciennes ou de doublons lorsque les fiches de recette sont corrigées.

Le contrôle doit comparer, semaine par semaine, les lignes historiques avec les ingrédients réellement calculés depuis les fiches et leurs préparations liées. Une recette remplacée ne doit pas faire revenir les achats de l'ancien plat.

### T4 — Le batch cooking actuel n'est pas un déroulé complet de toutes les recettes de la semaine

Dans `lib/carnet.ts`, `batchForWeek()` produit principalement trois tâches génériques : protéine pivot, féculent, soupe de saison. Dans `app/batch/page.tsx`, les recettes détaillées utilisées pour construire les étapes sont basées sur le dîner du mardi et celui du mercredi.

Ce n'est donc pas encore un batch exhaustif qui inclut automatiquement toutes les découpes, toutes les cuissons et toutes les sauces/marinades nécessaires aux repas sélectionnés de la semaine.

**Correction cible :** générer les tâches à partir des recettes prévues pour la période de batch cooking, en incluant leurs préparations liées, avec les quantités réellement restantes, les temps et les étapes cohérentes. Ne pas ajouter des tâches pour une préparation qui n'est pas requise.

### T5 — Le script de contrôle existant vérifie surtout la structure, pas la cohérence culinaire de bout en bout

`scripts/check-carnet.mjs` vérifie notamment les 52 semaines, les 14 créneaux, les références de recettes, la présence d'étapes batch et quelques champs des recettes. Il ne vérifie pas actuellement :
- que toutes les références à des sauces/marinades résolvent vers une fiche existante ;
- que les ingrédients de ces préparations sont ajoutés à la liste de courses ;
- que les doublons sont fusionnés sans fusionner des produits différents ;
- que chaque ingrédient utilisé dans une étape est présent dans les ingrédients avec une quantité exploitable ;
- que les tâches de batch correspondent à l'ensemble des recettes concernées.

## Ce que cette passe ne conclut pas

- Elle ne conclut pas que toutes les listes de courses actuelles sont fausses ; elle identifie des limites de la logique et des tests manquants.
- Elle ne modifie pas les menus des 52 semaines ni les recettes.
- Elle ne valide pas encore chaque recette individuellement.

## Ordre recommandé pour les rectifications

1. Inventorier toutes les recettes, leurs identifiants, catégories et références de préparation, y compris les recettes planifiées.
2. Construire une liste des liens manquants ou ambigus plat → sauce/marinade/mélange d'épices.
3. Créer le référentiel d'ingrédients avec des règles de fusion prudentes.
4. Tester le calcul des courses sur plusieurs semaines et cas limites (remplacement de recette, portions modifiées, préparation liée, même ingrédient dans deux plats).
5. Générer et comparer le batch cooking à partir des mêmes relations.
6. Seulement après validation des rapports, préparer les corrections des fiches ; les recettes utilisées dans les 52 semaines restent protégées pendant la phase d'audit.
