// Small fetch wrapper for the KaamSetu API: bearer token, one automatic token refresh on 401, friendly errors.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

const ACCESS_KEY = 'ks-access';
const REFRESH_KEY = 'ks-refresh';
export const SIGNED_OUT_EVENT = 'ks:signed-out';

function read(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage can be blocked; the session then lasts only until reload */
  }
}

export const tokens = {
  get access() {
    return read(ACCESS_KEY);
  },
  get refresh() {
    return read(REFRESH_KEY);
  },
  set(access: string, refresh?: string) {
    write(ACCESS_KEY, access);
    if (refresh) write(REFRESH_KEY, refresh);
  },
  clear() {
    write(ACCESS_KEY, null);
    write(REFRESH_KEY, null);
  },
};

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type ErrorBody = {
  error?: { message?: string; code?: string } | string;
  message?: string;
  code?: string;
};

async function toApiError(res: Response): Promise<ApiError> {
  let body: ErrorBody | null = null;
  try {
    body = (await res.json()) as ErrorBody;
  } catch {
    /* not JSON */
  }
  const nested = body && typeof body.error === 'object' ? body.error : undefined;
  const message =
    nested?.message ??
    (typeof body?.error === 'string' ? body.error : undefined) ??
    body?.message ??
    `Request failed (${res.status})`;
  const code = nested?.code ?? body?.code;
  return new ApiError(res.status, message, code);
}

let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokens.refresh;
  if (!refreshToken) return false;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as { accessToken: string; refreshToken: string };
        tokens.set(data.accessToken, data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Send the bearer token (default true). Use false for login calls. */
  auth?: boolean;
};

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { body, auth = true } = options;
  const method = options.method ?? (body === undefined ? 'GET' : 'POST');

  const send = () =>
    fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res: Response;
  try {
    res = await send();
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check that the API is running.', 'NETWORK');
  }

  if (res.status === 401 && auth && tokens.refresh) {
    if (await refreshTokens()) {
      try {
        res = await send();
      } catch {
        throw new ApiError(0, 'Cannot reach the server. Check that the API is running.', 'NETWORK');
      }
    } else {
      tokens.clear();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
    }
  }

  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}
