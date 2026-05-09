import { useMemo, useState } from "react";
import { Link, useNavigate } from "../router";
import { KeyRound } from "lucide-react";

import { BRAND_NAME } from "../brand";
import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";

function getStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    masterPassword: "",
    confirmMasterPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const masterStrength = useMemo(() => getStrength(form.masterPassword), [form.masterPassword]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Account passwords do not match.");
      return;
    }
    if (form.masterPassword !== form.confirmMasterPassword) {
      setError("Vault passwords do not match.");
      return;
    }
    if (form.masterPassword.length < 12) {
      setError("Vault password must be at least 12 characters.");
      return;
    }

    setLoading(true);
    try {
      await signup({
        username: form.username,
        email: form.email,
        password: form.password,
        masterPassword: form.masterPassword,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label={`${BRAND_NAME} account creation`}>
        <BrandLogo />
        <div className="auth-brand-copy">
          <p className="eyebrow">Create the key before the vault</p>
          <h1>{BRAND_NAME}</h1>
          <p>Your browser creates your encryption keys. The server stores only the public key and encrypted private key.</p>
        </div>
        <div className="trust-list" aria-label="Signup highlights">
          <span>Zero-knowledge by design</span>
          <span>No vault password sent to server</span>
          <span>Auto-organized encrypted files</span>
        </div>
      </section>

      <section className="auth-card" aria-labelledby="signup-title">
        <div>
          <p className="eyebrow">Start private</p>
          <h2 id="signup-title">Create your vault</h2>
          <p className="muted">Keep your vault password somewhere safe. It cannot be reset by the server.</p>
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
              minLength={3}
              maxLength={30}
              required
            />
          </label>

          <label>
            Recovery email
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </label>

          <div className="form-grid two">
            <label>
              Account password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={updateField}
                minLength={8}
                required
              />
            </label>
            <label>
              Confirm account password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={updateField}
                minLength={8}
                required
              />
            </label>
          </div>

          <label>
            Vault password
            <input
              name="masterPassword"
              type="password"
              autoComplete="off"
              value={form.masterPassword}
              onChange={updateField}
              minLength={12}
              required
            />
            <span className="strength-meter" aria-label={`Vault password strength ${masterStrength} out of 5`}>
              {Array.from({ length: 5 }).map((_, index) => (
                <span key={index} className={index < masterStrength ? "active" : ""} />
              ))}
            </span>
          </label>

          <label>
            Confirm vault password
            <input
              name="confirmMasterPassword"
              type="password"
              autoComplete="off"
              value={form.confirmMasterPassword}
              onChange={updateField}
              minLength={12}
              required
            />
          </label>

          <button className="primary-button full-width" type="submit" disabled={loading}>
            <KeyRound size={18} aria-hidden="true" />
            {loading ? "Creating encrypted keys..." : "Create vault"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
