// src/api/auth.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: { "Content-Type": "application/json" },
});

// ------------------------------
// SIGNUP
// ------------------------------
export async function registerUser(username, loginPassword, masterPassword) {
  // match backend RegisterSerializer
  const res = await API.post("/auth/signup/", {
    username: username,
    password: loginPassword,
    master_password: masterPassword,
  });
  return res.data;
}

// ------------------------------
// LOGIN (JWT)
// ------------------------------
export async function loginUser(username, password) {
  const res = await API.post("/auth/login/", {
    username,
    password,
  });

  // store JWT tokens & username
  if (res.data.token) {
    localStorage.setItem("access", res.data.token);
    localStorage.setItem("username", res.data.user.username);
    localStorage.setItem("userId", res.data.user.id);
  }

  return res.data;
}

// ------------------------------
// LOGOUT
// ------------------------------
export function logoutUser() {
  localStorage.removeItem("access");
  localStorage.removeItem("username");
  localStorage.removeItem("userId");
}

// ------------------------------
// GET CURRENT USER
// ------------------------------
export function getCurrentUser() {
  return {
    username: localStorage.getItem("username"),
    userId: localStorage.getItem("userId"),
  };
}

// ------------------------------
// AUTH HEADER (JWT)
// ------------------------------
export function getAuthHeader() {
  const token = localStorage.getItem("access");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ------------------------------
// FETCH USER PUBLIC KEY
// ------------------------------
export async function fetchUserPublicKey(username) {
  const token = localStorage.getItem("access");
  const res = await API.get(`/public-key/${username}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
