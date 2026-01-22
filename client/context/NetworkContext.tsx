import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { offlineService, OfflineAction } from '@/lib/offlineService';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isSyncing: boolean;
  pendingActions: number;
  lastSyncTime: number | null;
  lastSyncDisplay: string;
  syncNow: () => Promise<void>;
  queueOfflineAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  isSyncing: false,
  pendingActions: 0,
  lastSyncTime: null,
  lastSyncDisplay: 'Never synced',
  syncNow: async () => {},
  queueOfflineAction: async () => {},
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingActions, setPendingActions] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [lastSyncDisplay, setLastSyncDisplay] = useState('Never synced');

  useEffect(() => {
    const initOffline = async () => {
      await offlineService.initialize();
      setPendingActions(offlineService.getQueueCount());
      const syncTime = await offlineService.getLastSyncTime();
      setLastSyncTime(syncTime);
      setLastSyncDisplay(offlineService.getTimeSinceLastSync(syncTime));
    };

    initOffline();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastSyncDisplay(offlineService.getTimeSinceLastSync(lastSyncTime));
    }, 60000);

    return () => clearInterval(interval);
  }, [lastSyncTime]);

  const syncNow = useCallback(async () => {
    if (!isConnected || isSyncing) return;

    setIsSyncing(true);

    try {
      const queue = offlineService.getQueue();
      
      for (const action of queue) {
        try {
          console.log(`Syncing action: ${action.type} ${action.endpoint}`);
          await offlineService.removeFromQueue(action.id);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
        }
      }

      await offlineService.setLastSyncTime();
      const syncTime = await offlineService.getLastSyncTime();
      setLastSyncTime(syncTime);
      setLastSyncDisplay(offlineService.getTimeSinceLastSync(syncTime));
      setPendingActions(offlineService.getQueueCount());

      await offlineService.clearExpiredCache();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, isSyncing]);

  const queueOfflineAction = useCallback(async (
    action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>
  ) => {
    await offlineService.addToQueue(action);
    setPendingActions(offlineService.getQueueCount());
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasDisconnected = !isConnected;
      const nowConnected = state.isConnected ?? true;
      
      setIsConnected(nowConnected);
      setIsInternetReachable(state.isInternetReachable);

      if (wasDisconnected && nowConnected && offlineService.getQueueCount() > 0) {
        syncNow();
      }
    });

    return () => unsubscribe();
  }, [isConnected, syncNow]);

  return (
    <NetworkContext.Provider 
      value={{ 
        isConnected, 
        isInternetReachable,
        isSyncing,
        pendingActions,
        lastSyncTime,
        lastSyncDisplay,
        syncNow,
        queueOfflineAction,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
