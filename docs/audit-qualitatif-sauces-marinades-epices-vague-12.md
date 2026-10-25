# Audit qualitatif ciblé — sauces, marinades et épices — vague 12

Branche : `travail-cuisine-chic-ouf-design`
Périmètre : relecture manuelle ciblée de fiches des catégories `SAUCES`, `MARINADES` et `Epices` dans `data/carnet.json`.
Aucune recette n'a été modifiée.

## Corrections à prioriser — problèmes confirmés dans les fiches lues

### 1. Fiche sauce champignons — incohérences d'ingrédients et étapes
- ID : `r-e692c705a1`
- Titre actuel : « 🍄 14 — SAUCE CHAMPIGNONS CRÉMEUSE LÉGÈRE »
- La liste comporte des lignes mal formées (« 2 Champignons : 500 g », « 2 Échalote : 1 ») et une ligne supplémentaire « 1 gousse d’Échalote + ail » qui semble mélanger deux ingrédients et peut doubler les quantités.
- Les étapes sont génériques et demandent de faire revenir avec « l’huile prévue », mais aucune huile n'apparaît dans la liste.
- Le nom de catégorie est SAUCES, ce qui est cohérent ; c'est le contenu qui doit être réécrit et revérifié.

### 2. Fiche sauce tomate — temps de cuisson contradictoire
- ID : `r-3ff1d4abc1`
- Titre : « Sauce tomate maison légère »
- Temps annoncé : 30 min de cuisson. Les étapes indiquent déjà 5 à 8 min de cuisson, puis encore 30 min de mijotage : le temps réel décrit dépasse donc le temps affiché.
- L'étape 1 recopie toute la liste des ingrédients, puis l'étape 2 utilise déjà tomates, oignon, ail et carotte, avant de demander à l'étape 3 d'ajouter les « autres ingrédients » et encore de l'huile. La séquence est ambiguë.
- Quantité à corriger grammaticalement : « 1 feuilles de basilic ».

### 3. Fiche sauce fromagère — quantité incompréhensible
- ID : `r-35f255bf02`
- Titre : « 🧀 45 — SAUCE FROMAGÈRE LÉGÈRE »
- Ingrédient : « Noix de muscade: 1 râpée de pinces » n'est pas une unité de mesure compréhensible. À remplacer par une quantité culinaire claire, par exemple une pincée ou une petite quantité râpée, après validation de la recette.
- La méthode générale est cohérente avec une sauce épaissie à la Maïzena et à la cancoillotte ; la quantité de muscade est le problème évident relevé.

### 4. Fiche marinade saumon — nombre de portions mal formé
- ID : `r-f8f03a0136`
- Titre : « 🐟 8 — MARINADE SAUMON CITRON-ANETH »
- Champ portions : « 4 personnes (4 » est tronqué/incomplet.
- Les étapes donnent une limite de marinade de 15 à 20 minutes au frais, cohérente avec une préparation très acide pour le poisson ; le champ portions doit être normalisé.

## Problème de fond — fiches de repas rangées parmi les épices

Les quatre fiches suivantes sont dans la source `Epices`, mais leur titre et leurs ingrédients évoquent des plats complets tandis que les étapes ne décrivent pas leur préparation. Elles ne sont pas utilisables en l'état et doivent être reconstruites ou reclassées après décision :

- `r-bbee576cfa` — « 🍗 poulet épicé » : liste d'épices uniquement, mais étapes génériques de cuisson d'ingrédients principaux. Il manque le poulet et les instructions adaptées à un mélange d'épices.
- `r-05b735f44d` — « 🥗 salades méditerranéennes » : ingrédients principalement secs (herbes et épices), mais étapes décrivant une salade avec légumes, féculent, protéine, huile et citron qui ne figurent pas dans la liste.
- `r-7e9ac7cf02` — « 🍗 poulet marocain » : liste d'épices uniquement, étapes génériques sans poulet ni quantité de légumes/liquide.
- `r-d7a5212511` — « 🥕 légumes curry » : liste d'épices uniquement, étapes génériques sans légumes, matière grasse ni liquide.

Ces fiches sont à traiter comme anomalies de contenu confirmées, pas comme de simples alertes automatiques. Elles ne doivent pas être présentées comme des recettes de repas fiables avant correction.

### 5. Classement à confirmer
- `r-b98c773116` — « 🍆 légumes grillés » est une vraie recette de légumes rôtis (courgette, poivron, aubergine, oignon, huile et aromates) mais elle est rangée dans la source `Epices`. Le contenu paraît plausible ; la catégorie doit être corrigée vers les recettes/accompagnements si c'est bien son usage, sans la supprimer.

## Décisions prises
- Aucun contenu de recette ou menu n'a été changé.
- Les 8 fiches ci-dessus constituent un lot concret de corrections prioritaires : 7 anomalies de contenu évidentes ou de champs, et 1 reclassement à confirmer.
- Il reste à faire une relecture similaire sur les autres familles de recettes, puis à vérifier les liens, portions, courses et batch cooking. Cette vague ne signifie donc pas que les 1 625 recettes sont toutes validées.
