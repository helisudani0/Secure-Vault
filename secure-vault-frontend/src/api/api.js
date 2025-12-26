import axios from "axios";

// Axios instance
const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// Attach access token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token when expired
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem("refresh");
      if (!refresh) return Promise.reject(error);

      try {
        const res = await axios.post(`${API.defaults.baseURL}/token/refresh/`, 
          { refresh });

        localStorage.setItem("access", res.data.access);
        API.defaults.headers.common.Authorization = `Bearer ${res.data.access}`;
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        return API(originalRequest);
      } catch (err) {
        localStorage.clear();
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// Upload a file
export async function uploadFile(formData) {
  const res = await API.post("/files/upload/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// Get user's own files
export async function getMyFiles() {
  const res = await API.get("/files/list/");
  return res.data;
}

// Delete a file by ID
export async function deleteFile(fileId) {
  const res = await API.delete(`/files/delete/${fileId}/`);
  return res.data;
}

// Download a file (returns Blob)
export async function downloadFile(fileId) {
  const res = await API.get(`/files/${fileId}/download/`, { responseType: "blob" });
  return res.data;
}

// New function: Download encrypted file (for decryption later)
export async function downloadEncryptedFile(token, fileId) {
  const res = await fetch(`${API.defaults.baseURL}/files/${fileId}/download/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch encrypted file");
  return await res.blob();
}

// Share a file with a recipient (axios version)
export async function shareFileAxios(fileId, targetUserId) {
  const res = await API.post("/files/share/", { fileId, targetUserId });
  return res.data;
}

// Share a file with recipient (fetch version)
export async function shareFileFetch(token, fileId, recipient, wrappedKey) {
  return fetch(`${API.defaults.baseURL}/files/${fileId}/share/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient_username: recipient,
      wrapped_key_for_recipient: wrappedKey,
    }),
  });
}

// Get files shared with current user
export async function getSharedFiles() {
  const res = await API.get("/files/shared/");
  return res.data;
}

export default API;
