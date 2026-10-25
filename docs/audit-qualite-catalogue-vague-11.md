# Audit qualité catalogue central — vague 11

Branche : `travail-cuisine-chic-ouf-design`
Périmètre : contrôles ciblés sur les 1 625 fiches de `data/carnet.json`.
Aucune recette et aucun menu modifiés.

## Défauts de formulation confirmés à corriger

Six fiches contiennent au moins une ligne d'ingrédient manifestement mal assemblée (quantité/unité suivie d'une phrase ou d'un ingrédient incompatible). Ce sont des erreurs de données concrètes, et non de simples alertes heuristiques :

| ID interne | Titre actuel | Ligne problématique |
|---|---|---|
| `r-8ab1afdf0b` | Parmentier de poulet aux légumes fondants | « 150 ml de un peu de lait » |
| `r-530be65cae` | Poulet façon blanquette aux champignons & carottes | « 200 g de une recette idéale pour préparer plusieurs repas. » |
| `r-9b996df25a` | Soupe à l’oignon façon bistrot | « 100 g de un peu de comté ou emmental dessus » |
| `veg-robot-010` | Truffes Fondantes au Chocolat Noir & Épices Douces | « 100 g de une pincée de cannelle, poudre de cacao. » |
| `veg-robot-045` | Crème fine de Gorgonzola pour Lasagnes de Butternut | « 100 g de une pincée de noix de muscade. » |
| `systeme-d-004` | Croque-Monsieur Système D au grille-pain | « 100 g de une noisette de beurre » |

Ces lignes nécessitent une correction en se basant sur le contexte complet de la recette, sans inventer une quantité si elle ne peut pas être établie. Pour `r-530be65cae`, le texte ressemble à une note éditoriale qui a été insérée par erreur dans la liste d'ingrédients.

## Références de préparation : risque réel pour l'expérience utilisateur

Le contrôle a repéré 173 fiches contenant une mention du type « recette 32 », « recette 45 » ou « fiche 5 ». Ce nombre comprend plusieurs types de références :
- des liens utiles vers une sauce ou un mélange d'épices ;
- des mentions qui doivent être reliées à une fiche stable ;
- des références vagues (« légumes de la fiche 5 ») qui ne permettent pas à l'utilisateur de savoir exactement quoi préparer ;
- potentiellement des références historiques ou de source, qui ne doivent pas être transformées automatiquement en lien.

Exemples prioritaires :
- `r-cd7afc007b`, « Pâtes façon carbonara légère » : l'étape renvoie aux « légumes de la fiche 5 », mais la liste d'ingrédients de la fiche ne détaille pas ces légumes.
- `r-4d5e2c63aa`, « Pâte à crêpes légère » : une étape parle de faire revenir des légumes, ce qui semble incohérent avec le titre et le type de plat.
- `r-376d7c7d61`, « Omelette complète façon bistrot » : renvoi aux champignons de la recette 37.
- `r-8aa2b04e7d`, « Plateau apéro repas équilibré » : sauce Ranch ou pesto mentionnés dans les étapes ; vérifier que la bonne préparation est reliée aux courses.

Ces références doivent être résolues une par une. Il ne faut pas remplacer tous les numéros par le même type de lien sans vérifier ce qu'ils désignent.

## Titres de préparation à contrôler dans les menus

Le catalogue contient 67 titres qui commencent par un terme de préparation (sauce, marinade, vinaigrette, pesto, coulis, mélange, etc.). La plupart sont probablement des fiches valides pour leurs rubriques dédiées. La priorité n'est pas de les supprimer, mais de vérifier :
1. leur rubrique et leur affichage ;
2. qu'aucune préparation seule n'occupe un créneau déjeuner/dîner ;
3. qu'une préparation appelée par un plat alimente automatiquement courses et batch cooking.

## Doublons : ne pas supprimer automatiquement

68 groupes de titres similaires ont été détectés par normalisation du titre. Ce nombre n'est pas le nombre de vrais doublons :
- les 52 fiches « Opération Vide-Frigo ! » sont des modèles récurrents et doivent être comparées pour vérifier si leur contenu varie intentionnellement ;
- « Assiette complète de saison » et « Velouté et tartine » apparaissent comme modèles de créneaux ;
- plusieurs paires Végan/Végétarien sont des doublons de contenu possibles mais le recouvrement des catégories peut être volontaire, comme demandé. Il faut préserver les placements de catégorie et comparer les IDs, le contenu et les usages avant toute décision.

15 groupes au total présentent un contenu exactement identique dans les champs comparés, mais certains sont des modèles répétés ou des chevauchements de catégories attendus. Aucun n'a été supprimé.

## Prochaine étape de l'audit

- Corriger les six lignes d'ingrédients manifestement corrompues après validation contextuelle.
- Examiner les 173 références numérotées et les relier à des IDs stables lorsque c'est pertinent.
- Faire une relecture par lots de recettes réelles (ingrédients, quantités, étapes, portions, temps, catégorie) plutôt que d'assimiler des signaux automatiques à des erreurs confirmées.
- Continuer sur les sources restantes, puis faire les corrections seulement après avoir terminé l'inventaire.

**Statut :** vague 11 terminée pour les contrôles ciblés ; vérification culinaire individuelle de l'ensemble des 1 625 fiches toujours en cours.
