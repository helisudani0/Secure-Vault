import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { verifyEmail } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation } from "../router";

export default function VerifyEmail() {
  const { refreshUser, isAuthenticated } = useAuth();
  const { search } = useLocation();
  const [state, setState] = useState({ status: "loading", message: "Verifying your email..." });

  useEffect(() => {
    let active = true;
    const token = new URLSearchParams(search).get("token");

    async function run() {
      if (!token) {
        setState({ status: "error", message: "Verification token is missing." });
        return;
      }

      try {
        await verifyEmail(token);
        if (isAuthenticated) {
          await refreshUser();
        }
        if (active) {
          setState({ status: "success", message: "Your email is verified." });
        }
      } catch (error) {
        if (active) {
          setState({
            status: "error",
            message: error.message || "Verification link is invalid or expired.",
          });
        }
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [isAuthenticated, refreshUser, search]);

  const isSuccess = state.status === "success";
  const isLoading = state.status === "loading";

  return (
    <main className="center-screen">
      <section className="auth-card compact">
        {isLoading ? (
          <Loader2 className="spin-icon" size={42} aria-hidden="true" />
        ) : isSuccess ? (
          <CheckCircle2 className="success-text" size={42} aria-hidden="true" />
        ) : (
          <AlertCircle className="danger-text" size={42} aria-hidden="true" />
        )}
        <p className="eyebrow">Email verification</p>
        <h1>{isLoading ? "Checking link" : isSuccess ? "Verified" : "Could not verify"}</h1>
        <p className="muted">{state.message}</p>
        <Link className="primary-button full-width" to={isAuthenticated ? "/profile" : "/login"}>
          {isAuthenticated ? "Back to profile" : "Sign in"}
        </Link>
      </section>
    </main>
  );
}
