import { api } from "./client";

export async function loginUser(username, password) {
  const response = await api.post("/auth/login/", { username, password });
  return response.data;
}

export async function registerUser(payload) {
  const response = await api.post("/auth/signup/", payload);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get("/auth/me/");
  return response.data;
}

export async function updateProfile(payload) {
  const response = await api.put("/auth/profile/update/", payload);
  return response.data.user;
}

export async function getPublicKey(username) {
  const response = await api.get(`/auth/public-key/${encodeURIComponent(username)}/`);
  return response.data;
}

export async function getStorageUsage() {
  const response = await api.get("/auth/storage-usage/");
  return response.data;
}

export async function requestEmailVerification() {
  const response = await api.post("/auth/email/verify/request/", {});
  return response.data;
}

export async function verifyEmail(token) {
  const response = await api.post("/auth/email/verify/", { token });
  return response.data;
}

export async function requestPasswordReset(email) {
  const response = await api.post("/auth/password/reset/request/", { email });
  return response.data;
}

export async function resetPassword(token, newPassword) {
  const response = await api.post("/auth/password/reset/", {
    token,
    new_password: newPassword,
  });
  return response.data;
}
