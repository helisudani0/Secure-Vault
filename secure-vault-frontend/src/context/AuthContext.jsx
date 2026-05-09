import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

// ============================================================================
// SECURE STORAGE UTILITIES
// ============================================================================
// Store sensitive data in-memory (cleared on page unload) + sessionStorage as fallback
class SecureStorage {
  constructor() {
    this.memoryStore = {};
  }

  set(key, value) {
    // Always store in memory for active session
    this.memoryStore[key] = value;
    // Only store non-sensitive data in sessionStorage
    if (!this._isSensitiveKey(key)) {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn("sessionStorage unavailable", e);
      }
    }
  }

  get(key) {
    // Prefer memory store
    if (this.memoryStore[key] !== undefined) {
      return this.memoryStore[key];
    }
    // Fallback to sessionStorage for non-sensitive data
    if (!this._isSensitiveKey(key)) {
      try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.warn("sessionStorage read error", e);
      }
    }
    return null;
  }

  remove(key) {
    delete this.memoryStore[key];
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn("sessionStorage remove error", e);
    }
  }

  clear() {
    this.memoryStore = {};
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn("sessionStorage clear error", e);
    }
  }

  _isSensitiveKey(key) {
    const sensitiveKeys = [
      "login_password",
      "master_password",
      "private_key_cached",
    ];
    return sensitiveKeys.some(sk => key.includes(sk));
  }
}

const secureStorage = new SecureStorage();

// ============================================================================
// API CONFIGURATION
// ============================================================================
const authApi = axios.create({
  baseURL: "http://127.0.0.1:8000/api/auth",
});

const filesApi = axios.create({
  baseURL: "http://127.0.0.1:8000/api/files",
});

// Request interceptor - add token to all requests
authApi.interceptors.request.use((config) => {
  const token = secureStorage.get("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

filesApi.interceptors.request.use((config) => {
  const token = secureStorage.get("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
const createRefreshInterceptor = (apiInstance) => {
  apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        secureStorage.get("refresh")
      ) {
        originalRequest._retry = true;

        try {
          const refreshToken = secureStorage.get("refresh");
          const response = await axios.post(
            "http://127.0.0.1:8000/api/token/refresh/",
            { refresh: refreshToken }
          );

          const newAccessToken = response.data.access;
          secureStorage.set("access", newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiInstance(originalRequest);
        } catch (refreshError) {
          secureStorage.clear();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );
};

createRefreshInterceptor(authApi);
createRefreshInterceptor(filesApi);

// ============================================================================
// AUTH CONTEXT
// ============================================================================
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [masterPassword, setMasterPassword] = useState(null);
  const vaultUnlockTimeRef = useRef(null);

  // ========================================================================
  // LOAD USER ON APP START
  // ========================================================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = secureStorage.get("access");
        if (token) {
          await loadUser();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        secureStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Clear sensitive data on page unload
    const handleBeforeUnload = () => {
      secureStorage.memoryStore = {};
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // ========================================================================
  // LOAD CURRENT LOGGED-IN USER
  // ========================================================================
  const loadUser = useCallback(async () => {
    try {
      const token = secureStorage.get("access");
      if (!token) {
        setUser(null);
        setMasterPassword(null);
        return;
      }

      const res = await authApi.get("/me/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(res.data);
    } catch (err) {
      console.error("Failed to load user:", err);
      setUser(null);
      setMasterPassword(null);
    }
  }, []);

  // ========================================================================
  // LOGIN
  // ========================================================================
  const login = useCallback(async (username, password) => {
    try {
      const res = await authApi.post("/login/", { username, password });

      const { access, refresh, user: userData } = res.data;

      // Store tokens in secure storage (in-memory + sessionStorage)
      secureStorage.set("access", access);
      secureStorage.set("refresh", refresh);

      // Store user metadata (non-sensitive) in sessionStorage
      secureStorage.set("username", userData.username);
      secureStorage.set("userId", userData.id);
      secureStorage.set(
        "encrypted_private_key",
        userData.encrypted_private_key
      );

      // Store public key for file operations
      secureStorage.set(`sv_pubkey_${userData.username}`, userData.public_key);

      await loadUser();

      // Return success but don't store master_password
      // It will be provided separately for vault unlock
      return {
        success: true,
        user: userData,
      };
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }, [loadUser]);

  // ========================================================================
  // SIGNUP
  // ========================================================================
  const signup = useCallback(
    async (username, password, masterPassword) => {
      try {
        await authApi.post("/signup/", {
          username,
          password,
          master_password: masterPassword,
        });

        // Automatically log in after signup
        await login(username, password);

        return { success: true };
      } catch (error) {
        console.error("Signup failed:", error);
        throw error;
      }
    },
    [login]
  );

  // ========================================================================
  // UNLOCK VAULT (Temporary master password storage for this session)
  // ========================================================================
  const unlockVault = useCallback((masterPassword) => {
    // Store in memory only - will be cleared on page unload
    setMasterPassword(masterPassword);
    vaultUnlockTimeRef.current = Date.now();

    // Auto-lock after 1 hour of inactivity
    const timeout = setTimeout(() => {
      lockVault();
    }, 60 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, []);

  // ========================================================================
  // LOCK VAULT (Clear master password from memory)
  // ========================================================================
  const lockVault = useCallback(() => {
    setMasterPassword(null);
    vaultUnlockTimeRef.current = null;
  }, []);

  // ========================================================================
  // GET MASTER PASSWORD (Only accessible if vault is unlocked)
  // ========================================================================
  const getMasterPassword = useCallback(() => {
    if (!masterPassword) {
      console.warn("Vault is locked - master password not available");
      return null;
    }
    return masterPassword;
  }, [masterPassword]);

  // ========================================================================
  // LOGOUT
  // ========================================================================
  const logout = useCallback(() => {
    secureStorage.clear();
    setUser(null);
    setMasterPassword(null);
    vaultUnlockTimeRef.current = null;
  }, []);

  const value = {
    user,
    loading,
    masterPassword: masterPassword ? "LOCKED" : null, // Never expose actual password
    login,
    signup,
    logout,
    unlockVault,
    lockVault,
    getMasterPassword,
    filesApi,
    secureStorage,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

