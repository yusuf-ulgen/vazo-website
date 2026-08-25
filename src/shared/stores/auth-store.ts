import { useState, useEffect } from 'react';

export interface AuthUser {
  email: string;
  name?: string;
  role: 'customer';
}

const AUTH_STORAGE_KEY = 'vazo_customer_auth_user';

type AuthListener = (user: AuthUser | null) => void;
const listeners = new Set<AuthListener>();

function getInitialUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === 'string') {
      return {
        email: parsed.email,
        name: parsed.name || parsed.email.split('@')[0],
        role: 'customer',
      };
    }
  } catch {
    // Ignore JSON parse errors
  }
  return null;
}

let currentUserState: AuthUser | null = getInitialUser();

function notifyListeners() {
  listeners.forEach((listener) => listener(currentUserState));
}

export const authStore = {
  getUser(): AuthUser | null {
    return currentUserState;
  },

  login(email: string, _password?: string, name?: string): AuthUser {
    const normalizedEmail = email.trim().toLowerCase();
    const user: AuthUser = {
      email: normalizedEmail,
      name: name || normalizedEmail.split('@')[0],
      role: 'customer',
    };
    currentUserState = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
    notifyListeners();
    return user;
  },

  loginWithGoogle(): AuthUser {
    const user: AuthUser = {
      email: 'Misafir Oturumu',
      name: 'Misafir Ziyaretçi',
      role: 'customer',
    };
    currentUserState = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    }
    notifyListeners();
    return user;
  },

  logout(): void {
    currentUserState = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    notifyListeners();
  },

  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(currentUserState);

  useEffect(() => {
    return authStore.subscribe((updatedUser) => {
      setUser(updatedUser);
    });
  }, []);

  return {
    user,
    isAuthenticated: !!user,
    isAdmin: false,
    login: authStore.login,
    loginWithGoogle: authStore.loginWithGoogle,
    logout: authStore.logout,
  };
}

