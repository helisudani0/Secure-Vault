import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Database,
  Download,
  FileArchive,
  FileAudio2,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo2,
  FolderOpen,
  Lock,
  RefreshCcw,
  Search,
  Share2,
  ShieldCheck,
  Trash2,
  UploadCloud,
  Users,
  X,
} from "lucide-react";

import { getPublicKey } from "../api/auth";
import {
  deleteFile,
  downloadEncryptedFile,
  getWrappedKey,
  listFiles,
  shareFile,
  uploadEncryptedFile,
} from "../api/files";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { decryptFileBlob, encryptFileForUpload, rewrapFileKey } from "../utils/crypto";

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const CATEGORY_META = {
  all: { label: "All", icon: FolderOpen },
  photos: { label: "Photos", icon: FileImage },
  pdfs: { label: "PDFs", icon: FileText },
  documents: { label: "Docs", icon: FileText },
  spreadsheets: { label: "Sheets", icon: FileSpreadsheet },
  presentations: { label: "Slides", icon: FileText },
  archives: { label: "Archives", icon: FileArchive },
  videos: { label: "Video", icon: FileVideo2 },
  audio: { label: "Audio", icon: FileAudio2 },
  code: { label: "Code", icon: FileCode2 },
  other: { label: "Other", icon: Archive },
};

function categoryIcon(category, size = 20) {
  const Icon = CATEGORY_META[category]?.icon || FileText;
  return <Icon size={size} aria-hidden="true" />;
}

export default function Dashboard() {
  const fileInputRef = useRef(null);
  const { user, privateKey, isVaultUnlocked, unlockVault, lockVault, refreshUser } = useAuth();
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [shareTarget, setShareTarget] = useState(null);
  const [shareRecipient, setShareRecipient] = useState("");
  const [actionId, setActionId] = useState("");

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFiles();
      setFiles(data);
      await refreshUser();
    } catch (error) {
      toast.error(error.message || "Could not load files.");
    } finally {
      setLoading(false);
    }
  }, [refreshUser, toast]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const filteredFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return files
      .filter((file) => {
        if (filter === "owned" && !file.is_owner) return false;
        if (filter === "shared" && !file.is_shared) return false;
        if (!["all", "owned", "shared"].includes(filter) && file.category !== filter) return false;
        return (
          !normalizedQuery ||
          file.original_name.toLowerCase().includes(normalizedQuery) ||
          (file.category || "").toLowerCase().includes(normalizedQuery) ||
          (file.extension || "").toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((left, right) => {
        if (sort === "name") return left.original_name.localeCompare(right.original_name);
        if (sort === "size") return right.size - left.size;
        return new Date(right.uploaded_at) - new Date(left.uploaded_at);
      });
  }, [files, filter, query, sort]);

  const stats = useMemo(() => {
    const owned = files.filter((file) => file.is_owner);
    const shared = files.filter((file) => file.is_shared);
    const bytes = owned.reduce((total, file) => total + Number(file.size || 0), 0);
    return {
      total: files.length,
      owned: owned.length,
      shared: shared.length,
      bytes,
      categories: files.reduce((acc, file) => {
        acc[file.category || "other"] = (acc[file.category || "other"] || 0) + 1;
        return acc;
      }, {}),
    };
  }, [files]);

  async function handleUnlock(event) {
    event.preventDefault();
    try {
      await unlockVault(unlockPassword);
      setUnlockPassword("");
      toast.success("Vault unlocked for this session.");
    } catch {
      toast.error("Could not unlock vault. Check your vault password.");
    }
  }

  async function handleUpload(selectedFiles) {
    const selected = Array.from(selectedFiles || []);
    if (!selected.length) return;
    if (!user?.public_key) {
      toast.error("Your account is missing an encryption public key.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      for (let index = 0; index < selected.length; index += 1) {
        const file = selected[index];
        const encrypted = await encryptFileForUpload(file, user.public_key);
        await uploadEncryptedFile({
          encryptedBlob: encrypted.encryptedBlob,
          filename: file.name,
          wrappedKey: encrypted.wrappedKey,
          iv: encrypted.iv,
          onProgress: (event) => {
            const fileProgress = event.total ? event.loaded / event.total : 1;
            setUploadProgress(Math.round(((index + fileProgress) / selected.length) * 100));
          },
        });
      }

      toast.success(selected.length === 1 ? "File uploaded." : `${selected.length} files uploaded.`);
      await loadFiles();
    } catch (error) {
      toast.error(error.message || "Upload failed.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(file) {
    if (!privateKey) {
      toast.error("Unlock the vault before downloading files.");
      return;
    }

    setActionId(file.id);
    try {
      const encrypted = await downloadEncryptedFile(file.id);
      if (!encrypted.wrappedKey || !encrypted.iv) {
        throw new Error("Missing encryption metadata.");
      }
      const decrypted = await decryptFileBlob(
        encrypted.blob,
        encrypted.wrappedKey,
        encrypted.iv,
        privateKey
      );
      saveBlob(decrypted, file.original_name);
      toast.success("Download decrypted.");
    } catch (error) {
      toast.error(error.message || "Download failed.");
    } finally {
      setActionId("");
    }
  }

  async function handleDelete(file) {
    const confirmed = window.confirm(`Move "${file.original_name}" to trash?`);
    if (!confirmed) return;

    setActionId(file.id);
    try {
      await deleteFile(file.id);
      toast.success("File moved to trash.");
      await loadFiles();
    } catch (error) {
      toast.error(error.message || "Could not delete file.");
    } finally {
      setActionId("");
    }
  }

  async function handleShare(event) {
    event.preventDefault();
    if (!shareTarget || !shareRecipient.trim()) return;
    if (!privateKey) {
      toast.error("Unlock the vault before sharing files.");
      return;
    }

    setActionId(shareTarget.id);
    try {
      const [{ wrapped_key: ownerWrappedKey }, recipient] = await Promise.all([
        getWrappedKey(shareTarget.id),
        getPublicKey(shareRecipient.trim()),
      ]);
      const wrappedForRecipient = await rewrapFileKey(
        privateKey,
        ownerWrappedKey,
        recipient.public_key
      );
      await shareFile(shareTarget.id, recipient.username, wrappedForRecipient);
      toast.success(`Shared with ${recipient.username}.`);
      setShareTarget(null);
      setShareRecipient("");
      await loadFiles();
    } catch (error) {
      toast.error(error.message || "Sharing failed.");
    } finally {
      setActionId("");
    }
  }

  return (
    <main className="app-main dimensional-main">
      <section className="page-header">
        <div>
          <p className="eyebrow">Encrypted workspace</p>
          <h1>Your private command center</h1>
          <p className="muted">Upload any file type, let Privora sort it, and decrypt or share only when your vault is unlocked.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={loadFiles}>
            <RefreshCcw size={16} aria-hidden="true" />
            Refresh
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <UploadCloud size={18} aria-hidden="true" />
            {uploading ? `Uploading ${uploadProgress}%` : "Upload"}
          </button>
          <input
            ref={fileInputRef}
            className="visually-hidden"
            type="file"
            multiple
            onChange={(event) => handleUpload(event.target.files)}
          />
        </div>
      </section>

      <section className="collection-strip" aria-label="Vault collections">
        {Object.entries(CATEGORY_META)
          .filter(([key]) => key === "all" || stats.categories[key])
          .map(([key, meta]) => {
            const isActive = filter === key;
            const count = key === "all" ? stats.total : stats.categories[key] || 0;
            const Icon = meta.icon;
            return (
              <button
                className={`collection-tile ${isActive ? "active" : ""}`}
                type="button"
                key={key}
                onClick={() => setFilter(key)}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{meta.label}</span>
                <strong>{count}</strong>
              </button>
            );
          })}
      </section>

      <section className="stats-grid" aria-label="Vault summary">
        <StatCard icon={<FolderOpen />} label="Files" value={stats.total} />
        <StatCard icon={<Database />} label="Encrypted storage" value={formatBytes(user?.storage_used_bytes || stats.bytes)} />
        <StatCard icon={<ShieldCheck />} label="Owned" value={stats.owned} />
        <StatCard icon={<Users />} label="Shared with me" value={stats.shared} />
      </section>

      <section className={`vault-status ${isVaultUnlocked ? "unlocked" : ""}`}>
        <div>
          <div className="status-title">
            {isVaultUnlocked ? <ShieldCheck size={18} /> : <Lock size={18} />}
            <strong>{isVaultUnlocked ? "Vault unlocked" : "Vault locked"}</strong>
          </div>
          <p className="muted">
            {isVaultUnlocked
              ? "Private key is held only in browser memory for this session."
              : "Unlock to decrypt downloads and create secure shares."}
          </p>
        </div>
        {isVaultUnlocked ? (
          <button className="secondary-button" type="button" onClick={lockVault}>
            Lock vault
          </button>
        ) : (
          <form className="unlock-form" onSubmit={handleUnlock}>
            <input
              type="password"
              value={unlockPassword}
              onChange={(event) => setUnlockPassword(event.target.value)}
              placeholder="Vault password"
              autoComplete="off"
              required
            />
            <button className="primary-button" type="submit">Unlock</button>
          </form>
        )}
      </section>

      <section
        className="drop-zone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleUpload(event.dataTransfer.files);
        }}
      >
        <UploadCloud size={24} aria-hidden="true" />
        <div>
          <strong>Drop files here to encrypt and upload</strong>
          <p className="muted">Files are encrypted in your browser before upload.</p>
        </div>
      </section>

      <section className="toolbar" aria-label="File controls">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search files"
          />
        </label>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter files">
          <option value="all">All files</option>
          <option value="owned">Owned by me</option>
          <option value="shared">Shared with me</option>
          <option value="photos">Photos</option>
          <option value="pdfs">PDFs</option>
          <option value="documents">Documents</option>
          <option value="spreadsheets">Spreadsheets</option>
          <option value="presentations">Presentations</option>
          <option value="archives">Archives</option>
          <option value="videos">Video</option>
          <option value="audio">Audio</option>
          <option value="code">Code</option>
          <option value="other">Other</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort files">
          <option value="newest">Newest first</option>
          <option value="name">Name</option>
          <option value="size">Largest first</option>
        </select>
      </section>

      <section className="file-panel" aria-label="Files">
        {loading ? (
          <div className="skeleton-list">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="skeleton-row" key={index} />
            ))}
          </div>
        ) : filteredFiles.length ? (
          <div className="file-list">
            {filteredFiles.map((file) => (
              <article className="file-row" key={file.id}>
                <div className={`file-icon category-${file.category || "other"}`}>
                  {categoryIcon(file.category)}
                </div>
                <div className="file-meta">
                  <strong>{file.original_name}</strong>
                  <span>
                    <b>{CATEGORY_META[file.category]?.label || "Other"}</b> - {formatBytes(file.size)} -{" "}
                    {file.is_owner ? "Owned by you" : `Shared by ${file.owner_username}`} -{" "}
                    {new Date(file.uploaded_at).toLocaleString()}
                  </span>
                </div>
                <div className="file-actions">
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleDownload(file)}
                    disabled={actionId === file.id}
                    aria-label={`Download ${file.original_name}`}
                  >
                    <Download size={18} />
                  </button>
                  {file.is_owner && (
                    <>
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => setShareTarget(file)}
                        disabled={actionId === file.id}
                        aria-label={`Share ${file.original_name}`}
                      >
                        <Share2 size={18} />
                      </button>
                      <button
                        className="icon-button danger"
                        type="button"
                        onClick={() => handleDelete(file)}
                        disabled={actionId === file.id}
                        aria-label={`Delete ${file.original_name}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FolderOpen size={42} aria-hidden="true" />
            <h2>No files found</h2>
            <p>Upload your first encrypted file or adjust the current filters.</p>
            <button className="primary-button" type="button" onClick={() => fileInputRef.current?.click()}>
              Upload files
            </button>
          </div>
        )}
      </section>

      {shareTarget && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="share-title">
            <button
              className="icon-button modal-close"
              type="button"
              onClick={() => setShareTarget(null)}
              aria-label="Close share dialog"
            >
              <X size={18} />
            </button>
            <h2 id="share-title">Share file</h2>
            <p className="muted">{shareTarget.original_name}</p>
            <form className="form-stack" onSubmit={handleShare}>
              <label>
                Recipient username
                <input
                  value={shareRecipient}
                  onChange={(event) => setShareRecipient(event.target.value)}
                  placeholder="teammate_username"
                  required
                />
              </label>
              <button className="primary-button full-width" type="submit" disabled={actionId === shareTarget.id}>
                <Share2 size={18} aria-hidden="true" />
                {actionId === shareTarget.id ? "Sharing..." : "Create secure share"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <article className="stat-card">
      <div className="stat-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
