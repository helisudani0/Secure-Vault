import { API_BASE_URL, sessionStore } from "../api/client";

export function reportClientError(error, info) {
  if (import.meta.env.DEV) return;

  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });
  const token = sessionStore.getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const payload = {
    message: error?.message || String(error),
    stack: error?.stack || "",
    componentStack: info?.componentStack || "",
    path: window.location.pathname + window.location.search,
    userAgent: window.navigator.userAgent,
    release: import.meta.env.VITE_APP_VERSION || "",
  };

  fetch(`${API_BASE_URL}/client-errors/`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
