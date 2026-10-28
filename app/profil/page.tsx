"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ChefHat, Refrigerator, Save } from "lucide-react";

const PREFS_KEY = "cuisine-chic-ouf-preferences";

export default function ProfilPage() {
  const [airfryer, setAirfryer] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      setAirfryer(Boolean(saved.airfryer));
    } catch { setAirfryer(false); }
    setReady(true);
  }, []);

  function updateAirfryer(enabled: boolean) {
    setAirfryer(enabled);
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      localStorage.setItem(PREFS_KEY, JSON.stringify({ ...saved, airfryer: enabled }));
      window.dispatchEvent(new Event("cuisine-chic-ouf-preferences-change"));
    } catch {}
  }

  return (
    <main className="min-h-dvh bg-transparent px-4 pb-12 pt-6 text-[#2B2B2B] sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm font-bold text-[#214E4B] shadow-sm"><ArrowLeft size={18} /> Retour à l’accueil</Link>
        <header className="text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#DCEBDD] text-[#214E4B]"><ChefHat size={34} /></span>
          <h1 className="mt-3 text-3xl font-black uppercase tracking-tight text-[#214E4B]">Mon profil</h1>
          <p className="mt-2 text-sm text-[#557067]">Personnalisez l’affichage des recettes selon votre équipement.</p>
        </header>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0D9] text-2xl">🍟</span>
            <div className="min-w-0 flex-1">
              <h2 className="font-black text-[#214E4B]">Je possède un Airfryer</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#557067]">Lorsque cette option est activée, les temps et températures Airfryer compatibles sont mis en valeur sur les cartes de recettes.</p>
            </div>
            <button type="button" role="switch" aria-checked={airfryer} aria-label="Je possède un Airfryer" disabled={!ready} onClick={() => updateAirfryer(!airfryer)} className={`relative mt-1 inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${airfryer ? "bg-[#4A9290]" : "bg-[#B9BDB8]"}`}>
              <span className={`inline-block size-6 rounded-full bg-white shadow transition-transform ${airfryer ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="mt-5 rounded-2xl bg-[#F4F8F1] p-4 text-sm text-[#315E59]">
            <div className="flex items-center gap-2 font-bold"><Save size={16} /> {airfryer ? "Airfryer activé" : "Airfryer désactivé"}</div>
            <p className="mt-1 text-xs leading-relaxed">Votre choix est enregistré sur cet appareil et utilisé par le carnet de recettes. La version actuelle de l’application n’a pas de serveur de compte connecté : ce réglage n’est donc pas synchronisé entre plusieurs appareils.</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#DCE5DE] bg-white/70 p-4 text-sm text-[#557067]">
          <div className="flex items-center gap-2 font-bold text-[#214E4B]"><Refrigerator size={18} /> Vos autres outils</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/frigo-magique" className="rounded-xl bg-[#DCEBDD] px-3 py-2 font-bold text-[#214E4B]">✨ Le Frigo Magique</Link>
            <Link href="/recettes" className="rounded-xl bg-[#F5E4D2] px-3 py-2 font-bold text-[#75431F]">📖 Le carnet de recettes</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
