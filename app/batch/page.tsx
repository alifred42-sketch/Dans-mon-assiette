"use client";

import { useSearchParams } from "next/navigation";
import { batchForWeek, clampWeek } from "@/lib/carnet";
import { CheckList, type CheckItem } from "@/components/check-list";
import { WeekPicker } from "@/components/week-picker";

function matches(item: CheckItem, pattern: RegExp) {
  return pattern.test(`${item.group || ""} ${item.title}`);
}

export default function BatchPage() {
  const search = useSearchParams();
  const week = clampWeek(search.get("w"));
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
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">🗓️ ORGANISATION : DIMANCHE BATCH</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">Préparez les contenants, sortez les ingrédients de la semaine et lisez les fiches avant de démarrer. Les quantités et réglages du robot doivent suivre les fiches de chaque recette.</p>
        {prep.length ? <CheckList storageKey={`assiette-batch-prep-${week}`} items={prep} /> : <ol className="list-decimal space-y-2 pl-5 text-sm"><li>Lire les recettes prévues et regrouper les ingrédients par préparation.</li><li>Laver, éplucher et découper les légumes; séparer les ingrédients crus des aliments cuits.</li><li>Étiqueter les boîtes avec le nom du plat et le jour prévu.</li></ol>}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">🔥 Étape 2 — Optimiser le four</h2>
        <p className="text-sm text-muted-foreground">Regroupez les préparations compatibles sur une même fournée; respectez la température et le temps propres à chaque recette.</p>
        {oven.length ? <CheckList storageKey={`assiette-batch-oven-${week}`} items={oven} /> : <p className="text-sm">Aucune consigne de four détaillée n’est enregistrée pour cette semaine.</p>}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">🤖 Étape 3 — Cuissons simultanées au Monsieur Cuisine</h2>
        <p className="text-sm text-muted-foreground">Suivez les durées, températures, vitesses et accessoires indiqués sur la fiche de chaque recette; ne transposez pas un réglage d’un plat à un autre.</p>
        {robot.length ? <CheckList storageKey={`assiette-batch-robot-${week}`} items={robot} /> : <p className="text-sm">Aucun réglage Monsieur Cuisine dédié n’est enregistré dans le batch de cette semaine.</p>}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">🧺 Conservation au frais & au congélateur ❄️</h2>
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li><strong>Au réfrigérateur :</strong> laissez refroidir rapidement, rangez dans des boîtes propres et fermées, puis placez au frais sans laisser longtemps à température ambiante.</li>
          <li><strong>Au congélateur ❄️ :</strong> congelez en portions adaptées, étiquetez avec le nom et la date, et décongelez au réfrigérateur.</li>
          <li>Gardez séparés les aliments crus et les préparations prêtes à consommer; réchauffez soigneusement les plats avant de servir.</li>
        </ul>
        {storage.length ? <CheckList storageKey={`assiette-batch-storage-${week}`} items={storage} /> : null}
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <h2 className="font-heading text-xl font-extrabold text-[#2B2B2B]">🍽️ Assemblage de la semaine — Jour J</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">Le jour du repas, assemblez les bases préparées, ajoutez les éléments frais au dernier moment et réchauffez seulement la portion nécessaire. Vérifiez la fiche du plat pour les finitions.</p>
        {assembly.length ? <CheckList storageKey={`assiette-batch-assembly-${week}`} items={assembly} /> : <ol className="list-decimal space-y-2 pl-5 text-sm"><li><strong>Lundi à mardi :</strong> utiliser en priorité les préparations réfrigérées prévues pour ces jours.</li><li><strong>Mercredi à vendredi :</strong> compléter avec les portions congelées si la recette s’y prête, puis décongeler au réfrigérateur.</li><li>Ajouter herbes, sauces et garnitures fraîches au moment de servir.</li></ol>}
      </section>
      {general.length ? <section className="space-y-2"><h2 className="font-heading text-lg font-bold">Autres tâches notées dans le carnet</h2><CheckList storageKey={`assiette-batch-general-${week}`} items={general} /></section> : null}
      {allItems.length === 0 ? <p className="rounded-2xl bg-[#8FA89B]/10 p-4 text-sm text-[#466653]">Le carnet ne contient pas encore de tâches détaillées pour cette semaine. Utilisez le plan ci-dessus comme trame, et reportez les réglages précis depuis les fiches recettes.</p> : null}
    </div>
  );
}
