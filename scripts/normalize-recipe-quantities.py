#!/usr/bin/env python3
import json, re, unicodedata
from pathlib import Path
p=Path("data/carnet.json")
d=json.loads(p.read_text(encoding="utf-8"))
recipes=d.get("recipes",[])
def norm(s):
    s=unicodedata.normalize("NFD",str(s).lower())
    return re.sub(r"\s+"," ","".join(c for c in s if not unicodedata.combining(c))).strip()
def sync(r):
    for sec in r.get("sections",[]):
        if re.search(r"Ingrédients",sec.get("title",""),re.I):
            sec["lines"]=r.get("ingredients",[])[:]
# Convert old "ingredient : replacement quantity" entries into one unambiguous shopping-list line.
def normalize_line(value):
    if ":" not in str(value): return value
    left,right=[v.strip() for v in str(value).split(":",1)]
    if not re.fullmatch(r"(?:\d+(?:[.,]\d+)?(?:/\d+)?|½|¼|un|une)(?:\s*(?:g|kg|ml|cl|l|gousse|gousses|c\.\s*à\s*(?:soupe|café)|cuillère\s+à\s+(?:soupe|café)|pincée|pincées|feuille|feuilles|bouquet|bouquets|pot|pots))?",right,re.I):
        return value
    q=re.match(r"^(\d+(?:[.,]\d+)?(?:/\d+)?|½|¼|un|une)(?:\s*(g|kg|ml|cl|l|gousses?|c\.\s*à\s*(?:soupe|café)|cuillère\s+à\s+(?:soupe|café)))?\s*(.*)$",left,re.I)
    name=q.group(3).strip() if q else left
    name=re.sub(r"^(?:de|du|des|d['’])\s*","",name,flags=re.I)
    name=re.sub(r"^(?:gousse|gousses|cuillère\s+à\s+(?:soupe|café))\s+d['’]\s*","",name,flags=re.I)
    name=re.sub(r"^d['’]\s*","",name,flags=re.I).strip()
    if not name:return value
    if re.fullmatch(r"\d+(?:[.,]\d+)?",right):
        return right+" "+name
    if re.search(r"c\.\s*à\s*soupe|cuillère\s+à\s*soupe",right,re.I) and norm(name) in ("citron","citron jaune","citron vert"):
        name="jus de "+name
    prep="d’" if re.match(r"^[aeiouyhàâäéèêëîïôöùûü]",name,re.I) else "de "
    return right+" "+prep+name
changed=0
for r in recipes:
    if re.search(r"vide.?frigo",r.get("name",""),re.I): continue
    old=r.get("ingredients",[])
    new=[normalize_line(i) for i in old]
    if new!=old:
        r["ingredients"]=new
        sync(r)
        changed+=sum(a!=b for a,b in zip(old,new))
# Repair a few legacy phrases that are not safely recoverable by a generic parser.
fixes={
 "r-35f255bf02":{"Noix de muscade: 1 râpée de pinces":"1 pincée de noix de muscade râpée"},
 "r-bbee576cfa":{"1 gousse d’Ail poudre : 1 c. à soupe":"1 c. à soupe d’ail en poudre","2 Oignon poudre : 1 c. à soupe":"1 c. à soupe d’oignon en poudre"},
 "r-05b735f44d":{"1 gousse d’Ail poudre : 1 c. à soupe":"1 c. à soupe d’ail en poudre"},
 "r-7e9ac7cf02":{"1 Curcuma : 1 c. à soupe":"1 c. à soupe de curcuma","1 Gingembre : 1 c. à soupe":"1 c. à soupe de gingembre"},
 "r-d7a5212511":{"1 Curcuma : 1 c. à soupe":"1 c. à soupe de curcuma","1 Gingembre : 1 c. à soupe":"1 c. à soupe de gingembre"},
 "r-a59202e976":{"1 gousse d’Ail poudre : 1 c. à soupe":"1 c. à soupe d’ail en poudre","2 Oignon poudre : 1 c. à soupe":"1 c. à soupe d’oignon en poudre"},
 "r-d66b61b9c1":{"1 gousse d’lentilles corail : 200 g":"200 g de lentilles corail","1 curcuma : 1/2 c. à café":"1/2 c. à café de curcuma"},
 "r-33b3fe63c3":{"1 gousse d’lentilles corail : 240 g":"240 g de lentilles corail","150 ml de lait de coco léger : petite quantité":"150 ml de lait de coco léger","1 curcuma : 1/2 c. à café":"1/2 c. à café de curcuma","1 gingembre : 1/2 c. à café":"1/2 c. à café de gingembre"},
 "r-5a15ab45ea":{"1 gousse d’lentilles corail : 250 g":"250 g de lentilles corail","150 ml de fromage blanc : 100 g":"100 g de fromage blanc","1 curcuma : 1/2 c. à café":"1/2 c. à café de curcuma"},
}
by={r.get("id"):r for r in recipes}
for rid,mapping in fixes.items():
    r=by.get(rid)
    if not r: continue
    r["ingredients"]=[mapping.get(i,i) for i in r.get("ingredients",[])]
    sync(r)
p.write_text(json.dumps(d,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
# Report remaining issues for the next verification pass.
flags=[]
for r in recipes:
    if re.search(r"vide.?frigo",r.get("name",""),re.I):continue
    issues=[]
    for i in r.get("ingredients",[]):
        if re.search(r"^\s*\d+\s+(?:herbes|épices|gingembre|bœuf émincé|légumes|sauce tomate)\s*$",i,re.I):
            issues.append("quantité ambiguë: "+i)
        if re.search(r"\s:\s",i):
            issues.append("format ancien à vérifier: "+i)
    if issues:flags.append((r.get("id",""),r.get("name",""),issues))
lines=["# Recettes restant à vérifier après normalisation","",f"- Fiches analysées : {len(recipes)}",f"- Lignes de quantités normalisées automatiquement : {changed}",f"- Fiches avec une alerte résiduelle : {len(flags)}",""]
for rid,name,issues in flags:
    lines.append(f"- **{name}** ({rid}) — "+"; ".join(issues))
Path("docs/audit-recettes-restant-a-corriger.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
print(f"recipes={len(recipes)}; normalized_quantity_lines={changed}; residual_flagged_recipes={len(flags)}")
