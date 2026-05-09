import { Link } from "../router";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="center-screen">
      <section className="auth-card compact">
        <SearchX size={40} aria-hidden="true" />
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p className="muted">That route is not part of this vault workspace.</p>
        <Link className="primary-button full-width" to="/dashboard">
          Go to dashboard
        </Link>
      </section>
    </main>
  );
}
