export const BATCH_GUIDES = {
  prep: {
    title: "Étape 1 — Découpes globales",
    intro: "Commencez par toutes les découpes avant de salir les casseroles. Lavez les légumes, préparez une planche propre et regroupez chaque préparation dans un contenant étiqueté.",
    fallback: "Sortir les ingrédients de la fiche, peser les quantités et les regrouper dans un bac propre.",
  },
  oven: {
    title: "Étape 2 — Optimisation du four",
    intro: "Préchauffez le four selon les fiches. Regroupez uniquement les plats qui demandent la même température et une durée compatible; utilisez un minuteur par plat.",
    action: "Placer les ingrédients sur une plaque recouverte de papier cuisson, sans les superposer, puis suivre la température et la durée indiquées sur la fiche.",
  },
  robot: {
    title: "Étape 3 — Cuissons simultanées : option Robot Monsieur Cuisine",
    intro: "Pendant que le four fonctionne, enchaînez les préparations compatibles au Monsieur Cuisine. Pesez les ingrédients avant de démarrer et respectez strictement les vitesses, températures, durées et accessoires de la fiche; n'improvisez aucun réglage.",
    fallback: "Option Monsieur Cuisine : vérifier la fiche du plat. Si aucun réglage robot n'est indiqué, suivre la préparation classique plutôt que d'inventer une vitesse ou une température.",
  },
  storage: {
    title: "Conservation — Frigo / Congélateur ❄️",
    intro: "Répartissez rapidement les préparations dans des boîtes propres et fermées. Ne laissez pas longtemps les aliments cuits à température ambiante; gardez les aliments crus séparés des plats prêts à manger.",
    fridge: "Placer au réfrigérateur dans une boîte fermée si le plat est prévu pour les prochains jours; noter le nom du plat et le jour prévu.",
    freezer: "Pour un repas plus tard dans la semaine, portionner, étiqueter et congeler rapidement si la recette s'y prête; décongeler au réfrigérateur.",
  },
  assembly: {
    title: "Assemblage Jour J — finition rapide",
    intro: "Le jour prévu, ne réchauffez que la portion nécessaire. Ajoutez au dernier moment les herbes, salades, sauces et garnitures fragiles indiquées dans la fiche.",
    action: "Sortir la portion prévue, réchauffer soigneusement si nécessaire et terminer selon les dernières étapes de la fiche.",
  },
} as const;
