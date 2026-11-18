'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, SIGNED_OUT_EVENT, api, tokens } from './api';
import type { User } from './types';

type Status = 'loading' | 'authed' | 'guest';

type AuthContextValue = {
  user: User | null;
  status: Status;
  /** Call after OTP verification succeeds. */
  signIn: (accessToken: string, refreshToken: string, user: User) => void;
  /** Update the user (and optionally the access token, e.g. after choosing a role). */
  setSession: (user: User, accessToken?: string) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  // Restore the session on first load.
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!tokens.access && !tokens.refresh) {
        setStatus('guest');
        return;
      }
      try {
        const res = await api<{ user: User }>('/auth/me');
        if (cancelled) return;
        setUser(res.user);
        setStatus('authed');
      } catch (err) {
        if (cancelled) return;
        // If the API is simply down we keep the tokens so a reload can recover.
        if (!(err instanceof ApiError && err.code === 'NETWORK')) tokens.clear();
        setStatus('guest');
      }
    }
    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // The API client fires this when a token can no longer be refreshed.
  useEffect(() => {
    const onSignedOut = () => {
      setUser(null);
      setStatus('guest');
    };
    window.addEventListener(SIGNED_OUT_EVENT, onSignedOut);
    return () => window.removeEventListener(SIGNED_OUT_EVENT, onSignedOut);
  }, []);

  const signIn = useCallback((accessToken: string, refreshToken: string, nextUser: User) => {
    tokens.set(accessToken, refreshToken);
    setUser(nextUser);
    setStatus('authed');
  }, []);

  const setSession = useCallback((nextUser: User, accessToken?: string) => {
    if (accessToken) tokens.set(accessToken);
    setUser(nextUser);
    setStatus('authed');
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = tokens.refresh;
    try {
      await api('/auth/logout', { body: { refreshToken } });
    } catch {
      /* we sign out locally even if the server call fails */
    }
    tokens.clear();
    setUser(null);
    setStatus('guest');
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, setSession, signOut }),
    [user, status, signIn, setSession, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
