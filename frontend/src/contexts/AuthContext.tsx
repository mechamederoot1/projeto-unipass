import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  updateUser: (userData: { name?: string; email?: string; phone?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          // Token is invalid, clear it
          apiService.clearAuthToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      const { access_token } = response;
      
      apiService.setAuthToken(access_token);
      
      // Get user data
      const userData = await apiService.getCurrentUser();
      setUser(userData);
      
      // Store user data for offline access
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    try {
      await apiService.register(userData);
      
      // Auto-login after registration
      await login(userData.email, userData.password);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = () => {
    apiService.clearAuthToken();
    setUser(null);
  };

  const updateUser = async (userData: { 
    name?: string; 
    email?: string; 
    phone?: string; 
  }) => {
    try {
      const updatedUser = await apiService.updateUser(userData);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Update failed');
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateUser,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
