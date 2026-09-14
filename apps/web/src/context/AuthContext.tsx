'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'freelancer' | 'client' | 'admin';
  handle?: string;
  avatarUrl?: string | null;
  walletAddress?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (user: AuthUser, keepSignedIn?: boolean) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'devforge_auth_user';

function getInitialUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.id) return parsed;
    }
  } catch (err) {
    console.error('Failed to parse stored auth user:', err);
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getInitialUser);
  const [loading] = useState(false);

  const signIn = (userData: AuthUser, keepSignedIn = true) => {
    setUser(userData);
    if (keepSignedIn) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        // Cookie for SSR compatibility and future deployments
        document.cookie = `devforge_session=${userData.id}; path=/; max-age=2592000; SameSite=Lax`;
      } catch (err) {
        console.error('Failed to persist auth user:', err);
      }
    } else {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      } catch (err) {
        console.error('Failed to store session auth user:', err);
      }
    }
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      document.cookie = 'devforge_session=; path=/; max-age=0';
      fetch('/api/v1/auth/sign-out', { method: 'POST' }).catch(() => {});
    } catch (err) {
      console.error('Failed to clear auth state:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
