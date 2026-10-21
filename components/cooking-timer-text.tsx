"use client";

import { useEffect, useRef, useState } from "react";
import { Timer, RotateCcw, Pause, Play } from "lucide-react";

type TimerState = { total: number; remaining: number; running: boolean; finished: boolean };

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function soundAlarm() {
  try {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    [0, 0.35, 0.7].forEach((delay) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.22, context.currentTime + delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + 0.22);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + delay);
      oscillator.stop(context.currentTime + delay + 0.24);
    });
    window.setTimeout(() => { void context.close(); }, 1500);
  } catch { /* Le navigateur peut bloquer le son. */ }
}

export function CookingTimerText({ text }: { text: string }) {
  const matches = Array.from(text.matchAll(/\b(\d{1,3})(?:\s*(h|heures?|min(?:ute)?s?|sec(?:onde)?s?))\b/gi));
  const [timers, setTimers] = useState<Record<number, TimerState>>({});
  const timersRef = useRef<Record<number, TimerState>>({});
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    timersRef.current = timers;
  }, [timers]);

  useEffect(() => {
    const hasRunning = Object.values(timers).some((timer) => timer.running);
    if (!hasRunning) return;
    const interval = window.setInterval(() => {
      const now = Date.now();
      const elapsed = lastTickRef.current ? Math.max(1, Math.round((now - lastTickRef.current) / 1000)) : 1;
      lastTickRef.current = now;
      setTimers((previous) => {
        const next = { ...previous };
        Object.entries(previous).forEach(([key, timer]) => {
          if (!timer.running) return;
          const remaining = Math.max(0, timer.remaining - elapsed);
          const finished = remaining === 0;
          next[Number(key)] = { ...timer, remaining, running: !finished, finished };
          if (finished) soundAlarm();
        });
        return next;
      });
    }, 250);
    return () => window.clearInterval(interval);
  }, [timers]);

  function secondsFor(match: RegExpMatchArray) {
    const amount = Number(match[1]);
    const unit = (match[2] || "").toLocaleLowerCase("fr");
    if (unit.startsWith("h")) return amount * 3600;
    if (unit.startsWith("s")) return amount;
    return amount * 60;
  }

  function start(index: number, total: number) {
    lastTickRef.current = Date.now();
    setTimers((previous) => ({ ...previous, [index]: { total, remaining: total, running: true, finished: false } }));
  }

  function toggle(index: number) {
    setTimers((previous) => {
      const timer = previous[index];
      if (!timer) return previous;
      return { ...previous, [index]: { ...timer, running: !timer.running, finished: false } };
    });
  }

  function reset(index: number) {
    setTimers((previous) => {
      const timer = previous[index];
      if (!timer) return previous;
      return { ...previous, [index]: { total: timer.total, remaining: timer.total, running: false, finished: false } };
    });
  }

  if (!matches.length) return <>{text}</>;

  const pieces: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((match, index) => {
    const startAt = match.index ?? 0;
    const matchedText = match[0];
    if (startAt > cursor) pieces.push(text.slice(cursor, startAt));
    const total = secondsFor(match as RegExpMatchArray);
    const timer = timers[index];
    pieces.push(
      <span key={`timer-${index}`} className="inline-flex flex-wrap items-center gap-1 align-middle">
        <button
          type="button"
          onClick={() => timer ? toggle(index) : start(index, total)}
          aria-label={timer ? (timer.running ? "Mettre le minuteur en pause" : "Reprendre le minuteur") : `Lancer le minuteur de ${matchedText}`}
          title={timer ? (timer.running ? "Pause" : "Reprendre") : "Cliquer pour lancer le compte à rebours"}
          className="mx-0.5 inline-flex items-center gap-1 rounded-lg border border-[#D98A6C] bg-[#FFF0E9] px-2 py-1 font-extrabold text-[#873F28] underline decoration-dotted underline-offset-4 hover:bg-[#FBE0D4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D98A6C]"
        >
          {timer ? (timer.running ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />) : <Timer size={14} aria-hidden="true" />}
          {timer ? formatTime(timer.remaining) : matchedText.toLocaleUpperCase("fr")}
        </button>
        {timer && (
          <button type="button" onClick={() => reset(index)} title="Réinitialiser le minuteur" aria-label="Réinitialiser le minuteur" className="inline-flex rounded-md p-1 text-[#873F28] hover:bg-[#FBE0D4]">
            <RotateCcw size={13} aria-hidden="true" />
          </button>
        )}
        {timer?.finished && <span role="status" className="rounded-md bg-[#E3ECE5] px-2 py-1 text-xs font-bold text-[#24372C]">⏰ C’est prêt !</span>}
      </span>
    );
    cursor = startAt + matchedText.length;
  });
  if (cursor < text.length) pieces.push(text.slice(cursor));
  return <>{pieces}</>;
}
