import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type User = { email: string };

type AuthContextType = {
  user: User | null;
  isAuthed: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ ok: boolean; reason?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = 'swat.users';
const TOKEN_KEY = 'swat.token';
const USER_KEY  = 'swat.user';

function loadAllUsers(): Record<string,string> {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
}
function saveAllUsers(all: Record<string,string>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(all));
}
function verifyUser(email: string, password: string) {
  const all = loadAllUsers();
  return all[email] && all[email] === password;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const saved = localStorage.getItem(USER_KEY);
    if (token && saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  const login = async (email: string, password: string) => {
    if (!verifyUser(email, password)) throw new Error('Invalid email or password');
    const u = { email };
    localStorage.setItem(TOKEN_KEY, 'demo-token');
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  /**
   * Create account WITHOUT logging the user in.
   * Returns { ok: true } if created, or { ok: false, reason } if duplicate.
   */
  const signup = async (email: string, password: string) => {
    const all = loadAllUsers();
    if (all[email]) {
      return { ok: false, reason: 'Email already exists. Please sign in.' };
    }
    all[email] = password;
    saveAllUsers(all);
    // Do NOT set token or user here.
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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