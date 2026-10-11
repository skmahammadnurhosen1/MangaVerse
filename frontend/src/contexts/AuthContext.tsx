import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';

interface AuthContextType {
  user: User | null;
  admin: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, passwordConfirm: string) => Promise<void>;
  logout: () => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  adminLogout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const current = await authService.getMe();
      setUser(current);
    } catch {
      setUser(null);
    }
  };

  const refreshAdmin = async () => {
    try {
      const current = await adminService.getMe();
      setAdmin(current);
    } catch {
      setAdmin(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await Promise.allSettled([refreshUser(), refreshAdmin()]);
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    setUser(res.user);
  };

  const register = async (username: string, email: string, password: string, passwordConfirm: string) => {
    const res = await authService.register({ username, email, password, passwordConfirm });
    setUser(res.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const adminLogin = async (email: string, password: string) => {
    const res = await adminService.login({ email, password });
    setAdmin(res.admin);
  };

  const adminLogout = async () => {
    await adminService.logout();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        isLoading,
        login,
        register,
        logout,
        adminLogin,
        adminLogout,
        refreshUser,
        refreshAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
