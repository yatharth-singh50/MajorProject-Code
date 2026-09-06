import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCurrentUser, updateUser } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
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

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, saveProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
