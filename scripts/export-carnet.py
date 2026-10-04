#!/usr/bin/env python3
"""Export planning + fiches. Lien seulement si le titre est identique."""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

from openpyxl import load_workbook

ORIG = Path("/tmp/orig/sheet.xlsx")
OUT = Path(__file__).resolve().parents[1] / "data" / "carnet.json"
PLACEHOLDER = re.compile(r"^ingr[ée]dients à prévoir", re.I)


def text(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return str(int(value) if float(value).is_integer() else value)
    s = str(value).replace("\r\n", "\n").strip()
    if s.startswith("=IMAGE(") or "__xludf.DUMMYFUNCTION" in s:
        return ""
    return s


def lines(value: object) -> list[str]:
    raw = text(value)
    if not raw:
        return []
    return [ln.strip() for ln in raw.split("\n") if ln.strip()]


def recipe_id(name: str) -> str:
    digest = hashlib.sha1(name.encode("utf-8")).hexdigest()[:10]
    return f"r-{digest}"


def main() -> None:
    wb = load_workbook(ORIG, data_only=False)
    fiche = wb["Fiche_Recette"]
    recipes: dict[str, dict] = {}
    for r in range(2, fiche.max_row + 1):
        name = text(fiche.cell(r, 3).value)
        if not name or name.startswith("⬅") or name.upper().startswith("RETOUR"):
            continue
        ings = lines(fiche.cell(r, 6).value)
        steps = lines(fiche.cell(r, 7).value)
        if name not in recipes:
            recipes[name] = {
                "id": recipe_id(name),
                "name": name,
                "ingredients": ings,
                "steps": steps,
            }
        else:
            # keep the first fiche that has a real ingredient list
            if recipes[name]["ingredients"] and PLACEHOLDER.match(recipes[name]["ingredients"][0] if recipes[name]["ingredients"] else ""):
                if ings and not PLACEHOLDER.match(ings[0]):
                    recipes[name]["ingredients"] = ings
                    if steps:
                        recipes[name]["steps"] = steps
            elif not recipes[name]["ingredients"] and ings:
                recipes[name]["ingredients"] = ings
                if steps:
                    recipes[name]["steps"] = steps

    app = wb["_APP_DATA"]
    # Fill ingredients from _APP_DATA only when the plat title is exactly the same
    # and the fiche still has a placeholder / empty list.
    for r in range(2, app.max_row + 1):
        name = text(app.cell(r, 4).value)
        if name not in recipes:
            continue
        ings = lines(app.cell(r, 8).value)
        if not ings:
            continue
        current = recipes[name]["ingredients"]
        empty_or_placeholder = (not current) or PLACEHOLDER.match(current[0])
        if empty_or_placeholder and not PLACEHOLDER.match(ings[0]):
            recipes[name]["ingredients"] = ings

    plan = []
    for r in range(2, app.max_row + 1):
        week = app.cell(r, 1).value
        day = text(app.cell(r, 2).value)
        meal = text(app.cell(r, 3).value)
        name = text(app.cell(r, 4).value)
        if not name or week is None:
            continue
        rec = recipes.get(name)
        plan.append(
            {
                "week": int(week),
                "day": day,
                "meal": meal,
                "name": name,
                "recipeId": rec["id"] if rec else None,
            }
        )

    wb.close()
    linked = sum(1 for p in plan if p["recipeId"])
    payload = {
        "title": "Dans mon assiette",
        "subtitle": "Les 52 semaines d’Aline. Un plat cliquable seulement s’il a sa vraie fiche.",
        "recipes": sorted(recipes.values(), key=lambda r: r["name"]),
        "plan": plan,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print("recipes", len(payload["recipes"]), "plan", len(plan), "linked", linked, "unlinked", len(plan) - linked)
    assert linked == len(plan), "a plan title did not match a fiche exactly"
    assert len(payload["recipes"]) >= 600


if __name__ == "__main__":
    main()
