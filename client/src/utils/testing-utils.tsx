import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ui/error-boundary';

/**
 * Custom render function that wraps the UI with necessary providers
 * for testing components that depend on these contexts
 */

// Create a new QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: 0,
      staleTime: 0,
      // Prevent error logging in tests
      onError: () => {},
    },
    mutations: {
      retry: false,
      // Prevent error logging in tests
      onError: () => {},
    },
  },
});

// Interface for custom render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  withErrorBoundary?: boolean;
}

/**
 * Custom render function that provides all necessary providers
 * 
 * @param ui The component to render
 * @param options Custom render options
 * @returns The rendered component
 * 
 * @example
 * // Basic usage
 * const { getByText } = renderWithProviders(<MyComponent />);
 * 
 * // With custom QueryClient
 * const queryClient = new QueryClient();
 * const { getByText } = renderWithProviders(<MyComponent />, { queryClient });
 */
function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    withErrorBoundary = false,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Create wrapper with all providers
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        {withErrorBoundary ? (
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        ) : (
          children
        )}
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock IntersectionObserver for tests
class MockIntersectionObserver {
  readonly root: Element | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  
  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    this.root = options?.root ?? null;
    this.rootMargin = options?.rootMargin ?? '0px';
    this.thresholds = Array.isArray(options?.threshold)
      ? options.threshold
      : [options?.threshold ?? 0];
  }
  
  observe() {
    // Mock implementation
  }
  
  unobserve() {
    // Mock implementation
  }
  
  disconnect() {
    // Mock implementation
  }
  
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

/**
 * Setup mock for IntersectionObserver for tests
 */
export function setupIntersectionObserverMock() {
  // Save original implementation
  const originalIntersectionObserver = global.IntersectionObserver;
  
  // Replace with mock
  global.IntersectionObserver = MockIntersectionObserver as any;
  
  // Return cleanup function
  return () => {
    global.IntersectionObserver = originalIntersectionObserver;
  };
}

/**
 * Mock for ResizeObserver for tests
 */
class MockResizeObserver {
  observe() {
    // Mock implementation
  }
  
  unobserve() {
    // Mock implementation
  }
  
  disconnect() {
    // Mock implementation
  }
}

/**
 * Setup mock for ResizeObserver for tests
 */
export function setupResizeObserverMock() {
  // Save original implementation
  const originalResizeObserver = global.ResizeObserver;
  
  // Replace with mock
  global.ResizeObserver = MockResizeObserver as any;
  
  // Return cleanup function
  return () => {
    global.ResizeObserver = originalResizeObserver;
  };
}

// Export custom render function
export { renderWithProviders };

// Re-export everything from testing-library
export * from '@testing-library/react';