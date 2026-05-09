import { useMemo, useState } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";

import { resetPassword } from "../api/auth";
import { Link, useLocation } from "../router";

function strength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export default function ResetPassword() {
  const { search } = useLocation();
  const token = new URLSearchParams(search).get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordStrength = useMemo(() => strength(password), [password]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message || "Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="center-screen">
      <section className="auth-card compact">
        {done ? (
          <>
            <CheckCircle2 className="success-text" size={42} aria-hidden="true" />
            <p className="eyebrow">Recovery complete</p>
            <h1>Password updated</h1>
            <p className="muted">You can now sign in with your new account password.</p>
            <Link className="primary-button full-width" to="/login">
              Sign in
            </Link>
          </>
        ) : (
          <>
            <KeyRound size={42} aria-hidden="true" />
            <p className="eyebrow">Account recovery</p>
            <h1>Choose a new password</h1>
            <p className="muted">
              This changes your account login password. It does not change or recover your vault password.
            </p>

            {error && <div className="form-alert">{error}</div>}

            <form className="form-stack" onSubmit={handleSubmit}>
              <label>
                New account password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
                <span className="strength-meter" aria-label={`Password strength ${passwordStrength} out of 5`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index} className={index < passwordStrength ? "active" : ""} />
                  ))}
                </span>
              </label>
              <label>
                Confirm new password
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <button className="primary-button full-width" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Reset password"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
