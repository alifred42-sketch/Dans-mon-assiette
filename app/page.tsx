"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { currentIsoWeek } from "@/lib/week-utils";
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
  Refrigerator,
  UserRound,
  Heart,
  Settings,
  Check,
  EyeOff,
  type LucideIcon,
} from "lucide-react";

const HOME_LAYOUT_KEY = "cuisine-chic-ouf-home-categories-v1";

type HomeCard = {
  label: string;
  href: string;
  color: string;
  iconColor?: string;
  Icon: LucideIcon;
  image: string;
};

const dailyCards: HomeCard[] = [
  { label: "RECETTES", href: "/recettes", color: "#F28C28", Icon: BookOpen, image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "BATCH", href: "/batch", color: "#FFD928", iconColor: "#183B3B", Icon: Boxes, image: "https://images.unsplash.com/photo-1606859191214-25806e8e2423?auto=format&fit=crop&w=900&q=85&v=8" },
  { label: "COURSES", href: "/courses", color: "#F5A623", iconColor: "#183B3B", Icon: ShoppingCart, image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85&v=4" },
];

const pepsCards: HomeCard[] = [
  { label: "SAUCES", href: "/recettes?filter=sauces", color: "#63358A", Icon: Soup, image: "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "MARINADES", href: "/recettes?filter=marinades", color: "#A8CD91", iconColor: "#183B3B", Icon: Paintbrush, image: "https://images.unsplash.com/photo-1765118527220-da9c7a560b13?auto=format&fit=crop&w=900&q=85&v=5" },
  { label: "ÉPICES", href: "/recettes?filter=epices", color: "#E85D4A", Icon: Flame, image: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=900&q=85&v=4" },
];

const moodCards: HomeCard[] = [
  { label: "EXPRESS", href: "/recettes?filter=express", color: "#F72585", Icon: Timer, image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=900&q=85&v=5" },
  { label: "APÉRO", href: "/recettes?filter=apero", color: "#F46B25", Icon: Martini, image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "RECEVOIR", href: "/recettes?filter=recevoir", color: "#172554", Icon: Users, image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "JE SUIS FATIGUÉ", href: "/recettes?filter=tired", color: "#C7A6E8", iconColor: "#30213F", Icon: BedDouble, image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=900&q=85&v=4" },
];

const seasonCards: HomeCard[] = [
  { label: "PRINTEMPS", href: "/recettes?filter=printemps", color: "#91D477", iconColor: "#173E2C", Icon: Flower2, image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "ÉTÉ", href: "/recettes?filter=ete", color: "#FFD43B", iconColor: "#46390A", Icon: Sun, image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "AUTOMNE", href: "/recettes?filter=automne", color: "#D97732", Icon: Leaf, image: "https://images.unsplash.com/photo-1570586437263-ab629fccc818?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "HIVER", href: "/recettes?filter=hiver", color: "#70D7EC", iconColor: "#103C50", Icon: Snowflake, image: "https://images.unsplash.com/photo-1768238907887-023b7ac9f450?auto=format&fit=crop&w=900&q=85&v=5" },
];

const preferenceCards: HomeCard[] = [
  { label: "VÉGAN", href: "/vegan", color: "#237A45", Icon: Sprout, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "VÉGÉTARIEN", href: "/vegetarien", color: "#A8DFA0", iconColor: "#173E2C", Icon: Carrot, image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "ÉTUDIANT", href: "/etudiant-petit-budget", color: "#2563EB", Icon: GraduationCap, image: "https://images.unsplash.com/photo-1770235622226-4b5ad88137d8?auto=format&fit=crop&w=900&q=85&v=8" },
  { label: "FÊTES", href: "/fetes", color: "#7F1D3B", Icon: Gift, image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=85&v=6" },
];

// Ces raccourcis déjà présents sur l'accueil sont conservés.
const extraCards: HomeCard[] = [
  { label: "LE FRIGO MAGIQUE", href: "/frigo-magique", color: "#DCEBDD", iconColor: "#214E4B", Icon: Refrigerator, image: "https://images.pexels.com/photos/6593800/pexels-photo-6593800.jpeg?auto=compress&cs=tinysrgb&w=900" },
  { label: "MES FAVORIS", href: "/mes-recettes?tab=favoris", color: "#DCEBDD", iconColor: "#E32636", Icon: Heart, image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "BONUS", href: "/recettes?filter=bonus", color: "#4D7777", Icon: Sparkles, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=85&v=4" },
  { label: "MR CUISINE", href: "/recettes?filter=mr-cuisine", color: "#456B87", Icon: Bot, image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85&v=4" },
];

function CardRow({
  cards,
  columns = 3,
  currentWeek,
  editing = false,
  visibleLabels,
  onToggle,
}: {
  cards: HomeCard[];
  columns?: 3 | 4;
  currentWeek: number;
  editing?: boolean;
  visibleLabels: string[];
  onToggle: (label: string) => void;
}) {
  const gridColumns = columns === 4
    ? "grid-cols-4"
    : "grid-cols-3";

  return (
    <div className={`grid ${columns === 4 ? "grid-cols-2 sm:grid-cols-4" : gridColumns} gap-2.5 sm:gap-4`}>
      {cards.filter((card) => editing || visibleLabels.includes(card.label)).map(({ label, href, color, iconColor, Icon, image }) => {
        const destination = href === "/batch" || href === "/courses" ? href + "?w=" + currentWeek : href;
        const selected = visibleLabels.includes(label);
        const cardClass = "group relative flex aspect-square min-w-0 flex-col overflow-hidden rounded-2xl text-center shadow-[0_5px_14px_rgba(0,0,0,0.18)] transition duration-200 sm:rounded-3xl " + (editing ? "cursor-pointer ring-4 " + (selected ? "ring-[#2F855A]" : "ring-[#9CA3AF] opacity-60 grayscale") : "hover:-translate-y-1 hover:brightness-105 active:scale-[0.97]");
        const cardContent = (
          <>
            <div className="relative mx-auto mt-1 h-[64%] w-[calc(100%-0.5rem)] min-h-0 overflow-hidden rounded-xl sm:rounded-2xl"><img src={image} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />{label === "MES FAVORIS" ? <div aria-hidden="true" className="pointer-events-none absolute inset-0"><Heart className="absolute left-[7%] top-[8%] size-[19%] rotate-[-14deg] fill-[#E32636] text-[#E32636] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.5} /><Heart className="absolute right-[8%] top-[12%] size-[16%] rotate-[15deg] fill-[#FF5B70] text-[#FF5B70] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.5} /><Heart className="absolute left-[3%] top-[48%] size-[14%] rotate-[-10deg] fill-[#FF5B70] text-[#FF5B70] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.5} /><Heart className="absolute right-[4%] top-[48%] size-[18%] rotate-[12deg] fill-[#E32636] text-[#E32636] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.5} /><Heart className="absolute bottom-[7%] left-[17%] size-[13%] rotate-[10deg] fill-[#FF5B70] text-[#FF5B70] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.5} /><Heart className="absolute bottom-[5%] right-[20%] size-[15%] rotate-[-12deg] fill-[#E32636] text-[#E32636] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.5} /></div> : null}</div>
            <span className="flex min-h-0 flex-1 w-full items-center justify-center px-1 py-1 text-[10px] font-black leading-tight tracking-wide sm:text-xs md:text-sm" style={{ backgroundColor: color, color: iconColor || "#FFFFFF" }}>{label}</span>
            {editing ? <span className={"absolute right-2 top-2 flex size-8 items-center justify-center rounded-full shadow " + (selected ? "bg-[#2F855A] text-white" : "bg-white text-[#374151]")} aria-hidden="true">{selected ? <Check size={20} strokeWidth={3} /> : <EyeOff size={18} />}</span> : null}
          </>
        );
        return editing ? <button key={label} type="button" onClick={() => onToggle(label)} aria-pressed={selected} aria-label={(selected ? "Masquer" : "Afficher") + " la catégorie " + label} className={cardClass} style={{ backgroundColor: color, color: iconColor || "#FFFFFF" }}>{cardContent}</button> : <Link key={label} href={destination} prefetch={false} aria-label={label} className={cardClass} style={{ backgroundColor: color, color: iconColor || "#FFFFFF" }}>{cardContent}</Link>;
      })}
            <div className="relative mx-auto mt-1 h-[64%] w-[calc(100%-0.5rem)] min-h-0 overflow-hidden rounded-xl sm:rounded-2xl"><img src={image} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />{label === "MES FAVORIS" ? <div aria-hidden="true" className="pointer-events-none absolute inset-0"><Heart className="absolute left-[7%] top-[8%] size-[19%] rotate-[-14deg] fill-[#E32636] text-[#E32636] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.5} /><Heart className="absolute right-[8%] top-[12%] size-[16%] rotate-[15deg] fill-[#FF5B70] text-[#FF5B70] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.5} /><Heart className="absolute left-[3%] top-[48%] size-[14%] rotate-[-10deg] fill-[#FF5B70] text-[#FF5B70] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.5} /><Heart className="absolute right-[4%] top-[48%] size-[18%] rotate-[12deg] fill-[#E32636] text-[#E32636] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.5} /><Heart className="absolute bottom-[7%] left-[17%] size-[13%] rotate-[10deg] fill-[#FF5B70] text-[#FF5B70] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.5} /><Heart className="absolute bottom-[5%] right-[20%] size-[15%] rotate-[-12deg] fill-[#E32636] text-[#E32636] drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]" strokeWidth={1.5} /></div> : null}</div>
            <span className="flex min-h-0 flex-1 w-full items-center justify-center px-1 py-1 text-[10px] font-black leading-tight tracking-wide sm:text-xs md:text-sm" style={{ backgroundColor: color, color: iconColor || "#FFFFFF" }}>
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
  editing,
  visibleLabels,
  onToggle,
}: {
  title: string;
  cards: HomeCard[];
  columns?: 3 | 4;
  currentWeek: number;
  editing: boolean;
  visibleLabels: string[];
  onToggle: (label: string) => void;
}) {
  const displayedCards = cards.filter((card) => editing || visibleLabels.includes(card.label));
  if (!editing && displayedCards.length === 0) return null;
  return (
    <section className="w-full">
      <h2 className="mb-3 text-center text-xl font-black tracking-tight text-white sm:mb-4 sm:text-2xl">
        {title}
      </h2>
      <CardRow cards={cards} columns={columns} currentWeek={currentWeek} editing={editing} visibleLabels={visibleLabels} onToggle={onToggle} />
    </section>
  );
}

export default function HomePage() {
  const [currentWeek, setCurrentWeek] = useState(() => currentIsoWeek());
  const allHomeLabels = [...dailyCards, ...pepsCards, ...moodCards, ...seasonCards, ...preferenceCards, ...extraCards].map((card) => card.label);
  const [visibleLabels, setVisibleLabels] = useState<string[]>(allHomeLabels);
  const [editingHome, setEditingHome] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HOME_LAYOUT_KEY);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const allowed = new Set(allHomeLabels);
          setVisibleLabels(parsed.filter((label): label is string => typeof label === "string" && allowed.has(label)));
        }
      }
    } catch {
      // Si le stockage est indisponible ou invalide, conserver l’accueil standard.
    } finally {
      setPreferencesReady(true);
    }

    const refreshCurrentWeek = () => setCurrentWeek(currentIsoWeek());
    refreshCurrentWeek();
    const interval = window.setInterval(refreshCurrentWeek, 60_000);
    window.addEventListener("focus", refreshCurrentWeek);
    document.addEventListener("visibilitychange", refreshCurrentWeek);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshCurrentWeek);
      document.removeEventListener("visibilitychange", refreshCurrentWeek);
    };
  }, []);

  function toggleHomeCategory(label: string) {
    setVisibleLabels((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label]);
    setSaveMessage("");
  }

  function saveHomeCategories() {
    try {
      window.localStorage.setItem(HOME_LAYOUT_KEY, JSON.stringify(visibleLabels));
      setEditingHome(false);
      setSaveMessage("Vos choix sont enregistrés sur cet appareil.");
    } catch {
      setSaveMessage("Impossible d’enregistrer les choix. Vérifiez le stockage du navigateur.");
    }
  }

  function cancelHomeEditing() {
    try {
      const raw = window.localStorage.getItem(HOME_LAYOUT_KEY);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        const allowed = new Set(allHomeLabels);
        setVisibleLabels(Array.isArray(parsed) ? parsed.filter((label): label is string => typeof label === "string" && allowed.has(label)) : allHomeLabels);
      } else setVisibleLabels(allHomeLabels);
    } catch { setVisibleLabels(allHomeLabels); }
    setEditingHome(false);
    setSaveMessage("");
  }

  return (
    <main
      className="home-page min-h-dvh w-full overflow-hidden bg-transparent text-[#2B2B2B]"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-4 py-6 pb-12 sm:gap-10 sm:px-8 sm:py-9">
        <header className="flex w-full flex-col items-center text-center">
          <p className="mt-5 max-w-2xl text-sm font-medium leading-6 text-[#2B2B2B]/90 sm:text-base sm:leading-7">
            52 semaines de menus, du batchcooking simple et vos listes de courses automatisées. Cuisinez chic, respirez...OUF !
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#2B2B2B] sm:text-5xl">
            CUISINE CHIC OUF !
          </h1>
          <div className="mt-6 flex w-full max-w-lg flex-col gap-3">
            <Link
              href={`/semaine?w=${currentWeek}`}
              prefetch={false}
              className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#8FAF9B] px-6 py-4 text-lg font-black text-[#103A36] shadow-[0_7px_18px_rgba(0,0,0,0.2)] transition hover:brightness-105 active:scale-[0.99] sm:min-h-16"
            >
              Sauver ma semaine
            </Link>
            <Link
              href="/recettes?filter=tired"
              prefetch={false}
              className="flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-[#B79AD8] px-6 py-4 text-base font-extrabold text-[#30213F] shadow-[0_7px_18px_rgba(0,0,0,0.18)] transition hover:brightness-105 active:scale-[0.99] sm:min-h-16 sm:text-lg"
            >
              <span aria-hidden="true" className="text-xl">🆘</span>
              SOS j'ai pas le goût
            </Link>
          </div>
        </header>

        <p className="text-center text-base font-bold text-[#2B2B2B]/90 sm:text-lg">
          Tout est là pour vous simplifier la vie
        </p>

        <div className="flex w-full flex-col gap-8 sm:gap-10" aria-label={editingHome ? "Sélection des catégories de l’accueil" : "Catégories de l’accueil"}>
          {editingHome && <p className="rounded-2xl border border-[#B9D9C2] bg-white/90 p-4 text-center text-sm font-semibold text-[#214E4B]">Touchez les photos pour choisir les catégories à conserver. Le contour vert indique une catégorie affichée ; les cartes grisées seront masquées.</p>}
          <HomeSection title="Mon Quotidien" cards={dailyCards} currentWeek={currentWeek} editing={editingHome} visibleLabels={visibleLabels} onToggle={toggleHomeCategory} />
          <HomeSection title="Le Peps en cuisine" cards={pepsCards} currentWeek={currentWeek} editing={editingHome} visibleLabels={visibleLabels} onToggle={toggleHomeCategory} />
          <HomeSection title="Selon mon humeur & mon profil" cards={moodCards} columns={4} currentWeek={currentWeek} editing={editingHome} visibleLabels={visibleLabels} onToggle={toggleHomeCategory} />
          <HomeSection title="Les Saisons" cards={seasonCards} columns={4} currentWeek={currentWeek} editing={editingHome} visibleLabels={visibleLabels} onToggle={toggleHomeCategory} />
          <HomeSection title="Mes Préférences" cards={preferenceCards} columns={4} currentWeek={currentWeek} editing={editingHome} visibleLabels={visibleLabels} onToggle={toggleHomeCategory} />
          <HomeSection title="Mes petits plus" cards={extraCards} currentWeek={currentWeek} editing={editingHome} visibleLabels={visibleLabels} onToggle={toggleHomeCategory} />
        </div>

        <div className="w-full max-w-md text-left">
          <InstallApp />
        </div>

        <div className="w-full max-w-lg pt-2">
          {editingHome ? <div className="flex flex-col gap-3">
            <p className="text-center text-sm font-bold text-[#214E4B]">{visibleLabels.length} catégorie(s) conservée(s) sur {allHomeLabels.length}</p>
            <button type="button" onClick={saveHomeCategories} disabled={!preferencesReady} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#2F855A] px-5 py-4 text-base font-black text-white shadow-lg transition hover:brightness-105 disabled:opacity-50"><Check size={20} /> Confirmer et enregistrer mes choix</button>
            <button type="button" onClick={cancelHomeEditing} className="min-h-11 w-full rounded-xl border border-[#8FAF9B] bg-white/80 px-4 py-2 font-bold text-[#214E4B]">Annuler</button>
          </div> : <div className="flex flex-col items-center gap-2">
            <button type="button" onClick={() => { setEditingHome(true); setSaveMessage(""); }} disabled={!preferencesReady} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#8FAF9B] bg-white/85 px-5 py-3 font-extrabold text-[#214E4B] shadow-sm transition hover:bg-white disabled:opacity-50"><Settings size={19} /> ⚙️ Personnaliser mon accueil</button>
            {saveMessage && <p role="status" className="text-center text-sm font-semibold text-[#214E4B]">{saveMessage}</p>}
          </div>}
        </div>
      </div>
    </main>
  );
}
