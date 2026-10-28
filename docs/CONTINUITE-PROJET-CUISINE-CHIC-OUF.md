# Continuité de Cuisine Chic Ouf !

## Source unique de travail
- Dépôt : `alifred42-sketch/Dans-mon-assiette`
- Branche unique de travail et de déploiement : `travail-cuisine-chic-ouf-design`
- Aperçu permanent : https://alifred42-sketch.github.io/Dans-mon-assiette/previews/travail-cuisine-chic-ouf-design/
- Ne pas pousser ces changements sur `main` et ne pas créer une autre branche de livraison sans demande explicite.
- Toute modification doit être commitée sur la branche ci-dessus, puis attendre la réussite du déploiement GitHub Pages avant de demander une vérification visuelle.

## Fonctionnalités déjà présentes dans la branche (à préserver et vérifier)
- Profil Airfryer enregistré dans les préférences locales de l'appareil.
- Script additif `scripts/migrate-airfryer.mjs` ; simulation par défaut, écriture uniquement avec `--write`.
- Affichage Airfryer sur les cartes de recettes lorsque des données de cuisson sont disponibles.
- Page `/frigo-magique` : reste probables issus des courses non cochées de la semaine précédente, stock persistant local, accordéons par catégories, matching tolérant jusqu'à deux ingrédients manquants et ajout aux courses.
- Mode mains libres partagé `components/recipe-hands-free.tsx`, utilisé dans les fiches recette et le batchcooking.
- Génération de menus `weekPlan()`, filtre des plats principaux, saisonnalité, restes au déjeuner, cooldown de catégories de dîner, plafonds de piliers et choix de recettes filles.
- Congélateur virtuel dans `lib/freezer.ts`.
- Accueil avec les cartes existantes et accès au Frigo Magique / Profil.

## Correction enregistrée dans cette vague
- `lib/carnet.ts` : le mois de référence des semaines n'est plus figé à 2026 ; il est calculé à partir de l'année courante pour que l'étiquette de saison et les sélections de menus évoluent avec le calendrier.

## Règles fonctionnelles à respecter pour les prochaines vagues
1. Ne pas écraser les données sources des recettes. Les migrations ajoutent des champs et restent en simulation par défaut.
2. Si la recette indique une cuisson au four mais ne donne pas une durée ou température fiable, laisser la valeur Airfryer concernée à `null` et la signaler pour revue plutôt que d'inventer une valeur.
3. Profil Airfryer : les préférences sont actuellement stockées dans `localStorage`; aucun backend de compte/synchronisation multi-appareil n'est connecté. Ne pas prétendre à une sauvegarde en base serveur sans implémenter celle-ci.
4. Courses et batch doivent toujours dériver du même `weekPlan()` et des mêmes substitutions de recette pour éviter les écarts entre repas affichés, ingrédients achetés et tâches.
5. Le Frigo Magique ajoute les ingrédients manquants avec la clé `assiette-courses-extra-<semaine>` ; préserver ce contrat avec `app/courses/page.tsx`.
6. Conserver les 52 semaines, les recettes validées, les catégories et les exceptions explicitement demandées par l'utilisatrice.
7. Avant chaque livraison : lancer build et contrôles du carnet, corriger les régressions, puis vérifier que le workflow de déploiement est terminé avec succès.

## Prochaines étapes (à traiter une vague à la fois)
- Vague A : vérifier le script Airfryer sur tous les JSON avec une simulation, examiner les recettes compatibles dont les données sont incomplètes, puis valider les champs visibles sur les cartes.
- Vague B : renforcer les tests de génération des 52 semaines (aucun dessert/snack en plat principal, saisonnalité, cooldown 48 h, piliers, menus complets).
- Vague C : améliorer l'optimisation mère/fille, les quantités communes des courses et les tâches de batch, sans créer de doublons ni remplacer des recettes non concernées.
- Vague D : uniformiser le composant mains libres du batchcooking avec celui des fiches recettes (Précédent, Lecture/Pause, Suivant, commandes vocales).
- Vague E : vérifier la carte « Sauver ma semaine » (un seul bloc et semaine/date calculées automatiquement), puis tester l'ensemble sur l'aperçu permanent.

## Historique
- 2026-10-28 : correction du calcul du mois des semaines ISO dans `lib/carnet.ts` ; commit `074a02db93fa23099313602c3fc0ebc2ef4e1e1a`.
