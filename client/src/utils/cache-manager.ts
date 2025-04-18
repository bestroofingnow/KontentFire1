/**
 * Cache Manager for browser-based caching
 * This provides a simple interface for working with various cache storage mechanisms
 */

// Cache types
type CacheType = 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';

// Cache storage options
interface CacheOptions {
  type: CacheType;
  expirationMs?: number; // Time in ms until cache entry expires
  maxEntries?: number; // Maximum number of entries to keep in cache
}

// Cached item metadata
interface CacheItemMeta {
  timestamp: number;
  expiration: number | null;
}

// Cached item with metadata
interface CacheItem<T> {
  value: T;
  meta: CacheItemMeta;
}

/**
 * Cache manager class for browser-based caching
 */
class CacheManager {
  private static instance: CacheManager;
  private memoryCache: Map<string, CacheItem<any>> = new Map();
  private idbDatabase: IDBDatabase | null = null;
  
  // Get singleton instance
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
  
  constructor() {
    // Initialize IndexedDB if available
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initIndexedDB();
    }
    
    // Set up periodic cleanup for memory cache
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanupExpiredMemoryCache(), 60000); // Cleanup every minute
    }
  }
  
  /**
   * Initialize IndexedDB database for cache storage
   */
  private initIndexedDB(): void {
    const request = indexedDB.open('kontent-fire-cache', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache');
      }
    };
    
    request.onsuccess = (event) => {
      this.idbDatabase = (event.target as IDBOpenDBRequest).result;
    };
    
    request.onerror = (event) => {
      console.error('Failed to open IndexedDB:', event);
    };
  }
  
  /**
   * Set a value in the cache
   * 
   * @param key The cache key
   * @param value The value to cache
   * @param options Cache options
   * @returns Promise that resolves when the operation completes
   */
  public async set<T>(key: string, value: T, options: CacheOptions): Promise<void> {
    const { type, expirationMs } = options;
    
    const cacheItem: CacheItem<T> = {
      value,
      meta: {
        timestamp: Date.now(),
        expiration: expirationMs ? Date.now() + expirationMs : null,
      },
    };
    
    switch (type) {
      case 'memory':
        this.setMemoryCache(key, cacheItem, options);
        break;
      case 'localStorage':
        this.setLocalStorageCache(key, cacheItem);
        break;
      case 'sessionStorage':
        this.setSessionStorageCache(key, cacheItem);
        break;
      case 'indexedDB':
        await this.setIndexedDBCache(key, cacheItem);
        break;
    }
  }
  
  /**
   * Get a value from the cache
   * 
   * @param key The cache key
   * @param type The cache type
   * @returns Promise that resolves with the cached value or null if not found or expired
   */
  public async get<T>(key: string, type: CacheType): Promise<T | null> {
    switch (type) {
      case 'memory':
        return this.getMemoryCache<T>(key);
      case 'localStorage':
        return this.getLocalStorageCache<T>(key);
      case 'sessionStorage':
        return this.getSessionStorageCache<T>(key);
      case 'indexedDB':
        return this.getIndexedDBCache<T>(key);
      default:
        return null;
    }
  }
  
  /**
   * Remove an item from the cache
   * 
   * @param key The cache key
   * @param type The cache type
   * @returns Promise that resolves when the operation completes
   */
  public async remove(key: string, type: CacheType): Promise<void> {
    switch (type) {
      case 'memory':
        this.memoryCache.delete(key);
        break;
      case 'localStorage':
        localStorage.removeItem(`cache-${key}`);
        break;
      case 'sessionStorage':
        sessionStorage.removeItem(`cache-${key}`);
        break;
      case 'indexedDB':
        await this.removeIndexedDBCache(key);
        break;
    }
  }
  
  /**
   * Clear all items from a specific cache type
   * 
   * @param type The cache type to clear
   * @returns Promise that resolves when the operation completes
   */
  public async clear(type: CacheType): Promise<void> {
    switch (type) {
      case 'memory':
        this.memoryCache.clear();
        break;
      case 'localStorage':
        this.clearStorageCache(localStorage);
        break;
      case 'sessionStorage':
        this.clearStorageCache(sessionStorage);
        break;
      case 'indexedDB':
        await this.clearIndexedDBCache();
        break;
    }
  }
  
  /**
   * Get all keys from a specific cache type
   * 
   * @param type The cache type
   * @returns Promise that resolves with an array of keys
   */
  public async keys(type: CacheType): Promise<string[]> {
    switch (type) {
      case 'memory':
        return Array.from(this.memoryCache.keys());
      case 'localStorage':
        return this.getStorageKeys(localStorage);
      case 'sessionStorage':
        return this.getStorageKeys(sessionStorage);
      case 'indexedDB':
        return this.getIndexedDBKeys();
      default:
        return [];
    }
  }
  
  // Internal methods for memory cache
  private setMemoryCache<T>(key: string, item: CacheItem<T>, options: CacheOptions): void {
    // Enforce max entries limit if specified
    if (options.maxEntries && this.memoryCache.size >= options.maxEntries) {
      // Remove oldest entry (first inserted)
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }
    
    this.memoryCache.set(key, item);
  }
  
  private getMemoryCache<T>(key: string): T | null {
    const item = this.memoryCache.get(key) as CacheItem<T> | undefined;
    
    if (!item) {
      return null;
    }
    
    // Check if item is expired
    if (item.meta.expiration && item.meta.expiration < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  private cleanupExpiredMemoryCache(): void {
    const now = Date.now();
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.meta.expiration && item.meta.expiration < now) {
        this.memoryCache.delete(key);
      }
    }
  }
  
  // Internal methods for localStorage and sessionStorage
  private setLocalStorageCache<T>(key: string, item: CacheItem<T>): void {
    try {
      localStorage.setItem(`cache-${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Failed to set localStorage cache:', error);
      
      // If storage is full, clear expired items and try again
      if (error instanceof DOMException && error.code === 22) {
        this.clearExpiredStorageCache(localStorage);
        try {
          localStorage.setItem(`cache-${key}`, JSON.stringify(item));
        } catch (retryError) {
          console.error('Failed to set localStorage cache after cleanup:', retryError);
        }
      }
    }
  }
  
  private setSessionStorageCache<T>(key: string, item: CacheItem<T>): void {
    try {
      sessionStorage.setItem(`cache-${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Failed to set sessionStorage cache:', error);
      
      // If storage is full, clear expired items and try again
      if (error instanceof DOMException && error.code === 22) {
        this.clearExpiredStorageCache(sessionStorage);
        try {
          sessionStorage.setItem(`cache-${key}`, JSON.stringify(item));
        } catch (retryError) {
          console.error('Failed to set sessionStorage cache after cleanup:', retryError);
        }
      }
    }
  }
  
  private getLocalStorageCache<T>(key: string): T | null {
    return this.getStorageCache<T>(localStorage, key);
  }
  
  private getSessionStorageCache<T>(key: string): T | null {
    return this.getStorageCache<T>(sessionStorage, key);
  }
  
  private getStorageCache<T>(storage: Storage, key: string): T | null {
    try {
      const json = storage.getItem(`cache-${key}`);
      
      if (!json) {
        return null;
      }
      
      const item = JSON.parse(json) as CacheItem<T>;
      
      // Check if item is expired
      if (item.meta.expiration && item.meta.expiration < Date.now()) {
        storage.removeItem(`cache-${key}`);
        return null;
      }
      
      return item.value;
    } catch (error) {
      console.error(`Failed to get ${storage === localStorage ? 'localStorage' : 'sessionStorage'} cache:`, error);
      return null;
    }
  }
  
  private clearStorageCache(storage: Storage): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('cache-')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => storage.removeItem(key));
  }
  
  private clearExpiredStorageCache(storage: Storage): void {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('cache-')) {
        try {
          const json = storage.getItem(key);
          if (json) {
            const item = JSON.parse(json) as CacheItem<any>;
            if (item.meta.expiration && item.meta.expiration < now) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          console.error(`Failed to parse ${storage === localStorage ? 'localStorage' : 'sessionStorage'} item:`, error);
        }
      }
    }
    
    keysToRemove.forEach(key => storage.removeItem(key));
  }
  
  private getStorageKeys(storage: Storage): string[] {
    const keys: string[] = [];
    
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith('cache-')) {
        keys.push(key.substring(6)); // Remove 'cache-' prefix
      }
    }
    
    return keys;
  }
  
  // Internal methods for IndexedDB
  private async setIndexedDBCache<T>(key: string, item: CacheItem<T>): Promise<void> {
    if (!this.idbDatabase) {
      console.error('IndexedDB is not available');
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.idbDatabase!.transaction('cache', 'readwrite');
        const store = transaction.objectStore('cache');
        
        const request = store.put(item, `cache-${key}`);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          reject(new Error(`Failed to set IndexedDB cache: ${(event.target as IDBRequest).error}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private async getIndexedDBCache<T>(key: string): Promise<T | null> {
    if (!this.idbDatabase) {
      console.error('IndexedDB is not available');
      return null;
    }
    
    return new Promise((resolve) => {
      try {
        const transaction = this.idbDatabase!.transaction('cache', 'readonly');
        const store = transaction.objectStore('cache');
        
        const request = store.get(`cache-${key}`);
        
        request.onsuccess = (event) => {
          const item = (event.target as IDBRequest).result as CacheItem<T> | undefined;
          
          if (!item) {
            resolve(null);
            return;
          }
          
          // Check if item is expired
          if (item.meta.expiration && item.meta.expiration < Date.now()) {
            this.removeIndexedDBCache(key)
              .then(() => resolve(null))
              .catch(() => resolve(null));
            return;
          }
          
          resolve(item.value);
        };
        
        request.onerror = () => resolve(null);
      } catch (error) {
        console.error('Failed to get IndexedDB cache:', error);
        resolve(null);
      }
    });
  }
  
  private async removeIndexedDBCache(key: string): Promise<void> {
    if (!this.idbDatabase) {
      console.error('IndexedDB is not available');
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.idbDatabase!.transaction('cache', 'readwrite');
        const store = transaction.objectStore('cache');
        
        const request = store.delete(`cache-${key}`);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          reject(new Error(`Failed to remove IndexedDB cache: ${(event.target as IDBRequest).error}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private async clearIndexedDBCache(): Promise<void> {
    if (!this.idbDatabase) {
      console.error('IndexedDB is not available');
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.idbDatabase!.transaction('cache', 'readwrite');
        const store = transaction.objectStore('cache');
        
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
          reject(new Error(`Failed to clear IndexedDB cache: ${(event.target as IDBRequest).error}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  private async getIndexedDBKeys(): Promise<string[]> {
    if (!this.idbDatabase) {
      console.error('IndexedDB is not available');
      return [];
    }
    
    return new Promise((resolve) => {
      try {
        const transaction = this.idbDatabase!.transaction('cache', 'readonly');
        const store = transaction.objectStore('cache');
        
        const request = store.getAllKeys();
        
        request.onsuccess = (event) => {
          const keys = (event.target as IDBRequest).result as IDBValidKey[];
          
          const filteredKeys = keys
            .filter(key => typeof key === 'string' && key.startsWith('cache-'))
            .map(key => (key as string).substring(6)); // Remove 'cache-' prefix
          
          resolve(filteredKeys);
        };
        
        request.onerror = () => resolve([]);
      } catch (error) {
        console.error('Failed to get IndexedDB keys:', error);
        resolve([]);
      }
    });
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// API cache helper
/**
 * Cache data from an API call
 * 
 * @param key The cache key
 * @param fetchFn The function that fetches data from the API
 * @param options Cache options
 * @returns The data from the cache or from the API
 * 
 * @example
 * const data = await cacheApi(
 *   'user-profile',
 *   () => fetch('/api/user').then(res => res.json()),
 *   { type: 'localStorage', expirationMs: 60000 } // Cache for 1 minute
 * );
 */
export async function cacheApi<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  // Try to get from cache first
  const cachedData = await cacheManager.get<T>(key, options.type);
  
  if (cachedData !== null) {
    return cachedData;
  }
  
  // If not in cache or expired, fetch fresh data
  const freshData = await fetchFn();
  
  // Cache the fresh data
  await cacheManager.set(key, freshData, options);
  
  return freshData;
}