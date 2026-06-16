type QueryResponse<T = any> = {
  data: T | null;
  error: Error | null;
  count?: number | null;
};

type Listener = (event: string, session: any) => void;

const TOKEN_KEY = 'medicare_jwt';
const listeners = new Set<Listener>();

class ApiQuery {
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private body: unknown;
  private params = new URLSearchParams();

  constructor(private table: string) {}

  select(columns = '*', options?: { count?: 'exact' }) {
    this.action = this.body ? this.action : 'select';
    this.params.set('select', columns);
    if (options?.count) this.params.set('count', options.count);
    return this;
  }

  insert(body: unknown) {
    this.action = 'insert';
    this.body = body;
    return this;
  }

  update(body: unknown) {
    this.action = 'update';
    this.body = body;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this.params.set(`filter_${column}`, `eq.${String(value)}`);
    return this;
  }

  gte(column: string, value: unknown) {
    this.params.set(`filter_${column}`, `gte.${String(value)}`);
    return this;
  }

  lt(column: string, value: unknown) {
    this.params.set(`filter_${column}`, `lt.${String(value)}`);
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    this.params.set(`filter_${column}`, `not.${operator}.${String(value)}`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.params.set('order', `${column}.${options?.ascending === false ? 'desc' : 'asc'}`);
    return this;
  }

  limit(value: number) {
    this.params.set('limit', String(value));
    return this;
  }

  single() {
    this.params.set('single', 'true');
    return this;
  }

  then<TResult1 = QueryResponse, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null) {
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null) {
    return this.execute().finally(onfinally || undefined);
  }

  private async execute(): Promise<QueryResponse> {
    try {
      const method = this.action === 'insert' ? 'POST' : this.action === 'update' ? 'PATCH' : this.action === 'delete' ? 'DELETE' : 'GET';
      const response = await fetch(`/api/${this.table}?${this.params.toString()}`, {
        method,
        headers: authHeaders(this.body !== undefined),
        body: this.body !== undefined ? JSON.stringify(this.body) : undefined,
      });
      const payload = await response.json();
      if (!response.ok) throw Object.assign(new Error(payload.error || 'Request failed'), { code: payload.code });
      return { data: payload.data, count: payload.count ?? null, error: null };
    } catch (error) {
      return { data: null, count: null, error: error as Error };
    }
  }
}

export const supabase = {
  from(table: string) {
    return new ApiQuery(table);
  },
  auth: {
    async getSession() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return { data: { session: null } };
      const response = await fetch('/api/auth/me', { headers: authHeaders(false) });
      if (!response.ok) {
        localStorage.removeItem(TOKEN_KEY);
        return { data: { session: null } };
      }
      const data = await response.json();
      return { data: { session: data.session } };
    },
    onAuthStateChange(callback: Listener) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
      };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      return authenticate('/api/auth/login', { email, password });
    },
    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: any } }) {
      return authenticate('/api/auth/signup', {
        email,
        password,
        role: options?.data?.role,
        firstName: options?.data?.first_name,
        lastName: options?.data?.last_name,
      });
    },
    async signOut() {
      localStorage.removeItem(TOKEN_KEY);
      notify('SIGNED_OUT', null);
    },
  },
};

async function authenticate(url: string, body: unknown) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Authentication failed');
    localStorage.setItem(TOKEN_KEY, payload.session.access_token);
    notify('SIGNED_IN', payload.session);
    return { data: payload, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

function authHeaders(hasBody: boolean) {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (hasBody) headers['Content-Type'] = 'application/json';
  return headers;
}

function notify(event: string, session: any) {
  for (const listener of listeners) listener(event, session);
}
