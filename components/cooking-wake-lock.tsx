"use client";

import { useEffect } from "react";

export function CookingWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let active = true;
    const request = async () => {
      if (!active || !("wakeLock" in navigator)) return;
      try { lock = await navigator.wakeLock.request("screen"); } catch { /* unsupported or permission denied */ }
    };
    void request();
    const onVisibility = () => { if (document.visibilityState === "visible") void request(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVisibility);
      if (lock) void lock.release().catch(() => {});
    };
  }, []);
  return null;
}
