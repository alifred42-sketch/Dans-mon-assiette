import { carnet, getRecipe, isPlaceholderIngredient, weekPlan } from "./carnet";
import type { ShoppingItem } from "./carnet";

function fold(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stripDecor(raw: string): string {
  return raw.replace(/🔗/g, "").replace(/[☐✅❌⚪✔]/g, "").replace(/\s+/g, " ").trim();
}

function isJunk(line: string): boolean {
  const t = stripDecor(line);
  if (!t || isPlaceholderIngredient(t)) return true;
  if (/^["«].*["»]$/.test(t)) return true;
  if (/parfaite pour/i.test(t)) return true;
  if (/aucun fromage|le repas contient|après repas possible|par personne\)/i.test(t)) return true;
  if (/^(➡️|💡|🤖|📅|🔍)/.test(t)) return true;
  if (/^recherch/i.test(t)) return true;
  if (/^épices\s*(&|et)?\s*aromates$/i.test(t)) return true;
  if (t.startsWith("(") && t.endsWith(")")) return true;
  return false;
}

function canonicalIngredient(raw: string): string {
  return fold(raw)
    .replace(/\\b(patates?|pdt|pommes de terres?|pommes terres?)\\b/g, "pomme de terre")
    .replace(/\\btomates? cerises?\\b/g, "tomate cerise")
    .replace(/\\boignons? (jaunes?|blancs?|rouges?)\\b/g, "oignon")
    .replace(/\\bcreme (liquide|legere|epaisse|entiere|fraiche)\\b/g, "creme")
    .replace(/\\bhuile (d )?olive\\b/g, "huile olive")
    .replace(/\\bail (frais|en poudre)\\b/g, "ail")
    .replace(/\\bescalopes? de poulet\\b/g, "poulet")
    .replace(/\\bpoulets?\\b/g, "poulet")
    .replace(/\\bboeuf hache\\b/g, "boeuf")
    .replace(/\\bpoivrons? (rouges?|verts?|jaunes?)\\b/g, "poivron")
    .replace(/\\bcarottes? nouvelles?\\b/g, "carotte")
    .replace(/\\bcourgettes\\b/g, "courgette")
    .replace(/\\btomates\\b/g, "tomate")
    .replace(/\\s+/g, " ")
    .trim();
}

function cleanName(raw: string): string {
  return stripDecor(raw)
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/[.,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function scaleIngredientLine(line: string, factor: number): string {
  if (!Number.isFinite(factor) || factor <= 0 || factor === 1) return line;
  return line.replace(/^(\s*(?:[^:]{1,40}:\s*)?)(\d+(?:[.,]\d+)?)(?=\s|$)/, (whole, prefix: string, raw: string) => {
    const value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0 || value > 1000) return whole;
    const scaled = Math.round(value * factor * 100) / 100;
    return prefix + String(scaled).replace(".", ",");
  });
}

function num(raw: string): number {
  return Number(raw.replace(",", "."));
}

function normUnit(raw: string): string {
  const u = fold(raw).replace(/\s+/g, " ");
  if (u === "g" || u === "gr" || u === "grammes") return "g";
  if (u === "kg") return "kg";
  if (u === "ml") return "ml";
  if (u === "cl") return "cl";
  if (u === "l" || u === "litro" || u === "litre" || u === "litres") return "l";
  if (/c a (s|soupe)|cas|cs/.test(u)) return "c. à s.";
  if (/c a (c|cafe)|cac|cc/.test(u)) return "c. à c.";
  if (/gousse/.test(u)) return "gousse";
  if (/tranche/.test(u)) return "tranche";
  return raw.trim();
}

type Parsed = {
  name: string;
  qtyText?: string;
  amount?: number;
  unit?: string;
};

function parseLine(raw: string): Parsed | null {
  const t = stripDecor(raw);
  if (!t || isJunk(t)) return null;

  const colon = t.match(/^([^:]{2,40})\s*:\s+(.+)$/);
  if (colon && !/https?:/i.test(colon[2])) {
    const qtyPart = colon[2].trim();
    const qty = parseQtyHead(qtyPart);
    return { name: cleanName(colon[1]), qtyText: qtyPart, ...qty };
  }

  const de = t.match(
    /^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|cl|l|c\.\s*à\s*(?:s\.|c\.|soupe|café)|càs|cac|cs|cc|tranche[s]?|gousse[s]?)\s+(?:de\s+|d['’])?(.+)$/i,
  );
  if (de) {
    return {
      name: cleanName(de[3]),
      qtyText: `${de[1]} ${de[2]}`,
      amount: num(de[1]),
      unit: normUnit(de[2]),
    };
  }

  const lead = t.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
  if (lead) {
    const rest = lead[2];
    const paren = rest.match(/^(.+?)\s*\((.+)\)$/);
    const name = cleanName(paren ? paren[1] : rest);
    const extra = paren ? ` (${paren[2]})` : "";
    return {
      name,
      qtyText: `${lead[1]}${extra}`,
      amount: num(lead[1]),
    };
  }

  const name = cleanName(t);
  if (!name) return null;
  return { name };
}

function parseQtyHead(qtyPart: string): { amount?: number; unit?: string } {
  const m = qtyPart.match(/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|cl|l|c\.\s*à\s*(?:s\.|c\.|soupe|café)|càs|cac|cs|cc|tranche[s]?|gousse[s]?)?\b/i);
  if (!m) return {};
  return { amount: num(m[1]), unit: m[2] ? normUnit(m[2]) : undefined };
}

function guessAisle(name: string): string {
  const f = fold(name);
  if (/poulet|boeuf|steak|jambon|lardon|saucisse|dinde|porc|agneau|viande|hache/.test(f)) return "🥩 Viandes";
  if (/saumon|cabillaud|thon|poisson|crevette|lieu|colin|sardine|maquereau/.test(f)) return "🐟 Poisson";
  if (/oeuf/.test(f)) return "🥚 Œufs";
  if (
    /yaourt|skyr|fromage|chevre|mozzarella|parmesan|st moret|lait|creme|beurre|ricotta|feta/.test(f)
  ) {
    return "🥛 Frais";
  }
  if (
    /courgette|tomate|carotte|oignon|poireau|salade|citron|poivron|concombre|champignon|pomme de terre|patate|\bpdt\b|ail|basilic|persil|melon|avocat|radis|haricot vert/.test(
      f,
    )
  ) {
    return "🥕 Légumes & fruits";
  }
  return "🥫 Épicerie";
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10).replace(".", ",");
}

function formatQty(
  parts: { amount?: number; unit?: string; qtyText?: string }[],
): string | undefined {
  const measured = parts.filter((part) => part.amount != null);
  if (measured.length > 0) {
    const normalized = measured.map((part) => {
      const unit = part.unit || "";
      if (unit === "kg") return { amount: (part.amount || 0) * 1000, unit: "g" };
      if (unit === "cl") return { amount: (part.amount || 0) * 10, unit: "ml" };
      if (unit === "l") return { amount: (part.amount || 0) * 1000, unit: "ml" };
      return { amount: part.amount || 0, unit };
    });
    const units = new Set(normalized.map((part) => part.unit));
    if (units.size === 1) {
      let unit = [...units][0];
      let sum = normalized.reduce((acc, part) => acc + part.amount, 0);
      if (unit === "g" && sum >= 1000) { sum /= 1000; unit = "kg"; }
      if (unit === "ml" && sum >= 1000) { sum /= 1000; unit = "l"; }
      const core = `${formatNumber(sum)}${unit ? ` ${unit}` : ""}`;
      if (measured.length === parts.length) return core;
      return `${core} + autres plats`;
    }
  }
  const texts = parts.map((part) => part.qtyText).filter((text): text is string => Boolean(text));
  if (texts.length === 0) return undefined;
  return [...new Set(texts)].join(" + ");
}

function prettyName(names: string[]): string {
  const name = [...names].sort((a, b) => b.length - a.length)[0] || names[0];
  if (!name) return name;
  return name.charAt(0).toLocaleUpperCase("fr") + name.slice(1);
}

function findLinkedSauce(line: string) {
  const cleaned = fold(line);
  const sauces = carnet.recipes.filter((candidate) => /sauce|marinade|vinaigrette|pesto|coulis/i.test(candidate.name));
  const exact = sauces.filter((candidate) => cleaned.includes(fold(candidate.name))).sort((a, b) => b.name.length - a.name.length)[0];
  if (exact) return exact;
  return sauces.filter((candidate) => {
    const name = fold(candidate.name);
    return cleaned.length >= 6 && name.includes(cleaned);
  }).sort((a, b) => a.name.length - b.name.length)[0];
}

export function shoppingForWeek(week: number, servingsByRecipe: Record<string, number> = {}): ShoppingItem[] {
  const official = (carnet.courses || []).filter((row) => row.week === week);
  const aisleByName = new Map<string, string>();
  for (const row of official) {
    const key = canonicalIngredient(row.ingredient);
    if (key && !aisleByName.has(key)) aisleByName.set(key, row.aisle);
  }

  type Acc = {
    names: string[];
    recipes: string[];
    parts: { amount?: number; unit?: string; qtyText?: string }[];
  };
  const bag = new Map<string, Acc>();

  function aisleFor(name: string): string {
    const key = canonicalIngredient(name);
    if (aisleByName.has(key)) return aisleByName.get(key) || guessAisle(name);
    for (const [known, aisle] of aisleByName) {
      if (known.includes(key) || key.includes(known)) return aisle;
    }
    return guessAisle(name);
  }

  function add(parsed: Parsed, recipeName: string) {
    const key = canonicalIngredient(parsed.name);
    if (!key) return;
    const cur = bag.get(key) || { names: [], recipes: [], parts: [] };
    if (!cur.names.includes(parsed.name)) cur.names.push(parsed.name);
    if (recipeName && !cur.recipes.includes(recipeName)) cur.recipes.push(recipeName);
    cur.parts.push({ amount: parsed.amount, unit: parsed.unit, qtyText: parsed.qtyText });
    bag.set(key, cur);
  }

  for (const slot of weekPlan(week)) {
    const recipe = getRecipe(slot.recipeId);
    if (!recipe) continue;
    const foodSection = /ingr|épice|epice|légume|viande|fromage|sauce|appareil|pain|féculent|feculent|dessus|assais/i;
    const baseServings = Number.parseInt(recipe.servings || "4", 10) || 4;
    const selectedServings = servingsByRecipe[recipe.id] || baseServings;
    const factor = selectedServings / baseServings;
    const relatedSauces = new Map<string, typeof carnet.recipes[number]>();
    const sectionLines = (recipe.sections || [])
      .filter((section) => foodSection.test(section.title || ""))
      .flatMap((section) => section.lines)
      .filter((line) => {
        const related = findLinkedSauce(line);
        if (!related || related.id === recipe.id) return true;
        relatedSauces.set(related.id, related);
        return false;
      });
    const lines = [
      ...(recipe.ingredients || []).map((line) => scaleIngredientLine(line, factor)),
      ...sectionLines.map((line) => scaleIngredientLine(line, factor)),
    ];
    const seen = new Set<string>();
    for (const line of lines) {
      const parsed = parseLine(line);
      if (!parsed) continue;
      const dedupe = `${canonicalIngredient(parsed.name)}|${parsed.qtyText || ""}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      add(parsed, slot.name || recipe.name);
    }
    for (const related of relatedSauces.values()) {
      const sauceBase = Number.parseInt(related.servings || String(baseServings), 10) || baseServings;
      const sauceFactor = selectedServings / sauceBase;
      for (const line of related.ingredients || []) {
        const parsed = parseLine(scaleIngredientLine(line, sauceFactor));
        if (!parsed) continue;
        const dedupe = `${canonicalIngredient(parsed.name)}|${parsed.qtyText || ""}`;
        if (seen.has(dedupe)) continue;
        seen.add(dedupe);
        add(parsed, `${slot.name || recipe.name} — ${related.name}`);
      }
    }
  }
  if (bag.size === 0) {
    for (const row of official) {
      const parsed = parseLine(row.ingredient);
      if (!parsed) continue;
      add(parsed, row.dish);
    }
  }

  return [...bag.entries()]
    .map(([, item]) => {
      const name = prettyName(item.names);
      const qty = formatQty(item.parts);
      return {
        label: qty ? `${name} : ${qty}` : name,
        recipes: item.recipes,
        aisle: aisleFor(name),
      };
    })
    .sort((a, b) => {
      const order = [
        "🥩 Viandes",
        "🐟 Poisson",
        "🥛 Frais",
        "🥚 Œufs",
        "🥕 Légumes & fruits",
        "🥫 Épicerie",
        "🛒 À vérifier",
      ];
      const aisle = (order.indexOf(a.aisle) === -1 ? 99 : order.indexOf(a.aisle)) - (order.indexOf(b.aisle) === -1 ? 99 : order.indexOf(b.aisle));
      if (aisle !== 0) return aisle;
      return a.label.localeCompare(b.label, "fr");
    });
}
