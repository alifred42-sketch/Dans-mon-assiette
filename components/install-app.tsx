"use client";

import { useEffect, useState } from "react";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    if (standalone) {
      setInstalled(true);
      return;
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as PromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      return;
    }
    setHelp(true);
  }

  return (
    <section className="rounded-2xl bg-primary px-4 py-4 text-primary-foreground">
      <p className="font-heading text-lg leading-tight">Mettre sur l’écran d’accueil</p>
      <p className="mt-1 text-sm text-primary-foreground/85">
        Comme une appli, sans passer par le Play Store.
      </p>
      <button
        type="button"
        onClick={install}
        className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-card px-4 text-base font-semibold text-foreground"
      >
        Installer
      </button>
      {help ? (
        <p className="mt-3 text-sm text-primary-foreground/90">
          Chrome : tape le menu <strong>⋮</strong> en haut à droite, puis{" "}
          <strong>Installer l’application</strong> ou <strong>Ajouter à l’écran d’accueil</strong>.
        </p>
      ) : null}
    </section>
  );
}
