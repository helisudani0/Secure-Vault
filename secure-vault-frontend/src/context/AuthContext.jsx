import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

// AUTH API (separate!)
const authApi = axios.create({
  baseURL: "http://127.0.0.1:8000/api/auth",
});

// FILES API (separate!)
const filesApi = axios.create({
  baseURL: "http://127.0.0.1:8000/api/files",
});

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // -------------------------
  // LOAD CURRENT LOGGED IN USER
  // -------------------------
  const loadUser = async () => {
    try {
      const token = localStorage.getItem("access");
      if (!token) return setUser(null);

      const res = await authApi.get("/me/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);
    } catch (err) {
      setUser(null);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("access")) {
      loadUser();
    }
  }, []);

  // -------------------------
  // LOGIN
  // -------------------------
  const login = async (username, password) => {
    const res = await authApi.post("/login/", { username, password });

    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);
    localStorage.setItem("username", res.data.user.username);
    localStorage.setItem("userId", res.data.user.id);
  
    localStorage.setItem(
      "encrypted_private_key",
      JSON.stringify(res.data.user.encrypted_private_key)
    );

    localStorage.setItem("login_password", password);

    await loadUser();
  };

  // -------------------------
  // SIGNUP
  // -------------------------
  const signup = async (username, password, masterPassword) => {
    await authApi.post("/signup/", {
      username,
      password,
      master_password: masterPassword,
    });
    await login(username, password);
  };

  // -------------------------
  // LOGOUT
  // -------------------------
  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, signup, logout, filesApi }}
    >
      {children}
    </AuthContext.Provider>
  );
}
