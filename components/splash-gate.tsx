"use client";

import { useEffect, useState } from "react";
import { BASE_PATH } from "@/lib/base-path";

export function SplashGate({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {children}
      {showSplash ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-7 px-6 text-center animate-[splashFadeIn_500ms_ease-out_both]"
          style={{
            backgroundColor: "#4A9290",
            backgroundImage:
              "radial-gradient(ellipse at 12% 8%, rgba(190,235,220,0.62), transparent 42%), radial-gradient(ellipse at 90% 42%, rgba(112,196,187,0.58), transparent 48%), repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 5px)",
          }}
        >
          <img
            src={`${BASE_PATH}/logo-cuisine-chic-ouf-v3.png`}
            alt="CUISINE CHIC OUF !"
            className="h-auto w-full max-w-[300px] rounded-[28px] bg-[#F9F6EC] shadow-xl"
          />
          <p className="max-w-md rounded-2xl bg-black/15 px-5 py-3 text-lg font-semibold leading-7 text-white shadow-sm sm:text-xl">
            Pas de panique, on mange quoi ce soir ?
          </p>
        </div>
      ) : null}
    </>
  );
}
