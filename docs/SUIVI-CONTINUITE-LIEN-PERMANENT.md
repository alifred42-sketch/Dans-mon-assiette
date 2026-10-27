# Suivi de continuité — Cuisine Chic Ouf !

## Règle de travail impérative
- Travailler uniquement sur la branche `travail-cuisine-chic-ouf-design`.
- Aperçu permanent à vérifier : https://alifred42-sketch.github.io/Dans-mon-assiette/previews/travail-cuisine-chic-ouf-design/
- Chaque modification doit être enregistrée (commit) sur cette branche et déployée vers ce même aperçu permanent.
- Ne pas utiliser une autre branche ou un autre aperçu pour présenter le travail. Ne pas modifier `main`.
- Avant chaque nouvelle intervention, lire ce document et examiner le code existant pour préserver les travaux antérieurs. Après chaque vague, mettre ce suivi à jour, lancer/vérifier le déploiement, puis donner uniquement le lien permanent.

## Éléments déjà présents sur la branche (à préserver)
- Accueil avec cartes illustrées.
- Carnet de recettes avec cartes de catégories illustrées.
- Bouton Retour personnalisé.
- Composant `components/recipe-hands-free.tsx` intégré aux fiches recettes.
- Sur les fiches recettes, le mode mains libres propose précédent, lecture/pause, suivant, micro et commandes vocales : « Lecture », « Pause », « Étape OK », « Étape suivante », « Relis l’étape ». « Stop » désactive le mode.
- Le calcul de semaine ISO courante existe dans `lib/carnet.ts` et est utilisé sur l’accueil et la page semaine.

## Travaux à vérifier et terminer sur le même aperçu permanent
1. **Accueil — “Sauver ma semaine”** : supprimer la double carte/bannière affichant la semaine; ne garder qu’une seule carte et une date/plage de dates qui se met automatiquement à jour selon la semaine ISO courante.
2. **Menus midi et soir** : reprendre le travail prévu pour sélectionner automatiquement des recettes et ingrédients de saison selon la semaine réelle, en respectant les préférences/profils et les menus existants.
3. **Courses et batch cooking** : optimiser les quantités cumulées et les ingrédients partagés entre repas; éviter les doublons et les ingrédients obsolètes après remplacement d’un repas. Le batch doit correspondre aux repas de la semaine et réutiliser les préparations communes quand cela est pertinent.
4. **Étapes des recettes** : ne pas afficher deux fois les mêmes instructions. Les quantités doivent être intégrées dans les consignes, par exemple « Couper les carottes (3) », « Verser la crème (100 ml) », et non répétées en gros en doublon. Conserver les nombres, unités et quantités explicites.
5. **Mode mains libres du batch cooking** : utiliser la même présentation et les mêmes interactions que dans les fiches recettes, comme un lecteur audio/vidéo : précédent, lecture/pause, suivant, micro; commandes vocales « Lecture », « Pause », « Étape OK », « Étape suivante », « Relis l’étape »; progression « Étape x/y ». Le comportement « Étape OK » coche l’étape et passe à la suivante. « Stop » désactive uniquement le mode mains libres.
6. **Contrôle global** : vérifier que les changements précédents restent en place, que la compilation réussit et que le lien permanent pointe bien vers le dernier déploiement. Ne pas prétendre qu’un test visuel a été fait sans l’avoir réellement fait.

## Historique récent confirmé
Les commits suivants ont été réalisés sur la branche de travail pour restaurer les photos du carnet, le bouton Retour et le mode mains libres des recettes :
- `d609d01a0125c09312846ac3e65a94f0afa2607d`
- `85c158d82215236d24a828693c6597a0a4a1eeb6`
- `35f208cb5e8567f2379b2ffea753e36745e716d4`
- `5a7d41a051b63a886d8f346480a89b5499018620`
- `c566aac0dde4b0d43a4b2780ee8c606261b8b7d3`

Le déploiement correspondant a été vérifié comme réussi le 27 octobre 2026, mais les problèmes listés dans « Travaux à vérifier et terminer » doivent être revérifiés dans le code et dans l’interface avant d’être déclarés corrigés.
