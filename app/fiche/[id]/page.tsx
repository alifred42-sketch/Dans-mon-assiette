import { notFound } from "next/navigation";
import Link from "next/link";
import { CookingWakeLock } from "@/components/cooking-wake-lock";
import { RecipeTools } from "@/components/recipe-tools";
import { carnet, getRecipe, isPlaceholderIngredient } from "@/lib/carnet";

export function generateStaticParams() {
  return carnet.recipes.map((recipe) => ({ id: recipe.id }));
}

export default async function FichePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = getRecipe(id);
  if (!recipe) notFound();

  const menuNames = [
    ...new Set(carnet.plan.filter((p) => p.recipeId === recipe.id).map((p) => p.name)),
  ];
  const weeks = [...new Set(carnet.plan.filter((p) => p.recipeId === recipe.id).map((p) => p.week))];
  const sections = (recipe.sections || []).filter((sec) => (sec.title || sec.lines.length) && !/ingr[eé]dients?/i.test(sec.title || ""));
  const ings = recipe.ingredients.filter((line) => line.trim());
  const shopIngs = ings.filter((line) => !isPlaceholderIngredient(line));
  const quickIds = ["r-c1ed1606a4", "r-c27d71faed", "r-50f64b1080"];
  const alternatives = quickIds.map((quickId) => carnet.recipes.find((r) => r.id === quickId)).filter((r): r is NonNullable<typeof r> => !!r).slice(0,3).map((r) => ({ id: r.id, name: r.name }));
  const sauceRecipes = carnet.recipes.filter((candidate) => /sauce|marinade|vinaigrette|pesto|coulis/i.test(candidate.name));
  function cleanMatch(value: string) { return value.toLocaleLowerCase("fr").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").replace(/[^a-z0-9\\s]/g, " ").replace(/\\s+/g, " ").trim(); }
  function findSauceRecipe(line: string) {
    const cleaned = cleanMatch(line);
    return sauceRecipes.filter((candidate) => { const name = cleanMatch(candidate.name); return cleaned.includes(name) || (cleaned.length >= 6 && name.includes(cleaned)); }).sort((a, b) => b.name.length - a.name.length)[0];
  }
  const ingredientTargets = Object.fromEntries(shopIngs.map((line, index) => { const target = findSauceRecipe(line); return target ? [index, { id: target.id, name: target.name }] : null; }).filter((value): value is [number, { id: string; name: string }] => value !== null));
  function linkedInstruction(line: string) {
    const target = findSauceRecipe(line);
    if (!target) return line;
    return <Link href={"/fiche/" + target.id} className="font-semibold text-[#668775] underline decoration-[#8FA89B]/50 underline-offset-4">{line}</Link>;
  }
  const meta = [recipe.timePrep && `Préparation ${recipe.timePrep}`, recipe.timeCook && `Cuisson ${recipe.timeCook}`, recipe.servings]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className="space-y-6">
      <CookingWakeLock />
      <header className="space-y-2">
        <h1 className="font-heading text-3xl leading-tight">{recipe.name}</h1>
        {recipe.blurb ? <p className="text-sm leading-relaxed text-muted-foreground">{recipe.blurb}</p> : null}
        {menuNames.some((n) => n !== recipe.name) && (
          <p className="text-sm text-muted-foreground">Au menu : {menuNames.join(" · ")}</p>
        )}
        {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
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
                    {linkedInstruction(line)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))
      ) : (
        <>
          <section>
            <h2 className="font-heading text-xl">🛒 Ingrédients</h2>
            {ings.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Pas de liste dans cette fiche.</p>
            ) : (
              <ul className="mt-2 divide-y">
                {ings.map((line, i) => (
                  <li key={`ing-${i}`} className="py-2 text-sm leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="font-heading text-xl">👩‍🍳 Préparation</h2>
            {recipe.steps.length > 0 ? (
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
                {recipe.steps.map((step, i) => (
                  <li key={`step-${i}`}>{step}</li>
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
                  <li key={`robot-${i}`}>{line}</li>
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
            {recipe.steps.map((step, i) => <li key={`step-extra-${i}`}>{linkedInstruction(step)}</li>)}
          </ol>
        </section>
      ) : null}
      {sections.length > 0 && recipe.robot.length > 0 && !sections.some((sec) => /mr cuisine|robot/i.test(sec.title)) ? (
        <section>
          <h2 className="font-heading text-xl">🤖 Mr Cuisine</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            {recipe.robot.map((line, i) => <li key={`robot-extra-${i}`}>{linkedInstruction(line)}</li>)}
          </ol>
        </section>
      ) : null}
      {ings.length > 0 && shopIngs.length === 0 && (
        <p className="text-xs text-muted-foreground">Rien de cette fiche n’est ajouté aux courses.</p>
      )}
    </article>
  );
}
