#!/usr/bin/env python3
"""Correct known corruptions in carnet.json on the test branch."""
import json, re
from pathlib import Path
p=Path("data/carnet.json")
d=json.loads(p.read_text(encoding="utf-8"))
recipes=d["recipes"]
by={r["id"]:r for r in recipes}
def apply(rid, ingredients, steps, prep, cook):
    r=by[rid]
    r["ingredients"]=ingredients; r["steps"]=steps
    r["timePrep"]=prep; r["timeCook"]=cook
    for s in r.get("sections",[]):
        title=s.get("title","")
        if re.search(r"🛒\\s*Ingrédients", title, re.I): s["lines"]=ingredients[:]
        elif re.search(r"Préparation classique|^👩‍🍳\\s*Préparation", title, re.I): s["lines"]=steps[:]
        elif re.search(r"⏱️\\s*Préparation", title, re.I): s["title"]="⏱️ Préparation : "+prep
# Remove only exact repeated ingredient lines; retain intentionally generic fridge-clearout cards.
def norm(s):
    import unicodedata
    return re.sub(r"\\s+"," ", "".join(c for c in unicodedata.normalize("NFD",s.lower()) if not unicodedata.combining(c))).strip()
removed=0
for r in recipes:
    if re.search(r"vide.?frigo", r.get("name",""), re.I): continue
    seen=set(); out=[]
    for x in r.get("ingredients",[]):
        k=norm(x)
        if k in seen: removed+=1; continue
        seen.add(k); out.append(x)
    if len(out)!=len(r.get("ingredients",[])):
        r["ingredients"]=out
        for s in r.get("sections",[]):
            if re.search(r"🛒\\s*Ingrédients",s.get("title",""),re.I): s["lines"]=out[:]
fixes = {
  "r-50e9f84517": {
    "i": [
      "500 g de bœuf haché",
      "200 g de haricots rouges égouttés",
      "300 g de tomates concassées",
      "2 carottes",
      "2 poivrons",
      "1 oignon",
      "1 gousse d’ail",
      "1 c. à café de paprika fumé",
      "1 c. à café de cumin",
      "1 c. à café de piment doux (facultatif)",
      "1 c. à soupe de coriandre fraîche ciselée",
      "250 g de riz cru",
      "200 g de salade verte",
      "30 g de cheddar râpé ou 100 g de feta émiettée"
    ],
    "p": [
      "1. Émincez l’oignon et l’ail; coupez les carottes et les poivrons en dés.",
      "2. Faites revenir les légumes dans un filet d’huile pendant 5 à 7 minutes.",
      "3. Ajoutez le bœuf haché et faites-le cuire en l’émiettant jusqu’à ce qu’il ne soit plus rosé. Incorporez les tomates, les haricots rouges et les épices.",
      "4. Laissez mijoter 25 à 30 minutes à feu doux. Faites cuire le riz selon les indications du paquet.",
      "5. Servez avec le riz et la salade; ajoutez le cheddar ou la feta au moment de servir."
    ],
    "a": "20 min",
    "b": "35 min"
  },
  "r-c8c2401e21": {
    "i": [
      "600 g de poulet haché",
      "1 oignon",
      "1 gousse d’ail",
      "1 œuf",
      "5 g de persil frais ciselé",
      "400 g de sauce tomate",
      "300 g de pâtes complètes",
      "1 courgette",
      "1 c. à café d’herbes de Provence",
      "Sel et poivre"
    ],
    "p": [
      "1. Mélangez le poulet haché avec l’œuf, la moitié de l’oignon haché, le persil, les herbes, le sel et le poivre.",
      "2. Formez des boulettes de taille régulière.",
      "3. Faites revenir le reste de l’oignon et l’ail hachés dans un filet d’huile. Ajoutez la sauce tomate et les boulettes.",
      "4. Couvrez et laissez mijoter 20 à 25 minutes; vérifiez que le poulet est bien cuit à cœur.",
      "5. Faites cuire les pâtes selon le paquet et servez avec les boulettes et la courgette rôtie ou poêlée."
    ],
    "a": "20 min",
    "b": "30 min"
  },
  "r-0e0f234326": {
    "i": [
      "400 g de tomates concassées",
      "1 courgette",
      "1 oignon",
      "8 œufs",
      "1 c. à café de paprika doux",
      "1 c. à café de cumin",
      "1 gousse d’ail",
      "1 c. à soupe d’huile d’olive",
      "Sel et poivre"
    ],
    "p": [
      "1. Émincez l’oignon et l’ail; coupez la courgette en petits dés.",
      "2. Faites revenir l’oignon et la courgette dans l’huile pendant 5 à 7 minutes.",
      "3. Ajoutez l’ail, les tomates, le paprika, le cumin, le sel et le poivre. Laissez mijoter 8 à 10 minutes.",
      "4. Faites quatre creux dans la sauce, cassez deux œufs dans chacun, couvrez et laissez cuire 6 à 8 minutes, jusqu’à ce que les blancs soient pris.",
      "5. Servez bien chaud."
    ],
    "a": "15 min",
    "b": "20 min"
  },
  "r-db349daa26": {
    "i": [
      "1 pâte à pizza fine",
      "200 g de sauce tomate",
      "400 g de blanc de poulet",
      "200 g de champignons émincés",
      "2 tomates",
      "100 g de mozzarella",
      "1 c. à soupe de basilic frais ciselé",
      "1 c. à café d’origan",
      "1 c. à café de paprika doux",
      "1 c. à soupe d’huile d’olive",
      "Sel et poivre"
    ],
    "p": [
      "1. Préchauffez le four à 220 °C. Coupez le poulet en petits morceaux et émincez les champignons; coupez les tomates en rondelles.",
      "2. Faites dorer le poulet dans l’huile pendant 6 à 8 minutes; assaisonnez.",
      "3. Étalez la sauce tomate sur la pâte. Répartissez les champignons, le poulet, les tomates et la mozzarella; ajoutez l’origan.",
      "4. Enfournez 12 à 15 minutes, jusqu’à ce que la pâte soit cuite et le fromage fondu. Parsemez de basilic."
    ],
    "a": "20 min",
    "b": "25 min"
  },
  "r-b249d80354": {
    "i": [
      "400 g de bœuf émincé",
      "300 g de nouilles chinoises",
      "2 carottes",
      "200 g de chou émincé",
      "1 courgette",
      "2 c. à soupe de sauce soja légère",
      "1 gousse d’ail",
      "1 c. à café de gingembre frais râpé",
      "1 c. à café de paprika doux (facultatif)",
      "5 g de ciboulette",
      "1 c. à soupe d’huile neutre",
      "Poivre"
    ],
    "p": [
      "1. Faites cuire les nouilles selon le paquet, égouttez-les et réservez.",
      "2. Coupez les carottes et la courgette en bâtonnets; émincez le chou et l’ail, râpez le gingembre.",
      "3. Faites chauffer l’huile dans un wok. Saisissez le bœuf à feu vif 2 à 3 minutes, puis réservez.",
      "4. Faites sauter les légumes 5 à 7 minutes. Remettez le bœuf, ajoutez la sauce soja, le gingembre et le paprika; poursuivez jusqu’à cuisson complète.",
      "5. Ajoutez les nouilles, mélangez 1 à 2 minutes et parsemez de ciboulette."
    ],
    "a": "15 min",
    "b": "15 min"
  },
  "r-816115df0d": {
    "i": [
      "2 merguez",
      "2 courgettes",
      "2 poivrons",
      "3 tomates",
      "1 oignon",
      "1 c. à soupe d’huile d’olive",
      "1 c. à café de cumin",
      "1 c. à café de paprika",
      "1 c. à soupe d’herbes aromatiques",
      "300 g de semoule crue",
      "Sel et poivre"
    ],
    "p": [
      "1. Coupez les courgettes, les poivrons, les tomates et l’oignon en morceaux.",
      "2. Faites dorer les merguez dans une poêle; réservez et retirez l’excédent de graisse si nécessaire.",
      "3. Faites revenir l’oignon et les légumes dans l’huile 8 à 10 minutes. Ajoutez les épices, les herbes, le sel et le poivre.",
      "4. Remettez les merguez, couvrez et laissez mijoter 10 à 15 minutes, jusqu’à cuisson complète.",
      "5. Préparez la semoule selon le paquet et servez avec la poêlée."
    ],
    "a": "15 min",
    "b": "25 min"
  },
  "r-ec4ba6bb28": {
    "i": [
      "8 œufs",
      "2 courgettes",
      "300 g de tomates",
      "1 poivron",
      "1 oignon",
      "1 c. à café de paprika",
      "1 c. à café d’herbes de Provence",
      "1 c. à soupe d’huile d’olive",
      "Sel et poivre"
    ],
    "p": [
      "1. Coupez les courgettes, les tomates, le poivron et l’oignon en petits morceaux.",
      "2. Faites revenir l’oignon, les courgettes et le poivron dans l’huile 7 à 8 minutes; ajoutez les tomates et poursuivez 3 minutes.",
      "3. Battez les œufs avec le paprika, les herbes, le sel et le poivre.",
      "4. Versez les œufs sur les légumes et faites cuire à feu doux, en couvrant, jusqu’à ce que l’omelette soit prise."
    ],
    "a": "15 min",
    "b": "15 min"
  },
  "r-806ae50db7": {
    "i": [
      "400 g de poulet en morceaux",
      "4 merguez",
      "3 carottes",
      "2 courgettes",
      "2 navets",
      "1 oignon",
      "400 g de pois chiches égouttés",
      "300 g de semoule crue",
      "2 c. à soupe de concentré de tomate",
      "2 c. à café de ras el hanout",
      "1 c. à soupe d’huile d’olive",
      "Sel et poivre"
    ],
    "p": [
      "1. Émincez l’oignon et coupez les légumes en morceaux réguliers.",
      "2. Faites revenir l’oignon et le poulet dans l’huile pendant 5 minutes.",
      "3. Ajoutez les carottes, les navets, le concentré de tomate, le ras el hanout et de l’eau à hauteur. Laissez mijoter 20 minutes.",
      "4. Ajoutez les courgettes et les pois chiches; poursuivez 15 à 20 minutes, jusqu’à cuisson complète.",
      "5. Faites griller les merguez à part jusqu’à cuisson complète. Préparez la semoule selon le paquet et servez avec le bouillon et les légumes."
    ],
    "a": "20 min",
    "b": "40 min"
  }
};
for (const [id,x] of Object.entries(fixes)) apply(id,x.i,x.p,x.a,x.b);
p.write_text(json.dumps(d,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
print("Patched duplicate lines:",removed,"; explicit recipe fixes:",len(fixes))
