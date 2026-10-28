# Suivi central — Cuisine Chic Ouf !

**Branche de travail et de publication unique :** `travail-cuisine-chic-ouf-design`  
**Aperçu permanent :** https://alifred42-sketch.github.io/Dans-mon-assiette/previews/travail-cuisine-chic-ouf-design/  
**Règle de continuité :** toutes les prochaines modifications de ce chantier doivent être enregistrées sur cette branche et vérifiées sur cet aperçu. Ne pas répartir le travail sur une autre branche et ne pas modifier `main`.

## Ordre de réalisation

- [x] **Étape 1 — Préparer la migration Airfryer** : script en simulation par défaut, écriture explicite avec `--write`, ajout des champs au type `Recipe` et commande npm `migrate:airfryer`.
- [ ] **Étape 1b — Exécuter et auditer la migration sur les données** : comparer le rapport de simulation, corriger les recettes où durée/température ne sont pas explicites, puis appliquer les champs sans supprimer de données d'origine.
- [ ] **Étape 2 — Profil et affichage Four/Airfryer** : enregistrer la préférence Airfryer dans le mécanisme de profil existant; mettre en avant le mode choisi sur les cartes recette.
- [ ] **Étape 3 — Frigo Magique** : restes probables depuis l'historique des courses non cochées, accordéons par catégories, recherche d'ingrédients, matching tolérant à 1–2 ingrédients manquants et ajout rapide aux courses.
- [ ] **Étape 4 — Fiabiliser les 52 semaines** : exclure desserts/snacks des plats, contrôle des catégories sur 48 h et règles saisonnières françaises avec remplacement contrôlé.
- [ ] **Étape 5 — Optimiser menus, courses et batch cooking ensemble** : recettes mère/fille, piliers hebdomadaires, profil du foyer, semaines économiques/placard vide et congélateur virtuel.
- [ ] **Étape 6 — Validation** : contrôle des données, build et vérification de l'aperçu permanent avant d'annoncer que la version est prête.

## Décisions de sécurité des données

- Le script Airfryer ne supprime aucun champ existant.
- La détection de four s'appuie sur les étapes de préparation; les valeurs impossibles à déduire restent `null` et sont signalées plutôt que d'être inventées.
- Les contraintes saisonnières et de restes ne doivent pas écraser les exceptions validées par l'utilisatrice ni les menus existants sans rapport de changements.
- Les listes de courses doivent être recalculées à partir des recettes effectivement planifiées et des ingrédients de sauces/marinades associées, sans doublons d'unités ou d'ingrédients.
