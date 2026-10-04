import { batchForWeek, clampWeek } from "@/lib/carnet";
import { CheckList } from "@/components/check-list";
import { WeekPicker } from "@/components/week-picker";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BatchPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const { w } = await searchParams;
  const week = clampWeek(w);
  const items = batchForWeek(week);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl">Batch</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ce que le carnet prévoit de préparer en avance pour la semaine {week}.
        </p>
      </div>
      <WeekPicker week={week} path="/batch" />
      {items.length === 0 ? (
        <p className="rounded-2xl bg-muted/70 p-6 text-center text-sm text-muted-foreground">
          Pas de batch noté pour cette semaine dans le tableur.
        </p>
      ) : (
        <CheckList storageKey={`assiette-batch-${week}`} items={items} />
      )}
    </div>
  );
}
