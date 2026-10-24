"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, SkipBack, SkipForward, Play, Pause } from "lucide-react";

type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void;
};
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };

export function RecipeHandsFree({ steps }: { steps: string[] }) {
  const [active, setActive] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [status, setStatus] = useState("Appuyez sur le micro pour activer les commandes vocales.");
  const recognitionRef = useRef<Recognition | null>(null);
  const indexRef = useRef(0);
  const activeRef = useRef(false);
  const step = steps[index] || "";

  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => () => { recognitionRef.current?.stop(); if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  function speak(text: string) {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.onend = () => setPlaying(false);
    utterance.onstart = () => setPlaying(true);
    window.speechSynthesis.speak(utterance);
  }
  function go(next: number) {
    const target = Math.max(0, Math.min(next, steps.length - 1));
    setIndex(target); indexRef.current = target;
    if (steps[target]) speak(steps[target]);
    setStatus(`Étape ${target + 1} sur ${steps.length}`);
  }
  function stopMode() {
    activeRef.current = false;
    recognitionRef.current?.stop(); recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    setPlaying(false); setActive(false);
    setStatus("Mode mains libres désactivé.");
  }
  function toggleMode() {
    if (active) { stopMode(); return; }
    const Ctor = (window as SpeechWindow).SpeechRecognition || (window as SpeechWindow).webkitSpeechRecognition;
    if (!Ctor) { setStatus("La reconnaissance vocale n’est pas disponible dans ce navigateur. Essayez Chrome ou Edge."); return; }
    const recognition = new Ctor();
    recognition.lang = "fr-FR"; recognition.continuous = true; recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0]?.transcript || "").join(" ").toLocaleLowerCase("fr");
      if (/\bpause\b/.test(transcript)) { window.speechSynthesis.cancel(); setPlaying(false); setStatus("Lecture en pause. Dites « Lecture » pour reprendre."); }
      else if (/\blecture\b|reprends|reprendre/.test(transcript)) { speak(steps[indexRef.current] || "Aucune étape disponible."); }
      else if (/étape suivante|etape suivante|suivant/.test(transcript)) { go(indexRef.current + 1); }
      else if (/étape ok|etape ok|c'est fait|c est fait/.test(transcript)) { setDone(prev => ({ ...prev, [indexRef.current]: true })); setStatus("Étape cochée. Dites « Étape suivante » pour continuer."); }
      else if (/relis l'étape|relis l etape|répète|repete/.test(transcript)) { speak(steps[indexRef.current] || "Aucune étape disponible."); }
      else if (/précédent|precedent|étape précédente|etape precedente/.test(transcript)) { go(indexRef.current - 1); }
    };
    recognition.onerror = (event) => setStatus(event.error === "not-allowed" ? "Autorisez l’accès au micro dans les réglages du navigateur." : "Le micro a rencontré un problème.");
    recognition.onend = () => { if (activeRef.current && recognitionRef.current === recognition) { try { recognition.start(); } catch {} } };
    recognitionRef.current = recognition; activeRef.current = true; setActive(true);
    setStatus("Micro activé. Dites « Lecture », « Pause », « Étape OK », « Étape suivante » ou « Relis l’étape ».");
    try { recognition.start(); } catch { setStatus("Impossible de démarrer le micro. Réessayez."); }
  }

  return <div className="my-4 rounded-2xl border border-[#D8E3D9] bg-[#F8FAF6] p-3 sm:p-4">
    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#557067]">Commandes de préparation</p>
    <div className="flex items-center justify-center gap-4">
      <button type="button" aria-label="Étape précédente" title="Étape précédente" onClick={() => go(index - 1)} disabled={!steps.length || index === 0} className="flex size-12 items-center justify-center rounded-full bg-[#8FA89B] text-white shadow-sm disabled:opacity-40"><SkipBack size={20}/></button>
      <button type="button" aria-label={playing ? "Mettre en pause" : "Lire les instructions"} title={playing ? "Pause" : "Lecture"} onClick={() => { if (playing) { window.speechSynthesis.cancel(); setPlaying(false); setStatus("Lecture en pause. Appuyez sur Lecture pour reprendre."); } else speak(step); }} disabled={!steps.length} className="flex size-14 items-center justify-center rounded-full bg-[#8FA89B] text-white shadow-sm disabled:opacity-40">{playing ? <Pause size={24}/> : <Play size={24}/>}</button>
      <button type="button" aria-label="Étape suivante" title="Étape suivante" onClick={() => go(index + 1)} disabled={!steps.length || index >= steps.length - 1} className="flex size-12 items-center justify-center rounded-full bg-[#8FA89B] text-white shadow-sm disabled:opacity-40"><SkipForward size={20}/></button>
      <button type="button" onClick={toggleMode} aria-label={active ? "Désactiver le mode mains libres" : "Activer le mode mains libres"} title={active ? "Désactiver le mode mains libres" : "Activer le mode mains libres"} className={`flex size-12 items-center justify-center rounded-full shadow-sm ring-2 ring-offset-2 ${active ? "bg-[#DCEBDD] text-[#267443] ring-[#8FA89B]" : "bg-[#F0F0ED] text-[#737873] ring-transparent"}`}>{active ? <Mic size={21}/> : <MicOff size={21}/>}</button>
    </div>
    <div className="mt-3 text-center text-xs leading-relaxed text-[#557067]">◀ Précédent · <strong>Lecture / Pause</strong> · Suivant ▶</div>
    <p className="mt-2 text-center text-xs leading-relaxed text-[#557067]">À la voix : <strong>« Lecture » · « Pause » · « Étape OK » · « Étape suivante » · « Relis l’étape »</strong></p>
    <p aria-live="polite" className="mt-2 text-center text-xs text-[#557067]">{status}{steps.length ? ` · Étape ${index + 1}/${steps.length}${done[index] ? " · ✓ validée" : ""}` : ""}</p>
  </div>;
}
