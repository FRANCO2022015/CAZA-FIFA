import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { validateUser, validateToken } from '../utils/sessionValidation';
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

  // Never trust cached profile/role data. Resolve the identity through the API.
  useEffect(() => {
    let active = true;
    localStorage.removeItem('caza_user');
    const restore = async () => {
      try {
        const stored = localStorage.getItem('caza_token');
        if (!stored) return;
        const validToken = validateToken(stored);
        const fresh = validateUser(await authApi.getMe());
        if (active) { setToken(validToken); setUser(fresh); }
      } catch {
        // A failed restoration does not authorize the cached identity.
        if (active) { setToken(null); setUser(null); }
      } finally { if (active) setIsLoading(false); }
    };
    void restore();
    return () => { active = false; };
  }, []);

  const persistSession = (authResponse: AuthResponse) => {
    const validToken = validateToken(authResponse.accessToken);
    const userData = validateUser({
      id: authResponse.userId,
      nombre: authResponse.nombre,
      correo: authResponse.correo,
      rol: authResponse.rol,
      saldo: authResponse.saldo,
      fechaRegistro: new Date().toISOString(),
      activo: true,
    });
    localStorage.setItem('caza_token', validToken);
    setToken(validToken);
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
    if (!Number.isFinite(newBalance) || newBalance < 0) return;
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, saldo: newBalance };
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
