import { useState, useEffect, useRef, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
}

/**
 * Hook to detect when an element enters the viewport
 * 
 * @param options Intersection observer options
 * @returns [ref, isIntersecting, entry] - A ref to attach to the element, whether it's intersecting, and the full IntersectionObserverEntry
 * 
 * @example
 * const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
 * 
 * return (
 *   <div ref={ref}>
 *     {isVisible ? 'I am visible!' : 'I am not visible'}
 *   </div>
 * );
 */
export function useIntersectionObserver<T extends Element = Element>({
  root = null,
  rootMargin = '0px',
  threshold = 0,
  triggerOnce = false,
}: UseIntersectionObserverOptions = {}): [
  RefObject<T>,
  boolean,
  IntersectionObserverEntry | null
] {
  const ref = useRef<T>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);

  useEffect(() => {
    const node = ref.current;
    
    // If there's no element to observe, or this is SSR, return early
    if (!node || typeof IntersectionObserver === 'undefined') {
      return;
    }
    
    // Callback when intersection changes
    const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
      setEntry(entry);
      setIsIntersecting(entry.isIntersecting);
      
      // If it should only trigger once and it's intersecting, disconnect
      if (triggerOnce && entry.isIntersecting) {
        observer.disconnect();
      }
    };
    
    // Create the observer
    const observer = new IntersectionObserver(updateEntry, {
      root,
      rootMargin,
      threshold,
    });
    
    // Start observing
    observer.observe(node);
    
    // Clean up the observer when the component unmounts
    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, triggerOnce]);

  return [ref, isIntersecting, entry];
}