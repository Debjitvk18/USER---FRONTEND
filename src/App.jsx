import { useCallback, useEffect, useMemo, useState } from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left.mjs";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right.mjs";
import Heart from "lucide-react/dist/esm/icons/heart.mjs";
import Loader2 from "lucide-react/dist/esm/icons/loader-2.mjs";
import MessageSquarePlus from "lucide-react/dist/esm/icons/message-square-plus.mjs";
import Moon from "lucide-react/dist/esm/icons/moon.mjs";
import Send from "lucide-react/dist/esm/icons/send.mjs";
import Star from "lucide-react/dist/esm/icons/star.mjs";
import Sun from "lucide-react/dist/esm/icons/sun.mjs";
import X from "lucide-react/dist/esm/icons/x.mjs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const LIMIT = 10;

const initialForm = {
  name: "",
  feedback: "",
  rating: 5,
  improvementArea: "",
};

function initialsFromName(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function Stars({ value, interactive = false, onChange }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        const Icon = (
          <Star
            className={`h-5 w-5 ${active ? "text-[#fbbc04]" : "text-[var(--muted)]"}`}
            fill={active ? "currentColor" : "none"}
            strokeWidth={2}
          />
        );

        if (!interactive) {
          return <span key={star}>{Icon}</span>;
        }

        return (
          <button
            key={star}
            type="button"
            className="rounded-full p-1 transition hover:bg-[var(--soft)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]"
            onClick={() => onChange(star)}
            aria-label={`Set rating to ${star}`}
          >
            {Icon}
          </button>
        );
      })}
    </div>
  );
}

function FeedbackCard({ item, liked, onLike }) {
  return (
    <article className="feedback-card">
      <div className="flex items-start gap-4">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: item.avatarColor || "#4285F4" }}
          aria-hidden="true"
        >
          {initialsFromName(item.name) || "G"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="truncate text-base font-semibold text-[var(--text)]">{item.name}</h2>
              <p className="text-sm text-[var(--muted)]">{formatDate(item.createdAt)}</p>
            </div>
            <Stars value={item.rating} />
          </div>

          <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[var(--text)]">
            {item.feedback}
          </p>

          {item.improvementArea ? (
            <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-3 text-sm text-[var(--subtle)]">
              Improvement area: {item.improvementArea}
            </p>
          ) : null}

          <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
            <button
              type="button"
              onClick={() => onLike(item._id)}
              disabled={liked}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--blue)] ${
                liked
                  ? "bg-[var(--blue-soft)] text-[var(--blue)]"
                  : "bg-[var(--soft)] text-[var(--subtle)] hover:bg-[var(--blue-soft)] hover:text-[var(--blue)]"
              }`}
            >
              <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
              <span>{item.likes || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function FeedbackModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return null;
  }

  function closeModal() {
    setForm(initialForm);
    setError("");
    onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit feedback");
      }

      onCreated();
      closeModal();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6 backdrop-blur-sm">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5">
          <div>
            <h2 id="feedback-title" className="text-xl font-bold text-[var(--text)]">
              Give feedback
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Share what felt helpful or what can improve.</p>
          </div>
          <button type="button" className="icon-button" onClick={closeModal} aria-label="Close feedback form">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <label className="field-label">
            <span>Name</span>
            <input
              className="input-control"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              minLength={2}
              maxLength={60}
              required
              placeholder="Your name"
            />
          </label>

          <div className="field-label">
            <span>Stars</span>
            <Stars value={form.rating} interactive onChange={(rating) => updateField("rating", rating)} />
          </div>

          <label className="field-label">
            <span>Feedback</span>
            <textarea
              className="input-control min-h-32 resize-y"
              value={form.feedback}
              onChange={(event) => updateField("feedback", event.target.value)}
              minLength={5}
              maxLength={1000}
              required
              placeholder="Write your feedback"
            />
          </label>

          <label className="field-label">
            <span>Improvement area</span>
            <input
              className="input-control"
              value={form.improvementArea}
              onChange={(event) => updateField("improvementArea", event.target.value)}
              maxLength={250}
              placeholder="Optional"
            />
          </label>

          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

          <button type="submit" className="primary-button w-full justify-center" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>{saving ? "Submitting" : "Submit feedback"}</span>
          </button>
        </form>
      </section>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [likedIds, setLikedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("likedFeedbackIds") || "[]");
    } catch {
      return [];
    }
  });

  const likedSet = useMemo(() => new Set(likedIds), [likedIds]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/feedback?page=${page}&limit=${LIMIT}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load feedback");
      }

      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const request = Promise.resolve().then(loadFeedback);
    return () => {
      request.catch(() => {});
    };
  }, [loadFeedback]);

  async function handleLike(id) {
    if (likedSet.has(id)) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/feedback/${id}/like`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to like feedback");
      }

      setItems((current) => current.map((item) => (item._id === id ? data : item)));
      const nextLikedIds = [...likedIds, id];
      setLikedIds(nextLikedIds);
      localStorage.setItem("likedFeedbackIds", JSON.stringify(nextLikedIds));
    } catch (likeError) {
      setError(likeError.message);
    }
  }

  function handleCreated() {
    setPage(1);
    loadFeedback();
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <nav className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--nav)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="google-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <h1 className="truncate text-base font-bold tracking-wide sm:text-lg">CUSTOMER FEEDBACK</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="icon-button"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button type="button" className="primary-button" onClick={() => setModalOpen(true)}>
              <MessageSquarePlus className="h-4 w-4" />
              <span>Give feedback</span>
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--blue)]">{total} shared voices</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--text)] sm:text-4xl">Feedback feed</h2>
          </div>
          <div className="google-line" aria-hidden="true" />
        </div>

        {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        {loading ? (
          <div className="grid min-h-72 place-items-center rounded-2xl border border-[var(--line)] bg-[var(--card)]">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--blue)]" />
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => (
              <FeedbackCard key={item._id} item={item} liked={likedSet.has(item._id)} onLike={handleLike} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <MessageSquarePlus className="h-10 w-10 text-[var(--blue)]" />
            <h2 className="text-xl font-bold">No feedback yet</h2>
            <button type="button" className="primary-button" onClick={() => setModalOpen(true)}>
              <MessageSquarePlus className="h-4 w-4" />
              <span>Give feedback</span>
            </button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          <p className="text-sm font-semibold text-[var(--subtle)]">
            Page {page} of {totalPages}
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            disabled={page === totalPages || loading}
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <FeedbackModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
    </main>
  );
}
