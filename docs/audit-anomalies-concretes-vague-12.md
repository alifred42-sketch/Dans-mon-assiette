# Audit transversal — vague 12 : anomalies concrètes prioritaires

Branche : `travail-cuisine-chic-ouf-design`
Source : `data/carnet.json` (1 625 fiches)
**Aucune donnée de recette ou de menu n'a été modifiée.** Ce rapport isole des erreurs de contenu à corriger, au-delà des simples alertes de structure.

## Résultats du scan global

- 1 625 fiches dans le catalogue central.
- 112 fiches sans temps de préparation ET sans temps de cuisson.
- 170 fiches contiennent au moins une référence numérique de type « recette 37 » dans les ingrédients ; cela représente 223 lignes de références relevées.
- 8 formulations d'ingrédients ouvertes repérées.
- 8 titres qui commencent comme des préparations (sauce, marinade, pesto, coulis ou vinaigrette) : classement et usage menu à vérifier.
- Ces chiffres ne signifient pas que chaque alerte est une erreur : chaque fiche doit être confirmée avant correction.

## Erreurs de contenu confirmées ou quasi certaines

### 1. Quantités/ingrédients mal formés
- `r-530be65cae` — « 🍗 RECETTE 092 — Poulet façon blanquette aux champignons & carottes » : ingrédient « 200 g de une recette idéale pour préparer plusieurs repas. » Ce n'est pas un ingrédient utilisable ; la vraie quantité et l'ingrédient doivent être récupérés depuis la source.
- `veg-robot-010` — « Truffes Fondantes au Chocolat Noir & Épices Douces » : « 100 g de une pincée de cannelle, poudre de cacao. » Deux éléments semblent avoir été fusionnés dans une quantité incohérente.
- `veg-robot-045` — « Crème fine de Gorgonzola pour Lasagnes de Butternut » : « 100 g de une pincée de noix de muscade. » Quantité manifestement corrompue.
- `systeme-d-004` — « Croque-Monsieur Système D au grille-pain » : « 100 g de une noisette de beurre. » Quantité contradictoire avec une noisette.

### 2. Instructions à réécrire pour sécurité et cohérence
- `systeme-d-004` — une étape conseille de « tourner le grille-pain à l'horizontale sur le côté » pour faire chauffer le croque-monsieur. Cette consigne doit être supprimée et remplacée par une méthode sûre ; la variante une portion a déjà une méthode différente, ce qui crée une incohérence entre deux fiches de même nom.
- `systeme-d-002` — « L'Avocado Toast croustillant » : la fiche 4 personnes annonce 2 avocats et 8 tranches de pain, mais les étapes décrivent deux tranches et un demi-avocat, comme une portion. La fiche une portion décrit aussi deux tranches et un demi-avocat. Il faut harmoniser les étapes avec le nombre de portions.
- `systeme-d-003` — « Couscous minute aux tomates cerises et thon » : la version 4 personnes annonce 24 tomates cerises, mais les étapes ne disent pas explicitement de les répartir entre 4 portions ; la version une portion annonce 6 tomates. Vérifier et uniformiser les formulations d'étapes pour les deux formats.
- `systeme-d-006` — « Purée instantanée gourmande au bacon grillé » : version 4 personnes annonce 8 tranches de bacon, mais l'étape demande de griller « les deux tranches » et de verser « la noisette » de beurre. La version une portion indique 2 tranches, donc la version familiale a gardé des instructions d'une portion.

### 3. Titre de fiche incomplet
- `r-43f1667b8e` — titre actuel « Marinade : » dans la source `ETE 2`. Le titre est inutilisable pour rechercher ou comprendre la fiche. Il faut retrouver le nom exact de la préparation et vérifier sa catégorie avant correction.

### 4. Préparations à contrôler en tant que repas
Le catalogue contient notamment des fiches dont le titre est une préparation seule :
- `r-3ff1d4abc1` — « Sauce tomate maison légère »
- `r-43f1667b8e` — « Marinade : »
- `test-sauce-champignons` — « Sauce champignons légère »
- `test-sauce-citron-ciboulette` — « Sauce citron-ciboulette au skyr »
- `test-vinaigrette-moutarde-citron` — « Vinaigrette légère moutarde-citron »
- `test-sauce-yaourt-moutarde` — « Sauce yaourt-moutarde aux herbes »
- `veg-robot-025` — « Sauce Crémeuse aux Marrons Salée & Champignons Sauvages »
- `vegan-robot-024` — « Pesto de Roquette aux Noix »

Le contrôle des 728 créneaux de menu n'a pas trouvé de correspondance directe avec ces huit identifiants exacts dans le champ `recipeId`. Ils restent à vérifier dans les autres références et sources d'affichage ; il ne faut pas les supprimer.

## Références numériques : priorité haute

Les références sont nombreuses et couvrent plusieurs sources : recettes Express, Été, Hiver, Printemps, Apéro/Verrines, « Je suis fatiguée », Bonus, Mr Cuisine et les menus 52 semaines. Exemples :
- `r-376d7c7d61` — Omelette complète façon bistrot : « base de la recette 37 »
- `r-1a84754dd9` — Œufs brouillés façon italienne : « Pesto de basilic (recette 32) »
- `r-5f33bc99cb` — One pot riz poulet & légumes : « Mélange spécial poulet grillé (recette 2) »
- `r-e50b42df27` — Wrap façon pizza jambon, tomate & mozzarella : « base tomate recette 45 » et « mélange … recette 5 »
- `r-43e1f116de` — Assiette de restes et crudités : référence à recette 263, recette 264, recette 261 et recette 359.

Les numéros ne constituent pas des identifiants fiables. Il faut résoudre chaque référence vers l'ID stable et le nom exact de la préparation, puis vérifier la propagation des ingrédients dans les courses et le batch cooking. Les distinctions entre ingrédients (frais/en boîte, variétés d'oignon, huiles différentes) doivent être préservées.

## Suite recommandée
1. Corriger en premier les quatre lignes d'ingrédients corrompues, le titre « Marinade : » et les étapes familiales restées au format une portion.
2. Résoudre par lots les 223 lignes de références numériques.
3. Compléter les temps manquants à partir des sources, sans inventer de durées.
4. Comparer les groupes de titres identiques au contenu réel : les variantes de portions et les recouvrements Végan/Végétarien ne doivent pas être supprimés automatiquement.
5. Reprendre ensuite l'audit culinaire individuel des autres catégories et la validation courses/batch cooking.

**Statut honnête :** le scan transversal couvre les 1 625 fiches, mais la vérification culinaire individuelle de toutes les recettes n'est pas terminée. Les anomalies concrètes ci-dessus constituent un premier lot de corrections préparables.
