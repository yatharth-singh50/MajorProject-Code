import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  getCurrentUser,
  updateUser,
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => {
        // Stored token is missing/expired/invalid -- clear it so we don't
        // keep retrying a dead token on every reload.
        apiLogout();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await getCurrentUser();
    setUser(u);
    return u;
  }, []);

  const saveProfile = useCallback(async (patch) => {
    if (!user) return;
    const updated = await updateUser(user.username, patch);
    setUser((prev) => ({ ...prev, ...updated }));
    return updated;
  }, [user]);

  // `identifier` is a username OR an email -- the backend accepts either.
  const login = useCallback(async (identifier, password) => {
    const u = await apiLogin(identifier, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async ({ username, email, password, displayName }) => {
    const u = await apiRegister({ username, email, password, displayName });
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, saveProfile, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
