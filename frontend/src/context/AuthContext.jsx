import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiService } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiService.getCurrentUser();
      setUser(res.data.user);
      setPermissions(res.data.permissions || []);
    } catch (err) {
      // 401 is already handled in apiClient interceptor (clears localStorage + redirects)
      if (err.response?.status !== 401) {
        console.error('Failed to fetch current user:', err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const updateUserRole = useCallback((newRole) => {
    setUser((prev) => prev ? { ...prev, role: newRole } : prev);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    setUser(null);
    setPermissions([]);
    window.location.href = '/';
  }, []);

  const value = {
    user,
    permissions,
    loading,
    isAdmin: user?.role === 'admin',
    isAnalyst: user?.role === 'analyst',
    isViewer: !user?.role || user?.role === 'viewer',
    isAuthenticated: !!user,
    fetchCurrentUser,
    updateUserRole,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
