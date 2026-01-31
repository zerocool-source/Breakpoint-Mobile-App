import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Platform } from 'react-native';
import { storage } from "./storage";

/**
 * Paginated response type for API endpoints.
 * Backend returns { items: T[], nextCursor: string | null }
 */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Safely extracts items from a paginated response.
 * Handles legacy array responses and undefined/null values gracefully.
 * Supports both response shapes:
 *   - If Array, use it directly
 *   - If Object with "items", use resp.items
 */
export function extractItems<T>(data: Page<T> | T[] | undefined | null, debugLabel?: string): T[] {
  if (!data) {
    if (__DEV__ && debugLabel) {
      console.log(`[extractItems:${debugLabel}] Received: null/undefined`);
    }
    return [];
  }
  
  const isArray = Array.isArray(data);
  const list = isArray ? data : (data.items ?? []);
  
  if (__DEV__ && debugLabel) {
    console.log(`[extractItems:${debugLabel}] Received: ${isArray ? 'array' : 'paginated object'} with ${list.length} items`);
  }
  
  return list;
}

/**
 * Safely extracts nextCursor from a paginated response.
 */
export function extractNextCursor(data: Page<unknown> | unknown[] | undefined | null): string | null {
  if (!data) return null;
  if (Array.isArray(data)) return null;
  return (data as Page<unknown>).nextCursor ?? null;
}

export function getApiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;

  if (!url) {
    throw new Error("EXPO_PUBLIC_API_URL is not set");
  }

  // Ensure no trailing slash to keep URL joining predictable
  return url.trim().replace(/\/+$/, "");
}

/**
 * Returns the auth API URL - uses proxy on web to avoid CORS issues.
 * Web browser: Uses local backend proxy at /api/proxy/auth/*
 * Mobile (Expo Go): Uses Render API directly
 */
export function getAuthApiUrl(): string {
  if (Platform.OS === 'web') {
    // Use local backend proxy to avoid CORS issues in browser
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (domain) {
      return `https://${domain}`;
    }
    // Fallback for local dev
    return 'http://localhost:5000';
  }
  // Mobile apps don't have CORS issues - use Render directly
  return getApiUrl();
}

/**
 * Returns the local backend URL for endpoints that exist on Replit server.
 * Web browser: Uses local backend directly
 * Mobile (Expo Go): Uses Replit domain
 */
export function getLocalApiUrl(): string {
  if (Platform.OS === 'web') {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (domain) {
      return `https://${domain}`;
    }
    return 'http://localhost:5000';
  }
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    return `https://${domain}`;
  }
  return 'http://localhost:5000';
}

/**
 * Returns the Tech Ops API URL for repair submissions.
 * Falls back to EXPO_PUBLIC_API_URL if EXPO_PUBLIC_TECHOPS_URL is not set.
 */
export function getTechOpsUrl(): string {
  const techOpsUrl = process.env.EXPO_PUBLIC_TECHOPS_URL;
  if (techOpsUrl) {
    return techOpsUrl.trim().replace(/\/+$/, "");
  }
  // Fallback to main API URL
  return getApiUrl();
}

/**
 * Safely joins a base URL with a path, ensuring exactly one "/" between them.
 * Handles cases where base may or may not end with "/" and path may or may not start with "/".
 * 
 * Examples:
 *   joinUrl("https://x.com", "api/auth/me") => "https://x.com/api/auth/me"
 *   joinUrl("https://x.com/", "/api/auth/me") => "https://x.com/api/auth/me"
 *   joinUrl("https://x.com", "/api/auth/me") => "https://x.com/api/auth/me"
 *   joinUrl("https://x.com/", "api/auth/me") => "https://x.com/api/auth/me"
 */
export function joinUrl(base: string, path: string): string {
  const trimmedBase = base.trim().replace(/\/+$/, "");
  const trimmedPath = path.trim().replace(/^\/+/, "");
  return `${trimmedBase}/${trimmedPath}`;
}

// Runtime assertion to verify joinUrl works correctly
if (__DEV__) {
  const test1 = joinUrl("https://x.com", "api/auth/me");
  const test2 = joinUrl("https://x.com/", "/api/auth/me");
  const expected = "https://x.com/api/auth/me";
  if (test1 !== expected || test2 !== expected) {
    console.error("[joinUrl] FAILED: URL joining is broken!", { test1, test2, expected });
  }
}


async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Environment sanity check - logs the configured API URLs in dev mode.
 * Call this at app startup to verify configuration.
 */
export function logEnvironmentConfig(): void {
  if (__DEV__) {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const techOpsUrl = process.env.EXPO_PUBLIC_TECHOPS_URL;
    const mobileKey = process.env.EXPO_PUBLIC_MOBILE_API_KEY;
    console.log("═══════════════════════════════════════════════════════════");
    console.log("[ENV CONFIG] Auth/Data API:  ", apiUrl || "NOT SET");
    console.log("[ENV CONFIG] Tech Ops API:   ", techOpsUrl || "(using Auth/Data API)");
    console.log("[ENV CONFIG] Mobile API Key: ", mobileKey ? `${mobileKey.substring(0, 8)}...` : "NOT SET");
    console.log("═══════════════════════════════════════════════════════════");
  }
}

/**
 * Makes a POST request to the Tech Ops API with mobile API key authentication.
 * 
 * Platform behavior:
 * - Web: Uses local backend proxy at /api/proxy/tech-ops to bypass CORS
 * - Mobile (Expo Go): Calls Tech Ops API directly with X-MOBILE-KEY header
 * 
 * Configuration Matrix:
 * ┌────────────┬───────────────────────────────────────────────────────────┐
 * │ Environment│ EXPO_PUBLIC_API_URL          │ EXPO_PUBLIC_TECHOPS_URL    │
 * ├────────────┼──────────────────────────────┼────────────────────────────┤
 * │ Dev/Replit │ https://breakpoint-api-v2... │ https://breakpoint-app...  │
 * │ Production │ https://breakpoint-api-v2... │ https://breakpoint-app...  │
 * └────────────┴──────────────────────────────┴────────────────────────────┘
 * 
 * - Auth/Data requests → EXPO_PUBLIC_API_URL (breakpoint-api-v2.onrender.com)
 * - Tech Ops requests  → EXPO_PUBLIC_TECHOPS_URL (breakpoint-app.onrender.com)
 */
export async function techOpsRequest(route: string, data: unknown): Promise<Response> {
  const token = await storage.getAuthToken();
  const mobileKey = process.env.EXPO_PUBLIC_MOBILE_API_KEY;
  
  // On web, use proxy to bypass CORS; on mobile, call directly
  if (Platform.OS === 'web') {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const proxyBaseUrl = domain ? `https://${domain}` : 'http://localhost:5000';
    const proxyUrl = joinUrl(proxyBaseUrl, '/api/proxy/tech-ops');
    
    if (__DEV__) {
      console.log("[TechOps] POST (via proxy)", proxyUrl);
      console.log("[TechOps] payload", data);
      console.log("[TechOps] Auth token:", token ? `${token.substring(0, 20)}...` : "NOT SET");
    }
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(proxyUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    
    await throwIfResNotOk(res);
    return res;
  }
  
  // Mobile: Call Tech Ops API directly with both auth methods
  const baseUrl = getTechOpsUrl();
  const url = joinUrl(baseUrl, route);

  if (__DEV__) {
    console.log("[TechOps] POST", url);
    console.log("[TechOps] payload", data);
    console.log("[TechOps] Auth token:", token ? `${token.substring(0, 20)}...` : "NOT SET");
    console.log("[TechOps] Mobile key:", mobileKey ? `${mobileKey.substring(0, 8)}...` : "NOT SET");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (mobileKey) {
    headers["X-MOBILE-KEY"] = mobileKey;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  await throwIfResNotOk(res);
  return res;
}

/**
 * @deprecated Use techOpsRequest instead for Tech Ops submissions
 */
export async function mobileKeyRequest(route: string, data: unknown): Promise<Response> {
  return techOpsRequest(route, data);
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = joinUrl(baseUrl, route);
  const token = await storage.getAuthToken();
  
  if (__DEV__ && route === '/api/auth/me') {
    console.log('[apiRequest] Final URL for /api/auth/me:', url);
  }

  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

/**
 * Makes an authenticated API request with timeout.
 * On web: Uses local backend proxy to avoid CORS issues.
 * On mobile: Calls Render API directly.
 * 
 * @param method - HTTP method
 * @param route - API route (e.g., '/api/auth/login')
 * @param data - Optional request body
 * @param timeoutMs - Request timeout in milliseconds (default: 15000)
 */
export async function authApiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
  timeoutMs: number = 15000,
): Promise<Response> {
  const baseUrl = getAuthApiUrl();
  
  // On web, use proxy route to avoid CORS
  let finalRoute = route;
  if (Platform.OS === 'web' && route.startsWith('/api/auth/')) {
    finalRoute = route.replace('/api/auth/', '/api/proxy/auth/');
  }
  
  const url = joinUrl(baseUrl, finalRoute);

  if (__DEV__) {
    console.log('[authApiRequest] URL:', url, Platform.OS === 'web' ? '(via proxy)' : '(direct)');
  }

  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Add timeout using AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });
    return res;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // Create a fake Response for timeout
      return new Response(JSON.stringify({ 
        error: 'Request timed out. The server may be starting up - please try again in a moment.' 
      }), {
        status: 408,
        statusText: 'Request Timeout',
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Network error - create a fake Response with 503 status
    return new Response(JSON.stringify({ 
      error: 'Network error. Please check your connection and try again.' 
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const route = queryKey.join("/") as string;
    const url = joinUrl(baseUrl, route);
    const token = await storage.getAuthToken();
    
    if (__DEV__ && route.includes('/api/auth/me')) {
      console.log('[getQueryFn] Final URL for /api/auth/me:', url);
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
