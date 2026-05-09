import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  CloudUpload,
  FileLock2,
  FolderKanban,
  Gauge,
  KeyRound,
  LockKeyhole,
  Network,
  Orbit,
  PanelTop,
  Radio,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { BRAND_DOMAIN, BRAND_NAME, BRAND_SHORT_COPY, BRAND_TAGLINE } from "../brand";
import BrandLogo from "../components/BrandLogo";
import { Link } from "../router";

const proofPoints = [
  ["Any file, instantly sorted", "Upload photos, PDFs, documents, archives, code, audio, video, and anything else you need to keep private."],
  ["Password locker", "Save website logins with encrypted usernames, passwords, and notes in the same vault key system."],
  ["Smart collections", "Ciphra sorts uploads into usable folders automatically, so the dashboard feels organized from the first file."],
  ["Recovery layer", "Verified email flows handle account recovery without pretending the vault password can be magically recovered."],
];

const workflow = [
  { icon: <CloudUpload />, label: "Upload", detail: "Drop any file type into your vault." },
  { icon: <LockKeyhole />, label: "Encrypt", detail: "A browser-generated key seals the file first." },
  { icon: <FolderKanban />, label: "Organize", detail: "The vault sorts files into useful collections." },
  { icon: <KeyRound />, label: "Share", detail: "Access is shared by wrapping keys for recipients." },
];

const securityLayers = [
  { icon: <PanelTop />, label: "Account", detail: "JWT session, recovery email, rate limits" },
  { icon: <ShieldCheck />, label: "Vault key", detail: "Private key unlocks only in browser memory" },
  { icon: <FileLock2 />, label: "Files", detail: "Encrypted blobs with typed collections" },
  { icon: <KeyRound />, label: "Secrets", detail: "Web credentials sealed with the same vault model" },
];

const liveSignals = ["client-side crypto", "typed storage", "secure sharing", "passwords"];

export default function Landing() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="dimensional-grid" aria-hidden="true" />
        <div className="hero-beams" aria-hidden="true" />
        <nav className="landing-nav" aria-label="Public navigation">
          <Link to="/" aria-label={`${BRAND_NAME} home`}>
            <BrandLogo />
          </Link>
          <div>
            <Link className="nav-pill" to="/login">Sign in</Link>
            <Link className="nav-pill primary" to="/signup">Create vault</Link>
          </div>
        </nav>

        <div className="hero-copy">
          <p className="eyebrow">Claim-ready free domain: {BRAND_DOMAIN}</p>
          <h1>{BRAND_NAME}</h1>
          <p>{BRAND_TAGLINE}</p>
          <p className="hero-detail">
            A private cloud workspace for real life: files, passwords, sharing, account recovery, type-aware folders,
            and a vault unlock model that keeps private keys out of casual reach.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/signup">
              Create encrypted vault
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="secondary-button hero-secondary" to="/login">
              Sign in
            </Link>
          </div>
          <div className="hero-trust-row" aria-label="Security highlights">
            {liveSignals.map((signal) => (
              <span key={signal}>{signal}</span>
            ))}
          </div>
        </div>

        <div className="hero-stage" aria-label="Ciphra product preview">
          <div className="stage-grid" aria-hidden="true" />
          <div className="vault-prism" aria-hidden="true">
            <span className="prism-face prism-front" />
            <span className="prism-face prism-top" />
            <span className="prism-face prism-side" />
            <span className="prism-lock" />
          </div>

          <div className="orbit-track orbit-track-a" aria-hidden="true">
            <span><FileLock2 size={16} /></span>
          </div>
          <div className="orbit-track orbit-track-b" aria-hidden="true">
            <span><KeyRound size={16} /></span>
          </div>

          <article className="live-vault-card card-files">
            <div>
              <span className="card-kicker">Files</span>
              <strong>214 sealed items</strong>
            </div>
            <div className="mini-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </article>

          <article className="live-vault-card card-passwords">
            <div>
              <span className="card-kicker">Passwords</span>
              <strong>Vault unlocked</strong>
            </div>
            <BadgeCheck size={18} aria-hidden="true" />
          </article>

          <article className="live-vault-card card-routing">
            <Radio size={18} aria-hidden="true" />
            <div>
              <span className="card-kicker">Recovery</span>
              <strong>Email verified</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="launch-strip" aria-label="Launch features">
        <article>
          <ShieldCheck size={20} aria-hidden="true" />
          <span>Client-side encryption</span>
        </article>
        <article>
          <Boxes size={20} aria-hidden="true" />
          <span>1 TB-ready storage model</span>
        </article>
        <article>
          <KeyRound size={20} aria-hidden="true" />
          <span>Password manager included</span>
        </article>
        <article>
          <Gauge size={20} aria-hidden="true" />
          <span>Fast dashboard workflows</span>
        </article>
      </section>

      <section className="experience-band">
        <div className="experience-copy">
          <p className="eyebrow">Not another plain file bucket</p>
          <h2>A cinematic vault that still behaves like a serious daily tool.</h2>
          <p>
            Ciphra feels like a secure command center on the surface, but underneath it keeps the practical pieces users expect:
            typed folders, quick search, graceful empty states, password storage, sharing, recovery, dark mode, and responsive layouts.
          </p>
        </div>
        <div className="experience-console" aria-label="Ciphra workflow view">
          <div className="console-topline">
            <span />
            <strong>Live vault route</strong>
            <Zap size={16} aria-hidden="true" />
          </div>
          <div className="route-map" aria-hidden="true">
            <span className="route-node active"><CloudUpload size={18} /></span>
            <span className="route-line" />
            <span className="route-node"><LockKeyhole size={18} /></span>
            <span className="route-line" />
            <span className="route-node"><FolderKanban size={18} /></span>
            <span className="route-line" />
            <span className="route-node"><ShareIcon /></span>
          </div>
          <div className="console-metrics">
            <span>Photos</span>
            <span>PDFs</span>
            <span>Docs</span>
            <span>Code</span>
          </div>
        </div>
      </section>

      <section className="landing-band">
        <div>
          <p className="eyebrow">What users get</p>
          <h2>One place for the private things people usually scatter everywhere.</h2>
          <p className="muted">{BRAND_SHORT_COPY}</p>
        </div>
        <div className="feature-strip">
          {proofPoints.map(([title, detail]) => (
            <article className="feature-card" key={title}>
              <ScanSearch size={22} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dimension-band">
        <div className="dimension-copy">
          <p className="eyebrow">How the vault works</p>
          <h2>Layered security, visible without becoming complicated.</h2>
          <p>
            Account password gets you in. Vault password unlocks private keys in browser memory. Files and password entries stay encrypted at rest.
          </p>
        </div>
        <div className="layer-stack" aria-label="Vault security layers">
          {securityLayers.map((layer) => (
            <article key={layer.label}>
              {layer.icon}
              <strong>{layer.label}</strong>
              <span>{layer.detail}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="vault-geometry-band">
        <div className="geometry-stage" aria-hidden="true">
          <span className="geometry-plane plane-one" />
          <span className="geometry-plane plane-two" />
          <span className="geometry-plane plane-three" />
          <span className="geometry-core"><Orbit size={48} /></span>
        </div>
        <div>
          <p className="eyebrow">The uncommon feature</p>
          <h2>Files and passwords share one private mental model.</h2>
          <p>
            Most demos split storage and credentials into separate little toys. Ciphra makes them feel like one protected workspace:
            unlock once, manage both, recover the account safely, and keep the vault password as the final gate.
          </p>
        </div>
      </section>

      <section className="workflow-band">
        {workflow.map((item) => (
          <article className="workflow-step" key={item.label}>
            <span>{item.icon}</span>
            <h3>{item.label}</h3>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="landing-closing">
        <Sparkles size={26} aria-hidden="true" />
        <h2>Your vault should look as serious as the things inside it.</h2>
        <p>
          Ciphra gives users a polished place to upload, organize, unlock, and protect what matters.
        </p>
        <Link className="primary-button" to="/signup">Open the vault</Link>
      </section>
    </main>
  );
}

function ShareIcon() {
  return <Network size={18} aria-hidden="true" />;
}
