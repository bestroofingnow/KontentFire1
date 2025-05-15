import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to get response text
      const text = await res.text();
      
      // Check if we received HTML instead of JSON/text
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        console.error('Received HTML error response:', text.substring(0, 200) + '...');
        throw new Error(`${res.status}: Server error - unable to connect to content generation service`);
      }
      
      throw new Error(`${res.status}: ${text || res.statusText}`);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Check content type for explicit HTML detection before checking status
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.warn('Server returned HTML response (content-type)', url);
      // Clone response to create a new one with proper error message
      const clonedRes = res.clone();
      const htmlContent = await clonedRes.text();
      
      if (htmlContent.includes('<!DOCTYPE') || htmlContent.includes('<html')) {
        console.error('Confirmed HTML content in response:', htmlContent.substring(0, 200) + '...');
        throw new Error(`Server error: Unable to connect to content generation service`);
      }
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }
      
      // Check content type for HTML detection
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.warn('Query received HTML response:', queryKey[0]);
        // Clone response to check content
        const clonedRes = res.clone();
        const htmlContent = await clonedRes.text();
        
        if (htmlContent.includes('<!DOCTYPE') || htmlContent.includes('<html')) {
          console.error('HTML content detected in query response');
          throw new Error('Server error: Unable to connect to service');
        }
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error('Query function error:', error, 'for key:', queryKey);
      throw error;
    }
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
