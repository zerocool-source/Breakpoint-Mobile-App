import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { User, Job, Estimate, Property, RouteStop, ChatMessage } from '@/types';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  JOBS: 'jobs',
  ESTIMATES: 'estimates',
  PROPERTIES: 'properties',
  ROUTE_STOPS: 'route_stops',
  CHAT_MESSAGES: 'chat_messages',
  OFFLINE_QUEUE: 'offline_queue',
};

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export const storage = {
  async setAuthToken(token: string): Promise<void> {
    await secureSet(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async getAuthToken(): Promise<string | null> {
    return secureGet(STORAGE_KEYS.AUTH_TOKEN);
  },

  async removeAuthToken(): Promise<void> {
    await secureDelete(STORAGE_KEYS.AUTH_TOKEN);
  },

  async setUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  },

  async setJobs(jobs: Job[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
  },

  async getJobs(): Promise<Job[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.JOBS);
    return data ? JSON.parse(data) : [];
  },

  async setEstimates(estimates: Estimate[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(estimates));
  },

  async getEstimates(): Promise<Estimate[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ESTIMATES);
    return data ? JSON.parse(data) : [];
  },

  async setProperties(properties: Property[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(properties));
  },

  async getProperties(): Promise<Property[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PROPERTIES);
    return data ? JSON.parse(data) : [];
  },

  async setRouteStops(stops: RouteStop[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ROUTE_STOPS, JSON.stringify(stops));
  },

  async getRouteStops(): Promise<RouteStop[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ROUTE_STOPS);
    return data ? JSON.parse(data) : [];
  },

  async setChatMessages(messages: ChatMessage[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
  },

  async getChatMessages(): Promise<ChatMessage[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    return data ? JSON.parse(data) : [];
  },

  async addToOfflineQueue(action: unknown): Promise<void> {
    const queue = await this.getOfflineQueue();
    queue.push(action);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },

  async getOfflineQueue(): Promise<unknown[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  },

  async clearOfflineQueue(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  },

  async clearAll(): Promise<void> {
    await Promise.all([
      this.removeAuthToken(),
      this.removeUser(),
      AsyncStorage.multiRemove([
        STORAGE_KEYS.JOBS,
        STORAGE_KEYS.ESTIMATES,
        STORAGE_KEYS.PROPERTIES,
        STORAGE_KEYS.ROUTE_STOPS,
        STORAGE_KEYS.CHAT_MESSAGES,
        STORAGE_KEYS.OFFLINE_QUEUE,
      ]),
    ]);
  },
};
