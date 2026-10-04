#!/usr/bin/env python3
"""Génère un xlsx simple (valeurs seules, sans liens externes) + un zip de CSV."""

from __future__ import annotations

import csv
import json
import re
import zipfile
from io import StringIO
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.worksheet import Worksheet

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "data" / "carnet.json").read_text())
OUT_XLSX = ROOT / "public" / "Dans-mon-assiette.xlsx"
OUT_CSV_ZIP = ROOT / "public" / "Dans-mon-assiette-csv.zip"

DAY = {
    "LUNDI": "Lundi",
    "MARDI": "Mardi",
    "MERCREDI": "Mercredi",
    "JEUDI": "Jeudi",
    "VENDREDI": "Vendredi",
    "SAMEDI": "Samedi",
    "DIMANCHE": "Dimanche",
}
AISLES = {a["id"]: a["label"] for a in DATA["aisles"]}
RECIPES = {r["id"]: r for r in DATA["recipes"]}

ILLEGAL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


def clean(value: object) -> str:
    text = "" if value is None else str(value)
    text = text.replace("🔗", "").replace("\r\n", "\n")
    return ILLEGAL.sub("", text)[:32000]


def style_header(ws: Worksheet, cols: int) -> None:
    fill = PatternFill("solid", fgColor="4A5A3A")
    font = Font(color="FFFFFF", bold=True)
    for col in range(1, cols + 1):
        cell = ws.cell(1, col)
        cell.fill = fill
        cell.font = font
        cell.alignment = Alignment(vertical="center")
    ws.auto_filter.ref = f"A1:{get_column_letter(cols)}{ws.max_row}"
    ws.freeze_panes = "A2"
    ws.sheet_view.showGridLines = True


def autosize(ws: Worksheet, widths: list[int]) -> None:
    for i, width in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = width


def shopping(week: int = 1) -> list[dict]:
    bag: dict[str, dict] = {}
    for slot in DATA["plan"]:
        if slot["week"] != week:
            continue
        recipe = RECIPES.get(slot.get("recipeId") or "")
        if not recipe:
            continue
        for ing in recipe["ingredients"]:
            key = ing.get("key") or ""
            if len(key) < 2:
                continue
            label = clean(ing.get("raw"))
            cur = bag.get(key)
            if cur:
                if recipe["name"] not in cur["recipes"]:
                    cur["recipes"].append(recipe["name"])
            else:
                bag[key] = {
                    "aisle_id": ing.get("aisle") or "",
                    "aisle": AISLES.get(ing.get("aisle"), ing.get("aisle") or ""),
                    "label": label,
                    "recipes": [recipe["name"]],
                }
    order = [a["id"] for a in DATA["aisles"]]
    rows = list(bag.values())
    rows.sort(
        key=lambda r: (
            order.index(r["aisle_id"]) if r["aisle_id"] in order else 99,
            r["label"].lower(),
        )
    )
    return rows


def batch(week: int = 1) -> list[tuple[str, str, str]]:
    seen: set[str] = set()
    items: list[tuple[str, str, str]] = []
    for slot in DATA["plan"]:
        if slot["week"] != week:
            continue
        recipe = RECIPES.get(slot.get("recipeId") or "")
        if not recipe:
            continue
        tags = recipe.get("tags") or []
        name = recipe["name"]
        batchy = (
            recipe.get("robot")
            or "batch" in tags
            or "soupe" in tags
            or re.search(r"sauce|bolognaise|chili|velouté|veloute|curry|dahl", name, re.I)
        )
        if not batchy:
            continue
        when = f"{DAY.get(slot['day'], slot['day'])} {slot['meal']}"
        if recipe["id"] in seen:
            for i, (n, w, robot) in enumerate(items):
                if n == name:
                    items[i] = (n, f"{w} · {when}", robot)
                    break
            continue
        seen.add(recipe["id"])
        items.append((name, when, "oui" if recipe.get("robot") else ""))
    return items


def write_xlsx(path: Path) -> None:
    wb = Workbook()

    accueil = wb.active
    accueil.title = "Accueil"
    accueil["A1"] = "Dans mon assiette"
    accueil["A1"].font = Font(bold=True, size=16, color="4A5A3A")
    accueil["A3"] = "Classeur simple : 5 onglets, valeurs seules (s’ouvre dans Excel et Google Sheets)."
    accueil["A4"] = "Les 45 feuilles d’audit ChatGPT ont été retirées."
    accueil["A6"] = "Onglets"
    accueil["A7"] = "Planning — 52 semaines, midi et soir"
    accueil["A8"] = "Recettes — 705 fiches (id, nom, ingrédients, étapes)"
    accueil["A9"] = "Courses — semaine 1, doublons fusionnés"
    accueil["A10"] = "Batch — ce qui se prépare à l’avance, semaine 1"
    accueil["A12"] = "Petit-déjeuner : " + " · ".join(DATA["breakfast"]["items"])
    autosize(accueil, [90])

    plan = wb.create_sheet("Planning")
    plan.append(["Semaine", "Jour", "Repas", "Plat", "Id recette"])
    for slot in DATA["plan"]:
        plan.append(
            [
                slot["week"],
                DAY.get(slot["day"], slot["day"]),
                slot["meal"],
                clean(slot.get("label") or RECIPES.get(slot.get("recipeId") or "", {}).get("name", "")),
                slot.get("recipeId") or "",
            ]
        )
    style_header(plan, 5)
    autosize(plan, [12, 14, 10, 55, 14])

    rec = wb.create_sheet("Recettes")
    rec.append(
        [
            "Id",
            "Nom",
            "Cuisine",
            "Tags",
            "Robot",
            "Minutes",
            "Personnes",
            "Ingredients",
            "Etapes",
        ]
    )
    for recipe in DATA["recipes"]:
        rec.append(
            [
                recipe["id"],
                clean(recipe["name"]),
                recipe.get("cuisine") or "",
                ", ".join(recipe.get("tags") or []),
                "oui" if recipe.get("robot") else "",
                recipe.get("timeMin") or "",
                recipe.get("servings") or "",
                clean(" | ".join(i.get("raw", "") for i in recipe.get("ingredients") or [])),
                clean(" | ".join(recipe.get("steps") or [])),
            ]
        )
    style_header(rec, 9)
    autosize(rec, [10, 45, 14, 24, 10, 10, 12, 60, 60])

    courses = wb.create_sheet("Courses")
    courses.append(["Rayon", "A acheter", "Pour quels plats"])
    for row in shopping(1):
        courses.append([row["aisle"], row["label"], " · ".join(row["recipes"][:4])])
    style_header(courses, 3)
    autosize(courses, [22, 50, 60])

    batch_ws = wb.create_sheet("Batch")
    batch_ws.append(["Plat", "Quand (semaine 1)", "Mr Cuisine"])
    for name, when, robot in batch(1):
        batch_ws.append([clean(name), when, robot])
    style_header(batch_ws, 3)
    autosize(batch_ws, [50, 40, 14])

    path.parent.mkdir(parents=True, exist_ok=True)
    wb.save(path)


def write_csv_zip(path: Path) -> None:
    files = {
        "Planning.csv": [
            ["Semaine", "Jour", "Repas", "Plat", "Id recette"],
            *[
                [
                    s["week"],
                    DAY.get(s["day"], s["day"]),
                    s["meal"],
                    clean(s.get("label") or ""),
                    s.get("recipeId") or "",
                ]
                for s in DATA["plan"]
            ],
        ],
        "Recettes.csv": [
            ["Id", "Nom", "Cuisine", "Tags", "Robot", "Minutes", "Personnes", "Ingredients"],
            *[
                [
                    r["id"],
                    clean(r["name"]),
                    r.get("cuisine") or "",
                    ", ".join(r.get("tags") or []),
                    "oui" if r.get("robot") else "",
                    r.get("timeMin") or "",
                    r.get("servings") or "",
                    clean(" | ".join(i.get("raw", "") for i in r.get("ingredients") or [])),
                ]
                for r in DATA["recipes"]
            ],
        ],
        "Courses.csv": [
            ["Rayon", "A acheter", "Pour quels plats"],
            *[[row["aisle"], row["label"], " · ".join(row["recipes"][:4])] for row in shopping(1)],
        ],
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name, rows in files.items():
            buf = StringIO()
            writer = csv.writer(buf, lineterminator="\n")
            writer.writerows(rows)
            zf.writestr(name, buf.getvalue().encode("utf-8-sig"))


def assert_opens(path: Path) -> None:
    import zipfile as zf

    if not zf.is_zipfile(path):
        raise SystemExit(f"{path} n’est pas un zip/xlsx")
    with zf.ZipFile(path) as z:
        if z.testzip():
            raise SystemExit("xlsx corrompu")
        for name in z.namelist():
            if name.endswith(".rels"):
                data = z.read(name).decode("utf-8", "replace")
                if "hyperlink" in data and "TargetMode=\"External\"" in data:
                    raise SystemExit(f"liens externes restants dans {name}")
    from openpyxl import load_workbook

    wb = load_workbook(path, read_only=True, data_only=True)
    names = wb.sheetnames
    if names != ["Accueil", "Planning", "Recettes", "Courses", "Batch"]:
        raise SystemExit(f"onglets inattendus: {names}")
    print("xlsx ok", path, "sheets", names)


if __name__ == "__main__":
    write_xlsx(OUT_XLSX)
    write_csv_zip(OUT_CSV_ZIP)
    assert_opens(OUT_XLSX)
    print("csv zip", OUT_CSV_ZIP, OUT_CSV_ZIP.stat().st_size)
