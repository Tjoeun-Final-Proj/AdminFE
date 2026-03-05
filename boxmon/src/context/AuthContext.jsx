import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getAdminName } from '../api/auth';

const TOKEN_KEY_ACCESS = 'admin_access_token';
const TOKEN_KEY_REFRESH = 'admin_refresh_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(() => localStorage.getItem(TOKEN_KEY_ACCESS));
  const [refreshToken, setRefreshTokenState] = useState(() => localStorage.getItem(TOKEN_KEY_REFRESH));
  const [displayName, setDisplayNameState] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  const setTokens = useCallback((access, refresh) => {
    if (access) {
      localStorage.setItem(TOKEN_KEY_ACCESS, access);
      setAccessTokenState(access);
      setDisplayNameState(null); // 새 로그인 시 이전 이름 제거, useEffect에서 /me로 채움
    } else {
      localStorage.removeItem(TOKEN_KEY_ACCESS);
      setAccessTokenState(null);
      setDisplayNameState(null);
    }
    if (refresh) {
      localStorage.setItem(TOKEN_KEY_REFRESH, refresh);
      setRefreshTokenState(refresh);
    } else {
      localStorage.removeItem(TOKEN_KEY_REFRESH);
      setRefreshTokenState(null);
    }
  }, []);

  const logout = useCallback(() => {
    setTokens(null, null);
  }, [setTokens]);

  const isAuthenticated = Boolean(accessToken);

  useEffect(() => {
    if (accessToken) {
      getAdminName(accessToken)
        .then((name) => setDisplayNameState(name ?? null))
        .catch(() => setDisplayNameState(null));
    } else {
      setDisplayNameState(null);
    }
  }, [accessToken]);

  useEffect(() => {
    setIsChecking(false);
  }, []);

  const value = {
    accessToken,
    refreshToken,
    displayName,
    isAuthenticated,
    setTokens,
    logout,
    isChecking,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
