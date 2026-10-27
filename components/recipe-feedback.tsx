"use client";

import { useEffect, useState, type FormEvent } from "react";

type CommentEntry = { id: string; text: string; createdAt: string };
const eventName = "cuisine-chic-ouf-feedback-change";
function ratingKey(recipeId: string) { return `cuisine-chic-ouf-rating-${recipeId}`; }
function commentsKey(recipeId: string) { return `cuisine-chic-ouf-comments-${recipeId}`; }
function readRating(recipeId: string) {
  try { const value = Number(localStorage.getItem(ratingKey(recipeId)) || 0); return Number.isInteger(value) && value >= 0 && value <= 5 ? value : 0; } catch { return 0; }
}
function readComments(recipeId: string): CommentEntry[] {
  try { const value = JSON.parse(localStorage.getItem(commentsKey(recipeId)) || "[]"); return Array.isArray(value) ? value.filter((item) => item && typeof item.text === "string" && typeof item.id === "string") : []; } catch { return []; }
}

export function RecipeFeedbackSummary({ recipeId }: { recipeId: string }) {
  const [rating, setRating] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  useEffect(() => {
    const refresh = () => { setRating(readRating(recipeId)); setCommentCount(readComments(recipeId).length); };
    refresh();
    window.addEventListener(eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(eventName, refresh); window.removeEventListener("storage", refresh); };
  }, [recipeId]);
  function setUserRating(value: number) {
    try { localStorage.setItem(ratingKey(recipeId), String(value)); setRating(value); window.dispatchEvent(new Event(eventName)); } catch {}
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1" aria-label={rating ? `Votre note : ${rating} sur 5 étoiles` : "Noter cette recette"}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => setUserRating(value)} aria-label={`Noter ${value} sur 5`} aria-pressed={rating === value} className="rounded px-0.5 text-2xl leading-none text-[#E8AD35] transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#668775]">
            {value <= rating ? "★" : "☆"}
          </button>
        ))}
        <span className="ml-1 text-xs text-muted-foreground">{rating ? "Votre note" : "À vous de noter"}</span>
      </div>
      <a href="#commentaires" className="inline-flex items-center gap-2 rounded-full border border-[#8FA89B]/50 bg-[#8FA89B]/10 px-4 py-2 text-sm font-semibold text-[#2B2B2B] transition hover:bg-[#8FA89B]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#668775]">
        💬 Commentaires ({commentCount}) <span aria-hidden="true">↓</span>
      </a>
    </div>
  );
}

export function RecipeComments({ recipeId }: { recipeId: string }) {
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    const refresh = () => setComments(readComments(recipeId));
    refresh();
    window.addEventListener(eventName, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(eventName, refresh); window.removeEventListener("storage", refresh); };
  }, [recipeId]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const next = [{ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, text, createdAt: new Date().toLocaleDateString("fr-FR") }, ...comments];
    try {
      localStorage.setItem(commentsKey(recipeId), JSON.stringify(next));
      setComments(next);
      setDraft("");
      window.dispatchEvent(new Event(eventName));
    } catch {}
  }
  function removeComment(id: string) {
    const next = comments.filter((comment) => comment.id !== id);
    try { localStorage.setItem(commentsKey(recipeId), JSON.stringify(next)); setComments(next); window.dispatchEvent(new Event(eventName)); } catch {}
  }
  return (
    <section id="commentaires" className="scroll-mt-6 space-y-4 border-t border-border pt-6" aria-labelledby="commentaires-title">
      <div className="space-y-1">
        <h2 id="commentaires-title" className="font-heading text-xl">💬 Commentaires sur cette recette</h2>
        <p className="text-sm text-muted-foreground">Partagez vos adaptations, vos astuces et vos retours après avoir cuisiné la recette.</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Votre commentaire</span>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1000} rows={3} placeholder="J’ai testé cette recette… Mon astuce…" className="w-full rounded-2xl border border-border bg-card p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#8FA89B]" />
        </label>
        <button type="submit" disabled={!draft.trim()} className="rounded-full bg-[#8FA89B] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">Publier mon commentaire</button>
      </form>
      {comments.length === 0 ? <p className="rounded-2xl border border-dashed border-[#8FA89B]/60 bg-[#8FA89B]/5 p-4 text-sm text-muted-foreground">Aucun commentaire pour le moment. Soyez la première personne à partager votre astuce !</p> : (
        <ul className="space-y-3">
          {comments.map((comment) => <li key={comment.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{comment.createdAt}</span><button type="button" onClick={() => removeComment(comment.id)} className="text-xs text-muted-foreground underline underline-offset-2">Supprimer</button></div>
            <p className="whitespace-pre-wrap break-words text-sm">{comment.text}</p>
          </li>)}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Les notes et commentaires sont enregistrés dans ce navigateur uniquement ; ils ne sont pas encore partagés entre plusieurs utilisateurs ou appareils.</p>
    </section>
  );
}
