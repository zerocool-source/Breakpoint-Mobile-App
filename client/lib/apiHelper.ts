import NetInfo from '@react-native-community/netinfo';
import { Alert, Platform } from 'react-native';
import { storage } from './storage';
import { getLocalApiUrl, getApiUrl, getAuthApiUrl, joinUrl } from './query-client';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
  skipNetworkCheck?: boolean;
  showAlerts?: boolean;
  isAiRequest?: boolean;
}

const DEFAULT_TIMEOUT = 15000;
const AI_REQUEST_TIMEOUT = 60000;

export async function checkNetworkConnection(): Promise<boolean> {
  try {
    const netState = await NetInfo.fetch();
    return netState.isConnected ?? false;
  } catch {
    return true;
  }
}

export function getErrorMessage(status: number, defaultMessage?: string): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'Access denied. You don\'t have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 408:
      return 'Request timed out. The server may be busy, please try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again in a moment.';
    default:
      return defaultMessage || 'An unexpected error occurred. Please try again.';
  }
}

export async function handleUnauthorized(onLogout?: () => void): Promise<void> {
  await storage.clearAll();
  if (onLogout) {
    onLogout();
  }
}

export async function safeApiRequest<T = any>(
  route: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    timeoutMs = options.isAiRequest ? AI_REQUEST_TIMEOUT : DEFAULT_TIMEOUT,
    skipNetworkCheck = false,
    showAlerts = true,
  } = options;

  if (!skipNetworkCheck) {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      const errorMessage = 'No internet connection. Please check your network and try again.';
      if (showAlerts) {
        Alert.alert('Connection Error', errorMessage);
      }
      return { success: false, error: errorMessage, status: 0 };
    }
  }

  const apiUrl = getLocalApiUrl();
  const url = joinUrl(apiUrl, route);
  const token = await storage.getAuthToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorMessage = getErrorMessage(response.status);
      
      if (response.status === 401) {
        if (showAlerts) {
          Alert.alert('Session Expired', errorMessage);
        }
        return { success: false, error: errorMessage, status: 401 };
      }

      if (response.status === 403) {
        if (showAlerts) {
          Alert.alert('Access Denied', errorMessage);
        }
        return { success: false, error: errorMessage, status: 403 };
      }

      if (response.status >= 500) {
        if (showAlerts) {
          Alert.alert('Service Unavailable', errorMessage);
        }
        return { success: false, error: errorMessage, status: response.status };
      }

      return { success: false, error: errorMessage, status: response.status };
    }

    const contentType = response.headers.get('content-type');
    let data: T | undefined;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    }

    return { success: true, data, status: response.status };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      const errorMessage = options.isAiRequest
        ? 'AI request timed out. This can happen with complex queries. Please try again.'
        : 'Request timed out. The server may be starting up. Please try again.';
      if (showAlerts) {
        Alert.alert('Timeout', errorMessage);
      }
      return { success: false, error: errorMessage, status: 408 };
    }

    const errorMessage = 'Network error. Please check your connection and try again.';
    if (showAlerts) {
      Alert.alert('Network Error', errorMessage);
    }
    return { success: false, error: errorMessage, status: 0 };
  }
}

export async function safeAiRequest<T = any>(
  route: string,
  body: unknown,
  options: Omit<ApiRequestOptions, 'method' | 'body' | 'isAiRequest'> = {}
): Promise<ApiResponse<T>> {
  return safeApiRequest<T>(route, {
    ...options,
    method: 'POST',
    body,
    isAiRequest: true,
    timeoutMs: options.timeoutMs || AI_REQUEST_TIMEOUT,
  });
}

export async function fetchWithRetry<T = any>(
  route: string,
  options: ApiRequestOptions & { maxRetries?: number } = {}
): Promise<ApiResponse<T>> {
  const { maxRetries = 2, ...apiOptions } = options;
  let lastError: ApiResponse<T> = { success: false, error: 'Unknown error' };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await safeApiRequest<T>(route, {
      ...apiOptions,
      showAlerts: attempt === maxRetries,
    });

    if (result.success) {
      return result;
    }

    if (result.status === 401 || result.status === 403 || result.status === 404) {
      return result;
    }

    lastError = result;

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  return lastError;
}

export function showRetryAlert(
  title: string,
  message: string,
  onRetry: () => void,
  onCancel?: () => void
): void {
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Retry', onPress: onRetry },
    ]
  );
}

export interface UploadPhotoResponse {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  error?: string;
}

export async function uploadPhoto(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<UploadPhotoResponse> {
  const result = await safeApiRequest<UploadPhotoResponse>('/api/sync/upload-photo', {
    method: 'POST',
    body: {
      imageData: imageBase64,
      mimeType,
    },
    showAlerts: false,
    timeoutMs: 30000,
  });

  if (result.success && result.data) {
    return result.data;
  }

  return { success: false, error: result.error || 'Failed to upload photo' };
}

export async function uploadPhotos(
  photos: { uri: string; base64?: string; mimeType?: string }[]
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];

  const uploadPromises = photos.map(async (photo, index) => {
    try {
      let base64Data = photo.base64;
      
      if (!base64Data && photo.uri) {
        const FileSystem = require('expo-file-system');
        base64Data = await FileSystem.readAsStringAsync(photo.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      if (!base64Data) {
        errors.push(`Photo ${index + 1}: No image data available`);
        return null;
      }

      const result = await uploadPhoto(base64Data, photo.mimeType || 'image/jpeg');
      if (result.success && result.url) {
        return result.url;
      } else {
        errors.push(`Photo ${index + 1}: ${result.error || 'Upload failed'}`);
        return null;
      }
    } catch (error: any) {
      errors.push(`Photo ${index + 1}: ${error.message || 'Upload error'}`);
      return null;
    }
  });

  const results = await Promise.all(uploadPromises);
  results.forEach((url) => {
    if (url) urls.push(url);
  });

  return { urls, errors };
}
