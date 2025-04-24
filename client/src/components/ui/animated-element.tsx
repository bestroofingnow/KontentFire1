import React from 'react';
import { motion, Variant } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedElementProps {
  children: React.ReactNode;
  animation?: 'fade' | 'slide-in' | 'pop' | 'bounce' | 'pulse' | 'scale' | 'wiggle';
  delay?: number;
  duration?: number;
  className?: string;
  repeat?: boolean | number;
  custom?: any;
  whileHover?: boolean;
  whileTap?: boolean;
  onAnimationComplete?: () => void;
}

/**
 * AnimatedElement - A general purpose animated container 
 */
export const AnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  animation = 'fade',
  delay = 0,
  duration = 0.5,
  className = '',
  repeat = false,
  custom,
  whileHover = false,
  whileTap = false,
  onAnimationComplete,
}) => {
  // Animation variants for different effects
  const variants = {
    fade: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { 
          duration,
          delay 
        } 
      },
    },
    'slide-in': {
      hidden: { x: -30, opacity: 0 },
      visible: { 
        x: 0, 
        opacity: 1,
        transition: { 
          type: 'spring',
          stiffness: 300,
          damping: 24,
          delay 
        } 
      },
    },
    pop: {
      hidden: { scale: 0.8, opacity: 0 },
      visible: { 
        scale: 1, 
        opacity: 1,
        transition: { 
          type: 'spring',
          stiffness: 300,
          damping: 10,
          delay 
        } 
      },
    },
    bounce: {
      hidden: { y: -20, opacity: 0 },
      visible: { 
        y: 0, 
        opacity: 1,
        transition: { 
          type: 'spring',
          stiffness: 300,
          damping: 10,
          delay 
        } 
      },
    },
    pulse: {
      hidden: { scale: 1 },
      visible: { 
        scale: [1, 1.05, 1],
        transition: { 
          duration: duration,
          delay,
          repeat: typeof repeat === 'number' ? repeat : repeat ? Infinity : 0,
          repeatType: "mirror" as "mirror" | "loop" | "reverse" | undefined
        } 
      },
    },
    scale: {
      hidden: { scale: 0 },
      visible: { 
        scale: 1,
        transition: { 
          type: 'spring',
          stiffness: 300,
          damping: 20,
          delay 
        } 
      },
    },
    wiggle: {
      hidden: { rotate: 0 },
      visible: { 
        rotate: [0, -5, 5, -5, 0],
        transition: { 
          duration: duration,
          delay,
          repeat: typeof repeat === 'number' ? repeat : repeat ? Infinity : 0,
          repeatType: "mirror" as "mirror" | "loop" | "reverse" | undefined,
          repeatDelay: 1,
        } 
      },
    },
  };

  // Hover animations
  const hoverAnimations = {
    fade: { opacity: 0.8 },
    'slide-in': { x: 5 },
    pop: { scale: 1.05 },
    bounce: { y: -5 },
    pulse: { scale: 1.05 },
    scale: { scale: 1.05 },
    wiggle: { rotate: 5 },
  };

  // Tap animations
  const tapAnimations = {
    fade: { opacity: 0.6 },
    'slide-in': { x: -2 },
    pop: { scale: 0.95 },
    bounce: { y: 2 },
    pulse: { scale: 0.95 },
    scale: { scale: 0.95 },
    wiggle: { rotate: -5 },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants[animation]}
      whileHover={whileHover ? hoverAnimations[animation] : undefined}
      whileTap={whileTap ? tapAnimations[animation] : undefined}
      custom={custom}
      onAnimationComplete={onAnimationComplete}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedElement;