# Audit central du carnet — vague 5 (1625 fiches)

Branche : `travail-cuisine-chic-ouf-design`
Fichier contrôlé : `data/carnet.json` (5 664 108 caractères, analysé en mémoire à partir du blob GitHub).

## Inventaire

- 1 625 fiches de recettes
- 728 créneaux de menus sur 52 semaines
- 416 tâches de batch cooking
- 3 443 lignes historiques de courses

## Signalement prioritaire : numéros visibles à retirer des noms

Le contrôle a identifié **192 titres de recettes qui commencent par un numéro de type « RECETTE 001 — » ou « 20 — »**. Le planning contient **182 noms de créneaux** qui reprennent ces numéros.

Exemples : « RECETTE 179 — Nouilles chinoises bœuf légumes façon wok », « RECETTE 023 — Velouté courgettes, poireaux & fromage frais », « 20 — Sauce blanquette légère ».

**Règle cible :** afficher le nom réel de la recette, sans « RECETTE 001 », sans numéro d'ordre et sans numéro de fiche. Les identifiants techniques stables (par exemple `r-b249d80354`) doivent rester dans les données pour que les liens et les menus continuent à fonctionner ; ils ne doivent pas apparaître à l'utilisateur. Les noms du planning doivent être synchronisés avec les noms nettoyés des fiches, y compris les préfixes « Seconde vie — » et « Vide-frigo — » qui sont des libellés fonctionnels à préserver quand ils sont utiles.

Les références textuelles numérotées dans `ingredients`, `steps`, `notes`, `sections` et `source` nécessitent une deuxième passe : certaines peuvent être des références bibliographiques (« livre, recette 17 »), d'autres des renvois internes vers une fiche de sauce/marinade. Ne pas remplacer aveuglément un numéro par un nom tant que sa destination n'a pas été identifiée. Pour les renvois internes, la cible doit être le nom de la préparation, et le lien doit fonctionner par identifiant technique, pas par le texte affiché.

## Autres anomalies structurelles confirmées

### Créneaux du planning sans recette résolue

12 créneaux utilisent un `recipeId` absent de `data.recipes` (IDs du type `etudiant-zero-cuisson-020`). Exemples :
- Semaine 11, dimanche soir : « Dessert zéro cuisson : Le Mug Cake Speculoos sans cuisson ».
- Semaine 18, vendredi midi : « Vide-frigo — Salade de pois chiches à la coppa et artichauts ».
- Semaine 52, lundi soir : « Salade de pois chiches express au thon et persil ».

Ce sont des liens cassés dans le planning ; ils peuvent empêcher de récupérer les ingrédients de la recette. À réparer après audit de la correspondance exacte entre titres et fiches, sans modifier le menu de la semaine pendant la phase de contrôle.

### Temps manquants

112 fiches n'ont pas un temps de préparation ou un temps de cuisson (ou les deux). Les 12 premières exemples sont les fiches `student-tendances-001` à `student-tendances-012`, dont « Les Œufs au Pesto (Pesto Eggs) », « Le Wrap plié en 4 » et « Le Tortilla Smash Burger ». Il faut déterminer le temps réaliste à partir des étapes, et distinguer les recettes sans cuisson (temps de cuisson = 0 / « sans cuisson » selon le format supporté) des valeurs réellement manquantes.

### Textes de remplacement ou incomplets

12 fiches déclenchent les motifs de texte « ingrédients à prévoir », « à compléter », « selon votre goût », « selon disponibilité » ou « préparer selon ». À confirmer individuellement ; ne pas réécrire automatiquement sans vérifier la recette.

### Titres dupliqués

Le contrôle exact de noms normalisés relève 123 occurrences excédentaires dans des groupes de titres répétés, mais ce total inclut des cas qui peuvent être intentionnels : « Opération Vide-Frigo ! » existe une fois par semaine, et des fiches identiques peuvent être dupliquées entre catégories Vegan/Végétarien/Express/Robot. Il faut comparer identifiants, ingrédients, étapes, catégorie, régime et tags avant de décider s'il s'agit d'un doublon inutile. Ne supprimer aucune fiche automatiquement.

### Références aux recettes dans le texte

Le scan trouve des mentions de nombres après « recette » ou « fiche » dans plusieurs champs. Il faut séparer :
1. les références bibliographiques/source (à conserver si elles sont utiles, mais pas forcément afficher dans l'interface) ;
2. les références internes vers une sauce, marinade, vinaigrette, pesto ou mélange d'épices (à remplacer par le nom de la préparation et une relation explicite) ;
3. les anciens numéros de catalogue intégrés au titre (à retirer de l'affichage).

## Règles de protection et de rectification

- Les recettes et les 52 semaines sont auditées, mais les fiches planifiées et le planning ne sont pas modifiés pendant la phase d'audit.
- Garder les identifiants techniques ; supprimer uniquement les numéros d'ordre des noms affichés.
- Toute préparation associée doit être retrouvée par identifiant stable. Sa fiche garde son nom propre et sa catégorie ; ses ingrédients doivent alimenter automatiquement les courses et le batch du plat qui l'utilise.
- Les ingrédients équivalents doivent être regroupés avec prudence ; ne pas fusionner des variantes réellement différentes.
- Vérifier que les listes de courses ne contiennent pas de gestes de préparation et que les tâches de batch correspondent aux recettes réellement prévues.

## État de cette vague

Cette passe a réellement analysé l'intégralité du blob central et confirmé l'inventaire. Aucune recette ni aucun créneau de menu n'a été modifié dans cette vague. Les corrections doivent être préparées après résolution des liens cassés et des renvois internes.
