# Test photos — 20 premières recettes du catalogue

Branche : `travail-cuisine-chic-ouf-design`

## Résultat

- Les 20 premières recettes ont maintenant une association image dans `lib/carnet.ts`.
- Le planning réutilise déjà `recipe.image`; le champ `imageAlt` est rempli.
- Les crédits photo et liens vers les pages Pexels sont enregistrés et affichés sous le temps du repas.
- Les images sont demandées à la CDN Pexels en carré 400 × 400, avec paramètre de sortie WebP et qualité 80.
- **Limite importante :** les images n'ont pas été ajoutées comme fichiers binaires locaux dans `public/`. Elles sont chargées depuis Pexels. Les noms `.webp` ci-dessous sont les noms de fichiers prévus si l'on décide ensuite de les héberger localement; ils ne sont pas des fichiers GitHub existants. Le JSON central n'a pas été modifié.

## Rapport de validation demandé

- **Wrap poulet crudités sauce yaourt citron** ➡️ `wrap_poulet_crudites_sauce_yaourt_citron.webp` — [photo Pexels](https://www.pexels.com/photo/a-wrap-with-meat-and-vegetables-on-a-plate-14774691/) — Shameel mukkath
- **Cabillaud pommes de terre sauce skyr citron** ➡️ `cabillaud_pommes_de_terre_sauce_skyr_citron.webp` — [photo Pexels](https://www.pexels.com/photo/fish-and-potatoes-on-a-plate-16273766/) — Nadin Sh
- **Risotto courgettes parmesan 🤖 Monsieur Cuisine Smart** ➡️ `risotto_courgettes_parmesan_monsieur_cuisine_smart.webp` — [photo Pexels](https://www.pexels.com/photo/creamy-risotto-with-zucchini-slices-on-plate-36430162/) — Willians Huerta
- **Poulet paprika & légumes rôtis** ➡️ `poulet_paprika_legumes_rotis.webp` — [photo Pexels](https://www.pexels.com/photo/gourmet-roasted-chicken-with-vegetables-31064161/) — Mahmoud Salem
- **Salade complète poulet & crudités** ➡️ `salade_complete_poulet_crudites.webp` — [photo Pexels](https://www.pexels.com/photo/colorful-chicken-salad-bowl-with-fresh-vegetables-37648023/) — Tochukwu Ekeh
- **Wrap thon crudités sauce yaourt citron** ➡️ `wrap_thon_crudites_sauce_yaourt_citron.webp` — [photo Pexels](https://www.pexels.com/photo/green-leaves-on-white-ceramic-plate-9026808/) — I Own My Food Art
- **Chili doux revisité aux lentilles corail** ➡️ `chili_doux_revisite_aux_lentilles_corail.webp` — [photo Pexels](https://www.pexels.com/photo/rustic-lentil-stew-with-red-bell-peppers-35646479/) — Vural Yavas
- **Salade fraîcheur melon, mozzarella & jambon cru** ➡️ `salade_fraicheur_melon_mozzarella_jambon_cru.webp` — [photo Pexels](https://www.pexels.com/photo/woman-eating-appetizer-in-a-restaurant-19409026/) — Nadin Sh
- **Burger maison équilibré et frites de légumes** ➡️ `burger_maison_equilibre_et_frites_de_legumes.webp` — [photo Pexels](https://www.pexels.com/photo/delicious-burger-and-fries-serving-13163534/) — Aleksey Bystrov
- **Omelette légumes & salade croquante** ➡️ `omelette_legumes_salade_croquante.webp` — [photo Pexels](https://www.pexels.com/photo/omelette-with-vegetable-salad-26161037/) — Serdar Göksu
- **Pâtes crémeuses courgettes & saumon** ➡️ `pates_cremeuses_courgettes_saumon.webp` — [photo Pexels](https://www.pexels.com/photo/delicious-creamy-pasta-with-salmon-and-herbs-29653125/) — Valeria Boltneva
- **Soupe d’automne aux poireaux, carottes et pommes de terre, tartines complètes** ➡️ `soupe_d_automne_aux_poireaux_carottes_et_pommes_de_terre_tartines_completes.webp` — [photo Pexels](https://www.pexels.com/photo/leek-and-potato-soup-5794/) — Karolina Grabowska
- **Saumon au four, légumes rôtis & sauce skyr citron** ➡️ `saumon_au_four_legumes_rotis_sauce_skyr_citron.webp` — [photo Pexels](https://www.pexels.com/photo/dish-with-baked-salmon-and-vegetables-14537687/) — Cristian Mihaila
- **Maquereaux à la moutarde douce & légumes vapeur** ➡️ `maquereaux_a_la_moutarde_douce_legumes_vapeur.webp` — [photo Pexels](https://www.pexels.com/photo/grilled-mackerel-with-fresh-tomato-and-herb-salad-37417629/) — Husien Bisky
- **Poulet aux courgettes façon provençale** ➡️ `poulet_aux_courgettes_facon_provencale.webp` — [photo Pexels](https://www.pexels.com/photo/fried-chicken-with-mushrooms-and-vegetables-21517324/) — Change C.C
- **Courgettes farcies légères** ➡️ `courgettes_farcies_legeres.webp` — [photo Pexels](https://www.pexels.com/photo/traditional-lebanese-stuffed-zucchini-dish-38706545/) — Anthony Rahayel
- **Salade de lentilles corail façon fraîcheur** ➡️ `salade_de_lentilles_corail_facon_fraicheur.webp` — [photo Pexels](https://www.pexels.com/photo/rustic-lentil-stew-with-red-bell-peppers-35646479/) — Vural Yavas
- **Tian de légumes du soleil & poulet** ➡️ `tian_de_legumes_du_soleil_poulet.webp` — [photo Pexels](https://www.pexels.com/photo/appetizing-roasted-chicken-with-vegetables-in-baking-dish-6210955/) — Tim Douglas
- **Poêlée de légumes rôtis & œufs cocotte** ➡️ `poelee_de_legumes_rotis_oeufs_cocotte.webp` — [photo Pexels](https://www.pexels.com/photo/fried-eggs-with-tomatoes-89238/) — Ela Haney
- **Papillote de saumon citronnée aux poireaux** ➡️ `papillote_de_saumon_citronnee_aux_poireaux.webp` — [photo Pexels](https://www.pexels.com/fr-fr/photo/plat-de-saumon-gastronomique-aux-legumes-et-a-la-sauce-34759945/) — This And No Internet 25

## À contrôler visuellement

La première vague sert à tester le rendu dans le planning. Quelques photos sont représentatives du plat plutôt qu'une reproduction exacte de chaque variante de la recette (par exemple, la photo du poisson est une assiette de poisson avec pommes de terre; la photo des lentilles corail montre un ragoût). À valider avant de poursuivre les 20 suivantes.
