/**
 * A utility for memoizing functions with a cache
 * 
 * @param fn The function to memoize
 * @param getKey A function to generate a cache key
 * @returns A memoized function
 * 
 * @example
 * // Default key generation (string representation of arguments)
 * const memoizedFn = memoize((a, b) => {
 *   console.log('Computing result');
 *   return a + b;
 * });
 * 
 * memoizedFn(1, 2); // logs: Computing result, returns: 3
 * memoizedFn(1, 2); // No log, returns: 3 (from cache)
 * 
 * // Custom key generation
 * const getUserById = memoize(
 *   async (id) => {
 *     console.log(`Fetching user ${id}`);
 *     const response = await fetch(`/api/users/${id}`);
 *     return response.json();
 *   },
 *   (id) => `user-${id}`
 * );
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  const memoized = ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey(...args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn(...args);
    
    // If the result is a Promise, handle it specially
    if (result instanceof Promise) {
      // Don't cache the promise yet
      return result.then(value => {
        cache.set(key, value as ReturnType<T>);
        return value;
      }) as ReturnType<T>;
    }
    
    cache.set(key, result);
    return result;
  }) as T;
  
  // Add a method to clear the cache
  (memoized as any).clearCache = () => {
    cache.clear();
  };
  
  return memoized;
}

/**
 * Sets a maximum cache size for a memoized function
 * 
 * @param memoizedFn A function created by memoize
 * @param maxSize The maximum number of results to cache
 * @returns The original memoized function
 * 
 * @example
 * const memoizedFn = memoize((a, b) => a + b);
 * limitMemoize(memoizedFn, 100); // Only store the 100 most recent results
 */
export function limitMemoize<T extends (...args: any[]) => any>(
  memoizedFn: T & { clearCache: () => void },
  maxSize: number
): T & { clearCache: () => void } {
  const originalFn = memoizedFn;
  const cache = new Map<string, ReturnType<T>>();
  
  const limitedFn = ((...args: Parameters<T>): ReturnType<T> => {
    const result = originalFn(...args);
    
    // Enforce the size limit
    if (cache.size > maxSize) {
      // Remove the oldest entry
      const keys = cache.keys();
      const firstKey = keys.next();
      if (firstKey && !firstKey.done && firstKey.value) {
        cache.delete(firstKey.value);
      }
    }
    
    return result;
  }) as T & { clearCache: () => void };
  
  limitedFn.clearCache = originalFn.clearCache;
  
  return limitedFn;
}