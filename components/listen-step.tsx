"use client";

import { Volume2 } from "lucide-react";

export function ListenStep({ text }: { text: string }) {
  function listen() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={listen}
      aria-label="Écouter cette étape"
      title="Écouter cette étape"
      className="ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#1A1A1A] hover:bg-[#F3F3EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8FA89B]"
    >
      <Volume2 size={14} aria-hidden="true" />
      <span>Écouter l’étape</span>
    </button>
  );
}
