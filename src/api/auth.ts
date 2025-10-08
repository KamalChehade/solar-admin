export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Publisher' | string;
};

const API_BASE = import.meta.env.VITE_Api_URL || import.meta.env.VITE_Api_Url || "";

if (!API_BASE) {
  // allow runtime to handle missing base in some setups
  // console.warn('VITE_Api_URL not set');
}

async function request(path: string, opts: RequestInit = {}) {
  const url = `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\/*/, '')}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    credentials: 'include',
    ...opts,
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.message || res.statusText || 'API error';
    const err: any = new Error(msg);
    err.status = res.status;
    err.body = json;
    throw err;
  }

  return json;
}

export const authApi = {
  login: async (email: string, password: string) => {
    return request('auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  signup: async (name: string, email: string, password: string, roleId: number) => {
    return request('auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, roleId }),
    });
  },
};

export default authApi;
