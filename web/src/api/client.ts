import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStore } from '../lib/tokenStore';

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // send the refresh cookie
});

// Attach the access token and active org on every request.
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const orgId = tokenStore.getOrgId();
  if (orgId) config.headers['X-Org-Id'] = orgId;
  return config;
});

// On a 401, transparently try ONE refresh, then replay the original request.
let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const isAuthCall = original?.url?.includes('/auth/');
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshing ??= api
          .post('/auth/refresh')
          .then((r) => r.data.data.accessToken as string)
          .finally(() => {
            refreshing = null;
          });
        const newToken = await refreshing;
        tokenStore.set(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        tokenStore.set(null);
      }
    }
    return Promise.reject(error);
  },
);
