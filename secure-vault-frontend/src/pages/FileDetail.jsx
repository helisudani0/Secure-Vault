import { Link, useParams } from "../router";
import { ArrowLeft, FileText } from "lucide-react";

export default function FileDetail() {
  const { id } = useParams();

  return (
    <main className="app-main narrow">
      <Link className="back-link" to="/dashboard">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to dashboard
      </Link>
      <section className="empty-state">
        <FileText size={42} aria-hidden="true" />
        <h1>File details moved</h1>
        <p>
          File actions now live directly on the dashboard for speed and reliability. Selected file id:
          {" "}
          <code>{id}</code>
        </p>
      </section>
    </main>
  );
}
