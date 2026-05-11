import React from "react";
import { AlertCircle } from "lucide-react";
import { reportClientError } from "../utils/reporting";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Privora UI error", error, info);
    reportClientError(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="center-screen">
          <section className="auth-card compact" role="alert">
            <AlertCircle size={32} className="danger-text" aria-hidden="true" />
            <h1>Something went wrong</h1>
            <p>The app hit an unexpected error. Refresh the page and try again.</p>
            <button className="primary-button" type="button" onClick={() => window.location.reload()}>
              Refresh
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
