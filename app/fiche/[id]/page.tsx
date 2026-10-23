import { notFound } from "next/navigation";
import Link from "next/link";
import { CookingWakeLock } from "@/components/cooking-wake-lock";
import { GlutenFreeText, GlutenFreeTimerText } from "@/components/gluten-free-text";
import { GlutenFreeSafetyNotice } from "@/components/gluten-free-safety-notice";
import { LactoseFreeSafetyNotice } from "@/components/lactose-free-safety-notice";
import { NutFreeSafetyNotice } from "@/components/nut-free-safety-notice";
import { RecipeTools } from "@/components/recipe-tools";
import { carnet, getRecipe, isPlaceholderIngredient } from "@/lib/carnet";
import { displayRecipe } from "@/lib/recipe-display";

export function generateStaticParams() {
  return carnet.recipes.map((recipe) => ({ id: recipe.id }));
}

export default async function FichePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const originalRecipe = getRecipe(id);
  if (!originalRecipe) notFound();
  const recipe = displayRecipe(originalRecipe);

  const menuNames = [
    ...new Set(carnet.plan.filter((p) => p.recipeId === recipe.id).map((p) => p.name)),
  ];
  const weeks = [...new Set(carnet.plan.filter((p) => p.recipeId === recipe.id).map((p) => p.week))];
  const sections = (recipe.sections || []).filter((sec) => (sec.title || sec.lines.length) && !/ingr[eé]dients?|préparation|preparation|étapes|etapes|instructions|viande|légumes?|féculents?|fromage|épices?|aromates|pain|composition|dans le saladier|avec\b|accompagnement|selon saison|soupe\s*:|tartine\s*:/i.test(sec.title || ""));
  const ings = recipe.ingredients.filter((line) => line.trim());
  const shopIngs = ings.filter((line) => !isPlaceholderIngredient(line));
  const quickIds = ["r-c1ed1606a4", "r-c27d71faed", "r-50f64b1080"];
  const alternatives = quickIds.map((quickId) => carnet.recipes.find((r) => r.id === quickId)).filter((r): r is NonNullable<typeof r> => !!r).slice(0,3).map((r) => ({ id: r.id, name: r.name }));
  const sauceRecipes = carnet.recipes.filter((candidate) => { const name = cleanMatch(candidate.name); return /(^|\s)(sauce|marinade|vinaigrette|pesto|coulis)\b/.test(name) && !/poulet|cabillaud|saumon|steak|boulettes|colin|merguez|ravioles|paupiettes|wrap/.test(name); });
  function cleanMatch(value: string) { return value.toLocaleLowerCase("fr").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
  function findSauceRecipe(line: string) {
    const cleaned = cleanMatch(line);
    const exact = sauceRecipes.filter((candidate) => cleaned.includes(cleanMatch(candidate.name))).sort((a, b) => b.name.length - a.name.length)[0];
    if (exact) return exact;
    return sauceRecipes.filter((candidate) => {
      const name = cleanMatch(candidate.name);
      return cleaned.length >= 6 && name.includes(cleaned);
    }).sort((a, b) => a.name.length - b.name.length)[0];
  }
  const ingredientTargets = shopIngs.reduce<Record<number, { id: string; name: string }>>((targets, line, index) => { const target = findSauceRecipe(line); if (target) targets[index] = { id: target.id, name: target.name }; return targets; }, {});
  function linkedInstruction(line: string) {
    const target = findSauceRecipe(line);
    if (!target) return line;
    return <Link href={"/fiche/" + target.id} className="font-semibold text-[#668775] underline decoration-[#8FA89B]/50 underline-offset-4">{line}</Link>;
  }
  function ingredientsForStep(step: string) {
    const normalizedStep = cleanMatch(step);
    const ignored = new Set(["avec", "dans", "pour", "deux", "trois", "quatre", "cinq", "puis", "ajouter", "ajoutez", "mettre", "mettez", "verser", "versez", "incorporer", "incorporez", "melanger", "melangez", "couper", "coupez", "faire", "faites", "cuire", "cuisez", "jusque", "jusqu", "minutes", "minute", "gramme", "grammes", "cuillere", "soupe", "cafe", "pincee", "filet", "gousse"]);
    const stepWords = new Set(normalizedStep.split(" "));
    return shopIngs.filter((ingredient) => {
      const name = cleanMatch(ingredient.replace(/^\s*\d+(?:[.,]\d+)?\s*(?:g|kg|mg|ml|cl|l)?\s*/i, "").replace(/\([^)]*\)/g, ""));
      const words = name.split(" ").filter((word) => word.length >= 4 && !ignored.has(word) && !/^\d+$/.test(word));
      return words.some((word) => stepWords.has(word));
    });
  }
  function instructionWithIngredients(step: string, key: string) {
    const matched = ingredientsForStep(step);
    return (
      <div key={key} className="space-y-2">
        {matched.length > 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Ingrédients et quantités de cette étape">
            {matched.map((ingredient, index) => (
              <span key={key + "-ingredient-" + index} className="inline-flex rounded-xl border-2 border-[#8FA89B]/60 bg-[#8FA89B]/15 px-3 py-2 text-base font-extrabold leading-snug text-[#24372C] sm:text-lg">
                <GlutenFreeText text={ingredient.toLocaleUpperCase("fr")} />
              </span>
            ))}
          </div>
        )}
        <div><GlutenFreeTimerText text={step} /></div>
      </div>
    );
  }
  const meta = [recipe.timePrep && `Préparation ${recipe.timePrep}`, recipe.timeCook && `Cuisson ${recipe.timeCook}`, recipe.servings]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className="space-y-6">
      <CookingWakeLock />
      <GlutenFreeSafetyNotice />
      <LactoseFreeSafetyNotice />
      <NutFreeSafetyNotice />
      <header className="space-y-2">
        {recipe.image ? <img src={recipe.image} alt={recipe.imageAlt || recipe.name} className="aspect-[16/9] w-full rounded-2xl object-cover shadow-sm" /> : null}
        <h1 className="font-heading text-3xl leading-tight">{recipe.name}</h1>
        {recipe.blurb ? <p className="text-sm leading-relaxed text-muted-foreground">{recipe.blurb}</p> : null}
        {menuNames.some((n) => n !== recipe.name) && (
          <p className="text-sm text-muted-foreground">Au menu : {menuNames.join(" · ")}</p>
        )}
        {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2" aria-label="Évaluation collective de la recette, bientôt disponible">
            <span className="text-xl tracking-wide text-[#E8AD35]" aria-hidden="true">☆☆☆☆☆</span>
            <span className="text-sm text-muted-foreground">Notes collectives bientôt disponibles</span>
          </div>
          <a
            href="#commentaires"
            className="inline-flex items-center gap-2 rounded-full border border-[#8FA89B]/50 bg-[#8FA89B]/10 px-4 py-2 text-sm font-semibold text-[#2B2B2B] transition hover:bg-[#8FA89B]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#668775]"
            aria-label="Aller directement aux commentaires en bas de la recette"
          >
            💬 Commentaires (0)
            <span aria-hidden="true">↓</span>
          </a>
        </div>
        <aside className="rounded-2xl border border-[#8FA89B]/40 bg-[#8FA89B]/10 p-3 text-sm text-[#2B2B2B]">
          <p className="font-bold">🍽️ À adapter selon votre faim</p>
          <p className="mt-1"><strong>Option ☀️ Midi copieux :</strong> ajoutez un féculent adapté (riz, pommes de terre, pâtes ou pain) si besoin.</p>
          <p className="mt-1"><strong>Option 🌙 Soir copieux :</strong> augmentez la portion du plat et ajoutez des légumes ou un accompagnement adapté à votre profil.</p>
        </aside>
        {weeks.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Semaines {weeks.slice(0, 10).join(", ")}
            {weeks.length > 10 ? "…" : ""}
          </p>
        )}
      </header>

      <RecipeTools recipeId={recipe.id} ingredients={shopIngs} alternatives={alternatives} baseServings={Number.parseInt(recipe.servings || "4", 10) || 4} ingredientTargets={ingredientTargets} />

      {sections.length > 0 ? (
        sections.map((sec, si) => (
          <section key={`${si}-${sec.title}`}>
            <h2 className="font-heading text-xl">{sec.title}</h2>
            {sec.lines.length === 0 ? null : (
              <ul className="mt-2 divide-y">
                {sec.lines.map((line, li) => (
                  <li key={`${si}-${li}`} className="py-2 text-sm leading-relaxed">
                    <GlutenFreeTimerText text={line} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      ) : (
        <>
          <section>
            <h2 className="font-heading text-xl">👩‍🍳 Préparation</h2>
            {recipe.steps.length > 0 ? (
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                {recipe.steps.map((step, i) => (
                  <li key={`step-${i}`}>{instructionWithIngredients(step, `step-${i}`)}</li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Le carnet n’écrit pas les gestes pour ce plat. Rien n’a été inventé.
              </p>
            )}
          </section>
          {recipe.robot.length > 0 && (
            <section>
              <h2 className="font-heading text-xl">🤖 Mr Cuisine</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {recipe.robot.map((line, i) => (
                  <li key={`robot-${i}`}>{instructionWithIngredients(line, `robot-${i}`)}</li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {sections.length > 0 && recipe.steps.length > 0 && !sections.some((sec) => /préparation|preparation|étapes|etapes|instructions/i.test(sec.title)) ? (
        <section>
          <h2 className="font-heading text-xl">👩‍🍳 Préparation</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {recipe.steps.map((step, i) => <li key={`step-extra-${i}`}>{instructionWithIngredients(step, `step-extra-${i}`)}</li>)}
          </ol>
        </section>
      ) : null}
      {sections.length > 0 && recipe.robot.length > 0 && !sections.some((sec) => /mr cuisine|robot/i.test(sec.title)) ? (
        <section>
          <h2 className="font-heading text-xl">🤖 Mr Cuisine</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {recipe.robot.map((line, i) => <li key={`robot-extra-${i}`}>{instructionWithIngredients(line, `robot-extra-${i}`)}</li>)}
          </ol>
        </section>
      ) : null}
      {ings.length > 0 && shopIngs.length === 0 && (
        <p className="text-xs text-muted-foreground">Rien de cette fiche n’est ajouté aux courses.</p>
      )}
      <section id="commentaires" className="scroll-mt-6 space-y-3 border-t border-border pt-6" aria-labelledby="commentaires-title">
        <div className="space-y-1">
          <h2 id="commentaires-title" className="font-heading text-xl">💬 Commentaires de la communauté</h2>
          <p className="text-sm text-muted-foreground">
            Partagez vos adaptations, vos astuces et les photos de votre plat une fois la recette cuisinée.
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-[#8FA89B]/60 bg-[#8FA89B]/5 p-4 text-sm text-muted-foreground">
          Les commentaires, les photos et les notes collectives seront disponibles lorsque leur système de publication partagé sera connecté.
        </div>
      </section>
    </article>
  );
}
