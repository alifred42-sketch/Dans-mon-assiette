# Audit éditorial des recettes — vague 2

Branche contrôlée : `travail-cuisine-chic-ouf-design`

## Périmètre réellement inspecté

Contrôle programmatique de **360 fiches** issues des trois fichiers JSON :

- `data/recettes-619.json` : 80 fiches
- `data/recettes-800.json` : 181 fiches
- `data/recettes-899.json` : 99 fiches

Ce contrôle porte sur les données de ces fichiers. Il ne vaut pas encore validation de toutes les recettes de l'application : le fichier central `data/carnet.json`, qui alimente les menus et le batch cooking, reste à analyser intégralement par une méthode adaptée à sa taille.

## Résultats confirmés par le contrôle structurel

- 360 fiches trouvées.
- 0 fiche sans nom.
- 0 fiche sans liste d'ingrédients.
- 0 fiche sans étapes.
- 0 fiche avec moins de deux ingrédients ou moins de deux étapes.
- 0 fiche sans temps de préparation ou de cuisson.

Ces résultats sont uniquement structurels : ils ne garantissent pas que chaque ingrédient cité dans les étapes soit bien quantifié, que les quantités soient réalistes, ni que la recette soit correctement classée.

## Points à examiner manuellement

### 1. Références internes — 27 fiches

27 fiches contiennent une mention du type « recette 1 », « recette 5 », « recette 32 », « recette 45 », « recette 359 » ou « recette 7 ». Il faut déterminer, pour chaque cas, si la référence désigne une sauce, une marinade, un mélange d'épices ou une autre fiche réellement accessible, et si les ingrédients de cette préparation sont bien inclus dans la liste de courses du plat.

Exemples repérés :
- Curry de Lentilles Corail et Butternut au Gingembre — mélange curry doux indien (recette 7).
- Cannellonis Végétariens à la Courge Butternut et Ricotta — herbes de Provence (recette 1).
- Gnocchis Rôtis au Four à la Tomate, Mozzarella et Pesto — plusieurs références numérotées.
- Bowl d'Hiver Express Lentilles, Avocat et Chèvre Frais — référence recette 359.

**Risque à vérifier :** référence orpheline ou opaque, et ingrédients de la préparation associée absents de la liste de courses. Une mention numérotée n'est pas automatiquement une erreur : elle doit être résolue vers la bonne fiche.

### 2. Doublon de titre — 1 groupe

« Taboulé de Chou-Fleur Express » apparaît trois fois dans `data/recettes-800.json`. Comparer ingrédients, étapes, portions et source avant de décider s'il s'agit de doublons exacts ou de variantes légitimes. Ne pas supprimer automatiquement.

### 3. Deux formulations de remplacement / disponibilité à examiner

- Curry de Lentilles Corail et Butternut au Gingembre.
- Gaspacho Vert Épicé au Concombre et Avocat.

Le contrôle a détecté dans le texte complet des formulations correspondant à des consignes de remplacement ou de disponibilité. Les chaînes exactes doivent être vérifiées avant toute correction.

### 4. Classement à vérifier — 12 titres candidats

Le contrôle a repéré des titres pouvant désigner une préparation plutôt qu'un plat principal :
- Sauce Crémeuse aux Marrons Salée & Champignons
- Crème de Courge Butternut pour Cannellonis
- Houmous Crémeux Traditionnel
- Pesto de Roquette aux Noix
- Purée de Patates Douces au Gingembre
- Crème de Courgettes Légère à la Menthe
- Crème de Brocoli au Lait d'Amande et Levure Maltée
- Crème de Maïs Doux au Lait de Coco (Soupe Chowder)
- ainsi que des crèmes, houmous ou purées dont la fonction doit être confirmée.

Cette liste est volontairement une **liste de vérification**, pas une demande de reclassement automatique : une soupe, une crème dessert ou une purée servie comme plat peut être légitime dans sa catégorie actuelle. Les sauces, marinades et préparations d'accompagnement ne doivent jamais devenir des repas autonomes dans les 52 semaines ; elles doivent être liées à un vrai plat lorsque nécessaire.

### 5. Vérification ingrédients ↔ étapes

Une heuristique a relevé des mentions dans les étapes qui méritent une revue, mais elle génère aussi de nombreux faux positifs (par exemple « parsemez généreusement », « le reste d'huile » ou des mots mal découpés). **Ces alertes ne sont pas considérées comme des erreurs confirmées** et ne doivent pas être corrigées automatiquement.

## Règle cible pour les plats et leurs préparations associées

Pour chaque plat qui dépend d'une sauce, marinade, vinaigrette, pesto ou mélange d'épices :

1. La fiche du menu des 52 semaines reste un vrai plat (ex. « Saumon mariné au citron et aux herbes »).
2. La préparation associée reste rangée dans sa catégorie propre et peut être ouverte depuis la fiche du plat.
3. La liste de courses inclut d'office les ingrédients du plat **et** ceux de la préparation nécessaire, puis regroupe les ingrédients réellement identiques.
4. Le batch cooking inclut les étapes et temps nécessaires à cette préparation.
5. Les variantes réellement différentes restent distinctes (ex. tomate fraîche ≠ tomate concassée en boîte ; huile d'olive ≠ huile de sésame).

## Protection des données

Aucune recette, aucun menu de semaine et aucune fiche de l'application n'a été modifié pendant cette vague. Les points ci-dessus sont des anomalies candidates à confirmer avant la phase de rectification.

## Étape suivante

Analyser la structure centrale de `data/carnet.json` et les liens entre `recipes`, `plan`, sauces/marinades et tâches `batch`, en particulier les recettes utilisées dans les 52 semaines. Vérifier ensuite la propagation des ingrédients dans les listes de courses et le batch cooking, sans modifier les recettes planifiées pendant l'audit.
