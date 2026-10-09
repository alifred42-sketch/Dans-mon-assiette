"use client";

import { useEffect, useState } from "react";

const reminders = [
  { day: 0, hour: 10, minute: 0, title: "👩‍🍳 C'est l'heure du Batchcooking !", body: "Enfilez votre tablier et allumez votre robot..." },
  { day: 1, hour: 17, minute: 30, title: "🥗 Pas de panique pour ce soir...", body: "Votre menu est prêt." },
  { day: 5, hour: 18, minute: 30, title: "🍔 Alerte Week-end Plaisir !", body: "Ce soir, c'est flemme et gourmandise." },
];

export function MealReminders() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (!("Notification" in window)) { setPermission("unsupported"); return; }
    setPermission(Notification.permission);
    setEnabled(localStorage.getItem("cuisine-chic-ouf-reminders") === "on");
  }, []);
  useEffect(() => {
    if (!enabled || permission !== "granted") return;
    let active = true;
    const timers: number[] = [];
    const schedule = () => {
      if (!active) return;
      const now = new Date();
      const next = reminders.map((reminder) => {
        const date = new Date(now);
        date.setHours(reminder.hour, reminder.minute, 0, 0);
        const daysUntil = (reminder.day - date.getDay() + 7) % 7;
        date.setDate(date.getDate() + daysUntil);
        if (date.getTime() <= now.getTime()) date.setDate(date.getDate() + 7);
        return { ...reminder, date };
      }).sort((a, b) => a.date.getTime() - b.date.getTime())[0];
      const timer = window.setTimeout(async () => {
        if (!active || Notification.permission !== "granted") return;
        try {
          const registration = await navigator.serviceWorker?.getRegistration();
          if (registration) await registration.showNotification(next.title, { body: next.body, icon: "/icon-192.png", badge: "/icon-192.png", tag: "cuisine-chic-ouf-" + next.day, data: { url: "/semaine" } });
          else new Notification(next.title, { body: next.body });
        } catch { /* notification unavailable on this browser */ }
        schedule();
      }, Math.max(1000, next.date.getTime() - now.getTime()));
      timers.push(timer);
    };
    schedule();
    return () => { active = false; timers.forEach(window.clearTimeout); };
  }, [enabled, permission]);
  async function activate() {
    if (!("Notification" in window)) { setPermission("unsupported"); return; }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      localStorage.setItem("cuisine-chic-ouf-reminders", "on");
      setEnabled(true);
    }
  }
  function disable() { localStorage.removeItem("cuisine-chic-ouf-reminders"); setEnabled(false); }
  return (
    <section className="space-y-3 rounded-2xl border border-[#E9E9E4] bg-white p-4">
      <div>
        <h2 className="font-heading text-lg font-bold">🔔 Mes rappels Cuisine Chic Ouf</h2>
        <p className="mt-1 text-sm leading-relaxed text-[#666660]">Dimanche 10 h : batchcooking · Lundi 17 h 30 : menu prêt · Vendredi 18 h 30 : week-end plaisir.</p>
      </div>
      {permission === "unsupported" ? <p className="text-sm text-[#666660]">Les notifications ne sont pas prises en charge par ce navigateur.</p> : enabled ? <button onClick={disable} className="rounded-xl border border-[#8FA89B] px-4 py-2 text-sm font-bold text-[#668775]">Désactiver les rappels</button> : <button onClick={activate} className="rounded-xl bg-[#8FA89B] px-4 py-2 text-sm font-bold text-white">Activer les rappels</button>}
      <p className="text-xs leading-relaxed text-[#777773]">Note : ces rappels sont programmés sur cet appareil lorsque l’application reste ouverte. Les notifications push garanties lorsque l’application est fermée nécessitent un service push côté serveur.</p>
    </section>
  );
}
