import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Enhanced error handling for API responses
 * Attempts to parse error messages from response body
 */
async function handleResponseError(res: Response): Promise<never> {
  try {
    // Clone the response to avoid "body already read" errors
    const resClone = res.clone();
    
    // Try to parse as JSON first
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await res.json();
        if (errorData.message) {
          throw new Error(`${res.status}: ${errorData.message}`);
        } else if (errorData.error) {
          throw new Error(`${res.status}: ${errorData.error}`);
        }
      } catch (jsonError) {
        // Fall back to text if JSON parsing fails
      }
    }
    
    // If not JSON or JSON parsing failed, get text from the clone
    const text = await resClone.text() || res.statusText;
    
    // Handle session expired specifically
    if (res.status === 440) {
      throw new Error('Session expired. Please log in again.');
    } else if (res.status === 401) {
      throw new Error('Authentication required. Please log in.');
    }
    
    throw new Error(`${res.status}: ${text}`);
  } catch (error) {
    if (error instanceof Error) {
      // Add status to error object
      (error as any).status = res.status;
      throw error;
    }
    // Fallback error
    const fallbackError = new Error(`${res.status}: Request failed`);
    (fallbackError as any).status = res.status;
    throw fallbackError;
  }
}

/**
 * Helper to check if response is OK or throw appropriate error
 */
async function throwIfResNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    await handleResponseError(res);
  }
}

/**
 * Enhanced API request with robust error handling and session management
 */
export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
  isFormData: boolean = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'X-Requested-With': 'XMLHttpRequest', // Help server identify XHR requests
  };
  
  let body: any = undefined;
  
  if (data) {
    if (isFormData && data instanceof FormData) {
      // For FormData (file uploads), don't set Content-Type
      // The browser will set it with the correct boundary
      body = data;
    } else {
      // For JSON data
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      credentials: "include", // Always include credentials for session cookies
    });
    
    // Special handling for session expiration (status code 440)
    if (res.status === 440) {
      const error = new Error('Session expired. Please log in again.');
      (error as any).status = 440;
      throw error;
    }

    await throwIfResNotOk(res);
    
    // Only try to parse JSON if there's content
    const contentLength = res.headers.get('content-length');
    const contentType = res.headers.get('content-type');
    
    if (contentLength && parseInt(contentLength) > 0 && contentType?.includes('application/json')) {
      return await res.json();
    } else if (method === 'DELETE' || res.status === 204) {
      // For delete operations or no-content responses, return a simple success object
      return { success: true } as T;
    } else {
      // For other response types, try to parse as text
      const text = await res.text();
      try {
        // Try to parse as JSON anyway (in case content-type is wrong)
        return JSON.parse(text) as T;
      } catch {
        // Return as text if not JSON
        return text as unknown as T;
      }
    }
  } catch (error) {
    console.error(`API request error (${method} ${url}):`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw" | "redirect";

/**
 * Enhanced query function with improved session management
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }
      });

      // Handle session expiration (440) and auth failures (401)
      if (res.status === 440 || res.status === 401) {
        if (unauthorizedBehavior === "returnNull") {
          return null;
        } else if (unauthorizedBehavior === "redirect") {
          // Check if we're not already on the admin page to prevent redirect loops
          if (!window.location.pathname.includes('/admin')) {
            window.location.href = '/admin';
          }
          return null;
        } else {
          await handleResponseError(res);
        }
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Query error (${queryKey[0]}):`, error);
      throw error;
    }
  };

/**
 * Configured QueryClient with improved error handling 
 * and session management
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchOnWindowFocus: true, // Enable to detect session changes
      refetchOnMount: true,
      staleTime: 30000, // 30 seconds - balance between performance and freshness
      retry: (failureCount, error: any) => {
        // Don't retry auth errors
        if (error && (error.status === 401 || error.status === 440 || error.status === 403)) {
          return false;
        }
        // Retry network/timeout errors
        return failureCount < 2;
      },
      retryDelay: 1000, // 1 second between retries
    },
    mutations: {
      retry: false, // Don't retry mutations to avoid duplicate operations
    },
  },
});
