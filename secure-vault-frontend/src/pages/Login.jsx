import { useState } from "react";
import { Link, useLocation, useNavigate } from "../router";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";

import { BRAND_NAME, BRAND_SHORT_COPY, BRAND_TAGLINE } from "../brand";
import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPasswords, setShowPasswords] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", masterPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label={BRAND_NAME}>
        <BrandLogo />
        <div className="auth-brand-copy">
          <p className="eyebrow">Private storage, polished for launch</p>
          <h1>{BRAND_NAME}</h1>
          <p>{BRAND_SHORT_COPY}</p>
        </div>
        <div className="trust-list" aria-label="Security highlights">
          <span>Any file type</span>
          <span>Auto-sorted vault folders</span>
          <span>Verified recovery email</span>
        </div>
      </section>

      <section className="auth-card" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2 id="login-title">Sign in to your encrypted workspace</h2>
          <p className="muted">{BRAND_TAGLINE} Use your account password to enter, then your vault password to unlock file actions.</p>
        </div>

        {error && <div className="form-alert">{error}</div>}

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Account password
            <div className="password-field">
              <input
                name="password"
                type={showPasswords ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={updateField}
                required
              />
              <button
                className="icon-button"
                type="button"
                onClick={() => setShowPasswords((current) => !current)}
                aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
              >
                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <Link className="inline-help-link" to="/forgot-password">
              Forgot account password?
            </Link>
          </label>

          <label>
            Vault password
            <input
              name="masterPassword"
              type={showPasswords ? "text" : "password"}
              autoComplete="off"
              value={form.masterPassword}
              onChange={updateField}
              placeholder="Optional, unlock after login if blank"
            />
          </label>

          <button className="primary-button full-width" type="submit" disabled={loading}>
            <LockKeyhole size={18} aria-hidden="true" />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          New to {BRAND_NAME}? <Link to="/signup">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
