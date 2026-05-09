import { BRAND_NAME } from "../brand";

export default function BrandLogo({ compact = false }) {
  return (
    <span className={`brand-lockup ${compact ? "compact" : ""}`}>
      <span className="brand-mark" aria-hidden="true">
        <span className="logo-core" />
        <span className="logo-plane logo-plane-a" />
        <span className="logo-plane logo-plane-b" />
        <span className="logo-cut" />
      </span>
      {!compact && <span className="brand-wordmark">{BRAND_NAME}</span>}
    </span>
  );
}
