# Audit culinaire ciblé — vague 12 : lot « 200 RECETTE »

Branche de test : `travail-cuisine-chic-ouf-design`
Fichier : `data/carnet.json`
Source isolée : `200 RECETTE` (198 fiches)
Aucune recette ni aucun menu n'a été modifié.

## Résultats de contrôle ciblé

- 198 fiches dans ce lot.
- 32 fiches ont une étape générique « Cuisez séparément les œufs, féculents ou protéines… », parfois appliquée à une recette où cette étape n'a pas de sens.
- 82 fiches utilisent des renvois vagues « condiments indiqués » ou « éléments de la fiche » au lieu de nommer précisément les ingrédients dans l'étape.
- 140 fiches ont une instruction de répartition générique qui ne décrit pas la préparation finale.
- 3 fiches ont au moins une ligne d'ingrédient strictement répétée.
- 1 fiches utilisent une option ouverte (« au choix » / « selon vos envies ») dans les ingrédients.
- 0 fiches ont au moins un champ parmi portions, temps de préparation ou temps de cuisson absent.

Ces résultats sont des alertes de structure et de cohérence; les cas concrets ci-dessous montrent des erreurs de contenu confirmables à corriger dans ce lot.

## Exemples de défauts concrets à corriger

### 1. Wrap poulet crudités sauce yaourt citron — `r-b6bee72546`
- Le titre annonce une sauce yaourt-citron, mais les ingrédients ne contiennent ni yaourt/skyr ni citron.
- Le titre et la fiche indiquent 4 personnes, mais il n'y a que 2 galettes wraps.
- Une étape demande de cuire séparément des œufs/féculents/protéines, puis de mélanger les condiments « indiqués » : consigne générique qui ne correspond pas à cette recette.
- Les étapes parlent de salade et d'assemblage en portions plutôt que de garnir et rouler les wraps.

### 2. Risotto courgettes parmesan — `r-6f3fa27bf5`
- La méthode demande d'abord de cuire le riz séparément, ce qui ne correspond pas à la méthode habituelle d'un risotto et contredit le nom de la recette.
- Le bouillon est ajouté dans une étape puis ajouté à nouveau dans la suivante, ce qui risque de compter deux fois les 700 ml.
- La fiche annonce un robot Monsieur Cuisine Smart dans le titre, mais les étapes données sont des étapes génériques à la casserole.

### 3. Chili doux revisité aux lentilles corail — `r-191ad7474a`
- La ligne « Épices ou aromates (2 g) » apparaît deux fois à l'identique.
- L'étape 2 fait revenir les lentilles et la tomate avant la viande sans préciser l'eau/le liquide nécessaire pour cuire les lentilles corail; la méthode et le temps doivent être réécrits.
- Le choix bœuf ou poulet peut être conservé, mais il faut une consigne de cuisson adaptée et une quantité d'assaisonnement précise.

### 4. Pâtes crémeuses courgettes & saumon — `r-ceea7b5051`
- « 200 g de citron » est une quantité probablement erronée (la fiche semble viser du jus ou un citron, pas 200 g de citron).
- Les étapes décrivent une cuisson au four du saumon et des courgettes, mais ne donnent pas de vraie étape d'assemblage de la sauce skyr/fromage frais avec les pâtes.
- Le nom annonce une recette crémeuse, mais la liaison crémeuse n'est pas expliquée.

### 5. Saumon au four, légumes rôtis & sauce skyr citron — `r-e99302c7e8`
- Le titre annonce une sauce skyr-citron, mais les ingrédients ne contiennent ni skyr ni fromage blanc.
- La quantité de saumon (2 pavés) ne correspond pas clairement à 4 personnes; à confirmer avec le grammage attendu.
- La méthode demande un four à 180 °C pendant 25 min sans préciser l'épaisseur des pavés, ce qui nécessite une consigne de vérification plus utile.

### 6. Papillote de saumon citronnée aux poireaux — `r-4261d5727b`
- « 200 g de citron » est une quantité ambiguë; il faut préciser nombre de citrons ou quantité de jus.
- « 1 c. à soupe d’un filet d’huile d’olive » mélange deux mesures incompatibles.
- Les étapes parlent de plat au four, mais ne précisent pas de fermer les papillotes, élément essentiel de la recette.

### 7. Omelette légumes & salade croquante — `r-c1ed1606a4`
- L'étape 3 demande de mélanger les œufs et légumes dans un saladier, puis l'étape 4 répartit en portions, sans décrire la cuisson de l'omelette.
- Le temps de cuisson affiché à 0 min ne correspond pas à une omelette cuite.

## Décision
Ce lot présente un problème récurrent de génération de fiches : certaines étapes sont des modèles réutilisés et ne décrivent pas la recette annoncée. La priorité de correction est donc de réécrire les étapes recette par recette, puis d'aligner ingrédients, quantités, portions, temps et équipement (notamment Monsieur Cuisine Smart). Ne pas corriger par simple remplacement global : chaque fiche doit garder sa méthode propre.
