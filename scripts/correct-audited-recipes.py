#!/usr/bin/env python3
"""Quality corrections for recipe cards; intentionally leaves Opération Vide-Frigo contents untouched."""
import json, re, unicodedata
from pathlib import Path

p = Path("data/carnet.json")
d = json.loads(p.read_text(encoding="utf-8"))
recipes = d.get("recipes", [])
by = {r.get("id"): r for r in recipes}

def norm(s):
    s = unicodedata.normalize("NFD", str(s).lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", s).strip()

def clean_numbered_name(s):
    if not isinstance(s, str): return s
    # Remove editorial recipe numbering, retaining emoji and the actual recipe name.
    s = re.sub(r"^(\s*(?:🤖\s*)?)(.*?)(?:RECETTE\s*(?:N[°ºo]\s*)?\d+\s*[—–:-]\s*|(?:N[°ºo]\s*)?\d+\s*[—–:-]\s*)(?=\S)", r"\1", s, flags=re.I)
    s = re.sub(r"^\s*(🤖\s*)?RECETTE\s*N[°ºo]\s*\d+\s*[—–:-]\s*", "", s, flags=re.I)
    s = re.sub(r"^(\s*[\U0001F300-\U0001FAFF\u2600-\u27BF]+\s*)RECETTE\s*\d+\s*[—–:-]\s*", r"\1", s, flags=re.I)
    return re.sub(r"\s+", " ", s).strip()

def sync_sections(r):
    ingredients = r.get("ingredients", [])
    steps = r.get("steps", [])
    for sec in r.get("sections", []):
        title = sec.get("title", "")
        if re.search(r"Ingrédients", title, re.I):
            sec["lines"] = ingredients[:]
        elif re.search(r"Préparation", title, re.I) and not re.search(r"temps|durée|⏱️", title, re.I):
            sec["lines"] = steps[:]
        elif re.search(r"Temps de préparation|⏱️ Préparation", title, re.I):
            if r.get("timePrep"): sec["title"] = "⏱️ Préparation : " + str(r["timePrep"])

def apply(rid, name=None, ingredients=None, steps=None, prep=None, cook=None, servings=None):
    r = by.get(rid)
    if not r: return
    if name is not None: r["name"] = name
    if ingredients is not None: r["ingredients"] = ingredients
    if steps is not None: r["steps"] = steps
    if prep is not None: r["timePrep"] = prep
    if cook is not None: r["timeCook"] = cook
    if servings is not None: r["servings"] = servings
    sync_sections(r)

# 1) Remove recipe numbers from titles and section headings.
for r in recipes:
    if r.get("name"): r["name"] = clean_numbered_name(r["name"])
    for sec in r.get("sections", []):
        if sec.get("title"): sec["title"] = clean_numbered_name(sec["title"])

# 2) Remove exact repeated ingredient rows everywhere except the intentional Opération Vide-Frigo cards.
removed_duplicate_rows = 0
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I): continue
    old = r.get("ingredients", [])
    seen, new = set(), []
    for item in old:
        key = norm(item)
        if key in seen:
            removed_duplicate_rows += 1
            continue
        seen.add(key)
        new.append(item)
    if len(new) != len(old):
        r["ingredients"] = new
        sync_sections(r)

# 3) Repair cards with obvious merged recipes, placeholder ingredients, or title/content mismatch.
apply("r-50e9f84517", "Chili con carne doux",
 ["500 g de bœuf haché","200 g de haricots rouges égouttés","400 g de tomates concassées","2 carottes","1 poivron rouge","1 oignon","2 gousses d’ail","1 c. à café de paprika fumé","1 c. à café de cumin","1 c. à café de piment doux (facultatif)","250 g de riz cru","Sel et poivre"],
 ["1. Émincez l’oignon et l’ail; coupez les carottes et le poivron en petits dés.","2. Faites revenir l’oignon, l’ail et les légumes dans un filet d’huile pendant 5 à 7 minutes.","3. Ajoutez le bœuf haché et faites-le cuire en l’émiettant jusqu’à ce qu’il ne soit plus rosé.","4. Incorporez les tomates, les haricots rouges et les épices. Laissez mijoter 25 à 30 minutes à feu doux.","5. Faites cuire le riz selon les indications du paquet et servez avec le chili."], "20 min","35 min",4)
apply("r-0e0f234326", "Poêlée tomate, courgette et œufs façon shakshuka",
 ["400 g de tomates concassées","1 courgette","1 oignon","4 œufs","1 gousse d’ail","1 c. à café de paprika doux","1 c. à café de cumin","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Émincez l’oignon et l’ail; coupez la courgette en petits dés.","2. Faites revenir l’oignon et la courgette dans l’huile pendant 5 à 7 minutes.","3. Ajoutez l’ail, les tomates, le paprika, le cumin, le sel et le poivre. Laissez mijoter 8 à 10 minutes.","4. Faites quatre creux dans la sauce, cassez un œuf dans chaque creux, couvrez et laissez cuire 6 à 8 minutes, jusqu’à ce que les blancs soient pris.","5. Servez chaud, avec du pain complet si souhaité."], "15 min","20 min",2)
apply("r-db349daa26", "Pizza fine au poulet et aux légumes",
 ["1 pâte à pizza fine","200 g de sauce tomate","400 g de blanc de poulet","200 g de champignons émincés","2 tomates","100 g de mozzarella","1 c. à soupe de basilic frais ciselé","1 c. à café d’origan","1 c. à café de paprika doux","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Préchauffez le four à 220 °C. Coupez le poulet en petits morceaux et émincez les champignons; coupez les tomates en rondelles.","2. Faites dorer le poulet dans l’huile pendant 6 à 8 minutes; assaisonnez.","3. Étalez la sauce tomate sur la pâte. Répartissez les champignons, le poulet, les tomates et la mozzarella; ajoutez l’origan.","4. Enfournez 12 à 15 minutes, jusqu’à ce que la pâte soit cuite et le fromage fondu. Parsemez de basilic."], "20 min","25 min",4)
apply("r-c8c2401e21", "Boulettes de poulet à la sauce tomate",
 ["600 g de poulet haché","1 oignon","2 gousses d’ail","1 œuf","30 g de chapelure","5 g de persil frais","500 g de sauce tomate","300 g de pâtes complètes","Sel et poivre"],
 ["1. Mélangez le poulet haché avec l’œuf, la chapelure, la moitié de l’oignon haché, le persil, le sel et le poivre.","2. Formez des boulettes de taille régulière.","3. Faites revenir le reste de l’oignon et l’ail hachés dans un filet d’huile. Ajoutez la sauce tomate et portez à frémissement.","4. Ajoutez les boulettes, couvrez et laissez mijoter 20 à 25 minutes; vérifiez que le poulet est bien cuit à cœur.","5. Faites cuire les pâtes selon le paquet et servez avec les boulettes et la sauce."], "20 min","30 min",4)
apply("r-b249d80354", "Nouilles chinoises au bœuf et aux légumes façon wok",
 ["400 g de bœuf émincé","300 g de nouilles chinoises","2 carottes","200 g de chou émincé","1 courgette","2 c. à soupe de sauce soja légère","2 gousses d’ail","2 c. à café de gingembre frais râpé","1 c. à soupe d’huile neutre","5 g de ciboulette","Poivre"],
 ["1. Faites cuire les nouilles selon le paquet, égouttez-les et réservez.","2. Coupez les carottes et la courgette en bâtonnets; émincez le chou et l’ail, râpez le gingembre.","3. Faites chauffer l’huile dans un wok. Saisissez le bœuf à feu vif 2 à 3 minutes, puis réservez.","4. Faites sauter les légumes 5 à 7 minutes. Remettez le bœuf, ajoutez la sauce soja et le gingembre; poursuivez jusqu’à cuisson complète.","5. Ajoutez les nouilles, mélangez 1 à 2 minutes et parsemez de ciboulette."], "15 min","15 min",4)
apply("r-816115df0d", "Poêlée de merguez aux légumes du soleil",
 ["2 merguez","2 courgettes","2 poivrons","3 tomates","1 oignon","1 c. à soupe d’huile d’olive","1 c. à café de cumin","1 c. à café de paprika","1 c. à soupe d’herbes aromatiques","300 g de semoule crue","Sel et poivre"],
 ["1. Coupez les courgettes, les poivrons, les tomates et l’oignon en morceaux.","2. Faites dorer les merguez dans une poêle; réservez et retirez l’excédent de graisse si nécessaire.","3. Faites revenir l’oignon et les légumes dans l’huile pendant 8 à 10 minutes. Ajoutez les épices, les herbes, le sel et le poivre.","4. Remettez les merguez, couvrez et laissez mijoter 10 à 15 minutes, jusqu’à cuisson complète.","5. Préparez la semoule selon le paquet et servez avec la poêlée."], "15 min","25 min",4)
apply("r-ec4ba6bb28", "Omelette aux légumes du soleil",
 ["8 œufs","2 courgettes","300 g de tomates","1 poivron","1 oignon","1 c. à café de paprika","1 c. à café d’herbes de Provence","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Coupez les courgettes, les tomates, le poivron et l’oignon en petits morceaux.","2. Faites revenir l’oignon, les courgettes et le poivron dans l’huile pendant 7 à 8 minutes; ajoutez les tomates et poursuivez 3 minutes.","3. Battez les œufs avec le paprika, les herbes, le sel et le poivre.","4. Versez les œufs sur les légumes et faites cuire à feu doux, en couvrant, jusqu’à ce que l’omelette soit prise."], "15 min","15 min",4)
apply("r-806ae50db7", "Couscous maison simplifié",
 ["400 g de poulet en morceaux","4 merguez","3 carottes","2 courgettes","2 navets","1 oignon","400 g de pois chiches égouttés","300 g de semoule crue","2 c. à soupe de concentré de tomate","2 c. à café de ras el hanout","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Émincez l’oignon et coupez les légumes en morceaux réguliers.","2. Faites revenir l’oignon et le poulet dans l’huile pendant 5 minutes.","3. Ajoutez les carottes, les navets, le concentré de tomate, le ras el hanout et de l’eau à hauteur. Laissez mijoter 20 minutes.","4. Ajoutez les courgettes et les pois chiches; poursuivez 15 à 20 minutes, jusqu’à cuisson complète.","5. Faites griller les merguez à part jusqu’à cuisson complète. Préparez la semoule selon le paquet et servez avec le bouillon et les légumes."], "20 min","40 min",4)
apply("r-8f155f716b", "Gratin de pâtes au poulet, courgettes et tomate",
 ["300 g de pâtes complètes","400 g de blanc de poulet","2 courgettes","300 g de tomates concassées","1 oignon","1 gousse d’ail","100 g de mozzarella râpée","1 c. à café d’herbes de Provence","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Préchauffez le four à 200 °C. Faites cuire les pâtes 2 minutes de moins que le temps indiqué, puis égouttez.","2. Coupez le poulet et les courgettes en morceaux. Faites revenir l’oignon et l’ail dans l’huile, ajoutez le poulet puis les courgettes.","3. Incorporez les tomates, les herbes, le sel et le poivre; laissez cuire 5 minutes.","4. Mélangez avec les pâtes, versez dans un plat et parsemez de mozzarella.","5. Enfournez 15 à 20 minutes jusqu’à ce que le gratin soit doré et le poulet bien cuit."], "20 min","30 min",4)
apply("r-2f064e3e7c", "Lasagnes légères au poulet, courgettes et tomate",
 ["8 à 10 feuilles de lasagnes","600 g de poulet haché","2 courgettes","400 g de tomates concassées","1 oignon","1 gousse d’ail","60 g de mozzarella râpée","1 c. à soupe de basilic frais","1 c. à café d’herbes de Provence","Sel et poivre"],
 ["1. Préchauffez le four à 190 °C. Émincez l’oignon et l’ail; râpez ou coupez finement les courgettes.","2. Faites revenir l’oignon et l’ail, ajoutez le poulet haché et faites-le cuire en l’émiettant.","3. Ajoutez les courgettes, les tomates, les herbes, le sel et le poivre; laissez mijoter 8 à 10 minutes.","4. Alternez dans un plat les feuilles de lasagnes et la préparation au poulet. Terminez par la mozzarella.","5. Enfournez 30 à 35 minutes, jusqu’à ce que les pâtes soient tendres."], "20 min","40 min",4)
apply("r-49588679c4", "Gratin de pâtes façon italienne",
 ["300 g de pâtes complètes","200 g de jambon blanc","200 g de champignons","1 courgette","300 g de sauce tomate","100 g de mozzarella","1 c. à café d’origan","1 c. à soupe de basilic frais","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Préchauffez le four à 200 °C. Faites cuire les pâtes selon le paquet, puis égouttez-les.","2. Émincez les champignons et coupez la courgette et le jambon en morceaux.","3. Faites revenir les légumes dans l’huile 6 à 8 minutes; ajoutez la sauce tomate, l’origan, le sel et le poivre.","4. Mélangez avec les pâtes et le jambon, versez dans un plat et ajoutez la mozzarella.","5. Faites gratiner 15 à 20 minutes. Servez chaud."], "15 min","30 min",4)
# Replace obvious placeholder cards with dishes that match their titles instead of generic vegetables.
apply("r-f1352e28e6", "Pain complet maison",
 ["500 g de farine complète","300 ml d’eau tiède","7 g de levure boulangère sèche","1 c. à café de sel","1 c. à soupe d’huile d’olive"],
 ["1. Mélangez la levure avec l’eau tiède et laissez reposer 5 minutes.","2. Ajoutez la farine, le sel et l’huile. Pétrissez 8 à 10 minutes jusqu’à obtenir une pâte souple.","3. Couvrez et laissez lever environ 1 heure, jusqu’à ce que la pâte double de volume.","4. Façonnez un pain, placez-le dans un moule et laissez lever 30 minutes.","5. Enfournez à 200 °C pendant 30 à 35 minutes. Laissez refroidir avant de trancher."], "20 min","35 min",1)
apply("r-28a62501be", "Écrasé de légumes maison",
 ["500 g de pommes de terre","300 g de carottes","1 courgette","1 c. à soupe d’huile d’olive","100 ml de lait ou boisson nature non sucrée","Sel et poivre","1 pincée de noix de muscade"],
 ["1. Épluchez les pommes de terre et les carottes; coupez-les en morceaux. Coupez la courgette.","2. Faites cuire les pommes de terre et les carottes dans l’eau bouillante 15 minutes. Ajoutez la courgette pour les 8 dernières minutes.","3. Égouttez en conservant un peu d’eau de cuisson.","4. Écrasez les légumes avec l’huile et le lait, en ajoutant un peu d’eau de cuisson si nécessaire.","5. Assaisonnez avec le sel, le poivre et la muscade; servez chaud."], "15 min","25 min",4)
apply("r-fa4268ac37", "Mélange croquant de noix",
 ["100 g de noix","50 g d’amandes","50 g de noisettes","1 pincée de cannelle (facultatif)"],
 ["1. Concassez grossièrement les noix, les amandes et les noisettes.","2. Mélangez et ajoutez la cannelle si souhaité.","3. Servez en petite portion nature ou avec un yaourt."], "5 min","0 min",4)
apply("r-9a7861ed08", "Légumes de saison rôtis au four",
 ["800 g de légumes de saison (carottes, courgettes, poivrons ou brocoli)","1 oignon rouge","1 c. à soupe d’huile d’olive","1 c. à café de paprika doux","1 c. à café d’herbes de Provence","Sel et poivre"],
 ["1. Préchauffez le four à 200 °C.","2. Lavez et coupez les légumes en morceaux de taille similaire; émincez l’oignon.","3. Mélangez les légumes avec l’huile, le paprika, les herbes, le sel et le poivre.","4. Étalez sur une plaque sans trop les superposer.","5. Faites rôtir 25 à 35 minutes, en remuant à mi-cuisson, jusqu’à ce que les légumes soient tendres et dorés."], "10 min","30 min",4)
apply("r-f756d2c53e", "Carrés de chocolat noir et fruits",
 ["100 g de chocolat noir","2 bananes","150 g de fraises ou framboises","1 c. à café de cacao non sucré (facultatif)"],
 ["1. Faites fondre le chocolat doucement au bain-marie ou au micro-ondes par courtes périodes.","2. Coupez les bananes en rondelles et les fruits en morceaux si nécessaire.","3. Trempez partiellement les fruits dans le chocolat fondu et posez-les sur du papier cuisson.","4. Réfrigérez 20 à 30 minutes jusqu’à ce que le chocolat durcisse."], "10 min","2 min",4)
apply("r-bac7e05aac", "Œufs au fromage",
 ["4 œufs","40 g de fromage râpé","1 c. à soupe de lait","1 c. à café d’huile d’olive","Ciboulette ciselée (facultatif)","Sel et poivre"],
 ["1. Battez les œufs avec le lait, le sel et le poivre.","2. Faites chauffer l’huile dans une poêle antiadhésive.","3. Versez les œufs et faites cuire à feu doux en remuant doucement.","4. Ajoutez le fromage râpé avant la fin de cuisson et laissez-le fondre.","5. Parsemez de ciboulette et servez immédiatement."], "5 min","7 min",2)
apply("r-43f1667b8e", "Tortillas garnies au bœuf et aux légumes",
 ["4 tortillas de blé","400 g de bœuf haché","2 poivrons","1 courgette","2 tomates","1 oignon","1 c. à soupe d’huile d’olive","1 c. à café de paprika","1 c. à café de cumin","1 citron","Sel et poivre"],
 ["1. Émincez l’oignon et coupez les poivrons, la courgette et les tomates en dés.","2. Faites revenir l’oignon et les poivrons dans l’huile 5 minutes.","3. Ajoutez le bœuf haché, le paprika, le cumin, le sel et le poivre; faites cuire en émiettant la viande.","4. Ajoutez la courgette et poursuivez 5 à 7 minutes, jusqu’à ce que la viande soit cuite et les légumes tendres.","5. Réchauffez les tortillas, garnissez-les de la préparation et ajoutez les tomates et un filet de citron."], "15 min","15 min",4)
apply("r-3f16c360b7", "Potée légère de légumes et poulet",
 ["400 g de poulet en morceaux","2 carottes","1 poireau","2 navets","2 pommes de terre","1 oignon","750 ml de bouillon de volaille","1 feuille de laurier","1 c. à café d’herbes de Provence","Sel et poivre"],
 ["1. Épluchez et coupez les carottes, les navets et les pommes de terre; émincez le poireau et l’oignon.","2. Faites revenir l’oignon dans une grande casserole avec un filet d’huile.","3. Ajoutez le poulet, les légumes, le bouillon, le laurier et les herbes.","4. Portez à ébullition puis laissez mijoter 30 à 35 minutes, jusqu’à ce que le poulet et les légumes soient cuits.","5. Retirez le laurier, rectifiez l’assaisonnement et servez chaud."], "15 min","40 min",4)
apply("r-7b8723ca0e", "Muffins salés aux courgettes et chèvre",
 ["1 courgette moyenne","2 œufs","120 g de farine complète","1 sachet de levure chimique","100 g de chèvre frais","50 ml de lait","1 c. à soupe d’huile d’olive","1 c. à café d’herbes de Provence","Poivre"],
 ["1. Préchauffez le four à 180 °C et râpez la courgette; pressez-la légèrement pour retirer l’excédent d’eau.","2. Battez les œufs avec le lait et l’huile.","3. Incorporez la farine, la levure, les herbes et le poivre, puis la courgette et le chèvre émietté.","4. Répartissez dans des moules à muffins graissés.","5. Enfournez 20 à 25 minutes, jusqu’à ce que les muffins soient dorés et cuits à cœur."], "15 min","25 min",4)
apply("r-1521ded2c8", "Colin à la moutarde douce et aux poireaux",
 ["400 g de filets de colin","2 poireaux","1 c. à soupe de moutarde douce","150 g de skyr nature","1 citron","1 c. à soupe d’herbes fraîches","500 g de pommes de terre","Sel et poivre"],
 ["1. Lavez les poireaux et coupez-les en rondelles; faites-les cuire à la vapeur ou à la poêle avec un peu d’eau pendant 10 minutes.","2. Faites cuire les pommes de terre à l’eau jusqu’à ce qu’elles soient tendres.","3. Mélangez le skyr, la moutarde, le jus de citron, les herbes, le sel et le poivre.","4. Faites cuire le colin à la vapeur ou au four à 180 °C pendant 10 à 12 minutes, jusqu’à ce qu’il se défasse facilement.","5. Servez le poisson avec les poireaux, les pommes de terre et la sauce moutarde."], "15 min","20 min",4)
apply("r-2687b67896", "Cabillaud au curry léger",
 ["400 g de dos de cabillaud","1 courgette","2 carottes","1 c. à café de curry doux","150 g de skyr nature","1 citron","300 g de riz complet cru","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Faites cuire le riz selon les indications du paquet.","2. Coupez la courgette et les carottes en petits morceaux; faites-les revenir dans l’huile 5 minutes.","3. Ajoutez le curry et 100 ml d’eau; laissez mijoter jusqu’à ce que les légumes soient presque tendres.","4. Ajoutez le cabillaud en morceaux et faites cuire doucement 6 à 8 minutes, jusqu’à ce qu’il soit opaque et se défasse facilement.","5. Hors du feu, incorporez le skyr et un peu de jus de citron. Servez avec le riz."], "15 min","20 min",4)
apply("r-c2861ee706", "Bowl dessert au skyr, fruits rouges et chocolat noir",
 ["600 g de skyr nature","300 g de fruits rouges frais ou surgelés","40 g de chocolat noir râpé","40 g d’amandes concassées","Cannelle ou vanille (facultatif)"],
 ["1. Répartissez le skyr dans quatre bols.","2. Ajoutez les fruits rouges.","3. Parsemez de chocolat noir râpé et d’amandes concassées.","4. Ajoutez un peu de cannelle ou de vanille si souhaité et servez frais."], "5 min","0 min",4)
apply("r-f8fd15f1a2", "Riz sauté thaï au poulet et aux légumes",
 ["300 g de riz cru","400 g de blanc de poulet","2 œufs","2 carottes","200 g de chou émincé","1 courgette","2 c. à soupe de sauce soja légère","2 gousses d’ail","1 citron vert","10 g de coriandre fraîche","1 c. à soupe d’huile neutre","Poivre"],
 ["1. Faites cuire le riz, idéalement à l’avance, puis laissez-le tiédir.","2. Coupez le poulet en petits morceaux et les légumes en fines lamelles; hachez l’ail.","3. Faites cuire le poulet dans l’huile chaude jusqu’à cuisson complète, puis réservez.","4. Faites sauter les légumes et l’ail 5 à 7 minutes. Poussez-les sur le côté et brouillez les œufs dans la poêle.","5. Ajoutez le riz, le poulet et la sauce soja; faites sauter 3 à 4 minutes. Ajoutez le jus de citron vert et la coriandre."], "20 min","20 min",4)
apply("r-5d51982087", "Tartines de tomates, œufs et fromage frais",
 ["4 grandes tranches de pain complet","2 tomates","4 œufs","100 g de fromage frais","1 c. à soupe d’herbes fraîches","Paprika doux (facultatif)","Sel et poivre"],
 ["1. Faites cuire les œufs 9 à 10 minutes dans l’eau bouillante, puis refroidissez-les et écalez-les.","2. Faites griller les tranches de pain.","3. Étalez le fromage frais sur le pain et ajoutez les tomates coupées en rondelles.","4. Coupez les œufs en quartiers, répartissez-les sur les tartines et assaisonnez avec les herbes, le paprika, le sel et le poivre."], "10 min","10 min",4)
apply("r-7d7c6a6118", "Merguez à la sauce tomate façon orientale",
 ["4 merguez","4 tomates mûres","2 poivrons","1 oignon","1 courgette","1 c. à soupe d’huile d’olive","1 c. à café de cumin","1 c. à café de paprika doux","5 g de coriandre fraîche","Sel et poivre"],
 ["1. Émincez l’oignon et coupez les poivrons, la courgette et les tomates en morceaux.","2. Faites dorer les merguez dans une poêle, puis réservez-les.","3. Faites revenir l’oignon et les poivrons dans l’huile pendant 5 minutes.","4. Ajoutez la courgette, les tomates, le cumin, le paprika, le sel et le poivre. Laissez mijoter 10 minutes.","5. Remettez les merguez et poursuivez la cuisson 10 à 12 minutes, jusqu’à ce qu’elles soient bien cuites. Parsemez de coriandre."], "15 min","25 min",4)
apply("r-3ad7aa939f", "Poivrons farcis à la viande et au riz",
 ["4 poivrons","400 g de viande hachée","200 g de riz cru","2 tomates","1 oignon","1 gousse d’ail","1 c. à soupe de basilic frais","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Préchauffez le four à 190 °C. Faites cuire le riz selon les indications du paquet, puis égouttez-le.","2. Coupez le haut des poivrons et retirez les graines. Émincez l’oignon et l’ail; coupez les tomates en dés.","3. Faites revenir l’oignon et l’ail dans l’huile, ajoutez la viande hachée et faites-la cuire en l’émiettant.","4. Mélangez la viande avec le riz, les tomates, le basilic, le sel et le poivre.","5. Garnissez les poivrons, placez-les dans un plat avec un petit fond d’eau et enfournez 35 à 45 minutes, jusqu’à ce que les poivrons soient tendres et la farce bien cuite."], "20 min","45 min",4)

# Fill missing times from recipe instructions and repair the last ambiguous ingredient.
if "student-microwave-044" in by:
    r = by["student-microwave-044"]
    r["ingredients"] = [("1 c. à café d’herbes de Provence" if norm(i) == "1 herbes" else i) for i in r.get("ingredients", [])]
    sync_sections(r)

def estimated_cook_minutes(recipe):
    total = 0
    cooking = re.compile(r"poêle|grille.?pain|micro.?ondes|bouilloire|faites cuire|faites chauffer|faites griller|enfournez|cuisez|cuisson|laissez cuire|faites dorer|faites revenir|faites sauter|infuser|gonfler", re.I)
    for step in recipe.get("steps", []):
        if not cooking.search(step): continue
        if re.search(r"réfrigérateur|frigo|toute la nuit|laissez reposer|repos", step, re.I): continue
        ranges = re.findall(r"(\d+)\s*(?:à|-)\s*(\d+)\s*(?:minutes|min)", step, re.I)
        singles = re.findall(r"(\d+)\s*(?:minutes|min)", step, re.I)
        if ranges: total += max(int(b) for a,b in ranges)
        elif singles: total += max(int(x) for x in singles)
    return total

time_filled = 0
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name",""), re.I): continue
    if r.get("timePrep") and r.get("timeCook"): continue
    n = len(r.get("ingredients", []))
    r["timePrep"] = r.get("timePrep") or ("15 min" if n >= 10 else "10 min" if n >= 5 else "5 min")
    if not r.get("timeCook"):
        minutes = estimated_cook_minutes(r)
        r["timeCook"] = f"{minutes} min" if minutes else "0 min"
    sync_sections(r)
    time_filled += 1

# Generic placeholder labels that are not a recipe title are corrected to coherent named preparations above.
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name",""), re.I): continue
    # Ensure title numbers are gone even from names that started with an emoji or an alternate format.
    r["name"] = clean_numbered_name(r.get("name",""))
    sync_sections(r)

p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Recipes={len(recipes)}; exact duplicate ingredient rows removed={removed_duplicate_rows}; explicit cards corrected={17}; numbering cleanup applied.")


# Normalize legacy ingredient rows to one clear quantity for shopping lists.
def normalize_quantity_row(value):
    if ":" not in str(value):
        return value
    left, right = [part.strip() for part in str(value).split(":", 1)]
    if not re.fullmatch(r"(?:\d+(?:[.,]\d+)?(?:/\d+)?|½|¼|un|une)(?:\s*(?:g|kg|ml|cl|l|gousse|gousses|c\.\s*à\s*(?:soupe|café)|cuillère\s+à\s+(?:soupe|café)|pincée|pincées|feuille|feuilles|bouquet|bouquets|pot|pots))?", right, re.I):
        return value
    m = re.match(r"^(\d+(?:[.,]\d+)?(?:/\d+)?|½|¼|un|une)(?:\s*(g|kg|ml|cl|l|gousses?|c\.\s*à\s*(?:soupe|café)|cuillère\s+à\s+(?:soupe|café)))?\s*(.*)$", left, re.I)
    name = m.group(3).strip() if m else left
    name = re.sub(r"^(?:de|du|des|d['’])\s*", "", name, flags=re.I)
    name = re.sub(r"^(?:gousse|gousses|cuillère\s+à\s+(?:soupe|café))\s+d['’]\s*", "", name, flags=re.I)
    name = re.sub(r"^d['’]\s*", "", name, flags=re.I).strip()
    if not name: return value
    if re.fullmatch(r"\d+(?:[.,]\d+)?", right): return right + " " + name
    if re.search(r"c\.\s*à\s*soupe|cuillère\s+à\s*soupe", right, re.I) and norm(name) in ("citron", "citron jaune", "citron vert"):
        name = "jus de " + name
    prep = "d’" if re.match(r"^[aeiouyhàâäéèêëîïôöùûü]", name, re.I) else "de "
    return right + " " + prep + name

for r in recipes:
    if re.search(r"vide.?frigo", r.get("name",""), re.I): continue
    old = r.get("ingredients", [])
    new = [normalize_quantity_row(i) for i in old]
    if new != old:
        r["ingredients"] = new
        sync_sections(r)
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

# Final safety cleanup for known malformed merged ingredient phrases.
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name",""), re.I): continue
    fixed = []
    for item in r.get("ingredients", []):
        v = str(item)
        v = re.sub(r"\b200\s*g\s+de\s+citron\b", "1 citron", v, flags=re.I)
        v = re.sub(r"\b\d+\s*g\s+d['’]ousse\s+d['’]lentilles\s+corail\b", "200 g de lentilles corail", v, flags=re.I)
        v = re.sub(r"\b\d+\s+gousse\s+d['’]ousse\s+d['’]ail\b", "1 gousse d’ail", v, flags=re.I)
        v = re.sub(r"\b\d+\s+gousse\s+d['’]\s*(?=\(|$)", "1 gousse d’ail ", v, flags=re.I)
        v = re.sub(r"\bd['’]ousse\s+d['’]ail\b", "d’ail", v, flags=re.I)
        v = re.sub(r"\bd['’]ciboulette\b", "de ciboulette", v, flags=re.I)
        v = re.sub(r"\bde\s+Huile d['’]olive\b", "d’huile d’olive", v, flags=re.I)
        v = re.sub(r"\bde\s+Oignon poudre\b", "d’oignon en poudre", v, flags=re.I)
        v = re.sub(r"\bd['’]Ail poudre\b", "d’ail en poudre", v, flags=re.I)
        v = re.sub(r"\b1\s+râpée de pinces\b", "1 pincée de noix de muscade râpée", v, flags=re.I)
        fixed.append(re.sub(r"\s+", " ", v).strip())
    if fixed != r.get("ingredients", []):
        r["ingredients"] = fixed
        sync_sections(r)
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
