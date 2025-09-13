import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
//import apiClient from '../api/axios';
import { jwtDecode } from 'jwt-decode'; // For decoding JWTs

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  // Add an update user method if tenant plan changes on frontend
  updateUser: (newUserData: Partial<User>) => void;
}

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  plan: 'FREE' | 'PRO'; // Add plan to user context
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token); // Decode token to get user info
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp > currentTime) {
          // Token is valid
          setIsAuthenticated(true);
          setUser({
            id: decodedToken.userId,
            email: decodedToken.email,
            role: decodedToken.role,
            tenantId: decodedToken.tenantId,
            tenantName: decodedToken.tenantName || decodedToken.tenantSlug, // Fallback if name not in old token
            tenantSlug: decodedToken.tenantSlug,
            plan: decodedToken.plan || 'FREE', // Default to FREE if plan not in token (will be updated on dashboard load)
          });
        } else {
          // Token expired
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error("Failed to decode token:", error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decodedToken: any = jwtDecode(token);
    setIsAuthenticated(true);
    setUser({
      id: decodedToken.userId,
      email: decodedToken.email,
      role: decodedToken.role,
      tenantId: decodedToken.tenantId,
      tenantName: decodedToken.tenantName || decodedToken.tenantSlug,
      tenantSlug: decodedToken.tenantSlug,
      plan: decodedToken.plan || 'FREE',
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  const updateUser = (newUserData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      return { ...prevUser, ...newUserData };
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};