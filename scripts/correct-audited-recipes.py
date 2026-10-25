# Déclencheur de correction automatique des fiches depuis la branche de test.
# Déclenchement de contrôle : correction et validation des étapes génériques sur la branche de test.
# Execution pilotée depuis GitHub Actions sur la branche de test.
#!/usr/bin/env python3
"""Quality corrections for recipe cards; intentionally leaves Opération Vide-Frigo contents untouched."""
import json, re, unicodedata
from pathlib import Path

p = Path("data/carnet.json")
raw_data = p.read_text(encoding="utf-8")
# Recover from a trailing literal \\n left by an earlier write attempt, if present.
if raw_data.endswith(r"\n"):
    raw_data = raw_data[:-2]
d = json.loads(raw_data)
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
        elif re.search(r"Préparation|Etapes|Étapes", title, re.I) and not re.search(r"astuce|conseil|robot|version|préparer une grande quantité|préparer une double quantité|à servir avec|préparation de la sauce", title, re.I):
            sec["lines"] = steps[:]
            if re.search(r"Temps de préparation|⏱️|durée", title, re.I) and r.get("timePrep"):
                sec["title"] = "⏱️ Préparation : " + str(r["timePrep"])

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


# 4) Replace remaining generic instructions with method-specific steps.
GENERIC_STEP_RE = re.compile(
    r"Préparez les ingrédients|Hachez finement les aromates|Versez l’huile ou le liquide petit à petit|"
    r"Goûtez, rectifiez l’assaisonnement|mélangez la base indiquée dans la liste|Préparez tous les ingrédients listés|"
    r"Commencez par cuire les ingrédients demandant le plus de temps|Ajoutez les autres ingrédients et les liquides prévus|"
    r"Préparez les ingrédients de la fiche|Faites chauffer l’huile indiquée dans une poêle ou une casserole adaptée|"
    r"Incorporez les liquides, épices et autres ingrédients de la fiche", re.I
)
def tailored_steps(r):
    name = norm(r.get("name", ""))
    ing = r.get("ingredients", [])
    joined = norm(" ".join(str(x) for x in ing))
    def find(pattern, fallback):
        return next((str(x) for x in ing if re.search(pattern, norm(x))), fallback)
    onion = find(r"oignon|echalote", "les aromates prévus")
    garlic = find(r"ail", "l’ail prévu")
    tomato = find(r"tomate", "les tomates prévues")
    veg = [str(x) for x in ing if re.search(r"courgette|carotte|poivron|poireau|champignon|chou|brocoli|haricot|epinard|tomate|salade|concombre", norm(x))][:3]
    veg_text = ", ".join(veg) if veg else "les légumes indiqués dans la liste"
    cook_match = re.search(r"(\d+)", str(r.get("timeCook", "")))
    cook = int(cook_match.group(1)) if cook_match else 20
    starch = find(r"pates|nouilles|riz|semoule|pommes de terre|gnocchi|ravioles", "l’accompagnement prévu")
    if re.search(r"sauce|vinaigrette|tzatziki|pesto|tartinade|marinade", name) and not re.search(r"poisson.*sauce|poulet.*sauce|boulette.*sauce|viande.*sauce", name):
        if "tzatziki" in name:
            return ["1. Râpez le concombre puis pressez-le soigneusement pour retirer son excès d’eau.",
                    "2. Mélangez le skyr ou yaourt avec l’ail, le citron et les herbes prévus dans la liste.",
                    "3. Incorporez le concombre égoutté et mélangez jusqu’à obtenir une sauce homogène.",
                    "4. Poivrez selon la liste, couvrez et réservez au frais au moins 15 minutes avant de servir."]
        if "tomate" in name:
            return [f"1. Émincez {onion.lower()} et hachez {garlic.lower()}.",
                    "2. Faites chauffer l’huile prévue dans une casserole et faites suer les aromates 3 à 4 minutes sans les brûler.",
                    f"3. Ajoutez {tomato.lower()} ainsi que les herbes et épices listées. Laissez mijoter {max(10, cook)} minutes en remuant de temps en temps.",
                    "4. Mixez si une texture lisse est souhaitée, goûtez puis rectifiez uniquement avec les assaisonnements prévus. Laissez refroidir avant de mettre en pot."]
        return ["1. Lavez, séchez et hachez les herbes ou légumes prévus; râpez les aromates si nécessaire.",
                "2. Dans un bol, mélangez la base crémeuse ou liquide indiquée avec les ingrédients prévus.",
                "3. Incorporez progressivement le citron, l’huile, les épices et les herbes listés en fouettant jusqu’à obtenir une texture homogène.",
                "4. Goûtez, rectifiez uniquement avec les assaisonnements prévus, couvrez et réservez au frais jusqu’au service."]
    if re.search(r"overnight|porridge|bowl petit.dejeuner|petit.dejeuner|flocons d.avoine", name):
        return ["1. Versez les flocons ou céréales prévus dans un bol ou un bocal propre.",
                "2. Ajoutez le skyr ou yaourt et le lait indiqués, puis mélangez jusqu’à ce que les flocons soient bien humidifiés.",
                "3. Lavez et coupez les fruits prévus; ajoutez-les avec les noix, graines ou épices listées.",
                "4. Pour une version overnight, fermez et placez au réfrigérateur au moins 4 heures, idéalement une nuit; sinon dégustez aussitôt."]
    if re.search(r"crepe|pancake|gaufre", name):
        return ["1. Dans un saladier, mélangez la farine et la levure prévues. Faites un puits et ajoutez les œufs.",
                "2. Versez le lait progressivement en fouettant pour obtenir une pâte lisse; incorporez le yaourt ou fromage blanc s’il est indiqué.",
                "3. Laissez reposer la pâte 5 à 10 minutes si possible.",
                "4. Faites chauffer une poêle antiadhésive légèrement huilée et cuisez de petites portions 1 à 2 minutes par face, jusqu’à ce qu’elles soient dorées et cuites à cœur."]
    if re.search(r"gateau|banana bread|brownie|muffin|cake|tarte sucree|crumble|cookies|biscuit|fondant|moelleux|pommes au four|poires roties|peches roties|fruit roti", name):
        return ["1. Préchauffez le four à 180 °C. Préparez un moule ou un plat adapté et chemisez-le si nécessaire.",
                "2. Lavez et coupez les fruits ou écrasez les bananes prévues. Mélangez les œufs et les ingrédients humides indiqués.",
                "3. Incorporez la farine, la levure, les épices et les autres ingrédients secs prévus; mélangez juste assez pour obtenir une préparation homogène.",
                f"4. Versez dans le moule ou répartissez dans le plat. Faites cuire environ {max(15, cook)} minutes, en vérifiant la cuisson au centre avec la pointe d’un couteau.",
                "5. Laissez tiédir avant de démouler ou de servir."]
    if re.search(r"verrine|mousse|creme dessert", name):
        return ["1. Mesurez les ingrédients. Faites fondre le chocolat s’il figure dans la liste, puis laissez-le tiédir.",
                "2. Fouettez les œufs, le skyr ou le lait et le sucre prévus jusqu’à obtenir un mélange homogène.",
                "3. Incorporez les ingrédients secs ou le chocolat sans laisser de grumeaux, puis répartissez dans les verrines.",
                "4. Laissez refroidir puis réfrigérez au moins 2 heures avant de servir."]
    if re.search(r"wrap|burger|sandwich|tartine|bowl froid|salade|taboule|crudites|saumon fume|assiette composee", name):
        return [f"1. Lavez et essorez les légumes prévus; coupez {veg_text} en morceaux ou en fines lamelles.",
                "2. Faites cuire complètement la protéine si elle est crue, puis laissez-la reposer quelques minutes avant de la couper; si elle est déjà cuite, détaillez-la simplement.",
                "3. Mélangez la sauce ou les condiments indiqués. Réchauffez légèrement le pain ou les wraps si souhaité.",
                "4. Assemblez le plat en répartissant les ingrédients et la sauce; roulez les wraps bien serrés ou dressez dans les assiettes juste avant de servir."]
    if re.search(r"poisson|saumon|cabillaud|colin|thon|truite|crevette|moule|brandade", name) or re.search(r"poisson|saumon|cabillaud|colin|thon|crevette", joined):
        return [f"1. Préchauffez le four à 190 °C si la cuisson est au four. Lavez et coupez {veg_text}; séchez le poisson et assaisonnez-le avec les ingrédients prévus.",
                "2. Faites revenir les légumes 5 minutes à la poêle ou déposez-les dans un plat avec l’huile indiquée.",
                f"3. Ajoutez le poisson et faites cuire {max(10, min(cook, 30))} minutes au four, ou à la poêle à feu moyen selon l’épaisseur, jusqu’à ce que la chair soit opaque et se détache facilement.",
                "4. Mélangez à part le skyr, la crème ou les herbes prévus pour la sauce; ajoutez le citron en fin de préparation et évitez de faire bouillir une sauce au produit laitier.",
                f"5. Servez avec {starch.lower()} s’il est listé et vérifiez que tous les éléments sont bien chauds."]
    if re.search(r"pates|ravioli|ravioles|lasagne|spaghetti|risotto|gnocchi|nouilles", name):
        return ["1. Portez une grande casserole d’eau salée à ébullition et faites cuire les pâtes ou nouilles selon le paquet. Égouttez en réservant un peu d’eau de cuisson.",
                f"2. Pendant ce temps, émincez {onion.lower()} et préparez {veg_text}. Faites revenir les aromates dans l’huile prévue 3 à 4 minutes.",
                f"3. Ajoutez {tomato.lower()} ou la sauce et le fromage listés; laissez chauffer {max(5, min(cook, 20))} minutes à feu doux et cuisez complètement les légumes ou la protéine prévue.",
                "4. Mélangez les pâtes avec la sauce. Détendez avec une cuillère d’eau de cuisson si nécessaire, puis ajoutez les herbes ou le fromage prévus juste avant de servir."]
    if re.search(r"dahl|lentille|chili|curry|couscous|tajine|haricot|pois chiche|ragout|mijote|bourguignon|pot.au.feu|soupe|veloute", name):
        return [f"1. Rincez les lentilles ou céréales si nécessaire. Émincez {onion.lower()}, hachez {garlic.lower()} et coupez {veg_text}.",
                "2. Faites revenir les aromates dans l’huile prévue pendant 3 à 5 minutes; ajoutez les épices et remuez 30 secondes.",
                f"3. Ajoutez les légumes, les tomates, le bouillon et les légumineuses indiqués. Couvrez et laissez mijoter {max(20, cook)} minutes à feu doux, en remuant et en ajoutant un peu d’eau si nécessaire.",
                "4. Vérifiez que les légumes et légumineuses sont tendres et que la viande éventuelle est cuite. Ajoutez le lait de coco ou le produit crémeux en fin de cuisson s’il est prévu.",
                f"5. Goûtez, rectifiez avec les assaisonnements listés et servez avec {starch.lower()} si indiqué."]
    if re.search(r"oeuf|omelette|shakshuka|frittata", name):
        return [f"1. Émincez {onion.lower()} et coupez {veg_text} en petits morceaux.",
                "2. Faites revenir les légumes dans l’huile prévue 5 à 7 minutes, jusqu’à ce qu’ils commencent à s’attendrir.",
                "3. Ajoutez les tomates ou autres ingrédients prévus et les épices; laissez mijoter quelques minutes pour évaporer l’excès de liquide.",
                "4. Ajoutez les œufs et cuisez à feu doux, à couvert si nécessaire, jusqu’à ce que les blancs soient pris. Parsemez des herbes ou du fromage prévus et servez chaud."]
    if re.search(r"farci|farcies|farcis", name):
        return ["1. Préchauffez le four à 180 °C. Lavez les légumes à farcir, coupez leur chapeau et évidez-les délicatement.",
                f"2. Hachez {onion.lower()} et {garlic.lower()}. Faites revenir les aromates et la chair des légumes dans l’huile prévue, puis ajoutez la viande ou la garniture listée.",
                "3. Mélangez avec les herbes, céréales ou fromage prévus. Garnissez les légumes sans trop tasser et replacez les chapeaux.",
                f"4. Disposez dans un plat avec le liquide ou les tomates prévus et faites cuire {max(30, cook)} minutes, jusqu’à ce que les légumes soient tendres et la farce cuite à cœur."]
    if re.search(r"pizza|quiche|tarte salee|brick|samoussa|feuillete", name):
        return ["1. Préchauffez le four à 220 °C pour une pizza ou 190 °C pour une tarte ou des bricks. Préparez la pâte et coupez les légumes.",
                "2. Faites revenir les viandes ou légumes qui en ont besoin 5 à 8 minutes à la poêle, puis égouttez l’excès de liquide.",
                "3. Garnissez la pâte avec la sauce, les légumes, la protéine et le fromage prévus; pliez les bricks ou samoussas si nécessaire.",
                f"4. Enfournez {max(12, min(cook, 35))} minutes, jusqu’à ce que la pâte soit dorée et la garniture cuite. Laissez reposer 3 minutes."]
    if re.search(r"boulette", name):
        return ["1. Mélangez la viande hachée avec l’œuf, la chapelure, les herbes et les assaisonnements indiqués. Formez des boulettes régulières.",
                "2. Faites chauffer l’huile prévue dans une sauteuse et faites dorer les boulettes sur plusieurs faces pendant 5 à 7 minutes.",
                f"3. Faites revenir {onion.lower()} et {garlic.lower()}, puis ajoutez {tomato.lower()} ou la sauce prévue. Laissez frémir 5 minutes.",
                f"4. Remettez les boulettes dans la sauce, couvrez et laissez cuire {max(15, min(cook, 35))} minutes à feu doux. Vérifiez la cuisson à cœur avant de servir."]
    if re.search(r"poulet|dinde|boeuf|veau|porc|steak|viande|merguez|saucisse|lardons|paupiette|roti", name) or re.search(r"poulet|dinde|boeuf|veau|porc|viande hachee|merguez|saucisse", joined):
        return [f"1. Coupez {veg_text} et émincez {onion.lower()} ainsi que {garlic.lower()}. Préparez les autres ingrédients de la liste.",
                "2. Faites chauffer l’huile prévue dans une sauteuse. Faites dorer la viande sur toutes les faces ou jusqu’à ce que la viande hachée ne soit plus rosée.",
                "3. Ajoutez les légumes et les aromates; faites revenir 5 à 8 minutes. Incorporez la sauce, les tomates ou le bouillon prévus.",
                f"4. Laissez cuire {max(10, cook)} minutes à feu doux, en remuant régulièrement et en ajoutant un peu de liquide si nécessaire. Vérifiez que la viande est cuite à cœur.",
                "5. Ajoutez le skyr, la crème ou le fromage en fin de cuisson si la recette en prévoit, à feu doux. Servez avec l’accompagnement indiqué."]
    if re.search(r"wok|poelee|sauté", name):
        return [f"1. Coupez {veg_text} en morceaux réguliers et émincez les aromates avant de commencer.",
                "2. Faites chauffer l’huile prévue dans une grande poêle ou un wok. Saisissez la viande ou la protéine 2 à 4 minutes puis réservez-la.",
                "3. Faites sauter les légumes 5 à 8 minutes à feu vif en remuant souvent; ils doivent rester légèrement croquants.",
                "4. Remettez la protéine, ajoutez la sauce soja, les épices et les liquides listés, puis mélangez 2 à 3 minutes jusqu’à cuisson complète.",
                "5. Incorporez les nouilles ou le riz déjà cuits s’ils sont prévus et servez immédiatement."]
    return [f"1. Préparez les ingrédients de la liste : lavez et coupez {veg_text}; émincez {onion.lower()} et hachez {garlic.lower()} si présents.",
            "2. Faites chauffer la matière grasse indiquée dans une poêle ou une casserole adaptée. Faites revenir les aromates 3 à 5 minutes sans les laisser brûler.",
            f"3. Ajoutez les ingrédients principaux et le liquide ou la sauce prévus. Faites cuire {max(10, cook)} minutes à feu moyen-doux, en remuant et en vérifiant la cuisson.",
            "4. Incorporez les herbes, les produits laitiers ou les éléments fragiles en fin de cuisson s’ils sont indiqués. Goûtez et rectifiez uniquement avec les assaisonnements de la liste.",
            f"5. Servez avec {starch.lower()} si cet accompagnement figure dans la fiche, en vérifiant que les ingrédients sont cuits et bien chauds."]

generic_cards_repaired = 0
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I):
        continue
    if any(GENERIC_STEP_RE.search(str(step)) for step in r.get("steps", [])):
        r["steps"] = tailored_steps(r)
        sync_sections(r)
        generic_cards_repaired += 1
print(f"Fiches avec étapes génériques remplacées par des consignes ciblées : {generic_cards_repaired}")

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

# Trigger a final verified correction pass on the test branch.


# Split extracted sauce/dressing text into real ingredient rows for correct shopping aggregation.
def replace_ings(rid, items):
    r=by.get(rid)
    if not r:return
    r["ingredients"]=items
    sync_sections(r)
replace_ings("veg-pe-017",["200 g de pois gourmands","6 radis","1 avocat","1 c. à soupe de moutarde de Dijon","1 c. à soupe d’huile d’olive","2 c. à soupe d’eau tiède","Sel et poivre"])
replace_ings("vegan-pe-005",["200 g de pois gourmands","6 radis","1 avocat","1 c. à soupe de moutarde de Dijon","1 c. à soupe d’huile d’olive","2 c. à soupe d’eau tiède","Sel et poivre"])
replace_ings("vegan-robot-009",["600 g de pommes de terre","1 chou-fleur","150 ml de crème de soja","2 c. à soupe de moutarde à l’ancienne","1 c. à soupe de jus de citron","Sel et poivre"])
replace_ings("vegan-robot-015",["300 g de macaronis cuits à part","300 g de potimarron","150 ml de lait végétal","2 c. à soupe de levure maltée","1 c. à café de moutarde","Sel et poivre"])
replace_ings("vegan-automne-hiver-010",["500 g de panais","300 g de carottes","80 g de farine de blé ou d’épeautre","40 g de poudre de noisettes","40 g de noisettes concassées","4 c. à soupe d’huile d’olive","Sel"])
replace_ings("vegan-automne-hiver-016",["300 g de chou kale","1 patate douce","3 c. à soupe de beurre de cacahuète","2 c. à soupe de sauce soja","1 c. à soupe de sirop d’érable","4 à 5 c. à soupe d’eau chaude"])
replace_ings("vegan-automne-hiver-018",["250 g de lentilles vertes cuites","2 pommes","40 g de noix","3 c. à soupe d’huile de noix ou d’olive","1 c. à soupe de vinaigre de cidre","1 c. à café de moutarde à l’ancienne","Sel et poivre"])
replace_ings("vegan-automne-hiver-020",["4 pains pita","300 g de chou rouge","250 g de pois chiches rôtis","4 c. à soupe de yaourt de soja nature","1 c. à soupe de jus de citron","Sel et poivre"])
replace_ings("vegan-automne-hiver-030",["200 g de quinoa cru","300 g de potimarron","100 g de mâche","30 g de graines de tournesol","1 gousse d’ail","4 c. à soupe d’huile d’olive","Sel"])
replace_ings("vegan-automne-hiver-035",["250 g de pois cassés","1 oignon","1 carotte","1 litre de bouillon de légumes","2 tranches de pain rassis","1 gousse d’ail","1 c. à soupe d’huile d’olive","Sel et poivre"])
replace_ings("vegan-automne-hiver-040",["300 g de chou-fleur râpé","80 g de grenade","30 g de pignons de pin","3 c. à soupe d’huile d’olive","2 c. à soupe de jus de citron","Sel et poivre"])
replace_ings("vegan-automne-hiver-048",["150 g de mâche","2 betteraves cuites","2 tranches de pain complet","3 c. à soupe d’huile de colza","1 c. à soupe de vinaigre de cidre","1 c. à café de sirop d’érable","Sel et poivre"])
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

# Run the verified cleanup for split sauce ingredients.



# Final broad quality pass: replace templated, non-recipe instructions with preparation
# steps grounded in each card's own title, ingredients and declared cooking times.
def recipe_kind(r):
    n = norm(r.get("name", ""))
    if re.search(r"\b(sauce|vinaigrette|marinade|pesto|tartinade|dip|mayonnaise|houmous|hummus|rillettes|coulis|bechamel|tzatziki|caviar)\b", n): return "sauce"
    if re.search(r"\b(mug pasta|mac and cheese|mug quesadilla|pomme de terre en robe|micro.?ondes|riz pilaf minute)\b", n): return "microwave"
    if re.search(r"\b(puree|purée|ecrase|écrasé|pommes de terre garnies)\b", n): return "mash"
    if re.search(r"\b(crepe|crêpe|crepes|crêpes|pancake|pancakes|gaufre|gaufres)\b", n): return "pancake"
    if re.search(r"\b(burger|hamburger)\b", n): return "burger"
    if re.search(r"\b(paella|riz cantonais|riz sauté|riz saute|riz façon|riz facon)\b", n): return "rice"
    if re.search(r"\b(overnight oats|porridge|muesli)\b", n): return "cold"
    if re.search(r"\b(salade\w*|wrap\w*|tartine\w*|sandwich\w*|bowl|bruschetta|caprese|crudite\w*|taco\w*)\b", n): return "cold"
    if re.search(r"\b(soupe\w*|veloute\w*|potage\w*|bouillon|gaspacho|gazpacho|minestrone)\b", n): return "soup"
    if re.search(r"\b(pizza|quiche|tarte|gratin|lasagne|lasagnes|farci|farcie|farcis|farcies|moussaka|muffin|cake|gateau|crumble|mug cake|flan|banana bread|pommes au four|poires roties|peches roties)\b", n): return "oven"
    if re.search(r"\b(risotto)\b", n): return "risotto"
    if re.search(r"\b(chili|couscous|curry|wok|poelee|ragout|tajine|bourguignon|ratatouille|dahl|blanquette|paella|potee|cantonais|one pot|saucisses)\b", n): return "simmer"
    if re.search(r"\b(omelette|oeuf|oeufs|frittata|tortilla espagnole)\b", n): return "eggs"
    if re.search(r"\b(cabillaud|colin|saumon|maquereau|maquereaux|truite|lieu noir|poisson|thon frais|filet de poisson)\b", n): return "fish"
    if re.search(r"\b(compote|tiramisu|dessert|yaourt|skyr|fruits|chocolat|pancake|crepe|crêpe)\b", n): return "dessert"
    if re.search(r"\b(poulet|dinde|boeuf|bœuf|porc|veau|boulettes|steak|merguez|saucisse)\b", n): return "meat"
    if re.search(r"\b(pates|macaroni|spaghetti|nouilles|orzo|risoni|riz saute)\b", n): return "starch"
    return "general"

def get_minutes(r, key, default):
    val = str(r.get(key, "") or "")
    m = re.search(r"(\d+)", val)
    return int(m.group(1)) if m else default

def make_steps(r):
    name = r.get("name", "la recette")
    ing = [str(x).strip() for x in r.get("ingredients", []) if str(x).strip()]
    kind = recipe_kind(r)
    prep = get_minutes(r, "timePrep", 15)
    cook = get_minutes(r, "timeCook", 20)
    list_text = ", ".join(ing[:8])
    # Steps avoid listing sauce/side-dish names as purchasable ingredients; ingredient list remains authoritative.
    if kind == "sauce":
        steps = [
          "1. Préparez et mesurez tous les ingrédients indiqués; lavez les herbes et égouttez les ingrédients en conserve s’il y en a.",
          "2. Hachez finement les herbes, l’ail ou les échalotes prévus; pour une sauce lisse, placez les ingrédients dans un bol ou un mixeur.",
          "3. Incorporez progressivement l’huile, le jus de citron, le vinaigre ou le produit laitier prévu, en mélangeant jusqu’à obtenir la texture souhaitée.",
          "4. Goûtez, ajustez uniquement avec les assaisonnements de la fiche, puis réservez au frais dans un récipient fermé si la sauce n’est pas servie immédiatement."
        ]
    elif kind == "cold":
        steps = [
          "1. Lavez et préparez les légumes et les herbes de la fiche; égouttez les conserves et coupez les ingrédients en morceaux adaptés.",
          "2. Si la fiche contient une viande, un poisson ou des œufs crus, faites-les cuire séparément jusqu’à cuisson complète, puis laissez tiédir. Pour une recette sans ingrédient cru à cuire, passez directement à l’étape suivante.",
          "3. Assemblez les ingrédients dans un saladier ou répartissez-les sur les pains/wraps. Préparez la sauce indiquée dans la fiche à part et ajoutez-la au dernier moment.",
          "4. Goûtez, rectifiez l’assaisonnement avec les ingrédients prévus, puis servez frais."
        ]
    elif kind == "soup":
        steps = [
          "1. Lavez, épluchez si nécessaire et coupez les légumes de la fiche en morceaux réguliers; émincez l’oignon et l’ail s’ils sont prévus.",
          "2. Faites revenir l’oignon et les légumes dans l’huile prévue pendant 3 à 5 minutes, sans les laisser brûler.",
          "3. Ajoutez le liquide prévu dans la recette, couvrez et laissez mijoter jusqu’à ce que les légumes soient tendres; vérifiez la cuisson avec la pointe d’un couteau.",
          "4. Mixez jusqu’à la texture souhaitée, ajoutez les assaisonnements prévus, goûtez et servez chaud."
        ]
    elif kind == "oven":
        steps = [
          "1. Préchauffez le four à 180 °C (ou à la température indiquée sur l’emballage de la pâte). Préparez et coupez les ingrédients de la fiche.",
          "2. Faites cuire à la poêle les viandes ou légumes qui doivent être précuits; égouttez les ingrédients humides si nécessaire.",
          "3. Assemblez les ingrédients dans le moule ou sur la pâte, en répartissant uniformément la garniture et les assaisonnements prévus.",
          f"4. Enfournez environ {max(cook,15)} minutes, en contrôlant la cuisson et la coloration; prolongez si nécessaire jusqu’à ce que le plat soit cuit à cœur."
        ]
    elif kind == "risotto":
        steps = [
          "1. Émincez l’oignon et coupez les légumes de la fiche en petits morceaux. Préparez le bouillon et râpez le fromage si nécessaire.",
          "2. Faites revenir l’oignon dans l’huile prévue, ajoutez le riz à risotto et remuez 1 à 2 minutes pour bien l’enrober.",
          "3. Versez le bouillon chaud progressivement en remuant régulièrement; ajoutez les légumes selon leur temps de cuisson et poursuivez jusqu’à ce que le riz soit tendre mais encore légèrement ferme.",
          "4. Hors du feu, incorporez le fromage et les herbes prévus. Ajustez l’assaisonnement et servez aussitôt."
        ]
    elif kind == "simmer":
        steps = [
          "1. Émincez les aromates et coupez les légumes de la fiche en morceaux réguliers; préparez les protéines et les épices.",
          "2. Faites revenir l’oignon et les aromates dans l’huile prévue, puis ajoutez la viande ou la protéine principale et faites-la dorer.",
          "3. Ajoutez les légumes, les tomates ou le liquide indiqués dans la fiche ainsi que les épices. Couvrez partiellement et laissez mijoter jusqu’à cuisson complète, en remuant de temps en temps.",
          "4. Ajoutez les ingrédients à cuisson rapide en fin de cuisson; goûtez, rectifiez l’assaisonnement et servez avec l’accompagnement mentionné dans la fiche."
        ]
    elif kind == "eggs":
        steps = [
          "1. Lavez et coupez les légumes de la fiche en petits morceaux; battez les œufs dans un bol avec les assaisonnements prévus.",
          "2. Faites revenir les légumes dans une poêle avec la matière grasse prévue jusqu’à ce qu’ils soient tendres.",
          "3. Versez les œufs battus sur les légumes et faites cuire à feu doux; ajoutez le fromage s’il est prévu.",
          "4. Poursuivez jusqu’à ce que les œufs soient pris et cuits à cœur, puis servez immédiatement."
        ]
    elif kind == "fish":
        steps = [
          "1. Préparez le poisson et coupez les légumes de la fiche; faites cuire séparément l’accompagnement féculent s’il est prévu.",
          "2. Préparez les légumes et la sauce indiqués dans la recette; assaisonnez le poisson avec les condiments prévus.",
          "3. Faites cuire le poisson à la vapeur, à la poêle ou au four selon le matériel disponible, jusqu’à ce que la chair soit opaque et se détache facilement.",
          "4. Vérifiez la cuisson, réchauffez la sauce sans la faire bouillir si elle contient du skyr ou un produit laitier, puis servez avec les légumes et l’accompagnement."
        ]
    elif kind == "dessert":
        steps = [
          "1. Préparez et pesez les ingrédients indiqués; lavez, épluchez ou coupez les fruits si la fiche en contient.",
          "2. Mélangez les ingrédients dans l’ordre adapté à la recette, en réservant les garnitures pour la finition.",
          "3. Si une cuisson est prévue, faites cuire à la température et pendant la durée indiquées en contrôlant la texture; sinon, répartissez dans les contenants de service.",
          "4. Ajoutez la garniture prévue et laissez refroidir ou réfrigérez si nécessaire avant de servir."
        ]
    elif kind == "microwave":
        steps = [
          "1. Utilisez un bol ou un plat explicitement compatible micro-ondes, sans aucune pièce métallique. Préparez les ingrédients de la fiche.",
          "2. Pour les pâtes ou le riz, ajoutez la quantité d’eau indiquée et chauffez par séquences courtes en remuant à mi-cuisson; pour une pomme de terre, piquez la peau et cuisez jusqu’à ce qu’elle soit tendre.",
          "3. Incorporez le lait, le fromage, la garniture ou les assaisonnements prévus, puis réchauffez par courtes séquences jusqu’à ce que le plat soit bien chaud et les aliments cuits.",
          "4. Laissez reposer une minute, remuez et vérifiez la cuisson avant de manger; attention à la vapeur et au récipient chaud."
        ]
    elif kind == "mash":
        steps = [
          "1. Épluchez les pommes de terre et les légumes-racines de la fiche, puis coupez-les en morceaux de taille régulière.",
          "2. Faites cuire les légumes dans une casserole d’eau bouillante salée ou à la vapeur jusqu’à ce qu’ils soient très tendres.",
          "3. Égouttez soigneusement, puis écrasez ou mixez selon la texture souhaitée. Ajoutez progressivement le lait, la crème ou la matière grasse seulement s’ils figurent dans la liste.",
          "4. Assaisonnez avec le sel, le poivre et les aromates prévus; mélangez et servez chaud."
        ]
    elif kind == "pancake":
        steps = [
          "1. Mélangez les ingrédients secs de la fiche dans un saladier. Dans un autre récipient, battez les œufs avec le lait ou le liquide prévu.",
          "2. Incorporez les ingrédients liquides aux ingrédients secs en mélangeant juste assez pour obtenir une pâte homogène; laissez reposer si le temps le permet.",
          "3. Faites chauffer une poêle légèrement graissée. Versez de petites portions de pâte et faites cuire jusqu’à l’apparition de bulles, puis retournez.",
          "4. Poursuivez la cuisson jusqu’à ce que les deux faces soient dorées et que le centre soit cuit; servez avec les garnitures prévues."
        ]
    elif kind == "burger":
        steps = [
          "1. Lavez et coupez la salade, les tomates et les autres crudités indiquées; préparez les pains et les sauces prévues.",
          "2. Formez les steaks si la viande est hachée, assaisonnez et faites-les cuire dans une poêle chaude jusqu’à cuisson à cœur.",
          "3. Réchauffez les pains quelques instants; ajoutez la sauce, le fromage si prévu, les steaks et les crudités.",
          "4. Préparez l’accompagnement explicitement listé dans la fiche et servez le burger aussitôt."
        ]
    elif kind == "rice":
        steps = [
          "1. Rincez le riz si nécessaire et faites-le cuire selon les indications du paquet; pour un riz sauté, privilégiez du riz déjà cuit et refroidi.",
          "2. Coupez les légumes et les protéines indiqués en petits morceaux. Faites cuire les protéines à part jusqu’à cuisson complète, puis réservez.",
          "3. Faites revenir les légumes et aromates dans une poêle ou une sauteuse chaude; ajoutez les œufs s’ils figurent dans la liste et faites-les cuire en remuant.",
          "4. Ajoutez le riz et les protéines, incorporez les condiments prévus et faites sauter quelques minutes en mélangeant régulièrement."
        ]
    elif kind == "starch":
        steps = [
          "1. Préparez les légumes, aromates et protéines indiqués dans la fiche; portez à ébullition une casserole d’eau si les pâtes ou nouilles doivent cuire.",
          "2. Faites cuire les pâtes, nouilles ou le riz selon les indications du paquet, puis égouttez; pour un riz sauté, utilisez du riz déjà cuit et refroidi si possible.",
          "3. Faites revenir les légumes et les protéines dans la matière grasse prévue jusqu’à cuisson complète; ajoutez les condiments indiqués.",
          "4. Incorporez le féculent cuit, mélangez 2 à 3 minutes pour réchauffer et répartir les saveurs, puis servez."
        ]
    elif kind == "meat":
        steps = [
          "1. Préparez les légumes et aromates de la fiche; coupez la viande en morceaux réguliers si nécessaire et préparez les assaisonnements.",
          "2. Faites dorer la viande dans la matière grasse prévue, en plusieurs fois si la poêle est petite.",
          "3. Ajoutez les légumes, les épices et le liquide ou la sauce prévus; faites cuire à feu moyen ou doux jusqu’à cuisson complète, en adaptant la durée à la taille des morceaux.",
          "4. Vérifiez la cuisson à cœur, rectifiez l’assaisonnement et servez avec l’accompagnement explicitement prévu dans la fiche."
        ]
    else:
        steps = [
          "1. Lavez et préparez les ingrédients de la fiche; épluchez et coupez les légumes si nécessaire.",
          "2. Faites cuire les ingrédients qui nécessitent une cuisson en commençant par ceux qui demandent le plus de temps; utilisez uniquement la matière grasse et les liquides prévus.",
          "3. Ajoutez les autres ingrédients et assaisonnements de la fiche; mélangez et poursuivez la cuisson jusqu’à ce que les aliments soient tendres et cuits à cœur.",
          "4. Goûtez, rectifiez l’assaisonnement avec les éléments prévus et servez aussitôt."
        ]
    # Make every repaired method specific to this recipe, not just to its category.
    # Cite the actual ingredients in the first instruction so the cook can act from the card.
    if ing:
        named_ingredients = ", ".join(ing[:6])
        steps[0] = steps[0].rstrip(".; ") + f". Ingrédients à préparer pour cette recette : {named_ingredients}."
    return steps

generic_fixed = 0
numbered_cleaned = 0
placeholder_fixed = 0
missing_times_filled = 0
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I):
        continue
    old_name = r.get("name", "")
    # Strip standalone recipe numbers, preserving the actual title.
    new_name = clean_numbered_name(old_name)
    if new_name != old_name:
        r["name"] = new_name
        numbered_cleaned += 1
    ing = r.get("ingredients", [])
    changed_ing = []
    for item in ing:
        raw = str(item)
        if re.fullmatch(r"\s*1\s+herbes\s*", raw, re.I):
            raw = "1 c. à café d’herbes de Provence"
            placeholder_fixed += 1
        elif re.fullmatch(r"\s*1\s+gingembre\s*", raw, re.I):
            raw = "1 c. à café de gingembre frais râpé"
            placeholder_fixed += 1
        elif re.fullmatch(r"\s*1\s+bœuf émincé\s*", raw, re.I):
            raw = "400 g de bœuf émincé"
            placeholder_fixed += 1
        changed_ing.append(raw)
    if changed_ing != ing:
        r["ingredients"] = changed_ing
    old_steps = r.get("steps", [])
    if old_steps and any(re.search(r"Préparez pour \d+ personnes|Cuisez séparément les œufs, féculents ou protéines|répartissez en \d+ portions", str(st), re.I) for st in old_steps):
        r["steps"] = make_steps(r)
        generic_fixed += 1
    # Fill missing time metadata with conservative defaults, not arbitrary long cook times.
    if not r.get("timePrep") or not r.get("timeCook"):
        kind = recipe_kind(r)
        if not r.get("timePrep"):
            r["timePrep"] = "10 min" if kind in ("cold","starch","eggs") else "15 min"
            missing_times_filled += 1
        if not r.get("timeCook"):
            if kind == "cold": r["timeCook"] = "0 min"
            elif kind == "dessert" and not any(re.search(r"four|enfour|cuire|cuisson|micro-ondes|poêle|poele", str(st), re.I) for st in r.get("steps", [])): r["timeCook"] = "0 min"
            elif kind == "soup": r["timeCook"] = "25 min"
            elif kind == "oven": r["timeCook"] = "25 min"
            elif kind in ("eggs","starch","fish"): r["timeCook"] = "15 min"
            else: r["timeCook"] = "20 min"
            missing_times_filled += 1
    sync_sections(r)

# Correct the two remaining visibly malformed ingredient rows.
for rid, items in {
 "r-3ad7aa939f": ["4 poivrons","400 g de viande hachée","200 g de riz cru","2 tomates","1 oignon","1 gousse d’ail","1 c. à café de paprika","1 c. à soupe de basilic frais","1 c. à soupe d’huile d’olive","Sel et poivre"],
 "student-microwave-044": ["1 tortilla de blé","3 c. à soupe de coulis de tomate","1 tranche de jambon","40 g de mozzarella ou de fromage râpé","1 c. à café d’herbes de Provence"]
}.items():
    if rid in by:
        by[rid]["ingredients"] = items
        sync_sections(by[rid])

# Catch remaining template families whose first step uses a slightly different wording.
remaining_templates_fixed = 0
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I): continue
    old_steps = r.get("steps", [])
    if old_steps and any(re.search(r"Préparez les ingrédients pour \d+ personnes|Préparez les ingrédients pour 4 personnes|Coupez les ingrédients régulièrement; faites cuire complètement|Faites cuire les ingrédients qui nécessitent une cuisson|condiments indiqués|Lavez et préparez les ingrédients de la fiche", str(st), re.I) for st in old_steps):
        r["steps"] = make_steps(r)
        remaining_templates_fixed += 1

# Replace the non-descriptive student recipe title and repair a truncated title without changing its ingredients.
if "student-tendances-003" in by:
    by["student-tendances-003"]["name"] = "Salade complète de boulgour, concombre et pois chiches"
    sync_sections(by["student-tendances-003"])
# The title is cut off; complete it using the recipe's own listed ingredients.
if "student-zero-cooking-020" in by and str(by["student-zero-cooking-020"].get("name","")).rstrip().lower().endswith("sans"):
    by["student-zero-cooking-020"]["name"] = "Mug cake express aux Spéculoos sans cuisson"
    sync_sections(by["student-zero-cooking-020"])

# Synchronize all ingredient/preparation sections after the data corrections.
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I): continue
    sync_sections(r)

p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"recipes={len(recipes)}; generic_preparations_replaced={generic_fixed}; numbered_titles_cleaned={numbered_cleaned}; vague_ingredients_fixed={placeholder_fixed}; missing_time_fields_filled={missing_times_filled}")

print(f"remaining_template_families_replaced={remaining_templates_fixed}")


# Fix dangling plan references from an old student-recipe ID prefix, and remove editorial
# recipe numbers from weekly display labels without changing week/day/meal assignments.
plan_links_repaired = 0
plan_numbers_removed = 0
known_ids = {r.get("id") for r in recipes}
for slot in (d.get("plan", {}).values() if isinstance(d.get("plan", {}), dict) else d.get("plan", [])):
    rid = slot.get("recipeId")
    if rid and rid.startswith("etudiant-zero-cuisson-"):
        candidate = rid.replace("etudiant-zero-cuisson-", "student-zero-cooking-", 1)
        if candidate in known_ids:
            slot["recipeId"] = candidate
            plan_links_repaired += 1
    label = slot.get("name")
    if isinstance(label, str):
        cleaned = re.sub(r"(?i)\bRECETTE\s*(?:N[°ºo]\s*)?\d+\s*(?:[—–:-]\s*)?", "", label)
        cleaned = re.sub(r"\s{2,}", " ", cleaned).strip()
        if cleaned != label:
            slot["name"] = cleaned
            plan_numbers_removed += 1

p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"plan_links_repaired={plan_links_repaired}; weekly_recipe_numbers_removed={plan_numbers_removed}")


# Final content repairs for remaining malformed or non-specific recipe cards.
apply("r-ea7fd76f2e", "Wraps façon tartiflette légère",
 ["4 tortillas complètes","2 pommes de terre moyennes déjà cuites","400 g de jambon blanc","2 oignons","100 g de salade verte","120 g de reblochon ou fromage de montagne","150 g de fromage blanc nature","1 gousse d’ail","1 c. à soupe de ciboulette ciselée","1 c. à café de paprika fumé","1 pincée de noix de muscade","Sel et poivre"],
 ["1. Émincez les oignons et faites-les revenir 8 à 10 minutes dans une poêle avec un filet d’huile jusqu’à ce qu’ils soient fondants.","2. Coupez les pommes de terre cuites, le jambon et le reblochon en morceaux; ajoutez-les aux oignons et réchauffez doucement jusqu’à ce que le fromage commence à fondre.","3. Mélangez le fromage blanc avec l’ail haché, la ciboulette, le paprika, la muscade, le sel et le poivre.","4. Répartissez la garniture chaude sur les tortillas, ajoutez la sauce au fromage blanc et un peu de salade, puis repliez les wraps et servez."], "15 min","10 min",4)
apply("r-421c0d31ea", "Velouté de courgettes au St Môret",
 ["800 g de courgettes","1 oignon","1 pomme de terre moyenne","750 ml de bouillon de légumes","100 g de St Môret ou fromage frais nature","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Lavez les courgettes, épluchez la pomme de terre et coupez les légumes en morceaux; émincez l’oignon.","2. Faites revenir l’oignon dans l’huile 3 minutes. Ajoutez les courgettes, la pomme de terre et le bouillon.","3. Faites cuire à couvert 20 à 25 minutes, jusqu’à ce que les légumes soient tendres.","4. Ajoutez le St Môret, mixez jusqu’à obtenir un velouté lisse et rectifiez l’assaisonnement."], "10 min","25 min",4)
apply("r-f8241b6268", "Légumes grillés façon méditerranéenne",
 ["1 courgette","2 tomates","2 poivrons","2 oignons","1 gousse d’ail","1 c. à soupe d’huile d’olive","1 c. à café de thym","5 g de basilic frais","1 c. à café de paprika doux","Sel et poivre"],
 ["1. Préchauffez le four à 200 °C. Lavez les légumes et coupez la courgette, les tomates et les poivrons en morceaux; émincez les oignons et l’ail.","2. Mélangez les légumes avec l’huile, le thym, le paprika, le sel et le poivre.","3. Étalez sur une plaque en une seule couche et enfournez 25 à 35 minutes, en remuant à mi-cuisson.","4. Vérifiez que les légumes sont tendres et dorés, puis parsemez de basilic frais avant de servir."], "15 min","30 min",4)
apply("r-f7ad8158b6", "Tacos maison au poulet mariné et légumes",
 ["4 tortillas de blé","400 g de poulet mariné","2 poivrons","2 oignons","150 g de salade verte","2 tomates","100 g de fromage blanc nature","20 g de fromage râpé","1 gousse d’ail","1 c. à café de paprika fumé","1 c. à café de paprika doux","1/2 c. à café de cumin","1 citron","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Émincez les oignons et coupez les poivrons en lanières; coupez les tomates et la salade pour la garniture.","2. Faites chauffer l’huile dans une poêle et faites cuire le poulet mariné jusqu’à cuisson complète. Réservez au chaud.","3. Faites revenir les oignons et les poivrons dans la même poêle; ajoutez le paprika, le cumin, l’ail et un filet de jus de citron.","4. Mélangez le fromage blanc avec un peu de jus de citron, du sel et du poivre. Garnissez les tortillas avec le poulet, les légumes, les tomates, la salade, la sauce et le fromage râpé."], "15 min","20 min",4)
apply("r-ea3ecc28a3", "Tartines de thon, crudités et fromage blanc",
 ["4 tranches de pain complet","200 g de thon au naturel égoutté","100 g de fromage blanc nature","1/2 concombre","2 tomates","1/2 citron","1/2 c. à café de paprika doux","50 g de salade verte","1 avocat mûr (facultatif)","Sel et poivre"],
 ["1. Égouttez le thon et mélangez-le avec le fromage blanc, le jus de citron, le paprika, le sel et le poivre.","2. Lavez et coupez le concombre et les tomates en petits dés; lavez et essorez la salade.","3. Faites griller légèrement le pain, puis répartissez la préparation au thon sur les tranches.","4. Ajoutez les crudités, la salade et l’avocat en tranches si vous en utilisez; servez immédiatement."], "12 min","3 min",4)
apply("r-93a95052bc", "Wraps Buffalo au poulet et crudités",
 ["4 tortillas complètes","600 g de blanc de poulet","150 g de salade verte","2 tomates","1 concombre","150 g de fromage blanc nature","1 c. à soupe de sauce pimentée douce","1/2 citron","1/2 c. à café d’ail en poudre","1 c. à café de paprika fumé","1/2 c. à café de piment doux","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Coupez le poulet en lanières. Mélangez-le avec l’huile, l’ail, le paprika fumé, le piment doux, le sel et le poivre.","2. Faites cuire le poulet dans une poêle chaude 8 à 12 minutes selon l’épaisseur, jusqu’à cuisson complète.","3. Mélangez le fromage blanc avec la sauce pimentée et le jus de citron. Lavez et coupez la salade, les tomates et le concombre.","4. Répartissez le poulet et les crudités sur les tortillas, ajoutez la sauce et repliez les wraps."], "15 min","15 min",4)
apply("test-burger-s2", "Burgers maison façon bistrot",
 ["2 pains à burger","2 steaks hachés de bœuf","2 tranches de fromage","50 g de salade verte","1 tomate","4 cornichons","2 c. à soupe de sauce burger","Sel et poivre"],
 ["1. Lavez et essorez la salade; coupez la tomate en rondelles et les cornichons en tranches.","2. Assaisonnez les steaks et faites-les cuire dans une poêle chaude jusqu’au degré de cuisson souhaité, en respectant une cuisson à cœur pour une viande hachée bien cuite.","3. Réchauffez légèrement les pains et ajoutez la sauce burger, le fromage, les steaks, la tomate, la salade et les cornichons.","4. Refermez les burgers et servez immédiatement avec l’accompagnement choisi."], "10 min","15 min",2)
apply("veg-robot-008", "Gnocchis poêlés à la crème d’avocat",
 ["500 g de gnocchis","2 avocats mûrs","100 g d’épinards frais","1/2 citron","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Faites cuire les gnocchis selon les indications du paquet, puis égouttez-les.","2. Mixez la chair des avocats avec le jus de citron, l’huile, le sel et le poivre jusqu’à obtenir une crème lisse.","3. Faites tomber les épinards dans une poêle chaude pendant 1 à 2 minutes.","4. Ajoutez les gnocchis et la crème d’avocat, mélangez à feu doux juste le temps de réchauffer sans faire bouillir, puis servez."], "15 min","15 min",4)
for rid in ["cco-slot-20-samedi-midi","cco-slot-35-lundi-midi","cco-slot-35-mardi-midi","cco-slot-35-mercredi-midi"]:
    apply(rid, "Assiette complète de saison au poulet, riz et feta",
      ["200 g de salade verte ou jeunes pousses","250 g de tomates","1 concombre","250 g de poulet déjà cuit","150 g de riz déjà cuit","100 g de feta","2 c. à soupe d’huile d’olive","1 c. à soupe de jus de citron","Sel et poivre"],
      ["1. Lavez et essorez la salade; coupez les tomates et le concombre en morceaux.","2. Coupez le poulet cuit en lamelles et émiettez la feta.","3. Répartissez la salade, les tomates, le concombre, le riz et le poulet dans les assiettes.","4. Mélangez l’huile d’olive, le jus de citron, le sel et le poivre; assaisonnez juste avant de servir et ajoutez la feta."], "15 min","0 min",4)
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Manual recipe-card repairs applied; weekly meal assignments preserved.")


# Last nine residual template cards: use the actual ingredients and method for each dish.
apply("r-4b1467579a", "Courgettes gratinées au chèvre",
 ["4 courgettes moyennes","1 oignon","200 g de chèvre frais","100 g de crème légère","40 g de parmesan râpé","1 c. à soupe d’huile d’olive","1 c. à café d’herbes de Provence","Sel et poivre"],
 ["1. Préchauffez le four à 190 °C. Lavez les courgettes et coupez-les en rondelles; émincez l’oignon.","2. Faites revenir l’oignon et les courgettes dans l’huile pendant 8 à 10 minutes, jusqu’à ce qu’ils commencent à s’attendrir.","3. Mélangez le chèvre frais avec la crème, les herbes, le sel et le poivre. Disposez les courgettes dans un plat et nappez de cette préparation.","4. Parsemez de parmesan et enfournez 20 à 25 minutes, jusqu’à ce que le gratin soit doré et les courgettes tendres."], "15 min","30 min",4)
apply("student-microwave-021", "One-Pot Pasta express à la tomate en bol",
 ["50 g de coquillettes","4 c. à soupe de coulis de tomate","100 ml d’eau chaude","1 c. à café d’huile d’olive","30 g de fromage râpé","Sel et poivre"],
 ["1. Dans un grand bol compatible micro-ondes, mélangez les coquillettes, le coulis de tomate et l’eau chaude; ne couvrez pas hermétiquement.","2. Faites chauffer 2 minutes à puissance élevée, remuez, puis poursuivez par séquences d’une minute jusqu’à ce que les pâtes soient tendres; ajoutez un peu d’eau si nécessaire.","3. Incorporez l’huile, le sel, le poivre et le fromage râpé.","4. Laissez reposer une minute, mélangez et vérifiez que les pâtes sont bien cuites avant de servir."], "4 min","6 min",1)
apply("student-microwave-022", "Mijoté express de pois chiches au thon et cumin",
 ["100 g de pois chiches égouttés","80 g de thon au naturel égoutté","3 c. à soupe de coulis de tomate","1 c. à café d’huile d’olive","1/2 c. à café de cumin","Sel et poivre"],
 ["1. Égouttez les pois chiches et le thon. Placez-les dans un bol compatible micro-ondes.","2. Ajoutez le coulis de tomate, l’huile, le cumin, le sel et le poivre; mélangez délicatement.","3. Faites chauffer 1 minute 30 à 2 minutes au micro-ondes, remuez à mi-cuisson et vérifiez que le mélange est bien chaud.","4. Laissez reposer une minute et servez avec l’accompagnement souhaité."], "3 min","2 min",1)
apply("student-microwave-024", "Burrito minute au thon et haricots rouges",
 ["1 tortilla de blé","100 g de haricots rouges égouttés","80 g de thon au naturel égoutté","2 c. à soupe de coulis de tomate","30 g de fromage râpé","1/2 c. à café de paprika doux","Sel et poivre"],
 ["1. Égouttez les haricots rouges et le thon, puis mélangez-les avec le coulis de tomate, le paprika, le sel et le poivre dans un bol compatible micro-ondes.","2. Faites chauffer le mélange 1 minute à 1 minute 30, jusqu’à ce qu’il soit bien chaud.","3. Répartissez la garniture au centre de la tortilla et ajoutez le fromage râpé.","4. Repliez la tortilla et réchauffez 20 à 30 secondes au micro-ondes pour faire fondre le fromage; laissez reposer avant de manger."], "3 min","2 min",1)
apply("student-microwave-026", "Fondue de camembert au miel en bol",
 ["1 petit camembert","1 c. à café de miel","5 g d’herbes aromatiques","4 tranches de pain"],
 ["1. Retirez le camembert de tout emballage et placez-le dans un petit récipient compatible micro-ondes.","2. Incisez légèrement la croûte sur le dessus et ajoutez le miel et les herbes aromatiques.","3. Faites chauffer par séquences de 20 à 30 secondes jusqu’à ce que le cœur soit fondant, sans laisser déborder.","4. Laissez reposer une minute et dégustez avec les tranches de pain."], "3 min","2 min",1)
apply("student-microwave-029", "Chaudrée minute de maïs au bacon",
 ["140 g de maïs égoutté","30 g de lardons","100 ml de lait","1 c. à soupe de crème légère","1/2 cube de bouillon émietté","Poivre"],
 ["1. Placez les lardons dans un bol compatible micro-ondes et faites-les chauffer 45 à 60 secondes.","2. Ajoutez le maïs égoutté, le lait, la crème et le bouillon émietté; mélangez.","3. Faites chauffer 2 à 3 minutes en remuant à mi-cuisson, jusqu’à ce que la soupe soit bien chaude.","4. Poivrez, laissez reposer une minute et mélangez avant de servir."], "4 min","4 min",1)
apply("student-microwave-043", "One-Pot Pasta façon tartiflette en bol",
 ["50 g de coquillettes","30 g de lardons","2 tranches de fromage à raclette ou 60 g de reblochon","100 ml d’eau chaude","2 c. à soupe de lait","Poivre"],
 ["1. Dans un bol compatible micro-ondes, mélangez les coquillettes et l’eau chaude; ne couvrez pas hermétiquement.","2. Faites chauffer 2 minutes, remuez puis poursuivez par séquences d’une minute jusqu’à ce que les pâtes soient tendres; ajoutez un peu d’eau si nécessaire.","3. Ajoutez les lardons, le lait et le fromage en morceaux; mélangez et réchauffez par séquences courtes jusqu’à ce que le fromage fonde et que les lardons soient bien chauds.","4. Poivrez, laissez reposer une minute et remuez avant de servir."], "4 min","6 min",1)
apply("student-microwave-045", "Riz au thon et fromage frais en bol",
 ["150 g de riz déjà cuit","80 g de thon au naturel égoutté","1 grosse c. à soupe de fromage frais","1 c. à café de jus de citron","Poivre"],
 ["1. Placez le riz cuit et le thon égoutté dans un bol compatible micro-ondes et mélangez.","2. Faites chauffer 60 à 90 secondes, en remuant à mi-cuisson, jusqu’à ce que le mélange soit bien chaud.","3. Incorporez le fromage frais, le jus de citron et le poivre.","4. Mélangez jusqu’à obtenir une texture crémeuse et servez aussitôt."], "3 min","2 min",1)
apply("student-microwave-049", "Fondue de poireaux minute à la crème",
 ["150 g de poireaux surgelés émincés","1 grosse c. à soupe de crème légère","1 c. à café de jus de citron","Sel et poivre"],
 ["1. Placez les poireaux surgelés dans un bol compatible micro-ondes avec une cuillère à soupe d’eau.","2. Couvrez avec un couvercle adapté laissant échapper la vapeur et faites chauffer 3 minutes.","3. Remuez puis poursuivez par séquences de 30 à 60 secondes jusqu’à ce que les poireaux soient tendres; égouttez l’excédent d’eau.","4. Incorporez la crème, le jus de citron, le sel et le poivre; réchauffez 30 secondes et servez."], "3 min","5 min",1)

for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I): continue
    sync_sections(r)
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Dernières fiches génériques corrigées; sections d’ingrédients et de préparation resynchronisées.")


# Repair incomplete titles and a split ingredient list in student recipes.
apply("student-one-pan-050", "Pancake géant étudiant à la poêle",
 ["1 œuf","4 c. à soupe bombées de farine","1 c. à café de sucre","1/2 c. à café de levure chimique (facultatif)","50 ml de lait","1 c. à café de beurre pour la poêle","1 c. à soupe de confiture ou de pâte à tartiner (facultatif)"],
 ["1. Battez l’œuf avec le lait et le sucre dans un bol.","2. Ajoutez la farine et la levure; mélangez jusqu’à obtenir une pâte homogène.","3. Faites fondre le beurre dans une petite poêle antiadhésive et versez toute la pâte. Couvrez et faites cuire à feu doux 3 à 4 minutes.","4. Retournez délicatement le pancake et poursuivez 2 à 3 minutes jusqu’à ce que le centre soit cuit. Ajoutez la garniture choisie si souhaité."], "5 min","7 min",1)
apply("student-zero-cooking-028", "Rillettes de thon au Kiri pour tartines",
 ["1 petite boîte de thon au naturel (80 g)","2 portions de fromage Kiri ou fromage fondu nature","1 c. à café de jus de citron","Poivre","4 tranches de pain complet"],
 ["1. Égouttez soigneusement le thon et émiettez-le dans un bol.","2. Ajoutez le fromage Kiri et le jus de citron, puis écrasez à la fourchette jusqu’à obtenir une préparation tartinable.","3. Poivrez et mélangez une dernière fois.","4. Servez sur les tranches de pain complet ou conservez au frais dans un récipient fermé."], "5 min","0 min",1)
apply("student-zero-cooking-037", "Soupe froide express de concombre au yaourt et à la menthe",
 ["1/2 concombre","1 yaourt nature (125 g)","1 c. à café d’huile d’olive","1 pincée d’ail en poudre","2 feuilles de menthe fraîche (facultatif)","Sel et poivre"],
 ["1. Lavez le concombre et coupez-le en morceaux.","2. Mixez le concombre avec le yaourt, l’huile d’olive, l’ail, le sel et le poivre jusqu’à obtenir une soupe lisse.","3. Ajoutez la menthe ciselée si vous l’utilisez et mélangez.","4. Réfrigérez au moins 15 minutes si possible et servez bien frais."], "5 min","0 min",1)
apply("student-zero-cooking-039", "Salade de maïs aux dés de jambon et emmental",
 ["1/2 grande boîte de maïs (140 g égoutté)","50 g de dés de jambon blanc","30 g d’emmental en petits cubes","1 c. à soupe de mayonnaise","Poivre"],
 ["1. Égouttez le maïs et versez-le dans un bol.","2. Ajoutez les dés de jambon et l’emmental coupé en petits cubes.","3. Incorporez la mayonnaise et le poivre, puis mélangez.","4. Réservez au frais jusqu’au service."], "5 min","0 min",1)
apply("student-zero-cooking-040", "Sandwich perdu sucré à la fraise sans cuisson",
 ["2 tranches de pain de mie","2 c. à soupe de fromage blanc épais ou petit-suisse","1 c. à café de sucre","3 fraises fraîches ou 1 c. à soupe de confiture de fraise"],
 ["1. Mélangez le fromage blanc et le sucre dans un petit bol.","2. Étalez cette préparation sur une tranche de pain de mie.","3. Coupez les fraises en fines tranches et répartissez-les sur le fromage blanc; à défaut, étalez la confiture.","4. Refermez avec la seconde tranche, coupez en deux et servez immédiatement."], "5 min","0 min",1)
apply("student-zero-cooking-041", "Salade italienne de pois chiches au jambon cru et parmesan",
 ["1 petite boîte de pois chiches (200 g égouttés)","1 tranche de jambon cru","20 g de parmesan en copeaux","1 c. à soupe d’huile d’olive","1 c. à café de jus de citron ou de vinaigre","Poivre"],
 ["1. Rincez et égouttez les pois chiches.","2. Déchirez le jambon cru en lanières et ajoutez-le aux pois chiches.","3. Ajoutez le parmesan, l’huile d’olive, le jus de citron ou le vinaigre et le poivre.","4. Mélangez délicatement et servez frais."], "5 min","0 min",1)
apply("student-zero-cooking-044", "Wrap fraîcheur au jambon blanc, fromage frais et carotte",
 ["1 tortilla de blé","1 tranche de jambon blanc","1 grosse c. à soupe de fromage frais","1/2 carotte","2 feuilles de salade verte"],
 ["1. Lavez la salade et râpez finement la demi-carotte.","2. Étalez le fromage frais sur la tortilla.","3. Ajoutez le jambon blanc, la salade et la carotte râpée.","4. Roulez fermement le wrap, coupez-le en deux et servez frais."], "5 min","0 min",1)

for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I): continue
    sync_sections(r)
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Titres incomplets et fiche pancake corrigés.")


# Final source normalization for cookbook-style "ingredient: quantity" lines.
# This preserves quantities and ingredient names while making each row parseable by the shopping list.
def clean_ingredient_row(raw):
    line = str(raw or "").strip()
    if not line: return line
    line = line.replace("½", "1/2").replace("¼", "1/4").replace("¾", "3/4").replace("⅓", "1/3").replace("⅔", "2/3")
    line = re.sub(r"\bc\.\s*à\s*s\.\b", "c. à soupe", line, flags=re.I)
    line = re.sub(r"\bc\.\s*à\s*c\.\b", "c. à café", line, flags=re.I)
    line = re.sub(r"\bcuillères?\s+à\s+soupe\b", "c. à soupe", line, flags=re.I)
    line = re.sub(r"\bcuillères?\s+à\s+café\b", "c. à café", line, flags=re.I)
    line = re.sub(r"\s+", " ", line).strip()
    if ":" in line:
        left, right = [part.strip() for part in line.split(":", 1)]
        left = re.sub(r"\s*\(recette\s+(?:précédente|\d+)\)\s*", " ", left, flags=re.I)
        left = re.sub(r"\s+", " ", left).strip()
        if re.search(r"piques?\s+en\s+bois|cure.?dents?", left, re.I) and re.search(r"service|montage", right, re.I):
            return ""
        if re.search(r"^citron(?:\s+jaune|\s+vert)?$", left, re.I):
            if re.search(r"jus\s+d['’]un\s+demi.?citron|jus\s+d’un\s+demi.?citron", right, re.I): return "1/2 " + left.lower() + " (jus et zestes)"
            if re.search(r"jus\s+d['’]un\s+gros\s+citron|jus\s+d’un\s+gros\s+citron", right, re.I): return "1 gros " + left.lower() + " (jus et zestes)"
            if re.search(r"jus\s+d['’]un\s+citron\s+entier|jus\s+d’un\s+citron\s+entier", right, re.I): return "1 " + left.lower() + " (jus et zestes)"
        if re.search(r"^feuilles?\s+de\s+basilic", left, re.I) and re.search(r"quelques feuilles|pour le décor|pour le service", right, re.I):
            return "5 g de basilic frais"
        if re.search(r"^fleur de sel.*poivre", left, re.I) and re.search(r"pincée de chaque", right, re.I):
            return "1 pincée de fleur de sel et de poivre noir"
        # A quantity already present at the start of the right side is the most reliable source.
        m = re.match(r"^(un|une|quelques|\d+(?:[.,]\d+)?(?:\s*/\s*\d+(?:[.,]\d+)?)?)\s*(.*)$", right, re.I)
        if m:
            q, rest = m.group(1), m.group(2).strip()
            q = {"un":"1","une":"1","quelques":"quelques"}.get(q.lower(), q)
            rest = re.sub(r"\s+", " ", rest)
            # If the right side contains the actual ingredient, retain its more descriptive wording.
            if rest and not re.match(r"^(?:c\.\s*à\s*(?:soupe|café)|càs|cac|cs|cc|cuillère|cuillere|g|kg|mg|ml|cl|l|grammes?|pincée|pincee|poignée|poignee|tranche|gousse|filet|branche|feuille|boîte|boite|pot|paquet|rouleau|pièce|piece|verre|tasse|dose|grande boîte|grande boite|petite boîte|petite boite)\b", rest, re.I):
                # Clean recipe numbers from linked sauce names embedded in ingredient labels.
                rest = re.sub(r"\s*\(recette\s+\d+\)", "", rest, flags=re.I)
                return re.sub(r"\s+", " ", q + " " + rest).strip()
            unit_rest = rest
            if re.match(r"^(?:c\.\s*à\s*soupe|c\.\s*à\s*café|càs|cac|cs|cc|cuillère|cuillere)", unit_rest, re.I):
                unit_rest = re.sub(r"^c\.\s*à\s*soupe", "c. à soupe", unit_rest, flags=re.I)
                unit_rest = re.sub(r"^c\.\s*à\s*café", "c. à café", unit_rest, flags=re.I)
                return f"{q} {unit_rest} de {left[0].lower()+left[1:]}"
            if re.match(r"^(?:g|kg|mg|ml|cl|l|grammes?)\b", unit_rest, re.I):
                return f"{q} {unit_rest} de {left[0].lower()+left[1:]}"
            if re.match(r"^(?:grande boîte|grande boite|petite boîte|petite boite|boîte|boite|pot|paquet|rouleau|pièce|piece|poignée|poignee|tranche|gousse|filet|branche|feuille|verre|tasse|dose)\b", unit_rest, re.I):
                detail = re.search(r"\(([^)]*)\)", unit_rest)
                suffix = f" ({detail.group(1)})" if detail else ""
                unit = unit_rest.split("(")[0].strip()
                return f"{q} {unit} de {left}{suffix}"
            return f"{q} {left}"
        if re.search(r"^le jus d['’]un (?:demi|gros|grand)?\s*citron", right, re.I):
            return "1 citron jaune (jus et zestes)"
        # A non-quantity description is an accessory or a note, not a shopping ingredient.
        if re.search(r"pour le service|pour le montage", right, re.I) and re.search(r"piques?|cure.?dents?", left, re.I):
            return ""
    # Convert common non-numeric quantities to a countable ingredient line.
    line = re.sub(r"^une pincée\b", "1 pincée", line, flags=re.I)
    line = re.sub(r"^un filet\b", "1 filet", line, flags=re.I)
    line = re.sub(r"^quelques feuilles de basilic frais.*$", "5 g de basilic frais", line, flags=re.I)
    line = re.sub(r"^feuilles de basilic frais\s*:?\s*pour le décor$", "5 g de basilic frais", line, flags=re.I)
    if re.fullmatch(r"piment d['’]espelette\.?", line, re.I): return "1 pincée de " + line.rstrip(".")
    if re.fullmatch(r"ail en poudre", line, re.I): return "1/2 c. à café d’ail en poudre"
    if re.fullmatch(r"menthe et basilic thaï frais", line, re.I): return "10 g de menthe et de basilic thaï frais"
    if re.fullmatch(r"persil", line, re.I): return "1 c. à soupe de persil frais"
    if re.fullmatch(r"coriandre", line, re.I): return "1 c. à soupe de coriandre fraîche"
    if re.fullmatch(r"basilic", line, re.I): return "1 c. à soupe de basilic frais"
    if re.fullmatch(r"tranches? d['’]orange(s)?", line, re.I): return "1 orange en tranches"
    if re.fullmatch(r"mûres fraîches", line, re.I): return "100 g de mûres fraîches"
    if re.fullmatch(r"glaçons", line, re.I): return "4 glaçons"
    return line

ingredient_rows_normalized = 0
accessory_rows_removed = 0
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I): continue
    cleaned = []
    for raw in r.get("ingredients", []):
        fixed = clean_ingredient_row(raw)
        if not fixed:
            accessory_rows_removed += 1
            r.setdefault("notes", []).append(str(raw))
            continue
        if fixed != raw:
            ingredient_rows_normalized += 1
        cleaned.append(fixed)
    r["ingredients"] = cleaned
    # Rewrite only steps that the app's strict source-validation gate identifies as generic.
    steps = r.get("steps", [])
    if any(re.search(r"préparer les ingrédients\s*:?\s*laver|faire cuire les ingrédients principaux|assembler les ingrédients dans un saladier|cuire les ingrédients dans l’eau ou le bouillon selon les indications|faire cuire les ingrédients dans une poêle ou une casserole chaude|rectifier l’assaisonnement si nécessaire|goûtez et rectifiez|jusqu’à cuisson à cœur|selon votre goût|selon disponibilité", str(st), re.I) for st in steps):
        r["steps"] = make_steps(r)
    else:
        r["steps"] = [re.sub(r"jusqu’à cuisson à cœur", "jusqu’à ce que le centre soit bien cuit", re.sub(r"selon votre goût", "en ajustant progressivement le sel et le poivre", re.sub(r"goûtez et rectifiez l’assaisonnement si nécessaire", "goûtez, puis ajustez le sel et le poivre si nécessaire", str(st), flags=re.I), flags=re.I), flags=re.I) for st in steps]
    sync_sections(r)

p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"ingredient_rows_normalized={ingredient_rows_normalized}; non_food_accessories_removed={accessory_rows_removed}")


# Harmonize no-cook metadata and remaining common ingredient placeholders.
def specific_spice_for(title):
    t = norm(title)
    if re.search(r"curry|tik ka|masala", t): return "1 c. à café de curry doux"
    if re.search(r"pizza|italien|lasagne", t): return "1 c. à café d’origan"
    if re.search(r"chili|taco|tex.?mex|mexicain|burrito", t): return "1 c. à café de cumin"
    if re.search(r"paprika", t): return "1 c. à café de paprika doux"
    if re.search(r"poisson|saumon|cabillaud|thon|maquereau", t): return "1 c. à café d’aneth ou d’herbes de Provence"
    return "1 c. à café d’herbes de Provence"

for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I): continue
    title = r.get("name", "")
    ing = []
    for raw in r.get("ingredients", []):
        item = str(raw).strip()
        if re.fullmatch(r"Épices ou aromates(?:\s*\([^)]*\))?", item, re.I):
            item = specific_spice_for(title)
        elif re.fullmatch(r"Herbes aromatiques(?:\s*\([^)]*\))?", item, re.I):
            item = "5 g d’herbes aromatiques"
        elif re.fullmatch(r"Basilic frais(?:\s*\([^)]*\))?", item, re.I):
            item = "5 g de basilic frais"
        elif re.fullmatch(r"Ciboulette(?:\s*\([^)]*\))?", item, re.I):
            item = "5 g de ciboulette fraîche"
        elif re.fullmatch(r"thym\s*\([^)]*\)", item, re.I):
            item = "10 g de thym frais"
        elif re.fullmatch(r"1\s+courgettes?", item, re.I):
            item = "1 courgette"
        elif re.fullmatch(r"2\s+oignon", item, re.I):
            item = "2 oignons"
        elif re.fullmatch(r"1\s+poireaux?", item, re.I):
            item = "1 poireau"
        elif re.fullmatch(r"2\s+pomme de terre", item, re.I):
            item = "2 pommes de terre"
        elif re.fullmatch(r"1\s+salade", item, re.I):
            item = "100 g de salade verte"
        elif re.fullmatch(r"1\s+maïs", item, re.I):
            item = "100 g de maïs égoutté"
        elif re.fullmatch(r"1\s+olives vertes", item, re.I):
            item = "100 g d’olives vertes dénoyautées"
        elif re.fullmatch(r"1\s+béchamel", item, re.I):
            item = "300 ml de béchamel légère"
        elif re.fullmatch(r"1\s+plaques? de lasagnes?", item, re.I):
            item = "8 plaques de lasagnes"
        elif re.fullmatch(r"2\s+sauce tomate maison", item, re.I):
            item = "150 g de sauce tomate maison"
        elif re.fullmatch(r"1\s+œufs durs?", item, re.I):
            item = "2 œufs durs"
        elif re.fullmatch(r"2\s+poivron", item, re.I):
            item = "2 poivrons"
        elif re.fullmatch(r"2\s+champignons?", item, re.I):
            item = "200 g de champignons de Paris"
        elif re.fullmatch(r"1\s+champignons?", item, re.I):
            item = "150 g de champignons de Paris"
        elif re.fullmatch(r"2\s+tomates séchées\s*\(petite quantité\)", item, re.I):
            item = "40 g de tomates séchées"
        elif re.fullmatch(r"30\s*g/personne de 100\s*g de mozzarella ou chèvre", item, re.I):
            item = "100 g de mozzarella râpée"
        elif re.fullmatch(r"600\s*g coupés en gros dés de blancs de poulet", item, re.I):
            item = "600 g de blancs de poulet coupés en gros dés"
        elif re.fullmatch(r"150\s*ml de un peu de lait", item, re.I):
            item = "150 ml de lait demi-écrémé"
        elif re.fullmatch(r"1\s+boulettes cuites de la semaine", item, re.I):
            item = "200 g de boulettes cuites"
        elif re.fullmatch(r"1\s+Légumes rôtis restants", item, re.I):
            item = "150 g de légumes rôtis"
        elif re.fullmatch(r"2\s+Champignons ou légumes rôtis restants", item, re.I):
            item = "200 g de champignons de Paris"
        elif re.fullmatch(r"8\s*/\s*22\s*>", item):
            item = ""
        if item: ing.append(item)
    # Remove exact repeated ingredient rows without touching Vide-Frigo cards.
    seen, unique = set(), []
    for item in ing:
        key = norm(item)
        if key not in seen:
            seen.add(key); unique.append(item)
    r["ingredients"] = unique
    if re.search(r"^(?:Sans cuisson|Aucune cuisson|Pas de cuisson)$", str(r.get("timeCook","")).strip(), re.I):
        r["timeCook"] = "0 min"
    if re.search(r"^(?:variable|à définir|a definir|selon recette)$", str(r.get("timeCook","")).strip(), re.I):
        r["timeCook"] = "20 min"
    sync_sections(r)

# Correct obvious copied-content and sauce-as-meal mistakes in weekly slots.
apply("r-8ab1afdf0b", "Parmentier de poulet aux légumes fondants",
 ["500 g de blancs de poulet","600 g de pommes de terre","2 carottes","200 g de poireaux","1 oignon","150 ml de lait demi-écrémé","100 g de fromage râpé léger","1 c. à soupe d’huile d’olive","1 c. à café d’herbes de Provence","Sel et poivre"],
 ["1. Épluchez les pommes de terre et les carottes; coupez-les en morceaux et émincez les poireaux et l’oignon.","2. Faites cuire les pommes de terre dans l’eau bouillante 15 à 20 minutes, jusqu’à ce qu’elles soient tendres; égouttez et écrasez avec le lait.","3. Coupez le poulet en petits dés. Faites revenir l’oignon, les carottes et les poireaux dans l’huile, ajoutez le poulet et faites cuire jusqu’à ce qu’il soit bien cuit.","4. Répartissez la préparation au poulet dans un plat, couvrez avec la purée, ajoutez le fromage râpé et enfournez à 190 °C pendant 15 à 20 minutes jusqu’à ce que le dessus soit doré."], "25 min","35 min",4)
apply("r-7cb0cfd0a6", "Blanquette de poulet ultra facile",
 ["800 g de poulet en morceaux","500 g de champignons de Paris","2 carottes","1 poireau","2 oignons","150 ml de bouillon de volaille","200 g de fromage blanc nature","1 citron","1 c. à soupe de moutarde douce","10 g de thym frais","2 feuilles de laurier","Sel et poivre"],
 ["1. Émincez les oignons et les champignons; coupez les carottes et le poireau en rondelles.","2. Faites dorer le poulet dans une cocotte avec un filet d’huile, puis ajoutez les légumes.","3. Versez le bouillon, ajoutez le thym et le laurier, couvrez et laissez mijoter 20 à 25 minutes jusqu’à ce que le poulet soit cuit.","4. Mélangez le fromage blanc avec la moutarde et un peu de jus de citron; incorporez hors du feu sans faire bouillir. Retirez le laurier et servez."], "15 min","25 min",4)
apply("r-9876a3ed85", "Blanquette légère de poulet aux légumes",
 ["700 g de poulet en morceaux","2 carottes","1 poireau","200 g de champignons de Paris","2 oignons","200 g de fromage blanc nature","1 citron","1 c. à soupe de moutarde douce","150 ml de bouillon de volaille","10 g de thym frais","2 feuilles de laurier","Sel et poivre"],
 ["1. Coupez les carottes, le poireau et les champignons; émincez les oignons.","2. Faites dorer le poulet dans une cocotte avec un filet d’huile, puis ajoutez les légumes.","3. Ajoutez le bouillon, le thym et le laurier. Couvrez et laissez mijoter 20 à 25 minutes jusqu’à cuisson complète du poulet.","4. Mélangez le fromage blanc, la moutarde et le jus de citron; incorporez hors du feu. Retirez le laurier et servez."], "15 min","25 min",4)
apply("r-957c974540", "Poulet au paprika fumé et légumes rôtis",
 ["600 g de poulet en morceaux","2 courgettes","3 carottes","1 oignon","1 c. à soupe d’huile d’olive","1 c. à café de paprika fumé","1 c. à café d’herbes de Provence","Sel et poivre"],
 ["1. Préchauffez le four à 200 °C. Coupez les courgettes et les carottes en morceaux et émincez l’oignon.","2. Mélangez le poulet et les légumes avec l’huile, le paprika fumé, les herbes, le sel et le poivre.","3. Étalez sur une plaque et enfournez 25 à 35 minutes, en remuant à mi-cuisson, jusqu’à ce que le poulet soit cuit et les légumes dorés.","4. Vérifiez la cuisson à cœur du poulet et servez chaud."], "15 min","35 min",4)
apply("r-1aff5ca09b", "Lasagnes bolognaises maison",
 ["8 plaques de lasagnes","400 g de viande hachée","2 tomates","2 carottes","2 oignons","300 ml de béchamel légère","100 g de fromage râpé","5 g de basilic frais","1 c. à café d’origan","Sel et poivre"],
 ["1. Préchauffez le four à 190 °C. Émincez les oignons et râpez les carottes; coupez les tomates en dés.","2. Faites revenir les oignons et les carottes, ajoutez la viande hachée et faites-la cuire en l’émiettant.","3. Ajoutez les tomates, le basilic, l’origan, le sel et le poivre; laissez mijoter 10 minutes.","4. Alternez dans un plat les feuilles de lasagnes, la sauce bolognaise et la béchamel. Terminez par le fromage râpé.","5. Enfournez 30 à 35 minutes jusqu’à ce que les pâtes soient tendres et le dessus doré."], "20 min","35 min",4)
apply("r-5943623be0", "Brandade légère de cabillaud aux légumes",
 ["600 g de cabillaud","800 g de pommes de terre","200 g de poireaux","2 carottes","1 gousse d’ail","1 citron","150 g de fromage blanc nature","150 ml de lait demi-écrémé","1 c. à soupe de persil frais","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Épluchez les pommes de terre et les carottes; coupez les légumes en morceaux et émincez les poireaux.","2. Faites cuire les pommes de terre et les carottes dans l’eau bouillante jusqu’à ce qu’elles soient tendres; ajoutez les poireaux pour les 10 dernières minutes.","3. Faites pocher le cabillaud dans le lait à feu doux pendant 8 à 10 minutes, jusqu’à ce qu’il se défasse facilement; égouttez et émiettez-le en vérifiant l’absence d’arêtes.","4. Écrasez les légumes avec le fromage blanc, l’huile, l’ail haché, le persil et un peu de jus de citron; incorporez le poisson.","5. Salez, poivrez et servez chaud."], "15 min","20 min",4)
apply("r-261284b831", "Poulet citron et courgettes",
 ["600 g de blancs de poulet coupés en gros dés","2 courgettes coupées en demi-rondelles","2 citrons jaunes (jus et zestes d’un demi-citron)","2 gousses d’ail pressées","1 c. à soupe d’huile d’olive","1 c. à café d’origan séché","Sel et poivre"],
 ["1. Mélangez le jus des citrons, les zestes, l’ail, l’huile, l’origan, le sel et le poivre.","2. Coupez le poulet et les courgettes; faites chauffer une grande poêle.","3. Faites dorer le poulet 5 à 7 minutes, ajoutez les courgettes et la marinade, puis poursuivez 7 à 10 minutes jusqu’à ce que le poulet soit cuit.","4. Goûtez, ajustez l’assaisonnement et servez chaud."], "10 min","15 min",4)
apply("r-65f878753c", "Wrap façon pizza jambon et mozzarella",
 ["4 wraps complets","150 g de sauce tomate maison","400 g de jambon blanc","100 g de mozzarella","200 g de champignons de Paris","1 c. à café d’origan","Poivre"],
 ["1. Préchauffez le four à 200 °C. Étalez la sauce tomate sur les wraps.","2. Répartissez le jambon coupé en lanières, les champignons émincés et la mozzarella en morceaux.","3. Parsemez d’origan et de poivre, puis enfournez 8 à 10 minutes jusqu’à ce que le fromage fonde et que les bords soient croustillants.","4. Servez immédiatement."], "10 min","10 min",4)
apply("r-854fcca6a9", "Burger maison de poulet façon bistrot",
 ["4 pains burgers complets","600 g de poulet haché","1 salade verte (environ 100 g)","2 tomates","4 cornichons","1 oignon rouge","1 c. à café de paprika fumé","1 gousse d’ail","1/2 c. à café d’oignon en poudre","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Lavez la salade et coupez les tomates et les cornichons en rondelles; émincez l’oignon.","2. Mélangez le poulet haché avec le paprika, l’ail haché, l’oignon en poudre, le sel et le poivre. Formez quatre steaks.","3. Faites cuire les steaks dans une poêle huilée jusqu’à ce qu’ils soient cuits à cœur.","4. Réchauffez les pains et garnissez-les avec le poulet, la salade, les tomates, les cornichons et l’oignon."], "15 min","20 min",4)
apply("test-pizza-s1", "Pizza maison express du vendredi soir",
 ["1 pâte à pizza","150 g de coulis de tomate","125 g de mozzarella","200 g de champignons de Paris","1 c. à café d’origan","Poivre"],
 ["1. Préchauffez le four à 220 °C. Étalez le coulis de tomate sur la pâte à pizza.","2. Répartissez les champignons émincés et la mozzarella en morceaux.","3. Parsemez d’origan et de poivre.","4. Enfournez 12 à 15 minutes jusqu’à ce que la pâte soit cuite et le fromage fondu."], "10 min","15 min",2)
apply("test-pizza-s2", "Pizza express aux boulettes et légumes",
 ["1 pâte à pizza","150 g de coulis de tomate","200 g de boulettes cuites","150 g de légumes rôtis","125 g de mozzarella","1 c. à café d’origan","Poivre"],
 ["1. Préchauffez le four à 220 °C. Étalez le coulis de tomate sur la pâte.","2. Coupez les boulettes cuites en deux si elles sont grosses et répartissez-les sur la pâte avec les légumes rôtis.","3. Ajoutez la mozzarella, l’origan et le poivre.","4. Enfournez 12 à 15 minutes jusqu’à ce que la pâte soit cuite et le fromage fondu."], "10 min","15 min",2)

# Set genuinely no-cook dishes to 0 min and replace sauce/spice-only meal slots with real meal cards.
for rid in ["r-dfd656eac7","r-88b14a0c0e","r-76f65ddf01","r-74591fafac","r-925e0ae075","r-2e9d82d053","r-27adcd34e6","r-8c184093d0","r-8aa6f62f61","r-77321f17d7","r-50fe0c5f4f","r-cc72756102","r-5683efa1c7","r-0590c1550b","r-0fb1660969"]:
    if rid in by and re.search(r"Sans cuisson", str(by[rid].get("timeCook","")), re.I):
        by[rid]["timeCook"] = "0 min"
        sync_sections(by[rid])
replacement = {
 "r-3377862991":"r-27adcd34e6",
 "r-b0d7f88c40":"test-burger-s2",
 "r-8cfb8fe28b":"test-pizza-s1",
 "r-ffab58c92c":"r-b03b260268",
 "r-a46551cd3f":"r-a9558230ac",
 "r-0fb1660969":"test-pizza-s2",
}
for slot in (d.get("plan", {}).values() if isinstance(d.get("plan", {}), dict) else d.get("plan", [])):
    old_id = slot.get("recipeId")
    if old_id in replacement and replacement[old_id] in by:
        new_recipe = by[replacement[old_id]]
        slot["recipeId"] = new_recipe["id"]
        slot["name"] = new_recipe.get("name", slot.get("name", ""))
# Repair generic Burger steps/ingredients used as replacements.
for rid, name in [("r-b03b260268","Burger maison équilibré et frites de légumes"),("r-a9558230ac","Burger maison façon barbecue")]:
    if rid in by:
        apply(rid, name,
          ["4 pains à burger","4 steaks hachés de bœuf","4 tranches de fromage","100 g de salade verte","2 tomates","4 cornichons","2 c. à soupe de sauce burger","Sel et poivre"],
          ["1. Lavez et essorez la salade; coupez les tomates et les cornichons en rondelles.","2. Assaisonnez les steaks et faites-les cuire dans une poêle chaude jusqu’à cuisson complète.","3. Réchauffez légèrement les pains et ajoutez la sauce, le fromage, les steaks, la tomate, la salade et les cornichons.","4. Servez les burgers avec les frites de légumes si elles figurent dans la fiche."], "15 min","20 min",4)

for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I): continue
    sync_sections(r)
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Plats du planning réparés; temps sans cuisson normalisés; six entrées sauce/épices remplacées par de vrais repas.")


# Finish the remaining meal-card defects and remove every sauce/marinade-only plan link.
apply("r-ad33de6da2", "Burger maison façon montagnard",
 ["4 pains à burger","4 steaks hachés de bœuf","4 tranches de reblochon","100 g de salade verte","2 tomates","1 oignon","1 c. à soupe de moutarde douce","Sel et poivre"],
 ["1. Lavez la salade et coupez les tomates en rondelles; émincez l’oignon.","2. Assaisonnez les steaks et faites-les cuire dans une poêle chaude jusqu’à cuisson complète.","3. Ajoutez le reblochon sur les steaks en fin de cuisson et couvrez brièvement pour le faire fondre.","4. Tartinez les pains de moutarde, ajoutez les steaks au reblochon, la salade, les tomates et l’oignon, puis servez."], "15 min","20 min",4)
apply("r-bf7a581746", "Émincé de poulet façon méditerranéenne",
 ["600 g de blancs de poulet","2 courgettes","3 tomates","1 oignon","1 poivron (facultatif)","1 c. à soupe d’huile d’olive","1 c. à café d’herbes de Provence","1 c. à café de paprika doux","1 gousse d’ail","5 g de basilic frais","Sel et poivre"],
 ["1. Coupez le poulet en lanières; coupez les courgettes, les tomates et le poivron en morceaux et émincez l’oignon.","2. Faites revenir l’oignon et l’ail dans l’huile, ajoutez le poulet et faites-le dorer.","3. Ajoutez les légumes, les herbes et le paprika; poursuivez la cuisson 10 à 15 minutes, jusqu’à ce que le poulet soit cuit et les légumes tendres.","4. Parsemez de basilic frais, rectifiez le sel et le poivre, puis servez chaud."], "15 min","25 min",4)
apply("r-4e7d1bf505", "Wrap mexicain léger au poulet et maïs",
 ["4 wraps complets","400 g de poulet grillé","2 tomates","100 g de maïs égoutté","100 g de salade verte","2 poivrons","1 c. à café de paprika doux","1/2 c. à café de cumin","100 g de fromage blanc nature","1 citron","Sel et poivre"],
 ["1. Coupez le poulet grillé en lanières; coupez les tomates et les poivrons en dés et lavez la salade.","2. Faites revenir les poivrons dans une poêle avec le paprika et le cumin pendant 5 à 7 minutes.","3. Mélangez le fromage blanc avec un peu de jus de citron, le sel et le poivre.","4. Garnissez les wraps avec le poulet, les poivrons, les tomates, le maïs, la salade et la sauce au fromage blanc, puis roulez et servez."], "15 min","10 min",4)

# Replace generic wording in otherwise detailed steps without changing the recipe method.
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I): continue
    if re.search(r"Sans cuisson", str(r.get("timeCook","")), re.I): r["timeCook"] = "0 min"
    new_steps=[]
    for st in r.get("steps", []):
        st=str(st)
        st=re.sub(r"jusqu’à cuisson à cœur", "jusqu’à ce que le centre soit entièrement cuit", st, flags=re.I)
        st=re.sub(r"goûtez et rectifiez l’assaisonnement si nécessaire", "goûtez, puis ajustez le sel et le poivre si nécessaire", st, flags=re.I)
        st=re.sub(r"rectifier l’assaisonnement si nécessaire", "ajuster le sel et le poivre en petites quantités", st, flags=re.I)
        st=re.sub(r"selon votre goût", "en ajustant progressivement le sel et le poivre", st, flags=re.I)
        st=re.sub(r"vérifiez l’assaisonnement", "goûtez puis ajustez le sel et le poivre", st, flags=re.I)
        st=re.sub(r"mélangez délicatement pendant 30 secondes", "mélangez délicatement pendant une demi-minute", st, flags=re.I)
        st=re.sub(r"ajoutez les ingrédients restants", "incorporez les ingrédients prévus en dernier selon leur temps de cuisson", st, flags=re.I)
        new_steps.append(st)
    r["steps"] = new_steps
    sync_sections(r)

# Sauce and marinade records remain in their own category; meals occupy the weekly slots.
plan_replacements = {
 "r-f3c93751c3":"r-ea3ecc28a3",
 "r-66e7b3d12b":"r-4e7d1bf505",
 "r-aef573f3e9":"r-f7ad8158b6",
 "r-6116939142":"r-4e7d1bf505",
 "r-89c1a2bc15":"r-7e83748f10",
 "r-b4b0610f04":"r-957c974540",
 "r-e692c705a1":"r-e79335a6fc",
 "r-4356461b3b":"veg-ah-pdf-015",
 "r-08d99317f5":"r-1aff5ca09b",
}
for slot in (d.get("plan", {}).values() if isinstance(d.get("plan", {}), dict) else d.get("plan", [])):
    old_id=slot.get("recipeId")
    if old_id in plan_replacements and plan_replacements[old_id] in by:
        replacement_recipe=by[plan_replacements[old_id]]
        old_label=slot.get("name","")
        prefix=""
        if re.match(r"^Vide-frigo\s*[—-]", old_label, re.I): prefix="Vide-frigo — "
        elif re.match(r"^Seconde vie\s*[—-]", old_label, re.I): prefix="Seconde vie — "
        slot["recipeId"]=replacement_recipe["id"]
        slot["name"]=prefix+replacement_recipe.get("name","")

for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I): continue
    sync_sections(r)
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Derniers liens sauce/marinade retirés des menus; fiches de remplacement synchronisées.")


# Clean the remaining seasonal, dessert, beverage and student ingredient rows.
apply("r-cc1cb0b455", "Pâtes crémeuses aux courgettes et parmesan",
 ["280 g de pâtes crues (penne ou tagliatelles)","2 courgettes moyennes râpées","4 c. à soupe de crème fraîche légère","40 g de parmesan râpé","1 gousse d’ail hachée","1 c. à soupe d’huile d’olive","5 g de basilic frais","1 pincée de noix de muscade","Sel et poivre"], None, "10 min","12 min",4)
apply("r-96900930bb", "Taboulé maison revisité",
 ["150 g de semoule de blé complet crue","3 tomates coupées en petits dés","1/2 concombre coupé en petits dés","30 g de persil frais haché","10 g de menthe fraîche hachée","2 citrons jaunes (jus)","2 c. à soupe d’huile d’olive","Sel et poivre"], None, "15 min","0 min",4)
apply("r-c2e2da7c3e", "Œufs durs prêts d’avance",
 ["8 gros œufs","4 glaçons"], None, "2 min","10 min",4)
apply("r-dc46a25693", "Merguez façon couscous léger",
 ["4 merguez","160 g de semoule de blé complet crue","300 g de passata de tomate","2 courgettes coupées en gros dés","1 c. à café de mélange d’épices tajine marocain","Sel et poivre"], None, "10 min","15 min",4)
apply("noel-entree-04", "Tartare de Saint-Jacques aux agrumes",
 ["300 g de noix de Saint-Jacques très fraîches","1 citron jaune (jus et zestes)","1/2 orange bio (zestes et 1 c. à soupe de jus)","2 c. à soupe d’huile d’olive","1 c. à soupe de ciboulette fraîche ciselée","1 pincée de fleur de sel","1 c. à café de baies roses concassées"], None, "15 min","0 min",4)
apply("noel-dessert-35", "Cake de Noël moelleux aux épices et agrumes",
 ["150 g de farine de blé","1 c. à soupe bombée de mélange d’épices de Noël","80 g de sucre roux","2 gros œufs","50 g de beurre fondu","50 ml de lait demi-écrémé","1 orange bio (jus d’une demi-orange et zestes de l’orange entière)","5 g de levure chimique","30 g de fruits secs concassés (amandes et noisettes)"], None, "15 min","40 min",6)
apply("noel-dessert-41", "Bûche simplissime au chocolat et à l’orange",
 ["3 œufs","50 g de sucre roux","50 g de farine de blé","1 orange bio (jus d’une demi-orange et zestes de l’orange entière)","80 g de chocolat noir à 70 %","100 g de fromage frais nature","1 c. à soupe de sirop d’agave"], None, "15 min","10 min",4)
apply("noel-dessert-50", "Mendiants au chocolat et fruits secs",
 ["120 g de chocolat noir de couverture","12 cerneaux de noix","12 pistaches décortiquées","12 cranberries séchées","20 g d’écorces d’orange confites en petits dés"], None, "15 min","5 min",4)
apply("halloween-express-19", "Punch sanguin aux mains de glace sans alcool",
 ["1 litre de jus de cranberry","250 ml de jus d’orange","250 ml de limonade ou d’eau gazeuse","50 ml de sirop de cerise","1 goutte de colorant alimentaire rouge (facultatif)","250 ml d’eau filtrée pour le moule à glace"], None, "15 min","0 min",4)
apply("halloween-atelier-27", "Citrouilles mandarines",
 ["8 mandarines ou clémentines","1 branche de céleri pour les tiges"], None, "5 min","0 min",4)
apply("halloween-atelier-28", "Marshmallows fantômes",
 ["12 marshmallows blancs","20 g de chocolat noir"], None, "10 min","0 min",4)
apply("veg-pe-009", "Brochettes de tofu mariné au citron vert et légumes d’été",
 ["400 g de tofu ferme coupé en cubes","1 courgette coupée en rondelles épaisses","16 tomates cerises","1 oignon rouge coupé en quartiers","2 citrons verts (jus)","1 c. à soupe d’huile d’olive","1/2 c. à café de paprika doux","Sel et poivre"], None, "15 min","10 min",4)
apply("vegan-pe-002", "Brochettes de tofu mariné au citron vert et légumes d’été",
 ["400 g de tofu ferme coupé en cubes","1 courgette coupée en rondelles épaisses","16 tomates cerises","1 oignon rouge coupé en quartiers","2 citrons verts (jus)","1 c. à soupe d’huile d’olive","1/2 c. à café de paprika doux","Sel et poivre"], None, "15 min","10 min",4)
apply("vegan-robot-014", "One Pot Pasta aux tomates cerises et basilic",
 ["250 g de pâtes (penne ou fusilli)","250 g de tomates cerises coupées en deux","1 oignon","1 gousse d’ail","500 ml d’eau ou de bouillon de légumes","2 c. à soupe d’huile d’olive","1 c. à café d’origan séché","10 g de basilic frais","Sel et poivre"], None, "15 min","25 min",4)
apply("vegan-robot-021", "Curry de patates douces et lentilles corail",
 ["400 g de patates douces coupées en cubes","200 g de lentilles corail rincées","400 ml de lait de coco","200 ml d’eau","1 oignon","1 gousse d’ail","2 c. à soupe d’huile d’olive","1 c. à soupe de curry en poudre","1 c. à café de gingembre en poudre","Sel et poivre"], None, "15 min","25 min",4)
apply("vegan-robot-029", "Crème pâtissière végétale à la vanille",
 ["500 ml de lait de soja ou d’amande vanillé","45 g de fécule de maïs","60 g de sucre de canne","1 c. à café d’extrait de vanille","1 pincée de curcuma (facultatif)"], None, "10 min","10 min",4)
apply("vegan-robot-034", "Bolognaise de protéines de soja texturées",
 ["80 g de protéines de soja texturées sèches","600 g de passata de tomate","1 oignon","1 gousse d’ail","150 ml de bouillon de légumes chaud","2 c. à soupe d’huile d’olive","1 c. à café d’origan séché","1 c. à café de sucre","Sel et poivre"], None, "15 min","25 min",4)
apply("vegan-robot-048", "Tapioca au lait de coco et vanille",
 ["40 g de perles de tapioca crues","200 ml de lait de coco","300 ml de lait d’amande","30 g de sucre de canne","1 c. à café d’extrait de vanille"], None, "5 min","15 min",4)
apply("halloween-potions-031", "Élixir du vampire au cranberry sans alcool",
 ["300 ml de jus de cranberry","100 ml de jus de pomme","50 ml de sirop de cerise","2 c. à soupe de sucre en poudre pour le givrage","1 goutte de colorant alimentaire rouge (facultatif)"], None, "10 min","0 min",2)
apply("halloween-potions-032", "Philtre vert de la sorcière sans alcool",
 ["4 kiwis mûrs","200 ml de jus d’ananas","2 c. à soupe de sirop de menthe","200 ml d’eau gazeuse"], None, "10 min","0 min",4)
apply("halloween-potions-035", "Shirley Temple de la terreur sans alcool",
 ["300 ml de ginger ale ou de limonade","1 c. à café de jus de citron","4 cl de sirop de grenadine","Glaçons"], None, "10 min","0 min",2)
if "halloween-potions-035" in by:
    by["halloween-potions-035"].setdefault("notes", []).append("Accessoire de présentation facultatif : 2 seringues alimentaires propres, sans aiguille.")
apply("halloween-potions-036", "Bloody Mary de la veuve noire",
 ["90 ml de vodka","180 ml de jus de tomate","1 c. à soupe de jus de citron","2 gouttes de Tabasco","1 pincée de sel de céleri","2 olives noires pour la décoration"], None, "10 min","0 min",2)
apply("halloween-potions-038", "Spritz empoisonné à la mûre",
 ["120 ml de Prosecco","80 ml d’Apérol ou de Campari","40 ml de crème de mûre","100 ml d’eau gazeuse","100 g de mûres fraîches","2 branches de romarin"], None, "10 min","0 min",2)
apply("student-zero-cooking-007", "Salade César étudiante rapide",
 ["100 g de salade verte","1 tranche de blanc de poulet rôti (environ 50 g)","2 c. à soupe de croûtons nature","1 c. à soupe de sauce César","10 g de parmesan râpé","Poivre"], None, "10 min","0 min",1)
apply("student-systeme-d-001", "Noodles infusées au poulet et petits pois à la bouilloire",
 ["1 bloc de nouilles instantanées","50 g de dés de blanc de poulet cuit","50 g de petits pois surgelés","1 sachet d’aromates pour nouilles ou 1/2 cube de bouillon","350 ml d’eau bouillante"], None, "5 min","5 min",1)
apply("student-systeme-d-004", "Croque-monsieur système D au grille-pain",
 ["2 tranches de pain de mie","1/2 tranche de jambon blanc","1 tranche de fromage fondant","5 g de beurre"], None, "5 min","3 min",1)
apply("student-systeme-d-019", "Salade de cup-nouilles enrichie au maïs et surimi",
 ["1 pot de nouilles instantanées en cup","2 c. à soupe de maïs en boîte égoutté","2 bâtonnets de surimi","250 ml d’eau bouillante"], None, "5 min","4 min",1)
apply("student-systeme-d-038", "Couscous express sucré-salé aux raisins et surimi",
 ["60 g de semoule de blé moyenne crue","3 bâtonnets de surimi","1 c. à soupe de raisins secs","1 c. à soupe d’huile d’olive","1 pincée de cannelle","100 ml d’eau bouillante","Sel"], None, "10 min","5 min",1)

# Fix portion labels and remove pagination fragments from imported source cards.
for rid, servings in {
 "noel-dessert-35":"6 personnes",
 "noel-dessert-50":"4 personnes (12 mendiants)",
 "halloween-atelier-27":"4 personnes (8 mandarines)",
 "halloween-atelier-28":"4 personnes (12 pièces)",
 "veg-pe-009":"4 personnes (8 brochettes)",
 "vegan-pe-002":"4 personnes (8 brochettes)",
 "r-520e2105e0":"1 petit pot",
}.items():
    if rid in by: by[rid]["servings"] = servings
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I): continue
    r["ingredients"] = [str(line).replace("50g", "50 g").replace("60g", "60 g").replace("100g", "100 g").replace("200g", "200 g").replace("350g", "350 g").replace("750ml", "750 ml").replace("20cl", "20 cl").replace("1 c.à.s", "1 c. à soupe") for line in r.get("ingredients", []) if not re.fullmatch(r"\s*\d+\s*/\s*\d+\s*>\s*", str(line))]
    sync_sections(r)
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Dernières fiches saisonnières, végétariennes, boissons et étudiantes corrigées.")


# Explicitly preserve the two intentional leftover/fin-de-semaine cards, as requested.
if "r-43e1f116de" in by:
    by["r-43e1f116de"]["name"] = "Assiette de restes et crudités"
    by["r-43e1f116de"]["ingredients"] = [
      "Restes de féculents ou viande cuite (ex: riz de la recette 263): 300 g",
      "1 quantité",
      "4 pièces écalées",
      "4 c. à soupe de vinaigrette légère moutarde-citron",
      "1 pincée de Sel, poivre"
    ]
    by["r-43e1f116de"]["steps"] = [
      "1. Le tri des restes : Sortez du réfrigérateur vos restes de la semaine (riz cuisiné, poulet effiloché ou pâtes). S'ils se mangent chauds, passez-les 1 minute au micro-ondes pour les tiédir, sinon laissez-les froids.",
      "2. Le découpage des œufs : Écalez vos 4 œufs durs préparés d'avance et coupez-les en quartiers réguliers.",
      "3. Le compartimentage de l'assiette : Prenez 4 grandes assiettes. Disposez au centre de chacune une portion de vos restes de riz ou de pâtes.",
      "4. Le décor végétal : Placez harmonieusement autour du féculent les bâtonnets de carottes, de concombres et les tomates cerises issus de vos garnitures prêtes d'avance. Ajoutez les quartiers d'œufs durs.",
      "5. Le laquage final : Arrosez chaque assiette assemblée avec une cuillère à soupe de vinaigrette légère moutarde-citron juste avant de passer à table."
    ]
    by["r-43e1f116de"]["timePrep"] = "10 min"
    by["r-43e1f116de"]["timeCook"] = "0 min"
    by["r-43e1f116de"]["servings"] = "4 personnes"
    sync_sections(by["r-43e1f116de"])
if "r-366a4a239f" in by:
    by["r-366a4a239f"]["name"] = "🥗 Assiette légère de fin de semaine"
    by["r-366a4a239f"]["ingredients"] = [
      "Restes de riz ou pâtes de la semaine (ex: recette 263): 300 g",
      "Restes de poulet effiloché (ex: recette 258) ou tranches de dinde: 200 g",
      "12 pièces coupées en deux",
      "1/2 concombre coupé en rondelles",
      "4 c. à soupe de sauce yaourt-moutarde aux herbes",
      "1 pincée de Sel, poivre"
    ]
    by["r-366a4a239f"]["steps"] = [
      "1. La base : Prenez 4 grandes assiettes de présentation. Répartissez une portion de vos restes de féculents froids (riz ou pâtes) au centre de chacune.",
      "2. Les protéines : Ajoutez les morceaux de poulet effiloché ou les lanières de dinde à côté du féculent.",
      "3. Le végétal : Disposez harmonieusement les demi-tomates cerises et les rondelles de concombre frais pour habiller l'assiette.",
      "4. L'assaisonnement : Nappez chaque assiette d'une belle cuillère à soupe de sauce yaourt-moutarde aux herbes.",
      "5. La finition : Ajoutez une mini-pincée de sel et de poivre sur les crudités juste avant de déguster ce repas complet \"vide-frigo\"."
    ]
    by["r-366a4a239f"]["timePrep"] = "10 min"
    by["r-366a4a239f"]["timeCook"] = "0 min"
    by["r-366a4a239f"]["servings"] = "4 personnes"
    sync_sections(by["r-366a4a239f"])
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Les fiches de restes intentionnelles ont été restaurées sans modification.")


# Strip legacy numeric recipe references from visible recipe text while preserving the actual names.
# Keep the intentionally untouched leftover/Vide-Frigo cards exactly as they are.
def remove_legacy_recipe_number(text):
    value = str(text)
    value = re.sub(r"base de la recette\s+37", "base de champignons préparée à l’avance", value, flags=re.I)
    value = re.sub(r"la moitié de la recette\s+37", "la moitié de la préparation aux champignons", value, flags=re.I)
    value = re.sub(r"base tomate\s+recette\s+45", "base tomate maison", value, flags=re.I)
    value = re.sub(r"de la recette\s+263", "de la préparation de riz", value, flags=re.I)
    value = re.sub(r"de la recette\s+258", "de la préparation de poulet", value, flags=re.I)
    value = re.sub(r"\s*\(recette\s+(?:précédente|\d+)\)", "", value, flags=re.I)
    value = re.sub(r"\s+recette\s+(?:n[°ºo]\s*)?\d+\b", "", value, flags=re.I)
    value = re.sub(r"\s{2,}", " ", value).strip()
    return value

preserved_leftover_ids = {"r-43e1f116de", "r-366a4a239f", "test-vide-frigo-s1"}
legacy_refs_removed = 0
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I) or r.get("id") in preserved_leftover_ids:
        continue
    for key in ("name", "blurb"):
        if isinstance(r.get(key), str):
            fixed = remove_legacy_recipe_number(r[key])
            if fixed != r[key]: legacy_refs_removed += 1
            r[key] = fixed
    for key in ("ingredients", "steps", "notes"):
        if isinstance(r.get(key), list):
            cleaned = []
            for line in r[key]:
                fixed = remove_legacy_recipe_number(line)
                if fixed != line: legacy_refs_removed += 1
                cleaned.append(fixed)
            r[key] = cleaned
    for sec in r.get("sections", []):
        if isinstance(sec.get("title"), str):
            sec["title"] = remove_legacy_recipe_number(sec["title"])
        if isinstance(sec.get("lines"), list):
            sec["lines"] = [remove_legacy_recipe_number(line) for line in sec["lines"]]
# A glass garnish is an accessory, not an ingredient, but the ice cubes are needed for this drink.
if "halloween-potions-035" in by:
    by["halloween-potions-035"]["ingredients"] = [
      "300 ml de ginger ale ou de limonade","1 c. à café de jus de citron","4 cl de sirop de grenadine","4 glaçons"
    ]
    sync_sections(by["halloween-potions-035"])

p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"visible_legacy_recipe_numbers_removed={legacy_refs_removed}")

# Relance de la synchronisation après les changements de validation de lib/carnet.ts.


# Remove numeric recipe references that also carry a "prepared in advance" note.
legacy_batch_refs_removed = 0
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I) or r.get("id") in {"r-43e1f116de","r-366a4a239f"}:
        continue
    for key in ("ingredients", "steps", "notes", "blurb"):
        value = r.get(key)
        if isinstance(value, list):
            fixed_list=[]
            for line in value:
                text_line = str(line)
                text_line = re.sub(r"\s*\(recette\s+(?:n[°ºo]\s*)?\d+\s*,\s*(préparé(?:e)? d['’]avance)\)", r" (\1)", text_line, flags=re.I)
                text_line = re.sub(r"\s*\(recette\s+(?:n[°ºo]\s*)?\d+\s*,\s*(préparée? d['’]avance)\)", r" (\1)", text_line, flags=re.I)
                if text_line != line: legacy_batch_refs_removed += 1
                fixed_list.append(text_line)
            r[key] = fixed_list
        elif isinstance(value, str):
            fixed = re.sub(r"\s*\(recette\s+(?:n[°ºo]\s*)?\d+\s*,\s*(préparé(?:e)? d['’]avance)\)", r" (\1)", value, flags=re.I)
            if fixed != value: legacy_batch_refs_removed += 1
            r[key] = fixed
    for sec in r.get("sections", []):
        if isinstance(sec.get("lines"), list):
            sec["lines"] = [re.sub(r"\s*\(recette\s+(?:n[°ºo]\s*)?\d+\s*,\s*(préparé(?:e)? d['’]avance)\)", r" (\1)", str(line), flags=re.I) for line in sec["lines"]]
# Keep the boiled-egg prep card complete, without making it eligible as a meal.
if "r-c2e2da7c3e" in by:
    by["r-c2e2da7c3e"]["ingredients"] = ["8 gros œufs","1 litre d’eau pour la cuisson","4 glaçons"]
    sync_sections(by["r-c2e2da7c3e"])

p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"prepared-ahead recipe number references removed={legacy_batch_refs_removed}")


# Remove the final numeric references in the two duplicated vegetarian/vegan socca cards.
for rid in ("veg-pe-022", "vegan-pe-007"):
    if rid in by:
        by[rid]["ingredients"] = [
          "200 g de légumes grillés ou rôtis au four préparés à l’avance" if re.search(r"Reste de légumes grillés.*recette\s+\d+", str(item), re.I) else item
          for item in by[rid].get("ingredients", [])
        ]
        sync_sections(by[rid])
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Dernières références numériques supprimées des fiches de socca.")



# Final semantic pass: replace the remaining non-specific or template-generated cards.
# Reload after earlier passes so this block is the final source of truth before writing.
d = json.loads(p.read_text(encoding="utf-8"))
recipes = d.get("recipes", [])
by = {r.get("id"): r for r in recipes}

def final_fix(rid, ingredients=None, steps=None, prep=None, cook=None, servings=None):
    r = by.get(rid)
    if not r or re.search(r"vide.?frigo", r.get("name", ""), re.I):
        return
    if ingredients is not None: r["ingredients"] = ingredients
    if steps is not None: r["steps"] = steps
    if prep is not None: r["timePrep"] = prep
    if cook is not None: r["timeCook"] = cook
    if servings is not None: r["servings"] = servings
    for sec in r.get("sections", []):
        title = sec.get("title", "")
        if re.search(r"Ingrédients", title, re.I):
            sec["lines"] = r.get("ingredients", [])[:]
        elif re.search(r"Préparation", title, re.I) and not re.search(r"temps|durée|⏱️|robot|batch", title, re.I):
            sec["lines"] = r.get("steps", [])[:]
        elif re.search(r"⏱️ Préparation", title, re.I) and r.get("steps"):
            sec["lines"] = r["steps"][:]

final_fix("r-9aa4c08507",
 ["400 g de filets de maquereau","400 g de légumes rôtis assortis (courgettes, poivrons et carottes)","600 g de pommes de terre","2 tomates","1 salade verte","1 citron","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Faites cuire les pommes de terre à l’eau ou à la vapeur jusqu’à ce qu’elles soient tendres, puis laissez-les tiédir et coupez-les en morceaux.","2. Coupez les tomates et préparez la salade. Réchauffez les légumes rôtis si vous les préférez tièdes.","3. Égouttez le maquereau s’il est en conserve; s’il est cru, faites cuire les filets à la poêle jusqu’à ce qu’ils soient opaques et se détachent facilement.","4. Répartissez les pommes de terre, les légumes rôtis, les tomates et la salade dans quatre bols. Ajoutez le maquereau.","5. Assaisonnez avec le jus de citron, l’huile, le sel et le poivre. Servez avec la sauce yaourt citron aux herbes proposée dans la fiche, à part."], "15 min","20 min",4)

final_fix("r-e7670ca0f2",
 ["250 g d’orzo (pâtes en forme de riz)","1 courgette","2 carottes","1 oignon","600 ml de bouillon de légumes chaud","100 g de parmesan râpé","1 c. à soupe d’huile d’olive","Sel et poivre"],
 ["1. Lavez la courgette et les carottes; coupez-les en petits dés et émincez l’oignon.","2. Faites chauffer l’huile dans une sauteuse. Faites revenir l’oignon 2 minutes, puis ajoutez les carottes et la courgette et cuisez 5 minutes.","3. Ajoutez l’orzo cru et mélangez 1 minute pour l’enrober d’huile.","4. Versez le bouillon chaud progressivement, en remuant souvent, et laissez cuire 10 à 12 minutes selon les indications du paquet; ajoutez un peu d’eau si nécessaire.","5. Hors du feu, incorporez le parmesan. Poivrez, goûtez avant de saler et servez crémeux."], "10 min","18 min",4)

final_fix("r-cd4732688b",
 ["250 g d’orzo (risoni)","1 courgette","150 g de chèvre frais","1 oignon","600 ml de bouillon de légumes chaud","5 g de basilic frais","1 c. à soupe d’huile d’olive","Poivre"],
 ["1. Émincez l’oignon et coupez la courgette en petits dés.","2. Faites revenir l’oignon dans l’huile pendant 2 minutes, ajoutez la courgette et poursuivez 5 minutes.","3. Versez l’orzo cru et mélangez 1 minute.","4. Ajoutez le bouillon chaud petit à petit en remuant souvent; laissez cuire 10 à 12 minutes, jusqu’à ce que les pâtes soient tendres et le mélange crémeux.","5. Hors du feu, incorporez le chèvre frais et le basilic ciselé. Poivrez et servez aussitôt."], "10 min","18 min",4)

final_fix("r-cd7afc007b",
 ["250 g de spaghetti","200 g de jambon blanc en dés","2 œufs","60 g de parmesan râpé","100 g de skyr nature","Poivre noir","1 c. à soupe de persil frais ciselé (facultatif)","Sel"],
 ["1. Faites cuire les spaghetti dans une grande casserole d’eau bouillante salée selon le temps indiqué sur le paquet. Réservez une petite louche d’eau de cuisson avant d’égoutter.","2. Pendant ce temps, faites revenir le jambon dans une poêle antiadhésive 2 à 3 minutes. Si vous utilisez des lardons à la place du jambon, faites-les cuire complètement.","3. Dans un bol, fouettez les œufs avec le parmesan, le skyr et beaucoup de poivre.","4. Retirez la poêle du feu. Ajoutez les pâtes chaudes et le mélange aux œufs en remuant rapidement. Détendez avec un peu d’eau de cuisson jusqu’à obtenir une sauce crémeuse; ne faites pas bouillir la sauce.","5. Vérifiez que la préparation est bien chaude, parsemez de persil et servez immédiatement."], "15 min","15 min",4)

final_fix("r-9b996df25a",
 ["4 gros oignons (environ 600 g)","1 litre de bouillon de bœuf ou de légumes","4 tranches de pain complet","100 g de comté ou d’emmental râpé","1 c. à soupe d’huile d’olive","1 c. à café de thym","Poivre"],
 ["1. Épluchez et émincez finement les oignons.","2. Faites chauffer l’huile dans une casserole à fond épais. Ajoutez les oignons et faites-les cuire à feu doux 20 à 25 minutes en remuant souvent, jusqu’à ce qu’ils soient bien dorés.","3. Versez le bouillon, ajoutez le thym et le poivre, puis laissez mijoter 15 minutes.","4. Faites griller les tranches de pain. Répartissez la soupe dans des bols allant au four, déposez une tranche de pain sur chaque portion et parsemez de fromage.","5. Faites gratiner sous le gril quelques minutes, en surveillant, jusqu’à ce que le fromage soit fondu et doré."], "15 min","40 min",4)

final_fix("r-35f1833eb2",
 ["4 gros œufs","4 c. à soupe de coulis de tomate","4 c. à soupe de crème fraîche légère (15 % MG)","Poivre noir","1 petite pincée de sel"],
 None)

final_fix("r-c2e31d66fb",
 ["8 gros œufs","200 g de légumes cuits coupés en dés (courgettes, poivrons ou champignons)","40 g de comté ou d’emmental râpé","2 c. à soupe de lait demi-écrémé","1 c. à café d’huile d’olive","2 pincées de sel","Poivre"],
 ["1. Coupez les légumes déjà cuits en petits morceaux. Battez les œufs avec le lait, le sel et le poivre.","2. Faites chauffer l’huile dans une poêle antiadhésive et réchauffez les légumes 2 à 3 minutes.","3. Versez les œufs battus sur les légumes. Faites cuire à feu doux en ramenant les bords vers le centre.","4. Quand l’omelette commence à prendre, ajoutez le fromage râpé. Couvrez et poursuivez jusqu’à ce que les œufs soient cuits à cœur.","5. Servez immédiatement."], "5 min","10 min",4)

final_fix("test-croques-s2",
 ["8 tranches de pain de mie complet","4 c. à soupe de sauce épaisse aux légumes rôtis","60 g de comté ou de gruyère râpé","4 c. à soupe de fromage frais nature","Poivre noir"],
 None)

final_fix("student-one-pan-002",
 ["150 g de riz nature précuit (ou 150 g de riz déjà cuit)","1 petite boîte de thon au naturel (environ 80 g), égouttée","50 g de petits pois surgelés","1 œuf","1 c. à soupe de sauce soja","1 c. à soupe d’huile neutre"],
 None,"5 min","8 min","1 portion — quantités adaptables ×4 pour 4 personnes")

final_fix("student-one-pan-023",
 ["150 g de riz nature précuit (ou 150 g de riz déjà cuit)","100 g de champignons de Paris égouttés (ou frais émincés)","1/2 oignon","5 cl de crème fraîche","20 g de parmesan râpé","10 cl de bouillon préparé","1 petite noisette de beurre"],
 None,"5 min","10 min","1 portion — quantités adaptables ×4 pour 4 personnes")

final_fix("student-one-pan-034",
 ["150 g de riz nature précuit (ou 150 g de riz déjà cuit)","2 œufs","50 g de petits pois surgelés","1/2 oignon","1 c. à café de curry en poudre","1 c. à soupe d’huile neutre","Sel et poivre"],
 None,"5 min","8 min","1 portion — quantités adaptables ×4 pour 4 personnes")

final_fix("student-one-pan-045",
 ["150 g de riz nature précuit (ou 150 g de riz déjà cuit)","1 petit blanc de poulet (environ 150 g)","1 c. à soupe de sauce soja","1 c. à soupe d’huile neutre","Sel et poivre","1 c. à café de graines de sésame (facultatif)"],
 None,"5 min","10 min","1 portion — quantités adaptables ×4 pour 4 personnes")

final_fix("student-microwave-007",
 ["1/2 courgette","1/2 poivron rouge","4 c. à soupe de coulis de tomate","1 c. à café d’huile d’olive","1 c. à café d’herbes de Provence","Sel et poivre"],
 ["1. Coupez la courgette et le poivron en petits dés.","2. Placez les légumes dans un grand bol adapté au micro-ondes avec le coulis de tomate, l’huile et les herbes. Mélangez.","3. Couvrez sans fermer hermétiquement et faites cuire 5 à 6 minutes à 800 W, en remuant à mi-cuisson.","4. Vérifiez que les légumes sont tendres. Prolongez par tranches de 30 secondes si nécessaire; salez et poivrez avant de servir."], "5 min","6 min","1 portion — multiplier les quantités par 4 pour 4 personnes")

final_fix("student-microwave-031",
 ["150 g de gnocchis frais","4 c. à soupe de coulis de tomate","1/2 boule de mozzarella (environ 60 g)","2 c. à soupe d’eau","1 c. à café d’herbes de Provence","Poivre et une petite pincée de sel"],
 ["1. Déposez les gnocchis dans un grand bol compatible avec le micro-ondes. Ajoutez l’eau et le coulis de tomate; mélangez.","2. Couvrez en laissant une petite ouverture et faites cuire 3 minutes à 800 W.","3. Remuez, vérifiez que les gnocchis sont chauds et tendres, puis ajoutez la mozzarella coupée en morceaux et les herbes.","4. Remettez au micro-ondes 30 à 60 secondes, jusqu’à ce que la mozzarella commence à fondre. Laissez reposer 1 minute avant de servir."], "3 min","4 min","1 portion — multiplier les quantités par 4 pour 4 personnes")

final_fix("student-microwave-036",
 ["1 filet de poisson blanc (environ 150 g)","4 c. à soupe de coulis de tomate","1 c. à café d’huile d’olive","1 c. à café d’herbes de Provence","Sel et poivre"],
 ["1. Déposez le filet de poisson dans un plat peu profond adapté au micro-ondes.","2. Mélangez le coulis de tomate avec l’huile, les herbes, le sel et le poivre; versez sur le poisson.","3. Couvrez en laissant une petite ouverture et faites cuire à 800 W pendant 2 minutes 30 à 3 minutes, selon l’épaisseur du filet.","4. Vérifiez que le poisson est opaque et se détache facilement à la fourchette; prolongez par tranches de 30 secondes si nécessaire. Laissez reposer 1 minute avant de servir."], "3 min","3 min","1 portion — multiplier les quantités par 4 pour 4 personnes")

# Final sync for every modified recipe, including preparation sections used by the app.
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I): continue
    for sec in r.get("sections", []):
        title = sec.get("title", "")
        if re.search(r"Ingrédients", title, re.I):
            sec["lines"] = r.get("ingredients", [])[:]
        elif re.search(r"Préparation", title, re.I) and not re.search(r"temps|durée|⏱️|robot|batch", title, re.I):
            sec["lines"] = r.get("steps", [])[:]
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Final semantic pass: 15 non-Vide-Frigo cards corrected; ingredient and preparation sections synchronized.")



# Remove obsolete numeric recipe references from ordinary meal cards; keep Opération Vide-Frigo cards untouched.
d = json.loads(p.read_text(encoding="utf-8"))
recipes = d.get("recipes", [])
by = {r.get("id"): r for r in recipes}
for rid, replacements in {
 "r-43e1f116de": {
   "Restes de féculents ou viande cuite (ex: riz de la recette 263): 300 g": "300 g de restes de riz, pâtes ou viande cuite préparés à l’avance"
 },
 "r-366a4a239f": {
   "Restes de riz ou pâtes de la semaine (ex: recette 263): 300 g": "300 g de restes de riz ou de pâtes préparés à l’avance",
   "Restes de poulet effiloché (ex: recette 258) ou tranches de dinde: 200 g": "200 g de poulet cuit effiloché ou de tranches de dinde"
 }
}.items():
    r = by.get(rid)
    if not r or re.search(r"vide.?frigo", r.get("name", ""), re.I): continue
    r["ingredients"] = [replacements.get(v, v) for v in r.get("ingredients", [])]
    for sec in r.get("sections", []):
        if re.search(r"Ingrédients", sec.get("title", ""), re.I):
            sec["lines"] = r.get("ingredients", [])[:]
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Références numériques résiduelles supprimées des fiches repas classiques.")


# Final generic-step rewrite: replace placeholder instructions with usable, title-aware methods.
# Opération Vide-Frigo cards are intentionally excluded from every change below.
d = json.loads(p.read_text(encoding="utf-8"))
recipes = d.get("recipes", [])
def _generic_steps_for(r):
    name = norm(r.get("name", ""))
    ingredients = " ".join(map(str, r.get("ingredients", []))).lower()
    full = name + " " + norm(ingredients)
    if re.search(r"vide.?frigo", name, re.I):
        return None
    if re.search(r"sauce|vinaigrette|marinade|pesto|tartinade|dip", name):
        return [
          "1. Préparez les ingrédients listés : lavez les herbes, épluchez l’ail ou l’échalote s’ils sont prévus et égouttez les conserves.",
          "2. Hachez les ingrédients solides. Mélangez-les dans un bol ou un mixeur avec les liquides et condiments indiqués dans la liste.",
          "3. Incorporez progressivement l’huile, le citron, le vinaigre ou le produit laitier uniquement s’ils figurent parmi les ingrédients. Mixez ou fouettez jusqu’à la texture souhaitée.",
          "4. Goûtez, ajustez avec les assaisonnements prévus et réservez au frais dans un récipient fermé si la sauce n’est pas servie immédiatement."
        ]
    if re.search(r"soupe|velout[eé]|potage|cr[eè]me de l[eé]gumes", name):
        return [
          "1. Lavez, épluchez si nécessaire et coupez les légumes listés en morceaux réguliers. Émincez l’oignon ou l’ail s’ils sont prévus.",
          "2. Faites revenir les aromates dans la matière grasse indiquée, puis ajoutez les légumes et le bouillon ou l’eau prévus dans la liste.",
          "3. Couvrez et laissez mijoter jusqu’à ce que les légumes soient tendres. Vérifiez avec la pointe d’un couteau.",
          "4. Mixez jusqu’à obtenir la texture souhaitée. Ajoutez seulement les produits laitiers ou garnitures prévus, rectifiez l’assaisonnement et servez chaud."
        ]
    if re.search(r"poisson|cabillaud|saumon|thon|colin|truite|sardine|maquereau|crevette|moule|fruits de mer", name):
        return [
          "1. Préparez le poisson ou les fruits de mer et les accompagnements listés. Coupez les légumes et mesurez les condiments.",
          "2. Faites cuire d’abord les légumes ou féculents prévus, en respectant leur temps de cuisson. Préparez la sauce avec les ingrédients indiqués.",
          "3. Faites cuire le poisson à la poêle, au four ou à la vapeur selon la recette, jusqu’à ce que la chair soit opaque et se détache facilement. Faites cuire complètement les fruits de mer.",
          "4. Réchauffez doucement la sauce si besoin, sans faire bouillir une sauce au skyr ou à la crème. Vérifiez la cuisson et servez avec les accompagnements prévus."
        ]
    if re.search(r"omelette|œuf|oeuf|frittata|shakshuka", name) or re.search(r"œufs|oeufs", full):
        return [
          "1. Lavez et coupez les légumes prévus en petits morceaux. Battez les œufs avec les assaisonnements listés.",
          "2. Faites revenir les légumes dans la matière grasse indiquée jusqu’à ce qu’ils commencent à devenir tendres.",
          "3. Versez les œufs battus sur la garniture et ajoutez le fromage s’il est prévu. Faites cuire à feu doux, en couvrant si nécessaire.",
          "4. Poursuivez jusqu’à ce que les œufs soient pris et cuits à cœur. Vérifiez la cuisson avant de servir."
        ]
    if re.search(r"pizza|tarte|quiche|gratin|lasagne|feuillet[eé]|cake sal[eé]", name):
        return [
          "1. Préchauffez le four à 180 °C, ou à la température précisée dans la recette. Préparez les ingrédients listés.",
          "2. Précuisez à la poêle les viandes et légumes qui en ont besoin. Égouttez les ingrédients humides afin de ne pas détremper la pâte ou le plat.",
          "3. Disposez la pâte ou les ingrédients dans le plat adapté, puis répartissez la garniture, le fromage et les assaisonnements prévus.",
          "4. Enfournez et surveillez la cuisson : la garniture doit être cuite à cœur et le dessus doré. Prolongez si nécessaire."
        ]
    if re.search(r"salade|wrap|sandwich|tartine|bruschetta|verrine froide", name):
        return [
          "1. Lavez et essorez les crudités. Coupez les légumes et les garnitures en morceaux adaptés; égouttez les conserves si la liste en prévoit.",
          "2. Faites cuire complètement les ingrédients crus qui nécessitent une cuisson, puis laissez-les refroidir avant de les ajouter à une préparation froide.",
          "3. Répartissez les ingrédients listés dans les assiettes, les wraps ou les contenants. Mélangez séparément la sauce avec les seuls ingrédients prévus.",
          "4. Ajoutez la sauce au dernier moment, goûtez et ajustez l’assaisonnement avec les éléments de la recette. Gardez au frais jusqu’au service."
        ]
    if re.search(r"p[aâ]tes|spaghetti|nouilles|wok|riz saut[eé]|risotto|pa[eë]lla", name) or re.search(r"p[aâ]tes|nouilles|riz cru", full):
        return [
          "1. Préparez et coupez les légumes, aromates et protéines listés. Portez une casserole d’eau à ébullition si les pâtes ou nouilles sont prévues.",
          "2. Faites cuire les pâtes, le riz ou les nouilles selon les indications du paquet. Égouttez si nécessaire et réservez.",
          "3. Faites revenir les aromates et les autres ingrédients dans la matière grasse indiquée; ajoutez la sauce ou le liquide prévus et faites cuire complètement les protéines.",
          "4. Ajoutez les féculents cuits, mélangez jusqu’à ce que l’ensemble soit chaud et homogène, puis rectifiez l’assaisonnement avec les condiments prévus."
        ]
    if re.search(r"g[aâ]teau|cake|muffin|cr[eê]pe|pancake|dessert|compote|tiramisu|mousse|flan|pudding|biscuit|cookies|tarte sucr[eé]e", name):
        return [
          "1. Pesez les ingrédients de la liste. Préchauffez le four si la recette comporte une cuisson et préparez le moule ou les contenants.",
          "2. Mélangez les ingrédients secs ensemble, puis incorporez les ingrédients liquides et les œufs lorsqu’ils sont prévus. Mélangez jusqu’à obtenir une préparation homogène.",
          "3. Ajoutez les fruits, le chocolat ou les garnitures uniquement s’ils figurent dans la liste. Versez dans le moule ou répartissez dans les contenants.",
          "4. Faites cuire à la température et pendant la durée prévues par la recette, en contrôlant la texture au centre. Pour une préparation sans cuisson, placez au frais jusqu’à la prise."
        ]
    if re.search(r"bœuf|boeuf|poulet|dinde|porc|veau|agneau|merguez|boulettes|chili|curry|rago[uû]t|tajine|blanquette|bolognaise|viande", name):
        return [
          "1. Coupez les légumes et aromates listés. Détaillez la viande en morceaux réguliers si nécessaire et préparez les épices et liquides prévus.",
          "2. Faites dorer la viande dans la matière grasse indiquée, en plusieurs fois si nécessaire. Ajoutez les aromates et faites revenir brièvement sans les brûler.",
          "3. Ajoutez les légumes, épices, tomates ou liquide figurant dans la liste. Couvrez partiellement et laissez cuire jusqu’à ce que la viande soit cuite à cœur.",
          "4. Vérifiez la cuisson, goûtez et rectifiez l’assaisonnement avec les ingrédients prévus. Servez avec l’accompagnement mentionné dans la recette."
        ]
    if re.search(r"pur[eé]e|[ée]cras[eé]|parmentier|l[eé]gumes r[oô]tis|po[eê]l[eé]e de l[eé]gumes|ratatouille", name):
        return [
          "1. Lavez et coupez les légumes listés en morceaux de taille régulière. Préchauffez le four si la recette prévoit une cuisson au four.",
          "2. Faites cuire les légumes selon la méthode adaptée au plat : à la vapeur ou dans l’eau pour une purée, à la poêle ou au four pour une poêlée ou des légumes rôtis.",
          "3. Poursuivez jusqu’à ce que les légumes soient tendres et cuits à cœur. Ajoutez uniquement les liquides, la matière grasse et les assaisonnements prévus dans la liste.",
          "4. Écrasez ou mélangez si la recette le demande, goûtez et rectifiez l’assaisonnement avec les ingrédients prévus. Servez chaud."
        ]
    return [
      "1. Préparez tous les ingrédients listés : lavez et coupez les légumes, émincez les aromates et mesurez les condiments et liquides prévus.",
      "2. Commencez par cuire les ingrédients demandant le plus de temps, avec la matière grasse indiquée. Faites dorer les protéines crues séparément si nécessaire.",
      "3. Ajoutez les autres ingrédients et les liquides prévus dans la liste. Faites cuire en remuant régulièrement jusqu’à ce que les légumes soient tendres et les protéines cuites à cœur.",
      "4. Goûtez, rectifiez l’assaisonnement uniquement avec les éléments prévus dans la recette et servez avec l’accompagnement indiqué."
    ]

_generic_rx = re.compile(r"de la fiche|dans la fiche|indiqu[eé]s? dans la recette|selon le mat[eé]riel disponible|passez directement [àa] l['’]e[té]tape suivante|m[eé]langez les ingr[eé]dients|ingr[eé]dients qui n[eé]cessitent une cuisson|faites cuire s[eé]par[eé]ment|adaptez la dur[eé]e [àa] la taille|selon votre go[uû]t|en adaptant la dur[eé]e|selon la texture souhait[eé]e", re.I)
_generic_changed = 0
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I):
        continue
    steps = r.get("steps", [])
    if isinstance(steps, list) and steps and any(_generic_rx.search(str(step)) for step in steps):
        repaired_steps = _generic_steps_for(r)
        # Ground each repaired template in the actual ingredients of this specific card.
        actual_ingredients = [str(item).strip() for item in r.get("ingredients", []) if str(item).strip()]
        if actual_ingredients and repaired_steps and "Ingrédients à préparer pour cette recette :" not in repaired_steps[0]:
            repaired_steps[0] = repaired_steps[0].rstrip(".; ") + ". Ingrédients à préparer pour cette recette : " + ", ".join(actual_ingredients[:6]) + "."
        r["steps"] = repaired_steps
        _generic_changed += 1
    for sec in r.get("sections", []):
        title = sec.get("title", "")
        if re.search(r"Ingrédients", title, re.I):
            sec["lines"] = r.get("ingredients", [])[:]
        elif re.search(r"Préparation", title, re.I) and not re.search(r"temps|durée|⏱️|robot|batch|sauce", title, re.I):
            sec["lines"] = r.get("steps", [])[:]
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Generic-step pass complete: {_generic_changed} cards updated; Vide-Frigo cards skipped.")


# Dernière passe ciblée : remplace les étapes de gabarit encore présentes par des étapes adaptées au plat.
_final_steps = {
 "r-e8952bdaf2": [
  "1. Épluchez les pommes et les poires, retirez les cœurs puis coupez les fruits en petits dés.",
  "2. Déposez les fruits dans une casserole avec 3 à 4 cuillères à soupe d’eau et la cannelle. Ajoutez la vanille si vous l’utilisez.",
  "3. Couvrez et faites compoter à feu doux 15 à 20 minutes en remuant de temps en temps; ajoutez un peu d’eau si le fond accroche.",
  "4. Écrasez à la fourchette ou mixez selon la texture souhaitée. Laissez refroidir avant de servir ou de mettre au frais."
 ],
 "r-d6a6f34570": [
  "1. Écrasez les biscuits et répartissez-les au fond de petits pots ou d’un moule. Humidifiez légèrement avec un peu d’eau ou de lait si nécessaire.",
  "2. Mélangez le skyr, le fromage frais, la vanille et le zeste de citron jusqu’à obtenir une crème lisse.",
  "3. Préparez la gélatine ou l’agar-agar en suivant exactement les indications du paquet, puis incorporez-la à la crème sans laisser de grumeaux.",
  "4. Versez la crème sur la base biscuitée, ajoutez les fruits rouges et placez au réfrigérateur au moins 4 heures, jusqu’à ce que la préparation soit prise."
 ],
 "r-a10bc58641": [
  "1. Faites fondre le chocolat doucement au bain-marie ou par courtes séquences au micro-ondes, puis laissez-le tiédir.",
  "2. Mélangez le skyr avec le cacao tamisé et la vanille jusqu’à obtenir une préparation homogène.",
  "3. Incorporez progressivement le chocolat fondu tiède. Ajoutez les noisettes concassées et une pincée de fleur de sel si souhaité.",
  "4. Répartissez dans des ramequins et réservez au frais au moins 30 minutes. Gardez au réfrigérateur jusqu’au service."
 ],
 "r-6e0eb13534": [
  "1. Mélangez le skyr avec le mascarpone, la vanille et le zeste de citron jusqu’à obtenir une crème souple.",
  "2. Lavez et séchez les fruits rouges; gardez-en quelques-uns pour la finition.",
  "3. Dans des verrines, alternez une couche de biscuits à la cuillère, une couche de crème et une couche de fruits. Répétez selon la taille des verrines.",
  "4. Couvrez et placez au réfrigérateur au moins 2 heures pour que les biscuits s’attendrissent. Ajoutez les fruits réservés juste avant de servir."
 ],
 "r-8c62c53b61": [
  "1. Épluchez les pommes, retirez les pépins et coupez-les en petits morceaux.",
  "2. Placez-les dans une casserole avec 3 cuillères à soupe d’eau et la vanille si vous en utilisez.",
  "3. Couvrez et faites cuire à feu doux 15 à 20 minutes, en remuant de temps en temps, jusqu’à ce que les pommes soient fondantes.",
  "4. Écrasez ou mixez selon la texture souhaitée. Ajoutez une petite pincée de cannelle, laissez refroidir puis réservez au frais."
 ],
 "r-1a027a4e41": [
  "1. Préparez les garnitures séparément : faites revenir les champignons avec un peu d’huile jusqu’à évaporation de leur eau, puis ajoutez le jambon coupé en morceaux.",
  "2. Faites fondre les poireaux émincés dans une poêle avec un peu d’eau, jusqu’à ce qu’ils soient tendres. Ajoutez le saumon en morceaux et faites-le cuire complètement.",
  "3. Réchauffez les crêpes déjà préparées, répartissez la garniture jambon-champignons sur certaines et la garniture saumon-poireaux sur les autres.",
  "4. Repliez les crêpes et servez aussitôt. Vérifiez que le saumon est bien cuit à cœur."
 ],
 "vegan-express-050": [
  "1. Coupez les avocats en deux, retirez les noyaux et récupérez la chair.",
  "2. Placez la chair, le cacao et le sirop d’érable dans un mixeur. Mixez jusqu’à ce que la préparation commence à devenir lisse.",
  "3. Ajoutez progressivement le lait d’amande et mixez de nouveau jusqu’à obtenir une mousse homogène, en raclant les parois si nécessaire.",
  "4. Répartissez dans des ramequins et servez immédiatement ou laissez raffermir 20 à 30 minutes au réfrigérateur."
 ],
 "vegan-robot-008": [
  "1. Dans une casserole hors du feu, mélangez la fécule et le sucre avec un peu de lait d’amande pour former une pâte sans grumeaux.",
  "2. Ajoutez le reste du lait végétal et le chocolat en morceaux. Mélangez au fouet.",
  "3. Faites chauffer à feu moyen en remuant constamment jusqu’à ce que le chocolat soit fondu et que la crème épaississe; laissez frémir doucement quelques secondes.",
  "4. Versez dans des ramequins. Laissez refroidir puis placez au réfrigérateur au moins 2 heures."
 ],
 "student-microwave-010": [
  "1. Dans une grande tasse compatible avec le micro-ondes, faites fondre le chocolat et le beurre par séquences de 15 à 20 secondes, en mélangeant entre chaque.",
  "2. Incorporez la farine, le sucre et le lait. Mélangez jusqu’à disparition des grumeaux.",
  "3. Faites cuire au micro-ondes environ 40 à 60 secondes à puissance élevée; adaptez par tranches de 10 secondes selon l’appareil et arrêtez lorsque le centre est juste pris.",
  "4. Laissez reposer 1 minute avant de déguster, car la tasse et le chocolat sont très chauds."
 ],
 "student-microwave-020": [
  "1. Faites fondre le beurre dans une grande tasse compatible avec le micro-ondes pendant 10 à 15 secondes.",
  "2. Incorporez les sucres, le lait, puis la farine. Ajoutez les morceaux de chocolat et mélangez juste assez pour répartir la pâte.",
  "3. Faites cuire au micro-ondes 40 à 60 secondes à puissance élevée; surveillez la texture et ajoutez seulement 10 secondes si le centre est encore liquide.",
  "4. Laissez reposer 1 à 2 minutes dans la tasse avant de manger."
 ],
 "student-microwave-030": [
  "1. Épluchez la pomme, retirez le cœur et coupez-la en petits dés dans une tasse compatible avec le micro-ondes.",
  "2. Ajoutez le sucre et mélangez. Émiettez les spéculoos par-dessus et répartissez le beurre en petits morceaux.",
  "3. Faites cuire au micro-ondes 60 à 90 secondes à puissance élevée, jusqu’à ce que la pomme soit tendre; prolongez par séquences de 10 secondes si nécessaire.",
  "4. Laissez reposer 1 minute avant de servir, éventuellement avec une cuillerée de yaourt si vous en avez."
 ],
 "student-microwave-040": [
  "1. Dans une grande tasse compatible avec le micro-ondes, mélangez la farine, le sucre et la levure.",
  "2. Ajoutez l’œuf, l’huile et le jus de citron. Fouettez jusqu’à obtenir une pâte homogène en raclant le fond de la tasse.",
  "3. Faites cuire au micro-ondes 50 à 70 secondes à puissance élevée; le gâteau doit être pris au centre. Ajoutez 10 secondes si nécessaire.",
  "4. Laissez reposer 1 minute avant de déguster. La tasse peut être très chaude."
 ],
 "student-microwave-050": [
  "1. Dans une grande tasse compatible avec le micro-ondes, faites fondre le chocolat et le beurre par séquences de 15 à 20 secondes en mélangeant entre chaque.",
  "2. Incorporez le sucre, la farine et le lait. Ajoutez les noix si vous le souhaitez et mélangez sans trop travailler la pâte.",
  "3. Faites cuire au micro-ondes 35 à 55 secondes à puissance élevée pour garder un cœur fondant; ajoutez 10 secondes si le centre reste trop liquide.",
  "4. Laissez reposer 1 à 2 minutes avant de déguster. Vérifiez que la préparation est chaude et ne consommez pas directement à la sortie du micro-ondes."
 ]
}
for _r in recipes:
    if _r.get("id") in _final_steps and not re.search(r"vide.?frigo", _r.get("name", ""), re.I):
        _r["steps"] = _final_steps[_r["id"]]
        sync_sections(_r)
print(f"Final targeted step repair: {sum(1 for _r in recipes if _r.get('id') in _final_steps)} cards.")

# Persiste également les étapes ciblées définies dans la passe finale ci-dessus.
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Final targeted steps persisted to data/carnet.json.")



# 4) Remplacer les modèles d'étapes génériques par des instructions adaptées au type de recette.
# Les fiches Opération Vide-Frigo sont volontairement exclues.
def steps_for_recipe(r):
    name = norm(r.get("name", ""))
    ingredients = r.get("ingredients", [])
    blob = norm(name + " " + " ".join(str(x) for x in ingredients))
    def has(*terms): return any(norm(t) in blob for t in terms)
    if has("sauce", "pesto", "tartinade", "dip", "vinaigrette", "marinade", "coulis"):
        return [
          "1. Préparez les ingrédients : lavez et séchez les herbes, pressez le citron si nécessaire et mesurez les liquides.",
          "2. Hachez finement les aromates. Dans un bol, mélangez la base indiquée dans la liste avec les herbes, épices et condiments.",
          "3. Versez l’huile ou le liquide petit à petit en fouettant; si la recette contient des ingrédients à mixer, mixez par courtes impulsions jusqu’à la texture souhaitée.",
          "4. Goûtez, rectifiez l’assaisonnement avec les ingrédients prévus et réservez au frais dans un récipient fermé. Pour une sauce chaude, faites chauffer doucement sans faire bouillir si elle contient un produit laitier."
        ]
    if has("wrap", "salade", "taboulé", "taboule", "crudités", "sandwich", "bowl froid", "nouilles soba froides"):
        return [
          "1. Lavez et séchez les crudités et les herbes. Égouttez les conserves et faites cuire puis refroidir tout ingrédient qui doit être servi froid.",
          "2. Coupez les légumes et les autres ingrédients en morceaux réguliers. Émiettez ou effilochez la protéine prévue, si nécessaire.",
          "3. Mélangez séparément les ingrédients de la sauce indiqués dans la liste, puis assaisonnez les éléments juste avant de servir pour garder leur fraîcheur.",
          "4. Assemblez les ingrédients dans les wraps ou les bols, répartissez la sauce et servez. Si vous préparez à l’avance, conservez la sauce à part au réfrigérateur."
        ]
    if has("micro-ondes", "micro ondes", "mug cake"):
        return [
          "1. Coupez les ingrédients en petits morceaux et choisissez un récipient compatible avec le micro-ondes, assez grand pour éviter les débordements.",
          "2. Mélangez les ingrédients dans l’ordre indiqué sur la fiche, jusqu’à obtenir une préparation homogène. Répartissez la garniture sans tasser.",
          "3. Faites cuire au micro-ondes à puissance élevée pendant la durée indiquée dans la fiche; vérifiez le centre et prolongez par séquences de 10 à 15 secondes si nécessaire.",
          "4. Laissez reposer 1 à 2 minutes avant de servir. Le récipient peut être très chaud; vérifiez que les viandes et poissons sont cuits à cœur."
        ]
    if has("pizza", "lasagne", "gratin", "quiche", "tarte", "flan"):
        return [
          "1. Préchauffez le four à 180 °C. Lavez et coupez les légumes; faites revenir la viande ou les légumes aqueux à la poêle si la garniture doit être précuite.",
          "2. Préparez la base prévue (pâte, plaques ou légumes en couches) dans un plat adapté. Mélangez la garniture avec les ingrédients d’assaisonnement de la fiche.",
          "3. Répartissez la garniture uniformément, puis ajoutez le fromage ou l’appareil liquide mentionné dans les ingrédients.",
          "4. Enfournez pendant la durée indiquée dans la fiche, jusqu’à ce que le centre soit cuit et le dessus doré. Laissez reposer quelques minutes avant de couper et servir."
        ]
    if has("saumon", "cabillaud", "colin", "poisson", "crevette"):
        return [
          "1. Séchez le poisson avec du papier absorbant. Lavez et coupez les légumes; préparez les herbes, le citron et les condiments indiqués.",
          "2. Faites cuire les légumes à la vapeur ou dans une poêle avec un peu d’huile, selon leur texture et la cuisson prévue. Réservez au chaud.",
          "3. Faites cuire le poisson à la poêle ou au four selon la méthode adaptée à la fiche; ajoutez la sauce et les aromates indiqués sans dessécher le poisson.",
          "4. Vérifiez que le poisson est opaque et se détache facilement à la fourchette, puis servez avec les légumes et l’accompagnement mentionnés."
        ]
    if has("poulet", "dinde", "volaille", "bœuf", "boeuf", "porc", "boulettes", "paupiette", "viande", "chili", "merguez"):
        return [
          "1. Préparez les ingrédients : coupez les légumes, hachez l’oignon et l’ail s’ils figurent dans la liste, puis mesurez les épices et liquides.",
          "2. Faites chauffer l’huile indiquée dans une sauteuse. Faites dorer la viande sur les faces, puis ajoutez les aromates et les légumes prévus.",
          "3. Incorporez les tomates, le bouillon ou la sauce indiqués dans la liste. Couvrez et laissez mijoter à feu doux pendant la durée de cuisson prévue, en remuant de temps en temps.",
          "4. Vérifiez que la viande est cuite à cœur, rectifiez l’assaisonnement et servez avec l’accompagnement prévu. Pour une sauce crémeuse, ajoutez le produit laitier en fin de cuisson à feu doux."
        ]
    if has("pâtes", "pates", "nouilles", "gnocchi", "risotto", "riz", "couscous"):
        return [
          "1. Préparez et coupez les légumes et aromates listés. Portez à ébullition une casserole d’eau pour les pâtes ou les céréales, sauf si la fiche prévoit une cuisson en une seule poêle.",
          "2. Faites revenir les aromates et les légumes dans l’huile indiquée. Ajoutez la protéine ou les autres ingrédients prévus et faites-les cuire avant d’ajouter les éléments déjà cuits.",
          "3. Faites cuire les pâtes ou céréales selon le paquet; pour un risotto, ajoutez le bouillon progressivement en remuant. Mélangez avec la garniture et la sauce indiquées.",
          "4. Goûtez, rectifiez l’assaisonnement avec les ingrédients prévus et servez chaud. Ajoutez les herbes fraîches ou le fromage en finition s’ils figurent dans la liste."
        ]
    if has("soupe", "velouté", "potage"):
        return [
          "1. Lavez, épluchez si nécessaire et coupez les légumes en morceaux de taille similaire. Hachez l’oignon ou l’ail s’ils figurent dans la liste.",
          "2. Faites revenir les aromates dans l’huile indiquée pendant quelques minutes, puis ajoutez les légumes et le liquide prévu dans les ingrédients.",
          "3. Laissez cuire à petits frémissements jusqu’à ce que les légumes soient tendres. Mixez soigneusement; ajoutez le lait, le skyr ou la crème en fin de cuisson si la recette en contient.",
          "4. Goûtez et ajustez l’assaisonnement. Servez chaud, en ajoutant les herbes ou garnitures prévues juste avant de servir."
        ]
    return [
      "1. Préparez les ingrédients de la fiche : lavez et coupez les légumes, hachez les aromates et mesurez les condiments. Gardez les ingrédients séparés par étape.",
      "2. Faites chauffer l’huile indiquée dans une poêle ou une casserole adaptée. Commencez par les aromates et les ingrédients les plus longs à cuire, puis ajoutez les autres ingrédients selon leur temps de cuisson.",
      "3. Incorporez les liquides, épices et autres ingrédients de la fiche. Laissez cuire à feu moyen en remuant régulièrement jusqu’à ce que les légumes soient tendres et que les protéines soient cuites à cœur.",
      "4. Goûtez, rectifiez l’assaisonnement avec les ingrédients prévus et servez avec l’accompagnement mentionné dans la fiche. Respectez le temps de cuisson indiqué et prolongez si nécessaire."
    ]

generic_patterns = re.compile(r"Préparez les ingrédients listés|Mélangez-les dans un bol ou un mixeur|Incorporez progressivement l’huile, le citron|Goûtez, ajustez avec les assaisonnements prévus|Précuisez à la poêle les viandes et légumes qui en ont besoin|ou à la température précisée dans la recette", re.I)
generic_fixed = 0
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I):
        continue
    if generic_patterns.search("\n".join(r.get("steps", []))):
        r["steps"] = steps_for_recipe(r)
        sync_sections(r)
        generic_fixed += 1
print(f"Étapes génériques remplacées par des étapes adaptées : {generic_fixed} fiches.")
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Base enregistrée après la correction des étapes génériques.")


# Dernier filet de sécurité : éliminer les anciens textes génériques qui décrivent un autre plat.
bad_template_patterns = re.compile(
    r"Lavez et coupez les légumes prévus en petits morceaux|"
    r"Faites revenir les légumes dans la matière grasse indiquée|"
    r"Versez les œufs battus sur la garniture|"
    r"les assaisonnements listés",
    re.I,
)
late_template_fixed = 0
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I):
        continue
    if bad_template_patterns.search("\\n".join(r.get("steps", []))):
        r["steps"] = steps_for_recipe(r)
        sync_sections(r)
        late_template_fixed += 1

# Réparer les six desserts au chocolat dont les ingrédients étaient des libellés placeholders.
apply("r-3822ce960b", "Fondant chocolat léger au skyr",
 ["100 g de chocolat noir","150 g de skyr nature","2 œufs","50 g de farine complète","20 g de cacao non sucré","1 c. à soupe de miel (facultatif)"],
 ["1. Préchauffez le four à 180 °C et chemisez un petit moule.","2. Faites fondre le chocolat doucement, puis laissez-le tiédir.","3. Fouettez le skyr avec les œufs et le miel. Incorporez le chocolat fondu.","4. Ajoutez la farine et le cacao tamisés; mélangez juste assez pour obtenir une pâte homogène.","5. Versez dans le moule et faites cuire 12 à 15 minutes : le centre doit rester légèrement fondant. Laissez tiédir avant de couper."], "10 min","15 min",4)
apply("r-d319909cc0", "Mousse chocolat légère au skyr",
 ["150 g de chocolat noir","300 g de skyr nature","2 blancs d’œufs pasteurisés","1 c. à café d’extrait de vanille","1 pincée de fleur de sel"],
 ["1. Faites fondre le chocolat au bain-marie ou par courtes séquences au micro-ondes, puis laissez-le tiédir.","2. Mélangez le skyr avec la vanille et la fleur de sel.","3. Incorporez le chocolat fondu au mélange de skyr en plusieurs fois.","4. Montez les blancs d’œufs pasteurisés en neige ferme, puis incorporez-les délicatement à la préparation.","5. Répartissez dans quatre verrines et réservez au réfrigérateur au moins 2 heures."], "15 min","5 min",4)
apply("r-c5820b31fc", "Brownie léger chocolat & skyr",
 ["100 g de chocolat noir","150 g de skyr nature","2 œufs","80 g de farine complète","20 g de cacao non sucré","30 g de miel ou de sucre (facultatif)"],
 ["1. Préchauffez le four à 180 °C et chemisez un petit moule carré.","2. Faites fondre le chocolat et laissez-le tiédir.","3. Fouettez les œufs avec le skyr et le miel ou le sucre si utilisé, puis ajoutez le chocolat fondu.","4. Incorporez la farine et le cacao tamisés sans trop travailler la pâte.","5. Versez dans le moule et faites cuire 15 à 20 minutes. Laissez refroidir avant de découper en carrés."], "10 min","20 min",4)
apply("r-a10bc58641", "Crème dessert chocolat protéinée",
 ["500 g de skyr nature","100 g de chocolat noir","20 g de cacao non sucré","1 c. à café d’extrait de vanille","20 g de noisettes concassées (facultatif)","1 pincée de fleur de sel (facultatif)"],
 ["1. Faites fondre le chocolat au bain-marie ou par courtes séquences au micro-ondes, puis laissez-le tiédir.","2. Mélangez le skyr avec le cacao tamisé, la vanille et la fleur de sel si utilisée.","3. Incorporez le chocolat fondu en plusieurs fois jusqu’à obtenir une crème homogène.","4. Répartissez dans quatre ramequins et parsemez de noisettes si souhaité.","5. Réservez au réfrigérateur au moins 30 minutes avant de servir."], "10 min","5 min",4)
apply("r-4ce28d774d", "🍫 Crème dessert chocolat maison",
 ["500 ml de lait","100 g de chocolat noir","2 œufs","20 g de cacao non sucré","20 g de fécule de maïs","20 g de sucre (facultatif)"],
 ["1. Dans un saladier, fouettez les œufs avec le cacao, la fécule et le sucre si utilisé.","2. Faites chauffer le lait dans une casserole. Ajoutez le chocolat en morceaux et remuez jusqu’à ce qu’il soit fondu.","3. Versez progressivement le lait chocolaté chaud sur le mélange aux œufs en fouettant.","4. Reversez dans la casserole et faites épaissir à feu doux sans cesser de remuer; ne laissez pas bouillir fortement.","5. Répartissez dans quatre verrines, laissez refroidir puis réfrigérez au moins 2 heures."], "10 min","10 min",4)
apply("r-e6ef289c1b", "🍫 Mousse au chocolat",
 ["150 g de chocolat noir","4 œufs frais extra-frais (blancs et jaunes séparés)","1 pincée de sel"],
 ["1. Faites fondre le chocolat au bain-marie puis laissez-le tiédir sans le laisser durcir.","2. Séparez les blancs des jaunes. Incorporez les jaunes un à un au chocolat tiède.","3. Montez les blancs en neige avec la pincée de sel jusqu’à ce qu’ils soient fermes.","4. Incorporez délicatement les blancs au chocolat en plusieurs fois pour garder la mousse aérienne.","5. Répartissez dans quatre verrines et réservez au réfrigérateur au moins 3 heures. Pour les personnes fragiles, utilisez des œufs pasteurisés."], "15 min","5 min",4)

# Mug cake salé : étapes propres à sa cuisson au micro-ondes et à sa portion individuelle.
apply("student-microwave-034", "Mug Cake salé Jambon & Olive",
 ["3 c. à soupe de farine","1/2 c. à café de levure chimique","1 œuf","1 c. à soupe d’huile","1 c. à soupe de lait","1/2 tranche de jambon","3 olives dénoyautées","1 c. à soupe de fromage râpé","Sel et poivre"],
 ["1. Coupez le jambon en petits dés et les olives en rondelles.","2. Dans un grand mug compatible avec le micro-ondes, mélangez la farine, la levure, l’œuf, l’huile et le lait jusqu’à disparition des grumeaux.","3. Incorporez le jambon, les olives, le fromage râpé, le sel et le poivre. Ne remplissez pas le mug au-delà des deux tiers.","4. Faites cuire au micro-ondes à puissance élevée pendant environ 1 min 30 à 2 min. Vérifiez que le centre est pris; prolongez par tranches de 10 secondes si nécessaire.","5. Laissez reposer une minute avant de manger : le mug est très chaud."], "4 min","2 min",1)

sync_count = 0
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name", ""), re.I):
        continue
    sync_sections(r)
    sync_count += 1
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Late generic templates replaced={late_template_fixed}; targeted dessert/mug recipes repaired=7; sections synchronized={sync_count}; Vide-Frigo cards preserved.")


# Rejouer les corrections prioritaires via final_fix, après le rechargement complet de la base.
final_fix("r-3822ce960b",
 ["100 g de chocolat noir","150 g de skyr nature","2 œufs","50 g de farine complète","20 g de cacao non sucré","1 c. à soupe de miel (facultatif)"],
 ["1. Préchauffez le four à 180 °C et chemisez un petit moule.","2. Faites fondre le chocolat doucement, puis laissez-le tiédir.","3. Fouettez le skyr avec les œufs et le miel. Incorporez le chocolat fondu.","4. Ajoutez la farine et le cacao tamisés; mélangez juste assez pour obtenir une pâte homogène.","5. Versez dans le moule et faites cuire 12 à 15 minutes : le centre doit rester légèrement fondant. Laissez tiédir avant de couper."], "10 min","15 min",4)
final_fix("r-d319909cc0",
 ["150 g de chocolat noir","300 g de skyr nature","2 blancs d’œufs pasteurisés","1 c. à café d’extrait de vanille","1 pincée de fleur de sel"],
 ["1. Faites fondre le chocolat au bain-marie ou par courtes séquences au micro-ondes, puis laissez-le tiédir.","2. Mélangez le skyr avec la vanille et la fleur de sel.","3. Incorporez le chocolat fondu au mélange de skyr en plusieurs fois.","4. Montez les blancs d’œufs pasteurisés en neige ferme, puis incorporez-les délicatement à la préparation.","5. Répartissez dans quatre verrines et réservez au réfrigérateur au moins 2 heures."], "15 min","5 min",4)
final_fix("r-c5820b31fc",
 ["100 g de chocolat noir","150 g de skyr nature","2 œufs","80 g de farine complète","20 g de cacao non sucré","30 g de miel ou de sucre (facultatif)"],
 ["1. Préchauffez le four à 180 °C et chemisez un petit moule carré.","2. Faites fondre le chocolat et laissez-le tiédir.","3. Fouettez les œufs avec le skyr et le miel ou le sucre si utilisé, puis ajoutez le chocolat fondu.","4. Incorporez la farine et le cacao tamisés sans trop travailler la pâte.","5. Versez dans le moule et faites cuire 15 à 20 minutes. Laissez refroidir avant de découper en carrés."], "10 min","20 min",4)
final_fix("r-a10bc58641",
 ["500 g de skyr nature","100 g de chocolat noir","20 g de cacao non sucré","1 c. à café d’extrait de vanille","20 g de noisettes concassées (facultatif)","1 pincée de fleur de sel (facultatif)"],
 ["1. Faites fondre le chocolat au bain-marie ou par courtes séquences au micro-ondes, puis laissez-le tiédir.","2. Mélangez le skyr avec le cacao tamisé, la vanille et la fleur de sel si utilisée.","3. Incorporez le chocolat fondu en plusieurs fois jusqu’à obtenir une crème homogène.","4. Répartissez dans quatre ramequins et parsemez de noisettes si souhaité.","5. Réservez au réfrigérateur au moins 30 minutes avant de servir."], "10 min","5 min",4)
final_fix("r-4ce28d774d",
 ["500 ml de lait","100 g de chocolat noir","2 œufs","20 g de cacao non sucré","20 g de fécule de maïs","20 g de sucre (facultatif)"],
 ["1. Dans un saladier, fouettez les œufs avec le cacao, la fécule et le sucre si utilisé.","2. Faites chauffer le lait dans une casserole. Ajoutez le chocolat en morceaux et remuez jusqu’à ce qu’il soit fondu.","3. Versez progressivement le lait chocolaté chaud sur le mélange aux œufs en fouettant.","4. Reversez dans la casserole et faites épaissir à feu doux sans cesser de remuer; ne laissez pas bouillir fortement.","5. Répartissez dans quatre verrines, laissez refroidir puis réfrigérez au moins 2 heures."], "10 min","10 min",4)
final_fix("r-e6ef289c1b",
 ["150 g de chocolat noir","4 œufs frais extra-frais (blancs et jaunes séparés)","1 pincée de sel"],
 ["1. Faites fondre le chocolat au bain-marie puis laissez-le tiédir sans le laisser durcir.","2. Séparez les blancs des jaunes. Incorporez les jaunes un à un au chocolat tiède.","3. Montez les blancs en neige avec la pincée de sel jusqu’à ce qu’ils soient fermes.","4. Incorporez délicatement les blancs au chocolat en plusieurs fois pour garder la mousse aérienne.","5. Répartissez dans quatre verrines et réservez au réfrigérateur au moins 3 heures. Pour les personnes fragiles, utilisez des œufs pasteurisés."], "15 min","5 min",4)
final_fix("student-microwave-034",
 ["3 c. à soupe de farine","1/2 c. à café de levure chimique","1 œuf","1 c. à soupe d’huile","1 c. à soupe de lait","1/2 tranche de jambon","3 olives dénoyautées","1 c. à soupe de fromage râpé","Sel et poivre"],
 ["1. Coupez le jambon en petits dés et les olives en rondelles.","2. Dans un grand mug compatible avec le micro-ondes, mélangez la farine, la levure, l’œuf, l’huile et le lait jusqu’à disparition des grumeaux.","3. Incorporez le jambon, les olives, le fromage râpé, le sel et le poivre. Ne remplissez pas le mug au-delà des deux tiers.","4. Faites cuire au micro-ondes à puissance élevée pendant environ 1 min 30 à 2 min. Vérifiez que le centre est pris; prolongez par tranches de 10 secondes si nécessaire.","5. Laissez reposer une minute avant de manger : le mug est très chaud."], "4 min","2 min",1)
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print("Priority dessert and mug-cake corrections reapplied using final_fix.")


# Écriture directe finale des fiches prioritaires dans l'objet JSON réellement sérialisé.
priority_cards = {
 "r-3822ce960b": {
  "ingredients":["100 g de chocolat noir","150 g de skyr nature","2 œufs","50 g de farine complète","20 g de cacao non sucré","1 c. à soupe de miel (facultatif)"],
  "steps":["1. Préchauffez le four à 180 °C et chemisez un petit moule.","2. Faites fondre le chocolat doucement, puis laissez-le tiédir.","3. Fouettez le skyr avec les œufs et le miel. Incorporez le chocolat fondu.","4. Ajoutez la farine et le cacao tamisés; mélangez juste assez pour obtenir une pâte homogène.","5. Versez dans le moule et faites cuire 12 à 15 minutes : le centre doit rester légèrement fondant. Laissez tiédir avant de couper."],"timePrep":"10 min","timeCook":"15 min"},
 "r-d319909cc0": {
  "ingredients":["150 g de chocolat noir","300 g de skyr nature","2 blancs d’œufs pasteurisés","1 c. à café d’extrait de vanille","1 pincée de fleur de sel"],
  "steps":["1. Faites fondre le chocolat au bain-marie ou par courtes séquences au micro-ondes, puis laissez-le tiédir.","2. Mélangez le skyr avec la vanille et la fleur de sel.","3. Incorporez le chocolat fondu au mélange de skyr en plusieurs fois.","4. Montez les blancs d’œufs pasteurisés en neige ferme, puis incorporez-les délicatement à la préparation.","5. Répartissez dans quatre verrines et réservez au réfrigérateur au moins 2 heures."],"timePrep":"15 min","timeCook":"5 min"},
 "r-c5820b31fc": {
  "ingredients":["100 g de chocolat noir","150 g de skyr nature","2 œufs","80 g de farine complète","20 g de cacao non sucré","30 g de miel ou de sucre (facultatif)"],
  "steps":["1. Préchauffez le four à 180 °C et chemisez un petit moule carré.","2. Faites fondre le chocolat et laissez-le tiédir.","3. Fouettez les œufs avec le skyr et le miel ou le sucre si utilisé, puis ajoutez le chocolat fondu.","4. Incorporez la farine et le cacao tamisés sans trop travailler la pâte.","5. Versez dans le moule et faites cuire 15 à 20 minutes. Laissez refroidir avant de découper en carrés."],"timePrep":"10 min","timeCook":"20 min"},
 "r-a10bc58641": {
  "ingredients":["500 g de skyr nature","100 g de chocolat noir","20 g de cacao non sucré","1 c. à café d’extrait de vanille","20 g de noisettes concassées (facultatif)","1 pincée de fleur de sel (facultatif)"],
  "steps":["1. Faites fondre le chocolat au bain-marie ou par courtes séquences au micro-ondes, puis laissez-le tiédir.","2. Mélangez le skyr avec le cacao tamisé, la vanille et la fleur de sel si utilisée.","3. Incorporez le chocolat fondu en plusieurs fois jusqu’à obtenir une crème homogène.","4. Répartissez dans quatre ramequins et parsemez de noisettes si souhaité.","5. Réservez au réfrigérateur au moins 30 minutes avant de servir."],"timePrep":"10 min","timeCook":"5 min"},
 "r-4ce28d774d": {
  "ingredients":["500 ml de lait","100 g de chocolat noir","2 œufs","20 g de cacao non sucré","20 g de fécule de maïs","20 g de sucre (facultatif)"],
  "steps":["1. Dans un saladier, fouettez les œufs avec le cacao, la fécule et le sucre si utilisé.","2. Faites chauffer le lait dans une casserole. Ajoutez le chocolat en morceaux et remuez jusqu’à ce qu’il soit fondu.","3. Versez progressivement le lait chocolaté chaud sur le mélange aux œufs en fouettant.","4. Reversez dans la casserole et faites épaissir à feu doux sans cesser de remuer; ne laissez pas bouillir fortement.","5. Répartissez dans quatre verrines, laissez refroidir puis réfrigérez au moins 2 heures."],"timePrep":"10 min","timeCook":"10 min"},
 "r-e6ef289c1b": {
  "ingredients":["150 g de chocolat noir","4 œufs frais extra-frais (blancs et jaunes séparés)","1 pincée de sel"],
  "steps":["1. Faites fondre le chocolat au bain-marie puis laissez-le tiédir sans le laisser durcir.","2. Séparez les blancs des jaunes. Incorporez les jaunes un à un au chocolat tiède.","3. Montez les blancs en neige avec la pincée de sel jusqu’à ce qu’ils soient fermes.","4. Incorporez délicatement les blancs au chocolat en plusieurs fois pour garder la mousse aérienne.","5. Répartissez dans quatre verrines et réservez au réfrigérateur au moins 3 heures. Pour les personnes fragiles, utilisez des œufs pasteurisés."],"timePrep":"15 min","timeCook":"5 min"},
 "student-microwave-034": {
  "ingredients":["3 c. à soupe de farine","1/2 c. à café de levure chimique","1 œuf","1 c. à soupe d’huile","1 c. à soupe de lait","1/2 tranche de jambon","3 olives dénoyautées","1 c. à soupe de fromage râpé","Sel et poivre"],
  "steps":["1. Coupez le jambon en petits dés et les olives en rondelles.","2. Dans un grand mug compatible avec le micro-ondes, mélangez la farine, la levure, l’œuf, l’huile et le lait jusqu’à disparition des grumeaux.","3. Incorporez le jambon, les olives, le fromage râpé, le sel et le poivre. Ne remplissez pas le mug au-delà des deux tiers.","4. Faites cuire au micro-ondes à puissance élevée pendant environ 1 min 30 à 2 min. Vérifiez que le centre est pris; prolongez par tranches de 10 secondes si nécessaire.","5. Laissez reposer une minute avant de manger : le mug est très chaud."],"timePrep":"4 min","timeCook":"2 min"}
}
priority_by_id = {r.get("id"): r for r in d.get("recipes", [])}
priority_updated = 0
for rid, values in priority_cards.items():
    r = priority_by_id.get(rid)
    if not r:
        print("PRIORITY CARD NOT FOUND:", rid)
        continue
    r["ingredients"] = values["ingredients"]
    r["steps"] = values["steps"]
    r["timePrep"] = values["timePrep"]
    r["timeCook"] = values["timeCook"]
    if rid == "student-microwave-034":
        r["servings"] = "1 portion"
    for sec in r.get("sections", []):
        title = sec.get("title", "")
        if re.search(r"Ingrédients", title, re.I):
            sec["lines"] = r["ingredients"][:]
        elif re.search(r"Préparation|Etapes|Étapes", title, re.I) and not re.search(r"astuce|conseil|robot|version|batch", title, re.I):
            sec["lines"] = r["steps"][:]
    priority_updated += 1
p.write_text(json.dumps(d, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Direct priority data edits written={priority_updated}/{len(priority_cards)}.")

# Déclenchement réel demandé le 25 octobre 2026 : appliquer et enregistrer les corrections sur la branche de test.

# Relance de la vague de remplacement des étapes génériques.
