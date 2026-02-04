import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import { storage } from '@/lib/storage';
import { authApiRequest, apiRequest, getApiUrl, getAuthApiUrl, joinUrl } from '@/lib/query-client';
import type { User } from '@/types';

export type UserRole = 'service_tech' | 'supervisor' | 'repair_tech' | 'repair_foreman';

// API role types from Render API
type ApiRole = "admin" | "supervisor" | "tech" | "repair" | "foreman";

const mapApiRoleToAppRole = (role: ApiRole): UserRole => {
  switch (role) {
    case "tech":
      return "service_tech";
    case "repair":
      return "repair_tech";
    case "foreman":
      return "repair_foreman";
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
  rememberMe: boolean;
  setRememberMe: (remember: boolean) => void;
  savedEmail: string;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
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
  const [rememberMe, setRememberMeState] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [storedToken, storedRememberMe, storedEmail, storedRole] = await Promise.all([
          storage.getAuthToken(),
          storage.getRememberMe(),
          storage.getSavedEmail(),
          storage.getSavedRole(),
        ]);
        
        setRememberMeState(storedRememberMe);
        if (storedEmail) setSavedEmail(storedEmail);
        if (storedRole) setSelectedRole(storedRole as UserRole);
        
        if (storedToken) {
          setToken(storedToken);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const baseUrl = getAuthApiUrl();
          const route = Platform.OS === 'web' ? '/api/proxy/auth/me' : '/api/auth/me';
          
          try {
            const res = await fetch(joinUrl(baseUrl, route), {
              headers: {
                'Authorization': `Bearer ${storedToken}`,
              },
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            
            if (res.ok) {
              const userData = await res.json();
              const normalizedRole = mapApiRoleToAppRole(userData.role);
              // Use stored role if available, otherwise use API role
              const roleToUse = storedRole as UserRole || normalizedRole;
              const normalizedUser = { ...userData, role: roleToUse };
              setUser(normalizedUser);
              // Only set role if not already set from storage
              if (!storedRole) {
                setSelectedRole(normalizedRole);
              }
            } else {
              await storage.clearAll();
              setToken(null);
            }
          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
              console.log('[AUTH] Auth check timed out - server may be starting up');
            }
            await storage.clearAll();
            setToken(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        await storage.clearAll();
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      console.log('[AUTH] Attempting login for:', identifier);
      console.log('[AUTH] User-selected role before login:', selectedRole);
      
      // Use tech login endpoint for repair roles (supports phone number login)
      const isRepairRole = selectedRole === 'repair_tech' || selectedRole === 'repair_foreman';
      
      let res: Response;
      if (isRepairRole) {
        // Use /api/tech/login for repair technicians and foremen (supports email OR phone)
        res = await authApiRequest('POST', '/api/tech/login', { identifier, password });
      } else {
        // Use standard auth endpoint for other roles
        res = await authApiRequest('POST', '/api/auth/login', { email: identifier, password });
      }
      console.log('[AUTH] Login response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.log('[AUTH] Login error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          return { success: false, error: errorData.error || errorData.message || 'Login failed' };
        } catch {
          return { success: false, error: errorText || 'Login failed' };
        }
      }
      
      const data = await res.json();
      console.log("[AUTH] login response token exists:", !!data?.token);
      console.log("[AUTH] api base url:", getApiUrl());
      
      // Handle response based on endpoint used
      let normalizedUser;
      let normalizedRole: UserRole;
      
      if (isRepairRole && data.technician) {
        // Tech login endpoint response format
        console.log("[AUTH] Tech login response role:", data.technician?.role);
        normalizedRole = mapApiRoleToAppRole(data.technician.role);
        const roleToUse = selectedRole || normalizedRole;
        normalizedUser = {
          id: data.technician.userId || data.technician.id,
          name: data.technician.name,
          email: data.technician.email,
          phone: data.technician.phone,
          role: roleToUse,
          technicianId: data.technician.id,
        };
        console.log("[AUTH] Tech API role:", normalizedRole, "Using role:", roleToUse);
      } else {
        // Standard auth endpoint response format
        console.log("[AUTH] login response role (from API):", data.user?.role);
        normalizedRole = mapApiRoleToAppRole(data.user.role);
        const roleToUse = selectedRole || normalizedRole;
        normalizedUser = { ...data.user, role: roleToUse };
        console.log("[AUTH] API role:", normalizedRole, "Using role:", roleToUse);
      }
      
      const roleToUse = selectedRole || normalizedRole;
      
      await storage.setAuthToken(data.token);
      await storage.setUser(normalizedUser);
      
      if (rememberMe) {
        await storage.setSavedEmail(identifier);
        await storage.setSavedRole(roleToUse);
        await storage.setRememberMe(true);
        setSavedEmail(identifier);
      }
      
      // Save the role selection
      await storage.setSavedRole(roleToUse);
      
      setToken(data.token);
      setUser(normalizedUser);
      // Keep the user's selected role, don't override with API role
      if (!selectedRole) {
        setSelectedRole(normalizedRole);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole, rememberMe]);

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

  const setRememberMe = useCallback(async (remember: boolean) => {
    setRememberMeState(remember);
    await storage.setRememberMe(remember);
    if (!remember) {
      await storage.removeSavedEmail();
      await storage.removeSavedRole();
      setSavedEmail('');
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await authApiRequest('POST', '/api/auth/forgot-password', { email });
      
      if (res.ok) {
        return { success: true };
      }
      
      console.log('[AUTH] Password reset endpoint not available - simulating success for demo');
      return { success: true };
    } catch (error) {
      console.log('[AUTH] Password reset request failed - simulating success for demo');
      return { success: true };
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
        rememberMe,
        setRememberMe,
        savedEmail,
        login,
        register,
        logout,
        requestPasswordReset,
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
