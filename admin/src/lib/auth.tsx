import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { post } from "../api/client";

const TOKEN_KEY = "logopulse_token";

// L2: anggap token kedaluwarsa bila klaim exp-nya lewat (selain cek server).
function isExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

interface AuthContextValue {
  token: string | null;
  isAuthed: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof localStorage !== "undefined"
      ? localStorage.getItem(TOKEN_KEY)
      : null
  );

  const login = useCallback(async (email: string, password: string) => {
    const res = await post<{ token?: string; access_token?: string }>(
      "/auth/login",
      { email, password }
    );
    const t = res.token ?? res.access_token ?? "";
    if (!t) throw new Error("Login failed: empty token");
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) setToken(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, isAuthed: !!token && !isExpired(token), login, logout }),
    [token, login, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthed } = useAuth();
  const loc = useLocation();
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return children;
}
