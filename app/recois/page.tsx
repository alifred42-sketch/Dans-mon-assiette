"use client";

import { useMemo, useState } from "react";
import { receiveMenu } from "@/lib/carnet";
import { RecipeCard } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function RecoisPage() {
  const [guests, setGuests] = useState(6);
  const [apero, setApero] = useState(true);
  const [seed, setSeed] = useState(0);
  const menu = useMemo(() => receiveMenu(guests, apero), [guests, apero, seed]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Je reçois</h1>
        <p className="text-sm text-muted-foreground">
          Un menu tiré du carnet, pas d’un générateur fantôme. Les quantités suivent le nombre d’invités.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="guests">Invités</Label>
          <input
            id="guests"
            type="number"
            min={2}
            max={12}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value) || 2)}
            className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2"
          />
        </div>
        <label className="flex items-end gap-2 pb-1 text-sm">
          <input type="checkbox" checked={apero} onChange={(e) => setApero(e.target.checked)} />
          Apéritif dînatoire
        </label>
      </div>
      <Button onClick={() => setSeed((s) => s + 1)}>Composer un autre menu</Button>
      <div className="grid gap-3 sm:grid-cols-2">
        {menu.map((r) => (
          <RecipeCard key={r.id + seed} recipe={r} />
        ))}
      </div>
      {menu.length === 0 && (
        <p className="text-sm text-muted-foreground">Pas assez de fiches « invités » pour composer.</p>
      )}
      <p className="text-sm text-muted-foreground">
        Compte environ {Math.round(guests * 12)} à {Math.round(guests * 18)} € de courses selon les saisons
        (repère, pas un tarif figé).
      </p>
    </div>
  );
}
