#!/usr/bin/env python3
"""Classeur propre (4 onglets). Liens internes Excel → cliquables dans Google Sheets."""

from __future__ import annotations

import re
import zipfile
from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.hyperlink import Hyperlink
from openpyxl.worksheet.worksheet import Worksheet

ROOT = Path(__file__).resolve().parents[1]
ORIG = Path("/tmp/orig/sheet.xlsx")
OUT = ROOT / "public" / "Dans-mon-assiette.xlsx"

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


def jump(cell, sheet: str, a1: str, label: str) -> None:
    """Lien interne Excel (pas une formule #gid). Google Sheets le convertit au bon gid."""
    cell.value = label
    cell.hyperlink = Hyperlink(
        ref=cell.coordinate,
        location=f"'{sheet}'!{a1}",
        display=label,
        tooltip=label,
    )


def copy_used(src: Worksheet, dest: Worksheet, cols: int) -> None:
    dest.sheet_view.showGridLines = True
    for r in range(1, src.max_row + 1):
        values = [clean(src.cell(r, c).value) for c in range(1, cols + 1)]
        if r > 2 and not any(v not in ("", None) for v in values):
            continue
        for c, val in enumerate(values, 1):
            dest.cell(r, c, val)
            dest.cell(r, c).alignment = Alignment(wrap_text=True, vertical="top")


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
    ws["A1"] = "🍽️ MON CARNET — MA CUISINE AU QUOTIDIEN"
    ws["A1"].font = Font(name="Calibri", bold=True, size=22, color=GREEN)
    ws["A1"].fill = fill(CREAM)
    ws.row_dimensions[1].height = 36

    jump(ws["A2"], "Fiche_Recette", "A1", "↓ Toutes les fiches")
    jump(ws["C2"], "Courses", "A1", "🛒 Mes courses")
    jump(ws["E2"], "Batch", "A1", "🍳 Mon batch")
    for coord in ("A2", "C2", "E2"):
        ws[coord].font = Font(bold=True, size=12, color=WHITE, underline="single")
        ws[coord].fill = fill(GREEN)
        ws[coord].alignment = Alignment(horizontal="center")

    ws.merge_cells("A3:H3")
    ws["A3"] = "Clique un plat → sa fiche s’ouvre. 52 semaines, 3 onglets utiles."
    ws["A3"].font = Font(italic=True, size=11, color="666666")

    by_week: dict[int, list[dict]] = {}
    for m in meals:
        by_week.setdefault(m["week"], []).append(m)

    row = menu_start
    for week in range(1, 53):
        lookup = {(m["day"], m["meal"]): m for m in by_week.get(week, [])}
        ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=8)
        title = ws.cell(row, 1, f"📅 SEMAINE {week}")
        title.font = Font(bold=True, size=16, color=GREEN)
        title.fill = fill(CREAM)
        row += 1
        for i, label in enumerate(DAY_LABEL):
            cell = ws.cell(row, i + 2, label)
            cell.font = Font(bold=True, size=11, color=WHITE)
            cell.fill = fill(GREEN)
            cell.alignment = Alignment(horizontal="center")
        row += 1
        for meal_name, label in (("Midi", "☀️ MIDI"), ("Soir", "🌙 SOIR")):
            ws.cell(row, 1, label).font = Font(bold=True, size=12, color=GREEN)
            for d, day in enumerate(DAYS):
                m = lookup.get((day, meal_name))
                cell = ws.cell(row, d + 2)
                if m:
                    jump(cell, "Fiche_Recette", f"C{m['fiche_row']}", m["name"])
                cell.font = Font(bold=True, size=10, color="1155CC", underline="single")
                cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
                cell.fill = fill(CARD)
                cell.border = thin()
            ws.row_dimensions[row].height = 52
            row += 1
        row += 1

    ws.freeze_panes = "A5"
    ws.sheet_view.showGridLines = False
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1


def build_fiches(ws, meals: list[dict]) -> None:
    for i, w in enumerate([22, 12, 44, 14, 10, 44, 44], 1):
        ws.column_dimensions[get_column_letter(i)].width = w

    ws.merge_cells("A1:G1")
    ws["A1"] = "FICHES RECETTES"
    ws["A1"].font = Font(name="Calibri", bold=True, size=20, color=GREEN)
    ws["A1"].fill = fill(CREAM)
    ws.row_dimensions[1].height = 32

    jump(ws["A3"], "Dashboard", "A5", "← Retour au planning")
    ws["A3"].font = Font(bold=True, size=12, color="1155CC", underline="single")

    ws.merge_cells("A5:G5")
    ws["A5"] = "Clique « ← Semaine » pour revenir au menu de cette semaine."
    ws["A5"].font = Font(italic=True, size=11, color="666666")

    headers = ["RETOUR", "SEMAINE", "PLAT", "JOUR", "REPAS", "INGRÉDIENTS", "PRÉPARATION"]
    for i, name in enumerate(headers, 1):
        cell = ws.cell(6, i, name)
        cell.font = Font(bold=True, color=WHITE)
        cell.fill = fill(GREEN)

    for m in meals:
        r = m["fiche_row"]
        jump(ws.cell(r, 1), "Dashboard", f"A{m['week_row']}", f"← Semaine {m['week']}")
        ws.cell(r, 2, m["week"])
        ws.cell(r, 3, m["name"])
        ws.cell(r, 4, m["day"])
        ws.cell(r, 5, m["meal"])
        ws.cell(r, 6, m["ings"] or "Adapter les quantités.")
        ws.cell(r, 7, "1. Préparer les ingrédients.\n2. Cuire selon le plat.\n3. Assaisonner et servir.")
        ws.cell(r, 1).font = Font(bold=True, color="1155CC", underline="single")
        ws.cell(r, 3).font = Font(bold=True, size=12, color=GREEN)
        for c in range(1, 8):
            ws.cell(r, c).alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[r].height = 60

    ws.freeze_panes = "A7"
    ws.auto_filter.ref = f"A6:G{6 + len(meals)}"
    ws.sheet_view.showGridLines = False


def style_header(ws, cols: int) -> None:
    for cell in ws[1][:cols]:
        cell.font = Font(bold=True, color=WHITE)
        cell.fill = fill(GREEN)


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
    copy_used(src["LISTES COURSES 2"], courses, 4)
    jump(courses["F1"], "Dashboard", "A1", "← Dashboard")
    courses["F1"].font = Font(bold=True, color="1155CC", underline="single")
    courses.auto_filter.ref = f"A1:D{max(courses.max_row, 2)}"
    courses.freeze_panes = "A3"
    for i, w in enumerate([12, 40, 22, 50, 8, 18], 1):
        courses.column_dimensions[get_column_letter(i)].width = w
    style_header(courses, 4)

    batch = wb.create_sheet("Batch")
    copy_used(src["BATCH"], batch, 4)
    jump(batch["F1"], "Dashboard", "A1", "← Dashboard")
    batch["F1"].font = Font(bold=True, color="1155CC", underline="single")
    batch.auto_filter.ref = f"A1:D{max(batch.max_row, 2)}"
    batch.freeze_panes = "A3"
    for i, w in enumerate([12, 55, 16, 22, 8, 18], 1):
        batch.column_dimensions[get_column_letter(i)].width = w
    style_header(batch, 4)

    src.close()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT)

    check = load_workbook(OUT)
    if check.sheetnames != ["Dashboard", "Fiche_Recette", "Courses", "Batch"]:
        raise SystemExit(f"onglets interdits: {check.sheetnames}")
    b7 = check["Dashboard"]["B7"]
    if "Poulet paprika" not in str(b7.value or ""):
        raise SystemExit(f"B7 vide ou faux: {b7.value!r}")
    if not b7.hyperlink or "Fiche_Recette" not in str(b7.hyperlink.location or ""):
        raise SystemExit(f"B7 sans lien interne: {b7.hyperlink}")
    if str(b7.value).startswith("="):
        raise SystemExit(f"B7 est encore une formule: {b7.value!r}")
    check.close()

    with zipfile.ZipFile(OUT) as z:
        xml = z.read("xl/worksheets/sheet1.xml")
        n_native = xml.count(b"<hyperlink")
        n_formula = xml.count(b"HYPERLINK")
    if n_native < 700:
        raise SystemExit(f"pas assez de liens natifs: {n_native}")
    if n_formula:
        raise SystemExit(f"des formules HYPERLINK restent: {n_formula}")

    print("ok", OUT, OUT.stat().st_size, n_native, "liens natifs", b7.value)


if __name__ == "__main__":
    main()
