import React, { createContext, useContext, useEffect, useState } from 'react';
import useAuthApi, { getStoredToken, getStoredUser, saveAuth, clearAuth } from '../hooks/useAuth';
import { AuthUser } from '../api/auth';

interface AuthContextType {
  user: AuthUser | null;
  userRole: 'Admin' | 'Publisher' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS === 'true';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<'Admin' | 'Publisher' | null>(null);
  const [loading, setLoading] = useState(true);

  const { login } = useAuthApi();

  useEffect(() => {
    // first try to restore stored token/user
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();

    const isTokenValid = (token: string | null) => {
      if (!token) return false;
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload && payload.exp && typeof payload.exp === 'number') {
          const now = Math.floor(Date.now() / 1000);
          return payload.exp > now;
        }
        // no exp claim -> consider valid (can't determine)
        return true;
      } catch (e) {
        return false;
      }
    };

    if (storedUser && storedToken) {
      // validate token (expiry) before trusting stored user
      if (!isTokenValid(storedToken)) {
        // invalid or expired -> clear stored auth
        try {
          clearAuth();
        } catch (e) {
          // ignore
        }
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      setUser(storedUser);
      setUserRole((storedUser.role as any) ?? null);
      setLoading(false);
      return;
    }

    // development bypass: auto-auth as demo admin
    if (DEV_BYPASS) {
      const demo: AuthUser = {
        id: 'dev-admin',
        name: 'Dev Admin',
        email: 'admin@example.com',
        role: 'Admin',
      };
      setUser(demo);
      setUserRole('Admin');
      // store a fake token so other parts see we are authenticated
      try {
        saveAuth('dev-token');
      } catch (e) {
        // ignore
      }
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [login]);

  // If auth check finished and there is no user, redirect to root (show login)
  useEffect(() => {
    if (!loading && !user && !DEV_BYPASS) {
      try {
        // Only change location if not already at root to avoid useless reloads
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      } catch (e) {
        // ignore
      }
    }
  }, [loading, user]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await login(email, password);
      // expected { success, message, token, user }
  const token = res?.token;
      const isTokenValid = (token: string | null) => {
        if (!token) return false;
        try {
          const parts = token.split('.');
          if (parts.length !== 3) return false;
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload && payload.exp && typeof payload.exp === 'number') {
            const now = Math.floor(Date.now() / 1000);
            return payload.exp > now;
          }
          return true;
        } catch (e) {
          return false;
        }
      };

      if (token && isTokenValid(token)) {
        // persist only the token; derive user from token when needed
        saveAuth(token);
        const derived = getStoredUser();
        setUser(derived);
        setUserRole((derived?.role as any) ?? null);
      } else {
        // invalid token or missing data -> ensure signed out state
        clearAuth();
        setUser(null);
        setUserRole(null);
        throw new Error(res?.message || 'Invalid or expired token');
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    clearAuth();
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
