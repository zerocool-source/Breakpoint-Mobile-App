import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface UrgentAlert {
  id: string;
  title: string;
  message: string;
  type: 'urgent' | 'warning' | 'info';
  property?: string;
  timestamp: Date;
  isRead: boolean;
  details?: string;
}

interface UrgentAlertsContextType {
  alerts: UrgentAlert[];
  unreadCount: number;
  addAlert: (alert: Omit<UrgentAlert, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAlert: (id: string) => void;
  clearAll: () => void;
}

const UrgentAlertsContext = createContext<UrgentAlertsContextType | undefined>(undefined);

export function UrgentAlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<UrgentAlert[]>([]);

  const addAlert = useCallback((alert: Omit<UrgentAlert, 'id' | 'timestamp' | 'isRead'>) => {
    const newAlert: UrgentAlert = {
      ...alert,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false,
    };
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === id ? { ...alert, isRead: true } : alert
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  }, []);

  const clearAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
  }, []);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <UrgentAlertsContext.Provider
      value={{
        alerts,
        unreadCount,
        addAlert,
        markAsRead,
        markAllAsRead,
        clearAlert,
        clearAll,
      }}
    >
      {children}
    </UrgentAlertsContext.Provider>
  );
}

export function useUrgentAlerts() {
  const context = useContext(UrgentAlertsContext);
  if (context === undefined) {
    throw new Error('useUrgentAlerts must be used within an UrgentAlertsProvider');
  }
  return context;
}
