import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('caza_token');
    const storedUser = localStorage.getItem('caza_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('caza_token');
        localStorage.removeItem('caza_user');
      }
    }
    setIsLoading(false);
  }, []);

  const persistSession = (authResponse: AuthResponse) => {
    const userData: User = {
      id: authResponse.userId,
      nombre: authResponse.nombre,
      correo: authResponse.correo,
      rol: authResponse.rol,
      saldo: authResponse.saldo,
      fechaRegistro: new Date().toISOString(),
      activo: true,
    };
    localStorage.setItem('caza_token', authResponse.accessToken);
    localStorage.setItem('caza_user', JSON.stringify(userData));
    setToken(authResponse.accessToken);
    setUser(userData);
  };

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data);
    persistSession(response);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await authApi.register(data);
    persistSession(response);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('caza_token');
    localStorage.removeItem('caza_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const updateBalance = useCallback((newBalance: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, saldo: newBalance };
      localStorage.setItem('caza_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

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
        updateBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
