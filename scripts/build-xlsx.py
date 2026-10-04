#!/usr/bin/env python3
"""Classeur Google-Sheets-safe : texte visible, aucun hyperlien natif (l'import ne casse plus)."""

from __future__ import annotations

import json
import re
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.worksheet import Worksheet

ROOT = Path(__file__).resolve().parents[1]
ORIG = Path("/tmp/orig/sheet.xlsx")
OUT = ROOT / "public" / "Dans-mon-assiette.xlsx"
GS = ROOT / "scripts" / "remplir-carnet.gs"

DAYS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"]
DAY_LABEL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
ILLEGAL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
GREEN, CREAM, WHITE, CARD = "4A5A3A", "F6F1E6", "FFFFFF", "FFFCF6"


def clean(value: object) -> str | int | float:
    if value is None:
        return ""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return int(value) if float(value).is_integer() else value
    text = str(value).replace("\r\n", "\n")
    if text.startswith("=IMAGE(") or "__xludf.DUMMYFUNCTION" in text:
        return ""
    return ILLEGAL.sub("", text)[:32000]


def fill(hex_color: str) -> PatternFill:
    return PatternFill("solid", fgColor=hex_color)


def thin() -> Border:
    s = Side(style="thin", color="D9D3C5")
    return Border(left=s, right=s, top=s, bottom=s)


def copy_compact(src: Worksheet, dest: Worksheet, cols: int) -> int:
    dest.sheet_view.showGridLines = True
    out_r = 1
    for r in range(1, (src.max_row or 0) + 1):
        values = [clean(src.cell(r, c).value) for c in range(1, cols + 1)]
        if out_r > 1 and not any(v not in ("", None) for v in values):
            continue
        for c, val in enumerate(values, 1):
            dest.cell(out_r, c, val)
        out_r += 1
    return out_r - 1


def load_meals(src) -> list[dict]:
    app = src["_APP_DATA"]
    meals = []
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
            }
        )
    return meals


def build_dashboard(ws, meals: list[dict]) -> None:
    for i, w in enumerate([22, 28, 36, 14, 10, 44, 44, 18], 1):
        ws.column_dimensions[get_column_letter(i)].width = w

    menu_start = 5
    for m in meals:
        m["week_row"] = menu_start + (m["week"] - 1) * 5

    ws.merge_cells("A1:H1")
    ws["A1"] = "MON CARNET — MA CUISINE AU QUOTIDIEN"
    ws["A1"].font = Font(name="Calibri", bold=True, size=22, color=GREEN)
    ws["A1"].fill = fill(CREAM)
    ws.row_dimensions[1].height = 36

    ws["A2"] = "Toutes les fiches → onglet Fiche_Recette"
    ws["C2"] = "Courses → onglet Courses"
    ws["E2"] = "Batch → onglet Batch"
    for coord in ("A2", "C2", "E2"):
        ws[coord].font = Font(bold=True, size=11, color=WHITE)
        ws[coord].fill = fill(GREEN)
        ws[coord].alignment = Alignment(horizontal="center")

    ws.merge_cells("A3:H3")
    ws["A3"] = "52 semaines. Après import : Extensions → Apps Script → remplir-carnet.gs → creerCarnet (liens cliquables)."
    ws["A3"].font = Font(italic=True, size=11, color="666666")

    by_week: dict[int, list[dict]] = {}
    for m in meals:
        by_week.setdefault(m["week"], []).append(m)

    row = menu_start
    for week in range(1, 53):
        lookup = {(m["day"], m["meal"]): m for m in by_week.get(week, [])}
        ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=8)
        title = ws.cell(row, 1, f"SEMAINE {week}")
        title.font = Font(bold=True, size=16, color=GREEN)
        title.fill = fill(CREAM)
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
                    cell.value = m["name"]
                cell.font = Font(bold=True, size=10, color=GREEN)
                cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
                cell.fill = fill(CARD)
                cell.border = thin()
            ws.row_dimensions[row].height = 48
            row += 1
        row += 1

    ws.freeze_panes = "A5"
    ws.sheet_view.showGridLines = True


def build_fiches(ws, meals: list[dict]) -> None:
    for i, w in enumerate([16, 12, 44, 14, 10, 44, 44], 1):
        ws.column_dimensions[get_column_letter(i)].width = w

    ws["A1"] = "FICHES RECETTES"
    ws["A1"].font = Font(name="Calibri", bold=True, size=20, color=GREEN)
    ws["A1"].fill = fill(CREAM)
    ws["A3"] = "Retour : onglet Dashboard"
    ws["A3"].font = Font(bold=True, size=12, color=GREEN)
    ws["A5"] = "Une ligne = une recette."
    ws["A5"].font = Font(italic=True, size=11, color="666666")

    headers = ["RETOUR", "SEMAINE", "PLAT", "JOUR", "REPAS", "INGREDIENTS", "PREPARATION"]
    for i, name in enumerate(headers, 1):
        cell = ws.cell(6, i, name)
        cell.font = Font(bold=True, color=WHITE)
        cell.fill = fill(GREEN)

    for m in meals:
        r = m["fiche_row"]
        ws.cell(r, 1, f"Semaine {m['week']}")
        ws.cell(r, 2, m["week"])
        ws.cell(r, 3, m["name"])
        ws.cell(r, 4, m["day"])
        ws.cell(r, 5, m["meal"])
        ws.cell(r, 6, m["ings"] or "Adapter les quantites.")
        ws.cell(r, 7, "1. Preparer les ingredients.\n2. Cuire selon le plat.\n3. Assaisonner et servir.")
        ws.cell(r, 3).font = Font(bold=True, size=12, color=GREEN)

    ws.freeze_panes = "A7"


def style_header(ws, cols: int) -> None:
    for cell in ws[1][:cols]:
        cell.font = Font(bold=True, color=WHITE)
        cell.fill = fill(GREEN)


def write_gs(meals: list[dict]) -> None:
    payload = [
        {"w": m["week"], "d": m["day"], "m": m["meal"], "n": m["name"], "i": m["ings"]}
        for m in meals
    ]
    GS.write_text(
        """/**
 * Colle ce fichier dans le Google Sheet VIDE (celui qui s'est ouvert blanc) :
 * Extensions → Apps Script → tout effacer → coller → Enregistrer
 * → sélectionne creerCarnet → Exécuter → Autoriser.
 * La feuille se remplit : 52 semaines, fiches, liens cliquables.
 */
var MEALS = """
        + json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        + """;
var DAYS = ["LUNDI","MARDI","MERCREDI","JEUDI","VENDREDI","SAMEDI","DIMANCHE"];
var LABELS = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Carnet")
    .addItem("Remplir le carnet + liens", "creerCarnet")
    .addToUi();
}

function esc(s) {
  return String(s || "").replace(/"/g, '""');
}

function creerCarnet() {
  var ss = SpreadsheetApp.getActive();
  var dash = ss.getSheets()[0];
  dash.setName("Dashboard");
  dash.clear();
  ss.getSheets().forEach(function (sh) {
    if (sh.getName() !== "Dashboard" && ss.getSheets().length > 1) {
      ss.deleteSheet(sh);
    }
  });
  var fiche = ss.insertSheet("Fiche_Recette");
  var gid = fiche.getSheetId();
  var gidDash = dash.getSheetId();

  var ficheStart = 7;
  var menuStart = 5;
  MEALS.forEach(function (m, i) {
    m.ficheRow = ficheStart + i;
    m.weekRow = menuStart + (m.w - 1) * 5;
  });

  dash.getRange("A1").setValue("MON CARNET — MA CUISINE AU QUOTIDIEN");
  dash.getRange("A2").setFormula('=HYPERLINK("#gid=' + gid + '&range=A1","Toutes les fiches")');
  dash.getRange("A3").setValue("Clique un plat → sa fiche.");

  var byWeek = {};
  MEALS.forEach(function (m) {
    if (!byWeek[m.w]) byWeek[m.w] = [];
    byWeek[m.w].push(m);
  });

  for (var week = 1; week <= 52; week++) {
    var row = menuStart + (week - 1) * 5;
    dash.getRange(row, 1).setValue("SEMAINE " + week);
    for (var d = 0; d < 7; d++) dash.getRange(row + 1, d + 2).setValue(LABELS[d]);
    dash.getRange(row + 2, 1).setValue("MIDI");
    dash.getRange(row + 3, 1).setValue("SOIR");
    var list = byWeek[week] || [];
    list.forEach(function (m) {
      var col = DAYS.indexOf(m.d) + 2;
      var r = m.m === "Midi" ? row + 2 : row + 3;
      if (col < 2) return;
      dash.getRange(r, col).setFormula(
        '=HYPERLINK("#gid=' + gid + "&range=C" + m.ficheRow + '","' + esc(m.n) + '")'
      );
    });
  }

  fiche.getRange("A1").setValue("FICHES RECETTES");
  fiche.getRange("A3").setFormula('=HYPERLINK("#gid=' + gidDash + '&range=A5","Retour au planning")');
  fiche.getRange(6, 1, 1, 7).setValues([["RETOUR","SEMAINE","PLAT","JOUR","REPAS","INGREDIENTS","PREPARATION"]]);
  var rows = MEALS.map(function (m) {
    return [
      "Semaine " + m.w,
      m.w,
      m.n,
      m.d,
      m.m,
      m.i || "Adapter les quantites.",
      "1. Preparer. 2. Cuire. 3. Servir.",
    ];
  });
  fiche.getRange(7, 1, rows.length, 7).setValues(rows);
  MEALS.forEach(function (m) {
    fiche.getRange(m.ficheRow, 1).setFormula(
      '=HYPERLINK("#gid=' + gidDash + "&range=A" + m.weekRow + '","Semaine ' + m.w + '")'
    );
  });

  SpreadsheetApp.getUi().alert("Carnet pret. Clique un plat sur le Dashboard.");
}
""",
        encoding="utf-8",
    )


def main() -> None:
    src = load_workbook(ORIG, data_only=False)
    meals = load_meals(src)
    if len(meals) < 700:
        raise SystemExit(f"plats manquants: {len(meals)}")

    fiche_start = 7
    for i, m in enumerate(meals):
        m["fiche_row"] = fiche_start + i

    wb = Workbook()
    dash = wb.active
    dash.title = "Dashboard"
    build_dashboard(dash, meals)

    fiches = wb.create_sheet("Fiche_Recette")
    build_fiches(fiches, meals)

    courses = wb.create_sheet("Courses")
    copy_compact(src["LISTES COURSES 2"], courses, 4)
    courses["F1"] = "Dashboard"
    for i, w in enumerate([12, 40, 22, 50, 8, 14], 1):
        courses.column_dimensions[get_column_letter(i)].width = w
    style_header(courses, 4)

    batch = wb.create_sheet("Batch")
    copy_compact(src["BATCH"], batch, 4)
    batch["F1"] = "Dashboard"
    for i, w in enumerate([12, 55, 16, 22, 8, 14], 1):
        batch.column_dimensions[get_column_letter(i)].width = w
    style_header(batch, 4)

    src.close()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT)
    write_gs(meals)

    check = load_workbook(OUT)
    if check.sheetnames != ["Dashboard", "Fiche_Recette", "Courses", "Batch"]:
        raise SystemExit(f"onglets interdits: {check.sheetnames}")
    b7 = str(check["Dashboard"]["B7"].value or "")
    if "Poulet paprika" not in b7:
        raise SystemExit(f"B7 vide: {b7!r}")
    if b7.startswith("=") or check["Dashboard"]["B7"].hyperlink:
        raise SystemExit("B7 a encore un lien — Google Sheets vide le fichier")
    print("ok", OUT, OUT.stat().st_size, check.sheetnames, b7)
    print("gs", GS, GS.stat().st_size)
    check.close()


if __name__ == "__main__":
    main()
