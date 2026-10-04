function onOpen() {
  reparerGids();
}

function reparerGids() {
  var ss = SpreadsheetApp.getActive();
  var dash = ss.getSheetByName("Dashboard");
  var fiche = ss.getSheetByName("Fiche_Recette");
  var courses = ss.getSheetByName("LISTES COURSES 2");
  var batch = ss.getSheetByName("BATCH");
  if (!dash || !fiche) return;
  dash.getRange("I23").setValue(fiche.getSheetId());
  if (courses) dash.getRange("I24").setValue(courses.getSheetId());
  if (batch) dash.getRange("I25").setValue(batch.getSheetId());
}
