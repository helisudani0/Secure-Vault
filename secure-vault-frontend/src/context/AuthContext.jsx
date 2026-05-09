import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser, loginUser, registerUser, updateProfile } from "../api/auth";
import { parseApiError, sessionStore } from "../api/client";
import { createEncryptedKeyBundle, unlockPrivateKey } from "../utils/crypto";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => sessionStore.getUser());
  const [privateKey, setPrivateKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const refreshUser = useCallback(async () => {
    const profile = await getCurrentUser();
    sessionStore.setUser(profile);
    setUser(profile);
    return profile;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      if (!sessionStore.getAccessToken()) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getCurrentUser();
        if (mounted) {
          sessionStore.setUser(profile);
          setUser(profile);
        }
      } catch {
        sessionStore.clear();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    boot();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async ({ username, password, masterPassword }) => {
    setAuthError("");
    try {
      const session = await loginUser(username, password);
      sessionStore.setSession(session);
      setUser(session.user);

      if (masterPassword) {
        const unlocked = await unlockPrivateKey(session.user.encrypted_private_key, masterPassword);
        setPrivateKey(unlocked);
      }

      return session.user;
    } catch (error) {
      const message = parseApiError(error);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const signup = useCallback(async ({ username, email, password, masterPassword }) => {
    setAuthError("");
    try {
      const { publicKey, encryptedPrivateKey } = await createEncryptedKeyBundle(masterPassword);
      const session = await registerUser({
        username,
        email,
        password,
        public_key: publicKey,
        encrypted_private_key: encryptedPrivateKey,
      });

      sessionStore.setSession(session);
      setUser(session.user);
      setPrivateKey(await unlockPrivateKey(session.user.encrypted_private_key, masterPassword));
      return session.user;
    } catch (error) {
      const message = parseApiError(error);
      setAuthError(message);
      throw new Error(message);
    }
  }, []);

  const unlockVault = useCallback(
    async (masterPassword) => {
      if (!user?.encrypted_private_key) {
        throw new Error("No encrypted private key is available for this account");
      }

      const unlocked = await unlockPrivateKey(user.encrypted_private_key, masterPassword);
      setPrivateKey(unlocked);
      return unlocked;
    },
    [user]
  );

  const lockVault = useCallback(() => {
    setPrivateKey(null);
  }, []);

  const logout = useCallback(() => {
    sessionStore.clear();
    setUser(null);
    setPrivateKey(null);
  }, []);

  const saveProfile = useCallback(
    async (payload) => {
      const updated = await updateProfile(payload);
      const merged = { ...user, ...updated };
      sessionStore.setUser(merged);
      setUser(merged);
      return merged;
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      privateKey,
      loading,
      authError,
      isAuthenticated: Boolean(user),
      isVaultUnlocked: Boolean(privateKey),
      login,
      signup,
      logout,
      unlockVault,
      lockVault,
      refreshUser,
      saveProfile,
    }),
    [
      user,
      privateKey,
      loading,
      authError,
      login,
      signup,
      logout,
      unlockVault,
      lockVault,
      refreshUser,
      saveProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export { AuthContext };
