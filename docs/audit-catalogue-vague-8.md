# Audit complémentaire des recettes — vague 8

Branche : `travail-cuisine-chic-ouf-design`
Source analysée : `data/carnet.json` (blob `582bc49c2a740d2635d8e8b5f45b0be03c87653a`).
Périmètre : audit uniquement, aucune recette ni aucun menu modifié.

## Règle de traitement des doublons

Les recettes présentes à la fois dans les catégories **Végan** et **Végétarienne** sont considérées comme des doublons volontaires de classement. Elles sont exclues des anomalies de doublon à corriger. Les répétitions « Opération Vide-Frigo ! » (une par semaine) ainsi que les modèles de repas génériques réutilisés dans le planning sont également à examiner selon leur rôle, pas à supprimer automatiquement.

## Temps de préparation/cuisson absents

112 fiches centrales ne renseignent ni `timePrep` ni `timeCook`. Il s'agit d'un manque de données à vérifier avec la fiche source, pas d'une autorisation à inventer des durées. Trois de ces fiches sont utilisées dans le planning des 52 semaines :
- `student-tendances-004` — Le Tortilla Smash Burger
- `student-tendances-009` — Les Céréales de Mini-Pancakes
- `student-tendances-012` — Le Mug Crumble express aux pommes et biscuits

Ces trois recettes sont prioritaires car les temps affichés dans l'application, les courses et le batch cooking peuvent dépendre de données complètes.

### Liste complète des 112 fiches à contrôler

- [HORS MENU] `student-tendances-001` — Les Œufs au Pesto (Pesto Eggs) (source : PDF RECETTES ETUDIANTS - LES 12 RECETTES TENDANCES — fiche 1/12)
- [HORS MENU] `student-tendances-002` — Le Wrap plié en 4 (source : PDF RECETTES ETUDIANTS - LES 12 RECETTES TENDANCES — fiche 2/12)
- [HORS MENU] `student-tendances-003` — La Salade (source : PDF RECETTES ETUDIANTS - LES 12 RECETTES TENDANCES — fiche 3/12)
- [MENU] `student-tendances-004` — Le Tortilla Smash Burger (source : PDF RECETTES ETUDIANTS - LES 12 RECETTES TENDANCES — fiche 4/12)
- [HORS MENU] `student-tendances-005` — Les Croquettes de Courgettes express (source : PDF RECETTES ETUDIANTS - LES 12 RECETTES TENDANCES — fiche 5/12)
- [HORS MENU] `student-tendances-006` — La Pomme de Terre (Double cuisson) (source : PDF RECETTES ETUDIANTS - LES 12 RECETTES TENDANCES — fiche 6/12)
- [HORS MENU] `student-tendances-007` — Le Tiramisu aux Flocons d'Avoine (sans cuisson) (source : PDF RECETTES ETUDIANTS - LES 12 RECETTES TENDANCES — fiche 7/12)
- [HORS MENU] `student-tendances-008` — Le Toast au Yaourt Soufflé (source : PDF RECETTES ETUDIANTS - LES 12 RECETTES TENDANCES — fiche 8/12)
- [MENU] `student-tendances-009` — Les Céréales de Mini-Pancakes (source : PDF RECETTES ETUDIANTS - LES 12 RECETTES TENDANCES — fiche 9/12)
- [HORS MENU] `student-tendances-010` — Les Fraises au Cheesecake minute (sans appareil) (source : PDF RECETTES ETUDIANTS - LES 12 RECETTES TENDANCES — fiche 10/12)
- [HORS MENU] `student-tendances-011` — Le Croissant caramélisé et aplati (source : PDF RECETTES ETUDIANTS - LES 12 RECETTES TENDANCES — fiche 11/12)
- [MENU] `student-tendances-012` — Le Mug Crumble express aux pommes et biscuits (source : PDF RECETTES ETUDIANTS - LES 12 RECETTES TENDANCES — fiche 12/12)
- [HORS MENU] `student-zero-cooking-001` — Salade grecque express à la feta (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 1/50)
- [HORS MENU] `student-zero-cooking-002` — Wrap fraîcheur au thon et au maïs (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 2/50)
- [HORS MENU] `student-zero-cooking-003` — La vraie salade Caprese (Tomate-Mozzarella) (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 3/50)
- [HORS MENU] `student-zero-cooking-004` — Tartine scandinave au saumon fumé et fromage frais (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 4/50)
- [HORS MENU] `student-zero-cooking-005` — Salade de pois chiches express au thon et persil (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 5/50)
- [HORS MENU] `student-zero-cooking-006` — Avocat garni de surimi et sauce cocktail (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 6/50)
- [HORS MENU] `student-zero-cooking-007` — Salade César étudiante rapide (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 7/50)
- [HORS MENU] `student-zero-cooking-008` — Salade marocaine croquante de carottes et maïs (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 8/50)
- [HORS MENU] `student-zero-cooking-009` — Club Sandwich thon, œuf dur et crudités (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 9/50)
- [HORS MENU] `student-zero-cooking-010` — Dessert zéro cuisson : Le Bowl de fromage blanc (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 10/50)
- [HORS MENU] `student-zero-cooking-011` — Salade italienne de haricots blancs au pesto (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 11/50)
- [HORS MENU] `student-zero-cooking-012` — Salade mexicaine Haricots rouges, Maïs & Avocat (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 12/50)
- [HORS MENU] `student-zero-cooking-013` — Rillettes de sardines minute et crackers (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 13/50)
- [HORS MENU] `student-zero-cooking-014` — Tartine de houmous, feta et concombre (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 14/50)
- [HORS MENU] `student-zero-cooking-015` — Salade piémontaise étudiante (sans cuisson) (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 15/50)
- [HORS MENU] `student-zero-cooking-016` — Wrap crémeux au surimi et avocat (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 16/50)
- [HORS MENU] `student-zero-cooking-017` — Salade de lentilles express de l'étudiant (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 17/50)
- [HORS MENU] `student-zero-cooking-018` — Salade fraîcheur de surimi et pamplemousse (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 18/50)
- [HORS MENU] `student-zero-cooking-019` — Sandwich italien Tomate, Mozzarella & Jambon cru (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 19/50)
- [HORS MENU] `student-zero-cooking-020` — Dessert zéro cuisson : Le Mug Cake Speculoos sans (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 20/50)
- [HORS MENU] `student-zero-cooking-021` — Salade italienne express au melon et jambon cru (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 21/50)
- [HORS MENU] `student-zero-cooking-022` — Salade de haricots rouges croquante au thon (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 22/50)
- [HORS MENU] `student-zero-cooking-023` — Wrap nordique express au crabe et concombre (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 23/50)
- [HORS MENU] `student-zero-cooking-024` — Tartine méditerranéenne aux légumes blancs et feta (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 24/50)
- [HORS MENU] `student-zero-cooking-025` — Salade niçoise de l'étudiant pressé (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 25/50)
- [HORS MENU] `student-zero-cooking-026` — Salade tex-mex de maïs à l'avocat (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 26/50)
- [HORS MENU] `student-zero-cooking-027` — Gazpacho andalou aux croûtons express (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 27/50)
- [HORS MENU] `student-zero-cooking-028` — Rillettes de thon express à la Kiri (pour sandwich ou (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 28/50)
- [HORS MENU] `student-zero-cooking-029` — Salade de surimi croquante au maïs (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 29/50)
- [HORS MENU] `student-zero-cooking-030` — Dessert zéro cuisson : Le mini-bagel sucré Banane & (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 30/50)
- [HORS MENU] `student-zero-cooking-031` — Salade de pois chiches à la coppa et artichauts (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 31/50)
- [HORS MENU] `student-zero-cooking-032` — Salade croquante de haricots blancs au thon et poivron (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 32/50)
- [HORS MENU] `student-zero-cooking-033` — Wrap fraîcheur au saumon fumé et pommes vertes (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 33/50)
- [HORS MENU] `student-zero-cooking-034` — Panino express à la tapenade et chèvre frais (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 34/50)
- [HORS MENU] `student-zero-cooking-035` — Salade de lentilles printanière au fromage de chèvre (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 35/50)
- [HORS MENU] `student-zero-cooking-036` — Tartine d'avocat et surimi (façon Guacamole minute) (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 36/50)
- [HORS MENU] `student-zero-cooking-037` — Soupe froide express de concombre au yaourt et (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 37/50)
- [HORS MENU] `student-zero-cooking-038` — Rillettes de maquereau à la moutarde et pain noir (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 38/50)
- [HORS MENU] `student-zero-cooking-039` — Salade de maïs gourmande aux dés de jambon et (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 39/50)
- [HORS MENU] `student-zero-cooking-040` — Dessert zéro cuisson : Le sandwich perdu sucré à la (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 40/50)
- [HORS MENU] `student-zero-cooking-041` — Salade italienne de pois chiches au jambon cru et (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 41/50)
- [HORS MENU] `student-zero-cooking-042` — Salade mexicaine express aux trois grains (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 42/50)
- [HORS MENU] `student-zero-cooking-043` — Salade fraîche de concombre, feta et menthe (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 43/50)
- [HORS MENU] `student-zero-cooking-044` — Wrap fraîcheur au jambon blanc, fromage frais et (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 44/50)
- [HORS MENU] `student-zero-cooking-045` — Salade de riz minute au thon, maïs et cornichons (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 45/50)
- [HORS MENU] `student-zero-cooking-046` — Carpaccio de tomates au jambon cru et pesto (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 46/50)
- [HORS MENU] `student-zero-cooking-047` — Rillettes de crabe minute sur tartines croustillantes (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 47/50)
- [HORS MENU] `student-zero-cooking-048` — Salade nordique de haricots blancs au saumon fumé (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 48/50)
- [HORS MENU] `student-zero-cooking-049` — Salade croquante de surimi aux carottes râpées (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 49/50)
- [HORS MENU] `student-zero-cooking-050` — Dessert magique : Le Trifle minute Banane & Chocolat (source : PDF « RECETTES ETUDIANT ZERO CUISSON » — fiche 50/50)
- [HORS MENU] `student-systeme-d-001` — Noodles infusées au poulet et petits pois (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 1/50)
- [HORS MENU] `student-systeme-d-002` — L'Avocado Toast croustillant (au grille-pain) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 2/50)
- [HORS MENU] `student-systeme-d-003` — Couscous minute aux tomates cerises et thon (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 3/50)
- [HORS MENU] `student-systeme-d-004` — Croque-Monsieur Système D au grille-pain (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 4/50)
- [HORS MENU] `student-systeme-d-005` — Soupe de miso instantanée aux dés de tofu (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 5/50)
- [HORS MENU] `student-systeme-d-006` — Purée instantanée gourmande au bacon grillé (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 6/50)
- [HORS MENU] `student-systeme-d-007` — Bruschetta Tomate & Mozzarella fondante (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 7/50)
- [HORS MENU] `student-systeme-d-008` — One-Pot de vermicelles de riz au curry et surimi (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 8/50)
- [HORS MENU] `student-systeme-d-009` — Tartine "Welsh" étudiante au cheddar (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 9/50)
- [HORS MENU] `student-systeme-d-010` — Dessert Système D : Le Porridge express Banane & Chocolat (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 10/50)
- [HORS MENU] `student-systeme-d-011` — Salade de vermicelles de soja au thon et sésame (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 11/50)
- [HORS MENU] `student-systeme-d-012` — La Tartine "Pizza" croustillante (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 12/50)
- [HORS MENU] `student-systeme-d-013` — Taboulé minute aux raisins secs et pois chiches (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 13/50)
- [HORS MENU] `student-systeme-d-014` — Tartines fondantes de chèvre au miel (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 14/50)
- [HORS MENU] `student-systeme-d-015` — Velouté express de tomates aux croûtons dorés (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 15/50)
- [HORS MENU] `student-systeme-d-016` — Purée express à la vache qui rit et dés de jambon (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 16/50)
- [HORS MENU] `student-systeme-d-017` — Tartine norvégienne au fromage frais et miettes de crabe (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 17/50)
- [HORS MENU] `student-systeme-d-018` — Polenta minute au parmesan (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 18/50)
- [HORS MENU] `student-systeme-d-019` — Salade de cup-nouilles enrichie au maïs et surimi (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 19/50)
- [HORS MENU] `student-systeme-d-020` — Dessert Système D : Le Toast brioché bananes et éclats de chocolat (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 20/50)
- [HORS MENU] `student-systeme-d-021` — Noodles de l'espace au thon et sauce soja (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 21/50)
- [HORS MENU] `student-systeme-d-022` — Tartine crousti-fondante au camembert (au grille-pain) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 22/50)
- [HORS MENU] `student-systeme-d-023` — Semoule parfumée au chorizo minute (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 23/50)
- [HORS MENU] `student-systeme-d-024` — Le "Toast-Tunisien" thon et œuf dur (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 24/50)
- [HORS MENU] `student-systeme-d-025` — Soupe de vermicelles express (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 25/50)
- [HORS MENU] `student-systeme-d-026` — Aligot Système D express (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 26/50)
- [HORS MENU] `student-systeme-d-027` — Tartine nordique au saumon et concombre croustillant (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 27/50)
- [HORS MENU] `student-systeme-d-028` — Couscous minute aux pois chiches et raisins secs (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 28/50)
- [HORS MENU] `student-systeme-d-029` — Tartine "Club-Maïs" au surimi (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 29/50)
- [HORS MENU] `student-systeme-d-030` — Dessert Système D : Le Toast S'mores Chocolat & Guimauve (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 30/50)
- [HORS MENU] `student-systeme-d-031` — Nouilles de riz vapeur à la sauce cacahuète express (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 31/50)
- [HORS MENU] `student-systeme-d-032` — Tartine "Hot-Dog" étudiante au cheddar (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 32/50)
- [HORS MENU] `student-systeme-d-033` — Semoule fondante au pesto et feta (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 33/50)
- [HORS MENU] `student-systeme-d-034` — Tartine croustillante Thon-Mayo et emmental fondu (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 34/50)
- [HORS MENU] `student-systeme-d-035` — Soupe-repas Minute au poulet et vermicelles (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 35/50)
- [HORS MENU] `student-systeme-d-036` — Purée express aux lardons croustillants (au grille-pain) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 36/50)
- [HORS MENU] `student-systeme-d-037` — Tartine fraîcheur au maquereau et fromage à la crème (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 37/50)
- [HORS MENU] `student-systeme-d-038` — Couscous express sucré-salé aux raisins et surimi (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 38/50)
- [HORS MENU] `student-systeme-d-039` — Le "Toast-Mex" au maïs et cheddar (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 39/50)
- [HORS MENU] `student-systeme-d-040` — Dessert Système D : Le Toast brioché à la pâte à tartiner et biscuits écrasés (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 40/50)
- [HORS MENU] `student-systeme-d-041` — Noodles coco-curry minute (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 41/50)
- [HORS MENU] `student-systeme-d-042` — La Tartine "Club-Poulet" au pesto et fromage frais (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 42/50)
- [HORS MENU] `student-systeme-d-043` — Semoule express à la tapenade et thon (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 43/50)
- [HORS MENU] `student-systeme-d-044` — Le "Toast-Raclette" Système D au jambon cru (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 44/50)
- [HORS MENU] `student-systeme-d-045` — Soupe de légumes minute aux croûtons de chèvre (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 45/50)
- [HORS MENU] `student-systeme-d-046` — Aligot minute express au jambon cru (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 46/50)
- [HORS MENU] `student-systeme-d-047` — Tartine campagnarde aux rillettes de sardines et cornichons (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 47/50)
- [HORS MENU] `student-systeme-d-048` — Couscous minute aux légumes fins (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 48/50)
- [HORS MENU] `student-systeme-d-049` — Tartine "Welsh" minute au surimi (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 49/50)
- [HORS MENU] `student-systeme-d-050` — Dessert Système D : Le Porridge chocolat-spéculoos (à la bouilloire) (source : PDF « RECETTES ETUDIANT SYSTEME D » — fiche 50/50)

## Titres contenant un numéro de catalogue

188 titres de recettes de `data.carnet.json` contiennent encore un préfixe numéroté de type `RECETTE 001 —` ou `10 —`. La règle demandée est de n'afficher que le nom réel de la recette, sans numéro visible. Lors de la correction, conserver les IDs techniques stables et contrôler les libellés du planning, des fiches, des collections et des liens avant de modifier l'affichage.

Exemples :
- `r-b6bee72546` — « 🌯 RECETTE 001 — Wrap poulet crudités sauce yaourt citron » → libellé attendu : « Wrap poulet crudités sauce yaourt citron »
- `r-a4f8af9be1` — « 🥣 10 — SAUCE CHAMPIGNONS CRÉMEUSE LÉGÈRE 🍄 » → libellé attendu : « Sauce champignons crémeuse légère »

## Doublons hors classement Végan/Végétarien : à comparer, ne pas supprimer automatiquement

Le rapprochement par nom fait ressortir d'autres groupes de titres identiques ou quasi identiques. Parmi les exemples à examiner :
- Sauce champignons crémeuse légère : `r-a4f8af9be1` (source Livre_de_Recettes_Partie2.pdf, validée) et `r-e692c705a1` (source SAUCES, non validée). Vérifier ingrédients/étapes et rôle dans la rubrique sauces.
- Noodles infusées au poulet et petits pois (à la bouilloire) : `systeme-d-001` et `student-systeme-d-001`.
- Avocado Toast croustillant (au grille-pain) : `systeme-d-002` et `student-systeme-d-002`.
- Couscous minute aux tomates cerises et thon (à la bouilloire) : `systeme-d-003` et `student-systeme-d-003`.
- Autres recettes « Système D » : plusieurs anciennes entrées `systeme-d-XXX` coexistent avec des entrées `student-systeme-d-XXX` de même nom. Comparer le contenu, les IDs utilisés et la validation avant toute fusion.

Le rapprochement automatique détecte des titres, pas une identité culinaire certaine. Les groupes doivent être classés comme doublons confirmés, variantes utiles, copies techniques ou recettes distinctes avant correction. Ne pas toucher aux recettes Végan/Végétarienne qui se recoupent volontairement.

## Suite de l'audit

1. Comparer les 112 fiches sans temps à leurs documents sources, en commençant par les trois utilisées dans le planning.
2. Comparer les entrées `systeme-d-XXX` et `student-systeme-d-XXX` : champs, ingrédients, étapes, validation et références du planning.
3. Vérifier les recettes de type sauce, marinade, pesto et préparation associée afin de repérer les préparations rangées comme repas et les liens qui n'alimentent pas automatiquement les courses/batch cooking.
4. Continuer l'audit de qualité des ingrédients, étapes et cohérence des recettes sur l'ensemble du catalogue, sans se limiter aux recettes étudiantes.

**Statut :** constats enregistrés. Aucune correction de données effectuée dans cette vague.
