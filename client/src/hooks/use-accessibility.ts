import { useState, useEffect, useCallback } from 'react';

/**
 * Interface for accessibility preferences
 */
export interface AccessibilityPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
}

/**
 * Default accessibility preferences
 */
const defaultPreferences: AccessibilityPreferences = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  screenReader: false,
};

/**
 * Local storage key for accessibility preferences
 */
const STORAGE_KEY = 'accessibility-preferences';

/**
 * Hook for managing accessibility preferences
 * 
 * @returns The accessibility preferences and methods to update them
 * 
 * @example
 * const { preferences, setPreference, resetPreferences } = useAccessibility();
 * 
 * // In your JSX
 * return (
 *   <div className={preferences.largeText ? 'large-text' : ''}>
 *     <h1>My Accessible Component</h1>
 *     <label>
 *       <input
 *         type="checkbox"
 *         checked={preferences.largeText}
 *         onChange={(e) => setPreference('largeText', e.target.checked)}
 *       />
 *       Large Text
 *     </label>
 *   </div>
 * );
 */
export function useAccessibility() {
  // Initialize state with default preferences
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    // Try to load preferences from localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedPreferences = localStorage.getItem(STORAGE_KEY);
        if (savedPreferences) {
          return { ...defaultPreferences, ...JSON.parse(savedPreferences) };
        }
      } catch (error) {
        console.error('Failed to load accessibility preferences:', error);
      }
    }
    
    return defaultPreferences;
  });
  
  // Detect system preferences for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPreference('reduceMotion', e.matches);
    };
    
    // Set initial value
    if (mediaQuery.matches) {
      setPreference('reduceMotion', true);
    }
    
    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      // @ts-ignore
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        // @ts-ignore
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);
  
  // Detect system preferences for high contrast
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPreference('highContrast', e.matches);
    };
    
    // Set initial value
    if (mediaQuery.matches) {
      setPreference('highContrast', true);
    }
    
    // Listen for changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      // @ts-ignore
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        // @ts-ignore
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);
  
  // Save preferences to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save accessibility preferences:', error);
    }
  }, [preferences]);
  
  // Function to update a specific preference
  const setPreference = useCallback((key: keyof AccessibilityPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }, []);
  
  // Function to reset all preferences to default
  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, []);
  
  return {
    preferences,
    setPreference,
    resetPreferences,
  };
}