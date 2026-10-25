# Audit des recettes — vague 1 (contrôles statiques)

- Branche contrôlée : `travail-cuisine-chic-ouf-design`.
- Périmètre : `data/recettes-619.json`, `data/recettes-800.json`, `data/recettes-899.json`.
- Fiches examinées : 360 (80 + 181 + 99).
- Signalements automatiques : 58. Répartition : FORMULATION_VAGUE=2, REFERENCE_RECETTE=27, PESTO_NON_DETAILLE=10, TITRE_PREPARATION=15, QUANTITE_NON_CHIFFREE=2, INGREDIENT_REFERENCE=1, TITRE_DOUBLON=1.
- **Important :** ce sont des pistes à vérifier, pas des erreurs toutes confirmées. Certains titres (soupes, crèmes dessert, bouillons) sont bien des plats; les règles automatiques ne décident pas seules du classement.
- **Protection respectée :** aucune recette, aucun menu des 52 semaines et aucune donnée de production n'a été modifié par cet audit.

## Signalements par fiche

### Curry de Lentilles Corail et Butternut au Gingembre — `data/recettes-619.json`
- **FORMULATION_VAGUE** : Formulation non chiffrée/à compléter à examiner.
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Cannellonis Végétariens à la Courge Butternut et Ricotta — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Gnocchis Rôtis au Four à la Tomate, Mozzarella et Pesto — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.
- **PESTO_NON_DETAILLE** : Vérifier si le pesto est acheté prêt ou si la recette doit être détaillée.

### Clafoutis Salé aux Poireaux et Fromage de Chèvre — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Bowl d'Hiver Express Lentilles, Avocat et Chèvre Frais — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Couscous Express d'Hiver aux Pois Chiches et Raisins Secs — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Bouillon Express d'Hiver au Tofu, Gingembre et Vermicelles — `data/recettes-619.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Bowl de Sarrasin Express au Fromage de Chèvre Chaud et Noix — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Shakshuka Express aux Œufs et Pois Chiches — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Curry Express de Haricots Blancs au Lait de Coco — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Curry Express de Pois Chiches à la Tomate en 8 Minutes — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Ragoût Flash de Pois Chiches à la Tomate et Épinards — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Poêlée Express de Tofu Fumé aux Épices Tex-Mex — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Œufs au Plat d'Hiver sur Fondue de Tomates Express — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Chili Express de Haricots Rouges au Maïs — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Gnocchis Flash à la Tomate et Tomme de Montagne — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Penne Express au Pesto de Tomates Séchées et Feta — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.
- **PESTO_NON_DETAILLE** : Vérifier si le pesto est acheté prêt ou si la recette doit être détaillée.

### Gnocchis Poêlés Express à la Crème de Tomates Séchées — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Quesadillas Express aux Haricots Rouges et Cheddar Fondant — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Quesadillas Express au Pesto et Fromage Coulant — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.
- **PESTO_NON_DETAILLE** : Vérifier si le pesto est acheté prêt ou si la recette doit être détaillée.

### Tartines d'Hiver au Chèvre, Pommes et Miel — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Quesadillas Express au Cheddar et Maïs — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Croque-Monsieur Végétarien Express à la Mozzarella et Pesto — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.
- **PESTO_NON_DETAILLE** : Vérifier si le pesto est acheté prêt ou si la recette doit être détaillée.

### Quesadillas Croustillantes au Pesto Rouge et Mozzarella — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.
- **PESTO_NON_DETAILLE** : Vérifier si le pesto est acheté prêt ou si la recette doit être détaillée.

### Tartines d'Hiver Chou-Fleur Râpé, Crème et Comté — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Quesadillas Express au Cheddar et Poivrons — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Quesadillas Croustillantes au Pesto et Tomates Cerises — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.
- **PESTO_NON_DETAILLE** : Vérifier si le pesto est acheté prêt ou si la recette doit être détaillée.

### Quesadillas Express à la Tomme de Savoie et Tomates — `data/recettes-619.json`
- **REFERENCE_RECETTE** : L'ingrédient renvoie à une recette numérotée : vérifier que cette dépendance est disponible et claire.

### Gaspacho Vert Épicé au Concombre et Avocat — `data/recettes-800.json`
- **FORMULATION_VAGUE** : Formulation non chiffrée/à compléter à examiner.

### Crème de Panais au Chocolat Blanc — `data/recettes-800.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Sauce Crémeuse aux Marrons Salée & Champignons — `data/recettes-800.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Crème de Courge Butternut pour Cannellonis — `data/recettes-800.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Pâte à Cromesquis de Risotto au Potimarron — `data/recettes-800.json`
- **QUANTITE_NON_CHIFFREE** : Quantité sans chiffre à vérifier : Huile de friture : pour la cuisson ultérieure

### Wrap Méditerranéen Express — `data/recettes-800.json`
- **PESTO_NON_DETAILLE** : Vérifier si le pesto est acheté prêt ou si la recette doit être détaillée.

### Salade de Tomates, Tofu et Pesto — `data/recettes-800.json`
- **PESTO_NON_DETAILLE** : Vérifier si le pesto est acheté prêt ou si la recette doit être détaillée.

### Crème de Chia Express Coco-Framboise — `data/recettes-800.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Salade de Haricots Blancs au Pesto Rouge — `data/recettes-800.json`
- **PESTO_NON_DETAILLE** : Vérifier si le pesto est acheté prêt ou si la recette doit être détaillée.

### Purée de Patates Douces au Gingembre — `data/recettes-800.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Crème de Panais à la Noisette — `data/recettes-800.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Pesto de Roquette aux Noix — `data/recettes-800.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Crème de Courgettes Légère à la Menthe — `data/recettes-800.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Crème de Brocoli au Lait d'Amande et Levure Maltée — `data/recettes-800.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Crème Dessert Vegan Citron et Lait de Coco — `data/recettes-800.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Crème de Maïs Doux au Lait de Coco (Soupe Chowder) — `data/recettes-800.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Crème Dessert Vegan au Café — `data/recettes-800.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Pitas Garnies de Chou Rouge Épicé et Pois Chiches Rôtis — `data/recettes-899.json`
- **INGREDIENT_REFERENCE** : Vérifier si la sauce est achetée prête ou si sa composition doit être ajoutée.

### Bouillon Thaï au Lait de Coco, Shiitakés et Tofu Rôti — `data/recettes-899.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

### Salade de Quinoa Tiède au Potimarron Rôti et Pesto de Mâche — `data/recettes-899.json`
- **PESTO_NON_DETAILLE** : Vérifier si le pesto est acheté prêt ou si la recette doit être détaillée.

### Le Mimosa de la Citrouille (Avec Alcool) — `data/recettes-899.json`
- **QUANTITE_NON_CHIFFREE** : Quantité sans chiffre à vérifier : Sucre et cannelle : pour le givrage des verres

### Bouillon d'œufs pochés aux légumes (vide-frigo) — `data/recettes-899.json`
- **TITRE_PREPARATION** : Vérifier la rubrique : le titre ressemble à une préparation ou un accompagnement.

## Doublons de titres à comparer

- **Taboulé de Chou-Fleur Express** — Titre répété 3 fois dans les fichiers source; comparer contenu et identifiants. Fichiers : data/recettes-800.json, data/recettes-800.json, data/recettes-800.json.

## Suite de contrôle

1. Vérifier manuellement chaque signalement contre les ingrédients et les étapes complètes.
2. Contrôler le classement (plat / accompagnement / sauce / marinade / dessert / boisson).
3. Contrôler quantités, unités, portions et cohérence entre ingrédients et étapes.
4. Définir ensuite le référentiel d'ingrédients canoniques sans fusionner des produits différents.
5. Auditer séparément `data/carnet.json` : recettes des menus protégées contre toute modification, mais incluses dans le contrôle.