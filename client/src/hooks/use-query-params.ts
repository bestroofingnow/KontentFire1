import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'wouter';

/**
 * Custom hook to work with query parameters
 * 
 * @returns Object with query params and methods to update them
 * 
 * @example
 * const { queryParams, setQueryParam, removeQueryParam, clearQueryParams } = useQueryParams();
 * 
 * // Read a query param
 * const page = queryParams.page ? Number(queryParams.page) : 1;
 * 
 * // Update a query param
 * const nextPage = () => setQueryParam('page', String(page + 1));
 */
export function useQueryParams() {
  const [location, setLocation] = useNavigate();
  const currentLocation = useLocation();

  // Parse the query parameters from the current location
  const queryParams = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }
    
    return params;
  }, [currentLocation]);

  // Set a query parameter
  const setQueryParam = useCallback(
    (key: string, value: string) => {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set(key, value);
      
      // Use history.replaceState to avoid a full page reload
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}?${searchParams.toString()}`
      );
      
      // Update the location for Wouter
      setLocation(`${window.location.pathname}?${searchParams.toString()}`);
    },
    [setLocation]
  );

  // Remove a query parameter
  const removeQueryParam = useCallback(
    (key: string) => {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.delete(key);
      
      const newSearch = searchParams.toString();
      const newUrl = newSearch
        ? `${window.location.pathname}?${newSearch}`
        : window.location.pathname;
      
      // Use history.replaceState to avoid a full page reload
      window.history.replaceState(null, '', newUrl);
      
      // Update the location for Wouter
      setLocation(newUrl);
    },
    [setLocation]
  );

  // Clear all query parameters
  const clearQueryParams = useCallback(() => {
    // Use history.replaceState to avoid a full page reload
    window.history.replaceState(null, '', window.location.pathname);
    
    // Update the location for Wouter
    setLocation(window.location.pathname);
  }, [setLocation]);

  return { queryParams, setQueryParam, removeQueryParam, clearQueryParams };
}