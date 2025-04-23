import { useState, useEffect } from 'react';

/**
 * Custom hook for managing logo animations
 * @param initialDelay - Optional delay before starting the animation (in ms)
 * @returns {Object} Animation control functions and state
 */
export function useLogoAnimation(initialDelay: number = 0) {
  const [animationKey, setAnimationKey] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Initialize the animation when the component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      restartAnimation();
    }, initialDelay);

    return () => clearTimeout(timer);
  }, [initialDelay]);

  // Function to restart the animation
  const restartAnimation = () => {
    // Reset animation keys to force re-render and restart animations
    setAnimationKey(prev => prev + 1);
    setIsPlaying(true);
    
    // Set isPlaying back to false after animation completes
    const totalAnimationDuration = 2000; // Total animation duration in ms
    setTimeout(() => {
      setIsPlaying(false);
    }, totalAnimationDuration);
  };

  return {
    animationKey,
    isPlaying,
    restartAnimation
  };
}