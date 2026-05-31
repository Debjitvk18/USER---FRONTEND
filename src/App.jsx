import { useCallback, useEffect, useMemo, useState } from "react";
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left.mjs";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right.mjs";
import Heart from "lucide-react/dist/esm/icons/heart.mjs";
import FileUp from "lucide-react/dist/esm/icons/file-up.mjs";
import FileText from "lucide-react/dist/esm/icons/file-text.mjs";
import Loader2 from "lucide-react/dist/esm/icons/loader-2.mjs";
import MapPin from "lucide-react/dist/esm/icons/map-pin.mjs";
import MessageSquarePlus from "lucide-react/dist/esm/icons/message-square-plus.mjs";
import Moon from "lucide-react/dist/esm/icons/moon.mjs";
import Send from "lucide-react/dist/esm/icons/send.mjs";
import Star from "lucide-react/dist/esm/icons/star.mjs";
import Sun from "lucide-react/dist/esm/icons/sun.mjs";
import X from "lucide-react/dist/esm/icons/x.mjs";
import ArrowLeft from "lucide-react/dist/esm/icons/arrow-left.mjs";
import ExternalLink from "lucide-react/dist/esm/icons/external-link.mjs";
import Eye from "lucide-react/dist/esm/icons/eye.mjs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const LIMIT = 10;
const UPLOAD_LIMIT = 12;

const initialForm = { name: "", feedback: "", route: "", rating: 5, improvementArea: "" };
const initialUploadForm = { passengerName: "", route: "", documents: [] };

const googleColors = ["#4285F4", "#DB4437", "#F4B400", "#0F9D58"];
function colorFromName(name) {
  const total = [...name].reduce((s, c) => s + c.charCodeAt(0), 0);
  return googleColors[total % googleColors.length];
}

function initialsFromName(name) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function Stars({ value, interactive = false, onChange }) {
  return (
    <div className="flex items-center gap-1" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        const Icon = (
          <Star className={`h-5 w-5 ${active ? "text-[#fbbc04]" : "text-[var(--muted)]"}`} fill={active ? "currentColor" : "none"} strokeWidth={2} />
        );
        if (!interactive) return <span key={star}>{Icon}</span>;
        return (
          <button key={star} type="button" className="rounded-full p-1 transition hover:bg-[var(--soft)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]" onClick={() => onChange(star)} aria-label={`Set rating to ${star}`}>
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
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-sm" style={{ backgroundColor: item.avatarColor || "#4285F4" }} aria-hidden="true">
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
          <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[var(--text)]">{item.feedback}</p>
          {item.route ? (
            <p className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--soft)] px-4 py-2 text-sm font-semibold text-[var(--subtle)]">
              <MapPin className="h-4 w-4 shrink-0 text-[var(--blue)]" /><span className="min-w-0 truncate">{item.route}</span>
            </p>
          ) : null}
          {item.improvementArea ? (
            <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--soft)] px-4 py-3 text-sm text-[var(--subtle)]">Improvement area: {item.improvementArea}</p>
          ) : null}
          <div className="mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
            <button type="button" onClick={() => onLike(item._id)} disabled={liked} className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--blue)] ${liked ? "bg-[var(--blue-soft)] text-[var(--blue)]" : "bg-[var(--soft)] text-[var(--subtle)] hover:bg-[var(--blue-soft)] hover:text-[var(--blue)]"}`}>
              <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} /><span>{item.likes || 0}</span>
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
  if (!open) return null;
  function closeModal() { setForm(initialForm); setError(""); onClose(); }
  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to submit feedback");
      onCreated(); closeModal();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }
  function u(f, v) { setForm((c) => ({ ...c, [f]: v })); }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6 backdrop-blur-sm">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5">
          <div>
            <h2 id="feedback-title" className="text-xl font-bold text-[var(--text)]">Give feedback</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Share what felt helpful or what can improve.</p>
          </div>
          <button type="button" className="icon-button" onClick={closeModal} aria-label="Close feedback form"><X className="h-5 w-5" /></button>
        </div>
        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <label className="field-label"><span>Name</span><input className="input-control" value={form.name} onChange={(e) => u("name", e.target.value)} minLength={2} maxLength={60} required placeholder="Your name" /></label>
          <div className="field-label"><span>Stars</span><Stars value={form.rating} interactive onChange={(r) => u("rating", r)} /></div>
          <label className="field-label"><span>Route</span><input className="input-control" value={form.route} onChange={(e) => u("route", e.target.value)} maxLength={120} placeholder="Optional train route" /></label>
          <label className="field-label"><span>Feedback</span><textarea className="input-control min-h-32 resize-y" value={form.feedback} onChange={(e) => u("feedback", e.target.value)} minLength={5} maxLength={1000} required placeholder="Write your feedback" /></label>
          <label className="field-label"><span>Improvement area</span><input className="input-control" value={form.improvementArea} onChange={(e) => u("improvementArea", e.target.value)} maxLength={250} placeholder="Optional" /></label>
          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <button type="submit" className="primary-button w-full justify-center" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}<span>{saving ? "Submitting" : "Submit feedback"}</span>
          </button>
        </form>
      </section>
    </div>
  );
}

function FileUploadModal({ open, onClose, onUploaded }) {
  const [form, setForm] = useState(initialUploadForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;
  function closeModal() { setForm(initialUploadForm); setError(""); onClose(); }
  async function handleSubmit(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const formData = new FormData();
      formData.append("passengerName", form.passengerName);
      formData.append("contact", "");
      formData.append("route", form.route);
      formData.append("note", "");
      form.documents.forEach((file) => formData.append("documents", file));
      const response = await fetch(`${API_URL}/api/ticket-uploads`, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to upload files");
      onUploaded(data); closeModal();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6 backdrop-blur-sm">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="file-upload-title">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5">
          <div>
            <h2 id="file-upload-title" className="text-xl font-bold text-[var(--text)]">Upload your files</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Upload images or PDFs to share with everyone.</p>
          </div>
          <button type="button" className="icon-button" onClick={closeModal} aria-label="Close upload form"><X className="h-5 w-5" /></button>
        </div>
        <form className="space-y-5 px-6 py-6" onSubmit={handleSubmit}>
          <label className="field-label"><span>Your name</span>
            <input className="input-control" value={form.passengerName} onChange={(e) => setForm((c) => ({ ...c, passengerName: e.target.value }))} minLength={2} maxLength={80} required placeholder="Enter your name" />
          </label>
          <label className="field-label"><span>Route</span>
            <input className="input-control" value={form.route} onChange={(e) => setForm((c) => ({ ...c, route: e.target.value }))} maxLength={120} required placeholder="Enter route (e.g., Howrah → Mumbai)" />
          </label>
          <label className="field-label"><span>Upload files (Images or PDF)</span>
            <input className="file-control" type="file" accept="application/pdf,image/png,image/jpeg,image/webp,image/heic,image/heif" multiple onChange={(e) => setForm((c) => ({ ...c, documents: Array.from(e.target.files || []) }))} required />
          </label>
          {form.documents.length > 0 && (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--soft)] p-3">
              <p className="mb-2 text-xs font-bold text-[var(--muted)]">{form.documents.length} file(s) selected</p>
              {form.documents.map((f, i) => (
                <p key={i} className="truncate text-sm text-[var(--subtle)]">{f.name} · {formatBytes(f.size)}</p>
              ))}
            </div>
          )}
          {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <button type="submit" className="primary-button w-full justify-center" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}<span>{saving ? "Uploading…" : "Upload files"}</span>
          </button>
        </form>
      </section>
    </div>
  );
}

function UploadCard({ upload }) {
  const color = colorFromName(upload.passengerName || "User");
  const initials = initialsFromName(upload.passengerName || "User") || "U";
  return (
    <article className="upload-card">
      <div className="upload-card-header">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: color }} aria-hidden="true">{initials}</div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-[var(--text)]">{upload.passengerName}</h3>
          <p className="text-xs text-[var(--muted)]">{formatDate(upload.createdAt)}</p>
        </div>
      </div>
      {upload.route ? (
        <div className="px-4 pb-2">
          <p className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--soft)] px-3 py-1 text-xs font-semibold text-[var(--subtle)]">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--blue)]" />
            <span className="min-w-0 truncate">{upload.route}</span>
          </p>
        </div>
      ) : null}
      <div className="upload-card-files">
        {upload.files.map((file) => {
          const isImage = file.mimeType?.startsWith("image/");
          const fileUrl = file.secureUrl;
          return (
            <a key={file.publicId} className="upload-file-item" href={fileUrl} target="_blank" rel="noreferrer">
              {isImage ? (
                <img src={file.secureUrl} alt={file.originalName} className="upload-file-thumb" loading="lazy" />
              ) : (
                <div className="upload-file-pdf-thumb">
                  <FileText className="h-5 w-5 text-[var(--blue)]" />
                </div>
              )}
              <div className="upload-file-meta">
                <p className="truncate text-xs font-semibold text-[var(--text)]">{file.originalName}</p>
                <p className="text-xs text-[var(--muted)]">{formatBytes(file.bytes)}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" />
            </a>
          );
        })}
      </div>
    </article>
  );
}

function FilesFeedPage({ onBack }) {
  const [uploads, setUploads] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const loadUploads = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/ticket-uploads?page=${page}&limit=${UPLOAD_LIMIT}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load uploads");
      setUploads(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { loadUploads(); }, [loadUploads]);

  function handleUploaded() { setPage(1); loadUploads(); }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button type="button" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--blue)] transition hover:opacity-80" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /><span>Back to Feedback</span>
          </button>
          <p className="text-sm font-semibold text-[var(--blue)]">{total} uploaded files</p>
          <h2 className="mt-2 text-3xl font-bold text-[var(--text)] sm:text-4xl">Tickets & Payment History</h2>
        </div>
        <button type="button" className="primary-button" onClick={() => setUploadModalOpen(true)}>
          <FileUp className="h-4 w-4" /><span>Upload your files</span>
        </button>
      </div>
      <div className="google-line mb-6" aria-hidden="true" />

      {error ? <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="grid min-h-72 place-items-center rounded-2xl border border-[var(--line)] bg-[var(--card)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--blue)]" />
        </div>
      ) : uploads.length > 0 ? (
        <div className="uploads-grid">
          {uploads.map((upload) => <UploadCard key={upload._id} upload={upload} />)}
        </div>
      ) : (
        <div className="empty-state">
          <FileUp className="h-10 w-10 text-[var(--blue)]" />
          <h2 className="text-xl font-bold">No files uploaded yet</h2>
          <p className="text-sm text-[var(--muted)]">Be the first to upload your tickets and payment screenshots.</p>
          <button type="button" className="primary-button" onClick={() => setUploadModalOpen(true)}>
            <FileUp className="h-4 w-4" /><span>Upload your files</span>
          </button>
        </div>
      )}

      {!loading && uploads.length > 0 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" className="secondary-button" onClick={() => setPage((c) => Math.max(c - 1, 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" /><span>Previous</span>
          </button>
          <p className="text-sm font-semibold text-[var(--subtle)]">Page {page} of {totalPages}</p>
          <button type="button" className="secondary-button" onClick={() => setPage((c) => Math.min(c + 1, totalPages))} disabled={page === totalPages}>
            <span>Next</span><ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <FileUploadModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} onUploaded={handleUploaded} />
    </section>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [currentView, setCurrentView] = useState("feedback");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [likedIds, setLikedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("likedFeedbackIds") || "[]"); } catch { return []; }
  });

  const likedSet = useMemo(() => new Set(likedIds), [likedIds]);

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("theme", theme); }, [theme]);

  const loadFeedback = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/api/feedback?page=${page}&limit=${LIMIT}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load feedback");
      setItems(data.items || []); setTotalPages(data.totalPages || 1); setTotal(data.total || 0);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { if (currentView === "feedback") loadFeedback(); }, [loadFeedback, currentView]);

  async function handleLike(id) {
    if (likedSet.has(id)) return;
    try {
      const response = await fetch(`${API_URL}/api/feedback/${id}/like`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to like feedback");
      setItems((c) => c.map((item) => (item._id === id ? data : item)));
      const next = [...likedIds, id]; setLikedIds(next); localStorage.setItem("likedFeedbackIds", JSON.stringify(next));
    } catch (e) { setError(e.message); }
  }

  function handleCreated() { setPage(1); loadFeedback(); }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <nav className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--nav)]/90 backdrop-blur-xl">
        <div className="nav-shell mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="nav-brand flex min-w-0 items-center gap-3">
            <div className="google-mark" aria-hidden="true"><span /><span /><span /><span /></div>
            <h1 className="truncate text-base font-bold tracking-wide sm:text-lg">CUSTOMER FEEDBACK</h1>
          </div>
          <div className="nav-actions flex items-center gap-2">
            <button type="button" className="secondary-button nav-tickets-button" onClick={() => setCurrentView(currentView === "feedback" ? "files" : "feedback")}>
              <Eye className="h-4 w-4" />
              <span className="nav-tickets-full">{currentView === "feedback" ? "See Tickets & Payment History" : "Back to Feedback"}</span>
              <span className="nav-tickets-short">{currentView === "feedback" ? "Tickets" : "Feedback"}</span>
            </button>
            <button type="button" className="icon-button" onClick={() => setTheme((c) => (c === "dark" ? "light" : "dark"))} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {currentView === "feedback" && (
              <button type="button" className="primary-button" onClick={() => setModalOpen(true)}>
                <MessageSquarePlus className="h-4 w-4" /><span>Give feedback</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {currentView === "files" ? (
        <FilesFeedPage onBack={() => setCurrentView("feedback")} />
      ) : (
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
              {items.map((item) => <FeedbackCard key={item._id} item={item} liked={likedSet.has(item._id)} onLike={handleLike} />)}
            </div>
          ) : (
            <div className="empty-state">
              <MessageSquarePlus className="h-10 w-10 text-[var(--blue)]" />
              <h2 className="text-xl font-bold">No feedback yet</h2>
              <button type="button" className="primary-button" onClick={() => setModalOpen(true)}>
                <MessageSquarePlus className="h-4 w-4" /><span>Give feedback</span>
              </button>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button type="button" className="secondary-button" onClick={() => setPage((c) => Math.max(c - 1, 1))} disabled={page === 1 || loading}>
              <ChevronLeft className="h-4 w-4" /><span>Previous</span>
            </button>
            <p className="text-sm font-semibold text-[var(--subtle)]">Page {page} of {totalPages}</p>
            <button type="button" className="secondary-button" onClick={() => setPage((c) => Math.min(c + 1, totalPages))} disabled={page === totalPages || loading}>
              <span>Next</span><ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      )}

      <FeedbackModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
    </main>
  );
}
