import { createContext } from "react";
import type { AuthUser } from "../lib/api";

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearLocalSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
