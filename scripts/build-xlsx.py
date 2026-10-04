#!/usr/bin/env python3
"""Reconstruit le Dashboard d’origine + fiches / courses / batch, sans formules Google cassées."""

from __future__ import annotations

import re
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.worksheet import Worksheet

ROOT = Path(__file__).resolve().parents[1]
ORIG = Path("/tmp/orig/sheet.xlsx")
OUT = ROOT / "public" / "Dans-mon-assiette.xlsx"

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


def build_dashboard(wb: Workbook) -> None:
    ws = wb.active
    ws.title = "Dashboard"
    ws.merge_cells("A1:H1")
    ws.merge_cells("A7:H7")
    ws.merge_cells("A14:H14")
    widths = [18, 28, 28, 28, 26, 26, 22, 22]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.row_dimensions[1].height = 42
    ws.row_dimensions[7].height = 32
    ws.row_dimensions[10].height = 72
    ws.row_dimensions[11].height = 72
    ws.row_dimensions[14].height = 28
    ws.row_dimensions[20].height = 28

    ws["A1"] = "🍽️ MON CARNET — MA CUISINE AU QUOTIDIEN"
    ws["A1"].font = Font(name="Calibri", bold=True, size=22, color=GREEN)
    ws["A1"].alignment = Alignment(horizontal="left", vertical="center")
    ws["A1"].fill = fill(CREAM)

    ws["A4"] = "📅 Semaine"
    ws["A4"].font = Font(bold=True, size=16, color=GREEN)
    ws["B4"] = 1
    ws["B4"].font = Font(bold=True, size=18, color=GREEN)
    ws["B4"].fill = fill("E8EEDD")
    ws["C4"] = "← change ce chiffre (1 à 52), le menu suit"
    ws["C4"].font = Font(italic=True, size=11, color="666666")
    dv = DataValidation(type="whole", operator="between", formula1="1", formula2="52")
    dv.add("B4")
    ws.add_data_validation(dv)
    # gids Google Sheets (1er onglet = 0, puis 1, 2, 3, 4 à l’import habituel)
    ws["H23"] = "gid Fiches"
    ws["I23"] = 1
    ws["H24"] = "gid Courses"
    ws["I24"] = 3
    ws["H25"] = "gid Batch"
    ws["I25"] = 4
    for r in range(23, 26):
        ws.cell(r, 8).font = Font(size=9, color="888888")
        ws.cell(r, 9).font = Font(size=9, color="888888")
        ws.cell(r, 9).fill = fill("E8EEDD")

    ws["A7"] = "📅 MON MENU DE LA SEMAINE"
    ws["A7"].font = Font(bold=True, size=20, color=GREEN)
    ws["A7"].fill = fill(CREAM)

    for i, label in enumerate(DAY_LABEL):
        cell = ws.cell(9, i + 2, label)
        cell.font = Font(bold=True, size=14, color=WHITE)
        cell.fill = fill(GREEN)
        cell.alignment = Alignment(horizontal="center")

    ws["A10"] = "☀️ MIDI"
    ws["A11"] = "🌙 SOIR"
    for r in (10, 11):
        ws.cell(r, 1).font = Font(bold=True, size=14, color=GREEN)
        ws.cell(r, 1).alignment = Alignment(vertical="center")

    # 14 repas / semaine, dans _APP_DATA à partir de la ligne 2, fiches à partir de la ligne 7
    for d in range(7):
        midi_off = d * 2
        soir_off = d * 2 + 1
        midi = ws.cell(10, d + 2)
        soir = ws.cell(11, d + 2)
        # Format Google Sheets : #gid=…&range=… (Excel #Feuille!C7 n’est pas cliquable dans Sheets)
        midi.value = (
            f'=HYPERLINK("#gid="&$I$23&"&range=C"&(7+($B$4-1)*14+{midi_off}),'
            f'INDEX(_APP_DATA!D:D,2+($B$4-1)*14+{midi_off}))'
        )
        soir.value = (
            f'=HYPERLINK("#gid="&$I$23&"&range=C"&(7+($B$4-1)*14+{soir_off}),'
            f'INDEX(_APP_DATA!D:D,2+($B$4-1)*14+{soir_off}))'
        )
        for cell in (midi, soir):
            cell.font = Font(bold=True, size=11, color=GREEN, underline="single")
            cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
            cell.fill = fill(CARD)
            cell.border = thin()

    ws["A14"] = "🎯 JE VEUX CUISINER CE PLAT"
    ws["A14"].font = Font(bold=True, size=18, color=GREEN)
    ws["A14"].fill = fill(CREAM)
    ws["B17"] = "Recette :"
    ws["B17"].font = Font(bold=True, size=14)
    ws["C17"] = "=B10"
    ws["C17"].font = Font(bold=True, size=14, color=GREEN)

    ws["B20"] = '=HYPERLINK("#gid="&$I$24&"&range=A1","🛒 MES COURSES")'
    ws["D20"] = '=HYPERLINK("#gid="&$I$25&"&range=A1","🍳 MON BATCH")'
    ws["F20"] = '=HYPERLINK("#gid="&$I$23&"&range=A1","🍽️ MES RECETTES")'
    for coord in ("B20", "D20", "F20"):
        ws[coord].font = Font(bold=True, size=14, color=WHITE)
        ws[coord].fill = fill(GREEN)
        ws[coord].alignment = Alignment(horizontal="center", vertical="center")

    ws["B22"] = (
        "B4 = semaine (1–52). Liens au format Google Sheets. "
        "Si un clic ne saute pas : ouvre l’onglet Fiche_Recette, copie le gid= de l’URL dans I23."
    )
    ws["B22"].font = Font(size=10, color="666666")
    ws.freeze_panes = "A9"
    ws.sheet_view.showGridLines = False
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 1


def main() -> None:
    src = load_workbook(ORIG, data_only=False, read_only=False)
    wb = Workbook()
    build_dashboard(wb)

    fiche = wb.create_sheet("Fiche_Recette")
    copy_used(src["Fiche_Recette"], fiche, 8, skip_image=True, keep_rows=True)
    fiche["A1"] = ""
    fiche["B3"] = '=HYPERLINK("#gid=0&range=A1","⬅️ RETOUR AU DASHBOARD")'
    fiche["C3"] = '=HYPERLINK("#gid=0&range=A1","⬅️ RETOUR AU PLANNING")'
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
    courses["F1"] = '=HYPERLINK("#gid=0&range=A1","⬅️ RETOUR AU DASHBOARD")'
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
    batch["F1"] = '=HYPERLINK("#gid=0&range=A1","⬅️ RETOUR AU DASHBOARD")'
    batch["F1"].font = Font(bold=True, color=GREEN, underline="single")
    batch.auto_filter.ref = f"A1:D{batch.max_row}"
    batch.freeze_panes = "A3"
    for i, w in enumerate([12, 55, 16, 22], 1):
        batch.column_dimensions[get_column_letter(i)].width = w
    for cell in batch[1]:
        cell.font = Font(bold=True, color=WHITE)
        cell.fill = fill(GREEN)

    script = wb.create_sheet("_SCRIPT")
    script["A1"] = "Si les plats ne sont pas cliquables dans Google Sheets"
    script["A1"].font = Font(bold=True, size=14, color=GREEN)
    script["A3"] = "1. Extensions → Apps Script"
    script["A4"] = "2. Efface le code, colle celui ci-dessous, Enregistrer"
    script["A5"] = "3. Exécuter reparerGids (autoriser ton compte une fois)"
    script["A6"] = "4. Reviens au Dashboard : les plats deviennent des liens"
    script["A8"] = (
        "function onOpen(){ reparerGids(); }\n"
        "function reparerGids(){\n"
        "  var ss = SpreadsheetApp.getActive();\n"
        "  var dash = ss.getSheetByName('Dashboard');\n"
        "  var fiche = ss.getSheetByName('Fiche_Recette');\n"
        "  var courses = ss.getSheetByName('LISTES COURSES 2');\n"
        "  var batch = ss.getSheetByName('BATCH');\n"
        "  if (!dash || !fiche) return;\n"
        "  dash.getRange('I23').setValue(fiche.getSheetId());\n"
        "  if (courses) dash.getRange('I24').setValue(courses.getSheetId());\n"
        "  if (batch) dash.getRange('I25').setValue(batch.getSheetId());\n"
        "}\n"
    )
    script["A8"].alignment = Alignment(wrap_text=True, vertical="top")
    script.row_dimensions[8].height = 180
    script.column_dimensions["A"].width = 100

    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT)
    src.close()

    # garde-fou : aucun lien externe
    import zipfile

    with zipfile.ZipFile(OUT) as z:
        for name in z.namelist():
            if name.endswith(".rels") and "TargetMode=\"External\"" in z.read(name).decode("utf-8", "replace"):
                raise SystemExit(f"lien externe dans {name}")
    print("ok", OUT, OUT.stat().st_size, "sheets", wb.sheetnames)


if __name__ == "__main__":
    main()
