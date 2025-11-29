import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api';

type User = { email: string };

type AuthContextType = {
  user: User | null;
  isAuthed: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ ok: boolean; reason?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'swat.token';

// Permanent admin credentials
const ADMIN_EMAIL = 'admin@swat.local';
const ADMIN_PASSWORD = 'admin123';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const performAutoLogin = async () => {
      try {
        const response = await authApi.login(ADMIN_EMAIL, ADMIN_PASSWORD);
        localStorage.setItem(TOKEN_KEY, response.access_token);
        setUser(response.user);
      } catch (err) {
        console.error('Auto-login failed:', err);
      }
    };

    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      authApi.me(token).then((res) => {
        setUser(res.user);
      }).catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        performAutoLogin();
      });
    } else {
      performAutoLogin();
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem(TOKEN_KEY, response.access_token);
      setUser(response.user);
    } catch (err) {
      throw err;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      await authApi.signup(email, password);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, reason: err.message || 'Signup failed' };
    }
  };

  const logout = () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      authApi.logout(token).catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    isAuthed: !!user,
    login,
    signup,
    logout
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
