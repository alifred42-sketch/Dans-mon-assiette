#!/usr/bin/env python3
"""Replace generic recipe instructions with title/ingredient-aware instructions.
Never edits intentional Opération Vide-Frigo cards."""
import json, re, subprocess
from pathlib import Path
P=Path("data/carnet.json")
d=json.loads(P.read_text(encoding="utf-8"))
bad=re.compile(r"la base crémeuse|la protéine si elle est crue|les ingrédients prévus|rectifiez uniquement|si la cuisson est au four|s’il est listé|s'il est listé|selon leur temps de cuisson|avec les seuls ingrédients prévus|les légumes prévus|la sauce ou les condiments indiqués|les assaisonnements prévus|faites cuire complètement les ingrédients crus|mélangez la base crémeuse|dans les assiettes, les wraps ou les contenants|coupez les légumes et les garnitures en morceaux adaptés|ingrédients listés|s'ils sont présents|produit laitier listé|aromates listés|incorporez progressivement les ingrédients listés|préparation homogène|assaisonnements listés|selon les indications|préchauffez le four à 190 °C si nécessaire|matière grasse prévue|jusqu’à ce que les éléments soient cuits|vérifiez la cuisson et la texture",re.I)
def clean(x): return re.sub(r"^\s*\d+\.\s*","",str(x or "")).strip()
def pick(a,pat,fb):
    return next((clean(x) for x in a if re.search(pat,x,re.I)),fb)
def picks(a,pat,fb):
    z=[clean(x) for x in a if re.search(pat,x,re.I)][:4]
    return ", ".join(z) if z else fb
def make(r):
    raw_name=(r.get("name") or "").strip()
    n=re.sub(r"^[^\w]+","",raw_name.lower()).strip()
    a=r.get("ingredients") or []
    v=picks(a,r"courgette|tomate|poivron|carotte|poireau|oignon|concombre|salade|champignon|épinard|légume|pomme de terre|ail","")
    p=pick(a,r"poulet|dinde|bœuf|boeuf|viande|merguez|boulette|cabillaud|colin|saumon|maquereau|thon|poisson|crevette|jambon|œuf|oeuf","")
    st=pick(a,r"pâtes|penne|spaghetti|riz|nouilles|quinoa|lentilles|pommes de terre|pain|wrap|lasagnes|gnocchi|semoule|couscous","")
    dairy=pick(a,r"skyr|yaourt|fromage blanc|crème|parmesan|mozzarella|chèvre|fromage frais|béchamel","")
    cit=pick(a,r"citron",""); oil=pick(a,r"huile","")
    herbs=picks(a,r"herbe|basilic|persil|ciboulette|aneth|menthe|origan|paprika|curry|épice|moutarde|poivre|sel|ail|gingembre|soja|sésame","")
    liquid=pick(a,r"bouillon|eau|lait|crème|passata|tomates concassées|coulis|lait de coco","")
    if re.search(r"wrap|tartine|burger|sandwich|panini",n):
        return [f"1. Lavez puis coupez {v or 'les crudités de la liste'} en fines lamelles; égouttez le thon ou les autres conserves s’il y en a.",f"2. Si la garniture principale est crue, faites-la cuire à cœur dans une poêle chaude avec {oil or 'la matière grasse indiquée'}; laissez reposer 3 minutes puis coupez-la en morceaux.",f"3. Mélangez les éléments de sauce réellement présents dans la liste. Réchauffez les galettes ou le pain 30 secondes si vous souhaitez un résultat chaud.",f"4. Répartissez {p or 'la garniture préparée'} et {v or 'les crudités'} sur les galettes ou le pain, ajoutez la sauce et roulez ou refermez juste avant de servir."]
    if re.search(r"salade|bowl|taboulé|crudité",n):
        return [f"1. Rincez et essorez la salade si elle est indiquée; coupez {v or 'les légumes de la liste'} et égouttez les conserves.",f"2. Faites cuire {p} seulement si cet ingrédient est cru; laissez-le refroidir avant de l’ajouter aux crudités.",f"3. Mélangez {oil or 'la matière grasse indiquée'} avec {cit or herbs or 'les condiments de la liste'} pour préparer l’assaisonnement, puis versez-le sur les ingrédients.", "4. Mélangez délicatement, ajoutez les ingrédients fragiles en dernier et gardez au frais jusqu’au service."]
    if re.search(r"^(?:sauce tomate|sauce bolognaise)",n):
        return [f"1. Émincez l’oignon et l’ail s’ils figurent dans la liste; râpez la carotte si elle est prévue.",f"2. Faites chauffer {oil or 'la matière grasse indiquée'} dans une casserole et faites revenir les aromates 3 à 4 minutes sans les colorer.",f"3. Ajoutez les tomates ou le coulis prévu ({liquid or 'tomates indiquées'}) et les herbes de la liste ({herbs}); mélangez puis laissez mijoter à feu doux 20 à 25 minutes en remuant de temps en temps.", "4. Goûtez, rectifiez avec les assaisonnements listés et mixez seulement si vous souhaitez une sauce lisse. Laissez refroidir avant de conserver au frais."]
    if re.search(r"^(?:sauce|marinade|tzatziki|béchamel|bechamel|pesto|tartinade|vinaigrette|rillettes|houmous|hoummous|tapenade)",n):
        return [f"1. Préparez les ingrédients de « {raw_name} »; égouttez les conserves et hachez les aromates prévus ({herbs}) si nécessaire.",f"2. Placez la base de la sauce et les ingrédients de la liste dans un bol ou un récipient haut.",f"3. Fouettez ou mixez jusqu’à obtenir la texture souhaitée; ajoutez {cit or herbs or 'les condiments de la liste'} progressivement si la recette le demande.",f"4. Goûtez, rectifiez avec les assaisonnements de la liste, puis réservez au frais dans un récipient fermé."]
    if re.search(r"micro.?onde|mug|minute en bol",n):
        return [f"1. Coupez finement {v or 'les ingrédients de la liste'} et placez-les avec {st or 'le féculent indiqué'} dans un grand bol compatible micro-ondes.",f"2. Versez {liquid or 'le liquide prévu dans la liste'} et mélangez. Couvrez sans fermer hermétiquement pour laisser la vapeur s’échapper.", "3. Faites chauffer par séquences de 1 à 2 minutes en mélangeant entre chaque; poursuivez jusqu’à ce que le féculent soit tendre et que les ingrédients soient cuits.",f"4. Laissez reposer 1 minute avant d’ouvrir. Incorporez {herbs or 'les condiments indiqués'} et vérifiez la cuisson avant de servir."]
    if re.search(r"soupe|velouté|potage|minestrone",n):
        return [f"1. Coupez {v or 'les légumes de la liste'} en dés réguliers et émincez l’oignon ou l’ail s’ils sont présents.",f"2. Faites revenir les aromates 3 minutes dans {oil or 'la matière grasse indiquée'}, puis ajoutez les légumes et {liquid or 'le bouillon prévu'}.", "3. Couvrez et laissez frémir 20 à 25 minutes, jusqu’à ce que les légumes soient tendres sous la pointe d’un couteau.",f"4. Mixez si le titre annonce un velouté; incorporez {dairy} seulement s’il figure dans la liste, goûtez et servez chaud."]
    if "risotto" in n:
        return [f"1. Émincez l’oignon et coupez {v or 'les légumes indiqués'} en petits dés; gardez {liquid or 'le bouillon indiqué'} chaud.",f"2. Faites revenir l’oignon dans {oil or 'la matière grasse indiquée'} 2 à 3 minutes, ajoutez le riz à risotto et remuez 1 minute.", "3. Versez le bouillon chaud petit à petit en remuant pendant 18 à 20 minutes; ajoutez les légumes au cours de la cuisson selon leur fermeté.",f"4. Quand le riz est tendre mais encore légèrement ferme, incorporez {dairy or 'le fromage indiqué'} s’il figure dans la liste et laissez reposer 2 minutes."]
    if re.search(r"pâtes|penne|spaghetti|nouilles|gnocchi|tortellini|one.?pot|riz pilaf|wok",n):
        return [f"1. Coupez {v or 'les légumes de la liste'} en morceaux réguliers et préparez {p or 'la garniture prévue'}.",f"2. Faites chauffer {oil or 'la matière grasse indiquée'} dans une grande poêle; faites revenir les légumes 5 à 7 minutes en remuant.",f"3. Faites cuire {st or 'le féculent indiqué'} selon le paquet, sauf pour un plat « one pot » où il cuit dans la casserole avec {liquid or 'le liquide prévu'}. Ajoutez {p or 'la garniture'} et faites cuire à cœur si elle est crue.",f"4. Mélangez le féculent, les légumes et les condiments de la liste 2 à 3 minutes à feu moyen; goûtez et servez chaud."]
    if re.search(r"poisson|saumon|cabillaud|colin|maquereau|thon|papillote|crevette|brandade",n):
        if re.search(r"pommes? de terre|haricots verts|légumes vapeur",n) or (re.search(r"pommes? de terre", " ".join(a),re.I) and re.search(r"haricots verts", " ".join(a),re.I) and not re.search(r"four|rôti|roti|papillote|gratin",n)):
            return [f"1. Épluchez si nécessaire les pommes de terre et coupez-les en morceaux réguliers; rincez les haricots verts s’ils figurent dans la liste.", "2. Faites cuire les pommes de terre dans une casserole d’eau frémissante 15 à 20 minutes; ajoutez les haricots verts pour les 8 à 10 dernières minutes ou cuisez-les à la vapeur à part.",f"3. Faites cuire {p or 'le poisson indiqué'} dans une poêle avec {oil or 'la matière grasse indiquée'} à feu moyen, environ 3 à 5 minutes de chaque côté selon l’épaisseur, jusqu’à ce que la chair soit opaque et se détache facilement.",f"4. Mélangez {dairy or 'la base de sauce indiquée'} avec {cit or herbs or 'les condiments listés'} pour la sauce si ces ingrédients figurent dans la liste. Égouttez les légumes et servez avec le poisson."]
        oven=bool(re.search(r"four|rôti|roti|papillote|gratin|croustillant",n))
        if oven:
            return [f"1. Préchauffez le four à 180 °C. Coupez {v or 'les légumes de la liste'} en morceaux réguliers et séchez {p or 'le poisson indiqué'} avec du papier absorbant.",f"2. Étalez les légumes dans le plat ou sur le papier cuisson; ajoutez {oil or 'la matière grasse indiquée'} et {herbs or 'les aromates de la liste'}, puis posez le poisson par-dessus.",f"3. Enfournez 15 à 22 minutes selon l’épaisseur du poisson. Si les légumes ne sont pas tendres quand le poisson est cuit, retirez le poisson et poursuivez les légumes quelques minutes.",f"4. Vérifiez que le poisson est opaque à cœur et se détache facilement. Ajoutez {cit or 'les herbes prévues'} en fin de cuisson et servez avec {st or 'l’accompagnement de la liste'}."]
        return [f"1. Coupez {v or 'les légumes de la liste'} et séchez {p or 'le poisson indiqué'}; préparez {herbs or 'les aromates prévus'}.",f"2. Faites chauffer {oil or 'la matière grasse indiquée'} dans une poêle et faites revenir les légumes les plus fermes 4 à 6 minutes.",f"3. Ajoutez le poisson et {liquid or cit or 'la sauce indiquée'} s’ils figurent dans la liste; faites cuire à feu moyen sans trop remuer, jusqu’à ce que la chair soit opaque.",f"4. Vérifiez la cuisson au centre du morceau le plus épais, ajoutez {cit or 'les herbes prévues'} et servez avec {st or 'l’accompagnement indiqué'}."]
    if re.search(r"gratin|lasagne|parmentier|moussaka|quiche|pizza|tarte|hachis",n):
        return [f"1. Préchauffez le four à 180 °C. Coupez {v or 'les légumes de la liste'}; précuisez les pommes de terre, pâtes ou légumes fermes s’ils sont crus.",f"2. Faites revenir les légumes 5 à 8 minutes dans {oil or 'la matière grasse indiquée'}; faites cuire {p or 'la garniture'} à cœur si elle est crue.", "3. Disposez les éléments dans le plat ou sur la pâte. Ajoutez uniquement la sauce et le fromage qui figurent dans les ingrédients.", "4. Enfournez 25 à 35 minutes, jusqu’à ce que le centre soit chaud et le dessus doré; laissez reposer 5 minutes avant de couper."]
    if re.search(r"curry|chili|tajine|couscous|blanquette|bolognaise|ragoût|ragout|mijot|boulettes|merguez|poêlée|poelee",n):
        return [f"1. Émincez les aromates et coupez {v or 'les légumes de la liste'} en morceaux réguliers; égouttez les légumineuses si elles sont prévues.",f"2. Faites revenir les aromates 2 à 3 minutes dans {oil or 'la matière grasse indiquée'}; ajoutez {herbs or 'les épices prévues'} et remuez 30 secondes.",f"3. Ajoutez {p or 'la garniture prévue'} et faites-la dorer si elle est crue. Incorporez les légumes et {liquid or 'le liquide de la liste'}, couvrez et laissez mijoter doucement jusqu’à ce que les ingrédients soient cuits.", "4. Vérifiez que la viande est cuite à cœur et les légumes tendres; goûtez, rectifiez avec les assaisonnements de la liste et servez avec l’accompagnement prévu."]
    if re.search(r"purée|puree|écrasé|ecrase|légumes rôtis|legumes rotis|ratatouille|poivrons farcis",n):
        return [f"1. Lavez et coupez {v or 'les légumes de la liste'} en morceaux de taille comparable.",f"2. Pour une cuisson au four, mélangez les légumes avec {oil or 'la matière grasse indiquée'} et {herbs or 'les aromates prévus'} puis étalez-les sur une plaque; pour une purée, faites-les cuire dans l’eau frémissante.", "3. Vérifiez la cuisson avec la pointe d’un couteau; égouttez soigneusement les légumes destinés à être écrasés ou retournez les légumes rôtis à mi-cuisson.", "4. Écrasez les légumes si le titre l’indique et incorporez uniquement les produits crémeux présents dans la liste; goûtez et servez chaud."]
    return [f"1. Préparez les ingrédients de « {raw_name} » : coupez {v or 'les légumes de la liste'} et émincez les aromates indiqués.",f"2. Faites revenir les aromates 2 à 3 minutes dans {oil or 'la matière grasse indiquée'}, sans les faire brûler.",f"3. Ajoutez {p or 'la garniture prévue'} et les autres ingrédients selon leur temps de cuisson; versez {liquid or 'le liquide de la liste'} seulement s’il est prévu.", "4. Vérifiez que chaque ingrédient est cuit, goûtez et rectifiez avec les assaisonnements présents dans la liste."]
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
