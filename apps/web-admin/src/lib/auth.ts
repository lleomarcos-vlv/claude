/**
 * Auth: token storage (localStorage) + a small React context.
 *
 * Token persistence lives here so the axios interceptor in `api.ts` can read the
 * bearer token without a circular dependency (api imports auth, not vice-versa).
 * The provider is written with `createElement` to keep this file a plain `.ts`.
 */
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AdminUser, AuthResponse } from './types';

const STORAGE_TOKEN = 'jj_admin_token';
const STORAGE_REFRESH = 'jj_admin_refresh';
const STORAGE_USER = 'jj_admin_user';

/** Broadcast when the API returns 401 so the provider can drop the session. */
export const UNAUTHORIZED_EVENT = 'jj:unauthorized';

export function readToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_TOKEN);
  } catch {
    return null;
  }
}

function readUser(): AdminUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    return raw ? (JSON.parse(raw) as AdminUser) : null;
  } catch {
    return null;
  }
}

export function persistSession(auth: AuthResponse): void {
  try {
    localStorage.setItem(STORAGE_TOKEN, auth.accessToken);
    localStorage.setItem(STORAGE_REFRESH, auth.refreshToken);
    localStorage.setItem(STORAGE_USER, JSON.stringify(auth.user));
  } catch {
    /* storage disabled (private mode) — session stays in memory only */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_REFRESH);
    localStorage.removeItem(STORAGE_USER);
  } catch {
    /* no-op */
  }
}

interface AuthContextValue {
  user: AdminUser | null;
  isAuthenticated: boolean;
  signIn: (auth: AuthResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(() => readUser());

  const signIn = useCallback((auth: AuthResponse) => {
    persistSession(auth);
    setUser(auth.user);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // Sync sign-out across the interceptor (401) and other browser tabs.
  useEffect(() => {
    const onUnauthorized = () => {
      clearSession();
      setUser(null);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_TOKEN) setUser(readUser());
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: Boolean(user), signIn, signOut }),
    [user, signIn, signOut],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  }
  return ctx;
}
