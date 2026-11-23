import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  type AuthUser,
} from "../lib/api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const authenticatedUser = await loginRequest(email, password);
    setUser(authenticatedUser);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      // Always clear the local authenticated state, even if the API is unavailable.
      setUser(null);
    }
  }, []);

  const clearLocalSession = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, clearLocalSession }),
    [user, loading, signIn, signOut, clearLocalSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
