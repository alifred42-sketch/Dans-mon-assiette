"use client";

import { useEffect } from "react";
import { BASE_PATH } from "@/lib/base-path";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const sw = `${BASE_PATH}/sw.js`;
    const scope = `${BASE_PATH}/`;
    const register = () => {
      navigator.serviceWorker.register(sw, { scope }).catch(() => {
        /* ignore: the site still works without the install cache */
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
  return null;
}
