#!/usr/bin/env python3
"""Fiches depuis 200 RECETTE + BDD. Lien planning seulement si le rattachement est sûr."""

from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from pathlib import Path

from openpyxl import load_workbook

ORIG = Path("/tmp/orig/sheet.xlsx")
OUT = Path(__file__).resolve().parents[1] / "data" / "carnet.json"

NUMED = re.compile(r"RECETTE\s+(\d+)\s+[—–-]\s+(.+)", re.I)
PLACEHOLDER = re.compile(r"^ingr[ée]dients à prévoir", re.I)
SKIP_TITLE = {
    "remplacements",
    "dessert conseillé",
    "pourquoi cette recette ?",
    "astuce",
    "astuce batch cooking",
    "version monsieur cuisine smart",
    "sauce associée",
    "présent dans",
    "utilisé dans",
}

SECTION = re.compile(
    r"^(🛒\s*)?ingr[ée]dients\b|^(👩‍🍳\s*)?pr[ée]paration\b|^🤖\s*(mr cuisine|monsieur cuisine|version)",
    re.I,
)
META = re.compile(
    r"^(🍽️\s*)?difficult[ée].*|temps de pr[ée]paration\s*:|temps de cuisson\s*:|"
    r"portions\s*:|⏱️\s*pr[ée]paration\s*:|🔥\s*cuisson\s*:|👥\s*pour|"
    r"🏷️\s*cat[ée]gorie|🍱\s*batch|❄️\s*cong[ée]lation",
    re.I,
)
CAT_HEADER = re.compile(
    r"^(🥩|🥒|🍚|🧀|🍞|🌿|🥣|🍋|🥛|🐟|🍗|🥗)\s+"
    r"(viande|l[ée]gumes|f[ée]culent|fromage|pain|épices|sauce|poisson|volaille|salade)\b",
    re.I,
)


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
    return [ln.strip() for ln in raw.split("\n") if ln.strip()]


def rid(*parts: str) -> str:
    key = "|".join(parts)
    return "r-" + hashlib.sha1(key.encode("utf-8")).hexdigest()[:10]


def strip_emoji(s: str) -> str:
    return "".join(ch for ch in s if unicodedata.category(ch) != "So" and ch not in "️‍").strip()


def fold(s: str) -> str:
    s = strip_emoji(s)
    s = NUMED.sub(r"\2", s)
    s = s.replace("&", " ").replace("+", " ").replace("—", " ").replace("–", " ")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = s.lower()
    s = re.sub(r"[^a-z0-9àâäéèêëïîôùûç\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def tokens(s: str) -> set[str]:
    stop = {
        "de",
        "des",
        "du",
        "la",
        "le",
        "les",
        "et",
        "au",
        "aux",
        "en",
        "a",
        "d",
        "l",
        "un",
        "une",
        "avec",
        "facon",
        "maison",
        "leger",
        "legere",
        "recette",
        "pour",
        "ou",
    }
    out = set()
    for w in fold(s).split():
        if len(w) <= 1 or w in stop:
            continue
        if w.endswith("s") and len(w) > 4:
            w = w[:-1]
        out.add(w)
    return out


def is_start(s: str, gap: int) -> bool:
    if not s or fold(s) in SKIP_TITLE:
        return False
    if NUMED.search(s):
        return True
    if gap < 2 or len(s) < 8:
        return False
    if META.match(s) or SECTION.match(s) or s.startswith(("Étape", "✔", "✅", "❌", "💡", "➡️", "🔗")):
        return False
    if s.startswith(("🔄", "🍎", "💪", "❤️", "🥣 Sauce", "🌿 Marinade", "🥣 sauce")):
        return False
    if fold(s).startswith("sauce ") or fold(s).startswith("marinade "):
        return False
    return bool(re.match(r"^[\W\d]*[\wÀ-ÿ]", s)) and not s.endswith(":")


def parse_meta(blob: str, rec: dict) -> None:
    for raw in blob.split("\n"):
        line = raw.strip()
        m = re.search(r"pr[ée]paration\s*:\s*(.+)$", line, re.I)
        if m and "timePrep" not in rec:
            rec["timePrep"] = m.group(1).strip()
        m = re.search(r"cuisson\s*:\s*(.+)$", line, re.I)
        if m and "timeCook" not in rec:
            rec["timeCook"] = m.group(1).strip()
        m = re.search(r"(portions?|pour)\s*:\s*(.+)$", line, re.I)
        if m and "servings" not in rec:
            rec["servings"] = m.group(2).strip()
        if re.search(r"portions\s*:\s*", line, re.I):
            rec["servings"] = re.sub(r"^.*portions\s*:\s*", "", line, flags=re.I).strip()


def finish_card(title: str, body: list[str], source: str) -> dict:
    ingredients: list[str] = []
    steps: list[str] = []
    robot: list[str] = []
    notes: list[str] = []
    section = "head"
    for line in body:
        if SECTION.match(line) and "ingr" in fold(line):
            section = "ings"
            continue
        if SECTION.match(line) and "pr" in fold(line)[:12]:
            section = "steps"
            continue
        if line.startswith("🤖") or fold(line).startswith("version monsieur") or fold(line).startswith("mr cuisine"):
            section = "robot"
            if not line.startswith("🤖"):
                continue
        if line.startswith("💡"):
            section = "notes"
            continue
        if line.startswith(("🔗", "📅 Semaine", "📅 Autres")):
            continue
        if section == "head":
            continue
        if section == "ings":
            if CAT_HEADER.match(line) or line in {"OU", "Ingrédients"}:
                continue
            ingredients.append(line)
        elif section == "steps":
            if line.startswith("Étape"):
                continue
            steps.append(re.sub(r"^\d+\.\s*", "", line))
        elif section == "robot":
            robot.append(line)
        else:
            notes.append(line)
    rec = {
        "id": rid("200", title),
        "name": title,
        "ingredients": ingredients,
        "steps": steps,
        "robot": robot,
        "notes": notes,
        "source": source,
    }
    parse_meta("\n".join(body), rec)
    return rec


def parse_200(ws) -> list[dict]:
    rows = [(r, text(ws.cell(r, 1).value)) for r in range(1, (ws.max_row or 0) + 1)]
    starts: list[int] = []
    empty = 99
    by_row = {r: s for r, s in rows}
    for r, s in rows:
        if not s:
            empty += 1
            continue
        if is_start(s, empty):
            ahead = " ".join(by_row.get(r + k, "") for k in range(1, 16))
            if NUMED.search(s) or any(
                mark in ahead
                for mark in ("🏷️ Catégorie", "Temps de préparation", "🍽️ Difficulté", "⏱️ Préparation")
            ):
                starts.append(r)
        empty = 0
    cards = []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else (ws.max_row or start) + 1
        title = by_row[start]
        body = [by_row[r] for r in range(start + 1, end) if by_row.get(r)]
        card = finish_card(title, body, "200 RECETTE")
        if card["ingredients"] or card["steps"]:
            cards.append(card)
    return cards


def parse_bdd(ws, source: str, prep_col: int) -> list[dict]:
    out = []
    for r in range(2, (ws.max_row or 0) + 1):
        name = text(ws.cell(r, 1).value)
        if not name:
            continue
        ings = lines(ws.cell(r, 3).value)
        steps = lines(ws.cell(r, prep_col).value)
        rec = {
            "id": rid(source, name),
            "name": name,
            "ingredients": ings,
            "steps": steps,
            "robot": [],
            "notes": [],
            "source": source,
        }
        if source == "BDD_Classique":
            rec["timePrep"] = text(ws.cell(r, 5).value)
            rec["timeCook"] = text(ws.cell(r, 6).value)
            rec["servings"] = text(ws.cell(r, 7).value)
        out.append(rec)
    return out


def index_recipes(recipes: list[dict]) -> dict[str, list[dict]]:
    idx: dict[str, list[dict]] = {}
    for rec in recipes:
        idx.setdefault(fold(rec["name"]), []).append(rec)
        m = NUMED.search(rec["name"])
        if m:
            idx.setdefault(fold(m.group(2)), []).append(rec)
    return idx


def pick_recipe(plan_name: str, nom_bdd: str, recipes: list[dict], idx: dict[str, list[dict]]) -> dict | None:
    # Exact title only (after cleaning). Nom BDD is ignored unless it equals the menu title.
    for key in (fold(plan_name),):
        if key and key in idx:
            return idx[key][0]
    plan_fold = fold(plan_name)
    contained = []
    if len(plan_fold) >= 12:
        for rec in recipes:
            other = fold(rec["name"])
            if plan_fold == other:
                return rec
            if plan_fold in other or (len(other) >= 12 and other in plan_fold):
                contained.append(rec)
        if len(contained) == 1:
            return contained[0]

    plan_tok = tokens(plan_name)
    if len(plan_tok) < 2:
        return None
    generic = {"poulet", "riz", "salade", "legumes", "soupe", "pates", "pate", "viande", "poisson", "sauce"}
    distinctive = plan_tok - generic
    scored: list[tuple[int, dict]] = []
    for rec in recipes:
        if rec["source"] != "200 RECETTE":
            continue
        title_tok = tokens(rec["name"])
        ing_tok = tokens(" ".join(rec["ingredients"][:40]))
        title_hit = len(plan_tok & title_tok)
        ing_hit = len(plan_tok & ing_tok)
        if distinctive and not (distinctive & title_tok):
            continue
        score = 3 * title_hit + 2 * ing_hit
        if title_hit >= 2 and score >= 10:
            scored.append((score, rec))
    scored.sort(key=lambda x: x[0], reverse=True)
    if not scored:
        return None
    if len(scored) == 1 or scored[0][0] >= scored[1][0] + 2:
        return scored[0][1]
    return None


def main() -> None:
    wb = load_workbook(ORIG, data_only=False)
    from_200 = parse_200(wb["200 RECETTE"])
    from_classique = parse_bdd(wb["BDD_Classique"], "BDD_Classique", 4)
    from_robot = parse_bdd(wb["BDD_MrCuisine"], "BDD_MrCuisine", 4)
    # Prefer 200 RECETTE text when the same numbered recipe exists in BDD
    merged: dict[str, dict] = {}
    for rec in from_classique + from_robot + from_200:
        key = fold(rec["name"])
        prev = merged.get(key)
        if not prev or (rec["source"] == "200 RECETTE" and len(rec["ingredients"]) >= len(prev["ingredients"])):
            merged[key] = rec
    recipes = list(merged.values())
    idx = index_recipes(recipes)

    app = wb["_APP_DATA"]
    plan = []
    used_ids: set[str] = set()
    for r in range(2, app.max_row + 1):
        week = app.cell(r, 1).value
        day = text(app.cell(r, 2).value)
        meal = text(app.cell(r, 3).value)
        name = text(app.cell(r, 4).value)
        if not name or week is None:
            continue
        nom_bdd = text(app.cell(r, 7).value)
        rec = pick_recipe(name, nom_bdd, recipes, idx)
        if rec:
            used_ids.add(rec["id"])
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

    payload = {
        "title": "Dans mon assiette",
        "subtitle": "Les 52 semaines d’Aline. Les fiches viennent de l’onglet 200 RECETTE.",
        "recipes": recipes,
        "plan": plan,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    linked = sum(1 for p in plan if p["recipeId"])
    print("200", len(from_200), "classique", len(from_classique), "robot", len(from_robot))
    print("recipes", len(recipes), "plan", len(plan), "linked", linked, "unlinked", len(plan) - linked)
    # week 1 sanity
    w1 = [p for p in plan if p["week"] == 1]
    by_id = {r["id"]: r for r in recipes}
    for p in w1:
        rec = by_id.get(p["recipeId"] or "")
        print(" ", p["day"], p["meal"], "→", (rec["name"][:60] if rec else "SANS FICHE"), "| menu:", p["name"][:50])


if __name__ == "__main__":
    main()
