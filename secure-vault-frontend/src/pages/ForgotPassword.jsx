import { useState } from "react";
import { ExternalLink, Mail, Send } from "lucide-react";

import { requestPasswordReset } from "../api/auth";
import { Link, useNavigate } from "../router";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
    setLoading(true);

    try {
      const response = await requestPasswordReset(email);
      setMessage(response.detail || "If the email is verified, a reset link has been sent.");
      if (response.reset_url) setResetUrl(response.reset_url);
    } catch (err) {
      setError(err.message || "Could not request password reset.");
    } finally {
      setLoading(false);
    }
  }

  function openResetLink() {
    if (!resetUrl) return;
    const url = new URL(resetUrl);
    navigate(`${url.pathname}${url.search}`);
  }

  return (
    <main className="center-screen">
      <section className="auth-card compact">
        <Mail size={42} aria-hidden="true" />
        <p className="eyebrow">Account recovery</p>
        <h1>Reset account password</h1>
        <p className="muted">
          Enter your verified email address. This resets only your sign-in password, not your vault password.
        </p>

        {error && <div className="form-alert">{error}</div>}
        {message && <div className="form-alert success-alert">{message}</div>}

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Verified email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <button className="primary-button full-width" type="submit" disabled={loading}>
            <Send size={18} aria-hidden="true" />
            {loading ? "Sending..." : "Send reset email"}
          </button>
        </form>

        {resetUrl && (
          <button className="secondary-button full-width" type="button" onClick={openResetLink}>
            <ExternalLink size={18} aria-hidden="true" />
            Open local reset link
          </button>
        )}

        <p className="auth-switch">
          Remembered it? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
