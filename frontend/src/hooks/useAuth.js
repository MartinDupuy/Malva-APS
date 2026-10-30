import { useState, useCallback } from 'react';
import { authService } from '../services/authService';

const TOKEN_KEY = 'malva_token';
const USER_KEY = 'malva_user';

export function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async ({ email, password }) => {
    const response = await authService.login({ email, password });
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    return response;
  }, []);

  const register = useCallback(async ({ name, email, password, role }) => {
    const response = await authService.register({ name, email, password, role });
    return response;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  return {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
  };
}
