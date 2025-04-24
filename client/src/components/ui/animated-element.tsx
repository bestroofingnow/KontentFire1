import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedElementProps {
  children: React.ReactNode;
  animation?: 'bounce' | 'pulse' | 'pop' | 'slide-in' | 'fade' | 'scale' | 'wiggle';
  duration?: number;
  delay?: number;
  onClick?: () => void;
  className?: string;
  repeat?: boolean | number;
  whileHover?: boolean;
  whileTap?: boolean;
  initial?: boolean;
}

/**
 * AnimatedElement - A reusable component for adding micro-interactions
 * 
 * @param children - Content to be animated
 * @param animation - Type of animation
 * @param duration - Duration of animation in seconds
 * @param delay - Delay before animation starts in seconds
 * @param onClick - Click handler
 * @param className - Additional CSS classes
 * @param repeat - Number of times to repeat (true for infinite)
 * @param whileHover - Apply animation on hover
 * @param whileTap - Apply animation on tap/click
 * @param initial - Apply animation on initial render
 */
export const AnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  animation = 'pop',
  duration = 0.3,
  delay = 0,
  onClick,
  className = '',
  repeat = false,
  whileHover = false,
  whileTap = false,
  initial = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Delay visibility to allow for entrance animations
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // Animation variants
  const animations = {
    bounce: {
      initial: initial ? { y: -10, opacity: 0 } : {},
      animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 10 } },
      whileHover: whileHover ? { y: -5, scale: 1.05 } : {},
      whileTap: whileTap ? { y: 2 } : {},
    },
    pulse: {
      initial: initial ? { scale: 0.95, opacity: 0.8 } : {},
      animate: { 
        scale: [0.95, 1.05, 1], 
        opacity: 1, 
        transition: { 
          repeat: repeat === true ? Infinity : (repeat || 0), 
          repeatType: 'reverse',
          duration 
        } 
      },
      whileHover: whileHover ? { scale: 1.05 } : {},
      whileTap: whileTap ? { scale: 0.95 } : {},
    },
    pop: {
      initial: initial ? { scale: 0, opacity: 0 } : {},
      animate: { scale: 1, opacity: 1 },
      whileHover: whileHover ? { scale: 1.05 } : {},
      whileTap: whileTap ? { scale: 0.95 } : {},
    },
    'slide-in': {
      initial: initial ? { x: -20, opacity: 0 } : {},
      animate: { x: 0, opacity: 1 },
      whileHover: whileHover ? { x: 5 } : {},
      whileTap: whileTap ? { x: -2 } : {},
    },
    fade: {
      initial: initial ? { opacity: 0 } : {},
      animate: { opacity: 1 },
      whileHover: whileHover ? { opacity: 0.8 } : {},
      whileTap: whileTap ? { opacity: 0.6 } : {},
    },
    scale: {
      initial: initial ? { scale: 0.8, opacity: 0 } : {},
      animate: { scale: 1, opacity: 1 },
      whileHover: whileHover ? { scale: 1.1 } : {},
      whileTap: whileTap ? { scale: 0.9 } : {},
    },
    wiggle: {
      initial: initial ? { rotate: -5, opacity: 0 } : {},
      animate: { 
        rotate: [0, -5, 5, -5, 0], 
        opacity: 1, 
        transition: { 
          repeat: repeat === true ? Infinity : (repeat || 0), 
          repeatDelay: 1,
          duration: 0.5 
        } 
      },
      whileHover: whileHover ? { rotate: 5 } : {},
      whileTap: whileTap ? { scale: 0.95, rotate: 0 } : {},
    },
  };

  const selectedAnimation = animations[animation];

  const transitionConfig = {
    duration,
    delay,
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={className}
          initial={selectedAnimation.initial}
          animate={selectedAnimation.animate}
          whileHover={selectedAnimation.whileHover}
          whileTap={selectedAnimation.whileTap}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={transitionConfig}
          onClick={onClick}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedElement;