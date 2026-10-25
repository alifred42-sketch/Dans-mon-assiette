# Audit des sources de recettes — vague 10

Branche : `travail-cuisine-chic-ouf-design`
Périmètre : sources `data/recettes-619.json`, `data/recettes-800.json`, `data/recettes-899.json`.
Aucune recette ni aucun menu modifié.

## Bilan du lot

- `recettes-619.json` : 80 fiches examinées.
- `recettes-800.json` : 181 fiches examinées.
- `recettes-899.json` : 99 fiches examinées.
- Total de ce lot : 360 fiches.
- Les trois fichiers contiennent des ingrédients et des étapes pour les fiches inspectées. Les temps de préparation/cuisson sont présents dans les exemples vérifiés ; la cohérence culinaire reste à contrôler recette par recette.

## Anomalie importante : références internes non sécurisées

Dans `recettes-619.json`, 35 lignes d'ingrédients renvoient à un numéro de recette, par exemple :
- Curry de Lentilles Corail et Butternut au Gingembre — « Mélange curry doux indien (recette 7) »
- Cannellonis Végétariens à la Courge Butternut et Ricotta — « Mélange herbes de Provence (recette 1) »
- Gnocchis Rôtis au Four à la Tomate, Mozzarella et Pesto — « Base tomate à tout faire (recette 45) », « Sauce pesto léger au basilic (recette 32) », « Mélange italien tomate & pizza (recette 5) »
- Bowl d'Hiver Express Lentilles, Avocat et Chèvre Frais — « Vinaigrette légère moutarde-citron (recette 359) »
- Shakshuka Express aux Œufs et Pois Chiches — « Mélange fajitas / tex-mex (recette 3) »

Ces renvois ne sont pas des liens techniques garantis. Il faut retrouver la préparation exacte et créer une relation stable par identifiant, ou remplacer la référence par les ingrédients directs si aucune fiche liée ne convient. Quand une sauce, une vinaigrette ou un mélange est nécessaire, ses ingrédients doivent être transmis automatiquement à la liste de courses et au batch cooking. Les références en « recette N » ne doivent pas être interprétées comme une simple mention textuelle.

## Préparations seules repérées dans le lot

Dans `recettes-800.json`, deux titres ressemblent à des préparations plutôt qu'à des repas :
- « Sauce Crémeuse aux Marrons Salée & Champignons » (`pdf-800-682`)
- « Pesto de Roquette aux Noix » (`pdf-800-768`)

Ils peuvent parfaitement être de bonnes recettes, mais doivent être classés dans leur rubrique de préparation et non utilisés comme repas autonomes dans les menus. Ils peuvent être proposés en accompagnement d'un plat.

## Contrôle des quantités et des ingrédients

Un contrôle automatique simple ne permet pas de conclure qu'une quantité est absente, car les sources expriment souvent les quantités en unités (« 4 pièces », « 1/2 botte », « 1 rouleau ») et ajoutent des précisions de découpe. Il ne faut donc pas traiter ces formulations comme des erreurs. La vérification utile doit porter sur la cohérence réelle : quantité utilisable, nombre de portions, présence dans les étapes, et possibilité de calculer les courses.

Aucune formulation « au choix » ou « selon vos envies » n'a été détectée par ce filtre dans ces trois fichiers. Cela ne remplace pas une relecture culinaire complète.

## Décision pour la future phase de correction

1. Sécuriser les 35 références internes du fichier `recettes-619.json`.
2. Vérifier la catégorie des sauces/pestos, puis contrôler qu'aucun de ces titres n'occupe seul un créneau de repas.
3. Pour chaque recette, comparer la liste d'ingrédients aux étapes et au nombre de portions.
4. Contrôler la génération de courses et de batch cooking à partir des recettes liées.
5. Continuer le même contrôle sur les autres sources et catégories, sans supprimer les doublons volontaires entre Végan et Végétarien.

**Statut :** analyse structurelle et alertes ciblées terminées pour ce lot ; audit culinaire complet non terminé.
