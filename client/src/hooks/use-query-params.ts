import { useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';

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
  const [location, navigate] = useLocation();
  const currentLocation = location;

  // Parse the query parameters from the current location
  const queryParams = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};
    
    // Use Array.from instead of direct iteration for better compatibility
    Array.from(searchParams.entries()).forEach(([key, value]) => {
      params[key] = value;
    });
    
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
      navigate(`${window.location.pathname}?${searchParams.toString()}`);
    },
    [navigate]
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
      navigate(newUrl);
    },
    [navigate]
  );

  // Clear all query parameters
  const clearQueryParams = useCallback(() => {
    // Use history.replaceState to avoid a full page reload
    window.history.replaceState(null, '', window.location.pathname);
    
    // Update the location for Wouter
    navigate(window.location.pathname);
  }, [navigate]);

  return { queryParams, setQueryParam, removeQueryParam, clearQueryParams };
}