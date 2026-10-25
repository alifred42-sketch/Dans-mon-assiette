#!/usr/bin/env python3
"""Replace generic recipe instructions with title/ingredient-aware instructions.
Never edits intentional Opération Vide-Frigo cards."""
import json, re, subprocess
from pathlib import Path
P=Path("data/carnet.json")
d=json.loads(P.read_text(encoding="utf-8"))
bad=re.compile(r"la base crémeuse|la protéine si elle est crue|les ingrédients prévus|rectifiez uniquement|si la cuisson est au four|s’il est listé|s'il est listé|selon leur temps de cuisson|avec les seuls ingrédients prévus|les légumes prévus|la sauce ou les condiments indiqués|les assaisonnements prévus|faites cuire complètement les ingrédients crus|mélangez la base crémeuse|dans les assiettes, les wraps ou les contenants|coupez les légumes et les garnitures en morceaux adaptés",re.I)
def clean(x): return re.sub(r"^\s*\d+\.\s*","",str(x or "")).strip()
def pick(a,pat,fb):
    return next((clean(x) for x in a if re.search(pat,x,re.I)),fb)
def picks(a,pat,fb):
    z=[clean(x) for x in a if re.search(pat,x,re.I)][:4]
    return ", ".join(z) if z else fb
def make(r):
    n=(r.get("name") or "").lower(); a=r.get("ingredients") or []
    v=picks(a,r"courgette|tomate|poivron|carotte|poireau|oignon|concombre|salade|champignon|épinard|légume|pomme de terre|ail","les légumes listés")
    p=pick(a,r"poulet|dinde|bœuf|boeuf|viande|merguez|boulette|cabillaud|colin|saumon|maquereau|thon|poisson|crevette|jambon|œuf|oeuf","la garniture principale")
    st=pick(a,r"pâtes|penne|spaghetti|riz |riz$|nouilles|quinoa|lentilles|pommes de terre|pain|wrap|lasagnes","l’accompagnement indiqué")
    dairy=pick(a,r"skyr|yaourt|fromage blanc|crème|parmesan|mozzarella|chèvre|fromage frais|béchamel","le produit laitier listé")
    cit=pick(a,r"citron",""); oil=pick(a,r"huile","la matière grasse listée")
    herbs=picks(a,r"herbe|basilic|persil|ciboulette|aneth|menthe|origan|paprika|curry|épice|moutarde|poivre|sel","les aromates listés")
    if re.search(r"sauce|marinade|tzatziki|béchamel|pesto|tartinade|vinaigrette|rillettes",n):
        return [f"1. Préparez les ingrédients listés : hachez les herbes et l’ail s’ils sont présents; râpez et pressez les légumes aqueux avant de les incorporer.",f"2. Dans un bol, mélangez {dairy} avec {(cit.lower()+' et ') if cit else ''}{herbs.lower()}.", "3. Incorporez progressivement les ingrédients listés en fouettant jusqu’à obtenir une préparation homogène.", "4. Goûtez, ajustez avec les assaisonnements listés, couvrez et réservez au frais jusqu’au service."]
    if re.search(r"wrap|tartine|burger|sandwich|panini",n):
        return [f"1. Égouttez les conserves si la recette en contient. Lavez puis détaillez {v} en morceaux ou fines lamelles.",f"2. Si {p.lower()} est cru, faites-le cuire à cœur dans une poêle chaude avec {oil.lower()}, puis laissez reposer 3 minutes avant de le couper.", "3. Mélangez les ingrédients de sauce listés. Réchauffez le pain ou les galettes 30 à 60 secondes à la poêle si le plat est chaud.",f"4. Répartissez {p.lower()} et {v} sur le pain ou les galettes, ajoutez les garnitures et la sauce, puis roulez ou refermez juste avant de servir."]
    if re.search(r"salade|bowl|taboulé",n):
        return [f"1. Rincez et essorez la salade si elle figure dans la liste. Coupez {v} régulièrement et égouttez soigneusement les conserves.",f"2. Faites cuire séparément les ingrédients qui le nécessitent, notamment {p.lower()} s’il est cru; laissez refroidir avant de mélanger à la salade.",f"3. Réunissez les ingrédients préparés. Mélangez l’huile et {cit.lower() if cit else 'les condiments listés'} avec {herbs.lower()}, puis versez la sauce.", "4. Mélangez délicatement, ajoutez le fromage ou les ingrédients fragiles en dernier et gardez au frais jusqu’au service."]
    if re.search(r"soupe|velouté|potage",n):
        return [f"1. Lavez et épluchez si nécessaire {v}; coupez les légumes en dés réguliers et émincez l’oignon ou l’ail s’ils sont listés.",f"2. Faites chauffer {oil.lower()} dans une marmite, faites revenir les aromates 3 minutes puis ajoutez les légumes et le bouillon listé.", "3. Portez à ébullition, baissez le feu et laissez frémir 20 à 25 minutes, jusqu’à ce que les légumes soient tendres.",f"4. Mixez jusqu’à la texture souhaitée. Incorporez {dairy.lower()} seulement s’il figure dans la liste, goûtez et servez chaud."]
    if "risotto" in n:
        return [f"1. Émincez l’oignon et coupez {v} en petits dés. Faites chauffer le bouillon indiqué et gardez-le chaud.",f"2. Faites revenir l’oignon dans {oil.lower()} 2 à 3 minutes. Ajoutez le riz à risotto et remuez 1 minute.", "3. Versez le bouillon chaud progressivement en remuant pendant 18 à 20 minutes; ajoutez les légumes en dés au cours de la cuisson.", "4. Quand le riz est tendre mais légèrement ferme, retirez du feu, incorporez le fromage listé et laissez reposer 2 minutes."]
    if re.search(r"poisson|saumon|cabillaud|colin|maquereau|thon|papillote",n):
        return [f"1. Préchauffez le four à 190 °C si nécessaire. Lavez et coupez {v}; séchez {p.lower()} et préparez {herbs.lower()}.",f"2. Répartissez {v} dans un plat avec {oil.lower()} et les aromates listés. Pour une papillote, déposez les légumes sur le papier cuisson.",f"3. Posez {p.lower()} sur les légumes, ajoutez {(cit.lower()+' et ') if cit else ''}les assaisonnements listés, puis faites cuire 15 à 22 minutes selon l’épaisseur, jusqu’à ce que la chair soit opaque et se détache facilement.",f"4. Vérifiez la cuisson au centre du morceau le plus épais. Servez avec {st.lower()} s’il figure dans la liste et ajoutez les herbes en fin de cuisson."]
    if re.search(r"gratin|lasagne|parmentier|moussaka|quiche|pizza|hachis",n):
        return [f"1. Préchauffez le four à 180 °C. Lavez et coupez {v} en tranches fines ou petits dés; faites cuire {st.lower()} selon le paquet si nécessaire.",f"2. Faites revenir les légumes dans {oil.lower()} 5 à 8 minutes. Faites cuire {p.lower()} à cœur s’il est cru.", "3. Disposez les ingrédients préparés dans le plat ou sur la pâte. Ajoutez uniquement la sauce et le fromage présents dans la liste.", "4. Enfournez 25 à 35 minutes selon l’épaisseur, jusqu’à ce que le centre soit chaud et le dessus doré; laissez reposer 5 minutes."]
    if re.search(r"pâtes|penne|spaghetti|nouilles|riz |riz$|wok",n):
        return [f"1. Faites cuire {st.lower()} selon le temps indiqué sur le paquet puis égouttez.",f"2. Coupez {v} en morceaux réguliers. Faites chauffer {oil.lower()} dans une grande poêle et faites revenir les légumes 5 à 7 minutes.",f"3. Ajoutez {p.lower()} et faites cuire à cœur s’il est cru. Incorporez ensuite les féculents et les sauces ou épices listées.", "4. Mélangez 2 à 3 minutes à feu moyen. Goûtez, ajustez avec les assaisonnements prévus et servez aussitôt."]
    return [f"1. Préparez les ingrédients indiqués : épluchez et coupez {v} en morceaux réguliers; émincez l’oignon et l’ail s’ils figurent dans la liste.",f"2. Faites chauffer {oil.lower()} dans une cocotte ou une grande poêle. Faites dorer {p.lower()} 3 à 5 minutes en remuant.", "3. Faites revenir les légumes 4 à 6 minutes, puis ajoutez les liquides, tomates ou épices mentionnés dans les ingrédients. Couvrez et laissez mijoter 15 à 25 minutes.",f"4. Vérifiez que la garniture est cuite à cœur et que les légumes sont tendres. Goûtez et servez avec {st.lower()} s’il est prévu."]
changed=0
for r in d.get("recipes",[]):
    if re.search(r"vide.?frigo",f"{r.get('id','')} {r.get('name','')}",re.I): continue
    old=r.get("steps")
    if not isinstance(old,list) or not any(bad.search(s) for s in old): continue
    new=make(r); r["steps"]=new
    for sec in r.get("sections",[]):
        title=(sec.get("title") or "").lower(); lines=sec.get("lines")
        if not isinstance(lines,list) or not re.search(r"préparation|preparation",title) or re.search(r"robot|monsieur cuisine|batch|utilisation|préparer :|preparer :",title): continue
        if (len(lines)==len(old) and all(x==y for x,y in zip(lines,old))) or "préparation classique" in title or "👩‍🍳 préparation" in title: sec["lines"]=new[:]
    r["name"]=re.sub(r"^\s*(?:🍲|🥘|🍗|🥔|🍅|🌯|🍝|🍕|🍜|🐟|🥕|🥧|🌶️|🍄|🥣|🥗|🍚|🍔|🥚|🍫|🥜)?\s*RECETTE\s+\d+\s*[—–:-]\s*","",r.get("name",""),flags=re.I).strip()
    changed+=1
P.write_text(json.dumps(d,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
subprocess.run(["git","config","user.name","github-actions[bot]"],check=True)
subprocess.run(["git","config","user.email","41898282+github-actions[bot]@users.noreply.github.com"],check=True)
subprocess.run(["git","add","data/carnet.json"],check=True)
subprocess.run(["git","commit","-m",f"Reprise des étapes génériques de {changed} fiches recette"],check=True)
subprocess.run(["git","push"],check=True)
print(f"Fiches corrigées : {changed}")
