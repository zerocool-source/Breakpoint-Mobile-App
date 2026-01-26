import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { storage } from '@/lib/storage';
import { authApiRequest, apiRequest, getApiUrl, joinUrl } from '@/lib/query-client';
import type { User } from '@/types';

export type UserRole = 'service_tech' | 'supervisor' | 'repair_tech' | 'repair_foreman';

// API role types from Render API
type ApiRole = "admin" | "supervisor" | "tech" | "repair";

const mapApiRoleToAppRole = (role: ApiRole): UserRole => {
  switch (role) {
    case "tech":
      return "service_tech";
    case "repair":
      return "repair_tech";
    case "supervisor":
      return "supervisor";
    case "admin":
      return "supervisor";
    default:
      return "service_tech";
  }
};

interface AuthContextType {
  user: User | null;
  token: string | null;
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = await storage.getAuthToken();
        if (storedToken) {
          setToken(storedToken);
          const res = await fetch(joinUrl(getApiUrl(), '/api/auth/me'), {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });
          
          if (res.ok) {
            const userData = await res.json();
            const normalizedRole = mapApiRoleToAppRole(userData.role);
            const normalizedUser = { ...userData, role: normalizedRole };
            setUser(normalizedUser);
            setSelectedRole(normalizedRole);
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
      console.log("[AUTH] login response token exists:", !!data?.token);
      console.log("[AUTH] login response role (from API):", data?.user?.role);
      console.log("[AUTH] api base url:", getApiUrl());
      
      // Normalize role from API to app role
      const normalizedRole = mapApiRoleToAppRole(data.user.role);
      const normalizedUser = { ...data.user, role: normalizedRole };
      console.log("[AUTH] normalized role:", normalizedRole);
      
      await storage.setAuthToken(data.token);
      const savedToken = await storage.getAuthToken();
      console.log("[AUTH] saved token exists:", !!savedToken);
      console.log("[AUTH] saved token prefix:", savedToken?.slice(0, 20));
      
      await storage.setUser(normalizedUser);
      setToken(data.token);
      setUser(normalizedUser);
      setSelectedRole(normalizedRole);
      
      // Test API call to verify token is being attached (temporary debug)
      try {
        const debugToken = await storage.getAuthToken();
        console.log("[AUTH] token used for requests exists:", !!debugToken);
        console.log("[AUTH] token prefix for requests:", debugToken?.slice(0, 20));
        const testRes = await apiRequest('GET', '/api/properties');
        const properties = await testRes.json();
        console.log('[AUTH] Token verification - properties fetched:', properties.length);
      } catch (testError) {
        console.log('[AUTH] Token verification failed:', testError);
      }
      
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
      setToken(data.token);
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
      setToken(null);
      setUser(null);
      setSelectedRole(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setToken(null);
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
        token,
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
