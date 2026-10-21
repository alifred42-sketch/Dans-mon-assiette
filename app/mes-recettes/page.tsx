"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Camera, Link2, Pencil, Plus, Trash2, UtensilsCrossed, X } from "lucide-react";

type MyRecipe = {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  prepTime: string;
  cookTime: string;
  servings: string;
  sourceUrl: string;
  photos: string[];
  updatedAt: number;
};

type RecipeMode = "manual" | "link";
const STORAGE_KEY = "cuisine-chic-ouf-mes-recettes-v1";
const emptyForm = { title: "", description: "", ingredients: "", steps: "", prepTime: "", cookTime: "", servings: "4", sourceUrl: "" };
const fieldClass = "mt-1.5 min-h-12 w-full rounded-xl border border-[#deded6] bg-white px-3 py-2.5 text-base outline-none focus:border-[#668775] focus:ring-2 focus:ring-[#8FA89B]/25";

function lines(value: string) { return value.split("\n").map((line) => line.trim()).filter(Boolean); }

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("cuisine-chic-ouf-images", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("photos");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function shrinkPhoto(file: File): Promise<string> {
  const source = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}

export default function MesRecettesPage() {
  const [recipes, setRecipes] = useState<MyRecipe[]>([]);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<RecipeMode | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { setRecipes(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); } catch { setRecipes([]); }
    setReady(true);
  }, []);

  function persist(next: MyRecipe[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setRecipes(next);
      setMessage("");
      return true;
    } catch {
      setMessage("Le stockage de cet appareil est plein. Essaie avec des photos plus petites.");
      return false;
    }
  }

  function begin(nextMode: RecipeMode) {
    setMode(nextMode);
    setEditingId(null);
    setForm(emptyForm);
    setPhotos([]);
    setMessage("");
  }

  function edit(recipe: MyRecipe) {
    setMode(recipe.sourceUrl ? "link" : "manual");
    setEditingId(recipe.id);
    setForm({ title: recipe.title, description: recipe.description, ingredients: recipe.ingredients.join("\n"), steps: recipe.steps.join("\n"), prepTime: recipe.prepTime, cookTime: recipe.cookTime, servings: recipe.servings, sourceUrl: recipe.sourceUrl });
    setPhotos(recipe.photos);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function addPhotos(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []).slice(0, Math.max(0, 4 - photos.length));
    try {
      const added = await Promise.all(files.map(shrinkPhoto));
      setPhotos((current) => [...current, ...added].slice(0, 4));
      setMessage("");
    } catch { setMessage("Cette photo n’a pas pu être ajoutée. Essaie un autre format d’image."); }
    event.target.value = "";
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) { setMessage("Ajoute au moins le nom de la recette."); return; }
    let sourceUrl = form.sourceUrl.trim();
    if (sourceUrl) {
      try { const parsed = new URL(sourceUrl); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(); sourceUrl = parsed.toString(); }
      catch { setMessage("Vérifie le lien : il doit commencer par https:// ou http://."); return; }
    }
    const recipe: MyRecipe = { id: editingId || `ma-recette-${Date.now()}`, title, description: form.description.trim(), ingredients: lines(form.ingredients), steps: lines(form.steps), prepTime: form.prepTime.trim(), cookTime: form.cookTime.trim(), servings: form.servings.trim(), sourceUrl, photos, updatedAt: Date.now() };
    const next = editingId ? recipes.map((item) => item.id === editingId ? recipe : item) : [recipe, ...recipes];
    if (persist(next)) { setMode(null); setEditingId(null); setForm(emptyForm); setPhotos([]); }
  }

  function remove(id: string) {
    if (!window.confirm("Supprimer cette recette de cet appareil ?")) return;
    persist(recipes.filter((recipe) => recipe.id !== id));
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#668775]">Votre collection personnelle</p>
        <h1 className="font-heading text-3xl">Mes recettes</h1>
        <p className="text-sm leading-relaxed text-[#555551]">Crée tes fiches avec tes photos, tes ingrédients et tes étapes, ou garde le lien d’une recette ou d’une vidéo pour la retrouver ici.</p>
      </header>

      {!mode ? <section className="grid gap-3 sm:grid-cols-2" aria-label="Ajouter une recette">
        <button onClick={() => begin("manual")} className="flex min-h-28 flex-col items-start justify-between rounded-2xl bg-[#D0DBCE] p-4 text-left shadow-sm transition hover:shadow-md">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/70"><Plus className="size-6" /></span>
          <span><strong className="block text-base">Créer ma recette</strong><span className="text-sm">Ajouter texte et photos</span></span>
        </button>
        <button onClick={() => begin("link")} className="flex min-h-28 flex-col items-start justify-between rounded-2xl bg-[#F4EAD4] p-4 text-left shadow-sm transition hover:shadow-md">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/70"><Link2 className="size-5" /></span>
          <span><strong className="block text-base">Ajouter depuis un lien ou une vidéo</strong><span className="text-sm">Facebook, Instagram, YouTube…</span></span>
        </button>
      </section> : <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div><p className="text-sm font-bold text-[#668775]">{editingId ? "Modifier ma fiche" : mode === "link" ? "Garder une recette trouvée en ligne" : "Créer une fiche personnelle"}</p><h2 className="mt-1 font-heading text-xl">{mode === "link" ? "Recette ou vidéo" : "Nouvelle recette"}</h2></div>
          <button type="button" onClick={() => setMode(null)} aria-label="Fermer le formulaire" className="flex size-10 items-center justify-center rounded-full bg-[#F3F3EF]"><X className="size-5" /></button>
        </div>
        {mode === "link" ? <div className="mb-5 rounded-xl bg-[#F9F6EC] p-3 text-sm leading-relaxed text-[#555551]">Colle le lien, puis note les ingrédients et les étapes que tu vois dans la publication. Facebook et certaines plateformes bloquent la lecture automatique : le lien sera conservé, et tu peux l’ouvrir pour consulter la recette.</div> : null}
        <form onSubmit={save} className="space-y-4">
          {mode === "link" ? <label className="block text-sm font-semibold">Lien de la recette, de la publication ou de la vidéo<input type="url" inputMode="url" autoCapitalize="none" placeholder="https://…" value={form.sourceUrl} onChange={(event) => setForm({ ...form, sourceUrl: event.target.value })} className={fieldClass} />{form.sourceUrl.trim() ? <a href={form.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-[#668775] underline">Ouvrir le lien dans un nouvel onglet <ArrowUpRight className="size-4" /></a> : null}</label> : null}
          <label className="block text-sm font-semibold">Nom de la recette<input required maxLength={100} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ex. Le gâteau au chocolat de mamie" className={fieldClass} /></label>
          <label className="block text-sm font-semibold">Description<textarea rows={3} maxLength={700} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="L’histoire du plat, une astuce ou ce que tu aimes…" className={fieldClass} /></label>
          <label className="block text-sm font-semibold">Ingrédients et quantités<textarea rows={5} value={form.ingredients} onChange={(event) => setForm({ ...form, ingredients: event.target.value })} placeholder={"1 oignon\n200 g de…\n2 cuillères à soupe de…"} className={fieldClass} /><span className="mt-1 block text-xs font-normal text-[#777773]">Une ligne par ingrédient.</span></label>
          <label className="block text-sm font-semibold">Étapes de préparation<textarea rows={5} value={form.steps} onChange={(event) => setForm({ ...form, steps: event.target.value })} placeholder={"Éplucher et couper…\nFaire revenir…\nServir chaud."} className={fieldClass} /><span className="mt-1 block text-xs font-normal text-[#777773]">Une étape par ligne.</span></label>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-sm font-semibold">Préparation<input value={form.prepTime} onChange={(event) => setForm({ ...form, prepTime: event.target.value })} placeholder="15 min" className={fieldClass} /></label>
            <label className="text-sm font-semibold">Cuisson<input value={form.cookTime} onChange={(event) => setForm({ ...form, cookTime: event.target.value })} placeholder="30 min" className={fieldClass} /></label>
            <label className="text-sm font-semibold">Personnes<input inputMode="numeric" value={form.servings} onChange={(event) => setForm({ ...form, servings: event.target.value })} placeholder="4" className={fieldClass} /></label>
          </div>
          <div>
            <span className="block text-sm font-semibold">Photos de la recette <span className="font-normal text-[#777773]">(jusqu’à 4)</span></span>
            <input ref={photoInput} type="file" accept="image/*" multiple onChange={addPhotos} className="sr-only" aria-label="Choisir des photos" />
            <button type="button" disabled={photos.length >= 4} onClick={() => photoInput.current?.click()} className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-xl border border-dashed border-[#8FA89B] px-4 text-sm font-semibold text-[#4F705C] disabled:opacity-50"><Camera className="size-5" /> Ajouter une photo</button>
            {photos.length ? <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{photos.map((photo, index) => <div key={`${photo.slice(0, 24)}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-[#F3F3EF]"><img src={photo} alt={`Photo ${index + 1} de la recette`} className="size-full object-cover" /><button type="button" onClick={() => setPhotos(photos.filter((_, photoIndex) => photoIndex !== index))} aria-label={`Retirer la photo ${index + 1}`} className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-full bg-white/90"><X className="size-4" /></button></div>)}</div> : null}
          </div>
          {message ? <p role="alert" className="rounded-lg bg-[#FAD2CB]/50 p-3 text-sm font-medium">{message}</p> : null}
          <div className="flex flex-wrap gap-2 pt-1"><button type="submit" disabled={!ready} className="min-h-12 rounded-xl bg-[#668775] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#547460]">{editingId ? "Enregistrer les changements" : "Enregistrer ma recette"}</button><button type="button" onClick={() => setMode(null)} className="min-h-12 rounded-xl px-4 text-sm font-semibold text-[#555551]">Annuler</button></div>
        </form>
      </section>}

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-heading text-xl">Mes fiches personnelles</h2><span className="text-sm text-[#777773]">{recipes.length}</span></div>
        {!recipes.length ? <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5"><UtensilsCrossed className="mx-auto size-8 text-[#8FA89B]" /><p className="mt-2 text-sm text-[#555551]">Tes recettes ajoutées apparaîtront ici, uniquement sur cet appareil.</p></div> : <ul className="space-y-3">{recipes.map((recipe) => <li key={recipe.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          {recipe.photos[0] ? <img src={recipe.photos[0]} alt={`Photo de ${recipe.title}`} className="max-h-64 w-full object-cover" /> : null}
          <article className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-heading text-lg leading-tight">{recipe.title}</h3>{recipe.description ? <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#555551]">{recipe.description}</p> : null}<p className="mt-2 text-xs text-[#777773]">{[recipe.prepTime && `Préparation ${recipe.prepTime}`, recipe.cookTime && `Cuisson ${recipe.cookTime}`, recipe.servings && `${recipe.servings} personne(s)`].filter(Boolean).join(" · ") || "Fiche personnelle"}</p></div><div className="flex shrink-0 gap-1"><button type="button" onClick={() => edit(recipe)} aria-label={`Modifier ${recipe.title}`} className="flex size-10 items-center justify-center rounded-xl bg-[#F3F3EF]"><Pencil className="size-4" /></button><button type="button" onClick={() => remove(recipe.id)} aria-label={`Supprimer ${recipe.title}`} className="flex size-10 items-center justify-center rounded-xl bg-[#FAD2CB]/40 text-[#7C3A35]"><Trash2 className="size-4" /></button></div></div>
            {recipe.photos.length > 1 ? <div className="grid grid-cols-3 gap-2">{recipe.photos.slice(1).map((photo, index) => <img key={index} src={photo} alt={`Photo ${index + 2} de ${recipe.title}`} className="aspect-square w-full rounded-xl object-cover" />)}</div> : null}
            {recipe.ingredients.length ? <div><h4 className="text-sm font-bold">Ingrédients{recipe.servings ? ` · ${recipe.servings} personne(s)` : ""}</h4><ul className="mt-1 list-inside list-disc space-y-1 text-sm text-[#555551]">{recipe.ingredients.map((item, index) => <li key={index}>{item}</li>)}</ul></div> : null}
            {recipe.steps.length ? <div><h4 className="text-sm font-bold">Préparation</h4><ol className="mt-1 list-inside list-decimal space-y-1 text-sm leading-relaxed text-[#555551]">{recipe.steps.map((item, index) => <li key={index}>{item}</li>)}</ol></div> : null}
            {recipe.sourceUrl ? <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-semibold text-[#668775] underline">Voir la publication ou la vidéo <ArrowUpRight className="size-4" /></a> : null}
          </article>
        </li>)}</ul>}
      </section>
      <p className="text-center text-xs leading-relaxed text-[#777773]">Pour l’instant, tes fiches et tes photos sont enregistrées dans le navigateur de cet appareil. Elles ne sont pas partagées entre plusieurs téléphones.</p>
    </div>
  );
}

