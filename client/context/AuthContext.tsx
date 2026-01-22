import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { storage } from '@/lib/storage';
import { mockUser } from '@/lib/mockData';
import type { User } from '@/types';

export type UserRole = 'service_tech' | 'supervisor' | 'repair_tech' | 'repair_foreman';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
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
    // Clear any cached auth data on app start so users always see role selection
    const initAuth = async () => {
      try {
        await storage.clearAll();
      } catch (error) {
        console.error('Failed to clear auth:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (email && password && selectedRole) {
        const loggedInUser: User = {
          ...mockUser,
          email,
          name: `Demo ${roleNames[selectedRole]}`,
          role: selectedRole,
        };
        await storage.setAuthToken('mock_token_' + Date.now());
        await storage.setUser(loggedInUser);
        setUser(loggedInUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
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
