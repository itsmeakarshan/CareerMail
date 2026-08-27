import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('careermail_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('careermail_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('careermail_token');
      if (savedToken) {
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
          localStorage.setItem('careermail_user', JSON.stringify(currentUser));
        } catch {
          // Token expired or invalid
          localStorage.removeItem('careermail_token');
          localStorage.removeItem('careermail_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('careermail_token', res.token);
    const userData: User = {
      id: res.id,
      name: res.name,
      email: res.email,
      avatarUrl: res.avatarUrl,
    };
    localStorage.setItem('careermail_user', JSON.stringify(userData));
    setToken(res.token);
    setUser(userData);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password });
    localStorage.setItem('careermail_token', res.token);
    const userData: User = {
      id: res.id,
      name: res.name,
      email: res.email,
      avatarUrl: res.avatarUrl,
    };
    localStorage.setItem('careermail_user', JSON.stringify(userData));
    setToken(res.token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('careermail_token');
    localStorage.removeItem('careermail_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
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
