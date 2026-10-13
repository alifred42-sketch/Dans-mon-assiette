import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollection, getCollections, recipesForCollection } from "@/lib/carnet";
import { recipeLines } from "@/lib/search";
import { RecipeList } from "@/components/recipe-list";

const COLLECTION_COPY: Record<string, string> = {
  sauces: "Le secret des grands chefs est dans la sauce. Des textures onctueuses et des saveurs intenses pour sublimer vos assiettes.",
  marinades: "Donnez du relief à vos viandes, poissons et légumes. Du temps pour infuser les saveurs, du peps à la dégustation !",
  epices: "Voyagez depuis votre cuisine. Le dosage parfait pour réveiller vos plats sans jamais vous brûler le palais.",
  express: "Moins de 15 minutes entre le placard et l'assiette. Rapide, efficace et terriblement gourmand.",
  apero: "Planches chics, tartinades express et gressins maison. Le rendez-vous convivial qui ouvre l'appétit sans prise de tête.",
  invites: "Mettez les petits plats dans les grands sans y laisser votre calme. Vos invités vont être bluffés, et vous aussi !",
  fatiguee: "Alerte rouge à la flemme !🚨 Zéro courage ? Voici nos jokers du placard ultra-réconfortants prêts avec 3 ingrédients.",
  mrcuisine: "Votre robot s'occupe de tout. Lisez la consigne universelle, lancez les paramètres, et allez vous reposer.",
  bonus: "Le petit plus Cuisine Chic Ouf. Granola maison, astuces de conservation et petits secrets de chefs pour vous faciliter la vie.",
  printemps: "Le retour des légumes croquants, des herbes fraîches et de la légèreté. La cuisine se réveille avec le soleil !",
  ete: "Gaspachos glacés, salades colorées et grillades parfumées. Une cuisine fraîche et ensoleillée à savourer à l'ombre.",
  automne: "Les premiers champignons, les courges dorées et les douces odeurs de mijotés. Une cuisine cocooning et réconfortante.",
  hiver: "Veloutés brûlants, gratins dorés et plats conviviaux au coin du feu. Le réconfort absolu au cœur de la saison froide.",
};

export function generateStaticParams() {
  return getCollections().map((col) => ({ slug: col.slug }));
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const col = getCollection(slug);
  if (!col) notFound();
  const recipes = recipesForCollection(slug);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-heading text-3xl">{col.name}</h1>
        <p className="mt-1 text-sm font-normal leading-relaxed text-[#2B2B2B]">{COLLECTION_COPY[slug] || col.blurb}</p>
      </div>
      {recipes.length === 0 ? (
        <p className="rounded-2xl bg-muted/70 p-6 text-center text-sm text-muted-foreground">
          Rien dans cet onglet.
        </p>
      ) : (
        <RecipeList
          items={recipes.map((r) => ({ id: r.id, name: r.name, lines: recipeLines(r) }))}
        />
      )}
    </div>
  );
}
