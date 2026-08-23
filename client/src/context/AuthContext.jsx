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

  // Try to restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const storedRefresh = getStoredRefreshToken();
      if (!storedRefresh) {
        // Check legacy localStorage user
        try {
          const legacyUser = JSON.parse(localStorage.getItem('elevate_user'));
          if (legacyUser) {
            // Clear legacy and let user re-login with real backend
            localStorage.removeItem('elevate_user');
          }
        } catch {}
        setLoading(false);
        return;
      }

      try {
        // Try to refresh the access token
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: storedRefresh }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setTokens(refreshData.data.accessToken, refreshData.data.refreshToken);

          // Get user profile
          const meRes = await api.auth.getMe();
          const userData = meRes.data;
          setUser(userData);
          localStorage.setItem('elevate_user', JSON.stringify(userData));
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  const login = useCallback(async (credentials, maybePassword) => {
    const payload = typeof credentials === 'object' ? credentials : { identifier: credentials, password: maybePassword };
    const res = await api.auth.login(payload);
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

  const verifyOtpAndRegister = useCallback(async (data) => {
    const res = await api.auth.verifyOtp(data);
    setTokens(res.data.accessToken, res.data.refreshToken);
    const userData = res.data.user;
    setUser(userData);
    localStorage.setItem('elevate_user', JSON.stringify(userData));
    return userData;
  }, []);

  const loginWithGoogle = useCallback(async (profile) => {
    const res = await api.auth.google(profile || {
      email: 'alex.rivers@gmail.com',
      firstName: 'Alex',
      lastName: 'Rivers',
      avatar: null,
    });
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
      // Logout even if API call fails
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

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    login,
    register,
    verifyOtpAndRegister,
    loginWithGoogle,
    logout,
    updateUser,
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
