"use client";

import { displayRecipe } from "@/lib/recipe-display";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { batchForWeek, clampWeek, currentIsoWeek, getRecipe, weekPlan, type PlanningPreferences } from "@/lib/carnet";
import { WeekPicker } from "@/components/week-picker";
import { Beef, Blender, Carrot, CookingPot, Container, Flame, Refrigerator, Utensils, Wheat } from "lucide-react";

type Task = { id: string; title: string; detail?: string; timer?: string; group?: string };
type VoiceRecognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void;
};
type VoiceWindow = Window & { SpeechRecognition?: new () => VoiceRecognition; webkitSpeechRecognition?: new () => VoiceRecognition };

function minutes(value?: string): number {
  if (!value) return 0;
  const text = value.toLocaleLowerCase("fr");
  const hours = Number(text.match(/(\d+)\s*(?:h|heure)/)?.[1] || 0);
  const mins = Number(text.match(/(\d+)\s*(?:min|minute)/)?.[1] || 0);
  return hours * 60 + mins;
}
function durationLabel(total: number): string {
  const safe = Math.max(0, Math.round(total));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return h ? (m ? `${h} h ${m.toString().padStart(2, "0")}` : `${h} h`) : `${m} min`;
}
function prettyDay(day: string) { return day.charAt(0) + day.slice(1).toLowerCase(); }

function ingredientKind(value: string): "vegetable" | "protein" | "starch" | "storage" | "equipment" | "other" {
  const text = value.toLocaleLowerCase("fr");
  if (/courgette|carotte|tomate|poivron|oignon|échalote|echalote|poireau|champignon|brocoli|chou|épinard|epinard|concombre|pomme de terre|patate douce|aubergine|céleri|celeri|radis|navet|asperge|ail|herbes|salade|légume|legume|découpe|decoupe|laver|éplucher|eplucher/.test(text)) return "vegetable";
  if (/poulet|dinde|bœuf|boeuf|viande|poisson|saumon|cabillaud|œuf|oeuf|thon|jambon|protéine|proteine/.test(text)) return "protein";
  if (/riz|pâte|pate|semoule|quinoa|pomme de terre|féculent|feculent|farine|lentille|pain/.test(text)) return "starch";
  if (/conteneur|contenant|étiquet|etiquet|frigo|réfrig|refriger|congél|congel|stockage|portion|assembler/.test(text)) return "storage";
  if (/four|robot|mr cuisine|monsieur cuisine|mixage|mixeur|poêle|poele|casserole|cuisson|feu|chauffer|mijot|rôtir|rotir/.test(text)) return "equipment";
  return "other";
}

function taskIcon(value: string) {
  const kind = ingredientKind(value);
  if (kind === "vegetable") return <Carrot aria-hidden="true" className="size-5" />;
  if (kind === "protein") return <Beef aria-hidden="true" className="size-5" />;
  if (kind === "starch") return <Wheat aria-hidden="true" className="size-5" />;
  if (kind === "storage") return <Refrigerator aria-hidden="true" className="size-5" />;
  if (/mixeur|robot|mr cuisine|monsieur cuisine|mixage/.test(value.toLocaleLowerCase("fr"))) return <Blender aria-hidden="true" className="size-5" />;
  if (/four|rôtir|rotir/.test(value.toLocaleLowerCase("fr"))) return <Flame aria-hidden="true" className="size-5" />;
  if (/poêle|poele|casserole|cuisson|feu/.test(value.toLocaleLowerCase("fr"))) return <CookingPot aria-hidden="true" className="size-5" />;
  if (/matériel|materiel|ustensile|planche|couteau/.test(value.toLocaleLowerCase("fr"))) return <Utensils aria-hidden="true" className="size-5" />;
  if (/contenant|bocal|boîte|boite/.test(value.toLocaleLowerCase("fr"))) return <Container aria-hidden="true" className="size-5" />;
  return <Utensils aria-hidden="true" className="size-5" />;
}

function kindStyle(value: string) {
  const kind = ingredientKind(value);
  if (kind === "vegetable") return { label: "Légumes", classes: "bg-[#E0EFDF] text-[#2F6B3B] ring-[#A8CBA5]" };
  if (kind === "protein") return { label: "Protéines", classes: "bg-[#FBE3DF] text-[#A63D35] ring-[#E7AAA2]" };
  if (kind === "starch") return { label: "Féculents", classes: "bg-[#DFEAFB] text-[#315F9E] ring-[#A8C2E8]" };
  if (kind === "storage") return { label: "Contenants", classes: "bg-[#E6DFD3] text-[#625747] ring-[#C8BDAA]" };
  if (kind === "equipment") return { label: "Matériel / cuisson", classes: "bg-[#F3E5D9] text-[#8C4C34] ring-[#DDB69F]" };
  return { label: "Préparation", classes: "bg-[#F2F2EE] text-[#555551] ring-[#DEDED7]" };
}

export default function BatchPage() {
  const search = useSearchParams();
  const requestedWeek = search.get("w");
  const [week, setWeek] = useState(() => clampWeek(requestedWeek ?? String(currentIsoWeek())));
  const [recipeOverrides, setRecipeOverrides] = useState<Record<string, string>>({});
  const [preferences, setPreferences] = useState<PlanningPreferences>({});
  const [robotPriority, setRobotPriority] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Mode mains libres désactivé");
  const [voiceIndex, setVoiceIndex] = useState(0);
  const recognitionRef = useRef<VoiceRecognition | null>(null);

  useEffect(() => setWeek(clampWeek(requestedWeek ?? String(currentIsoWeek()))), [requestedWeek]);
  useEffect(() => {
    const refresh = () => {
      try { setRecipeOverrides(JSON.parse(localStorage.getItem("cuisine-chic-ouf-recipe-switches") || "{}")); } catch { setRecipeOverrides({}); }
      try {
        const saved = JSON.parse(localStorage.getItem("cuisine-chic-ouf-preferences") || "{}");
        setPreferences(saved); setRobotPriority(Boolean(saved.robot));
      } catch { setPreferences({}); setRobotPriority(false); }
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cuisine-chic-ouf-plan-change", refresh);
    window.addEventListener("cuisine-chic-ouf-preferences-change", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("cuisine-chic-ouf-plan-change", refresh); window.removeEventListener("cuisine-chic-ouf-preferences-change", refresh); };
  }, []);
  const storageKey = `cuisine-chic-ouf-batch-v2-${week}`;
  useEffect(() => {
    setReady(false);
    try { setChecked(JSON.parse(localStorage.getItem(storageKey) || "{}")); } catch { setChecked({}); }
    setReady(true);
  }, [storageKey]);
  useEffect(() => {
    if (ready) { try { localStorage.setItem(storageKey, JSON.stringify(checked)); } catch { /* storage indisponible */ } }
  }, [checked, ready, storageKey]);

  const plan = weekPlan(week, recipeOverrides, preferences);
  const baseSlots = plan.filter((slot) => (slot.day === "MARDI" && slot.meal === "Soir") || (slot.day === "MERCREDI" && slot.meal === "Soir"));
  const recipes = baseSlots.map((slot) => {
    const source = getRecipe(slot.recipeId);
    return { slot, recipe: source ? displayRecipe(source) : undefined };
  }).filter((entry) => entry.recipe);
  const existingItems = batchForWeek(week, recipeOverrides, preferences).filter((item) => /protéine pivot|proteine pivot|féculent|feculent|soupe de saison|base soupe|base de saison/i.test(`${item.title} ${item.group || ""}`));
  const existingTask = (item: { id: string; title: string; detail?: string; group?: string; target?: string }): Task => ({
    id: `carnet-${item.id}`, title: item.title,
    detail: [item.detail, item.target].filter(Boolean).join(" · ") || undefined,
    group: item.group,
  });
  const existingPrepTasks = existingItems.filter((item) => /organisation|préparation|preparation|découpe|decoupe|laver|éplucher|eplucher|planche|féculent|feculent|protéine pivot|proteine pivot|base de saison|soupe de saison|base soupe/i.test(`${item.title} ${item.group || ""}`)).map(existingTask);
  const existingCookTasks = existingItems.filter((item) => /four|rôtir|rotir|gratin|cuisson au four|légumes rôtis|legumes rotis|robot|mr cuisine|monsieur cuisine|vitesse|mixage|cuisson vapeur|cuissons? simultanées?/i.test(`${item.title} ${item.group || ""}`)).map(existingTask);
  const existingStorageTasks = existingItems.filter((item) => /conservation|congél|congel|frigo|réfrigér|refriger|assemblage|jour j|montage|finition|servir/i.test(`${item.title} ${item.group || ""}`)).map(existingTask);
  const vegetablePattern = /courgette|carotte|tomate|poivron|oignon|échalote|echalote|poireau|champignon|brocoli|chou|épinard|epinard|concombre|pomme de terre|patate douce|aubergine|céleri|celeri|radis|navet|asperge|ail|herbes|salade/i;
  const prepTasks: Task[] = useMemo(() => {
    const ingredients = recipes.flatMap(({ recipe }) => (recipe?.ingredients || []).filter((ingredient) => vegetablePattern.test(ingredient)));
    const unique = Array.from(new Set(ingredients));
    if (!unique.length) return recipes.map(({ slot, recipe }) => ({ id: `prep-${slot.day}-${slot.meal}-${slot.recipeId}`, title: `Préparer et peser les ingrédients de ${recipe!.name}`, detail: "Suivre les quantités de la fiche recette." }));
    return unique.map((ingredient) => ({ id: `cut-${ingredient.toLocaleLowerCase("fr")}`, title: ingredient, detail: "Laver et découper si nécessaire, puis placer dans un récipient propre." }));
  }, [recipes]);
  const cookTasks: Task[] = recipes.map(({ slot, recipe }, index) => {
    const cookMinutes = minutes(recipe?.timeCook);
    const cookingStep = recipe?.steps.find((step) => /cuire|cuisson|mijot|four|poêle|poele|casserole|bouillir|rôtir|rotir|chauffer|feu/i.test(step));
    const timer = cookMinutes > 0 ? `Timer : ${cookMinutes} min` : "Timer : durée non renseignée — vérifier la fiche avant de démarrer";
    return {
      id: `cook-${slot.day}-${slot.meal}-${slot.recipeId}`,
      title: `Feu ${index + 1} — ${recipe?.name || slot.name}`,
      timer,
      detail: [cookingStep, recipe?.robot?.length ? `Option Monsieur Cuisine : ${recipe.robot.join(" → ")}` : ""].filter(Boolean).join(" "),
      group: "Cuissons en parallèle",
    };
  });
  const assemblyTasks: Task[] = recipes.map(({ slot, recipe }) => ({
    id: `assembly-${slot.day}-${slot.meal}-${slot.recipeId}`,
    title: `Assembler et étiqueter — ${recipe!.name}`,
    detail: `${prettyDay(slot.day)} soir : répartir en portions dans des contenants propres et fermés. Refroidir rapidement. Si le repas n'est pas prévu dans les 3 jours, congeler dès refroidissement et décongeler au réfrigérateur. Réfrigérateur : 3 jours maximum.`,
    group: `${prettyDay(slot.day)} · ${slot.meal}`,
  }));
  const combinedPrepTasks = [...prepTasks, ...existingPrepTasks];
  const combinedCookTasks = [...cookTasks, ...existingCookTasks];
  const combinedAssemblyTasks = [...assemblyTasks, ...existingStorageTasks];
  const tasks = [...combinedPrepTasks, ...combinedCookTasks, ...combinedAssemblyTasks];
  const done = tasks.filter((task) => checked[task.id]).length;
  const progress = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const prepMinutes = recipes.reduce((sum, entry) => sum + minutes(entry.recipe?.timePrep), 0);
  const cookMinutes = recipes.reduce((sum, entry) => Math.max(sum, minutes(entry.recipe?.timeCook)), 0);
  const totalMinutes = prepMinutes + cookMinutes;
  const separateMinutes = recipes.reduce((sum, entry) => sum + minutes(entry.recipe?.timePrep) + minutes(entry.recipe?.timeCook), 0);
  const savedMinutes = Math.max(0, separateMinutes - totalMinutes);
  const currentVoiceTask = tasks[Math.min(voiceIndex, Math.max(0, tasks.length - 1))];
  const currentVoiceTaskRef = useRef<Task | undefined>(undefined);
  currentVoiceTaskRef.current = currentVoiceTask;

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    window.speechSynthesis.speak(utterance);
  }

  function stopVoiceMode() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setVoiceMode(false);
    setVoiceStatus("Mode mains libres désactivé");
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  function startVoiceMode() {
    const VoiceRecognitionConstructor = (window as VoiceWindow).SpeechRecognition || (window as VoiceWindow).webkitSpeechRecognition;
    if (!VoiceRecognitionConstructor) {
      setVoiceStatus("La reconnaissance vocale n'est pas prise en charge par ce navigateur. Essayez Chrome ou Edge.");
      return;
    }
    const recognition = new VoiceRecognitionConstructor();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0]?.transcript || "").join(" ").toLocaleLowerCase("fr");
      setVoiceStatus(`Commande entendue : « ${transcript} »`);
      if (/étape suivante|etape suivante|suivant|continue|continuer/.test(transcript)) {
        setVoiceIndex((index) => {
          const next = Math.min(index + 1, Math.max(0, tasks.length - 1));
          const task = tasks[next];
          speak(next === index ? "Vous êtes déjà à la dernière étape." : `Étape suivante. ${task?.title || ""}. ${task?.detail || ""}. ${task?.timer || ""}`);
          return next;
        });
      } else if (/étape précédente|etape precedente|précédent|precedent|retour/.test(transcript)) {
        setVoiceIndex((index) => {
          const previous = Math.max(0, index - 1);
          speak(previous === index ? "Vous êtes déjà à la première étape." : `Étape précédente. ${tasks[previous]?.title || ""}.`);
          return previous;
        });
      } else if (/répète|repete|répéter|repeter|redis/.test(transcript)) {
        speak(currentVoiceTaskRef.current ? `${currentVoiceTaskRef.current.title}. ${currentVoiceTaskRef.current.detail || ""}. ${currentVoiceTaskRef.current.timer || ""}` : "Aucune étape disponible.");
      } else if (/valide|valider|c'est fait|c est fait|terminé|termine/.test(transcript)) {
        if (currentVoiceTaskRef.current) {
          setChecked((previous) => ({ ...previous, [currentVoiceTaskRef.current!.id]: true }));
          speak(`Étape validée : ${currentVoiceTaskRef.current.title}. Dites étape suivante pour continuer.`);
        }
      } else if (/arrête|arrete|stop|désactive|desactive/.test(transcript)) {
        speak("J'arrête le mode mains libres.");
        stopVoiceMode();
      } else {
        speak("Commande non reconnue. Dites étape suivante, étape précédente, répète, valide ou arrête.");
      }
    };
    recognition.onerror = (event) => setVoiceStatus(event.error === "not-allowed" ? "Micro refusé : autorisez l'accès au micro dans votre navigateur." : `Reconnaissance vocale : ${event.error || "erreur"}`);
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        try { recognition.start(); } catch { /* arrêt ou redémarrage déjà en cours */ }
      }
    };
    recognitionRef.current = recognition;
    setVoiceIndex(0);
    setVoiceMode(true);
    setVoiceStatus("Micro activé — dites « étape suivante ».");
    speak(currentVoiceTask ? `Mode mains libres activé. Première étape : ${tasks[0]?.title || currentVoiceTask.title}. Dites étape suivante pour avancer, valide pour cocher, répète pour réécouter, ou arrête pour quitter.` : "Mode mains libres activé, mais aucune tâche n'est disponible.");
    try { recognition.start(); } catch { setVoiceStatus("Impossible de démarrer le micro. Réessayez."); }
  }

  useEffect(() => () => {
    recognitionRef.current?.stop();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const toggle = (id: string) => setChecked((previous) => ({ ...previous, [id]: !previous[id] }));

  function taskList(items: Task[]) {
    if (!items.length) return <p className="rounded-xl bg-[#F9F9F7] p-3 text-sm text-[#555551]">Aucune tâche disponible à partir des fiches de cette semaine.</p>;
    return <ul className="space-y-2">{items.map((task) => (
      <li key={task.id} className={checked[task.id] ? "rounded-xl border border-[#8FA89B]/40 bg-[#8FA89B]/10" : "rounded-xl border border-[#E9E9E4] bg-white"}>
        {task.group ? <p className="rounded-t-xl bg-[#E6DFD3] px-3 py-2 text-xs font-bold uppercase tracking-wide text-[#2B2B2B]">{task.group}</p> : null}
        <label className="flex cursor-pointer items-start gap-3 p-3">
          <input type="checkbox" className="mt-1 size-6 shrink-0 accent-[#8FA89B]" checked={Boolean(checked[task.id])} onChange={() => toggle(task.id)} />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ${kindStyle(`${task.title} ${task.detail || ""}`).classes}`}>{taskIcon(`${task.title} ${task.detail || ""}`)}</span>
              <span className={checked[task.id] ? "font-semibold text-[#668775] line-through" : "font-semibold text-[#2B2B2B]"}>{task.title}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${kindStyle(`${task.title} ${task.detail || ""}`).classes}`}><span aria-hidden="true" className="size-2 rounded-full bg-current" />{kindStyle(`${task.title} ${task.detail || ""}`).label}</span>
            </span>
            {task.timer ? <span className="mt-2 inline-flex rounded-lg bg-[#D98A6C]/15 px-3 py-1 text-sm font-extrabold text-[#8C4C34]">⏱ {task.timer}</span> : null}
            {task.detail ? <span className="mt-2 block text-sm leading-relaxed text-[#555551]">{task.detail}</span> : null}
          </span>
        </label>
      </li>
    ))}</ul>;
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-heading text-3xl">Batch Cooking</h1>
        <p className="mt-1 text-sm leading-relaxed text-[#2B2B2B]">Un fil conducteur en 3 sections pour préparer les bases prévues, cuisiner en parallèle et ranger chaque portion sereinement.</p>
      </header>
      <WeekPicker week={week} path="/batch" />
      {robotPriority ? <p className="rounded-xl border border-[#8FA89B] bg-[#8FA89B]/15 p-3 text-sm font-bold text-[#2B2B2B]">🤖 Monsieur Cuisine activé : les réglages indiqués dans les fiches sont affichés en priorité.</p> : null}

      <section aria-labelledby="handsfree-title" className="space-y-3 rounded-2xl border-2 border-[#8FA89B] bg-[#F4F7F2] p-4 shadow-sm">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#668775]">En cuisine, les mains dans les ingrédients ?</p>
          <h2 id="handsfree-title" className="font-heading text-xl font-extrabold text-[#1A1A1A]">🎙️ Mode mains libres</h2>
          <p className="mt-1 text-sm text-[#555551]">Dites « étape suivante » pour avancer sans toucher l'écran. Le navigateur demandera l'autorisation du micro.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!voiceMode ? <button type="button" onClick={startVoiceMode} className="rounded-xl bg-[#8FA89B] px-4 py-3 font-extrabold text-white shadow-sm">🎙️ Activer le mode mains libres</button> : <button type="button" onClick={stopVoiceMode} className="rounded-xl bg-[#D98A6C] px-4 py-3 font-extrabold text-white shadow-sm">⏹ Arrêter le mode vocal</button>}
          <button type="button" onClick={() => { setVoiceIndex((index) => { const next = Math.min(index + 1, Math.max(0, tasks.length - 1)); if (tasks[next]) speak(tasks[next].title); return next; }); }} className="rounded-xl border border-[#8FA89B] bg-white px-4 py-3 font-bold text-[#2B2B2B]">Étape suivante</button>
          <button type="button" onClick={() => speak(currentVoiceTask ? `${currentVoiceTask.title}. ${currentVoiceTask.detail || ""}. ${currentVoiceTask.timer || ""}` : "Aucune étape disponible.")} className="rounded-xl border border-[#8FA89B] bg-white px-4 py-3 font-bold text-[#2B2B2B]">🔊 Répéter</button>
        </div>
        <p aria-live="polite" className="rounded-xl bg-white p-3 text-sm font-semibold text-[#2B2B2B]">{voiceStatus}</p>
        {currentVoiceTask ? <div className="rounded-xl border border-[#8FA89B]/50 bg-white p-3"><p className="text-xs font-bold uppercase tracking-wide text-[#668775]">Étape vocale {Math.min(voiceIndex + 1, tasks.length)} / {tasks.length}</p><p className="mt-1 font-extrabold text-[#2B2B2B]">{currentVoiceTask.title}</p>{currentVoiceTask.timer ? <p className="mt-1 font-bold text-[#8C4C34]">{currentVoiceTask.timer}</p> : null}<p className="mt-1 text-sm text-[#555551]">{currentVoiceTask.detail || ""}</p></div> : null}
        <p className="text-xs leading-relaxed text-[#555551]">Commandes vocales : « étape suivante », « étape précédente », « répète », « valide » et « arrête ». Fonctionne avec les navigateurs compatibles avec la reconnaissance vocale, généralement Chrome ou Edge. Le mode vocal nécessite une autorisation micro et une connexion sécurisée (HTTPS).</p>
      </section>

      <section aria-labelledby="batch-dashboard" className="space-y-4 rounded-2xl border-2 border-[#8FA89B] bg-[#F4F7F2] p-4 shadow-sm">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#668775]">Section 1</p>
          <h2 id="batch-dashboard" className="font-heading text-xl font-extrabold text-[#1A1A1A]">⏱️ Le dashboard du temps</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white p-3"><p className="text-xs text-[#555551]">Temps total estimé</p><p className="mt-1 text-2xl font-extrabold text-[#2B2B2B]">{durationLabel(totalMinutes)}</p></div>
          <div className="rounded-xl bg-white p-3"><p className="text-xs text-[#555551]">Étapes validées</p><p className="mt-1 text-2xl font-extrabold text-[#2B2B2B]">{done}/{tasks.length}</p></div>
        </div>
        <div>
          <div className="mb-2 flex justify-between text-sm font-bold text-[#2B2B2B]"><span>Progression de la session</span><span>{progress}%</span></div>
          <div role="progressbar" aria-label="Progression du batch cooking" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-4 overflow-hidden rounded-full bg-white ring-1 ring-[#8FA89B]/50"><div className="h-full rounded-full bg-[#8FA89B] transition-all duration-300" style={{ width: `${progress}%` }} /></div>
          <p className="mt-2 text-xs text-[#555551]">La jauge progresse à chaque case cochée et conserve votre avancement pour cette semaine sur cet appareil.</p>
        </div>
      </section>

      <section aria-labelledby="batch-conductor" className="space-y-5 rounded-2xl border border-[#E9E9E4] bg-white p-4 shadow-sm">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-[#D98A6C]">Section 2</p>
          <h2 id="batch-conductor" className="font-heading text-xl font-extrabold text-[#1A1A1A]">🧑‍🍳 Le fil conducteur en parallèle</h2>
          <p className="mt-1 text-sm text-[#555551]">Suivez les étapes dans l'ordre. Les temps affichés viennent des fiches disponibles ; lorsqu'un temps manque, il est signalé plutôt qu'inventé.</p>
        </div>
        <div id="etape-decoupes" className="space-y-3">
          <div><h3 className="font-heading text-lg font-extrabold text-[#2B2B2B]">Étape 1 — Les découpes</h3><p className="text-sm text-[#555551]">Regroupez les découpes de la semaine avant de lancer les cuissons. Chaque élément a sa propre case.</p></div>
          {taskList(combinedPrepTasks)}
        </div>
        <div className="border-t border-[#E9E9E4] pt-4">
          <div className="mb-3"><h3 className="font-heading text-lg font-extrabold text-[#2B2B2B]">Étape 2 — Les cuissons multi-feux + timers</h3><p className="text-sm text-[#555551]">Lancez les cuissons compatibles en parallèle. Respectez les températures, durées et réglages écrits dans chaque fiche.</p></div>
          {taskList(combinedCookTasks)}
        </div>
        <div className="border-t border-[#E9E9E4] pt-4">
          <div className="mb-3"><h3 className="font-heading text-lg font-extrabold text-[#2B2B2B]">Étape 3 — L'assemblage / stockage</h3><p className="text-sm text-[#555551]">Répartissez les portions, fermez et étiquetez les contenants. Réfrigérateur : 3 jours maximum ; congelez les portions destinées à plus tard.</p></div>
          {taskList(combinedAssemblyTasks)}
        </div>
      </section>

      <section aria-labelledby="batch-victory" className="space-y-3 rounded-2xl border-2 border-[#D98A6C]/40 bg-[#F3C6B1]/30 p-4 shadow-sm">
        <p className="text-xs font-extrabold uppercase tracking-widest text-[#8C4C34]">Section 3</p>
        <h2 id="batch-victory" className="font-heading text-xl font-extrabold text-[#1A1A1A]">🏆 La victoire !</h2>
        {progress === 100 && tasks.length > 0 ? (
          <p className="text-base font-extrabold leading-relaxed text-[#2B2B2B]">Bravo ! Vous avez cuisiné pour toute la semaine et économisé {durationLabel(savedMinutes)} ! 🎉</p>
        ) : (
          <p className="text-base font-bold leading-relaxed text-[#2B2B2B]">Chaque case cochée vous rapproche de la victoire ! Il reste {tasks.length - done} étape(s) pour terminer votre session. Temps gagné estimé une fois la session terminée : {durationLabel(savedMinutes)}.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#2B2B2B]">Préparation groupée : {durationLabel(totalMinutes)}</span>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#2B2B2B]">Préparations séparées : {durationLabel(separateMinutes)}</span>
        </div>
        <p className="text-xs leading-relaxed text-[#555551]">Le gain est une estimation : temps de préparation additionnés, puis cuisson groupée estimée avec la cuisson la plus longue. Il dépend des recettes et des cuissons réellement compatibles.</p>
      </section>
      <section className="space-y-2 rounded-2xl border border-[#E9E9E4] bg-white p-4">
        <h2 className="font-heading text-lg font-extrabold text-[#2B2B2B]">Recettes utilisées pour cette session</h2>
        {recipes.length ? <ul className="space-y-2">{recipes.map(({ slot, recipe }) => <li key={`${slot.day}-${slot.meal}-${slot.recipeId}`} className="rounded-xl bg-[#F9F9F7] p-3"><p className="font-bold">{prettyDay(slot.day)} · {slot.meal} — {recipe!.name}</p><p className="mt-1 text-xs text-[#555551]">Préparation : {recipe!.timePrep || "non renseignée"} · Cuisson : {recipe!.timeCook || "non renseignée"}{recipe!.servings ? ` · ${recipe!.servings}` : ""}</p></li>)}</ul> : <p className="text-sm text-[#555551]">Aucune fiche repas disponible pour les bases prévues par le batch cooking de cette semaine. Aucune durée ni recette n'a été inventée.</p>}
      </section>
    </div>
  );
}
