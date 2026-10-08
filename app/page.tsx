"use client";

import Link from "next/link";

const categories = [
  ["Recettes", "#8FA89B", "/recettes"],
  ["Batchcooking", "#D98A6C", "/batch?w=1"],
  ["Courses", "#E6DFD3", "/courses?w=1"],
  ["Sauces", "#F4EAD4", "/recettes"],
  ["Marinades", "#EAD5C3", "/recettes"],
  ["Épices", "#F2D4C9", "/recettes"],
  ["Express", "#FAD2CB", "/recettes"],
  ["Apéro", "#FCD5CE", "/recettes"],
  ["Recevoir", "#D0DBCE", "/recettes"],
  ["Je suis fatigué", "#EADAEC", "/"],
  ["Bonus", "#E8ECEF", "/"],
  ["Mr Cuisine", "#E5E7EB", "/"],
  ["Printemps", "#E2F0D9", "/"],
  ["Été", "#FCE4B5", "/"],
  ["Automne", "#F3C6B1", "/"],
  ["Hiver", "#E1EDF2", "/"],
];

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-[#F9F9F7]">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-8 pb-14 text-center sm:px-8">
        <img src="/logo-cuisine-chic-ouf.svg" alt="CUISINE CHIC OUF !" className="h-auto w-full max-w-[260px] sm:max-w-[310px]" />
        <section className="mt-7 max-w-2xl">
          <h1 className="text-4xl font-black tracking-tight text-[#2B2B2B] sm:text-6xl">CUISINE CHIC OUF !</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#555551] sm:text-lg sm:leading-8">
            Pas de panique, on mange quoi ce soir ?<br />
            52 semaines de menus, du batchcooking simple et vos listes de courses automatisées.<br />
            <span className="font-semibold text-[#2B2B2B]">Cuisinez chic, respirez... OUF !</span>
          </p>
        </section>

        <Link
          href="/?w=1"
          className="mt-8 inline-flex min-h-16 w-full max-w-md items-center justify-center rounded-[22px] bg-[#8FA89B] px-7 text-lg font-extrabold text-white shadow-sm transition hover:brightness-95 active:scale-[0.99]"
        >
          Sauver ma semaine !
        </Link>

        <section className="mt-12 w-full">
          <div className="mb-5 text-left">
            <h2 className="text-2xl font-extrabold text-[#2B2B2B]">Tout est là pour vous simplifier la vie</h2>
            <p className="mt-1 text-sm text-[#6B6B67]">Choisissez votre envie du moment.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.map(([label, color, href]) => (
              <Link
                key={label}
                href={href}
                style={{ backgroundColor: color }}
                className="flex min-h-24 items-center justify-center rounded-2xl px-3 py-4 text-center text-sm font-bold text-[#2B2B2B] shadow-[0_1px_2px_rgba(43,43,43,0.05)] transition hover:-translate-y-0.5"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
