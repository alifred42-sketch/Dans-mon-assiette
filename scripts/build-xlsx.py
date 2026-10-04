#!/usr/bin/env python3
"""3 onglets seulement. Dashboard : chaque plat = lien vers sa fiche (même feuille)."""

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


def q(text: str) -> str:
    return str(text).replace('"', '""')


def link(cell_a1: str, label: str) -> str:
    return f'=HYPERLINK("#gid=0&range={cell_a1}","{q(label)}")'


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
    fiche_header = menu_start + 52 * 5 + 2
    fiche_start = fiche_header + 2
    for i, m in enumerate(meals):
        m["week_row"] = menu_start + (m["week"] - 1) * 5
        m["fiche_row"] = fiche_start + i

    ws.merge_cells("A1:H1")
    ws["A1"] = "MON CARNET — 52 SEMAINES"
    ws["A1"].font = Font(name="Calibri", bold=True, size=22, color=GREEN)
    ws["A1"].fill = fill(CREAM)
    ws.row_dimensions[1].height = 36

    ws["A2"] = link(f"A{fiche_header}", "↓ Toutes les fiches")
    ws["C2"] = link("A5", "↑ Semaine 1")
    for coord in ("A2", "C2"):
        ws[coord].font = Font(bold=True, size=12, color=WHITE, underline="single")
        ws[coord].fill = fill(GREEN)
        ws[coord].alignment = Alignment(horizontal="center")

    ws.merge_cells("A3:H3")
    ws["A3"] = "Clique un plat du menu → sa fiche s’ouvre plus bas. ← Semaine remonte."
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
                    cell.value = link(f"C{m['fiche_row']}", m["name"])
                cell.font = Font(bold=True, size=10, color=GREEN, underline="single")
                cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
                cell.fill = fill(CARD)
                cell.border = thin()
            ws.row_dimensions[row].height = 52
            row += 1
        row += 1

    ws.merge_cells(start_row=fiche_header, start_column=1, end_row=fiche_header, end_column=7)
    h = ws.cell(fiche_header, 1, "FICHES — un plat = une ligne")
    h.font = Font(bold=True, size=16, color=GREEN)
    h.fill = fill(CREAM)
    for i, name in enumerate(
        ["RETOUR", "SEMAINE", "PLAT", "JOUR", "REPAS", "INGRÉDIENTS", "PRÉPARATION"], 1
    ):
        cell = ws.cell(fiche_header + 1, i, name)
        cell.font = Font(bold=True, color=WHITE)
        cell.fill = fill(GREEN)

    for m in meals:
        r = m["fiche_row"]
        ws.cell(r, 1, link(f"A{m['week_row']}", f"← Semaine {m['week']}"))
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
        ws.row_dimensions[r].height = 60

    ws.freeze_panes = "A5"
    ws.sheet_view.showGridLines = False
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1


def style_header(ws, cols: int) -> None:
    for cell in ws[1][:cols]:
        cell.font = Font(bold=True, color=WHITE)
        cell.fill = fill(GREEN)


def main() -> None:
    src = load_workbook(ORIG, data_only=False)
    meals = load_meals(src)
    if len(meals) < 700:
        raise SystemExit(f"plats manquants: {len(meals)}")

    wb = Workbook()
    dash = wb.active
    dash.title = "Dashboard"
    build_dashboard(dash, meals)

    courses = wb.create_sheet("Courses")
    copy_used(src["LISTES COURSES 2"], courses, 4)
    courses["F1"] = link("A1", "← Dashboard")
    courses["F1"].font = Font(bold=True, color=GREEN, underline="single")
    courses.auto_filter.ref = f"A1:D{max(courses.max_row, 2)}"
    courses.freeze_panes = "A3"
    for i, w in enumerate([12, 40, 22, 50, 8, 18], 1):
        courses.column_dimensions[get_column_letter(i)].width = w
    style_header(courses, 4)

    batch = wb.create_sheet("Batch")
    copy_used(src["BATCH"], batch, 4)
    batch["F1"] = link("A1", "← Dashboard")
    batch["F1"].font = Font(bold=True, color=GREEN, underline="single")
    batch.auto_filter.ref = f"A1:D{max(batch.max_row, 2)}"
    batch.freeze_panes = "A3"
    for i, w in enumerate([12, 55, 16, 22, 8, 18], 1):
        batch.column_dimensions[get_column_letter(i)].width = w
    style_header(batch, 4)

    src.close()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT)

    check = load_workbook(OUT)
    if check.sheetnames != ["Dashboard", "Courses", "Batch"]:
        raise SystemExit(f"onglets interdits: {check.sheetnames}")
    b7 = str(check["Dashboard"]["B7"].value or "")
    if "HYPERLINK" not in b7 or "Poulet paprika" not in b7 or "#gid=0" not in b7:
        raise SystemExit(f"B7 pas un lien fiche: {b7!r}")
    print("ok", OUT, OUT.stat().st_size, check.sheetnames, b7[:140])
    check.close()


if __name__ == "__main__":
    main()
