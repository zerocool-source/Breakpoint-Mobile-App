import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_QUEUE_KEY = '@breakpoint_offline_queue';
const OFFLINE_CACHE_KEY = '@breakpoint_offline_cache';
const LAST_SYNC_KEY = '@breakpoint_last_sync';

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  timestamp: number;
  retryCount: number;
}

export interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

class OfflineService {
  private queue: OfflineAction[] = [];
  private cache: Map<string, CachedData> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const [queueData, cacheData] = await Promise.all([
        AsyncStorage.getItem(OFFLINE_QUEUE_KEY),
        AsyncStorage.getItem(OFFLINE_CACHE_KEY),
      ]);

      if (queueData) {
        this.queue = JSON.parse(queueData);
      }

      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        this.cache = new Map(Object.entries(parsed));
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize offline service:', error);
    }
  }

  async addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const newAction: OfflineAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(newAction);
    await this.persistQueue();
  }

  async removeFromQueue(actionId: string): Promise<void> {
    this.queue = this.queue.filter(action => action.id !== actionId);
    await this.persistQueue();
  }

  getQueue(): OfflineAction[] {
    return [...this.queue];
  }

  getQueueCount(): number {
    return this.queue.length;
  }

  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.persistQueue();
  }

  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }

  async cacheData(key: string, data: any, ttlMinutes: number = 60): Promise<void> {
    const cached: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    };

    this.cache.set(key, cached);
    await this.persistCache();
  }

  getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      this.persistCache();
      return null;
    }

    return cached.data as T;
  }

  async clearExpiredCache(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((value, key) => {
      if (now > value.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      await this.persistCache();
    }
  }

  async clearAllCache(): Promise<void> {
    this.cache.clear();
    await this.persistCache();
  }

  private async persistCache(): Promise<void> {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      await AsyncStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Failed to persist cache:', error);
    }
  }

  async setLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to set last sync time:', error);
    }
  }

  async getLastSyncTime(): Promise<number | null> {
    try {
      const time = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return time ? parseInt(time, 10) : null;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  getTimeSinceLastSync(lastSyncTime: number | null): string {
    if (!lastSyncTime) return 'Never synced';
    
    const diff = Date.now() - lastSyncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }
}

export const offlineService = new OfflineService();

export const CACHE_KEYS = {
  JOBS: 'jobs',
  ASSIGNMENTS: 'assignments',
  PROPERTIES: 'properties',
  CUSTOMERS: 'customers',
  ESTIMATES: 'estimates',
  INSPECTIONS: 'inspections',
  INVENTORY: 'inventory',
  TECHNICIANS: 'technicians',
  EMERGENCIES: 'emergencies',
  ROUTES: 'routes',
  USER_PROFILE: 'user_profile',
};
