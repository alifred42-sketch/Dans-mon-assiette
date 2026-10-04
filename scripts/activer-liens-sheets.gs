/**
 * À coller seulement si, après import du .xlsx, un plat n’est pas cliquable.
 * Extensions → Apps Script → coller → Exécuter activerLiens.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Carnet")
    .addItem("Activer les liens cliquables", "activerLiens")
    .addToUi();
}

function activerLiens() {
  var ss = SpreadsheetApp.getActive();
  var dash = ss.getSheetByName("Dashboard");
  var fiche = ss.getSheetByName("Fiche_Recette");
  var courses = ss.getSheetByName("Courses");
  var batch = ss.getSheetByName("Batch");
  if (!dash || !fiche) {
    SpreadsheetApp.getUi().alert("Il faut les onglets Dashboard et Fiche_Recette.");
    return;
  }

  var gidFiche = fiche.getSheetId();
  var gidDash = dash.getSheetId();
  var nameToRow = {};
  var lastFiche = fiche.getLastRow();
  var plats = fiche.getRange(7, 3, Math.max(lastFiche - 6, 1), 1).getValues();
  for (var i = 0; i < plats.length; i++) {
    var name = String(plats[i][0] || "").trim();
    if (name && !nameToRow[name]) nameToRow[name] = 7 + i;
  }

  var lastDash = dash.getLastRow();
  var lastCol = dash.getLastColumn();
  var grid = dash.getRange(1, 1, lastDash, lastCol).getValues();
  for (var r = 0; r < grid.length; r++) {
    for (var c = 0; c < grid[r].length; c++) {
      var label = String(grid[r][c] || "").trim();
      var dest = nameToRow[label];
      if (!dest) continue;
      dash.getRange(r + 1, c + 1).setFormula(
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
  fiche.getRange("A3").setFormula('=HYPERLINK("#gid=' + gidDash + '&range=A5","← Retour au planning")');
}
