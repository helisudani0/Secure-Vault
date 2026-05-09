import { useEffect, useState } from "react";
import { Link, useNavigate } from "../router";
import { ArrowLeft, ExternalLink, MailCheck, Save, Send, UserRound } from "lucide-react";

import { getStorageUsage, requestEmailVerification } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, saveProfile, refreshUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({
    email: user?.email || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
  });
  const [storage, setStorage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState("");

  useEffect(() => {
    getStorageUsage().then(setStorage).catch(() => setStorage(null));
  }, []);

  function updateField(event) {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await saveProfile(profile);
      setVerificationUrl("");
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestVerification() {
    if (!profile.email.trim()) {
      toast.error("Add an email address first.");
      return;
    }

    setSendingVerification(true);
    try {
      const response = await requestEmailVerification();
      await refreshUser();
      if (response.verification_url) {
        setVerificationUrl(response.verification_url);
        toast.info("Development verification link generated.");
      } else {
        toast.success("Verification email sent. Check your inbox.");
      }
    } catch (error) {
      toast.error(error.message || "Could not send verification email.");
    } finally {
      setSendingVerification(false);
    }
  }

  function openVerificationLink() {
    if (!verificationUrl) return;
    const url = new URL(verificationUrl);
    navigate(`${url.pathname}${url.search}`);
  }

  return (
    <main className="app-main narrow">
      <Link className="back-link" to="/dashboard">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to dashboard
      </Link>

      <section className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
          <p className="muted">Manage the identity attached to your encrypted vault.</p>
        </div>
        <div className="avatar" aria-hidden="true">
          <UserRound size={30} />
        </div>
      </section>

      <section className="settings-grid">
        <form className="panel form-stack" onSubmit={handleSubmit}>
          <h2>Profile details</h2>
          <label>
            Username
            <input value={user?.username || ""} disabled />
          </label>
          <label>
            Email
            <input name="email" type="email" value={profile.email} onChange={updateField} />
          </label>
          <div className="form-grid two">
            <label>
              First name
              <input name="first_name" value={profile.first_name} onChange={updateField} />
            </label>
            <label>
              Last name
              <input name="last_name" value={profile.last_name} onChange={updateField} />
            </label>
          </div>
          <button className="primary-button" type="submit" disabled={saving}>
            <Save size={18} aria-hidden="true" />
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>

        <aside className="panel">
          <h2>Storage</h2>
          <p className="metric">{formatBytes(storage?.storage_used_bytes || user?.storage_used_bytes || 0)}</p>
          <p className="muted">of {formatBytes(storage?.max_storage_bytes || user?.max_storage_bytes || 0)} available</p>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${Math.min(storage?.usage_percent || 0, 100)}%` }} />
          </div>
          <div className={`verification-card ${user?.email_verified ? "verified" : ""}`}>
            <div className="status-title">
              <MailCheck size={18} aria-hidden="true" />
              <strong>Email {user?.email_verified ? "verified" : "not verified"}</strong>
            </div>
            <p className="muted small">
              {user?.email
                ? user.email_verified
                  ? "This email can be trusted for account recovery and security notices."
                  : "Verify this email before relying on password recovery."
                : "Add an email address to enable account recovery notices."}
            </p>
            {!user?.email_verified && (
              <button
                className="secondary-button"
                type="button"
                onClick={handleRequestVerification}
                disabled={sendingVerification || !profile.email.trim()}
              >
                <Send size={16} aria-hidden="true" />
                {sendingVerification ? "Sending..." : "Send verification email"}
              </button>
            )}
            {verificationUrl && (
              <button className="primary-button" type="button" onClick={openVerificationLink}>
                <ExternalLink size={16} aria-hidden="true" />
                Open local verification link
              </button>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
