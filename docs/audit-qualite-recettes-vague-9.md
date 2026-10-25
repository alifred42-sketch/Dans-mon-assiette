# Audit qualité des recettes — vague 9

Branche : `travail-cuisine-chic-ouf-design`
Source : `data/carnet.json`, catalogue central.
Statut : constats seulement ; aucune recette, aucun menu et aucune donnée centrale modifiés.

## 1. Préparations qui semblent être des repas dans le planning

Le contrôle des 728 créneaux fait ressortir trois entrées dont le titre correspond clairement à une préparation seule et qui sont utilisées comme repas dans le planning :
- Semaine 4, dimanche soir — `r-8cfb8fe28b` — « Coulis tomate pizza léger »
- Semaine 24, mardi soir — `r-aef573f3e9` — « Marinade poulet Tex-Mex »
- Semaine 24, mercredi soir — `r-aef573f3e9` — « Marinade poulet Tex-Mex »
- Semaine 24, jeudi midi — `r-6116939142` — « Sauce Tex-Mex batch »

Les autres titres qui contiennent « sauce » sont souvent des plats complets (par exemple poisson sauce citronnée ou wrap avec sauce) et ne doivent pas être classés automatiquement comme erreurs. Les quatre occurrences ci-dessus sont à vérifier en priorité : il faut remplacer les créneaux par un vrai plat, sans perdre la sauce ou la marinade comme préparation associée. Ne pas modifier les menus avant la phase de correction validée.

## 2. Instructions de préparation trop génériques

280 fiches contiennent au moins une étape qui correspond à des formulations génériques telles que :
- « Cuisez séparément les œufs, féculents ou protéines qui le nécessitent »
- « Fouettez les condiments indiqués »
- « Ajoutez les aromates, l’huile et le citron de la fiche »
- « Goûtez, rectifiez l’assaisonnement avec les éléments de la fiche »
- « Répartissez en 4 portions »

Ce sont des signaux à vérifier, pas 280 erreurs confirmées. Mais ces formulations peuvent rendre une recette impossible à suivre sans interprétation et ne précisent parfois ni l'ordre exact, ni la température, ni la durée pour chaque ingrédient. La correction devra être spécifique à chaque plat, avec des quantités cohérentes et des étapes réellement exécutables.

## 3. Ingrédients vagues ou non déterminés

Huit lignes d'ingrédients ont une formulation « au choix » ou équivalente :
- `r-50e9f84517` — Chili con carne doux : « 200 g de haricots rouges (selon goût) »
- `r-75c12fe616` — Salade repas anti-gaspi : « Crudités au choix … : 200 g »
- `test-burger-s1` — Burgers maison du samedi : « 2 cuillères à soupe de sauce au choix »
- `vegan-automne-hiver-036` — Pâtes au pesto d'hiver : « 400 g de pâtes au choix »
- `student-one-pan-007` — Émincé de poulet au curry : « 100 g de légumes surgelés au choix »
- `student-one-pan-050` — Pancake géant : « 1 garniture au choix… »
- `systeme-d-019` — Salade de cup-nouilles : saveur de nouilles au choix
- `student-systeme-d-019` — Même titre sur une seconde fiche : saveur de nouilles au choix

Ces lignes ne sont pas toutes fautives : les pâtes au choix peuvent être une vraie option. Il faut surtout décider si l'option est acceptable dans la fiche et si la liste de courses peut la gérer correctement. La mention « sauce au choix » ne permet pas de générer une liste d'achat précise tant qu'aucune sauce de référence n'est liée.

## 4. Priorités de correction après l'audit

1. Vérifier les créneaux de repas occupés par une sauce, un coulis ou une marinade.
2. Reprendre les instructions génériques par familles de recettes, en contrôlant les quantités, la cuisson et la cohérence entre ingrédients et étapes.
3. Traiter les options floues pour que les courses restent fiables.
4. Comparer les fiches Système D en double identifiant avant de choisir la fiche de référence.
5. Vérifier les liens sauce/marinade → recette principale → courses et batch cooking.

## Règle de classement préservée

Les recettes présentes dans les catégories Végan et Végétarienne sont des doublons volontaires de classement et ne sont pas signalées comme anomalies à supprimer. Les recettes répétées par conception dans les 52 semaines (par exemple les modèles anti-gaspillage) doivent également être jugées selon leur rôle.
