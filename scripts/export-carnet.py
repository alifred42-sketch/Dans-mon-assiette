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
    r"^assaisonnement\b|^[ée]pices\b|^avec\s*:|^variantes?\s*:|"
    r"^dans le saladier\b|^cr[èe]me finale\b|^sauce\s*:",
    re.I,
)
META = re.compile(
    r"^(🍽️\s*)?difficult[ée].*|temps de pr[ée]paration\s*:|temps de cuisson\s*:|"
    r"portions?\s*:|⏱️\s*pr[ée]paration\s*:|🔥\s*cuisson\s*:|👥\s*pour|"
    r"🏷️\s*cat[ée]gorie|🍱\s*batch|❄️\s*cong[ée]lation|^⏱️\s*temps|"
    r"^💪\s*sati[ée]t[ée]",
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
    r"RECETTE\s+(SAUCE|AUTOMNE|HIVER|PRINTEMPS|[ÉE]T[ÉE]|MR CUISINE)|"
    r"MR CUISINE\s+\d+|"
    r"^\W*\d+\s+[—–-]\s+\w|"
    r"MARINADE\s+|SAUCE\s+\d+)",
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
    "nouvelles sauces a ajouter",
    "nouvelles sauces a ajouter au classeur",
    "page a ajouter dans ton classeur",
    "mon placard anti panique",
}

GENERIC = {
    "de", "des", "du", "la", "le", "les", "et", "au", "aux", "en", "a", "d", "l",
    "un", "une", "avec", "facon", "maison", "leger", "legere", "recette", "pour",
    "ou", "sauce", "plus", "tartine", "complete", "repas", "leger",
}
MEAT = {
    "poulet", "cabillaud", "saumon", "thon", "boeuf", "veau", "dinde", "crevette",
    "crevettes", "maquereau", "steak", "poisson", "hache", "boulette", "boulettes",
    "escalope", "jambon", "merguez", "porc",
}
DISC_VEG = {
    "champignon", "champignons", "courgette", "courgettes", "poireau", "poireaux",
    "asperge", "asperges", "carotte", "carottes", "potiron", "butternut",
}
PROTEINS = MEAT | {
    "veloute", "chili", "risotto", "soupe", "omelette", "wrap",
}
DISH = {
    "omelette", "wrap", "risotto", "veloute", "chili", "soupe", "muffin", "gratin",
    "lasagne", "lasagnes", "pizza", "burger", "tartine", "salade", "steak",
    "bolognaise", "bourguignon", "frittata", "quiche",
}

LIBRARY = {"200 RECETTE", "BDD_Classique", "BDD_MrCuisine"}
SOURCE_RANK = {
    "200 RECETTE": 5,
    "BDD_Classique": 4,
    "BDD_MrCuisine": 3,
}

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

STOP_CARD = re.compile(
    r"liste courses|à imprimer|onglet —|annexe —|"
    r"nouvelles sauces|page à ajouter|retour au dashboard|"
    r"menus par saison|toujours avoir|hyperlink|"
    r"mon placard anti|onglet —|kit ap[ée]ro|"
    r"petits amuse-bouches",
    re.I,
)
JUNK = re.compile(
    r"liste courses|à imprimer|onglet —|annexe —|retour au dashboard|hyperlink",
    re.I,
)
CHATTY = re.compile(
    r"^(encore une recette|encore une belle|un bon plat|un plat|"
    r"parfaite? pour|je sais que|toujours notre format|"
    r"parce qu|celle que tu|une de tes recettes|quand envie|"
    r"un risotto bien|un plat familial|bien meilleure|"
    r"tr[èe]s pratique|dans le saladier|un classique|"
    r"une salade complète|une base à|id[ée]al |"
    r"à mettre dans|pour tes soir|[àa] mettre dans ton|"
    r"une recette qui)",
    re.I,
)
PAGE_LINE = re.compile(r"page (organisation|astuce|à ajouter)|📌\s*page", re.I)
SAUCE_TITLE = re.compile(r"^(n\s*\d+\s+)?(sauce|marinade)\b", re.I)
ING_SKIP = {
    "epices", "recherche", "variantes", "variante", "ingredients", "avec",
    "sauce", "assaisonnement", "fromage", "pain", "accompagnement",
    "accompagnements", "selon saison", "ou", "pour", "utilisations",
    "ideale avec", "parfait pour", "possible", "option", "deja present",
    "deja prevu", "portion", "repos",
}
INSTR = re.compile(
    r"^(\d+\.\s*|➡️\s*)?(d[ée]coupe|cuisson|mixage|faire |ajouter|m[ée]langer|"
    r"cuire |assembler|garnir|rouler|laisser |couper |servir |pr[ée]parer |"
    r"nacrer |terminer |[ée]mincer |r[âa]per |enfourner |mixer |"
    r"r[ée]chauffer |concasser |inciser |farci)",
    re.I,
)
WEEK_PREP = re.compile(
    r"pr[ée]paration du dimanche|^[àa] pr[ée]parer|batch cooking|⭐\s*pr[ée]paration",
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
    out = set()
    for w in fold(s).split():
        if len(w) <= 1 or w in GENERIC:
            continue
        if w.endswith("s") and len(w) > 4:
            w = w[:-1]
        out.add(w)
    return out


def strip_box(s: str) -> str:
    return BOX.sub("", s).strip()


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


def is_stop(line: str) -> bool:
    return bool(line and STOP_CARD.search(line))


def is_junk(line: str) -> bool:
    if not line:
        return True
    if is_stop(line):
        return True
    f = fold(line)
    return f.startswith("liste ") or "a imprimer" in f


def is_quoted_program(line: str) -> bool:
    t = strip_box(line).strip().strip("«»")
    if len(t) >= 2 and t[0] == '"' and t[-1] == '"':
        return True
    if line.strip().startswith('"') or line.strip().startswith("«"):
        return True
    return False


def is_robot_program(line: str) -> bool:
    t = strip_box(line)
    if not t or is_junk(t):
        return False
    if t.startswith(("🛒", "📅")):
        return False
    if is_quoted_program(line) or is_quoted_program(t):
        return True
    return False


def is_real_step(line: str) -> bool:
    if not line or is_junk(line) or PAGE_LINE.search(line):
        return False
    t = strip_box(line)
    if t.startswith(("❌", "🛒", "📅", "🍞", "🧀", "⭐", "🔗", "📌")):
        return False
    if CHATTY.search(t):
        return False
    if t.startswith("Au robot :"):
        rest = t.replace("Au robot :", "", 1).strip()
        return bool(INSTR.search(rest)) and len(rest) >= 12
    if re.match(r"^\d+\.\s+", t):
        return True
    if INSTR.search(t) and "personne" not in fold(t):
        return True
    if t.startswith("➡️") and len(t) >= 18:
        return True
    return len(t) >= 32


def keep_ingredient(line: str) -> str | None:
    if not line or is_junk(line) or CHATTY.search(line) or PLACEHOLDER.match(line):
        return None
    t = strip_box(line).replace("🔗", "").strip()
    if not t:
        return None
    if t.startswith(("❌", "🤖", "📅", "🔗", "💡", "⭐", "📷", "📌")):
        return None
    if PAGE_LINE.search(t):
        return None
    f = fold(t)
    if f in ING_SKIP or f.startswith("recherche ") or f.startswith("mr cuisine"):
        return None
    if f.startswith("possible") or f.startswith("option") or f.startswith("deja"):
        return None
    if f.startswith("ideale") or f.startswith("utilisation") or f.startswith("parfait"):
        return None
    if f.startswith("aucun ") or f.startswith("pas de ") or f.startswith("non avec"):
        return None
    if META.match(t) or CAT_HEADER.match(t):
        return None
    if t.endswith(":") and len(t) < 28:
        return None
    if is_quoted_program(t):
        return None
    if t.startswith("➡️") and INSTR.search(t):
        return None
    return t


HEADING_KEYS = {
    "ingredients", "ingredient", "ingr", "viande", "legumes", "feculent",
    "fromage", "pain", "epices", "assaisonnement", "appareil", "appareil leger",
    "dessus", "sauce", "creme finale", "preparation", "preparation classique",
    "montage", "etapes", "etape", "mr cuisine", "mr cuisine smart",
    "recherche", "recherche robot", "recherche mr cuisine",
    "avec mr cuisine", "avec mr cuisine smart", "version mr cuisine smart",
    "version monsieur cuisine smart", "variantes", "variante", "astuce",
    "temps", "accompagnement", "accompagnements", "dessert conseille",
    "remplacements", "batch cooking", "congelation", "avec",
    "dans le saladier", "ideale avec", "utilisations", "epices aromates",
    "garnitures", "versions", "idees", "version ete", "version fete",
}
FOOD_KIND = {
    "ingredients", "ingredient", "viande", "legumes", "feculent", "fromage",
    "pain", "epices", "assaisonnement", "appareil", "appareil leger",
    "dessus", "sauce", "creme finale", "avec", "dans le saladier",
    "epices aromates", "garnitures",
}
STEP_KIND = {"preparation", "preparation classique", "montage", "etape", "etapes"}
ROBOT_KIND = {
    "mr cuisine", "mr cuisine smart", "recherche", "recherche robot",
    "recherche mr cuisine", "avec mr cuisine", "avec mr cuisine smart",
    "version mr cuisine smart", "version monsieur cuisine smart",
}
SECTION_ICON = {
    "ingredients": "🛒",
    "ingredient": "🛒",
    "viande": "🥩",
    "legumes": "🥒",
    "feculent": "🍚",
    "fromage": "🧀",
    "pain": "🍞",
    "epices": "🌿",
    "assaisonnement": "🌿",
    "appareil": "🥣",
    "appareil leger": "🥣",
    "dessus": "🧀",
    "garnitures": "🧀",
    "versions": "🔄",
    "idees": "💡",
    "sauce": "🥣",
    "preparation": "👩‍🍳",
    "mr cuisine": "🤖",
    "recherche": "🤖",
    "avec mr cuisine": "🤖",
    "avec mr cuisine smart": "🤖",
    "temps": "⏱️",
    "variantes": "🔄",
    "astuce": "💡",
}


def heading_key(line: str) -> str:
    return fold(line.rstrip(":").strip())


def is_heading(line: str) -> bool:
    t = line.strip()
    if not t or is_stop(t) or PLACEHOLDER.match(t):
        return False
    f = heading_key(t)
    if f in HEADING_KEYS or f.startswith("preparation") or f.startswith("mr cuisine"):
        return True
    if f.startswith("recherche") or f.startswith("avec mr") or f.startswith("appareil"):
        return True
    if f.startswith("version monsieur") or f.startswith("version mr"):
        return True
    if CAT_HEADER.match(t):
        return True
    if t.endswith(":"):
        left, _, right = t.partition(":")
        if right.strip() and re.search(r"\d", right):
            return False
        if len(t) <= 42 and not re.search(r"\d", left):
            return True
    return False


def decorate_title(title: str) -> str:
    t = title.strip()
    f = heading_key(t)
    icon = SECTION_ICON.get(f)
    if icon and icon not in t:
        return f"{icon} {t}"
    return t


def section_kind(title: str) -> str:
    f = heading_key(title)
    if f in FOOD_KIND or f.startswith("appareil") or f.startswith("epice") or f.startswith("assais"):
        return "food"
    if f in STEP_KIND or f.startswith("preparation") or f.startswith("etape"):
        return "steps"
    if f in ROBOT_KIND or f.startswith("mr cuisine") or f.startswith("recherche") or f.startswith("avec mr"):
        return "robot"
    return "notes"


def parse_card(body: list[str]) -> tuple[list[dict], str, list[str], list[str], list[str], list[str]]:
    sections: list[dict] = []
    blurbs: list[str] = []
    current: dict | None = None
    for raw in body:
        line = raw.strip()
        if not line:
            continue
        if is_stop(line):
            break
        if line.startswith(("🔗", "📅 Semaine", "📅 Autres", "📅 SEMAINE", "📅 Futures")):
            continue
        if is_heading(line):
            current = {"title": decorate_title(line), "lines": []}
            sections.append(current)
            continue
        if current is None:
            blurbs.append(line)
            continue
        current["lines"].append(line)
    sections = [sec for sec in sections if sec["lines"] or heading_key(sec["title"]) in ROBOT_KIND]
    ingredients: list[str] = []
    steps: list[str] = []
    robot: list[str] = []
    notes: list[str] = []
    for sec in sections:
        kind = section_kind(sec["title"])
        for line in sec["lines"]:
            if kind == "food":
                kept = keep_ingredient(line)
                if kept:
                    ingredients.append(kept)
            elif kind == "steps":
                t = re.sub(r"^\d+\.\s*", "", strip_box(line))
                if is_real_step(t) or is_real_step(line):
                    steps.append(t)
            elif kind == "robot":
                t = strip_box(line)
                if is_quoted_program(line) or is_quoted_program(t):
                    robot.append(t.strip().strip('"«»'))
                elif t and not is_junk(t):
                    if is_quoted_program(f'"{t}"') or len(t.split()) <= 8:
                        if not t.startswith(("❌", "💡")):
                            robot.append(t.strip().strip('"«»'))
            else:
                t = strip_box(line)
                if t and not is_junk(t) and not PAGE_LINE.search(t):
                    notes.append(t)
    blurb = " ".join(blurbs[:2]).strip()
    return sections, blurb, ingredients, steps, robot, notes


def split_body(body: list[str]) -> tuple[list[str], list[str], list[str], list[str]]:
    ingredients: list[str] = []
    steps: list[str] = []
    robot: list[str] = []
    notes: list[str] = []
    section = "ings"
    pending_verb = ""

    def flush_pending() -> None:
        nonlocal pending_verb
        pending_verb = ""

    for raw in body:
        line = raw.strip()
        if is_stop(line) or is_junk(line):
            break
        f = fold(line)
        if PLACEHOLDER.match(line) or CHATTY.search(line):
            continue
        if f.startswith("ingredient") or f == "ingr" or f.startswith("ingr dients") or f in {
            "avec",
            "dans le saladier",
        }:
            section = "ings"
            flush_pending()
            continue
        if f.startswith("preparation") or f.startswith("montage") or f.startswith("etape") or f.startswith("faire :"):
            section = "steps"
            flush_pending()
            continue
        if (
            line.startswith("🤖")
            or f.startswith("mr cuisine")
            or f.startswith("recherche robot")
            or f.startswith("recherche")
            or f.startswith("version monsieur")
            or f.startswith("avec mr cuisine")
        ):
            section = "robot"
            flush_pending()
            continue
        if line.startswith("💡") or f.startswith("astuce") or f.startswith("variante"):
            section = "notes"
            flush_pending()
            if f in {"astuce", "variante", "variantes"} or f.startswith("astuce"):
                continue
        if f.startswith("ideale") or f.startswith("utilisation") or f.startswith("present dans") or f.startswith("utilise"):
            section = "notes"
            flush_pending()
            continue
        if line.startswith(("🔗", "📅 Semaine", "📅 Autres", "📅 SEMAINE", "📅 Futures")):
            continue
        if CAT_HEADER.match(line) or f in {"ou", "ingredients", "epices", "avec", "assaisonnement"}:
            continue
        if META.match(line):
            continue
        if re.match(r"^\d+\.\s+", strip_box(line)) or (line.startswith("➡️") and INSTR.search(line) and section != "robot"):
            section = "steps"

        if section == "ings":
            if INSTR.search(strip_box(line)) and not line.startswith(("🥣", "🌿")):
                steps.append(re.sub(r"^(\d+\.\s*|➡️\s*)", "", strip_box(line)))
            else:
                kept = keep_ingredient(line)
                if kept:
                    ingredients.append(kept)
        elif section == "steps":
            t = strip_box(line)
            if t.startswith("Étape") or is_junk(t):
                continue
            if re.match(r"^\d+\.\s+", t):
                steps.append(re.sub(r"^\d+\.\s*", "", t))
            elif is_real_step(t):
                steps.append(re.sub(r"^➡️\s*", "", t))
        elif section == "robot":
            t = strip_box(line)
            if is_quoted_program(line) or is_quoted_program(t):
                robot.append(t.strip().strip('"«»'))
                flush_pending()
            elif t.startswith("➡️"):
                detail = t.lstrip("➡️ ").strip()
                if pending_verb:
                    steps.append(f"{pending_verb} : {detail}")
                    pending_verb = ""
                elif INSTR.search(t) or len(detail) >= 18:
                    steps.append(detail)
            elif INSTR.search(t) and len(t.split()) <= 5:
                pending_verb = t.rstrip(" :")
            elif is_real_step(t):
                steps.append(t)
        else:
            t = strip_box(line)
            if t and not is_junk(t) and not CHATTY.search(t):
                notes.append(t)
    return ingredients, [s for s in steps if is_real_step(s)], robot, notes


def normalize_recipe(rec: dict) -> dict:
    ingredients: list[str] = []
    steps: list[str] = []
    robot: list[str] = []
    notes: list[str] = list(rec.get("notes") or [])
    section = "ings"
    for raw in rec.get("ingredients") or []:
        line = raw.strip()
        if is_stop(line):
            break
        f = fold(line)
        if f.startswith("variante"):
            section = "notes"
            continue
        if line.startswith("🤖") or f.startswith("recherche"):
            section = "robot"
            if is_quoted_program(line):
                robot.append(strip_box(line).strip('"«»'))
            continue
        if section == "notes":
            kept = strip_box(line)
            if kept and not is_junk(kept):
                notes.append(kept)
            continue
        if section == "robot":
            if is_quoted_program(line):
                robot.append(strip_box(line).strip('"«»'))
            continue
        kept = keep_ingredient(line)
        if kept:
            ingredients.append(kept)
        elif is_quoted_program(line):
            robot.append(strip_box(line).strip('"«»'))

    for raw in rec.get("steps") or []:
        if is_real_step(raw):
            steps.append(re.sub(r"^\d+\.\s*", "", strip_box(raw)))

    for raw in rec.get("robot") or []:
        t = re.sub(r"^🤖\s*", "", strip_box(raw)).strip().strip('"«»')
        if not t or is_junk(t):
            continue
        if fold(t) in {"mr cuisine", "mr cuisine smart", "recherche robot", "recherche"}:
            continue
        if is_quoted_program(raw) or is_quoted_program(t) or (len(t.split()) <= 8 and not t.startswith("☐")):
            if t not in robot:
                robot.append(t)

    seen_ing: set[str] = set()
    clean_ings: list[str] = []
    for line in ingredients:
        key = fold(line)
        if key and key not in seen_ing:
            seen_ing.add(key)
            clean_ings.append(line)

    rec["ingredients"] = clean_ings
    rec["steps"] = steps
    rec["robot"] = robot
    rec["notes"] = [n for n in notes if n and not is_junk(n) and not CHATTY.search(n)]
    if rec.get("sections"):
        rec["sections"] = [
            {"title": sec["title"], "lines": [ln for ln in sec.get("lines") or [] if ln and not is_stop(ln)]}
            for sec in rec["sections"]
            if sec.get("title")
        ]
    return rec


def make_recipe(name: str, body: list[str], source: str) -> dict:
    sections, blurb, ingredients, steps, robot, notes = parse_card(body)
    if not ingredients and not steps and not robot:
        ingredients, steps, robot, notes = split_body(body)
    rec = {
        "id": rid(source, name),
        "name": name,
        "ingredients": ingredients,
        "steps": steps,
        "robot": robot,
        "notes": notes,
        "sections": sections,
        "source": source,
    }
    if blurb:
        rec["blurb"] = blurb
    parse_meta("\n".join(body), rec)
    return normalize_recipe(rec)


def merge_lists(a: list[str], b: list[str]) -> list[str]:
    by_key: dict[str, str] = {}
    order: list[str] = []
    for line in list(a or []) + list(b or []):
        bare = fold(re.sub(r"\d+[.,]?\d*", "", line))
        key = bare or fold(line)
        if not key:
            continue
        prev = by_key.get(key)
        if prev is None:
            by_key[key] = line
            order.append(key)
        elif re.search(r"\d", line) and not re.search(r"\d", prev):
            by_key[key] = line
    return [by_key[k] for k in order]


def better_steps(a: list[str], b: list[str]) -> list[str]:
    sa = [s for s in a or [] if is_real_step(s)]
    sb = [s for s in b or [] if is_real_step(s)]
    return sa if len(sa) >= len(sb) else sb


def combine_recipes(prev: dict, rec: dict) -> dict:
    out = dict(prev)
    prev_rank = SOURCE_RANK.get(prev.get("source", ""), 1)
    rec_rank = SOURCE_RANK.get(rec.get("source", ""), 1)
    if rec_rank > prev_rank:
        out["source"] = rec["source"]
        if NUMED.search(rec.get("name") or "") or len(rec.get("name") or "") > len(prev.get("name") or ""):
            out["name"] = rec["name"]
    prev_ings = prev.get("ingredients") or []
    rec_ings = rec.get("ingredients") or []
    out["ingredients"] = merge_lists(prev_ings, rec_ings)
    out["steps"] = better_steps(prev.get("steps") or [], rec.get("steps") or [])
    out["robot"] = merge_lists(prev.get("robot") or [], rec.get("robot") or [])
    out["notes"] = merge_lists(prev.get("notes") or [], rec.get("notes") or [])
    for key in ("timePrep", "timeCook", "servings"):
        if rec.get(key) and not out.get(key):
            out[key] = rec[key]
    out["id"] = prev["id"]
    def section_weight(r: dict) -> int:
        return sum(len(s.get("lines") or []) for s in r.get("sections") or [])

    if section_weight(rec) > section_weight(prev):
        out["sections"] = rec.get("sections") or []
        if rec.get("blurb"):
            out["blurb"] = rec["blurb"]
    elif prev.get("sections"):
        out["sections"] = prev["sections"]
    elif rec.get("sections"):
        out["sections"] = rec["sections"]
    if rec.get("blurb") and not out.get("blurb"):
        out["blurb"] = rec["blurb"]
    if out.get("steps") and out.get("sections"):
        has_prep = any(section_kind(s["title"]) == "steps" for s in out["sections"])
        if not has_prep:
            out["sections"].append({
                "title": "👩‍🍳 Préparation",
                "lines": [f"{i + 1}. {step}" for i, step in enumerate(out["steps"])],
            })
    return normalize_recipe(out)


def is_200_start(s: str, gap: int) -> bool:
    if not s or fold(s) in SKIP_TITLE or is_stop(s):
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
        body = []
        for r in range(start + 1, end):
            s = by_row.get(r)
            if not s:
                continue
            if is_stop(s):
                break
            body.append(s)
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
        body = ["🛒 Ingrédients"] + lines(ws.cell(r, 3).value)
        prep = lines(ws.cell(r, prep_col).value)
        if prep:
            body += ["👩‍🍳 Préparation"] + prep
        rec = make_recipe(name, body, source)
        if source == "BDD_Classique":
            rec["timePrep"] = text(ws.cell(r, 5).value) or rec.get("timePrep")
            rec["timeCook"] = text(ws.cell(r, 6).value) or rec.get("timeCook")
            rec["servings"] = text(ws.cell(r, 7).value) or rec.get("servings")
        out.append(rec)
    return out


def sauce_name(name: str) -> bool:
    return bool(SAUCE_TITLE.search(re.sub(r"^\d+\s+", "", fold(name))))


def titles_conflict(plan_name: str, nom_bdd: str) -> bool:
    pt, bt = tokens(plan_name), tokens(nom_bdd)
    if sauce_name(plan_name) != sauce_name(nom_bdd):
        return True
    plan_meat, bdd_meat = pt & MEAT, bt & MEAT
    if (plan_meat or bdd_meat) and not (plan_meat & bdd_meat):
        return True
    plan_veg, bdd_veg = pt & DISC_VEG, bt & DISC_VEG
    if plan_veg and bdd_veg and not (plan_veg & bdd_veg):
        return True
    plan_dish, bdd_dish = pt & DISH, bt & DISH
    if plan_dish and bdd_dish and not (plan_dish & bdd_dish):
        return True
    extra_dish = (bt & DISH) - (pt & DISH)
    if extra_dish and (pt & DISH):
        return True
    return False


def official_ok(plan_name: str, nom_bdd: str) -> bool:
    if not nom_bdd:
        return False
    pf, bf = fold(plan_name), fold(nom_bdd)
    if not pf or not bf:
        return False
    if titles_conflict(plan_name, nom_bdd):
        return False
    pt, bt = tokens(plan_name), tokens(nom_bdd)
    extra_meat = (bt & MEAT) - (pt & MEAT)
    extra_dish = (bt & DISH) - (pt & DISH)
    if pf == bf:
        return True
    if len(pf) >= 10 and pf in bf and not extra_meat and not extra_dish:
        return True
    if len(bf) >= 10 and bf in pf and not extra_meat and not extra_dish:
        return True
    if extra_meat or extra_dish:
        return False
    if not pt or not bt:
        return False
    prot = pt & MEAT
    if prot and prot <= bt and len(pt & bt) >= 2:
        return True
    distinctive = pt - GENERIC - {"roti", "grille", "vapeur", "maison", "leger", "legere"}
    if len(distinctive) >= 2 and distinctive <= bt:
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


def is_emoji_dish(line: str) -> bool:
    if not line or is_heading(line) or is_stop(line) or META.match(line):
        return False
    if line.endswith(":") and len(line) < 36:
        return False
    if line.startswith(("✨", "⭐", "☀️", "⚠️", "💡", "❤️", "🌿", "✅", "➡️", "✔", "📌")):
        return False
    first = line[0]
    if unicodedata.category(first) != "So":
        return False
    name = strip_emoji(line).strip()
    if name.endswith((".", "!", "?")):
        return False
    words = [w for w in name.split() if w]
    if len(words) < 2 and fold(name) not in {"samoussas", "brochettes", "verrine"}:
        return False
    return 3 <= len(name) <= 80


def is_recipe_struct(line: str) -> bool:
    if not line:
        return False
    f = heading_key(line)
    return f.startswith((
        "ingredient", "garniture", "versions", "idees", "epice", "montage",
        "mr cuisine", "assais", "version ete", "version fete", "recherche",
    ))


def first_filled(by_row: dict[int, str], row: int, n: int = 6) -> str:
    for k in range(1, n + 1):
        s = by_row.get(row + k, "")
        if s:
            return s
    return ""


def is_collect_start(line: str, gap: int, ahead: str, by_row: dict[int, str] | None = None, row: int = 0) -> bool:
    if not line or fold(line) in SKIP_TITLE or is_stop(line):
        return False
    if line.startswith("☐") or line.startswith("☑"):
        return False
    if re.match(r"^MR CUISINE\s+\d+\s*$", line, re.I):
        return True
    if COLLECT_HEAD.search(line):
        return True
    nxt = first_filled(by_row, row) if by_row else ""
    if is_emoji_dish(line):
        if is_emoji_dish(nxt):
            return False
        if is_recipe_struct(nxt):
            return True
        nxt2 = first_filled(by_row, row + 1) if by_row else ""
        if nxt and not is_heading(nxt) and is_recipe_struct(nxt2):
            return True
        return False
    ahead_f = fold(ahead)
    if gap >= 2 and 8 <= len(line) <= 90 and not line.endswith(":") and not META.match(line):
        if any(k in ahead_f for k in ("ingredient", "epice", "preparation", "montage", "mr cuisine", "temps", "garniture")):
            return True
    return False


def title_from_header(line: str, nxt: str) -> tuple[str, bool]:
    """Return (title, consume_next)."""
    if "—" in line or "–" in line:
        return line, False
    compact = fold(line)
    if re.search(r"n\s*\d+$", compact) or re.fullmatch(
        r"(bonus|express|recette|menu|repas|verrine|preparation|mr cuisine).*", compact
    ):
        if nxt and not SECTION.match(nxt) and not is_stop(nxt):
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
        if is_collect_start(s, empty, ahead, by_row, r):
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
            if is_stop(s):
                break
            body.append(s)
        title_fold = fold(title)
        if title_fold in SKIP_TITLE or len(title) < 4:
            continue
        if title_fold.startswith(("onglet", "annexe", "menus par saison", "saison automne", "kit apero", "petits amuse")):
            continue
        card = make_recipe(title, body, source)
        if card["ingredients"] or card["steps"] or card["robot"] or card["notes"] or card.get("sections"):
            cards.append(card)
    return cards


def recipe_num(name: str) -> str | None:
    m = NUMED.search(name or "")
    return m.group(1).lstrip("0") or "0" if m else None


def merge_recipe(store: dict[str, dict], rec: dict) -> dict:
    key = fold(rec["name"])
    if not key:
        key = rec["id"]
    num = recipe_num(rec["name"])
    prev = store.get(key)
    if not prev and num:
        for existing in store.values():
            if recipe_num(existing["name"]) == num and existing.get("source") in LIBRARY and rec.get("source") in LIBRARY:
                prev = existing
                key = fold(existing["name"])
                break
    if not prev:
        store[key] = rec
        return rec
    store[key] = combine_recipes(prev, rec)
    return store[key]


def index_recipes(store: dict[str, dict]) -> dict[str, dict]:
    idx = dict(store)
    for rec in list(store.values()):
        m = NUMED.search(rec["name"])
        if m:
            idx.setdefault(fold(m.group(2)), rec)
            idx.setdefault(fold(m.group(2).split("🤖")[0]), rec)
    return idx


def pick_named(name: str, nom_bdd: str, idx: dict[str, dict], library: list[dict], store: dict[str, dict]) -> dict | None:
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

    close: list[tuple[int, int, dict]] = []
    for rec in store.values():
        if titles_conflict(name, rec["name"]):
            continue
        if not (official_ok(name, rec["name"]) or official_ok(rec["name"], name)):
            continue
        hit = len(tokens(name) & tokens(rec["name"]))
        close.append((hit, len(rec.get("steps") or []), rec))
    close.sort(key=lambda x: (x[0], x[1], len(x[2].get("ingredients") or [])), reverse=True)
    if close:
        return close[0][2]

    plan_tok = tokens(name)
    distinctive = plan_tok - GENERIC - {"riz", "legumes", "tartine", "roti"}
    plan_dish = plan_tok & DISH
    if len(plan_tok) == 1:
        only = next(iter(plan_tok))
        if len(only) >= 7:
            rare = [rec for rec in library if only in tokens(rec["name"]) and not titles_conflict(name, rec["name"])]
            if rare:
                rare.sort(key=lambda r: (1 if r.get("steps") else 0, len(r.get("ingredients") or [])), reverse=True)
                return rare[0]
        return None
    if len(plan_tok) < 2:
        return None
    fuzzy: list[tuple[int, dict]] = []
    for rec in library:
        title_tok = tokens(rec["name"])
        if plan_dish and not (plan_dish & title_tok):
            continue
        if distinctive and not (distinctive & title_tok):
            continue
        if titles_conflict(name, rec["name"]):
            continue
        hit = len(plan_tok & title_tok)
        if hit < 2:
            continue
        fuzzy.append((hit, rec))
    fuzzy.sort(key=lambda x: (x[0], 1 if x[1].get("steps") else 0, len(x[1].get("ingredients") or []), 1 if x[1]["source"] == "200 RECETTE" else 0), reverse=True)
    if not fuzzy:
        return None
    if len(fuzzy) == 1 or fuzzy[0][0] > fuzzy[1][0] or fuzzy[0][0] >= 2:
        return fuzzy[0][1]
    return None


def main() -> None:
    wb = load_workbook(ORIG, data_only=True)
    store: dict[str, dict] = {}
    for rec in parse_bdd(wb["BDD_Classique"], "BDD_Classique", 4):
        merge_recipe(store, rec)
    for rec in parse_bdd(wb["BDD_MrCuisine"], "BDD_MrCuisine", 4):
        merge_recipe(store, rec)
    for rec in parse_200(wb["200 RECETTE"]):
        merge_recipe(store, rec)

    menu_meals, week_meta = parse_52_menus(wb["52 MENUS"])

    courses: list[dict] = []
    courses_by_dish: dict[tuple[int, str], list[str]] = {}
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
        rec = pick_named(name, nom_bdd, idx, library, store)
        if rec is None and app_name and fold(app_name) != fold(name):
            rec = pick_named(app_name, nom_bdd, idx, library, store)
        body = (menu["body"] if menu else [])[:]
        extra_ings = [
            x
            for x in app_ings
            if keep_ingredient(x)
        ]
        if rec is None:
            rec = make_recipe(name, body, "52 MENUS")
            have = {fold(x) for x in rec["ingredients"]}
            for line in extra_ings:
                kept = keep_ingredient(line)
                if kept and fold(kept) not in have:
                    rec["ingredients"].append(kept)
                    have.add(fold(kept))
            rec = merge_recipe(store, rec)
            idx[fold(rec["name"])] = rec
        else:
            extra = make_recipe(name, body, "52 MENUS")
            if extra["steps"] and (not rec.get("steps") or len(extra["steps"]) > len(rec.get("steps") or [])):
                rec["steps"] = extra["steps"]
            if extra["robot"] and not rec.get("robot"):
                rec["robot"] = extra["robot"]
            if extra["ingredients"] and len(rec.get("ingredients") or []) < 3:
                rec["ingredients"] = merge_lists(rec.get("ingredients") or [], extra["ingredients"])
        if len(rec.get("ingredients") or []) < 3:
            extras = extra_ings + courses_by_dish.get((week, fold(name)), []) + courses_by_dish.get((week, fold(app_name)), [])
            have = {fold(x) for x in rec["ingredients"]}
            added: list[str] = []
            for line in extras:
                kept = keep_ingredient(line)
                if kept and fold(kept) not in have:
                    rec["ingredients"].append(kept)
                    have.add(fold(kept))
                    added.append(kept)
            if added and rec.get("sections") is not None:
                food = next((s for s in rec["sections"] if section_kind(s["title"]) == "food"), None)
                if food:
                    food["lines"] = merge_lists(food["lines"], added)
                else:
                    rec["sections"].insert(0, {"title": "🛒 Ingrédients", "lines": added})
        plan.append({"week": week, "day": day, "meal": meal, "name": name, "recipeId": rec["id"]})

    for rec in store.values():
        normalize_recipe(rec)
        if rec.get("steps"):
            continue
        num = recipe_num(rec["name"])
        if not num:
            continue
        for other in store.values():
            if recipe_num(other["name"]) == num and other.get("steps"):
                rec["steps"] = other["steps"][:]
                if other.get("robot") and not rec.get("robot"):
                    rec["robot"] = other["robot"][:]
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
    print("real-steps", sum(1 for r in store.values() if any(not s.startswith("Au robot") for s in r.get("steps") or [])))
    from collections import Counter
    bw = Counter(i["week"] for i in batch)
    print("batch missing", [w for w in range(1, 53) if bw[w] == 0])
    print("batch 14", bw[14], "15", bw[15], "32", bw[32], "46", bw[46])
    print("collections", [(c["slug"], len(c["recipeIds"])) for c in collections_out])
    by_id = {r["id"]: r for r in store.values()}
    for w in (1, 2):
        print(f"WEEK {w}")
        for p in [x for x in plan if x["week"] == w]:
            rec = by_id[p["recipeId"]]
            print(
                f"  {p['day'][:3]} {p['meal']:4} {p['name'][:46]:46} "
                f"ings={len(rec['ingredients'])} steps={len(rec.get('steps') or [])} src={rec['source']}"
            )


if __name__ == "__main__":
    main()
