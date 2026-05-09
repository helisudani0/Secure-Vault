const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const ACCESS_TOKEN_KEY = "ciphra_access";
const REFRESH_TOKEN_KEY = "ciphra_refresh";
const USER_KEY = "ciphra_user";

export const sessionStore = {
  getAccessToken() {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken() {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  },
  getUser() {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setSession({ access, refresh, user }) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setAccessToken(access) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, access);
  },
  setUser(user) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

let refreshPromise = null;

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function refreshAccessToken() {
  const refresh = sessionStore.getRefreshToken();
  if (!refresh) throw new Error("Missing refresh token");

  refreshPromise ??= fetch(buildUrl("/auth/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refresh }),
  })
    .then(async (response) => {
      if (!response.ok) throw await responseToError(response);
      return response.json();
    })
    .then((data) => {
      sessionStore.setAccessToken(data.access);
      return data.access;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function responseToError(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = { detail: response.statusText || "Request failed" };
  }

  const error = new Error(parseApiError({ response: { status: response.status, data } }));
  error.response = { status: response.status, data };
  return error;
}

async function request(path, options = {}, retried = false) {
  const headers = new Headers(options.headers || {});
  const token = sessionStore.getAccessToken();

  headers.set("Accept", options.accept || "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body = options.body;
  if (body && !(body instanceof FormData) && !(body instanceof Blob)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    body,
  });

  if (response.status === 401 && !retried && sessionStore.getRefreshToken()) {
    const access = await refreshAccessToken();
    headers.set("Authorization", `Bearer ${access}`);
    return request(path, { ...options, headers }, true);
  }

  if (!response.ok) throw await responseToError(response);

  if (options.responseType === "blob") {
    return { data: await response.blob(), headers: response.headers };
  }

  if (response.status === 204) return { data: null, headers: response.headers };
  return { data: await response.json(), headers: response.headers };
}

export const api = {
  get(path, options) {
    return request(path, { ...options, method: "GET" });
  },
  post(path, body, options) {
    return request(path, { ...options, method: "POST", body });
  },
  put(path, body, options) {
    return request(path, { ...options, method: "PUT", body });
  },
  delete(path, options) {
    return request(path, { ...options, method: "DELETE" });
  },
};

export function uploadWithProgress(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", buildUrl(path));
    xhr.setRequestHeader("Accept", "application/json");

    const token = sessionStore.getAccessToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = onProgress || null;
    xhr.onload = () => {
      try {
        const data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ data });
        } else {
          reject(parseXhrError(xhr.status, data));
        }
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(formData);
  });
}

function parseXhrError(status, data) {
  const error = new Error(parseApiError({ response: { status, data } }));
  error.response = { status, data };
  return error;
}

export function parseApiError(error) {
  if (!error) return "Something went wrong.";
  if (error.message === "Network Error" || error.message === "Failed to fetch") {
    return "Cannot reach the Ciphra API.";
  }

  const data = error.response?.data;
  if (!data) return error.message || "Something went wrong.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  if (data.error) return data.error;
  if (data.message) return data.message;

  const firstEntry = Object.entries(data)[0];
  if (!firstEntry) return "Something went wrong.";

  const [field, value] = firstEntry;
  const message = Array.isArray(value) ? value[0] : value;
  return field === "non_field_errors" ? message : `${field}: ${message}`;
}

export { API_BASE_URL };
