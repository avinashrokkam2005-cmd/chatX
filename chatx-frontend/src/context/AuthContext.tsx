import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { UserSummary, AuthResponse, ApiResponse } from '../types/auth';

interface AuthContextType {
  user: UserSummary | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('chatx_access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session on mount if token is present
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('chatx_access_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get<ApiResponse<UserSummary>>('/auth/me');
        if (response.data.success && response.data.data) {
          setUser(response.data.data);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Failed to restore user session:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      usernameOrEmail,
      password,
    });

    const authData = response.data.data;
    localStorage.setItem('chatx_access_token', authData.accessToken);
    localStorage.setItem('chatx_refresh_token', authData.refreshToken);
    setToken(authData.accessToken);
    setUser(authData.user);
  };

  const register = async (username: string, email: string, password: string, displayName?: string) => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      username,
      email,
      password,
      displayName: displayName?.trim() || username,
    });

    const authData = response.data.data;
    localStorage.setItem('chatx_access_token', authData.accessToken);
    localStorage.setItem('chatx_refresh_token', authData.refreshToken);
    setToken(authData.accessToken);
    setUser(authData.user);
  };

  const logout = () => {
    localStorage.removeItem('chatx_access_token');
    localStorage.removeItem('chatx_refresh_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
