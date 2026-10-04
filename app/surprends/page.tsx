"use client";

import { useState } from "react";
import { TAGS, surprise } from "@/lib/carnet";
import type { Recipe } from "@/lib/types";
import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";

export default function SurprendsPage() {
  const [tag, setTag] = useState("");
  const [recipe, setRecipe] = useState<Recipe | undefined>();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Surprends-moi</h1>
        <p className="text-sm text-muted-foreground">
          Une recette du carnet, pas une invention. Tu peux limiter au express, au poisson, au robot…
        </p>
      </div>
      <label className="block text-sm">
        Envie
        <select
          className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        >
          <option value="">Peu importe</option>
          {TAGS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <Button
        className="w-full"
        onClick={() => setRecipe(surprise({ tag }) || undefined)}
      >
        Tirer une recette
      </Button>
      {recipe ? (
        <RecipeCard recipe={recipe} />
      ) : (
        <p className="text-center text-sm text-muted-foreground">Clique pour piocher dans le carnet.</p>
      )}
    </div>
  );
}
