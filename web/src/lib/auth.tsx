import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../api/client';
import { tokenStore } from './tokenStore';

interface AuthState {
  isAuthed: boolean;
  ready: boolean;
  orgId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    name: string;
    orgName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setOrg: (id: string) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(tokenStore.getOrgId());

  // On load, try to silently restore a session via the refresh cookie.
  useEffect(() => {
    api
      .post('/auth/refresh')
      .then((r) => {
        tokenStore.set(r.data.data.accessToken);
        setIsAuthed(true);
      })
      .catch(() => setIsAuthed(false))
      .finally(() => setReady(true));
  }, []);

  function applyAuth(data: { accessToken: string; orgId?: string }) {
    tokenStore.set(data.accessToken);
    if (data.orgId) {
      tokenStore.setOrgId(data.orgId);
      setOrgId(data.orgId);
    }
    setIsAuthed(true);
  }

  const value: AuthState = {
    isAuthed,
    ready,
    orgId,
    async login(email, password) {
      const r = await api.post('/auth/login', { email, password });
      applyAuth(r.data.data);
    },
    async register(input) {
      const r = await api.post('/auth/register', input);
      applyAuth(r.data.data);
    },
    async logout() {
      await api.post('/auth/logout').catch(() => undefined);
      tokenStore.set(null);
      tokenStore.setOrgId(null);
      setIsAuthed(false);
      setOrgId(null);
    },
    setOrg(id) {
      tokenStore.setOrgId(id);
      setOrgId(id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
