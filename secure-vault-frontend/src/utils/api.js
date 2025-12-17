import axios from "axios";

// placeholder axios instance; we'll point it to backend later
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 12000
});

// attach token if exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sv_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
