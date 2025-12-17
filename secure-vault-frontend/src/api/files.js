import axios from "axios";
import { getAuthHeader } from "./auth";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/files",
});

// -----------------------------------------------------
// 1) GET logged-in user's files  (FIXED!!!)
// -----------------------------------------------------
export async function getUserFiles(token) {
  const res = await axios.get(
    "http://127.0.0.1:8000/api/files/list/",   // <-- FIXED
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
}

// -----------------------------------------------------
// 2) GET files shared with the logged-in user
// (your backend uses `/shared/`, so this one is correct)
// -----------------------------------------------------
export async function getSharedFiles(token) {
  const res = await axios.get(
    "http://127.0.0.1:8000/api/files/shared/",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
}

// -----------------------------------------------------
// 3) DOWNLOAD encrypted file (raw blob)
// -----------------------------------------------------
export async function downloadEncryptedFile(token, fileId) {
  const res = await axios.get(
    `http://127.0.0.1:8000/api/files/download/${fileId}/`,
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    }
  );
  return res.data;
}

// -----------------------------------------------------
// 4) DELETE file
// -----------------------------------------------------
export async function deleteFile(id) {
  const res = await API.delete(`/delete/${id}/`, {
    headers: getAuthHeader(),
  });
  return res.data;
}

// -----------------------------------------------------
// 5) SHARE file
// -----------------------------------------------------
export async function shareFileFetch(token, fileId, recipient, wrappedKey) {
  return axios.post(
    `http://127.0.0.1:8000/api/files/share/${fileId}/`,
    { recipient, wrapped_key: wrappedKey },
    { headers: { Authorization: `Bearer ${token}` } }
  );
}
