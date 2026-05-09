import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Plus,
  RefreshCcw,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  createPasswordEntry,
  deletePasswordEntry,
  listPasswordEntries,
  updatePasswordEntry,
} from "../api/passwords";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { decryptVaultPayload, encryptVaultPayload } from "../utils/crypto";

const initialForm = {
  title: "",
  website_url: "",
  loginUsername: "",
  password: "",
  notes: "",
};

function generatePassword(length = 20) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+";
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join("");
}

export default function Passwords() {
  const { user, privateKey, isVaultUnlocked } = useAuth();
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [busyId, setBusyId] = useState("");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      setEntries(await listPasswordEntries());
    } catch (error) {
      toast.error(error.message || "Could not load password entries.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (!normalized) return true;
      return (
        entry.title.toLowerCase().includes(normalized) ||
        (entry.website_url || "").toLowerCase().includes(normalized)
      );
    });
  }, [entries, query]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function saveEntry(event) {
    event.preventDefault();
    if (!user?.public_key) {
      toast.error("Your account is missing an encryption public key.");
      return;
    }

    setSaving(true);
    try {
      const encrypted = await encryptVaultPayload(
        {
          username: form.loginUsername,
          password: form.password,
          notes: form.notes,
        },
        user.public_key
      );
      await createPasswordEntry({
        title: form.title,
        website_url: form.website_url,
        encrypted_payload: encrypted.encryptedPayload,
        wrapped_key: encrypted.wrappedKey,
        iv: encrypted.iv,
      });
      toast.success("Password saved to vault.");
      setForm(initialForm);
      setModalOpen(false);
      await loadEntries();
    } catch (error) {
      toast.error(error.message || "Could not save password.");
    } finally {
      setSaving(false);
    }
  }

  async function revealEntry(entry) {
    if (revealed[entry.id]) {
      setRevealed((current) => {
        const next = { ...current };
        delete next[entry.id];
        return next;
      });
      return;
    }
    if (!privateKey) {
      toast.error("Unlock the vault before revealing passwords.");
      return;
    }

    setBusyId(entry.id);
    try {
      const payload = await decryptVaultPayload(entry, privateKey);
      setRevealed((current) => ({ ...current, [entry.id]: payload }));
    } catch (error) {
      toast.error(error.message || "Could not decrypt password entry.");
    } finally {
      setBusyId("");
    }
  }

  async function copyValue(value, label) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied.`);
  }

  async function toggleFavorite(entry) {
    setBusyId(entry.id);
    try {
      await updatePasswordEntry(entry.id, { ...entry, favorite: !entry.favorite });
      await loadEntries();
    } catch (error) {
      toast.error(error.message || "Could not update password entry.");
    } finally {
      setBusyId("");
    }
  }

  async function removeEntry(entry) {
    const confirmed = window.confirm(`Delete "${entry.title}" from the password locker?`);
    if (!confirmed) return;

    setBusyId(entry.id);
    try {
      await deletePasswordEntry(entry.id);
      toast.success("Password entry deleted.");
      await loadEntries();
    } catch (error) {
      toast.error(error.message || "Could not delete password entry.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className="app-main dimensional-main">
      <section className="page-header">
        <div>
          <p className="eyebrow">Encrypted password locker</p>
          <h1>Passwords</h1>
          <p className="muted">
            Store website logins inside the same browser-encrypted vault. Passwords stay hidden until the vault is unlocked.
          </p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={loadEntries}>
            <RefreshCcw size={16} aria-hidden="true" />
            Refresh
          </button>
          <button className="primary-button" type="button" onClick={() => setModalOpen(true)}>
            <Plus size={18} aria-hidden="true" />
            Add password
          </button>
        </div>
      </section>

      <section className={`vault-status ${isVaultUnlocked ? "unlocked" : ""}`}>
        <div className="status-title">
          <KeyRound size={18} aria-hidden="true" />
          <strong>{isVaultUnlocked ? "Password locker ready" : "Unlock vault to reveal saved passwords"}</strong>
        </div>
        <p className="muted">Titles and websites help you search. Usernames, passwords, and notes are encrypted.</p>
      </section>

      <section className="toolbar" aria-label="Password controls">
        <label className="search-box">
          <KeyRound size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search websites and logins"
          />
        </label>
      </section>

      <section className="file-panel" aria-label="Password entries">
        {loading ? (
          <div className="skeleton-list">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="skeleton-row" key={index} />
            ))}
          </div>
        ) : filteredEntries.length ? (
          <div className="file-list">
            {filteredEntries.map((entry) => {
              const payload = revealed[entry.id];
              return (
                <article className="file-row password-row" key={entry.id}>
                  <div className="file-icon category-code">
                    <KeyRound size={20} aria-hidden="true" />
                  </div>
                  <div className="file-meta">
                    <strong>{entry.title}</strong>
                    <span>
                      <b>{entry.website_url || "No website"}</b> - Updated {new Date(entry.updated_at).toLocaleString()}
                    </span>
                    {payload && (
                      <div className="password-reveal">
                        <span>{payload.username || "No username"}</span>
                        <code>{payload.password}</code>
                      </div>
                    )}
                  </div>
                  <div className="file-actions">
                    {payload?.username && (
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => copyValue(payload.username, "Username")}
                        aria-label={`Copy username for ${entry.title}`}
                      >
                        <Copy size={18} />
                      </button>
                    )}
                    {payload?.password && (
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => copyValue(payload.password, "Password")}
                        aria-label={`Copy password for ${entry.title}`}
                      >
                        <Copy size={18} />
                      </button>
                    )}
                    {entry.website_url && (
                      <a className="icon-button" href={entry.website_url} target="_blank" rel="noreferrer" aria-label={`Open ${entry.title}`}>
                        <Globe2 size={18} />
                      </a>
                    )}
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => revealEntry(entry)}
                      disabled={busyId === entry.id}
                      aria-label={payload ? `Hide ${entry.title}` : `Reveal ${entry.title}`}
                    >
                      {payload ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => toggleFavorite(entry)}
                      disabled={busyId === entry.id}
                      aria-label={`${entry.favorite ? "Unfavorite" : "Favorite"} ${entry.title}`}
                    >
                      <Star size={18} fill={entry.favorite ? "currentColor" : "none"} />
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => removeEntry(entry)}
                      disabled={busyId === entry.id}
                      aria-label={`Delete ${entry.title}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Sparkles size={42} aria-hidden="true" />
            <h2>No passwords yet</h2>
            <p>Create your first encrypted login entry.</p>
            <button className="primary-button" type="button" onClick={() => setModalOpen(true)}>
              Add password
            </button>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
            <button
              className="icon-button modal-close"
              type="button"
              onClick={() => setModalOpen(false)}
              aria-label="Close password dialog"
            >
              <X size={18} />
            </button>
            <h2 id="password-modal-title">Add password</h2>
            <form className="form-stack" onSubmit={saveEntry}>
              <label>
                Title
                <input name="title" value={form.title} onChange={updateField} placeholder="GitHub" required />
              </label>
              <label>
                Website
                <input
                  name="website_url"
                  type="url"
                  value={form.website_url}
                  onChange={updateField}
                  placeholder="https://example.com"
                />
              </label>
              <label>
                Username or email
                <input name="loginUsername" value={form.loginUsername} onChange={updateField} autoComplete="off" />
              </label>
              <label>
                Password
                <div className="password-field">
                  <input
                    name="password"
                    type="text"
                    value={form.password}
                    onChange={updateField}
                    autoComplete="off"
                    required
                  />
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, password: generatePassword() }))}
                    aria-label="Generate password"
                  >
                    <Sparkles size={18} />
                  </button>
                </div>
              </label>
              <label>
                Notes
                <textarea name="notes" value={form.notes} onChange={updateField} rows={3} />
              </label>
              <button className="primary-button full-width" type="submit" disabled={saving}>
                <KeyRound size={18} aria-hidden="true" />
                {saving ? "Encrypting..." : "Save encrypted password"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
