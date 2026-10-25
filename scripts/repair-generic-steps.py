#!/usr/bin/env python3
"""Remplace les étapes passe-partout par des consignes concrètes adaptées au type de recette.
Ne touche pas aux cartes Opération Vide-Frigo.
"""
import json, re, pathlib, sys
p = pathlib.Path("data/carnet.json")
data = json.loads(p.read_text(encoding="utf-8"))
PATTERNS = (
 "Coupez les légumes et aromates listés. Détaillez la viande",
 "Préparez et coupez les légumes, aromates et protéines listés.",
 "Lavez et séchez les crudités et les herbes.",
 "Lavez et essorez les légumes prévus;",
 "Rincez le riz si nécessaire et faites-le cuire selon les indications du paquet;",
 "Préchauffez le four à 180 °C. Lavez les légumes mentionnés",
 "Lavez et coupez les légumes listés en morceaux de taille régulière.",
 "Faites chauffer une poêle à feu moyen avec l’huile prévue",
 "Coupez les légumes et les protéines indiqués en petits morceaux.",
 "Faites cuire les légumes selon la méthode adaptée au plat :",
)
def family(name, ing):
 n=name.lower(); s=" ".join(ing).lower()
 if re.search(r"wrap|burger|tartine|sandwich|tortilla wrap",n): return "wrap"
 if re.search(r"salade|bowl|assiette fraîcheur|taboulé",n) and "chaud" not in n: return "cold"
 if re.search(r"pancake|crêpe|pâte à crêpes",n): return "pancake"
 if re.search(r"purée|écrasé",n): return "puree"
 if re.search(r"lasagne|gratin|tian",n): return "bake"
 if "risotto" in n: return "risotto"
 if re.search(r"riz cantonais|riz sauté|paëlla|riz façon|riz.*poulet",n): return "rice"
 if re.search(r"pâtes|penne|mac and cheese|one pot|nouilles|wok|blé façon",n): return "pasta"
 if re.search(r"omelette|œufs|oeufs|tortilla espagnole",n): return "egg"
 if re.search(r"soupe|velouté",n): return "soup"
 if re.search(r"poisson|cabillaud|saumon|thon|maquereau|brandade",n): return "fish"
 if re.search(r"curry|chili|blanquette|couscous|bolognaise|ratatouille|basquaise|poivrons farcis|sauté|mijoté|merguez|boulettes",n): return "stew"
 if re.search(r"poulet|porc|bœuf|boeuf|veau|viande|escalope",n) and re.search(r"courgette|carotte|poivron|tomate|légume|pomme de terre",s): return "meatveg"
 return "pan"
def details(ing):
 s=" ".join(ing).lower()
 out=[]
 for pat, label in [(r"courgette","courgettes"),(r"carotte","carottes"),(r"poivron","poivrons"),(r"tomate","tomates"),(r"poireau","poireaux"),(r"champignon","champignons"),(r"oignon","oignon"),(r"pomme de terre","pommes de terre"),(r"chou","chou"),(r"épinard|epinard","épinards"),(r"brocoli","brocoli"),(r"concombre","concombre"),(r"salade","salade")]:
  if re.search(pat,s): out.append(label)
 return ", ".join(out[:4]) or "les légumes indiqués"
def steps_for(r):
 name=r.get("name","ce plat"); ing=r.get("ingredients",[]); s=" ".join(ing).lower(); veg=details(ing)
 meat=("poulet" if "poulet" in s else "bœuf" if re.search(r"bœuf|boeuf",s) else "porc" if "porc" in s else "veau" if "veau" in s else "poisson" if re.search(r"poisson|cabillaud|saumon|thon|maquereau|crevette",s) else "tofu" if "tofu" in s else "protéine")
 f=family(name,ing)
 if f=="wrap":
  return [f"1. Préparez la garniture de {name.lower()} : lavez et essorez les crudités, coupez les tomates et les autres légumes en fines tranches, puis égouttez les condiments prévus.",f"2. Faites cuire les steaks ou le poulet dans une poêle chaude légèrement huilée, en les retournant jusqu’à cuisson complète (74 °C à cœur pour le poulet; 71 °C pour la viande hachée). Pour une garniture froide ou végétale, préparez directement les éléments listés.", "3. Mélangez les ingrédients de la sauce prévus dans la fiche, puis faites tiédir les pains ou tortillas 30 à 60 secondes dans une poêle sèche.", "4. Garnissez chaque pain avec la sauce, la protéine, le fromage et les crudités présents dans la liste. Ajoutez les cornichons ou herbes s’ils sont prévus, refermez et servez sans attendre."]
 if f=="cold":
  return ["1. Faites cuire les ingrédients qui doivent être servis froids (riz, pommes de terre, œufs ou céréales lorsqu’ils figurent dans la liste), puis laissez-les refroidir rapidement.",f"2. Lavez et séchez les crudités. Coupez {veg} en morceaux réguliers et égouttez les conserves ou ingrédients en bocal.","3. Mélangez l’huile, le citron ou vinaigre et les herbes présents dans la liste; goûtez avant d’ajouter le sel.","4. Répartissez les éléments dans les assiettes ou bols, ajoutez la sauce juste avant de servir et gardez au réfrigérateur si le repas est préparé à l’avance."]
 if f=="pancake":
  return ["1. Versez la farine et le sel dans un saladier. Ajoutez les œufs indiqués et fouettez jusqu’à ce que la pâte commence à se former.","2. Incorporez progressivement le lait et le fromage blanc ou yaourt s’ils figurent dans la liste. Fouettez jusqu’à obtenir une pâte homogène sans grumeaux.","3. Laissez reposer 5 à 10 minutes si le temps le permet.","4. Chauffez une poêle antiadhésive légèrement huilée. Versez une petite louche de pâte et faites cuire 1 à 2 minutes par face, jusqu’à ce que le dessous soit doré et le dessus non liquide."]
 if f=="puree":
  return ["1. Épluchez les pommes de terre et les carottes ou poireaux mentionnés, puis coupez-les en dés de 2 à 3 cm pour une cuisson uniforme.","2. Déposez-les dans une casserole d’eau froide salée, portez à ébullition puis laissez cuire 15 à 20 minutes, jusqu’à ce qu’un couteau traverse facilement les morceaux.","3. Égouttez soigneusement. Ajoutez le lait et le beurre indiqués petit à petit, puis écrasez au presse-purée ou à la fourchette jusqu’à la texture souhaitée.","4. Incorporez les herbes et le poivre listés, goûtez et rectifiez l’assaisonnement. Servez chaud."]
 if f=="bake":
  return [f"1. Préchauffez le four à 180 °C. Lavez et coupez {veg} en tranches ou petits morceaux; épluchez les pommes de terre si elles figurent dans la liste.","2. Faites précuire 5 à 8 minutes à la poêle les légumes qui rendent beaucoup d’eau. Faites cuire séparément la viande crue avant de l’incorporer.","3. Dans un plat légèrement huilé, alternez les légumes et les éléments prévus dans la recette. Répartissez uniformément la crème, la sauce ou le fromage uniquement s’ils sont indiqués.","4. Enfournez 25 à 40 minutes selon l’épaisseur, jusqu’à ce que les légumes soient tendres et le dessus doré. Vérifiez le centre avec la pointe d’un couteau et laissez reposer 5 minutes."]
 if f=="risotto":
  return [f"1. Émincez l’oignon et coupez {veg} en petits dés. Faites chauffer le bouillon indiqué et gardez-le chaud.","2. Dans une sauteuse, faites revenir l’oignon dans l’huile ou le beurre listé pendant 2 à 3 minutes. Ajoutez le riz à risotto et remuez 1 minute pour enrober les grains.","3. Versez une louche de bouillon chaud et remuez régulièrement. Ajoutez le bouillon progressivement dès qu’il est absorbé, pendant 18 à 20 minutes; incorporez les légumes selon leur temps de cuisson.","4. Quand le riz est tendre mais encore légèrement ferme, retirez du feu et incorporez le parmesan ou fromage indiqué. Poivrez, laissez reposer 2 minutes et servez crémeux."]
 if f=="rice":
  return ["1. Rincez le riz si nécessaire, puis faites-le cuire dans l’eau selon le temps du paquet. Égouttez-le; pour un riz sauté, laissez-le refroidir avant de le mettre à la poêle.",f"2. Coupez {veg} en petits dés ou fines lamelles. Détaillez le {meat} et le jambon ou les crevettes s’ils figurent dans la liste; battez les œufs prévus dans un bol.","3. Faites chauffer l’huile dans une grande poêle. Saisissez la protéine crue jusqu’à cuisson complète, puis réservez. Faites revenir les légumes 4 à 6 minutes; ajoutez les œufs et brouillez-les si la recette en contient.","4. Ajoutez le riz cuit, la protéine réservée et la sauce soja ou les épices listées. Faites sauter 3 à 5 minutes en remuant pour tout réchauffer, goûtez et servez."]
 if f=="pasta":
  return ["1. Portez une grande casserole d’eau salée à ébullition. Faites cuire les pâtes ou nouilles selon le temps du paquet, puis égouttez-les en réservant une petite tasse d’eau de cuisson.",f"2. Émincez l’oignon et coupez {veg} en morceaux. Faites revenir les aromates dans l’huile indiquée pendant 2 à 3 minutes; ajoutez les légumes et cuisez jusqu’à ce qu’ils soient tendres.",f"3. Si la recette contient du {meat}, faites-le cuire dans la poêle jusqu’à cuisson complète avant d’ajouter la sauce ou les légumes. Incorporez ensuite la tomate, la crème ou le liquide indiqué et laissez mijoter 3 à 5 minutes.","4. Ajoutez les pâtes égouttées et mélangez 1 à 2 minutes pour les enrober. Incorporez le fromage ou les herbes listés et un peu d’eau de cuisson si nécessaire; servez immédiatement."]
 if f=="egg":
  return [f"1. Épluchez et coupez {veg} en petits morceaux. Faites précuire à la vapeur ou dans l’eau les légumes ou pommes de terre qui le nécessitent, puis égouttez-les bien.","2. Battez les œufs dans un saladier avec le sel, le poivre et les herbes indiqués. Incorporez les légumes préparés et le fromage s’il est prévu.","3. Chauffez une poêle antiadhésive avec l’huile indiquée. Versez le mélange, baissez à feu doux et cuisez 5 à 8 minutes jusqu’à ce que le dessous soit pris.","4. Retournez avec une assiette si nécessaire et cuisez encore 3 à 5 minutes, jusqu’à ce que le centre soit pris. Pour une omelette, repliez-la dès que le dessus est encore légèrement moelleux; servez aussitôt."]
 if f=="soup":
  return [f"1. Nettoyez les légumes prévus et coupez {veg} en dés de taille similaire. Émincez l’oignon ou l’ail s’ils figurent dans la liste.","2. Faites revenir les aromates 2 à 3 minutes dans la matière grasse indiquée, sans les colorer. Ajoutez les légumes et remuez pour les enrober.","3. Versez le bouillon ou l’eau indiqués à hauteur, portez à ébullition puis laissez frémir 15 à 25 minutes, jusqu’à ce que les légumes soient tendres.","4. Mixez jusqu’à obtenir la texture souhaitée. Incorporez la crème, le skyr ou les garnitures uniquement s’ils sont prévus, rectifiez l’assaisonnement et servez chaud."]
 if f=="fish":
  return [f"1. Préchauffez le four à 180 °C si la recette prévoit une cuisson au four. Séchez le poisson et coupez {veg} en morceaux; préparez les herbes et le citron listés.","2. Faites revenir les légumes dans l’huile indiquée pendant 4 à 6 minutes, jusqu’à ce qu’ils commencent à s’attendrir. Répartissez-les dans un plat ou gardez-les dans la poêle.","3. Ajoutez le poisson, les tomates ou le liquide prévus et assaisonnez avec les herbes listées. Faites cuire au four 12 à 20 minutes selon l’épaisseur, ou à couvert à feu doux, jusqu’à ce que la chair soit opaque et se détache facilement.","4. Ajoutez le citron et la sauce prévue en fin de cuisson. Vérifiez qu’il ne reste pas de chair translucide, goûtez l’assaisonnement et servez avec l’accompagnement indiqué."]
 if f in ("stew","meatveg"):
  return [f"1. Émincez l’oignon et l’ail, puis coupez {veg} en morceaux réguliers. Égouttez les légumineuses si elles figurent dans la liste et préparez les épices et le liquide.",f"2. Faites chauffer l’huile dans une cocotte ou sauteuse. Faites dorer le {meat} par petites quantités; ajoutez l’oignon et l’ail, puis faites revenir 2 à 3 minutes sans brûler les aromates.",f"3. Ajoutez les légumes, les tomates, le bouillon ou le lait de coco et les épices réellement indiqués. Mélangez, couvrez partiellement et laissez mijoter 20 à 30 minutes, en remuant de temps en temps.",f"4. Vérifiez que le {meat} est cuit à cœur (74 °C pour le poulet) et que les légumes sont tendres. Ajustez la sauce avec un peu d’eau si elle réduit trop, goûtez et rectifiez l’assaisonnement, puis servez avec l’accompagnement prévu."]
 return [f"1. Sortez et mesurez les ingrédients listés pour « {name} ». Lavez les légumes et coupez-les en morceaux réguliers; émincez les aromates indiqués.","2. Faites chauffer la matière grasse prévue dans une poêle ou casserole adaptée. Faites revenir les aromates 2 à 3 minutes, puis ajoutez les ingrédients qui demandent une cuisson plus longue.","3. Incorporez les autres ingrédients dans l’ordre de leur temps de cuisson, ajoutez uniquement le liquide et les assaisonnements indiqués, puis faites cuire en remuant régulièrement jusqu’à ce que les éléments soient cuits.","4. Vérifiez la cuisson et la texture, goûtez puis rectifiez l’assaisonnement avec les ingrédients de la liste. Servez chaud et ajoutez les herbes ou garnitures prévues au dernier moment."]
changed=0
for r in data.get("recipes",[]):
 rid=str(r.get("id",""))
 if rid.startswith("cco-vide-frigo-"): continue
 old=r.get("steps")
 if not isinstance(old,list) or not any(any(p in str(s) for p in PATTERNS) for s in old): continue
 new=steps_for(r)
 r["steps"]=new
 for sec in r.get("sections",[]):
  if re.search("préparation",str(sec.get("title","")),re.I) and isinstance(sec.get("lines"),list) and any(any(p in str(line) for p in PATTERNS) for line in sec["lines"]):
   sec["lines"]=new[:]
 changed+=1
print(f"Étapes corrigées: {changed}")
if changed < 100: raise SystemExit("Arrêt de sécurité: trop peu de fiches reconnues.")
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
