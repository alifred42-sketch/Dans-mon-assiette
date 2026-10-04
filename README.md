# Dans mon assiette

Carnet alimentaire d’Aline, repris depuis le Google Sheet (73 onglets, liens cassés, audits ChatGPT).

**Ici :** 52 semaines cliquables, bibliothèque de recettes, courses fusionnées, batch, « Je reçois » et « Surprends-moi ».  
**Pas encore :** photos maison du plat (Cookomix), comptes, abonnements. Les fausses images stock du tableur ont été retirées : on affiche un pictogramme du type réel (poisson, poulet, velouté…).

## Sur ton ordi (Docker)

Docker Desktop doit être ouvert.

Dans le dossier du projet :

```bash
docker compose up --build
```

La première fois, ça prend quelques minutes (télécharge Node et compile). Ensuite ouvre [http://localhost:4317](http://localhost:4317).

- Excel : bouton **Télécharger le classeur Excel**, ou [http://localhost:4317/api/telecharger](http://localhost:4317/api/telecharger)
- Arrêter : `Ctrl+C`, puis `docker compose down`

Si le port 4317 est déjà pris : ferme l’autre appli, ou change le premier `4317` dans `docker-compose.yml` (`"8088:4317"` → [http://localhost:8088](http://localhost:8088)).

## Sans Docker (Node.js)

```bash
npm install
npm run dev
```

Ouvre [http://localhost:4317](http://localhost:4317).

## Fichier Excel propre

Même première feuille que l’original (**Dashboard**), plus les onglets qu’elle ouvre :

1. Dashboard (semaine 1–52, midi/soir cliquables)
2. Fiche_Recette
3. LISTES COURSES 2
4. BATCH
5. _APP_DATA

Plus de `__xludf.DUMMYFUNCTION`, plus de photos loremflickr.

À importer dans Google Sheets : Fichier → Importer. Le fichier est aussi dans [`public/Dans-mon-assiette.xlsx`](public/Dans-mon-assiette.xlsx).

## Données

Issues du classeur d’origine : `Planning_APP`, `BDD_Classique`, `BDD_MrCuisine`, plus les vraies recettes des onglets Express / Saisons / Apéro / Robot. Les 45 onglets AUDIT / V38–V52 / « images à intégrer » ont été écartés.
