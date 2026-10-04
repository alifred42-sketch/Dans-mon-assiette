#!/usr/bin/env python3
"""Classeur Google Sheets : plats en texte (jamais vides) + script de liens."""

from __future__ import annotations

import re
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.worksheet import Worksheet

ROOT = Path(__file__).resolve().parents[1]
ORIG = Path("/tmp/orig/sheet.xlsx")
OUT = ROOT / "public" / "Dans-mon-assiette.xlsx"
GS = ROOT / "scripts" / "activer-liens-sheets.gs"

DAYS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"]
DAY_LABEL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
ILLEGAL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")

GREEN = "4A5A3A"
CREAM = "F6F1E6"
WHITE = "FFFFFF"
CARD = "FFFCF6"


def clean(value: object) -> str | int | float:
    if value is None:
        return ""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if float(value).is_integer():
            return int(value)
        return value
    text = str(value).replace("\r\n", "\n")
    if text.startswith("=IMAGE(") or "__xludf.DUMMYFUNCTION" in text:
        return ""
    return ILLEGAL.sub("", text)[:32000]


def fill(hex_color: str) -> PatternFill:
    return PatternFill("solid", fgColor=hex_color)


def thin() -> Border:
    s = Side(style="thin", color="D9D3C5")
    return Border(left=s, right=s, top=s, bottom=s)


def copy_used(
    src: Worksheet,
    dest: Worksheet,
    cols: int,
    skip_image: bool = False,
    keep_rows: bool = False,
) -> None:
    dest.sheet_view.showGridLines = True
    for r in range(1, src.max_row + 1):
        empty = True
        values = []
        for c in range(1, cols + 1):
            val = src.cell(r, c).value
            if skip_image and c == 1 and isinstance(val, str) and val.startswith("=IMAGE"):
                val = ""
            val = clean(val)
            values.append(val)
            if val not in ("", None):
                empty = False
        if empty and r > 3 and not keep_rows:
            continue
        for c, val in enumerate(values, 1):
            dest.cell(r, c, val)
            dest.cell(r, c).alignment = Alignment(wrap_text=True, vertical="top")


def load_meals(src) -> list[dict]:
    app = src["_APP_DATA"]
    meals: list[dict] = []
    idx = 0
    for r in range(2, app.max_row + 1):
        plat = clean(app.cell(r, 4).value)
        if not plat:
            continue
        meals.append(
            {
                "week": int(app.cell(r, 1).value or 0),
                "day": str(app.cell(r, 2).value or ""),
                "meal": str(app.cell(r, 3).value or ""),
                "name": str(plat),
                "ings": str(clean(app.cell(r, 8).value) or ""),
                "fiche": 7 + idx,
            }
        )
        idx += 1
    return meals


def q(text: str) -> str:
    return str(text).replace('"', '""')


def href(range_a1: str, label: str) -> str:
    # gid=0 = 1re feuille après import Google Sheets — lien interne vraiment cliquable
    return f'=HYPERLINK("#gid=0&range={range_a1}","{q(label)}")'


def build_dashboard(wb: Workbook, meals: list[dict]) -> None:
    ws = wb.active
    ws.title = "Dashboard"
    widths = [22, 28, 36, 14, 10, 42, 42, 18]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w

    menu_start = 5
    fiche_start = menu_start + 52 * 5 + 3  # 268
    for i, m in enumerate(meals):
        m["dash_base"] = menu_start + (m["week"] - 1) * 5
        m["fiche_row"] = fiche_start + i

    ws.merge_cells("A1:H1")
    ws["A1"] = "MON CARNET — 52 SEMAINES"
    ws["A1"].font = Font(name="Calibri", bold=True, size=20, color=GREEN)
    ws["A1"].fill = fill(CREAM)
    ws.row_dimensions[1].height = 36

    ws["A2"] = href(f"A{fiche_start}", "MES RECETTES (clique un plat)")
    ws["C2"] = href("A5", "RETOUR SEMAINE 1")
    for coord in ("A2", "C2"):
        ws[coord].font = Font(bold=True, size=12, color=WHITE, underline="single")
        ws[coord].fill = fill(GREEN)
        ws[coord].alignment = Alignment(horizontal="center")

    ws.merge_cells("A3:H3")
    ws["A3"] = "Clique un plat : ça saute à sa fiche plus bas sur cette feuille. Puis « ← Semaine » pour revenir."
    ws["A3"].font = Font(italic=True, size=10, color="666666")

    by_week: dict[int, list[dict]] = {}
    for m in meals:
        by_week.setdefault(m["week"], []).append(m)

    row = menu_start
    for week in range(1, 53):
        week_meals = by_week.get(week, [])
        lookup = {(m["day"], m["meal"]): m for m in week_meals}

        ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=8)
        title = ws.cell(row, 1, f"SEMAINE {week}")
        title.font = Font(bold=True, size=16, color=GREEN)
        title.fill = fill(CREAM)
        ws.row_dimensions[row].height = 22
        row += 1

        for i, label in enumerate(DAY_LABEL):
            cell = ws.cell(row, i + 2, label)
            cell.font = Font(bold=True, size=11, color=WHITE)
            cell.fill = fill(GREEN)
            cell.alignment = Alignment(horizontal="center")
        row += 1

        for meal_name, label in (("Midi", "MIDI"), ("Soir", "SOIR")):
            ws.cell(row, 1, label).font = Font(bold=True, size=12, color=GREEN)
            for d, day in enumerate(DAYS):
                m = lookup.get((day, meal_name))
                cell = ws.cell(row, d + 2)
                if m:
                    cell.value = href(f"A{m['fiche_row']}", m["name"])
                cell.font = Font(bold=True, size=10, color=GREEN, underline="single")
                cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
                cell.fill = fill(CARD)
                cell.border = thin()
            ws.row_dimensions[row].height = 48
            row += 1
        row += 1

    ws.merge_cells(start_row=fiche_start - 1, start_column=1, end_row=fiche_start - 1, end_column=7)
    head = ws.cell(fiche_start - 1, 1, "FICHES RECETTES — clique « ← Semaine » pour remonter")
    head.font = Font(bold=True, size=16, color=GREEN)
    head.fill = fill(CREAM)

    headers = ["RETOUR", "SEMAINE", "PLAT", "JOUR", "REPAS", "INGRÉDIENTS", "PRÉPARATION"]
    for i, h in enumerate(headers, 1):
        cell = ws.cell(fiche_start, i, h)
        cell.font = Font(bold=True, color=WHITE)
        cell.fill = fill(GREEN)

    for i, m in enumerate(meals):
        r = m["fiche_row"]
        # première ligne de données = fiche_start + 1 si headers on fiche_start
        # on a mis headers sur fiche_start, donc décaler les plats
    # headers occupy fiche_start; meals were assigned fiche_start+i overlapping header
    # rewrite meal rows starting at fiche_start+1
    for i, m in enumerate(meals):
        m["fiche_row"] = fiche_start + 1 + i
    # rewrite menu hyperlinks with corrected rows
    for m in meals:
        day_i = DAYS.index(m["day"]) if m["day"] in DAYS else 0
        dash_row = m["dash_base"] + (2 if m["meal"] == "Midi" else 3)
        ws.cell(dash_row, day_i + 2).value = href(f"A{m['fiche_row']}", m["name"])

    for m in meals:
        r = m["fiche_row"]
        week_row = m["dash_base"]
        ws.cell(r, 1, href(f"A{week_row}", f"← Semaine {m['week']}"))
        ws.cell(r, 2, m["week"])
        ws.cell(r, 3, m["name"])
        ws.cell(r, 4, m["day"])
        ws.cell(r, 5, m["meal"])
        ws.cell(r, 6, m["ings"] or "Adapter les quantités.")
        ws.cell(r, 7, "1. Préparer les ingrédients.\n2. Cuire selon le plat.\n3. Assaisonner et servir.")
        ws.cell(r, 1).font = Font(bold=True, color=GREEN, underline="single")
        ws.cell(r, 3).font = Font(bold=True, size=12, color=GREEN)
        for c in range(1, 8):
            ws.cell(r, c).alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[r].height = 64

    ws["A2"] = href(f"A{fiche_start}", "MES RECETTES (clique un plat)")
    ws["A2"].font = Font(bold=True, size=12, color=WHITE, underline="single")
    ws["A2"].fill = fill(GREEN)
    ws.freeze_panes = "A5"
    ws.sheet_view.showGridLines = False
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0


def build_map(wb: Workbook, meals: list[dict]) -> None:
    ws = wb.create_sheet("_MAP")
    ws["A1"] = "semaine"
    ws["B1"] = "jour"
    ws["C1"] = "repas"
    ws["D1"] = "plat"
    ws["E1"] = "fiche_ligne"
    ws["F1"] = "dash_ligne"
    ws["G1"] = "dash_col"
    for cell in ws[1]:
        cell.font = Font(bold=True, color=WHITE)
        cell.fill = fill(GREEN)

    # même géométrie que Dashboard : semaine k commence à la ligne 5 + (k-1)*5
    #  title, headers, midi, soir, spacer = 5 rows
    for i, m in enumerate(meals, 2):
        week = m["week"]
        day_i = DAYS.index(m["day"]) if m["day"] in DAYS else 0
        base = 5 + (week - 1) * 5
        dash_row = base + 2 if m["meal"] == "Midi" else base + 3
        ws.cell(i, 1, week)
        ws.cell(i, 2, m["day"])
        ws.cell(i, 3, m["meal"])
        ws.cell(i, 4, m["name"])
        ws.cell(i, 5, m["fiche"])
        ws.cell(i, 6, dash_row)
        ws.cell(i, 7, day_i + 2)
    for i, w in enumerate([10, 12, 10, 48, 12, 12, 10], 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.sheet_state = "hidden"


SCRIPT = r'''/**
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
'''


def write_script(_meals: list[dict]) -> str:
    return SCRIPT


def main() -> None:
    src = load_workbook(ORIG, data_only=False, read_only=False)
    meals = load_meals(src)
    if len(meals) < 700:
        raise SystemExit(f"pas assez de plats: {len(meals)}")

    wb = Workbook()
    build_dashboard(wb, meals)
    build_map(wb, meals)

    fiche = wb.create_sheet("Fiche_Recette")
    copy_used(src["Fiche_Recette"], fiche, 8, skip_image=True, keep_rows=True)
    fiche["A1"] = ""
    fiche["B3"] = "RETOUR AU DASHBOARD"
    fiche["C3"] = "RETOUR AU PLANNING"
    fiche["B3"].font = Font(bold=True, color=GREEN, underline="single")
    fiche["C3"].font = Font(bold=True, color=GREEN, underline="single")
    fiche.freeze_panes = "A7"
    fiche.auto_filter.ref = f"B6:H{max(fiche.max_row, 7)}"
    for i, w in enumerate([4, 12, 48, 14, 10, 40, 40, 12], 1):
        fiche.column_dimensions[get_column_letter(i)].width = w
    for cell in fiche[1]:
        cell.font = Font(bold=True, color=WHITE)
        cell.fill = fill(GREEN)

    app = wb.create_sheet("_APP_DATA")
    copy_used(src["_APP_DATA"], app, 9, keep_rows=True)
    app.auto_filter.ref = f"A1:I{app.max_row}"
    app.freeze_panes = "A2"
    for i, w in enumerate([10, 12, 10, 45, 16, 12, 40, 40, 10], 1):
        app.column_dimensions[get_column_letter(i)].width = w
    for cell in app[1]:
        cell.font = Font(bold=True, color=WHITE)
        cell.fill = fill(GREEN)

    courses = wb.create_sheet("LISTES COURSES 2")
    copy_used(src["LISTES COURSES 2"], courses, 4)
    courses["F1"] = "RETOUR AU DASHBOARD"
    courses["F1"].font = Font(bold=True, color=GREEN, underline="single")
    courses.auto_filter.ref = f"A1:D{courses.max_row}"
    courses.freeze_panes = "A3"
    for i, w in enumerate([12, 40, 22, 50], 1):
        courses.column_dimensions[get_column_letter(i)].width = w
    for cell in courses[1]:
        cell.font = Font(bold=True, color=WHITE)
        cell.fill = fill(GREEN)

    batch = wb.create_sheet("BATCH")
    copy_used(src["BATCH"], batch, 4)
    batch["F1"] = "RETOUR AU DASHBOARD"
    batch["F1"].font = Font(bold=True, color=GREEN, underline="single")
    batch.auto_filter.ref = f"A1:D{batch.max_row}"
    batch.freeze_panes = "A3"
    for i, w in enumerate([12, 55, 16, 22], 1):
        batch.column_dimensions[get_column_letter(i)].width = w
    for cell in batch[1]:
        cell.font = Font(bold=True, color=WHITE)
        cell.fill = fill(GREEN)

    script_text = write_script(meals)
    GS.write_text(script_text, encoding="utf-8")

    script = wb.create_sheet("_SCRIPT")
    script["A1"] = "Activer les liens dans Google Sheets (une fois)"
    script["A1"].font = Font(bold=True, size=14, color=GREEN)
    script["A3"] = "1. Extensions → Apps Script"
    script["A4"] = "2. Efface le code proposé, ouvre le fichier activer-liens-sheets.gs du projet, colle-le"
    script["A5"] = "3. Enregistrer, exécuter activerLiens, autoriser"
    script["A6"] = "4. Retour au Dashboard : chaque plat ouvre sa fiche"
    script["A8"] = script_text
    script["A8"].alignment = Alignment(wrap_text=True, vertical="top")
    script.row_dimensions[8].height = 200
    script.column_dimensions["A"].width = 120

    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT)
    src.close()

    check = load_workbook(OUT, data_only=False)
    sample = str(check["Dashboard"]["B7"].value or "")
    if not sample.startswith('=HYPERLINK("#gid=0') or "Poulet paprika" not in sample:
        raise SystemExit(f"lien Dashboard B7 invalide: {sample!r}")
    print("ok", OUT, OUT.stat().st_size, "plats", len(meals), "B7", sample[:120])
    print("sheets", check.sheetnames)
    check.close()


if __name__ == "__main__":
    main()
