import { clampWeek, shoppingForWeek } from "@/lib/carnet";
import { ShoppingList } from "@/components/shopping-list";
import { WeekPicker } from "@/components/week-picker";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const { w } = await searchParams;
  const week = clampWeek(w);
  const items = shoppingForWeek(week);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl">Courses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Liste recalculée à partir des fiches de la semaine {week}. Rien n’est inventé.
        </p>
      </div>
      <WeekPicker week={week} path="/courses" />
      <ShoppingList week={week} items={items} />
    </div>
  );
}
