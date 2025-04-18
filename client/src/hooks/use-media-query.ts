import { useState, useEffect } from 'react';

/**
 * Custom hook for media queries
 * 
 * @param query The CSS media query string
 * @returns Whether the media query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * 
 * return (
 *   <div>
 *     {isMobile ? 'Mobile View' : 'Desktop View'}
 *   </div>
 * );
 */
export function useMediaQuery(query: string): boolean {
  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  function handleChange() {
    setMatches(getMatches(query));
  }

  useEffect(() => {
    const matchMedia = window.matchMedia(query);

    // Triggered at the first client-side load and if query changes
    handleChange();

    // Use deprecated addEventListener/removeEventListener for broader browser support
    if (matchMedia.addEventListener) {
      matchMedia.addEventListener('change', handleChange);
    } else {
      // Fallback for browsers that don't support addEventListener
      // @ts-ignore
      matchMedia.addListener(handleChange);
    }

    return () => {
      if (matchMedia.removeEventListener) {
        matchMedia.removeEventListener('change', handleChange);
      } else {
        // @ts-ignore
        matchMedia.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}