#!/usr/bin/env python3
"""Remplace les instructions passe-partout par des étapes liées au titre et aux ingrédients.
Ne modifie jamais les fiches Opération Vide-Frigo."""
import json, re
from pathlib import Path
p=Path("data/carnet.json")
d=json.loads(p.read_text(encoding="utf-8"))
GEN=re.compile(r"les légumes prévus|protéine si elle est crue|sauce ou les condiments indiqués|ingrédients prévus|les légumes les plus fermes|si ces ingrédients figurent|accompagnement indiqué|préparez les autres ingrédients|base crémeuse ou liquide indiquée|si la recette en prévoit|dressez dans les assiettes|viande hachée ne soit plus rosée",re.I)
def make_steps(r):
    name=(r.get("name") or "").lower()
    ing=r.get("ingredients") or []
    alltxt=" | ".join(map(str,ing)).lower()
    def has(pattern): return re.search(pattern, name+" "+alltxt, re.I) is not None
    def items(pattern): return [str(x) for x in ing if re.search(pattern,str(x),re.I)]
    veg=items(r"courgette|carotte|poivron|tomate|concombre|salade|épinard|poireau|champignon|aubergine|brocoli|haricot|oignon|chou|radis|maïs|fenouil")
    vegnames=", ".join(veg[:5]) or "les légumes de la liste"
    sauce=items(r"skyr|fromage blanc|yaourt|moutarde|crème|sauce|citron|vinaigre|huile|pesto|fromage frais|mayonnaise|miel")
    protein=items(r"poulet|dinde|bœuf|boeuf|viande|merguez|boulettes|steak|jambon|porc|saumon|cabillaud|poisson|thon|maquereau|truite|colin|crevette|crabe|surimi|œuf|oeuf")
    out=[]
    if has(r"wrap|tortilla"):
        out=[f"1. Lavez et essorez les crudités présentes dans la liste ({vegnames}). Coupez les légumes en fines tranches ou en petits dés; râpez les carottes si elles sont entières.",
             "2. Préparez la garniture : égouttez et émiettez le thon en conserve; coupez le poisson fumé, le jambon ou le surimi en lanières. Si la viande listée est crue, faites-la cuire à cœur dans une poêle, laissez reposer 2 minutes puis détaillez-la.",
             ("3. Mélangez les éléments d'assaisonnement réellement listés ("+", ".join(sauce[:4])+"). Goûtez avant de saler." if sauce else "3. Préparez uniquement les condiments indiqués dans la liste; n'ajoutez pas de sauce non prévue."),
             "4. Répartissez la garniture sur les galettes sans trop les remplir. Rabattez les côtés, roulez fermement et coupez en deux. Servez aussitôt."]
    elif has(r"cabillaud|saumon|poisson|maquereau|thon|colin|truite|brandade|crevette|crabe|surimi|sardine|merlu|lotte") and not has(r"salade|bowl|tartine|sandwich"):
        if has(r"pommes de terre"): out.append("1. Épluchez les pommes de terre, coupez-les en morceaux réguliers et faites-les cuire 15 à 20 min dans l'eau frémissante. Ajoutez les haricots verts ou autres légumes fragiles pour les 8 à 10 dernières minutes si présents.")
        else: out.append(f"1. Préparez les légumes listés ({vegnames}) : rincez-les et coupez-les en morceaux réguliers. Réservez-les par ordre de cuisson.")
        if has(r"fumé|thon au naturel|surimi|crabe|déjà cuit|jambon"):
            out.append("2. Égouttez le poisson en conserve si nécessaire; coupez le poisson fumé ou déjà cuit en portions. Gardez-le au frais et ne le recuisez pas.")
        else:
            out.append("2. Séchez les filets avec du papier absorbant. Faites chauffer l'huile listée dans une poêle et cuisez le poisson à feu moyen environ 3 à 5 min par face selon l'épaisseur, jusqu'à ce que la chair soit opaque et se détache facilement.")
        out.append("3. Faites cuire les légumes prévus séparément : commencez par les plus fermes, puis ajoutez les plus tendres. Remuez régulièrement et vérifiez qu'ils restent fondants sans se défaire.")
        out.append("4. Mélangez les ingrédients de sauce présents ("+", ".join(sauce[:4])+") dans un bol." if sauce else "4. Vérifiez la cuisson au centre du poisson, puis servez avec les légumes et l'accompagnement indiqués.")
        if sauce: out[-1]+=" Ajoutez le citron progressivement et goûtez avant de saler; servez avec le poisson et les légumes."
    elif has(r"salade|bowl|buddha|tartine|sandwich|burger"):
        out=["1. Faites cuire uniquement les ingrédients qui le nécessitent : œufs 9 à 10 min après ébullition, pommes de terre 15 à 20 min, riz ou pâtes selon le paquet. Égouttez puis laissez refroidir pour une salade froide.",
             f"2. Lavez et essorez les crudités listées ({vegnames}). Coupez-les en morceaux réguliers; égouttez les conserves et coupez la garniture déjà cuite ou fumée.",
             "3. Si une viande ou un poisson cru est listé, faites-le cuire à cœur, laissez-le tiédir puis coupez-le. Ne recuisez pas les ingrédients fumés ou déjà prêts à consommer.",
             "4. Assemblez les ingrédients juste avant le service. Mélangez les condiments présents dans la liste et répartissez l'assaisonnement sans détremper les crudités."]
    elif has(r"gratin|tian|rôtis|rotis|au four"):
        out=[f"1. Préchauffez le four à 190 °C. Lavez les légumes listés ({vegnames}) et coupez-les en morceaux ou tranches de taille similaire.",
             "2. Disposez les légumes dans le plat, ajoutez l'huile, les herbes et les épices qui figurent dans la liste, puis enfournez 25 à 40 min selon l'épaisseur. Vérifiez la tendreté avec la pointe d'un couteau.",
             "3. Si une protéine est listée, faites-la cuire séparément jusqu'à cuisson complète, puis ajoutez-la au plat ou servez-la à côté selon l'intitulé.",
             "4. Ajoutez le fromage listé pour les 10 dernières minutes si la recette en contient. Laissez reposer 5 min avant de servir."]
    elif has(r"purée|puree|écrasé|ecrase"):
        out=[f"1. Épluchez les légumes listés ({vegnames}) et coupez-les en morceaux de taille similaire.",
             "2. Faites cuire dans l'eau frémissante 15 à 20 min, jusqu'à ce qu'une lame de couteau traverse facilement les morceaux. Égouttez soigneusement.",
             "3. Écrasez au presse-purée ou à la fourchette. Incorporez progressivement le lait, le beurre, le skyr ou l'huile uniquement si l'ingrédient figure dans la liste.",
             "4. Goûtez, rectifiez avec les assaisonnements présents dans la fiche et servez chaud."]
    elif has(r"légume|legume|ratatouille|poêlée|poelee|wok"):
        out=[f"1. Lavez les légumes listés ({vegnames}); coupez-les en morceaux réguliers et émincez l'oignon s'il est indiqué.",
             "2. Faites chauffer l'huile listée dans une sauteuse. Faites revenir l'oignon 2 à 3 min, puis ajoutez les légumes les plus fermes et faites cuire 5 min en remuant.",
             "3. Ajoutez les légumes plus tendres et les tomates ou le bouillon uniquement s'ils sont listés. Couvrez partiellement et poursuivez 8 à 15 min à feu moyen-doux jusqu'à ce que les légumes soient tendres.",
             "4. Ajoutez les herbes, épices ou le fromage listés en fin de cuisson. Goûtez et servez sans ajouter d'ingrédient absent de la fiche."]
    elif has(r"poulet|dinde|bœuf|boeuf|viande|merguez|boulettes|steak|porc"):
        out=[f"1. Préparez les légumes listés ({vegnames}); coupez-les régulièrement. Séchez la viande crue et détaillez-la si nécessaire.",
             "2. Faites chauffer l'huile listée dans une sauteuse. Faites dorer la viande en plusieurs fois si nécessaire, en retournant les morceaux pour colorer les faces.",
             "3. Ajoutez l'oignon et les légumes les plus fermes; faites revenir 5 à 8 min. Incorporez tomates, bouillon ou sauce uniquement s'ils sont indiqués dans les ingrédients.",
             "4. Couvrez et laissez mijoter 15 à 25 min à feu doux selon la taille des morceaux, jusqu'à ce que la viande soit cuite à cœur et les légumes tendres. Remuez de temps en temps.",
             "5. Ajoutez le produit laitier ou le fromage listé en fin de cuisson à feu doux. Servez avec l'accompagnement explicitement indiqué."]
    else:
        out=[f"1. Préparez les ingrédients listés : lavez et coupez les légumes ({vegnames}), égouttez les conserves et pesez les féculents.",
             "2. Commencez par cuire le féculent réellement présent selon les indications du paquet ou jusqu'à tendreté; égouttez si nécessaire.",
             "3. Faites chauffer l'huile listée et ajoutez les ingrédients selon leur temps de cuisson, des plus fermes aux plus tendres. Remuez régulièrement.",
             "4. Ajoutez seulement les assaisonnements présents dans la liste. Vérifiez la cuisson et la texture, goûtez puis servez."]
    return out
n=0; synced=0
for r in d.get("recipes",[]):
    if re.search(r"vide.?frigo",r.get("name",""),re.I): continue
    steps=r.get("steps")
    if not isinstance(steps,list) or not any(GEN.search(str(x)) for x in steps): continue
    new=make_steps(r); r["steps"]=new; n+=1
    for sec in r.get("sections",[]):
        if re.search(r"préparation|preparation|⏱",sec.get("title",""),re.I) and isinstance(sec.get("lines"),list):
            sec["lines"]=new[:]; synced+=1
p.write_text(json.dumps(d,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
print(f"Fiches réécrites : {n}; sections synchronisées : {synced}; Vide-Frigo inchangé.")

# Déclenchement explicite de la passe sur la branche de test.
