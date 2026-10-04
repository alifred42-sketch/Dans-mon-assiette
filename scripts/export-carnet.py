#!/usr/bin/env python3
"""Exporte le carnet utile : 52 semaines, fiches, saisons, apéro, sauces…"""

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
BOX = re.compile(r"^[\s☐☑✅✔●·]+")
WEEK_RE = re.compile(r"SEMAINE\s+(\d+)", re.I)
DAY_RE = re.compile(r"\b(LUNDI|MARDI|MERCREDI|JEUDI|VENDREDI|SAMEDI|DIMANCHE)\b", re.I)
MEAL_RE = re.compile(r"^(midi|soir)\s*:?\s*$", re.I)
COMBO_RE = re.compile(
    r"\b(LUNDI|MARDI|MERCREDI|JEUDI|VENDREDI|SAMEDI|DIMANCHE)\s+(MIDI|SOIR)\b",
    re.I,
)
SECTION = re.compile(
    r"^(🛒\s*)?ingr[ée]dients\b|^(👩‍🍳\s*)?pr[ée]paration\b|^montage\b|"
    r"^🤖\s*(mr cuisine|monsieur cuisine|version|recherche)|"
    r"^assaisonnement\b|^[ée]pices\b|^avec\s*:|^variantes?\s*:",
    re.I,
)
META = re.compile(
    r"^(🍽️\s*)?difficult[ée].*|temps de pr[ée]paration\s*:|temps de cuisson\s*:|"
    r"portions?\s*:|⏱️\s*pr[ée]paration\s*:|🔥\s*cuisson\s*:|👥\s*pour|"
    r"🏷️\s*cat[ée]gorie|🍱\s*batch|❄️\s*cong[ée]lation|^⏱️\s*temps",
    re.I,
)
CAT_HEADER = re.compile(
    r"^(🥩|🥒|🍚|🧀|🍞|🌿|🥣|🍋|🥛|🐟|🍗|🥗)\s+"
    r"(viande|l[ée]gumes|f[ée]culent|fromage|pain|épices|sauce|poisson|volaille|salade)\b",
    re.I,
)
COLLECT_HEAD = re.compile(
    r"(N[°º]\s*\d+|RECETTE\s+\d+|EXPRESS\s+\d+|BONUS(\s+RECETTE)?\s*\d+|"
    r"VERRINE\s+N|REPAS\s+N|MENU\s+N|PR[ÉE]PARATION\s+N|"
    r"RECETTE\s+(SAUCE|AUTOMNE|HIVER|PRINTEMPS|[ÉE]T[ÉE])|"
    r"^\W*\d+\s+[—–-]\s+\w)",
    re.I,
)
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
    "objectif",
    "l idee",
    "toujours",
}

GENERIC = {
    "de", "des", "du", "la", "le", "les", "et", "au", "aux", "en", "a", "d", "l",
    "un", "une", "avec", "facon", "maison", "leger", "legere", "recette", "pour",
    "ou", "sauce", "plus", "tartine", "complete", "repas", "leger",
}
PROTEINS = {
    "poulet", "cabillaud", "saumon", "thon", "boeuf", "veau", "dinde", "crevette",
    "crevettes", "maquereau", "steak", "veloute", "chili", "risotto", "soupe",
    "omelette", "wrap", "poisson", "hache", "boulette", "boulettes", "escalope",
}
DISH = {
    "omelette", "wrap", "risotto", "veloute", "chili", "soupe", "muffin", "gratin",
    "lasagne", "lasagnes", "pizza", "burger", "tartine", "salade", "steak",
    "bolognaise", "bourguignon", "frittata",
}

LIBRARY = {"200 RECETTE", "BDD_Classique", "BDD_MrCuisine"}

COLLECTIONS = [
    ("sauces", "Sauces", "Toutes les sauces du carnet.", ["SAUCES"]),
    ("marinades", "Marinades", "Pour le poulet, le poisson, le batch.", ["MARINADES"]),
    ("epices", "Épices", "Les mélanges déjà notés dans le fichier.", ["Epices"]),
    ("express", "Express", "Quand il faut aller vite.", ["EXPRESS 15 MIN", "Express"]),
    ("ete", "Été", "Frais, sans allumer le four.", ["ETE", " ETE 2"]),
    ("automne", "Automne", "Plats réconfortants de saison.", ["AUTOMNE"]),
    ("hiver", "Hiver", "Soupes et plats chauds.", ["HIVER"]),
    ("printemps", "Printemps", "Plus léger, légumes nouveaux.", ["PRINTEMPS"]),
    ("apero", "Apéro", "Verrines et amuse-bouches.", ["APERO VERRINES AB"]),
    ("fatiguee", "Je suis fatiguée", "En rentrant du travail.", ["JE SUIS FATIGUEE"]),
    ("invites", "Recevoir", "Quand il y a du monde.", ["RECEVOIR DES INVITES"]),
    ("bonus", "Bonus", "En plus du planning des 52 semaines.", ["BONUS", "Bonus recettes"]),
    ("mrcuisine", "Mr Cuisine", "Ce qui se fait au robot.", ["MR CUISINE", "MR CUISINE 2", "MR CUISINE 3"]),
]


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
    out = set()
    for w in fold(s).split():
        if len(w) <= 1 or w in GENERIC:
            continue
        if w.endswith("s") and len(w) > 4:
            w = w[:-1]
        out.add(w)
    return out


def col_a(ws) -> list[tuple[int, str]]:
    return [(r, text(ws.cell(r, 1).value)) for r in range(1, (ws.max_row or 0) + 1)]


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
        m = re.search(r"temps\s*:\s*(.+)$", line, re.I)
        if m and "timePrep" not in rec:
            rec["timePrep"] = m.group(1).strip()


INSTR = re.compile(
    r"^(\d+\.\s*|➡️\s*)?(découpe|cuisson|mixage|faire |ajouter|m[ée]langer|cuire |"
    r"assembler|garnir|rouler|laisser |couper |servir |pr[ée]parer )",
    re.I,
)
WEEK_PREP = re.compile(
    r"pr[ée]paration du dimanche|^[àa] pr[ée]parer|batch cooking|⭐\s*pr[ée]paration",
    re.I,
)
JUNK = re.compile(
    r"liste courses|à imprimer|onglet —|annexe —|retour au dashboard|hyperlink",
    re.I,
)
CHATTY = re.compile(
    r"^(encore une recette|un bon plat|un plat|parfaite? pour|je sais que|toujours notre format)",
    re.I,
)


def is_junk(line: str) -> bool:
    if not line:
        return True
    if JUNK.search(line) or line.startswith("☐"):
        return True
    f = fold(line)
    return f.startswith("liste ") or "a imprimer" in f


def is_robot_program(line: str) -> bool:
    t = line.strip()
    if not t or is_junk(t):
        return False
    if t.startswith(("☐", "🛒", "📅")):
        return False
    if t.startswith('"') or t.startswith("«") or t.endswith('"'):
        return True
    if t.startswith("➡️") and INSTR.search(t):
        return True
    return False


def is_real_step(line: str) -> bool:
    if not line or is_junk(line) or line.startswith("☐"):
        return False
    if line.startswith("Au robot :"):
        return is_robot_program(line.replace("Au robot :", "", 1))
    if re.match(r"^\d+\.\s+", line):
        return True
    if INSTR.search(line):
        return True
    return len(line) >= 28 and not line.startswith(("☐", "🛒", "📅", "🍞", "🧀"))


def split_body(body: list[str]) -> tuple[list[str], list[str], list[str], list[str]]:
    ingredients: list[str] = []
    steps: list[str] = []
    robot: list[str] = []
    notes: list[str] = []
    section = "ings"
    for line in body:
        if is_junk(line):
            break
        f = fold(line)
        if PLACEHOLDER.match(line) or CHATTY.search(line):
            continue
        if f.startswith("ingredient") or f == "ingr" or f.startswith("ingr dients"):
            section = "ings"
            continue
        if f.startswith("preparation") or f.startswith("montage") or f.startswith("etape"):
            section = "steps"
            continue
        if line.startswith("🤖") or f.startswith("mr cuisine") or f.startswith("recherche robot"):
            section = "robot"
            continue
        if line.startswith("💡") or f.startswith("astuce") or f.startswith("variante"):
            section = "notes"
            if f in {"astuce", "variante", "variantes"}:
                continue
        if line.startswith(("🔗", "📅 Semaine", "📅 Autres", "📅 SEMAINE")):
            continue
        if CAT_HEADER.match(line) or f in {"ou", "ingredients", "epices", "avec"}:
            continue
        if META.match(line):
            continue
        if re.match(r"^\d+\.\s+", line) or (line.startswith("➡️") and INSTR.search(line)):
            section = "steps"
        if section == "ings":
            if INSTR.search(line) and not line.startswith(("🥣", "🌿")):
                steps.append(re.sub(r"^(\d+\.\s*|➡️\s*)", "", line))
            else:
                ingredients.append(line)
        elif section == "steps":
            if line.startswith("Étape") or is_junk(line) or line.startswith("☐"):
                continue
            steps.append(re.sub(r"^\d+\.\s*", "", line))
        elif section == "robot":
            if is_robot_program(line):
                robot.append(line.strip().strip('"«»'))
        else:
            notes.append(line)
    return ingredients, [s for s in steps if is_real_step(s)], robot, notes


def normalize_recipe(rec: dict) -> dict:
    clean_ings: list[str] = []
    for line in rec.get("ingredients") or []:
        if not line or is_junk(line) or CHATTY.search(line) or line.startswith("☐"):
            continue
        f = fold(line)
        if f in {"epices", "recherche", "variantes", "variante", "ingredients", "avec", "sauce"}:
            continue
        if line.startswith("🤖"):
            continue
        if line.endswith(":") and len(line) < 24:
            continue
        if line.startswith('"') and line.endswith('"'):
            rec.setdefault("robot", []).append(line)
            continue
        clean_ings.append(line)
    rec["ingredients"] = clean_ings
    cleaned_robot: list[str] = []
    for line in rec.get("robot") or []:
        if is_junk(line) or line.startswith("☐"):
            continue
        t = re.sub(r"^🤖\s*", "", line).strip().strip('"«»')
        if not t or fold(t) in {"mr cuisine", "mr cuisine smart", "recherche robot", "recherche"}:
            continue
        if is_robot_program(line) or (len(t.split()) <= 6 and not t.startswith("☐")):
            cleaned_robot.append(t)
    rec["robot"] = cleaned_robot
    rec["steps"] = [s for s in rec.get("steps") or [] if is_real_step(s)]
    if not rec["steps"] and rec["robot"]:
        rec["steps"] = [f"Au robot : {line}" for line in rec["robot"][:3]]
    rec["notes"] = [n for n in rec.get("notes") or [] if n and not is_junk(n)]
    return rec


def make_recipe(name: str, body: list[str], source: str) -> dict:
    ingredients, steps, robot, notes = split_body(body)
    rec = {
        "id": rid(source, name),
        "name": name,
        "ingredients": ingredients,
        "steps": steps,
        "robot": robot,
        "notes": notes,
        "source": source,
    }
    parse_meta("\n".join(body), rec)
    return rec


def richer(a: dict, b: dict) -> dict:
    def score(r: dict) -> int:
        bonus = 40 if r.get("source") in LIBRARY else 0
        return 8 * len([s for s in r.get("steps") or [] if is_real_step(s)]) + len(r.get("ingredients") or []) + bonus

    return a if score(a) >= score(b) else b


def is_200_start(s: str, gap: int) -> bool:
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


def parse_200(ws) -> list[dict]:
    rows = col_a(ws)
    starts: list[int] = []
    empty = 99
    by_row = {r: s for r, s in rows}
    for r, s in rows:
        if not s:
            empty += 1
            continue
        if is_200_start(s, empty):
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
        card = make_recipe(title, body, "200 RECETTE")
        if card["ingredients"] or card["steps"]:
            cards.append(card)
    return cards


def parse_bdd(ws, source: str, prep_col: int) -> list[dict]:
    out = []
    for r in range(2, (ws.max_row or 0) + 1):
        name = text(ws.cell(r, 1).value)
        if not name:
            continue
        rec = {
            "id": rid(source, name),
            "name": name,
            "ingredients": lines(ws.cell(r, 3).value),
            "steps": lines(ws.cell(r, prep_col).value),
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


def official_ok(plan_name: str, nom_bdd: str) -> bool:
    if not nom_bdd:
        return False
    pf, bf = fold(plan_name), fold(nom_bdd)
    if not pf or not bf:
        return False
    if pf == bf or (len(pf) >= 10 and (pf in bf or bf in pf)):
        return True
    pt, bt = tokens(plan_name), tokens(nom_bdd)
    if not pt or not bt:
        return False
    prot = pt & PROTEINS
    if prot and prot <= bt and len(pt & bt) >= 2:
        return True
    distinctive = pt - GENERIC - {"roti", "grille", "vapeur"}
    if distinctive and distinctive <= bt:
        return True
    return False


def parse_52_menus(ws) -> tuple[dict[tuple[int, str, str], dict], dict[int, dict]]:
    meals: dict[tuple[int, str, str], dict] = {}
    weeks: dict[int, dict] = {}
    week = None
    day = None
    meal = None
    title: str | None = None
    body: list[str] = []
    breakfast: list[str] = []
    week_batch: list[str] = []
    week_lines: list[str] = []
    week_title = ""
    in_breakfast = False
    in_week_batch = False

    def flush_meal() -> None:
        nonlocal title, body
        if week and day and meal and title:
            meals[(week, day, meal)] = {"name": title, "body": body[:]}
        title = None
        body = []

    def flush_week() -> None:
        nonlocal breakfast, week_batch, week_lines
        if week:
            weeks[week] = {
                "title": week_title,
                "breakfast": breakfast[:],
                "batch": week_batch[:],
                "lines": week_lines[:],
            }
        breakfast = []
        week_batch = []
        week_lines = []

    for _, raw in col_a(ws):
        if not raw:
            continue
        if week:
            week_lines.append(raw)
        wm = WEEK_RE.search(raw)
        if raw.startswith("📅") and wm:
            flush_meal()
            flush_week()
            week = int(wm.group(1))
            week_title = re.sub(r"^📅\s*", "", raw)
            day = None
            meal = None
            in_breakfast = True
            in_week_batch = False
            continue
        combo = COMBO_RE.search(raw)
        if combo:
            flush_meal()
            day = combo.group(1).upper()
            meal = "Midi" if combo.group(2).upper() == "MIDI" else "Soir"
            in_breakfast = False
            in_week_batch = False
            continue
        dm = DAY_RE.search(raw)
        if dm and len(raw) <= 70:
            flush_meal()
            day = dm.group(1).upper()
            meal = None
            in_breakfast = False
            in_week_batch = False
            continue
        if MEAL_RE.match(raw):
            flush_meal()
            meal = "Midi" if fold(raw).startswith("midi") else "Soir"
            in_breakfast = False
            in_week_batch = False
            continue
        if WEEK_PREP.search(raw):
            in_week_batch = True
            in_breakfast = False
            if fold(raw) not in {"a preparer", "a prepare"}:
                week_batch.append(raw)
            continue
        if in_week_batch:
            if fold(raw).startswith("petit"):
                in_week_batch = False
                in_breakfast = True
                continue
            week_batch.append(raw)
            continue
        if in_breakfast:
            if fold(raw).startswith("petit") or fold(raw).startswith("base aline"):
                continue
            breakfast.append(raw)
            continue
        if week and day and meal:
            if title is None:
                title = raw
            else:
                body.append(raw)
    flush_meal()
    flush_week()
    return meals, weeks


def is_collect_start(line: str, gap: int, ahead: str) -> bool:
    if not line or fold(line) in SKIP_TITLE:
        return False
    if COLLECT_HEAD.search(line):
        return True
    if gap >= 2 and 8 <= len(line) <= 90 and not line.endswith(":") and not META.match(line):
        if any(k in fold(ahead) for k in ("ingredient", "epice", "preparation", "montage", "mr cuisine", "temps")):
            return True
    return False


def title_from_header(line: str, nxt: str) -> tuple[str, bool]:
    """Return (title, consume_next)."""
    if "—" in line or "–" in line:
        return line, False
    compact = fold(line)
    if re.search(r"n\s*\d+$", compact) or re.fullmatch(r"(bonus|express|recette|menu|repas|verrine|preparation).*", compact):
        if nxt and not SECTION.match(nxt):
            return nxt, True
    return line, False


def parse_collection_sheet(ws, source: str) -> list[dict]:
    rows = col_a(ws)
    by_row = {r: s for r, s in rows}
    starts: list[int] = []
    empty = 99
    for r, s in rows:
        if not s:
            empty += 1
            continue
        ahead = " ".join(by_row.get(r + k, "") for k in range(1, 10))
        if is_collect_start(s, empty, ahead):
            starts.append(r)
        empty = 0
    cards = []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else (ws.max_row or start) + 1
        first = by_row[start]
        nxt = next((by_row[r] for r in range(start + 1, end) if by_row.get(r)), "")
        title, consume = title_from_header(first, nxt)
        body = []
        for r in range(start + 1, end):
            s = by_row.get(r)
            if not s:
                continue
            if consume and s == nxt:
                consume = False
                continue
            if is_junk(s):
                break
            body.append(s)
        if fold(title) in SKIP_TITLE or len(title) < 4:
            continue
        if fold(title).startswith(("onglet", "annexe", "menus par saison", "saison automne", "hiver", "printemps")) and "recette" not in fold(title):
            continue
        card = normalize_recipe(make_recipe(title, body, source))
        if card["ingredients"] or card["steps"] or card["robot"] or card["notes"]:
            cards.append(card)
    return cards


def merge_recipe(store: dict[str, dict], rec: dict) -> dict:
    key = fold(rec["name"])
    if not key:
        key = rec["id"]
    prev = store.get(key)
    if not prev:
        store[key] = rec
        return rec
    store[key] = richer(prev, rec)
    store[key]["id"] = prev["id"]
    return store[key]


def index_recipes(store: dict[str, dict]) -> dict[str, dict]:
    idx = dict(store)
    for rec in list(store.values()):
        m = NUMED.search(rec["name"])
        if m:
            idx.setdefault(fold(m.group(2)), rec)
    return idx


def pick_named(name: str, nom_bdd: str, idx: dict[str, dict], library: list[dict]) -> dict | None:
    if nom_bdd and official_ok(name, nom_bdd):
        hit = idx.get(fold(nom_bdd))
        if hit:
            return hit
    key = fold(name)
    if key and key in idx:
        rec = idx[key]
        if rec.get("source") in LIBRARY:
            return rec
        for lib in library:
            if fold(lib["name"]) == key:
                return lib
        return rec
    plan_tok = tokens(name)
    distinctive = plan_tok - GENERIC - {"riz", "legumes", "tartine", "roti"}
    plan_dish = plan_tok & DISH
    if len(plan_tok) == 1:
        only = next(iter(plan_tok))
        if len(only) >= 7:
            rare = [rec for rec in library if only in tokens(rec["name"])]
            if rare:
                rare.sort(key=lambda r: len(r.get("ingredients") or []), reverse=True)
                return rare[0]
        return None
    if len(plan_tok) < 2:
        return None
    scored: list[tuple[int, dict]] = []
    for rec in library:
        title_tok = tokens(rec["name"])
        if plan_dish and not (plan_dish & title_tok):
            continue
        if distinctive and not (distinctive & title_tok):
            continue
        hit = len(plan_tok & title_tok)
        if hit < 2:
            continue
        scored.append((hit, rec))
    scored.sort(key=lambda x: (x[0], len(x[1].get("ingredients") or []), 1 if x[1]["source"] == "200 RECETTE" else 0), reverse=True)
    if not scored:
        return None
    if len(scored) == 1 or scored[0][0] > scored[1][0] or scored[0][0] >= 2:
        return scored[0][1]
    return None


def main() -> None:
    wb = load_workbook(ORIG, data_only=True)
    store: dict[str, dict] = {}
    for rec in parse_bdd(wb["BDD_Classique"], "BDD_Classique", 4):
        merge_recipe(store, normalize_recipe(rec))
    for rec in parse_bdd(wb["BDD_MrCuisine"], "BDD_MrCuisine", 4):
        merge_recipe(store, normalize_recipe(rec))
    for rec in parse_200(wb["200 RECETTE"]):
        merge_recipe(store, normalize_recipe(rec))

    menu_meals, week_meta = parse_52_menus(wb["52 MENUS"])

    courses_by_dish: dict[tuple[int, str], list[str]] = {}
    courses: list[dict] = []
    ws = wb["_COURSES_DATA"]
    for r in range(2, (ws.max_row or 0) + 1):
        raw_week = ws.cell(r, 1).value
        dish = text(ws.cell(r, 4).value)
        ingredient = text(ws.cell(r, 5).value)
        aisle = text(ws.cell(r, 6).value) or "🛒 À vérifier"
        if raw_week is None or not ingredient:
            continue
        try:
            week = int(raw_week)
        except (TypeError, ValueError):
            continue
        if week < 1 or week > 52:
            continue
        courses.append({"week": week, "dish": dish, "ingredient": ingredient, "aisle": aisle})
        courses_by_dish.setdefault((week, fold(dish)), []).append(ingredient)

    batch: list[dict] = []
    ws = wb["_BATCH_DATA"]
    for r in range(2, (ws.max_row or 0) + 1):
        raw_week = ws.cell(r, 1).value
        raw = BOX.sub("", text(ws.cell(r, 2).value))
        kind = BOX.sub("", text(ws.cell(r, 3).value))
        if raw_week is None or not raw:
            continue
        try:
            week = int(raw_week)
        except (TypeError, ValueError):
            continue
        if 1 <= week <= 52 and not raw.startswith("📅"):
            batch.append({"week": week, "text": raw, "type": kind})
    have_batch = {item["week"] for item in batch}

    collections_out = []
    for slug, name, blurb, sheets in COLLECTIONS:
        ids: list[str] = []
        seen: set[str] = set()
        for sheet in sheets:
            if sheet not in wb.sheetnames:
                continue
            for rec in parse_collection_sheet(wb[sheet], sheet.strip()):
                merged = merge_recipe(store, rec)
                if merged["id"] not in seen:
                    seen.add(merged["id"])
                    ids.append(merged["id"])
        collections_out.append({"slug": slug, "name": name, "blurb": blurb, "recipeIds": ids})

    idx = index_recipes(store)
    library = [rec for rec in store.values() if rec["source"] in LIBRARY]
    app = wb["_APP_DATA"]
    plan = []
    for r in range(2, app.max_row + 1):
        raw_week = app.cell(r, 1).value
        day = text(app.cell(r, 2).value).upper()
        meal = text(app.cell(r, 3).value)
        app_name = text(app.cell(r, 4).value)
        nom_bdd = text(app.cell(r, 7).value)
        app_ings = lines(app.cell(r, 8).value)
        if raw_week is None or not (app_name or day):
            continue
        week = int(raw_week)
        menu = menu_meals.get((week, day, meal))
        name = (menu["name"] if menu else "") or app_name
        name = name.rstrip(" :").strip()
        if not name:
            continue
        rec = pick_named(name, nom_bdd, idx, library)
        if rec is None and app_name and fold(app_name) != fold(name):
            rec = pick_named(app_name, nom_bdd, idx, library)
        body = (menu["body"] if menu else [])[:]
        extra_ings = [
            x
            for x in app_ings
            if x and not PLACEHOLDER.match(x) and not is_junk(x) and not (x.startswith('"') and x.endswith('"'))
        ]
        extra_ings += courses_by_dish.get((week, fold(name)), [])
        extra_ings += courses_by_dish.get((week, fold(app_name)), [])
        if rec is None:
            rec = normalize_recipe(make_recipe(name, body, "52 MENUS"))
            have = {fold(x) for x in rec["ingredients"]}
            for line in extra_ings:
                if line and fold(line) not in have and not PLACEHOLDER.match(line) and not is_junk(line):
                    rec["ingredients"].append(line)
                    have.add(fold(line))
            rec = merge_recipe(store, rec)
            idx[fold(rec["name"])] = rec
        elif body:
            extra = normalize_recipe(make_recipe(name, body, "52 MENUS"))
            if extra["steps"] and not rec.get("steps"):
                rec["steps"] = extra["steps"]
            if extra["robot"] and not rec.get("robot"):
                rec["robot"] = extra["robot"]
        plan.append({"week": week, "day": day, "meal": meal, "name": name, "recipeId": rec["id"]})

    for rec in store.values():
        normalize_recipe(rec)
        if rec.get("steps"):
            continue
        num = NUMED.search(rec["name"])
        if not num:
            continue
        for other in store.values():
            om = NUMED.search(other["name"])
            if om and om.group(1) == num.group(1) and other.get("steps"):
                rec["steps"] = other["steps"][:]
                break

    skip_batch = (
        "pain", "fromage", "portion", "feculent", "accompagnement", "tranche",
        "parmesan", "gruyere", "non necessaire", "pas besoin", "oui possible",
        "deja", "en fin de repas", "cru personne",
    )

    def useful_batch(line: str) -> str | None:
        raw = line.strip()
        checked = raw.startswith(("✅", "✔", "☐"))
        t = BOX.sub("", raw).strip()
        if not t or len(t) < 8 or fold(t) in {"a preparer", "avec", "oui", "non", "possible"}:
            return None
        f = fold(t)
        if any(x in f for x in skip_batch):
            return None
        if checked:
            return t
        if t.startswith('"') or t.startswith("«"):
            return f"Au robot : {t.strip('«»\"')}"
        if t.startswith("➡️") and any(v in f for v in ("cuisson", "puree", "sauce", "decoupe", "mixage", "veloute", "mijot")):
            return t.lstrip("➡️ ").strip()
        if any(k in f for k in ("double quantite", "congel", "au congelateur", "a preparer avec")):
            return t
        return None

    for w, meta in week_meta.items():
        if w in have_batch:
            continue
        seen: set[str] = set()
        pool = list(meta.get("batch") or []) + list(meta.get("lines") or [])
        checked_ok = [
            raw for raw in pool if raw.strip().startswith(("✅", "✔", "☐")) and useful_batch(raw)
        ]
        source_lines = checked_ok or pool
        for raw in source_lines:
            text_line = useful_batch(raw)
            if not text_line:
                continue
            key = fold(text_line)
            if key in seen:
                continue
            seen.add(key)
            kind = "Recette" if raw.strip().startswith("✅") else "Préparation"
            batch.append({"week": w, "text": text_line, "type": kind})

    wb.close()

    breakfasts = [
        {"week": w, "title": meta["title"], "lines": meta["breakfast"]}
        for w, meta in sorted(week_meta.items())
        if meta["breakfast"] or meta["title"]
    ]

    payload = {
        "title": "Dans mon assiette",
        "subtitle": "Le carnet d’Aline, sans les onglets d’audit.",
        "recipes": list(store.values()),
        "plan": plan,
        "batch": batch,
        "courses": courses,
        "collections": collections_out,
        "breakfasts": breakfasts,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    linked = sum(1 for p in plan if p["recipeId"])
    print("recipes", len(store), "plan", len(plan), "linked", linked)
    print("no-steps", sum(1 for r in store.values() if not r.get("steps")))
    from collections import Counter
    bw = Counter(i["week"] for i in batch)
    print("batch missing", [w for w in range(1, 53) if bw[w] == 0])
    print("batch 14", bw[14], "15", bw[15], "32", bw[32], "46", bw[46])
    by_id = {r["id"]: r for r in store.values()}
    for w in (1, 2):
        print(f"WEEK {w}")
        for p in [x for x in plan if x["week"] == w]:
            rec = by_id[p["recipeId"]]
            print(
                f"  {p['day'][:3]} {p['meal']:4} {p['name'][:46]:46} "
                f"ings={len(rec['ingredients'])} src={rec['source']}"
            )


if __name__ == "__main__":
    main()
