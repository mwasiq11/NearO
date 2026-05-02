const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const API_BASE_URL = `${baseUrl}/api`;

const ACCESS_TOKEN_KEY = 'nearo_access_token';
const REFRESH_TOKEN_KEY = 'nearo_refresh_token';
const USER_KEY = 'nearo_user';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  retry?: boolean;
}

export const authStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user: unknown) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearUser() {
    localStorage.removeItem(USER_KEY);
  },
};

async function refreshAccessToken() {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (data?.accessToken) {
    authStorage.setTokens(data.accessToken, refreshToken);
    return data.accessToken as string;
  }
  return null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, headers = {}, retry = false } = options;
  const requestHeaders: Record<string, string> = { ...headers };

  // Don't set Content-Type for FormData - browser will set it with boundary
  if (body !== undefined && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (auth) {
    const accessToken = authStorage.getAccessToken();
    if (accessToken) {
      requestHeaders.Authorization = `Bearer ${accessToken}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
  });

  if (response.status === 401 && auth && !retry) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      return request<T>(path, { ...options, retry: true });
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error || errorBody?.message || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get<T>(path: string, options: RequestOptions = {}) {
    return request<T>(path, { ...options, method: 'GET' });
  },
  post<T>(path: string, body?: unknown, options: RequestOptions = {}) {
    return request<T>(path, { ...options, method: 'POST', body });
  },
  put<T>(path: string, body?: unknown, options: RequestOptions = {}) {
    return request<T>(path, { ...options, method: 'PUT', body });
  },
  patch<T>(path: string, body?: unknown, options: RequestOptions = {}) {
    return request<T>(path, { ...options, method: 'PATCH', body });
  },
  delete<T>(path: string, body?: unknown, options: RequestOptions = {}) {
    return request<T>(path, { ...options, method: 'DELETE', body });
  },
};

export async function apiCall(path: string, options: RequestOptions = {}) {
  try {
    const data = await request<any>(path, options);
    return { ok: true, data };
  } catch (error: any) {
    return { ok: false, data: { error: error.message } };
  }
}

