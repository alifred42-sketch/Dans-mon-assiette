# Continuité du projet — Cuisine Chic Ouf !

## Source unique de travail et aperçu permanent
- Dépôt : `alifred42-sketch/Dans-mon-assiette`
- Branche unique de travail : `travail-cuisine-chic-ouf-design`
- Aperçu permanent : https://alifred42-sketch.github.io/Dans-mon-assiette/previews/travail-cuisine-chic-ouf-design/
- Ne pas modifier `main` et ne pas disperser les changements sur une autre branche.
- Toute évolution doit être commitée sur cette branche et vérifiée après le déploiement Pages.

## Fonctionnalités présentes à préserver
- Planification des 52 semaines, menus, reprises des restes du dîner au déjeuner et changements de recettes.
- Filtrage saisonnier, diversité des catégories et limites de piliers dans `lib/carnet.ts` (à auditer et renforcer, ne pas remplacer aveuglément).
- Courses consolidées dans `lib/shopping.ts`, cases cochées par semaine via `assiette-courses-${week}`, ajouts du Frigo via `assiette-courses-extra-${week}`.
- Congélateur virtuel dans `lib/freezer.ts`.
- Migration Airfryer existante : `scripts/migrate-airfryer.mjs`, simulation avec `npm run migrate:airfryer`, écriture avec `npm run migrate:airfryer -- --write`.
- Cartes Four/Airfryer dans le carnet et préférence `airfryer` dans `cuisine-chic-ouf-preferences`.
- Mode mains libres partagé par fiches recette et batch : `components/recipe-hands-free.tsx`.
- Page Frigo Magique existante : `app/frigo-magique/page.tsx`.

## Modifications ajoutées dans cette vague
- `app/profil/page.tsx` : commutateur « Je possède un Airfryer » ; sauvegarde dans l'objet de préférences lu par le carnet.
- Accueil : raccourcis vers `/frigo-magique` et `/profil`.
- L'application actuelle est publiée sur GitHub Pages sans backend de comptes connecté : les préférences sont locales à l'appareil, pas synchronisées en base de données. Ne pas présenter localStorage comme une base distante.

## Prochaines étapes dans l'ordre
1. Vérifier la migration Airfryer en simulation, cibler les JSON adaptés puis exécuter l'écriture sans supprimer de données d'origine ; signaler les durées/températures du four manquantes.
2. Auditer et corriger les 52 semaines : aucun dessert/snack en plat principal, diversité sur 48 h en tenant compte des restes, saisonnalité française par mois.
3. Optimiser mères/filles, listes de courses, batch, piliers (3 légumes/2 féculents/2 protéines), taille du foyer, semaine économique, placard vide et congélateur virtuel.
4. Harmoniser les commandes mains libres entre batch et fiches, sans casser les minuteries et la navigation.
5. Vérifier le build, le déploiement et le rendu du lien permanent avant toute confirmation.

## Règle
Modifications ciblées, fonctionnalités validées préservées, audit avant toute écriture de `data/carnet.json`, et ce document mis à jour à chaque étape terminée.
