import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type PageTransitionProps = {
  children: React.ReactNode;
  location?: string; // Current location/path
  className?: string;
  effect?: 'fade' | 'slide' | 'scale' | 'flip' | 'none';
  duration?: number;
  direction?: 'left' | 'right' | 'up' | 'down';
};

/**
 * PageTransition - Adds smooth animations between page changes
 * 
 * @example
 * <PageTransition location={location} effect="slide">
 *   <Switch>
 *     <Route path="/">{HomePage}</Route>
 *     <Route path="/settings">{SettingsPage}</Route>
 *   </Switch>
 * </PageTransition>
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  location,
  className,
  effect = 'fade',
  duration = 0.3,
  direction = 'right'
}) => {
  // Different animation effects
  const getAnimationVariants = () => {
    switch (effect) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
      
      case 'slide':
        let offset = 30; // Default offset for slide animations
        
        // Adjust direction
        const directionOffset = {
          left: { x: -offset, y: 0 },
          right: { x: offset, y: 0 },
          up: { x: 0, y: -offset },
          down: { x: 0, y: offset }
        };
        
        const { x, y } = directionOffset[direction];
        
        return {
          initial: { opacity: 0, x, y },
          animate: { opacity: 1, x: 0, y: 0 },
          exit: { opacity: 0, x: -x, y: -y }
        };
      
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.05 }
        };
      
      case 'flip':
        return {
          initial: { opacity: 0, rotateY: direction === 'left' || direction === 'right' ? 90 : 0, rotateX: direction === 'up' || direction === 'down' ? 90 : 0 },
          animate: { opacity: 1, rotateY: 0, rotateX: 0 },
          exit: { opacity: 0, rotateY: direction === 'left' || direction === 'right' ? -90 : 0, rotateX: direction === 'up' || direction === 'down' ? -90 : 0 }
        };
      
      case 'none':
      default:
        return {
          initial: {},
          animate: {},
          exit: {}
        };
    }
  };
  
  const variants = getAnimationVariants();
  
  const getTransition = () => {
    if (effect === 'flip') {
      return {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        duration
      };
    }
    
    return {
      duration,
      ease: 'easeInOut'
    };
  };
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={getTransition()}
        className={cn('w-full h-full', className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Simpler wrapper for individual elements
type TransitionElementProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  effect?: 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out' | 'none';
};

export const TransitionElement: React.FC<TransitionElementProps> = ({
  children,
  className,
  delay = 0,
  duration = 0.5,
  effect = 'fade-in'
}) => {
  const getAnimationVariants = () => {
    switch (effect) {
      case 'fade-in':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 }
        };
      case 'slide-up':
        return {
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0 }
        };
      case 'slide-down':
        return {
          hidden: { opacity: 0, y: -30 },
          visible: { opacity: 1, y: 0 }
        };
      case 'slide-left':
        return {
          hidden: { opacity: 0, x: 30 },
          visible: { opacity: 1, x: 0 }
        };
      case 'slide-right':
        return {
          hidden: { opacity: 0, x: -30 },
          visible: { opacity: 1, x: 0 }
        };
      case 'zoom-in':
        return {
          hidden: { opacity: 0, scale: 0.9 },
          visible: { opacity: 1, scale: 1 }
        };
      case 'zoom-out':
        return {
          hidden: { opacity: 0, scale: 1.1 },
          visible: { opacity: 1, scale: 1 }
        };
      case 'none':
      default:
        return {
          hidden: {},
          visible: {}
        };
    }
  };
  
  const variants = getAnimationVariants();
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;