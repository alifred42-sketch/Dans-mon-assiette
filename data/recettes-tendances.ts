import type { Recipe } from "@/lib/types";

// Recettes originales créées à partir de tendances culinaires repérées dans les rapports Pinterest.
// Elles ne recopient pas le texte ni les visuels d'épingles tierces.
export const trendRecipes: Recipe[] = [
  {
    id: "tendance-2026-veloute-potimarron-lentilles",
    name: "Velouté de potimarron, lentilles corail et cumin",
    blurb: "Une soupe d'automne douce, nourrissante et simple à préparer.",
    ingredients: ["600 g de potimarron en cubes", "100 g de lentilles corail rincées", "1 oignon émincé", "750 ml de bouillon de légumes", "1 c. à café de cumin", "1 c. à soupe d'huile d'olive", "2 c. à soupe de skyr nature (facultatif)", "Sel et poivre"],
    steps: ["Faire revenir l'oignon dans l'huile d'olive pendant 3 minutes dans une grande casserole.", "Ajouter le potimarron, les lentilles, le cumin et le bouillon.", "Porter à ébullition puis laisser mijoter 20 à 25 minutes, jusqu'à ce que les légumes soient tendres.", "Mixer finement, saler et poivrer. Ajouter un peu d'eau si le velouté est trop épais.", "Servir avec une cuillerée de skyr si souhaité."],
    robot: ["Mettre l'oignon et l'huile dans le bol : 5 sec/vitesse 5, puis 3 min/120 °C/vitesse 1.", "Ajouter potimarron, lentilles, cumin et bouillon : 25 min/100 °C/vitesse 1.", "Mixer progressivement jusqu'à obtenir un velouté lisse."],
    notes: ["Pour un repas complet, accompagner d'une tranche de pain complet et d'un œuf dur.", "Se conserve 3 jours au réfrigérateur."],
    source: "Recette originale inspirée des tendances de cuisine réconfortante Pinterest Predicts 2026.",
    timePrep: "10 min", timeCook: "25 min", servings: "4 personnes"
  },
  {
    id: "tendance-2026-chou-fleur-four-paprika",
    name: "Chou-fleur rôti au paprika et sauce citronnée",
    blurb: "Des fleurettes dorées, croustillantes sur les bords, avec une sauce fraîche.",
    ingredients: ["1 chou-fleur moyen", "2 c. à soupe d'huile d'olive", "1 c. à café de paprika doux", "1/2 c. à café d'ail en poudre", "120 g de skyr nature", "1/2 citron (jus)", "1 c. à soupe de persil haché", "Sel et poivre"],
    steps: ["Préchauffer le four à 210 °C.", "Détailler le chou-fleur en fleurettes, puis les mélanger avec l'huile, le paprika, l'ail, le sel et le poivre.", "Étaler sur une plaque et faire rôtir 25 à 30 minutes en retournant à mi-cuisson.", "Mélanger le skyr, le jus de citron, le persil et une pincée de sel.", "Servir le chou-fleur chaud avec la sauce citronnée."],
    robot: [],
    notes: ["À servir avec du riz et des pois chiches pour en faire un plat principal.", "La sauce se conserve 2 jours au frais."],
    source: "Recette originale inspirée de l'intérêt Pinterest 2026 pour le chou-fleur rôti.",
    timePrep: "10 min", timeCook: "30 min", servings: "3 à 4 personnes"
  },
  {
    id: "tendance-2026-poulet-citron-origan",
    name: "Poulet méditerranéen au citron et à l'origan",
    blurb: "Un plat au four parfumé, accompagné de légumes de saison.",
    ingredients: ["500 g de filets de poulet", "1 citron (jus et zestes)", "2 courgettes en demi-rondelles", "1 oignon rouge en quartiers", "2 c. à soupe d'huile d'olive", "1 c. à café d'origan séché", "1 gousse d'ail hachée", "Sel et poivre"],
    steps: ["Préchauffer le four à 200 °C.", "Mélanger l'huile, le jus et les zestes de citron, l'origan, l'ail, le sel et le poivre.", "Déposer le poulet, les courgettes et l'oignon dans un plat puis enrober avec la marinade.", "Enfourner 25 à 30 minutes, jusqu'à ce que le poulet soit bien cuit, en remuant les légumes à mi-cuisson.", "Laisser reposer 3 minutes et servir avec du riz ou de la semoule complète."],
    robot: [],
    notes: ["Remplacer les courgettes par des carottes ou du potimarron selon la saison.", "Vérifier que le poulet est bien cuit à cœur."],
    source: "Recette originale inspirée des tendances Pinterest 2026 pour les plats méditerranéens réconfortants.",
    timePrep: "12 min", timeCook: "30 min", servings: "4 personnes"
  },
  {
    id: "tendance-2026-pates-chou-creme",
    name: "Pâtes crémeuses au chou et à l'ail",
    blurb: "Une façon économique et réconfortante de cuisiner le chou.",
    ingredients: ["250 g de pâtes complètes", "300 g de chou blanc finement émincé", "2 gousses d'ail hachées", "100 g de fromage frais nature", "30 g de parmesan râpé", "1 c. à soupe d'huile d'olive", "100 ml d'eau de cuisson des pâtes", "Sel, poivre et noix de muscade"],
    steps: ["Faire cuire les pâtes dans une grande casserole d'eau bouillante salée. Garder une tasse d'eau de cuisson.", "Pendant ce temps, faire revenir le chou dans l'huile d'olive pendant 8 à 10 minutes avec un petit fond d'eau.", "Ajouter l'ail et cuire encore 1 minute.", "Incorporer le fromage frais, le parmesan et un peu d'eau de cuisson pour obtenir une sauce onctueuse.", "Ajouter les pâtes, poivrer, râper un peu de muscade et mélanger avant de servir."],
    robot: [],
    notes: ["Ajouter des champignons poêlés pour varier.", "Pour une version plus légère, remplacer une partie du fromage frais par du skyr hors du feu."],
    source: "Recette originale inspirée de la tendance Pinterest Predicts 2026 autour des recettes au chou.",
    timePrep: "10 min", timeCook: "20 min", servings: "3 personnes"
  },
  {
    id: "tendance-2026-verrines-pomme-poire-skyr",
    name: "Verrines pomme-poire, cannelle et skyr",
    blurb: "Un dessert minute aux fruits d'automne, frais et peu sucré.",
    ingredients: ["2 pommes", "2 poires", "300 g de skyr nature", "1 c. à café de cannelle", "1 c. à café de miel (facultatif)", "30 g de flocons d'avoine", "1 c. à café de jus de citron"],
    steps: ["Éplucher les pommes et les poires puis les couper en petits dés.", "Mélanger les fruits avec le jus de citron et la cannelle. Pour des fruits plus tendres, les faire revenir 5 à 7 minutes dans une poêle avec une cuillère d'eau, puis laisser refroidir.", "Répartir le skyr dans quatre verrines.", "Ajouter les fruits, puis les flocons d'avoine légèrement toastés à sec.", "Ajouter un filet de miel si besoin et servir frais."],
    robot: [],
    notes: ["Pour une version sans miel, choisir des fruits bien mûrs.", "Assembler au dernier moment pour garder les flocons croustillants."],
    source: "Recette originale inspirée des tendances Pinterest 2026 pour les desserts maison simples et réconfortants.",
    timePrep: "12 min", timeCook: "0 à 7 min", servings: "4 verrines"
  }
];
