# Continuité du projet — CUISINE CHIC OUF !

## Source de vérité
- Branche de travail unique : `travail-cuisine-chic-ouf-design`
- Aperçu permanent à vérifier : https://alifred42-sketch.github.io/Dans-mon-assiette/previews/travail-cuisine-chic-ouf-design/
- Ne pas enregistrer les prochaines modifications sur une autre branche et ne pas toucher à `main` sans demande explicite.
- Chaque modification doit être commitée sur la branche ci-dessus. Après le commit, attendre le workflow GitHub Pages et vérifier son résultat avant de transmettre le lien.

## Fonctionnalités déjà présentes dans la branche
- Accueil avec une seule action principale « Sauver ma semaine » et calcul de la semaine ISO courante.
- Fiches recettes : commandes mains libres partagées (`components/recipe-hands-free.tsx`) et quantités dans les étapes.
- Batch cooking : barre de commandes vocales réutilisant le même composant mains libres que les fiches recettes.
- Profil Airfryer enregistré dans les préférences locales de l’appareil ; mise en valeur des données Airfryer sur les cartes lorsqu’elles sont disponibles. Pas de serveur de comptes/DB actuellement, donc pas de synchronisation inter-appareils.
- Frigo Magique : ingrédients en stock, restes probables dérivés des cases non cochées de la semaine précédente, matching des recettes avec jusqu’à deux ingrédients manquants, ajout de ces ingrédients aux courses.
- Migration additive Airfryer : `scripts/migrate-airfryer.mjs`, commande `npm run migrate:airfryer` (simulation) et `npm run migrate:airfryer -- --write` (écriture locale). Les durées/températures non trouvées restent nulles et doivent être vérifiées ; ne pas inventer de données.
- Planification : filtres de profil, exclusions de desserts/snacks, règles saisonnières, transformation d’un ingrédient pivot, cooldown de catégories de dîner et plafonds de piliers dans `lib/carnet.ts`.
- Listes de courses et calculs batch s’appuient sur le planning partagé ; vérifier tout changement de sélection pour éviter les lignes obsolètes.

## Modification enregistrée dans cette vague
- `app/batch/page.tsx` : le batch cooking parcourt désormais tous les dîners de la semaine, déduplique les recettes identiques et ne recuisine pas les déjeuners issus des restes. Le détail des tâches est construit depuis les fiches de ces dîners.

## À poursuivre, dans cet ordre
1. Vérifier le déploiement de cette vague et tester visuellement le batch cooking et le mode mains libres.
2. Auditer les 52 semaines avec une validation automatisée : repas principaux uniquement, saisonnalité, catégorie répétée, piliers, cohérence mère/fille, profils et semaine « placard vide ».
3. Améliorer le matching mère/fille et le calcul des courses à partir des quantités normalisées, sans ajouter deux fois un ingrédient déjà fourni par une recette liée.
4. Vérifier les données Airfryer sur les fichiers de recettes source et exécuter la migration uniquement après audit/diff, puis sauvegarder les changements sur cette branche.
5. Continuer l’audit culinaire fiche par fiche ; ne jamais présenter une heuristique automatique comme une validation culinaire complète.

## Règles de conservation
- Ne supprimer aucune fonctionnalité existante sans demande explicite.
- Ne remplacer aucun fichier de données complet sans audit préalable et comparaison des changements.
- Garder les modifications petites, vérifiables et commitables ; un objectif par vague.
