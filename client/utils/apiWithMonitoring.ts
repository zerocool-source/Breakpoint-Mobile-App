/**
 * API Wrapper with Debug Monitoring
 * Wraps all API calls to track performance, errors, and health
 */

import debugMonitor from './debugMonitor';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  timeout?: number;
}

interface APIResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  duration: number;
}

/**
 * Make an API request with full monitoring
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<APIResponse<T>> {
  const startTime = Date.now();
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const { timeout = 30000, ...fetchOptions } = options;

  // Get auth token
  const token = await AsyncStorage.getItem('auth_token');

  // Set up headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    // Log to debug monitor
    debugMonitor.logApiCall(endpoint, duration, response.ok);

    // Track slow requests
    if (duration > 3000) {
      debugMonitor.logEvent('slow_api_request', { endpoint, duration });
    }

    // Parse response
    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      // Log API error
      debugMonitor.logError({
        type: 'network',
        message: `API Error: ${response.status} ${response.statusText}`,
        context: {
          endpoint,
          status: response.status,
          duration,
          response: data,
        },
        handled: true,
      });

      return {
        data: null,
        error: data?.error || data?.message || `HTTP ${response.status}`,
        status: response.status,
        duration,
      };
    }

    return {
      data,
      error: null,
      status: response.status,
      duration,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    // Determine error type
    let errorMessage = error.message;
    let errorType: 'network' | 'auth' = 'network';

    if (error.name === 'AbortError') {
      errorMessage = `Request timeout after ${timeout}ms`;
    } else if (error.message.includes('Network request failed')) {
      errorMessage = 'Network connection failed';
    }

    // Log to debug monitor
    debugMonitor.logApiCall(endpoint, duration, false);
    debugMonitor.logError({
      type: errorType,
      message: errorMessage,
      context: { endpoint, duration },
      handled: true,
    });

    return {
      data: null,
      error: errorMessage,
      status: 0,
      duration,
    };
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(
  endpoint: string,
  options?: RequestOptions
): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T = any>(
  endpoint: string,
  body?: any,
  options?: RequestOptions
): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(
  endpoint: string,
  options?: RequestOptions
): Promise<APIResponse<T>> {
  return apiRequest<T>(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Health check for the API
 */
export async function checkAPIHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    const response = await apiGet('/api/health', { timeout: 5000 });
    const latency = Date.now() - start;

    return {
      healthy: response.status === 200,
      latency,
      error: response.error || undefined,
    };
  } catch (error: any) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: error.message,
    };
  }
}

/**
 * Sync status tracking
 */
export async function updateSyncStatus(success: boolean, error?: string): Promise<void> {
  if (success) {
    await AsyncStorage.setItem('last_sync_time', new Date().toISOString());
    await AsyncStorage.setItem('sync_error_count', '0');
  } else {
    const currentCount = parseInt(await AsyncStorage.getItem('sync_error_count') || '0', 10);
    await AsyncStorage.setItem('sync_error_count', (currentCount + 1).toString());
    if (error) {
      await AsyncStorage.setItem('last_sync_error', error);
    }
  }
}

export default {
  request: apiRequest,
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  delete: apiDelete,
  checkHealth: checkAPIHealth,
  updateSyncStatus,
};
