"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BASE_PATH } from "@/lib/base-path";
import { InstallApp } from "@/components/install-app";
import {
  BookOpen,
  Boxes,
  ShoppingCart,
  Soup,
  Paintbrush,
  Flame,
  Timer,
  Martini,
  Users,
  BedDouble,
  Flower2,
  Sun,
  Leaf,
  Snowflake,
  Sprout,
  Carrot,
  GraduationCap,
  Gift,
  Bot,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

type HomeCard = {
  label: string;
  href: string;
  color: string;
  iconColor?: string;
  Icon: LucideIcon;
};

const dailyCards: HomeCard[] = [
  { label: "RECETTES", href: "/recettes", color: "#F28C28", Icon: BookOpen },
  { label: "BATCH", href: "/batch", color: "#FFD928", iconColor: "#183B3B", Icon: Boxes },
  { label: "COURSES", href: "/courses", color: "#F5A623", iconColor: "#183B3B", Icon: ShoppingCart },
];

const pepsCards: HomeCard[] = [
  { label: "SAUCES", href: "/recettes?filter=sauces", color: "#63358A", Icon: Soup },
  { label: "MARINADES", href: "/recettes?filter=marinades", color: "#A8CD91", iconColor: "#183B3B", Icon: Paintbrush },
  { label: "ÉPICES", href: "/recettes?filter=epices", color: "#E85D4A", Icon: Flame },
];

const moodCards: HomeCard[] = [
  { label: "EXPRESS", href: "/recettes?filter=express", color: "#F72585", Icon: Timer },
  { label: "APÉRO", href: "/recettes?filter=apero", color: "#F46B25", Icon: Martini },
  { label: "RECEVOIR", href: "/recettes?filter=recevoir", color: "#172554", Icon: Users },
  { label: "JE SUIS FATIGUÉ", href: "/recettes?filter=tired", color: "#C7A6E8", iconColor: "#30213F", Icon: BedDouble },
];

const seasonCards: HomeCard[] = [
  { label: "PRINTEMPS", href: "/recettes?filter=printemps", color: "#91D477", iconColor: "#173E2C", Icon: Flower2 },
  { label: "ÉTÉ", href: "/recettes?filter=ete", color: "#FFD43B", iconColor: "#46390A", Icon: Sun },
  { label: "AUTOMNE", href: "/recettes?filter=automne", color: "#D97732", Icon: Leaf },
  { label: "HIVER", href: "/recettes?filter=hiver", color: "#70D7EC", iconColor: "#103C50", Icon: Snowflake },
];

const preferenceCards: HomeCard[] = [
  { label: "VÉGAN", href: "/vegan", color: "#237A45", Icon: Sprout },
  { label: "VÉGÉTARIEN", href: "/vegetarien", color: "#A8DFA0", iconColor: "#173E2C", Icon: Carrot },
  { label: "ÉTUDIANT", href: "/etudiant-petit-budget", color: "#2563EB", Icon: GraduationCap },
  { label: "FÊTES", href: "/fetes", color: "#7F1D3B", Icon: Gift },
];

// Ces raccourcis déjà présents sur l'accueil sont conservés.
const extraCards: HomeCard[] = [
  { label: "BONUS", href: "/recettes?filter=bonus", color: "#4D7777", Icon: Sparkles },
  { label: "MR CUISINE", href: "/recettes?filter=mr-cuisine", color: "#456B87", Icon: Bot },
];

function getCurrentWeek() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const firstMonday = new Date(now.getFullYear(), 0, 4 - ((jan4.getDay() + 6) % 7));
  const week = Math.floor((monday.getTime() - firstMonday.getTime()) / 604800000) + 1;
  return Math.min(52, Math.max(1, week));
}

function CardRow({
  cards,
  columns = 3,
  currentWeek,
}: {
  cards: HomeCard[];
  columns?: 3 | 4;
  currentWeek: number;
}) {
  const gridColumns = columns === 4
    ? "grid-cols-4"
    : "grid-cols-3";

  return (
    <div className={`grid ${gridColumns} gap-2.5 sm:gap-4`}>
      {cards.map(({ label, href, color, iconColor, Icon }) => {
        const destination = href === "/batch" || href === "/courses"
          ? `${href}?w=${currentWeek}`
          : href;
        return (
          <Link
            key={label}
            href={destination}
            aria-label={label}
            className="group flex aspect-square min-w-0 flex-col items-center justify-center gap-2 rounded-2xl px-1.5 py-2 text-center shadow-[0_5px_14px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-1 hover:brightness-105 active:scale-[0.97] sm:gap-3 sm:rounded-3xl sm:px-3"
            style={{ backgroundColor: color, color: iconColor || "#FFFFFF" }}
          >
            <Icon aria-hidden="true" className="size-6 shrink-0 stroke-[2] sm:size-9" />
            <span className="text-[10px] font-black leading-tight tracking-wide sm:text-xs md:text-sm">
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function HomeSection({
  title,
  cards,
  columns = 3,
  currentWeek,
}: {
  title: string;
  cards: HomeCard[];
  columns?: 3 | 4;
  currentWeek: number;
}) {
  return (
    <section className="w-full">
      <h2 className="mb-3 text-left text-xl font-black tracking-tight text-white sm:mb-4 sm:text-2xl">
        {title}
      </h2>
      <CardRow cards={cards} columns={columns} currentWeek={currentWeek} />
    </section>
  );
}

export default function HomePage() {
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    const refreshCurrentWeek = () => setCurrentWeek(getCurrentWeek());
    refreshCurrentWeek();
    window.addEventListener("focus", refreshCurrentWeek);
    document.addEventListener("visibilitychange", refreshCurrentWeek);
    return () => {
      window.removeEventListener("focus", refreshCurrentWeek);
      document.removeEventListener("visibilitychange", refreshCurrentWeek);
    };
  }, []);

  return (
    <main
      className="min-h-dvh overflow-hidden text-white"
      style={{
        backgroundColor: "#073F43",
        backgroundImage:
          "radial-gradient(ellipse at 12% 8%, rgba(42,133,132,0.48), transparent 38%), radial-gradient(ellipse at 90% 42%, rgba(13,91,94,0.68), transparent 44%), repeating-linear-gradient(135deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 5px)",
      }}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-4 py-6 pb-12 sm:gap-10 sm:px-8 sm:py-9">
        <header className="flex w-full flex-col items-center text-center">
          <img
            src={`${BASE_PATH}/logo-cuisine-chic-ouf-v3.png`}
            alt="CUISINE CHIC OUF !"
            className="block h-auto w-[min(68vw,270px)] max-w-full shrink-0 rounded-[26px] bg-[#F9F6EC] object-contain shadow-[0_8px_24px_rgba(0,0,0,0.24)]"
            loading="eager"
            fetchPriority="high"
          />
          <p className="mt-5 max-w-2xl text-sm font-medium leading-6 text-white/90 sm:text-base sm:leading-7">
            52 semaines de menus, du batchcooking simple et vos listes de courses automatisées. Cuisinez chic, respirez...OUF !
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
            CUISINE CHIC OUF !
          </h1>
          <div className="mt-6 flex w-full max-w-lg flex-col gap-3">
            <Link
              href={`/semaine?w=${currentWeek}`}
              className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#8FAF9B] px-6 py-4 text-lg font-black text-[#103A36] shadow-[0_7px_18px_rgba(0,0,0,0.2)] transition hover:brightness-105 active:scale-[0.99] sm:min-h-16"
            >
              Sauver ma semaine
            </Link>
            <Link
              href="/recettes?filter=tired"
              className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-[#B79AD8] px-6 py-4 text-base font-extrabold text-[#30213F] shadow-[0_7px_18px_rgba(0,0,0,0.18)] transition hover:brightness-105 active:scale-[0.99] sm:min-h-16 sm:text-lg"
            >
              <span aria-hidden="true" className="text-xl">🆘</span>
              SOS j'ai pas le goût
            </Link>
          </div>
        </header>

        <p className="text-center text-base font-bold text-white/90 sm:text-lg">
          Tout est là pour vous simplifier la vie
        </p>

        <div className="flex w-full flex-col gap-8 sm:gap-10">
          <HomeSection title="Mon Quotidien" cards={dailyCards} currentWeek={currentWeek} />
          <HomeSection title="Le Peps en cuisine" cards={pepsCards} currentWeek={currentWeek} />
          <HomeSection title="Selon mon humeur & mon profil" cards={moodCards} columns={4} currentWeek={currentWeek} />
          <HomeSection title="Les Saisons" cards={seasonCards} columns={4} currentWeek={currentWeek} />
          <HomeSection title="Mes Préférences" cards={preferenceCards} columns={4} currentWeek={currentWeek} />
          <HomeSection title="Mes petits plus" cards={extraCards} currentWeek={currentWeek} />
        </div>

        <div className="w-full max-w-md text-left">
          <InstallApp />
        </div>
      </div>
    </main>
  );
}
