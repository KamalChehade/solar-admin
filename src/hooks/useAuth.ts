import { useCallback } from 'react';
import * as authModule from '../api/auth';
import type { AuthUser } from '../api/auth';

// helper to resolve functions from various export shapes
function getExportedFn(name: string): Function | undefined {
  const mod: any = authModule as any;
  if (mod?.authApi && typeof mod.authApi[name] === 'function') return mod.authApi[name];
  if (mod?.default && typeof mod.default[name] === 'function') return mod.default[name];
  if (typeof mod[name] === 'function') return mod[name];
  return undefined;
}

 const API_BASE = import.meta.env.VITE_Api_URL || '';
async function directRequest(path: string, body: any) {
  const url = `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\/*/, '')}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  try {
    const json = txt ? JSON.parse(txt) : null;
    if (!res.ok) throw new Error(json?.message || txt || res.statusText);
    return json;
  } catch (e) {
    if (!res.ok) throw e;
    return null;
  }
}

const TOKEN_KEY = 'solar_token_v1';
const USER_KEY = 'solar_user_v1'; // kept for backwards-compatibility reads/cleanup, but we won't write this anymore

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    // Prefer to derive user from the stored token's payload (JWT) instead of storing user object.
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      // fallback: if old USER_KEY exists, try to parse it (one-time compatibility)
      const v = localStorage.getItem(USER_KEY);
      return v ? JSON.parse(v) : null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    // map common claims to AuthUser shape if present
    const user: any = {};
    if (payload.id) user.id = String(payload.id);
    if (payload.name) user.name = payload.name;
    if (payload.email) user.email = payload.email;
    if (payload.role) user.role = payload.role;
    // If we at least have id and email/role, return it
    if (user.id) return user as AuthUser;
    return null;
  } catch (e) {
    return null;
  }
}

export function saveAuth(token: string, _user?: AuthUser) {
  try {
    // Only persist the token. Do not store the user object in localStorage.
    localStorage.setItem(TOKEN_KEY, token);
    // Remove any legacy stored user to avoid stale data
    try {
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    // ignore
  }
}

export default function useAuthApi() {
  const login = useCallback(async (email: string, password: string) => {
    const fn = getExportedFn('login');
    if (fn) {
      const res = await fn(email, password);
      return res;
    }

    if (!API_BASE) throw new Error('VITE_Api_URL not configured and authApi.login unavailable');
    try {
      const res = await directRequest('auth/login', { email, password });
      return res;
    } catch (err) {
      console.error('Direct auth login failed', err);
      throw err;
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, roleId: number) => {
    const fn = getExportedFn('signup');
    if (fn) {
      const res = await fn(name, email, password, roleId);
      return res;
    }

    if (!API_BASE) throw new Error('VITE_Api_URL not configured and authApi.signup unavailable');
    try {
      const res = await directRequest('auth/signup', { name, email, password, roleId });
      return res;
    } catch (err) {
      console.error('Direct auth signup failed', err);
      throw err;
    }
  }, []);

  return { login, signup, getStoredToken, getStoredUser, saveAuth, clearAuth };
}
