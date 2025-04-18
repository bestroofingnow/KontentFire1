import { useState, useEffect } from 'react';

type SetValue<T> = T | ((prevValue: T) => T);
type StorageEventListener = (e: StorageEvent) => void;

/**
 * Custom hook for managing state in localStorage
 * 
 * @param key The localStorage key
 * @param initialValue The initial value
 * @returns [storedValue, setValue] - Same API as useState
 * 
 * @example
 * const [darkMode, setDarkMode] = useLocalStorage('darkMode', false);
 * 
 * // Toggle dark mode
 * const toggleDarkMode = () => setDarkMode(prevMode => !prevMode);
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: SetValue<T>) => void] {
  // Get from local storage then parse stored json or return initialValue
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: SetValue<T>) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        // Trigger custom event so other instances can update
        window.dispatchEvent(new Event('local-storage'));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes to this localStorage key in other tabs/windows
  useEffect(() => {
    const handleStorageChange: StorageEventListener = (e) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    // This handles updates from local storage across tabs/windows
    window.addEventListener('storage', handleStorageChange);
    // This handles updates from within the same tab
    window.addEventListener('local-storage', () => setStoredValue(readValue()));

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', () => setStoredValue(readValue()));
    };
  }, [key]);

  return [storedValue, setValue];
}