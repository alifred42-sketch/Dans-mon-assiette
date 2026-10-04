/**
 * À coller DANS le Google Sheet qui s’affiche déjà (carnet_aline_52_semaines).
 * Extensions → Apps Script → tout effacer → coller → activerLiens → Exécuter.
 * Ne vide rien. Rend chaque plat cliquable vers sa fiche.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Carnet")
    .addItem("Activer les liens cliquables", "activerLiens")
    .addToUi();
}

function activerLiens() {
  var ss = SpreadsheetApp.getActive();
  var dash = ss.getSheetByName("Dashboard") || ss.getSheets()[0];
  var fiche = ss.getSheetByName("Fiche_Recette");
  var courses = ss.getSheetByName("Courses");
  var batch = ss.getSheetByName("Batch");
  if (!fiche) {
    SpreadsheetApp.getUi().alert("Onglet Fiche_Recette introuvable.");
    return;
  }

  var gidFiche = fiche.getSheetId();
  var gidDash = dash.getSheetId();
  var lastFiche = Math.max(fiche.getLastRow(), 7);
  var ficheGrid = fiche.getRange(7, 1, lastFiche - 6, 5).getDisplayValues();
  var keyToRow = {};
  var nameToRow = {};
  var back = [];
  for (var i = 0; i < ficheGrid.length; i++) {
    var week = String(ficheGrid[i][1] || "").trim();
    var plat = String(ficheGrid[i][2] || "").trim();
    var jour = String(ficheGrid[i][3] || "").trim();
    var repas = String(ficheGrid[i][4] || "").trim();
    var dest = 7 + i;
    if (plat) {
      keyToRow[week + "|" + jour + "|" + repas] = dest;
      keyToRow[week + "|" + plat] = dest;
      if (!nameToRow[plat]) nameToRow[plat] = dest;
    }
    var weekNum = parseInt(week, 10);
    var weekRow = isNaN(weekNum) ? 5 : 5 + (weekNum - 1) * 5;
    back.push(['=HYPERLINK("#gid=' + gidDash + "&range=A" + weekRow + '","← Semaine ' + week + '")']);
  }
  fiche.getRange(7, 1, back.length, 1).setFormulas(back);
  fiche.getRange("A3").setFormula('=HYPERLINK("#gid=' + gidDash + '&range=A5","← Retour au planning")');

  var lastDash = dash.getLastRow();
  var lastCol = Math.max(dash.getLastColumn(), 8);
  var shown = dash.getRange(1, 1, lastDash, lastCol).getDisplayValues();
  var DAYS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];

  for (var r = 0; r < shown.length; r++) {
    var rowNum = r + 1;
    var week = Math.floor((rowNum - 5) / 5) + 1;
    var offset = (rowNum - 5) % 5;
    var repas = offset === 2 ? "Midi" : offset === 3 ? "Soir" : "";
    for (var c = 0; c < shown[r].length; c++) {
      var label = String(shown[r][c] || "").trim();
      if (!label || label.indexOf("SEMAINE") === 0) continue;
      var dest = null;
      if (repas && c >= 1 && c <= 7) {
        dest = keyToRow[week + "|" + DAYS[c - 1] + "|" + repas] || keyToRow[week + "|" + label];
      }
      dest = dest || nameToRow[label];
      if (!dest) continue;
      dash.getRange(rowNum, c + 1).setFormula(
        '=HYPERLINK("#gid=' + gidFiche + "&range=C" + dest + '","' + label.replace(/"/g, '""') + '")'
      );
    }
  }

  dash.getRange("A2").setFormula('=HYPERLINK("#gid=' + gidFiche + '&range=A1","↓ Toutes les fiches")');
  if (courses) {
    dash.getRange("C2").setFormula(
      '=HYPERLINK("#gid=' + courses.getSheetId() + '&range=A1","🛒 Mes courses")'
    );
    courses.getRange("F1").setFormula('=HYPERLINK("#gid=' + gidDash + '&range=A1","← Dashboard")');
  }
  if (batch) {
    dash.getRange("E2").setFormula(
      '=HYPERLINK("#gid=' + batch.getSheetId() + '&range=A1","🍳 Mon batch")'
    );
    batch.getRange("F1").setFormula('=HYPERLINK("#gid=' + gidDash + '&range=A1","← Dashboard")');
  }
}
