import { useState, useEffect } from 'react';

export interface AuthUser {
  email: string;
  name?: string;
  role: 'admin' | 'customer';
}

const AUTH_STORAGE_KEY = 'vazo_auth_user';

// Pre-configured admin accounts and passwords
export const ADMIN_CREDENTIALS: Record<string, string> = {
  'adminvazo@gmail.com': 'LocalDev123',
  'admin@vazostudio.com': 'LocalDev123',
  'admin@vazo.com': 'LocalDev123',
  'yusuf@vazostudio.com': 'LocalDev123',
  'admin@admin.com': 'LocalDev123',
};

export function isEmailAdmin(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (normalized in ADMIN_CREDENTIALS) return true;
  if (normalized.startsWith('admin@') || normalized.includes('+admin@')) return true;
  return false;
}

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
        role: isEmailAdmin(parsed.email) ? 'admin' : (parsed.role || 'customer'),
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

  login(email: string, password?: string, name?: string): AuthUser {
    const normalizedEmail = email.trim().toLowerCase();
    const isAdminAccount = isEmailAdmin(normalizedEmail);

    // If an admin email is attempted with password check
    if (isAdminAccount && password !== undefined && password.length > 0) {
      const expectedPassword = ADMIN_CREDENTIALS[normalizedEmail] || 'LocalDev123';
      if (password !== expectedPassword) {
        throw new Error('Yönetici şifresi hatalı.');
      }
    }

    const role = isAdminAccount ? 'admin' : 'customer';
    const user: AuthUser = {
      email: normalizedEmail,
      name: name || normalizedEmail.split('@')[0],
      role,
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
    isAdmin: user?.role === 'admin',
    login: authStore.login,
    loginWithGoogle: authStore.loginWithGoogle,
    logout: authStore.logout,
  };
}
