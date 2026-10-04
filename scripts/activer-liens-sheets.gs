/**
 * Google Sheets : Extensions → Apps Script → coller → Exécuter activerLiens.
 * Les plats sont déjà visibles. Ce script les rend cliquables vers Fiche_Recette.
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
  var map = ss.getSheetByName("_MAP");
  var courses = ss.getSheetByName("LISTES COURSES 2");
  var batch = ss.getSheetByName("BATCH");
  if (!dash || !fiche || !map) {
    SpreadsheetApp.getUi().alert("Importe le classeur (Dashboard, Fiche_Recette, _MAP).");
    return;
  }
  map.showSheet();
  var gidFiche = fiche.getSheetId();
  var gidDash = dash.getSheetId();
  var gidCourses = courses ? courses.getSheetId() : gidDash;
  var gidBatch = batch ? batch.getSheetId() : gidDash;
  var last = map.getLastRow();
  if (last < 2) return;
  var rows = map.getRange(2, 1, last - 1, 7).getValues();
  rows.forEach(function (row) {
    var name = String(row[3] || "").replace(/"/g, '""');
    var ficheRow = row[4];
    var dr = row[5];
    var dc = row[6];
    if (!name || !ficheRow || !dr || !dc) return;
    dash.getRange(dr, dc).setFormula(
      '=HYPERLINK("#gid=' + gidFiche + "&range=C" + ficheRow + '","' + name + '")'
    );
  });
  dash.getRange("A2").setFormula('=HYPERLINK("#gid=' + gidCourses + '&range=A1","MES COURSES")');
  dash.getRange("C2").setFormula('=HYPERLINK("#gid=' + gidBatch + '&range=A1","MON BATCH")');
  dash.getRange("E2").setFormula('=HYPERLINK("#gid=' + gidFiche + '&range=A1","MES RECETTES")');
  fiche.getRange("B3").setFormula('=HYPERLINK("#gid=' + gidDash + '&range=A1","RETOUR AU DASHBOARD")');
  fiche.getRange("C3").setFormula('=HYPERLINK("#gid=' + gidDash + '&range=A1","RETOUR AU PLANNING")');
  if (courses) {
    courses.getRange("F1").setFormula('=HYPERLINK("#gid=' + gidDash + '&range=A1","RETOUR AU DASHBOARD")');
  }
  if (batch) {
    batch.getRange("F1").setFormula('=HYPERLINK("#gid=' + gidDash + '&range=A1","RETOUR AU DASHBOARD")');
  }
  map.hideSheet();
}
