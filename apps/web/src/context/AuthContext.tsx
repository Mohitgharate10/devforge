'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'freelancer' | 'client' | 'admin';
  roles?: string[];
  handle?: string;
  avatarUrl?: string | null;
  walletAddress?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (user: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch('/api/v1/auth/session', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Session lookup failed with status ${response.status}`);
        }

        const result = await response.json();
        const sessionUser = result?.data?.user as AuthUser | null;
        if (active) {
          setUser(sessionUser?.id ? sessionUser : null);
        }
      } catch (error) {
        console.error('Failed to restore the authenticated session:', error);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSession();
    return () => {
      active = false;
    };
  }, []);

  const signIn = (userData: AuthUser) => {
    setUser(userData);
  };

  const signOut = () => {
    setUser(null);
    void fetch('/api/v1/auth/sign-out', { method: 'POST' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Sign-out failed with status ${response.status}`);
        }
      })
      .catch((error) => console.error('Failed to end the authenticated session:', error));
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
