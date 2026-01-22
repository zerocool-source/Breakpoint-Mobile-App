import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { storage } from '@/lib/storage';
import { authApiRequest, getApiUrl } from '@/lib/query-client';
import type { User } from '@/types';

export type UserRole = 'service_tech' | 'supervisor' | 'repair_tech' | 'repair_foreman';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const roleNames: Record<UserRole, string> = {
  service_tech: 'Service Technician',
  supervisor: 'Supervisor',
  repair_tech: 'Repair Technician',
  repair_foreman: 'Repair Foreman',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await storage.getAuthToken();
        if (token) {
          const baseUrl = getApiUrl();
          const res = await fetch(`${baseUrl}api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setSelectedRole(userData.role);
          } else {
            await storage.clearAll();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        await storage.clearAll();
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const res = await authApiRequest('POST', '/api/auth/login', { email, password });
      
      if (!res.ok) {
        const errorData = await res.json();
        return { success: false, error: errorData.error || 'Login failed' };
      }
      
      const data = await res.json();
      
      await storage.setAuthToken(data.token);
      await storage.setUser(data.user);
      setUser(data.user);
      setSelectedRole(data.user.role);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    if (!selectedRole) {
      return { success: false, error: 'Please select a role first' };
    }
    
    try {
      setIsLoading(true);
      
      const res = await authApiRequest('POST', '/api/auth/register', { 
        email, 
        password, 
        name,
        role: selectedRole,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        return { success: false, error: errorData.error || 'Registration failed' };
      }
      
      const data = await res.json();
      
      await storage.setAuthToken(data.token);
      await storage.setUser(data.user);
      setUser(data.user);
      
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await storage.getAuthToken();
      if (token) {
        try {
          await authApiRequest('POST', '/api/auth/logout');
        } catch (e) {
          // Ignore logout API errors
        }
      }
      await storage.clearAll();
      setUser(null);
      setSelectedRole(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      setSelectedRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        selectedRole,
        setSelectedRole,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
