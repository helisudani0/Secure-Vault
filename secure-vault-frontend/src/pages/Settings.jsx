import { Link, useNavigate } from "../router";
import { ArrowLeft, Copy, LogOut, Moon, ShieldCheck, Sun } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, isVaultUnlocked, lockVault } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();

  async function copyPublicKey() {
    await navigator.clipboard.writeText(user?.public_key || "");
    toast.success("Public key copied.");
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main className="app-main narrow">
      <Link className="back-link" to="/dashboard">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to dashboard
      </Link>

      <section className="page-header">
        <div>
          <p className="eyebrow">Preferences</p>
          <h1>Settings</h1>
          <p className="muted">Control security, appearance, and account-level actions.</p>
        </div>
      </section>

      <section className="settings-grid">
        <article className="panel">
          <h2>Appearance</h2>
          <p className="muted">Choose the interface mode that fits your workspace.</p>
          <button className="secondary-button" type="button" onClick={toggleTheme}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </button>
        </article>

        <article className="panel">
          <h2>Vault security</h2>
          <div className="status-title">
            <ShieldCheck size={18} aria-hidden="true" />
            <strong>{isVaultUnlocked ? "Unlocked in this browser session" : "Locked"}</strong>
          </div>
          <p className="muted">
            The decrypted private key is never persisted. Locking clears it from app memory.
          </p>
          <button className="secondary-button" type="button" onClick={lockVault} disabled={!isVaultUnlocked}>
            Lock vault
          </button>
        </article>

        <article className="panel wide">
          <h2>Public encryption key</h2>
          <p className="muted">Teammates use this key to share encrypted file keys with you.</p>
          <textarea className="mono-field" value={user?.public_key || ""} readOnly rows={5} />
          <button className="secondary-button" type="button" onClick={copyPublicKey}>
            <Copy size={18} aria-hidden="true" />
            Copy public key
          </button>
        </article>

        <article className="panel danger-panel wide">
          <h2>Session</h2>
          <p className="muted">Signing out clears tokens and the unlocked private key from this browser tab.</p>
          <button className="danger-button" type="button" onClick={handleLogout}>
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </button>
        </article>
      </section>
    </main>
  );
}
