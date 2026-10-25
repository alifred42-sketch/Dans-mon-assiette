# Audit culinaire ciblé — vague 11 (hors recettes étudiantes)

Branche : `travail-cuisine-chic-ouf-design`
Source inspectée : catalogue central `data/carnet.json`.
Échantillon : sauces, marinades, épices et préparations maison. Aucune donnée recette modifiée.

## Problèmes confirmés dans les fiches examinées

### 1. Sauce tomate maison légère — `r-3ff1d4abc1`
- L'étape 1 répète toute la liste des ingrédients, ce qui alourdit inutilement la fiche.
- L'étape 2 dit de faire revenir les tomates avec l'oignon et l'ail, puis l'étape 3 redemande d'ajouter « les autres ingrédients de la fiche » : l'ordre est ambigu et risque de faire cuire la tomate avant la base aromatique.
- L'huile est mentionnée une première fois comme matière grasse prévue, puis une seconde fois explicitement à l'étape 3. La quantité risque d'être ajoutée deux fois.
- « 1 feuilles de basilic » est une quantité mal rédigée.
- Les temps affichent 30 minutes, mais l'étape 2 ajoute déjà 5 à 8 minutes sans préciser clairement si ces minutes sont comprises dans les 30 minutes de cuisson annoncées.

**Correction à préparer :** séparer clairement la base aromatique, l'ajout des tomates et le mijotage ; ne compter l'huile qu'une fois ; harmoniser le temps total et corriger le basilic.

### 2. Sauce champignons crémeuse légère — `r-e692c705a1`
- Les ingrédients comprennent deux lignes redondantes ou contradictoires : « 2 Champignons : 500 g » et « 2 Échalote : 1 », puis une autre ligne « 1 gousse d'Échalote + ail ». On ne peut pas savoir avec certitude si la dernière ligne signifie une gousse d'ail et une échalote supplémentaires.
- Les étapes sont génériques et ne disent pas quand ajouter les champignons, l'échalote, le bouillon et le fromage blanc.
- L'étape 2 parle d'huile « prévue », mais aucune huile n'est présente dans les ingrédients.

**Correction à préparer :** réécrire la liste avec un seul ingrédient par ligne, préciser l'huile si elle est nécessaire et donner des étapes spécifiques à cette sauce.

### 3. Sauce fromagère légère — `r-35f255bf02`
- « Noix de muscade : 1 râpée de pinces » est une quantité manifestement mal formée et inexploitable.
- Les ingrédients proposent une quantité mesurable de muscade à remplacer par « une pincée » ou une quantité râpée cohérente.

**Correction à préparer :** corriger cette quantité avant de considérer la fiche comme prête à l'emploi.

### 4. Marinade saumon citron-aneth — `r-f8f03a0136`
- Le champ portions est incomplet : « 4 personnes (4 ».
- Les ingrédients prévoient le jus et les zestes d'un demi-citron, tandis que l'étape 1 dit aussi « du demi-citron » ; ce point est cohérent mais doit être formulé simplement.
- La marinade citronnée est limitée à 15–20 minutes maximum, indication utile à conserver clairement.

**Correction à préparer :** réparer le champ portions, sans modifier arbitrairement les quantités.

### 5. Marinade poulet Tex-Mex — `r-aef573f3e9`
- Le temps de repos est indiqué dans l'étape 4, mais aucune durée minimale claire n'est donnée (contrairement à plusieurs autres marinades).
- Le champ « cuisson : Sans cuisson » décrit correctement la préparation de la marinade, mais l'application doit rester liée à un vrai plat de poulet et ne pas occuper seule un créneau repas.

**Correction à préparer :** préciser le repos recommandé et vérifier la relation avec le plat qui l'utilise.

## Points de contrôle transversaux à ne pas oublier

- Les sauces, marinades et mélanges d'épices sont des préparations associées, pas des repas autonomes.
- Les références textuelles « recette 7 », « recette 32 », etc. doivent devenir des liens techniques fiables vers la bonne préparation.
- Les quantités liées doivent remonter automatiquement dans les courses et le batch cooking, sans doublons.
- Les instructions génériques (« autres ingrédients de la fiche », « huile prévue », « ingrédients dans l'ordre de cuisson ») ne sont pas suffisantes pour une recette que l'on suit pas à pas.

## Statut

Ce lot confirme plusieurs défauts concrets dans des recettes hors catégorie étudiante. Les fiches ci-dessus sont à corriger, mais les changements sont volontairement reportés à la phase de rectification pour ne pas toucher aux données pendant l'audit.
