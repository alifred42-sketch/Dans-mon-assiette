#!/usr/bin/env python3
"""Synchronise chaque déjeuner avec le dîner précédent, sans toucher aux courses ni au batch."""
import json
from pathlib import Path

path = Path("data/carnet.json")
data = json.loads(path.read_text(encoding="utf-8"))
plan = data.get("plan", [])
by_week = {}
for slot in plan:
    by_week.setdefault(int(slot["week"]), []).append(slot)

previous_day = {
    "MARDI": "LUNDI",
    "MERCREDI": "MARDI",
    "JEUDI": "MERCREDI",
    "VENDREDI": "JEUDI",
    "SAMEDI": "VENDREDI",
    "DIMANCHE": "SAMEDI",
}
changed = 0
for week in range(1, 53):
    for lunch in (slot for slot in by_week.get(week, []) if slot.get("meal") == "Midi"):
        source_week = 52 if week == 1 and lunch.get("day") == "LUNDI" else (week - 1 if lunch.get("day") == "LUNDI" else week)
        source_day = "DIMANCHE" if lunch.get("day") == "LUNDI" else previous_day.get(lunch.get("day"))
        dinner = next((slot for slot in by_week.get(source_week, []) if slot.get("day") == source_day and slot.get("meal") == "Soir"), None)
        if not dinner or not dinner.get("recipeId"):
            raise SystemExit(f"Repas source introuvable : semaine {source_week}, {source_day} soir.")
        new_name = "Restes du dîner — " + str(dinner.get("name", "")).removeprefix("Restes du dîner — ")
        if lunch.get("recipeId") != dinner["recipeId"] or lunch.get("name") != new_name:
            lunch["recipeId"] = dinner["recipeId"]
            lunch["name"] = new_name
            changed += 1

# Seul le planning est modifié ; les données courses et batch restent intactes.
if changed:
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Déjeuners synchronisés avec le dîner précédent : {changed}; courses et batch inchangés.")
