# Audit qualité catalogue central — vague 12 : fiches « 200 RECETTE »

Branche : `travail-cuisine-chic-ouf-design`
Périmètre : contrôle d'un échantillon du lot source `200 RECETTE` dans `data/carnet.json`, hors recettes étudiantes.
Aucune recette ni aucun menu modifié.

## Résultat important

Cet échantillon révèle un problème plus large que des fautes de frappe : plusieurs fiches suivent un modèle générique qui ne décrit pas réellement la recette annoncée. Les étapes peuvent omettre des ingrédients, imposer une cuisson inadaptée au plat, demander des ingrédients inexistants dans la liste, ou contredire le titre. Ces fiches doivent être traitées comme prioritaires avant de les considérer prêtes à publier.

## Défauts concrets repérés

### Fiches où les étapes ne correspondent pas au plat
- `r-b6bee72546` — **Wrap poulet crudités sauce yaourt citron** : l'étape 2 parle de cuire séparément œufs, féculents ou protéines, et l'étape 4 de servir une salade fraîche. La préparation spécifique du wrap et de la sauce au yaourt citron n'est pas décrite.
- `r-c9d038ac38` — **Salade complète poulet & crudités** : étapes génériques de cuisson même quand la salade est crue ; les étapes ne précisent pas la préparation du poulet et de l'œuf dur.
- `r-286a260f09` — **Wrap thon crudités sauce yaourt citron** : l'étape 2 demande une cuisson générique de 20 minutes qui ne convient pas à un wrap au thon en conserve ; la sauce au yaourt citron n'est pas détaillée.
- `r-103073cf0c` — **Salade fraîcheur melon, mozzarella & jambon cru** : les étapes ne décrivent ni le melon ni la mozzarella et ne font pas réellement l'assemblage annoncé.
- `r-4386e60c58` — **Wrap saumon fumé & crudités** : étape générique de cuisson de 20 minutes alors que le saumon est fumé ; les étapes ne décrivent pas le montage du wrap.
- `r-8cb821d384` — **Salade de lentilles corail façon fraîcheur** : les lentilles corail doivent être cuites, mais les étapes renvoient à une préparation de salade générique et ne donnent pas leur cuisson.
- `r-6f3fa27bf5` — **Risotto courgettes parmesan Monsieur Cuisine Smart** : l'étape 2 fait cuire le riz à l'eau puis l'égoutte, ce qui ne correspond pas à une méthode de risotto ; l'étape 3 répète le bouillon et l'huile et donne une séquence de cuisson confuse.
- `r-4231745fd3` — **One pot pasta courgettes saumon** : les étapes font cuire au four le saumon et les légumes puis demandent de cuire les pâtes à part, contrairement au principe « one pot ».

### Quantités et ingrédients incohérents
- `r-191ad7474a` — **Chili doux revisité aux lentilles corail** : la ligne « Épices ou aromates (2 g) » apparaît deux fois ; l'étape 2 fait revenir les lentilles et les tomates avant l'ajout de la viande, sans expliquer la gestion du liquide ni la cuisson des lentilles.
- `r-ceea7b5051` — **Pâtes crémeuses courgettes & saumon** : « 200 g de citron » est une quantité suspecte pour un citron ; saumon frais ou fumé est proposé sans adapter les étapes de cuisson.
- `r-e99302c7e8` — **Saumon au four, légumes rôtis & sauce skyr citron** : 2 pavés de saumon pour 4 personnes, et la sauce skyr annoncée dans le titre n'apparaît pas dans les ingrédients.
- `r-4261d5727b` — **Papillote de saumon citronnée aux poireaux** : « 200 g de citron » et « 1 c. à soupe d’un filet d’huile d’olive » sont des formulations à corriger ; la recette ne précise pas clairement le nombre de papillotes ni l'accompagnement.
- `r-67352b3d01` — **Blanquette de poulet légère aux légumes** : les ingrédients contiennent 200 g de citron, quantité à vérifier ; l'étape 2 fait revenir le bouillon avec les légumes avant de rajouter le bouillon à l'étape 3 ; la matière grasse utilisée n'est pas dans la liste.
- `r-4a83bb2c6f` — **Poulet aux courgettes façon provençale** : l'étape 2 fait revenir les légumes, puis l'étape 3 ajoute à nouveau l'huile ; risque de compter deux fois l'huile. L'accompagnement de riz est listé mais ses étapes de cuisson sont absentes.
- `r-40af79300d` — **Lasagnes légères courgettes & poulet** : l'étape 2 fait cuire les feuilles de lasagnes à part, mais aucune étape ne décrit le montage en couches ni la cuisson finale au four.

## Conclusion de cette vague

Le problème de ces fiches ne se résout pas par une simple correction orthographique. Il faut reprendre leur méthode de préparation et faire correspondre titre, ingrédients, portions, étapes, temps et appareil utilisé. Les fiches concernées doivent être corrigées avant validation.

Le contrôle automatique a signalé 243 fiches candidates dans le catalogue central avec au moins un motif à examiner (étape générique, quantité/portion suspecte, doublon d'ingrédient ou champ incomplet). Ce chiffre est un **signal de tri**, pas 243 erreurs confirmées. Les exemples ci-dessus sont les cas concrets à traiter en priorité.

## Ordre de correction recommandé
1. Fiches manifestement mal décrites ou dangereusement confuses.
2. Fiches dont les ingrédients ne correspondent pas au titre.
3. Quantités et portions incohérentes.
4. Harmonisation des temps et des étapes.
5. Puis revalidation des liens, courses et batch cooking après correction.
