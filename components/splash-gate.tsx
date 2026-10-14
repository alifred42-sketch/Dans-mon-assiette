"use client";

import { useEffect, useState } from "react";
import { BASE_PATH } from "@/lib/base-path";

const STORAGE_KEY = "cuisine-chic-ouf-splash-seen";

export function SplashGate({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setShowSplash(true);
        const timer = window.setTimeout(() => {
          localStorage.setItem(STORAGE_KEY, "1");
          setShowSplash(false);
        }, 5000);
        setReady(true);
        return () => window.clearTimeout(timer);
      }
    } catch { /* si le stockage est indisponible, on affiche l’application directement */ }
    setReady(true);
  }, []);

  return (
    <>
      {children}
      {ready && showSplash ? (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 bg-[#F9F9F7] px-8 text-center animate-[splashFadeIn_500ms_ease-out_both]">
          <img src={`${BASE_PATH}/logo-cuisine-chic-ouf-v3.png`} alt="CUISINE CHIC OUF !" className="h-auto w-full max-w-[300px] rounded-[28px] bg-[#F9F6EC]" />
          <p className="max-w-md text-base font-normal leading-7 text-[#2B2B2B] sm:text-lg">
            Pas de panique, on mange quoi ce soir ? 52 semaines de menus, du batchcooking simple et vos listes de courses automatisées. Cuisinez chic, respirez... OUF !
          </p>
        </div>
      ) : null}
    </>
  );
}
