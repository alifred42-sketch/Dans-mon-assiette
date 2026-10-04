#!/usr/bin/env python3
"""Carnet cliquable sans script : fiches sur le Dashboard, liens Excel internal:."""

from __future__ import annotations

import re
import zipfile
from pathlib import Path

import xlsxwriter
from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
ORIG = Path("/tmp/orig/sheet.xlsx")
OUT = ROOT / "public" / "Dans-mon-assiette.xlsx"

DAYS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"]
LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
ILLEGAL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
GREEN, CREAM, WHITE = "#4A5A3A", "#F6F1E6", "#FFFFFF"


def clean(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(int(value) if float(value).is_integer() else value)
    text = str(value).replace("\r\n", "\n")
    if text.startswith("=IMAGE(") or "__xludf.DUMMYFUNCTION" in text:
        return ""
    return ILLEGAL.sub("", text)[:32000]


def load_meals() -> list[dict]:
    src = load_workbook(ORIG, data_only=False)
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
                "name": plat,
                "ings": clean(app.cell(r, 8).value),
            }
        )
    src.close()
    if len(meals) < 700:
        raise SystemExit(f"plats manquants: {len(meals)}")
    return meals


def compact_rows(sheet_name: str, cols: int) -> list[list[str]]:
    src = load_workbook(ORIG, data_only=False)
    ws = src[sheet_name]
    out: list[list[str]] = []
    for r in range(1, (ws.max_row or 0) + 1):
        values = [clean(ws.cell(r, c).value) for c in range(1, cols + 1)]
        if out and not any(values):
            continue
        out.append(values)
    src.close()
    return out


def write_internal(ws, row: int, col: int, target: str, text: str, fmt) -> None:
    ws.write_url(row, col, f"internal:{target}", fmt, text, text)


def main() -> None:
    meals = load_meals()
    menu_start = 5  # 1-based
    fiche_header = menu_start + 52 * 5 + 2
    fiche_start = fiche_header + 2
    for i, m in enumerate(meals):
        m["week_row"] = menu_start + (m["week"] - 1) * 5
        m["fiche_row"] = fiche_start + i

    wb = xlsxwriter.Workbook(OUT.as_posix())
    title = wb.add_format({"bold": True, "font_size": 20, "font_color": GREEN, "bg_color": CREAM, "valign": "vcenter"})
    hint = wb.add_format({"italic": True, "font_color": "#666666"})
    week_fmt = wb.add_format({"bold": True, "font_size": 16, "font_color": GREEN, "bg_color": CREAM})
    day_fmt = wb.add_format({"bold": True, "font_color": WHITE, "bg_color": GREEN, "align": "center"})
    meal_lbl = wb.add_format({"bold": True, "font_size": 12, "font_color": GREEN})
    card = wb.add_format(
        {
            "bold": True,
            "font_size": 10,
            "font_color": "#1155CC",
            "underline": True,
            "align": "center",
            "valign": "vcenter",
            "text_wrap": True,
            "bg_color": "#FFFCF6",
            "border": 1,
            "border_color": "#D9D3C5",
        }
    )
    nav = wb.add_format({"bold": True, "font_color": WHITE, "bg_color": GREEN, "underline": True, "align": "center"})
    head = wb.add_format({"bold": True, "font_color": WHITE, "bg_color": GREEN})
    plat_fmt = wb.add_format({"bold": True, "font_size": 12, "font_color": GREEN, "text_wrap": True})
    wrap = wb.add_format({"text_wrap": True, "valign": "top"})
    back = wb.add_format({"bold": True, "font_color": "#1155CC", "underline": True})

    dash = wb.add_worksheet("Dashboard")
    dash.set_tab_color(GREEN)
    dash.freeze_panes(4, 0)
    dash.hide_gridlines(2)
    for i, w in enumerate([22, 28, 36, 14, 10, 44, 44, 18]):
        dash.set_column(i, i, w)
    dash.set_row(0, 36)
    dash.merge_range(0, 0, 0, 7, "🍽️ MON CARNET — MA CUISINE AU QUOTIDIEN", title)
    write_internal(dash, 1, 0, f"Dashboard!A{fiche_header}", "↓ Toutes les fiches", nav)
    write_internal(dash, 1, 2, "Courses!A1", "🛒 Mes courses", nav)
    write_internal(dash, 1, 4, "Batch!A1", "🍳 Mon batch", nav)
    dash.merge_range(2, 0, 2, 7, "Clique un plat → sa fiche (plus bas sur cette feuille).", hint)

    by_week: dict[int, list[dict]] = {}
    for m in meals:
        by_week.setdefault(m["week"], []).append(m)

    for week in range(1, 53):
        row = menu_start + (week - 1) * 5  # 1-based
        r0 = row - 1
        lookup = {(m["day"], m["meal"]): m for m in by_week.get(week, [])}
        dash.merge_range(r0, 0, r0, 7, f"📅 SEMAINE {week}", week_fmt)
        for i, label in enumerate(LABELS):
            dash.write(r0 + 1, i + 1, label, day_fmt)
        for meal_name, label, offset in (("Midi", "☀️ MIDI", 2), ("Soir", "🌙 SOIR", 3)):
            dash.write(r0 + offset, 0, label, meal_lbl)
            dash.set_row(r0 + offset, 48)
            for d, day in enumerate(DAYS):
                m = lookup.get((day, meal_name))
                if not m:
                    dash.write(r0 + offset, d + 1, "", card)
                    continue
                write_internal(dash, r0 + offset, d + 1, f"Dashboard!C{m['fiche_row']}", m["name"], card)

    h = fiche_header - 1
    dash.merge_range(h, 0, h, 6, "FICHES — un plat = une ligne", week_fmt)
    for i, name in enumerate(["RETOUR", "SEMAINE", "PLAT", "JOUR", "REPAS", "INGRÉDIENTS", "PRÉPARATION"]):
        dash.write(h + 1, i, name, head)
    for m in meals:
        r = m["fiche_row"] - 1
        dash.set_row(r, 56)
        write_internal(dash, r, 0, f"Dashboard!A{m['week_row']}", f"← Semaine {m['week']}", back)
        dash.write(r, 1, m["week"], wrap)
        dash.write(r, 2, m["name"], plat_fmt)
        dash.write(r, 3, m["day"], wrap)
        dash.write(r, 4, m["meal"], wrap)
        dash.write(r, 5, m["ings"] or "Adapter les quantités.", wrap)
        dash.write(r, 6, "1. Préparer les ingrédients.\n2. Cuire selon le plat.\n3. Assaisonner et servir.", wrap)

    fiches = wb.add_worksheet("Fiche_Recette")
    fiches.set_tab_color(GREEN)
    fiches.freeze_panes(6, 0)
    for i, w in enumerate([16, 12, 44, 14, 10, 44, 44]):
        fiches.set_column(i, i, w)
    fiches.merge_range(0, 0, 0, 6, "FICHES RECETTES", title)
    write_internal(fiches, 2, 0, "Dashboard!A5", "← Retour au planning", back)
    for i, name in enumerate(["RETOUR", "SEMAINE", "PLAT", "JOUR", "REPAS", "INGRÉDIENTS", "PRÉPARATION"]):
        fiches.write(5, i, name, head)
    for i, m in enumerate(meals):
        r = 6 + i
        write_internal(fiches, r, 0, f"Dashboard!A{m['week_row']}", f"← Semaine {m['week']}", back)
        fiches.write(r, 1, m["week"], wrap)
        write_internal(fiches, r, 2, f"Dashboard!C{m['fiche_row']}", m["name"], plat_fmt)
        fiches.write(r, 3, m["day"], wrap)
        fiches.write(r, 4, m["meal"], wrap)
        fiches.write(r, 5, m["ings"] or "Adapter les quantités.", wrap)
        fiches.write(r, 6, "1. Préparer les ingrédients.\n2. Cuire selon le plat.\n3. Assaisonner et servir.", wrap)

    for sheet_name, source, widths in (
        ("Courses", "LISTES COURSES 2", [12, 40, 22, 50]),
        ("Batch", "BATCH", [12, 55, 16, 22]),
    ):
        rows = compact_rows(source, 4)
        ws = wb.add_worksheet(sheet_name)
        ws.freeze_panes(2, 0)
        for i, w in enumerate(widths + [8, 16]):
            ws.set_column(i, i, w)
        for r, row in enumerate(rows):
            for c, val in enumerate(row):
                ws.write(r, c, val, head if r == 0 else wrap)
        write_internal(ws, 0, 5, "Dashboard!A1", "← Dashboard", back)

    wb.close()

    with zipfile.ZipFile(OUT) as z:
        xml = z.read("xl/worksheets/sheet1.xml")
        n = xml.count(b"hyperlink")
        if n < 700:
            raise SystemExit(f"pas assez de liens: {n}")
        if b"HYPERLINK" in xml:
            raise SystemExit("formules HYPERLINK interdites")
        if b"internal:Dashboard!" not in xml and b"Dashboard!C" not in xml:
            # relationships store the target
            rels = z.read("xl/worksheets/_rels/sheet1.xml.rels")
            if b"internal:Dashboard" not in rels and b"Dashboard!" not in rels:
                raise SystemExit("liens internal absents")
    print("ok", OUT, OUT.stat().st_size, "meals", len(meals), "fiche_start", fiche_start)


if __name__ == "__main__":
    main()
