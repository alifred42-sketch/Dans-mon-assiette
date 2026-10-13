"use client";

import { displayRecipe } from "@/lib/recipe-display";
import { BATCH_GUIDES } from "@/data/batch-guides";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { batchForWeek, clampWeek, getRecipe, weekPlan } from "@/lib/carnet";
import { CheckList, type CheckItem } from "@/components/check-list";
import { WeekPicker } from "@/components/week-picker";

function matches(item: CheckItem, pattern: RegExp) {
  return pattern.test(`${item.group || ""} ${item.title}`);
}

export default function BatchPage() {
  const search = useSearchParams();
  const week = clampWeek(search.get("w"));
  const [recipeOverrides, setRecipeOverrides] = useState<Record<string, string>>({});
  useEffect(() => {
    const refresh = () => { try { setRecipeOverrides(JSON.parse(localStorage.getItem("cuisine-chic-ouf-recipe-switches") || "{}")); } catch { setRecipeOverrides({}); } };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cuisine-chic-ouf-plan-change", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("cuisine-chic-ouf-plan-change", refresh); };
  }, []);
  const changedPlan = weekPlan(week, recipeOverrides);
  const allItems = batchForWeek(week);
  const assigned = new Set<string>();
  function take(pattern: RegExp) {
    const rows = allItems.filter((item) => !assigned.has(item.id) && matches(item, pattern));
    rows.forEach((item) => assigned.add(item.id));
    return rows;
  }
  const prep = take(/organisation|organisation|préparation|preparation|découpe|decoupe|laver|éplucher|eplucher|planche/i);
  const oven = take(/four|rôtir|rotir|gratin|cuisson au four|légumes rôtis|legumes rotis/i);
  const robot = take(/robot|mr cuisine|monsieur cuisine|vitesse|mixage|cuisson vapeur|cuissons? simultanées?/i);
  const storage = take(/conservation|congél|congel|frigo|réfrigér|refriger/i);
  const assembly = take(/assemblage|jour j|montage|finition|servir/i);
  const general = allItems.filter((item) => !assigned.has(item.id));
  const dayName = (day: string) => day.charAt(0) + day.slice(1).toLowerCase();
  const targetName = (slot: (typeof changedPlan)[number]) => {
    const recipe = getRecipe(slot.recipeId);
    return `${recipe?.name || slot.name} du ${dayName(slot.day)} ${slot.meal.toLowerCase()}`;
  };
  const targetText = (slots: typeof changedPlan) => `(pour ${slots.map(targetName).join("; ")})`;
  const recipeDetails = changedPlan.map((slot) => {
    const source = getRecipe(slot.recipeId);
    return { slot, recipe: source ? displayRecipe(source) : undefined };
  });
  const prepGuides = recipeDetails.map(({ slot, recipe }) => {
    const vegetables = (recipe?.ingredients || []).filter((ingredient) =>
      /courgette|carotte|tomate|poivron|oignon|échalote|echalote|poireau|champignon|brocoli|chou|épinard|epinard|concombre|pomme de terre|patate douce|aubergine|céleri|celeri|radis|navet|asperge|ail|herbes/i.test(ingredient)
    );
    return {
      id: `prep-guide-${slot.day}-${slot.meal}-${slot.recipeId}`,
      title: vegetables.length ? `Laver puis émincer finement : ${vegetables.join(", ")}.` : BATCH_GUIDES.prep.fallback,
      target: targetText([slot]),
      group: "Découpes globales",
    };
  });
  const ovenDetails = recipeDetails.filter(({ recipe }) =>
    recipe && /four|gratin|rôtir|rotir|plaque de cuisson|cuisson au four|180 ?°|200 ?°/i.test([recipe.name, ...recipe.steps].join(" "))
  );
  const ovenGuides = ovenDetails.map(({ slot, recipe }) => ({
    id: `oven-guide-${slot.day}-${slot.meal}-${recipe?.id || slot.recipeId}`,
    title: BATCH_GUIDES.oven.action,
    detail: recipe?.steps.find((step) => /four|gratin|rôtir|rotir|plaque|°/i.test(step)) || undefined,
    target: targetText([slot]),
    group: "Optimisation du four",
  }));
  const robotGuides = recipeDetails.map(({ slot, recipe }) => ({
    id: `robot-guide-${slot.day}-${slot.meal}-${recipe?.id || slot.recipeId}`,
    title: recipe?.robot?.length ? "Peser les ingrédients, installer l’accessoire indiqué et suivre les réglages ci-dessous." : BATCH_GUIDES.robot.fallback,
    detail: recipe?.robot?.length ? recipe.robot.join(" → ") : undefined,
    target: targetText([slot]),
    group: "Cuissons simultanées",
  }));
  const storageGuides = recipeDetails.map(({ slot, recipe }) => ({
    id: `storage-guide-${slot.day}-${slot.meal}-${recipe?.id || slot.recipeId}`,
    title: /lundi|mardi|mercredi/i.test(slot.day) ? BATCH_GUIDES.storage.fridge : BATCH_GUIDES.storage.freezer,
    target: targetText([slot]),
    group: "Conservation",
  }));
  const assemblyGuides = recipeDetails.map(({ slot }) => ({
    id: `assembly-guide-${slot.day}-${slot.meal}-${slot.recipeId}`,
    title: BATCH_GUIDES.assembly.action,
    target: targetText([slot]),
    group: "Assemblage Jour J",
  }));
  const withTargets = (items: CheckItem[], slots: typeof changedPlan): CheckItem[] =>
    items.map((item) => ({ ...item, target: targetText(slots) }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl">Batchcooking</h1>
        <p className="mt-1 text-sm font-normal leading-relaxed text-[#2B2B2B]">Enfilez votre tablier, allumez les feux (ou votre robot). 2 heures de cuisine le dimanche pour 7 jours de liberté.</p>
      </div>
      <WeekPicker week={week} path="/batch" />
      <section className="space-y-2 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-lg font-extrabold text-[#2B2B2B]">🍽️ Recettes prévues pour cette semaine</h2>
        <p className="text-sm text-muted-foreground">Cette liste suit les recettes que vous avez choisies dans le menu.</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">{changedPlan.map((slot, i) => <li key={`${slot.day}-${slot.meal}-${i}`}><strong>{slot.day.charAt(0) + slot.day.slice(1).toLowerCase()} · {slot.meal} :</strong> {getRecipe(slot.recipeId)?.name || slot.name}</li>)}</ul>
      </section>
      <section className="space-y-4 rounded-2xl border border-[#8FA89B]/40 bg-[#8FA89B]/10 p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#1A1A1A]">📖 Les recettes, étape par étape</h2>
        <p className="text-sm leading-relaxed text-[#2B2B2B]">Retrouvez ici les ingrédients et les étapes de chaque repas prévu. Cette liste suit automatiquement les recettes sélectionnées dans votre menu, y compris après un remplacement.</p>
        {changedPlan.map((slot, i) => {
          const sourceRecipe = getRecipe(slot.recipeId);
          const recipe = sourceRecipe ? displayRecipe(sourceRecipe) : undefined;
          if (!recipe) return (
            <div key={`batch-recipe-missing-${slot.day}-${slot.meal}-${i}`} className="rounded-xl bg-white p-3">
              <h3 className="font-bold text-[#1A1A1A]">{slot.day.charAt(0) + slot.day.slice(1).toLowerCase()} · {slot.meal} — {slot.name}</h3>
              <p className="mt-1 text-sm text-[#555551]">La fiche complète de cette recette n’est pas disponible.</p>
            </div>
          );
          return (
            <article key={`batch-recipe-${slot.day}-${slot.meal}-${recipe.id}-${i}`} className="rounded-xl border border-[#E9E9E4] bg-white p-4">
              <h3 className="font-bold text-[#1A1A1A]">{slot.day.charAt(0) + slot.day.slice(1).toLowerCase()} · {slot.meal} — {recipe.name}</h3>
              {recipe.timePrep || recipe.timeCook || recipe.servings ? (
                <p className="mt-1 text-xs text-[#555551]">{[recipe.timePrep ? `Préparation : ${recipe.timePrep}` : "", recipe.timeCook ? `Cuisson : ${recipe.timeCook}` : "", recipe.servings ? `Portions : ${recipe.servings}` : ""].filter(Boolean).join(" · ")}</p>
              ) : null}
              <div className="mt-3">
                <h4 className="text-sm font-bold text-[#1A1A1A]">Ingrédients</h4>
                {recipe.ingredients.length ? (
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[#2B2B2B]">
                    {recipe.ingredients.map((ingredient, j) => <li key={`ingredient-${recipe.id}-${j}`}>{ingredient}</li>)}
                  </ul>
                ) : <p className="mt-1 text-sm text-[#555551]">Ingrédients non renseignés dans la fiche.</p>}
              </div>
              <div className="mt-3">
                <h4 className="text-sm font-bold text-[#1A1A1A]">Préparation</h4>
                {recipe.steps.length ? (
                  <ol className="mt-1 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#2B2B2B]">
                    {recipe.steps.map((step, j) => <li key={`step-${recipe.id}-${j}`}>{step} <em>(pour {recipe.name} du {dayName(slot.day)} {slot.meal.toLowerCase()})</em></li>)}
                  </ol>
                ) : <p className="mt-1 text-sm text-[#555551]">Étapes de préparation non renseignées dans la fiche.</p>}
              </div>
              {recipe.robot?.length ? (
                <div className="mt-3 rounded-lg bg-[#E5E7EB]/70 p-3">
                  <h4 className="text-sm font-bold text-[#1A1A1A]">🤖 Monsieur Cuisine</h4>
                  <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-[#2B2B2B]">
                    {recipe.robot.map((step, j) => <li key={`robot-${recipe.id}-${j}`}>{step} <em>(pour {recipe.name} du {dayName(slot.day)} {slot.meal.toLowerCase()})</em></li>)}
                  </ol>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">{BATCH_GUIDES.prep.title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{BATCH_GUIDES.prep.intro}</p>
        <CheckList storageKey={`assiette-batch-prep-guides-${week}`} items={prepGuides} />
        {prep.length ? <CheckList storageKey={`assiette-batch-prep-${week}`} items={withTargets(prep, changedPlan)} /> : null}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">🔥 {BATCH_GUIDES.oven.title}</h2>
        <p className="text-sm text-muted-foreground">{BATCH_GUIDES.oven.intro}</p>
        {ovenGuides.length ? <CheckList storageKey={`assiette-batch-oven-guides-${week}`} items={ovenGuides} /> : <p className="text-sm">Aucune recette sélectionnée ne mentionne de cuisson au four dans sa fiche. Ne lancez pas de cuisson au four sans consigne adaptée.</p>}
        {oven.length ? <CheckList storageKey={`assiette-batch-oven-${week}`} items={withTargets(oven, ovenDetails.length ? ovenDetails.map(({ slot }) => slot) : changedPlan)} /> : null}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">🤖 {BATCH_GUIDES.robot.title}</h2>
        <p className="text-sm text-muted-foreground">{BATCH_GUIDES.robot.intro}</p>
        <CheckList storageKey={`assiette-batch-robot-guides-${week}`} items={robotGuides} />
        {robot.length ? <CheckList storageKey={`assiette-batch-robot-${week}`} items={withTargets(robot, changedPlan)} /> : null}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">{BATCH_GUIDES.storage.title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{BATCH_GUIDES.storage.intro}</p>
        <CheckList storageKey={`assiette-batch-storage-guides-${week}`} items={storageGuides} />
        {storage.length ? <CheckList storageKey={`assiette-batch-storage-${week}`} items={withTargets(storage, changedPlan)} /> : null}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">{BATCH_GUIDES.assembly.title}</h2>
        {changedPlan.some((slot) => { const item = getRecipe(slot.recipeId); return item ? displayRecipe(item).name !== item.name : false; }) ? <p className="rounded-xl bg-[#F4EAD4] p-3 text-sm text-[#2B2B2B]"><strong>Assemblage Jour J :</strong> cuire les pâtes fraîches dans une grande casserole d’eau bouillante salée selon le temps indiqué sur le paquet, puis les mélanger à la sauce chaude juste avant de servir.</p> : null}
        <p className="text-sm leading-relaxed text-muted-foreground">{BATCH_GUIDES.assembly.intro}</p>
        <CheckList storageKey={`assiette-batch-assembly-guides-${week}`} items={assemblyGuides} />
        {assembly.length ? <CheckList storageKey={`assiette-batch-assembly-${week}`} items={withTargets(assembly, changedPlan)} /> : null}
      </section>
      {general.length ? <section className="space-y-2"><h2 className="font-heading text-lg font-bold">Autres tâches notées dans le carnet</h2><CheckList storageKey={`assiette-batch-general-${week}`} items={general} /></section> : null}
      {allItems.length === 0 ? <p className="rounded-2xl bg-[#8FA89B]/10 p-4 text-sm text-[#466653]">Le carnet ne contient pas encore de tâches détaillées pour cette semaine. Utilisez le plan ci-dessus comme trame, et reportez les réglages précis depuis les fiches recettes.</p> : null}
    </div>
  );
}
