import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setTokens, clearAuth, getStoredRefreshToken, setAuthChangeCallback } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register auth change callback
  useEffect(() => {
    setAuthChangeCallback((newUser) => {
      setUser(newUser);
    });
  }, []);

  // Restore real session on mount via refresh token + GET /api/auth/me
  useEffect(() => {
    const restoreSession = async () => {
      const storedRefresh = getStoredRefreshToken();
      if (!storedRefresh) {
        setLoading(false);
        return;
      }

      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefresh }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setTokens(refreshData.data.accessToken, refreshData.data.refreshToken);

          const meRes = await api.auth.getMe();
          const userData = meRes.data;
          setUser(userData);
          localStorage.setItem('elevate_user', JSON.stringify(userData));
        } else {
          clearAuth();
          setUser(null);
        }
      } catch {
        clearAuth();
        setUser(null);
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = useCallback(async (credentials, maybePassword) => {
    const payload = typeof credentials === 'object' ? credentials : { identifier: credentials, password: maybePassword };
    const res = await api.auth.login(payload);

    if (res.data?.mfaRequired) {
      return { mfaRequired: true, tempToken: res.data.tempToken, user: res.data.user };
    }

    setTokens(res.data.accessToken, res.data.refreshToken);
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('elevate_user', JSON.stringify(userData));
    return userData;
  }, []);

  const verifyMfa = useCallback(async ({ tempToken, code }) => {
    const res = await api.auth.mfaVerify({ tempToken, code });
    setTokens(res.data.accessToken, res.data.refreshToken);
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('elevate_user', JSON.stringify(userData));
    return userData;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.auth.register(data);
    setTokens(res.data.accessToken, res.data.refreshToken);
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('elevate_user', JSON.stringify(userData));
    return userData;
  }, []);

  const loginWithGoogle = useCallback(async (credentialPayload) => {
    const payload = typeof credentialPayload === 'string'
      ? { credential: credentialPayload }
      : credentialPayload;

    if (!payload?.credential) {
      throw new Error('Google credential token is required.');
    }

    const res = await api.auth.google(payload);
    if (res.data?.mfaRequired) {
      return { mfaRequired: true, tempToken: res.data.tempToken, user: res.data.user };
    }

    setTokens(res.data.accessToken, res.data.refreshToken);
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('elevate_user', JSON.stringify(userData));
    return userData;
  }, []);

  const loginWithApple = useCallback(async (payload) => {
    const res = await api.auth.apple(payload);
    if (res.data?.mfaRequired) {
      return { mfaRequired: true, tempToken: res.data.tempToken, user: res.data.user };
    }
    setTokens(res.data.accessToken, res.data.refreshToken);
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('elevate_user', JSON.stringify(userData));
    return userData;
  }, []);

  const loginWithMicrosoft = useCallback(async (payload) => {
    const res = await api.auth.microsoft(payload);
    if (res.data?.mfaRequired) {
      return { mfaRequired: true, tempToken: res.data.tempToken, user: res.data.user };
    }
    setTokens(res.data.accessToken, res.data.refreshToken);
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('elevate_user', JSON.stringify(userData));
    return userData;
  }, []);

  const loginWithPhoneVerify = useCallback(async ({ phone, code }) => {
    const res = await api.auth.phoneVerifyOtp({ phone, code });
    if (res.data?.mfaRequired) {
      return { mfaRequired: true, tempToken: res.data.tempToken, user: res.data.user };
    }
    setTokens(res.data.accessToken, res.data.refreshToken);
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('elevate_user', JSON.stringify(userData));
    return userData;
  }, []);

  const loginWithEmailOtpVerify = useCallback(async ({ email, otp }) => {
    const res = await api.auth.emailOtpVerify({ email, otp });
    if (res.data?.mfaRequired) {
      return { mfaRequired: true, tempToken: res.data.tempToken, user: res.data.user };
    }
    setTokens(res.data.accessToken, res.data.refreshToken);
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('elevate_user', JSON.stringify(userData));
    return userData;
  }, []);

  const loginWithMagicLinkVerify = useCallback(async ({ email, token }) => {
    const res = await api.auth.magicLinkVerify({ email, token });
    if (res.data?.mfaRequired) {
      return { mfaRequired: true, tempToken: res.data.tempToken, user: res.data.user };
    }
    setTokens(res.data.accessToken, res.data.refreshToken);
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('elevate_user', JSON.stringify(userData));
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Local clean even if network failure
    }
    clearAuth();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (data) => {
    const res = await api.auth.updateMe(data);
    const userData = res.data;
    setUser(userData);
    localStorage.setItem('elevate_user', JSON.stringify(userData));
    return userData;
  }, []);

  const changePassword = useCallback(async (passwordData) => {
    const res = await api.auth.changePassword(passwordData);
    const meRes = await api.auth.getMe();
    setUser(meRes.data);
    return res;
  }, []);

  const setPassword = useCallback(async (passwordData) => {
    const res = await api.auth.setPassword(passwordData);
    const meRes = await api.auth.getMe();
    setUser(meRes.data);
    return res;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    verifyMfa,
    register,
    loginWithGoogle,
    loginWithApple,
    loginWithMicrosoft,
    loginWithPhoneVerify,
    loginWithEmailOtpVerify,
    loginWithMagicLinkVerify,
    logout,
    updateUser,
    changePassword,
    setPassword,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
