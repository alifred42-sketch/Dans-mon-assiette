import { displayRecipe } from "@/lib/recipe-display";
"use client";

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl">Batchcooking</h1>
        <p className="mt-1 text-sm text-muted-foreground">Organisation du dimanche pour alléger les repas de la semaine {week}.</p>
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
                    {recipe.steps.map((step, j) => <li key={`step-${recipe.id}-${j}`}>{step}</li>)}
                  </ol>
                ) : <p className="mt-1 text-sm text-[#555551]">Étapes de préparation non renseignées dans la fiche.</p>}
              </div>
              {recipe.robot?.length ? (
                <div className="mt-3 rounded-lg bg-[#E5E7EB]/70 p-3">
                  <h4 className="text-sm font-bold text-[#1A1A1A]">🤖 Monsieur Cuisine</h4>
                  <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-[#2B2B2B]">
                    {recipe.robot.map((step, j) => <li key={`robot-${recipe.id}-${j}`}>{step}</li>)}
                  </ol>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">Étape 1 — Préparer le poste et les ingrédients</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">Lisez les fiches, sortez les ingrédients et les contenants, lavez les légumes puis regroupez les découpes. Préparez les plaques et préchauffez le four seulement quand vous connaissez les températures requises. Gardez séparés le cru et le cuit.</p>
        {prep.length ? <CheckList storageKey={`assiette-batch-prep-${week}`} items={prep} /> : <ol className="list-decimal space-y-2 pl-5 text-sm"><li>Lire les recettes prévues et regrouper les ingrédients par préparation.</li><li>Laver, éplucher et découper les légumes; séparer les ingrédients crus des aliments cuits.</li><li>Étiqueter les boîtes avec le nom du plat et le jour prévu.</li></ol>}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">🔥 Étape 2 — Lancer les cuissons longues au four</h2>
        <p className="text-sm text-muted-foreground">Commencez par les légumes rôtis, gratins et autres cuissons longues. Regroupez sur une même fournée uniquement les plats compatibles en température et en durée; gardez un minuteur par préparation.</p>
        {oven.length ? <CheckList storageKey={`assiette-batch-oven-${week}`} items={oven} /> : <p className="text-sm">Aucune consigne de four détaillée n’est enregistrée pour cette semaine.</p>}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">🤖 Étape 3 — Utiliser le Monsieur Cuisine pendant le four</h2>
        <p className="text-sm text-muted-foreground">Pendant que le four tourne, préparez au Monsieur Cuisine les sauces, soupes, céréales ou autres préparations compatibles. Enchaînez les recettes du plus propre au plus salissant si cela convient, et suivez exactement les quantités, durées, températures, vitesses et accessoires de chaque fiche. Ne lancez pas deux cuissons simultanées qui exigent votre surveillance au même moment.</p>
        {robot.length ? <CheckList storageKey={`assiette-batch-robot-${week}`} items={robot} /> : <p className="text-sm">Aucun réglage Monsieur Cuisine dédié n’est enregistré dans le batch de cette semaine.</p>}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">Étape 4 — Refroidir, portionner et conserver</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li><strong>Au réfrigérateur :</strong> laissez refroidir rapidement, rangez dans des boîtes propres et fermées, puis placez au frais sans laisser longtemps à température ambiante.</li>
          <li><strong>Au congélateur ❄️ :</strong> congelez en portions adaptées, étiquetez avec le nom et la date, et décongelez au réfrigérateur.</li>
          <li>Gardez séparés les aliments crus et les préparations prêtes à consommer; réchauffez soigneusement les plats avant de servir.</li>
        </ul>
        {storage.length ? <CheckList storageKey={`assiette-batch-storage-${week}`} items={storage} /> : null}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">Étape 5 — Assemblage au moment du repas</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">Étape 5 — Finir et assembler au moment du repas. Gardez les herbes, salades, garnitures fragiles et sauces à ajouter séparément. Réchauffez uniquement la portion nécessaire et vérifiez la fiche pour les finitions.</p>
        {assembly.length ? <CheckList storageKey={`assiette-batch-assembly-${week}`} items={assembly} /> : <ol className="list-decimal space-y-2 pl-5 text-sm"><li><strong>En début de semaine :</strong> utiliser les préparations réfrigérées prévues pour les premiers jours.</li><li><strong>Pour la suite :</strong> congeler rapidement les portions qui ne seront pas consommées dans les délais adaptés, puis les décongeler au réfrigérateur.<li>Ajouter herbes, sauces et garnitures fraîches au moment de servir.</li></ol>}
      </section>
      {general.length ? <section className="space-y-2"><h2 className="font-heading text-lg font-bold">Autres tâches notées dans le carnet</h2><CheckList storageKey={`assiette-batch-general-${week}`} items={general} /></section> : null}
      {allItems.length === 0 ? <p className="rounded-2xl bg-[#8FA89B]/10 p-4 text-sm text-[#466653]">Le carnet ne contient pas encore de tâches détaillées pour cette semaine. Utilisez le plan ci-dessus comme trame, et reportez les réglages précis depuis les fiches recettes.</p> : null}
    </div>
  );
}
