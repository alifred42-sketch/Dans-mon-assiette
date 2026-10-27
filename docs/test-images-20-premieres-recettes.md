# Test de préparation des images — lot 1 (20 recettes)

Branche : `travail-cuisine-chic-ouf-design`
Catalogue source : `data/carnet.json`
Objectif : préparer le couplage image propre pour les 20 premières fiches du catalogue.

## État technique confirmé
- Les 20 premières fiches n'ont pas de champ `image` renseigné.
- La page `app/semaine/page.tsx` affiche déjà `recipe.image` si le champ existe et garde une image de secours sinon. Aucun changement de code de page n'est nécessaire.
- Les identifiants techniques des recettes sont conservés.
- Les fichiers ci-dessous sont des noms cibles préparés ; **aucune photo WebP n'a encore été téléchargée ou ajoutée**. Ne pas ajouter les champs au JSON avant que les fichiers correspondants soient réellement présents.

## Correspondance prévue

| # | Recette | Identifiant | Fichier cible | Mots-clés de recherche |
|---:|---|---|---|---|
| 1 | Wrap poulet crudités sauce yaourt citron | `r-b6bee72546` | `wrap_poulet_crudites_sauce_yaourt_citron.webp` | wrap poulet crudités yaourt citron |
| 2 | Cabillaud pommes de terre sauce skyr citron | `r-027c5f4f20` | `cabillaud_pommes_de_terre_sauce_skyr_citron.webp` | cabillaud pommes terre skyr citron |
| 3 | Risotto courgettes parmesan 🤖 Monsieur Cuisine Smart | `r-6f3fa27bf5` | `risotto_courgettes_parmesan.webp` | risotto courgettes parmesan |
| 4 | Poulet paprika & légumes rôtis | `r-eec2386df3` | `poulet_paprika_legumes_rotis.webp` | poulet égumes |
| 5 | Salade complète poulet & crudités | `r-c9d038ac38` | `salade_complete_poulet_crudites.webp` | poulet crudités |
| 6 | Wrap thon crudités sauce yaourt citron | `r-286a260f09` | `wrap_thon_crudites_sauce_yaourt_citron.webp` | wrap thon crudités yaourt citron |
| 7 | Chili doux revisité aux lentilles corail | `r-191ad7474a` | `chili_doux_revisite_aux_lentilles_corail.webp` | chili doux revisité lentilles corail |
| 8 | Salade fraîcheur melon, mozzarella & jambon cru | `r-103073cf0c` | `salade_fraicheur_melon_mozzarella_jambon_cru.webp` | melon, mozzarella jambon cru |
| 9 | Burger maison équilibré et frites de légumes | `r-b03b260268` | `burger_maison_equilibre_et_frites_de_legumes.webp` | burger équilibré frites égumes |
| 10 | Omelette légumes & salade croquante | `r-c1ed1606a4` | `omelette_legumes_salade_croquante.webp` | omelette égumes croquante |
| 11 | Pâtes crémeuses courgettes & saumon | `r-ceea7b5051` | `pates_cremeuses_courgettes_saumon.webp` | pâtes crémeuses courgettes saumon |
| 12 | Soupe d’automne aux poireaux, carottes et pommes de terre, tartines complètes | `r-9f72f3e182` | `soupe_d_automne_aux_poireaux_carottes_et_pommes_de_terre_tartines_completes.webp` | soupe ’automne poireaux, carottes pommes terre, |
| 13 | Saumon au four, légumes rôtis & sauce skyr citron | `r-e99302c7e8` | `saumon_au_four_legumes_rotis_sauce_skyr_citron.webp` | saumon four, égumes skyr citron |
| 14 | Maquereaux à la moutarde douce & légumes vapeur | `r-4c28f40550` | `maquereaux_a_la_moutarde_douce_legumes_vapeur.webp` | maquereaux à moutarde égumes |
| 15 | Poulet aux courgettes façon provençale | `r-4a83bb2c6f` | `poulet_aux_courgettes_facon_provencale.webp` | poulet courgettes |
| 16 | Courgettes farcies légères | `r-1aceae48da` | `courgettes_farcies_legeres.webp` | courgettes égères |
| 17 | Salade de lentilles corail façon fraîcheur | `r-8cb821d384` | `salade_de_lentilles_corail_facon_fraicheur.webp` | lentilles corail |
| 18 | Tian de légumes du soleil & poulet | `r-f1341c9e59` | `tian_de_legumes_du_soleil_poulet.webp` | tian égumes soleil poulet |
| 19 | Poêlée de légumes rôtis & œufs cocotte | `r-ea69524e92` | `poelee_de_legumes_rotis_ufs_cocotte.webp` | poê ée égumes œufs cocotte |
| 20 | Papillote de saumon citronnée aux poireaux | `r-4261d5727b` | `papillote_de_saumon_citronnee_aux_poireaux.webp` | papillote saumon poireaux |

## Blocage avant injection
L'environnement de travail actuel ne permet pas de récupérer les octets des photos des banques externes pour les redimensionner et les encoder réellement en WebP. Je ne marque donc aucune photo comme téléchargée, compressée ou injectée. La sécurité est préservée : aucun lien cassé n'est ajouté dans le catalogue et aucune fiche n'est modifiée.

## Validation attendue pour chaque fichier
1. Source avec licence gratuite vérifiable (Pixabay/Pexels).
2. Image correspondant réellement au plat.
3. Conversion carrée 400 × 400, WebP qualité 80.
4. Présence du fichier dans le dossier public avant ajout de `image` au JSON.
5. Vérification du rendu sur la page Semaine.
