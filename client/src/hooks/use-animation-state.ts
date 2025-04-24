import { useState, useCallback } from 'react';

/**
 * useAnimationState - A hook for managing animation states
 * 
 * @param initialState - Initial animation state (default: false)
 * @param duration - Duration in ms after which to reset the state (default: 300)
 * @param onComplete - Callback to execute when animation completes
 * @returns Object containing state, setter, trigger function, and reset function
 */
export function useAnimationState(
  initialState: boolean = false, 
  duration: number = 300,
  onComplete?: () => void
) {
  const [isAnimating, setIsAnimating] = useState(initialState);
  
  // Reset the animation state after duration
  const resetAnimation = useCallback(() => {
    setIsAnimating(false);
    if (onComplete) onComplete();
  }, [onComplete]);
  
  // Trigger the animation and reset after duration
  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    
    const timer = setTimeout(() => {
      resetAnimation();
    }, duration);
    
    // Clean up timer if component unmounts during animation
    return () => clearTimeout(timer);
  }, [duration, resetAnimation]);
  
  return {
    isAnimating,
    setIsAnimating,
    triggerAnimation,
    resetAnimation
  };
}

export default useAnimationState;