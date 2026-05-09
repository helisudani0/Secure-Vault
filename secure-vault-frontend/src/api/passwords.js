import { api } from "./client";

export async function listPasswordEntries() {
  const response = await api.get("/passwords/");
  return Array.isArray(response.data) ? response.data : response.data.results || [];
}

export async function createPasswordEntry(payload) {
  const response = await api.post("/passwords/", payload);
  return response.data;
}

export async function updatePasswordEntry(id, payload) {
  const response = await api.put(`/passwords/${id}/`, payload);
  return response.data;
}

export async function deletePasswordEntry(id) {
  const response = await api.delete(`/passwords/${id}/`);
  return response.data;
}
