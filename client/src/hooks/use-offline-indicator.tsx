import { useState, useEffect } from 'react';

/**
 * Hook that tracks the online/offline status of the user
 * 
 * @param options Configuration options for the hook
 * @returns Object with isOnline, isOffline, lastOnline, and lastOffline properties
 * 
 * @example
 * const { isOnline, isOffline, lastOnline, lastOffline } = useOfflineIndicator();
 * 
 * return (
 *   <div>
 *     {isOffline && (
 *       <div className="offline-banner">
 *         You are currently offline. Content may be limited.
 *       </div>
 *     )}
 *     <main>Your app content</main>
 *   </div>
 * );
 */
export function useOfflineIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Default to online in SSR
  });
  
  const [lastOnline, setLastOnline] = useState<Date | null>(
    isOnline ? new Date() : null
  );
  
  const [lastOffline, setLastOffline] = useState<Date | null>(
    !isOnline ? new Date() : null
  );
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setLastOffline(new Date());
    };
    
    // Add event listeners for online/offline status
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Periodically check online status (some browsers don't fire events reliably)
    const intervalId = setInterval(() => {
      const currentOnline = navigator.onLine;
      
      if (currentOnline !== isOnline) {
        if (currentOnline) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 30000); // Check every 30 seconds
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);
  
  return {
    isOnline,
    isOffline: !isOnline,
    lastOnline,
    lastOffline,
  };
}

/**
 * A component that displays an offline indicator when the user is offline
 */
export function OfflineIndicator() {
  const { isOffline } = useOfflineIndicator();
  
  if (!isOffline) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg flex items-center z-50">
      <span className="mr-2 relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive-foreground opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive-foreground"></span>
      </span>
      <span className="font-medium">
        You are currently offline
      </span>
    </div>
  );
}