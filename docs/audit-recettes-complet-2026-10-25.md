# Audit technique des recettes — Cuisine Chic Ouf !

Date : 25 octobre 2026  
Branche contrôlée : `travail-cuisine-chic-ouf-design`  
Périmètre : `data/carnet.json` et contrôles complémentaires des fichiers `data/recettes-619.json`, `data/recettes-800.json`, `data/recettes-899.json`.

## Bilan du premier passage automatique

- **1625 fiches** dans `data/carnet.json`.
- **728 emplacements de repas** sur 52 semaines (14 par semaine).
- **544 identifiants de recettes distincts** utilisés dans les menus.
- **416 tâches** de batch cooking.
- **272 fiches candidates** à contrôler manuellement, après détection automatique (les alertes ne signifient pas toutes qu'une recette est invalide).
- Alertes : ingrédients à préciser : 98; modèle générique possible : 117; ligne ingrédient répétée : 68; titre générique/incohérent : 7; temps absent : 112.
- 75 fiches signalées sont liées à au moins un menu hebdomadaire.

## Règles de prudence

- Aucun contenu de recette ni menu des 52 semaines n'a été modifié pendant cet audit.
- Les fiches « Opération Vide-Frigo » sont volontairement génériques : elles ne doivent pas être supprimées sur la seule base de leur intitulé ou de leurs ingrédients adaptables.
- Les variantes de portion (par exemple fiche 1 personne et fiche 4 personnes) ou les recettes présentes dans plusieurs collections ne sont pas considérées automatiquement comme des doublons à supprimer.
- Les mentions « épices ou aromates », « 1 sauce tomate », « 1 herbes », les listes d'ingrédients répétées et les étapes passe-partout sont des signaux à vérifier, surtout si `validated: true` est présent.
- Le script de contrôle hebdomadaire a une règle trop stricte sur le nom du repas du vendredi midi : les menus emploient aussi le libellé « Vide-frigo — … ». Cette alerte doit être corrigée dans le script de contrôle, pas en modifiant les menus durant l'audit.

## PRIORITÉ 1 — Fiches à réparer avant validation (67)

| ID | Recette | Signal(s) | Utilisée dans les menus | Statut validé actuel |
|---|---|---|---|---|
| `r-191ad7474a` | 🍲 RECETTE 007 — Chili doux revisité aux lentilles corail | ingrédients à préciser, modèle générique possible, ligne ingrédient répétée | Non | Oui |
| `r-622abb4fc0` | 🥘 RECETTE 030 — Hachis parmentier léger de poulet | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-c8c2401e21` | 🍗 RECETTE 044 — Boulettes de poulet maison sauce tomate | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-3a1d6f68c6` | 🥔 RECETTE 045 — Gratin léger pommes de terre & poireaux | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-8ab1afdf0b` | 🥘 RECETTE 055 — Parmentier de poulet aux légumes fondants | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-0e0f234326` | 🍅 RECETTE 078 — Poêlée tomate, courgette & œufs façon shakshuka douce | ingrédients à préciser, modèle générique possible, ligne ingrédient répétée | Oui | Oui |
| `r-c9cb14485f` | 🍗 RECETTE 080 — Boulettes de poulet façon méditerranéenne | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-2687b67896` | 🐟 RECETTE 087 — Cabillaud façon curry léger | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-65f878753c` | 🌯 RECETTE 094 — Wrap façon pizza jambon mozzarella | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-8e7e5118c9` | 🍗 RECETTE 109 — Poulet basquaise léger | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-957c974540` | 🍗 RECETTE 133 — Poulet au paprika fumé & légumes rôtis | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-4e7d1bf505` | 🌯 RECETTE 147 — Wrap mexicain léger | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-44d263ba31` | 🍝 RECETTE 148 — Gratin de poireaux au jambon | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-db349daa26` | 🍕 RECETTE 173 — Pizza maison fine poulet légumes | ingrédients à préciser, modèle générique possible, ligne ingrédient répétée | Oui | Oui |
| `r-b249d80354` | 🍜 RECETTE 179 — Nouilles chinoises bœuf légumes façon wok | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-8ff611b414` | 🍝 RECETTE 188 — Penne poulet, tomates séchées & mozzarella | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-50e9f84517` | 🍛 RECETTE 191 — Chili con carne doux | ingrédients à préciser, ligne ingrédient répétée | Oui | Oui |
| `r-7715637c6c` | 🍅 Sauce tomate maison familiale | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-190641843a` | 🥕 Purée maison carottes & pommes de terre | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-f1352e28e6` | 🍞 Pain complet maison (option) | titre générique/incohérent, modèle générique possible, ligne ingrédient répétée | Non | Oui |
| `r-1aff5ca09b` | 🍝 Lasagnes bolognaises maison | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-3ad7aa939f` | 🍅 Poivrons farcis | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-f5d1d509b0` | 🥩 Boulettes sauce tomate | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-34ef9f1b64` | 🥔 Gratin dauphinois | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-415aece0d7` | 🥧 Quiche lorraine maison | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-7d7c6a6118` | 🌶️ Merguez sauce tomate façon orientale | ingrédients à préciser, modèle générique possible, ligne ingrédient répétée | Oui | Oui |
| `r-806ae50db7` | 🍲 Couscous maison simplifié | ingrédients à préciser, titre générique/incohérent, modèle générique possible, ligne ingrédient répétée | Non | Oui |
| `r-cac89622a2` | 🍝 Sauce bolognaise grande quantité | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-5896f01ad1` | 🥘 Paëlla simplifiée | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-e79335a6fc` | 🍄 Velouté de champignons | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-bc488517c3` | 🥔 Purée maison ultra crémeuse | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-28a62501be` | 🥕 Écrasé de légumes maison | titre générique/incohérent, modèle générique possible, ligne ingrédient répétée | Non | Oui |
| `r-cca632b0a5` | 🥣 Béchamel maison légère | ingrédients à préciser, modèle générique possible | Non | Oui |
| `r-7e83748f10` | 🥘 Ratatouille maison | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-9a84e2cfcf` | 🐟 saumon fumé | modèle générique possible | Non | Non renseigné / faux |
| `r-fa4268ac37` | 🥜 quelques noix | titre générique/incohérent, modèle générique possible, ligne ingrédient répétée | Non | Non renseigné / faux |
| `r-9a7861ed08` | 🥕 légumes de saison | titre générique/incohérent, modèle générique possible, ligne ingrédient répétée | Non | Non renseigné / faux |
| `r-5943623be0` | 🐟 Brandade légère de cabillaud aux légumes | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-da42fb44a5` | 🥗 Grande salade de poulet rôti façon bistrot | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-1ba8280664` | 🥘 Gratin de légumes du soleil façon provençale | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-f756d2c53e` | 🍫 chocolat noir | titre générique/incohérent, modèle générique possible, ligne ingrédient répétée | Non | Non renseigné / faux |
| `r-cfc62d8178` | 🐟 thon tomate | modèle générique possible | Non | Non renseigné / faux |
| `r-bac7e05aac` | 🥚 œuf fromage | titre générique/incohérent, modèle générique possible, ligne ingrédient répétée | Non | Non renseigné / faux |
| `r-615c01edc2` | 🐟 saumon poireaux | modèle générique possible | Non | Non renseigné / faux |
| `r-9876a3ed85` | 🥘 Blanquette légère de poulet aux légumes | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-25d0571629` | 🥔 Purée complète légère carottes, pommes de terre & poireaux | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-0cb8ed26c2` | 🍗 Poulet aux olives & légumes du soleil | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-1686e954cb` | 🥘 Ratatouille maison aux légumes rôtis | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-7cb0cfd0a6` | 🍗 Blanquette de poulet ultra facile | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-8f155f716b` | 🍝 Gratin de pâtes poulet, courgettes & tomate | ingrédients à préciser, modèle générique possible, ligne ingrédient répétée | Oui | Oui |
| `r-a5b1b2f944` | 🍚 Risotto légumes du soleil & chèvre frais | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-c979d2eb7c` | 🥘 Moussaka légère revisitée (sans trop d’aubergine 😉) | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-3b9ead72e4` | 🐟 Cabillaud sauce tomate provençale | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-2f064e3e7c` | 🍝 Lasagnes légères poulet, courgettes & tomate | ingrédients à préciser, modèle générique possible, ligne ingrédient répétée | Oui | Oui |
| `r-259b4696a0` | 🐟 Saumon vapeur façon provençale | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-d4a2a550ce` | 🥘 Gratin léger de légumes du soleil | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-f8241b6268` | 🥕 Légumes grillés façon méditerranéenne | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `r-816115df0d` | 🌶️ Poêlée merguez légumes du soleil | ingrédients à préciser, modèle générique possible, ligne ingrédient répétée | Oui | Oui |
| `r-ec4ba6bb28` | 🍳 Omelette aux légumes du soleil | ligne ingrédient répétée | Oui | Oui |
| `r-854fcca6a9` | 🍔 Burger maison de poulet façon bistrot | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `test-pizza-s1` | 🍕 Pizza maison express du vendredi soir | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `test-pizza-s2` | 🍕 Pizza express aux boulettes et légumes | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `veg-ah-pdf-001` | Velouté de Potimarron aux Châtaignes et Éclats de Noisettes | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `veg-ah-pdf-015` | Lasagnes Végétariennes aux Champignons et Épinards | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `vegan-express-032` | Tartine Houmous et Concombre Boostée | ingrédients à préciser, modèle générique possible | Non | Oui |
| `student-microwave-024` | Burrito minute au thon et haricots rouges | ingrédients à préciser, modèle générique possible | Oui | Oui |
| `student-microwave-032` | Chili de bœuf minute en bol | ingrédients à préciser, modèle générique possible | Non | Oui |

## PRIORITÉ 2 — Ingrédients imprécis ou unités à revoir (41)

| ID | Recette | Signal(s) | Utilisée dans les menus | Statut validé actuel |
|---|---|---|---|---|
| `r-eec2386df3` | 🍗 RECETTE 004 — Poulet paprika & légumes rôtis | ingrédients à préciser | Oui | Oui |
| `r-e99302c7e8` | 🐟 RECETTE 013 — Saumon au four, légumes rôtis & sauce skyr citron | ingrédients à préciser | Oui | Oui |
| `r-0a588fec75` | 🌯 RECETTE 026 — Wrap façon César léger | ingrédients à préciser | Non | Oui |
| `r-3f16c360b7` | 🍲 RECETTE 052 — Potée légère de légumes & poulet | ingrédients à préciser | Oui | Oui |
| `r-d6b315c75e` | 🐟 RECETTE 057 — Saumon fumé, pommes de terre tièdes & sauce fraîche | ingrédients à préciser | Oui | Oui |
| `r-b20d266658` | 🌯 RECETTE 058 — Wrap façon ranch poulet crudités | ingrédients à préciser | Oui | Oui |
| `r-7b8723ca0e` | 🍳 RECETTE 063 — Muffins salés courgettes & chèvre | ingrédients à préciser | Non | Oui |
| `r-1521ded2c8` | 🐟 RECETTE 064 — Colin sauce moutarde douce & poireaux | ingrédients à préciser | Oui | Oui |
| `r-c886bf140e` | 🌯 RECETTE 069 — Wrap thon avocat façon fraîcheur | ingrédients à préciser | Oui | Oui |
| `r-d22e0918ca` | 🌯 RECETTE 076 — Wrap façon italien mozzarella & poulet | ingrédients à préciser | Non | Oui |
| `r-ca3320f5ec` | 🌯 RECETTE 082 — Wrap chaud saumon & poireaux fondants | ingrédients à préciser | Oui | Oui |
| `r-93ec53d92f` | 🍝 RECETTE 083 — Pâtes crémeuses poulet champignons | ingrédients à préciser | Non | Oui |
| `r-8b97b45460` | 🌯 RECETTE 088 — Wrap façon kebab maison léger | ingrédients à préciser | Oui | Oui |
| `r-bcd8f8b73e` | 🥗 RECETTE 095 — Buddha bowl saumon fumé & légumes croquants | ingrédients à préciser | Oui | Oui |
| `r-854b6e3c3d` | 🌯 RECETTE 099 — Wrap chèvre chaud & miel léger | ingrédients à préciser | Non | Oui |
| `r-fe4a625a80` | 🥗 RECETTE 101 — Salade de pommes de terre au saumon fumé | ingrédients à préciser | Oui | Oui |
| `r-db6641e339` | 🌯 RECETTE 111 — Wrap nordique | ingrédients à préciser | Non | Oui |
| `r-4719d3da8c` | 🥗 RECETTE 113 — Salade croquante poulet & pomme | ingrédients à préciser | Non | Oui |
| `r-5ff12b1c43` | 🌯 RECETTE 123 — Wrap méditerranéen au thon | ingrédients à préciser | Oui | Oui |
| `r-33676118e1` | 🌯 RECETTE 129 — Wrap façon club sandwich | ingrédients à préciser | Oui | Oui |
| `r-178fbace86` | 🌯 RECETTE 135 — Wrap poulet, avocat & tomates | ingrédients à préciser | Non | Oui |
| `r-21c48b02e9` | 🌯 RECETTE 141 — Wrap poulet, chèvre & courgettes grillées | ingrédients à préciser | Oui | Oui |
| `r-90aa107c6e` | 🥗 RECETTE 149 — Salade méditerranéenne au poulet | ingrédients à préciser | Oui | Oui |
| `r-748d34c381` | 🌯 RECETTE 153 — Wrap poulet façon grecque | ingrédients à préciser | Oui | Oui |
| `r-8dc6cb6359` | 🥗 RECETTE 155 — Bowl chaud légumes rôtis & œufs | ingrédients à préciser | Oui | Oui |
| `r-131fda95c8` | 🥒 RECETTE 167 — Concombre façon tzatziki & poulet grillé | ingrédients à préciser | Oui | Oui |
| `r-0487b25e70` | 🥗 RECETTE 185 — Tartines gourmandes St Môret, saumon & concombre | ingrédients à préciser | Oui | Oui |
| `r-970c91ba88` | 🍲 RECETTE 186 — Blanquette de volaille légère | ingrédients à préciser | Oui | Oui |
| `r-43f1667b8e` | Marinade : | ingrédients à préciser | Non | Non renseigné / faux |
| `r-ea7fd76f2e` | 🌯 Wraps façon tartiflette légère | ingrédients à préciser | Oui | Oui |
| `r-25dfa1eb40` | 🥣 Soupe repas façon asiatique poulet & légumes | ingrédients à préciser | Oui | Oui |
| `r-ae4f6aaa28` | 🌯 Wrap froid façon niçoise | ingrédients à préciser | Oui | Oui |
| `r-7d0bae9cce` | 🌮 Tacos maison poulet façon mexicaine | ingrédients à préciser | Oui | Oui |
| `r-f7ad8158b6` | 🌮 Tacos façon street-food maison (version équilibrée) | ingrédients à préciser | Oui | Oui |
| `r-5d51982087` | 🍅 Tartines de tomates, œufs & fromage frais | ingrédients à préciser | Oui | Oui |
| `r-49588679c4` | 🍝 Gratin de pâtes façon italienne léger | ingrédients à préciser | Oui | Oui |
| `r-ad33de6da2` | 🍔 Burger maison façon montagnard | ingrédients à préciser | Oui | Oui |
| `r-93a95052bc` | 🌯 Wraps façon Buffalo chicken léger | ingrédients à préciser | Oui | Oui |
| `test-burger-s1` | 🍔 Burgers maison du samedi | ingrédients à préciser | Oui | Oui |
| `test-burger-s2` | 🍔 Burgers maison façon bistrot | ingrédients à préciser | Oui | Oui |
| `student-microwave-044` | Tortilla wrap façon Pizza express | ingrédients à préciser | Oui | Oui |

## PRIORITÉ 3 — Temps manquants (112)

| ID | Recette | Signal(s) | Utilisée dans les menus | Statut validé actuel |
|---|---|---|---|---|
| `student-tendances-001` | Les Œufs au Pesto (Pesto Eggs) | temps absent | Non | Non renseigné / faux |
| `student-tendances-002` | Le Wrap plié en 4 | temps absent | Non | Non renseigné / faux |
| `student-tendances-003` | La Salade | temps absent | Non | Non renseigné / faux |
| `student-tendances-004` | Le Tortilla Smash Burger | temps absent | Oui | Non renseigné / faux |
| `student-tendances-005` | Les Croquettes de Courgettes express | temps absent | Non | Non renseigné / faux |
| `student-tendances-006` | La Pomme de Terre (Double cuisson) | temps absent | Non | Non renseigné / faux |
| `student-tendances-007` | Le Tiramisu aux Flocons d'Avoine (sans cuisson) | temps absent | Non | Non renseigné / faux |
| `student-tendances-008` | Le Toast au Yaourt Soufflé | temps absent | Non | Non renseigné / faux |
| `student-tendances-009` | Les Céréales de Mini-Pancakes | temps absent | Oui | Non renseigné / faux |
| `student-tendances-010` | Les Fraises au Cheesecake minute (sans appareil) | temps absent | Non | Non renseigné / faux |
| `student-tendances-011` | Le Croissant caramélisé et aplati | temps absent | Non | Non renseigné / faux |
| `student-tendances-012` | Le Mug Crumble express aux pommes et biscuits | temps absent | Oui | Non renseigné / faux |
| `student-zero-cooking-001` | Salade grecque express à la feta | temps absent | Non | Oui |
| `student-zero-cooking-002` | Wrap fraîcheur au thon et au maïs | temps absent | Non | Oui |
| `student-zero-cooking-003` | La vraie salade Caprese (Tomate-Mozzarella) | temps absent | Non | Oui |
| `student-zero-cooking-004` | Tartine scandinave au saumon fumé et fromage frais | temps absent | Non | Oui |
| `student-zero-cooking-005` | Salade de pois chiches express au thon et persil | temps absent | Non | Oui |
| `student-zero-cooking-006` | Avocat garni de surimi et sauce cocktail | temps absent | Non | Oui |
| `student-zero-cooking-007` | Salade César étudiante rapide | temps absent | Non | Oui |
| `student-zero-cooking-008` | Salade marocaine croquante de carottes et maïs | temps absent | Non | Oui |
| `student-zero-cooking-009` | Club Sandwich thon, œuf dur et crudités | temps absent | Non | Oui |
| `student-zero-cooking-010` | Dessert zéro cuisson : Le Bowl de fromage blanc | temps absent | Non | Oui |
| `student-zero-cooking-011` | Salade italienne de haricots blancs au pesto | temps absent | Non | Oui |
| `student-zero-cooking-012` | Salade mexicaine Haricots rouges, Maïs & Avocat | temps absent | Non | Oui |
| `student-zero-cooking-013` | Rillettes de sardines minute et crackers | temps absent | Non | Oui |
| `student-zero-cooking-014` | Tartine de houmous, feta et concombre | temps absent | Non | Oui |
| `student-zero-cooking-015` | Salade piémontaise étudiante (sans cuisson) | temps absent | Non | Oui |
| `student-zero-cooking-016` | Wrap crémeux au surimi et avocat | temps absent | Non | Oui |
| `student-zero-cooking-017` | Salade de lentilles express de l'étudiant | temps absent | Non | Oui |
| `student-zero-cooking-018` | Salade fraîcheur de surimi et pamplemousse | temps absent | Non | Oui |
| `student-zero-cooking-019` | Sandwich italien Tomate, Mozzarella & Jambon cru | temps absent | Non | Oui |
| `student-zero-cooking-020` | Dessert zéro cuisson : Le Mug Cake Speculoos sans | temps absent | Non | Oui |
| `student-zero-cooking-021` | Salade italienne express au melon et jambon cru | temps absent | Non | Oui |
| `student-zero-cooking-022` | Salade de haricots rouges croquante au thon | temps absent | Non | Oui |
| `student-zero-cooking-023` | Wrap nordique express au crabe et concombre | temps absent | Non | Oui |
| `student-zero-cooking-024` | Tartine méditerranéenne aux légumes blancs et feta | temps absent | Non | Oui |
| `student-zero-cooking-025` | Salade niçoise de l'étudiant pressé | temps absent | Non | Oui |
| `student-zero-cooking-026` | Salade tex-mex de maïs à l'avocat | temps absent | Non | Oui |
| `student-zero-cooking-027` | Gazpacho andalou aux croûtons express | temps absent | Non | Oui |
| `student-zero-cooking-028` | Rillettes de thon express à la Kiri (pour sandwich ou | temps absent | Non | Oui |
| `student-zero-cooking-029` | Salade de surimi croquante au maïs | temps absent | Non | Oui |
| `student-zero-cooking-030` | Dessert zéro cuisson : Le mini-bagel sucré Banane & | temps absent | Non | Oui |
| `student-zero-cooking-031` | Salade de pois chiches à la coppa et artichauts | temps absent | Non | Oui |
| `student-zero-cooking-032` | Salade croquante de haricots blancs au thon et poivron | temps absent | Non | Oui |
| `student-zero-cooking-033` | Wrap fraîcheur au saumon fumé et pommes vertes | temps absent | Non | Oui |
| `student-zero-cooking-034` | Panino express à la tapenade et chèvre frais | temps absent | Non | Oui |
| `student-zero-cooking-035` | Salade de lentilles printanière au fromage de chèvre | temps absent | Non | Oui |
| `student-zero-cooking-036` | Tartine d'avocat et surimi (façon Guacamole minute) | temps absent | Non | Oui |
| `student-zero-cooking-037` | Soupe froide express de concombre au yaourt et | temps absent | Non | Oui |
| `student-zero-cooking-038` | Rillettes de maquereau à la moutarde et pain noir | temps absent | Non | Oui |
| `student-zero-cooking-039` | Salade de maïs gourmande aux dés de jambon et | temps absent | Non | Oui |
| `student-zero-cooking-040` | Dessert zéro cuisson : Le sandwich perdu sucré à la | temps absent | Non | Oui |
| `student-zero-cooking-041` | Salade italienne de pois chiches au jambon cru et | temps absent | Non | Oui |
| `student-zero-cooking-042` | Salade mexicaine express aux trois grains | temps absent | Non | Oui |
| `student-zero-cooking-043` | Salade fraîche de concombre, feta et menthe | temps absent | Non | Oui |
| `student-zero-cooking-044` | Wrap fraîcheur au jambon blanc, fromage frais et | temps absent | Non | Oui |
| `student-zero-cooking-045` | Salade de riz minute au thon, maïs et cornichons | temps absent | Non | Oui |
| `student-zero-cooking-046` | Carpaccio de tomates au jambon cru et pesto | temps absent | Non | Oui |
| `student-zero-cooking-047` | Rillettes de crabe minute sur tartines croustillantes | temps absent | Non | Oui |
| `student-zero-cooking-048` | Salade nordique de haricots blancs au saumon fumé | temps absent | Non | Oui |
| `student-zero-cooking-049` | Salade croquante de surimi aux carottes râpées | temps absent | Non | Oui |
| `student-zero-cooking-050` | Dessert magique : Le Trifle minute Banane & Chocolat | temps absent | Non | Oui |
| `student-systeme-d-001` | Noodles infusées au poulet et petits pois (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-002` | L'Avocado Toast croustillant (au grille-pain) | temps absent | Non | Oui |
| `student-systeme-d-003` | Couscous minute aux tomates cerises et thon (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-004` | Croque-Monsieur Système D au grille-pain | temps absent | Non | Oui |
| `student-systeme-d-005` | Soupe de miso instantanée aux dés de tofu (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-006` | Purée instantanée gourmande au bacon grillé | temps absent | Non | Oui |
| `student-systeme-d-007` | Bruschetta Tomate & Mozzarella fondante | temps absent | Non | Oui |
| `student-systeme-d-008` | One-Pot de vermicelles de riz au curry et surimi | temps absent | Non | Oui |
| `student-systeme-d-009` | Tartine "Welsh" étudiante au cheddar | temps absent | Non | Oui |
| `student-systeme-d-010` | Dessert Système D : Le Porridge express Banane & Chocolat | temps absent | Non | Oui |
| `student-systeme-d-011` | Salade de vermicelles de soja au thon et sésame | temps absent | Non | Oui |
| `student-systeme-d-012` | La Tartine "Pizza" croustillante | temps absent | Non | Oui |
| `student-systeme-d-013` | Taboulé minute aux raisins secs et pois chiches | temps absent | Non | Oui |
| `student-systeme-d-014` | Tartines fondantes de chèvre au miel | temps absent | Non | Oui |
| `student-systeme-d-015` | Velouté express de tomates aux croûtons dorés | temps absent | Non | Oui |
| `student-systeme-d-016` | Purée express à la vache qui rit et dés de jambon | temps absent | Non | Oui |
| `student-systeme-d-017` | Tartine norvégienne au fromage frais et miettes de crabe | temps absent | Non | Oui |
| `student-systeme-d-018` | Polenta minute au parmesan (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-019` | Salade de cup-nouilles enrichie au maïs et surimi | temps absent | Non | Oui |
| `student-systeme-d-020` | Dessert Système D : Le Toast brioché bananes et éclats de chocolat | temps absent | Non | Oui |
| `student-systeme-d-021` | Noodles de l'espace au thon et sauce soja (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-022` | Tartine crousti-fondante au camembert (au grille-pain) | temps absent | Non | Oui |
| `student-systeme-d-023` | Semoule parfumée au chorizo minute (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-024` | Le "Toast-Tunisien" thon et œuf dur | temps absent | Non | Oui |
| `student-systeme-d-025` | Soupe de vermicelles express (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-026` | Aligot Système D express | temps absent | Non | Oui |
| `student-systeme-d-027` | Tartine nordique au saumon et concombre croustillant | temps absent | Non | Oui |
| `student-systeme-d-028` | Couscous minute aux pois chiches et raisins secs (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-029` | Tartine "Club-Maïs" au surimi | temps absent | Non | Oui |
| `student-systeme-d-030` | Dessert Système D : Le Toast S'mores Chocolat & Guimauve | temps absent | Non | Oui |
| `student-systeme-d-031` | Nouilles de riz vapeur à la sauce cacahuète express (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-032` | Tartine "Hot-Dog" étudiante au cheddar | temps absent | Non | Oui |
| `student-systeme-d-033` | Semoule fondante au pesto et feta (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-034` | Tartine croustillante Thon-Mayo et emmental fondu | temps absent | Non | Oui |
| `student-systeme-d-035` | Soupe-repas Minute au poulet et vermicelles (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-036` | Purée express aux lardons croustillants (au grille-pain) | temps absent | Non | Oui |
| `student-systeme-d-037` | Tartine fraîcheur au maquereau et fromage à la crème | temps absent | Non | Oui |
| `student-systeme-d-038` | Couscous express sucré-salé aux raisins et surimi (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-039` | Le "Toast-Mex" au maïs et cheddar | temps absent | Non | Oui |
| `student-systeme-d-040` | Dessert Système D : Le Toast brioché à la pâte à tartiner et biscuits écrasés | temps absent | Non | Oui |
| `student-systeme-d-041` | Noodles coco-curry minute (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-042` | La Tartine "Club-Poulet" au pesto et fromage frais | temps absent | Non | Oui |
| `student-systeme-d-043` | Semoule express à la tapenade et thon (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-044` | Le "Toast-Raclette" Système D au jambon cru | temps absent | Non | Oui |
| `student-systeme-d-045` | Soupe de légumes minute aux croûtons de chèvre (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-046` | Aligot minute express au jambon cru | temps absent | Non | Oui |
| `student-systeme-d-047` | Tartine campagnarde aux rillettes de sardines et cornichons | temps absent | Non | Oui |
| `student-systeme-d-048` | Couscous minute aux légumes fins (à la bouilloire) | temps absent | Non | Oui |
| `student-systeme-d-049` | Tartine "Welsh" minute au surimi | temps absent | Non | Oui |
| `student-systeme-d-050` | Dessert Système D : Le Porridge chocolat-spéculoos (à la bouilloire) | temps absent | Non | Oui |

## Vérification des fichiers de recettes complémentaires

- `data/recettes-619.json` : 80 fiches chargées.
- `data/recettes-800.json` : 181 fiches chargées.
- `data/recettes-899.json` : 99 fiches chargées.
- Le titre « Taboulé de Chou-Fleur Express » apparaît trois fois dans `recettes-800.json` (sources 647, 721 et 764). Deux fiches ont une base très proche ; la troisième a concombre et menthe. Comparer avant de fusionner.
- Neuf titres de ces fichiers correspondent plutôt à des sauces, tartinades, pesto ou compotes et doivent être confirmés dans leur collection de destination.
- 27 fiches contiennent des références « recette n°… » : vérifier que le lien correspond bien à une sauce, marinade ou préparation existante et que ses ingrédients sont bien intégrés aux courses sans doublons.

## Suite de correction recommandée

1. Réparer d'abord les fiches signalées avec titre générique, ingrédients doublés ou instructions passe-partout — priorité absolue lorsqu'elles sont utilisées dans les menus.
2. Remplacer les ingrédients imprécis par des quantités et noms concrets ; supprimer les lignes dupliquées uniquement après comparaison avec la source.
3. Compléter les temps manquants dans les fiches qui doivent afficher une durée, en distinguant préparation, cuisson et repos.
4. Reclasser les sauces, marinades, vinaigrettes, tartinades, pestos et compotes dans leurs rubriques dédiées sans les supprimer si elles sont référencées par un vrai repas.
5. Relancer le contrôle des 52 semaines, des courses et du batch cooking après les corrections, sans fusionner vers `main` avant validation.
