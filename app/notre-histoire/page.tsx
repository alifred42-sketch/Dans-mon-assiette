import Link from "next/link";

const paragraphs = [
  "Tout a commencé un mardi soir à 18h42, devant un frigo désespérément vide et une question qui résonnait comme une alerte générale : \"Qu’est-ce qu’on mange ce soir ?\". Entre la panne d'idées, la course au supermarché et la charge mentale de la semaine, nous avons dit STOP. Il était temps de cuisiner de bons petits plats variés, parfois avec l'aide magique de notre robot préféré, mais surtout... sans y laisser notre santé mentale !",
  "Cuisine Chic Ouf, c’est l’application pensée pour les vrais rythmes de vie. Nous avons planifié pour vous 52 semaines de menus ultra-variés, des sessions de batchcooking optimisées à la minute près (à la main ou au robot Monsieur Cuisine), et des listes de courses intelligentes qui se trient toutes seules.",
  "Notre promesse ? Du lundi au jeudi, on mange sain, frais et varié (Cuisine Chic). Le week-end, place aux burgers et aux pizzas maison sans prise de tête. Et le dimanche soir, une fois le batchcooking terminé, on s'assoit sur le canapé et on souffle enfin... (OUF !). Bienvenue dans l'aventure zéro charge mentale et 100 % gourmande !",
];

export default function NotreHistoirePage() {
  return (
    <article className="mx-auto max-w-2xl space-y-8 rounded-[28px] bg-[#F9F9F7] px-1 py-2 text-[#1A1A1A]">
      <header className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#668775]">Cuisine Chic Ouf !</p>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">Notre Histoire</h1>
        <p className="text-lg leading-8 text-[#555551]">Moins de charge mentale. Plus de bons petits plats. Et un grand OUF !</p>
      </header>
      <div className="space-y-6 text-base leading-8 sm:text-lg">
        {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <div className="rounded-3xl bg-[#8FA89B]/15 p-6">
        <p className="font-heading text-2xl font-bold">Alors, on mange quoi ce soir ?</p>
        <p className="mt-2 text-[#555551]">Votre semaine est déjà organisée. À vous les bons moments !</p>
        <Link href="/semaine?w=1" className="mt-5 inline-flex rounded-2xl bg-[#8FA89B] px-5 py-3 font-bold text-white">Découvrir mes menus</Link>
      </div>
    </article>
  );
}
