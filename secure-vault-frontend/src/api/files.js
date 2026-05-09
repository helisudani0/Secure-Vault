import { api, uploadWithProgress } from "./client";

export async function listFiles() {
  const response = await api.get("/files/list/");
  return Array.isArray(response.data) ? response.data : response.data.results || [];
}

export async function uploadEncryptedFile({ encryptedBlob, filename, wrappedKey, iv, onProgress }) {
  const formData = new FormData();
  formData.append("file", encryptedBlob, filename);
  formData.append("aes_key_owner_wrapped", wrappedKey);
  formData.append("iv", iv);

  const response = await uploadWithProgress("/files/upload/", formData, onProgress);
  return response.data;
}

export async function downloadEncryptedFile(fileId) {
  const response = await api.get(`/files/download/${fileId}/`, {
    responseType: "blob",
  });

  return {
    blob: response.data,
    wrappedKey: response.headers.get("x-wrapped-key"),
    iv: response.headers.get("x-iv"),
  };
}

export async function getWrappedKey(fileId) {
  const response = await api.get(`/files/wrapped-key/${fileId}/`);
  return response.data;
}

export async function shareFile(fileId, recipientUsername, wrappedKeyForRecipient) {
  const response = await api.post(`/files/share/${fileId}/`, {
    recipient_username: recipientUsername,
    wrapped_key_for_recipient: wrappedKeyForRecipient,
  });
  return response.data;
}

export async function deleteFile(fileId) {
  const response = await api.delete(`/files/delete/${fileId}/`);
  return response.data;
}

export async function listSharedFiles() {
  const response = await api.get("/files/shared/");
  return Array.isArray(response.data) ? response.data : response.data.results || [];
}
