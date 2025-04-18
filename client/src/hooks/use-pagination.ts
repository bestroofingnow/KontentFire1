import { useState, useMemo } from 'react';

interface PaginationOptions {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
  maxPageButtons?: number; // Maximum number of page buttons to show
}

interface PaginationResult {
  currentPage: number;
  totalPages: number;
  pageItems: number[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  visiblePageNumbers: number[]; // The page numbers to display in pagination UI
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  startItem: number; // The index of the first item on the current page (1-based)
  endItem: number; // The index of the last item on the current page (1-based)
}

/**
 * Custom hook for managing pagination
 * 
 * @param options Pagination options
 * @returns Pagination state and methods
 * 
 * @example
 * const {
 *   currentPage,
 *   totalPages,
 *   visiblePageNumbers,
 *   hasNextPage,
 *   hasPrevPage,
 *   goToPage,
 *   nextPage,
 *   prevPage,
 *   startItem,
 *   endItem
 * } = usePagination({
 *   totalItems: 100,
 *   itemsPerPage: 10,
 *   initialPage: 1,
 *   maxPageButtons: 5
 * });
 * 
 * // In your component
 * return (
 *   <div>
 *     <div>Showing {startItem} to {endItem} of {totalItems}</div>
 *     <div>
 *       <button onClick={prevPage} disabled={!hasPrevPage}>Previous</button>
 *       
 *       {visiblePageNumbers.map(page => (
 *         <button
 *           key={page}
 *           onClick={() => goToPage(page)}
 *           className={page === currentPage ? 'active' : ''}
 *         >
 *           {page}
 *         </button>
 *       ))}
 *       
 *       <button onClick={nextPage} disabled={!hasNextPage}>Next</button>
 *     </div>
 *   </div>
 * );
 */
export function usePagination({
  totalItems,
  itemsPerPage,
  initialPage = 1,
  maxPageButtons = 7
}: PaginationOptions): PaginationResult {
  // Calculate the total number of pages
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Ensure initialPage is within bounds
  const boundedInitialPage = Math.min(Math.max(1, initialPage), totalPages);
  
  // State for current page
  const [currentPage, setCurrentPage] = useState<number>(boundedInitialPage);
  
  // Calculate the item indices for the current page
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  // Determine which page numbers should be visible
  const visiblePageNumbers = useMemo(() => {
    // If we have fewer pages than the maximum number of buttons, show all pages
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // We need to determine which pages to show
    const halfButtons = Math.floor(maxPageButtons / 2);
    
    // Start with the simplest approach: current page in the middle
    let startPage = Math.max(1, currentPage - halfButtons);
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    // If we hit the end, adjust the start
    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }, [currentPage, totalPages, maxPageButtons]);
  
  // Navigation methods
  const goToPage = (page: number): void => {
    const boundedPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(boundedPage);
  };
  
  const nextPage = (): void => {
    goToPage(currentPage + 1);
  };
  
  const prevPage = (): void => {
    goToPage(currentPage - 1);
  };
  
  // Calculate the items that should be displayed on the current page
  const pageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    return Array.from({ length: endIndex - startIndex }, (_, i) => startIndex + i);
  }, [currentPage, itemsPerPage, totalItems]);
  
  return {
    currentPage,
    totalPages,
    pageItems,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    visiblePageNumbers,
    goToPage,
    nextPage,
    prevPage,
    startItem,
    endItem
  };
}