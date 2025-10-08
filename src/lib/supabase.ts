// Adapter to forward common supabase-like calls to a REST backend.
// This helps keep existing pages working while you migrate away from Supabase.

const API_BASE = import.meta.env.VITE_Api_URL || '';

function getToken() {
  try {
    return localStorage.getItem('solar_token_v1');
  } catch (e) {
    return null;
  }
}

async function apiFetch(path: string, opts: RequestInit = {}) {
  const url = `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\/*/, '')}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...opts, headers });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    json = text;
  }
  if (!res.ok) {
    return { data: null, error: { status: res.status, body: json } };
  }
  return { data: json, error: null };
}

class QueryBuilder {
  table: string;
  _eqField?: string;
  _eqValue?: string | number;
  _order?: { column: string; ascending?: boolean };
  _limit?: number;

  constructor(table: string) {
    this.table = table;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this._order = { column, ascending: opts?.ascending };
    return this;
  }

  limit(n: number) {
    this._limit = n;
    return this;
  }

  eq(field: string, value: string | number) {
    this._eqField = field;
    this._eqValue = value;
    return this;
  }

  async select(_cols?: any, opts?: any) {
    // If opts indicates count/head usage, try to return a { count } object
    try {
      const path = `${this.table}`;
      const res = await apiFetch(path, { method: 'GET' });
      if (opts && opts.count) {
        const cnt = Array.isArray(res.data) ? res.data.length : 0;
        return { count: cnt, data: opts.head ? null : res.data, error: null } as any;
      }
      let data = res.data;
      if (this._order && Array.isArray(data)) {
        data = data.sort((a: any, b: any) => {
          if (!a || !b) return 0;
          const col = this._order!.column;
          const va = a[col];
          const vb = b[col];
          if (va === vb) return 0;
          if (this._order!.ascending) return va > vb ? 1 : -1;
          return va < vb ? 1 : -1;
        });
      }
      if (this._limit && Array.isArray(data)) data = data.slice(0, this._limit);
      return { data, error: null, count: Array.isArray(data) ? data.length : undefined } as any;
    } catch (e) {
      return { data: null, error: e };
    }
  }

  async maybeSingle() {
    const res = await this.select();
    if (res.error) return res;
    const data = Array.isArray(res.data) ? (res.data[0] ?? null) : res.data;
    return { data, error: null };
  }

  async insert(payload: any) {
    try {
      const body = Array.isArray(payload) ? payload : [payload];
      const res = await apiFetch(`${this.table}`, { method: 'POST', body: JSON.stringify(body) });
      return { data: res.data, error: res.error };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  async update(payload: any) {
    try {
      if (this._eqField && this._eqField === 'id' && this._eqValue != null) {
        const res = await apiFetch(`${this.table}/${this._eqValue}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        return { data: res.data, error: res.error };
      }
      // fallback: send PATCH to table root
      const res = await apiFetch(`${this.table}`, { method: 'PATCH', body: JSON.stringify(payload) });
      return { data: res.data, error: res.error };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  async delete() {
    try {
      if (this._eqField && this._eqField === 'id' && this._eqValue != null) {
        const res = await apiFetch(`${this.table}/${this._eqValue}`, { method: 'DELETE' });
        return { data: res.data, error: res.error };
      }
      const res = await apiFetch(`${this.table}`, { method: 'DELETE' });
      return { data: res.data, error: res.error };
    } catch (e) {
      return { data: null, error: e };
    }
  }
}

const auth = {
  signUp: async (payload: any) => {
    const res = await apiFetch('auth/signup', { method: 'POST', body: JSON.stringify(payload) });
    return { data: res.data, error: res.error };
  },
  admin: {
    deleteUser: async (id: string) => {
      const res = await apiFetch(`auth/users/${id}`, { method: 'DELETE' });
      return { error: res.error };
    },
  },
};

export const supabase: any = {
  from: (table: string) => new QueryBuilder(table),
  auth,
};

export default supabase;
