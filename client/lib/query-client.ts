import { QueryClient, QueryFunction } from "@tanstack/react-query";
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
 */
export function extractItems<T>(data: Page<T> | T[] | undefined | null): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? [];
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

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);
  const token = await storage.getAuthToken();

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

export async function authApiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);

  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);
    const token = await storage.getAuthToken();

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
