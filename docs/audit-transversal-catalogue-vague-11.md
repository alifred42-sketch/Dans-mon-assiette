# Audit transversal du catalogue central — vague 11

Branche : `travail-cuisine-chic-ouf-design`
Source examinée : `data/carnet.json`
Périmètre : inventaire transversal et contrôle de risques sur les 1 625 fiches. Aucune donnée de recette ou de menu modifiée.

## Inventaire
- Fiches présentes : 1625.
- Fiches sans `timePrep` et `timeCook` : 112.
- Groupes de titres normalisés contenant plusieurs fiches : 68 (ce nombre signale des groupes à comparer, pas des doublons à supprimer).
- Lignes d'ingrédients avec formulation ouverte détectée : 8.
- Étapes correspondant à un petit ensemble de modèles génériques : 275 (signal heuristique, non erreur confirmée).
- Fiches dont le titre semble commencer par un numéro de catalogue : 256 (détection automatique à confirmer visuellement).

## Contrôles précis à approfondir
Les contrôles automatiques ont des limites : un titre identique peut être volontaire, une recette peut appartenir à plusieurs catégories et un choix culinaire peut être acceptable. Les doublons doivent donc être comparés par identifiant, source, ingrédients, quantités, étapes et usage dans les menus avant toute décision.

La vérification culinaire complète exige aussi une lecture individuelle des 1 625 fiches pour vérifier cohérence titre/contenu, ingrédients présents dans les étapes, quantités pour le nombre de portions, temps annoncés, méthode de cuisson, type de préparation (repas ou sauce), références de préparations liées et compatibilité courses/batch cooking. Le scan transversal n'est pas à lui seul cette validation.

## Prochaine étape
Traiter les fiches par lots identifiables, produire pour chacune une décision explicite (OK, à corriger, à confirmer) et ne modifier les données qu'après validation du lot. Priorités : références internes numériques, temps manquants, titres de préparations seuls dans les menus, étapes génériques, et fiches dupliquées qui diffèrent réellement.
