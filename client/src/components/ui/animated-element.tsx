import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type AnimatedElementProps = {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade' | 'slide-in' | 'scale' | 'bounce' | 'rotate' | 'none';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
  hover?: boolean;
  onClick?: () => void;
};

/**
 * AnimatedElement - General-purpose animated component wrapper
 * 
 * @example
 * <AnimatedElement animation="slide-in" direction="up" delay={0.2}>
 *   <div>Content to animate</div>
 * </AnimatedElement>
 */
export const AnimatedElement: React.FC<AnimatedElementProps> = ({
  children,
  className,
  animation = 'fade',
  direction = 'up',
  duration = 0.5,
  delay = 0,
  hover = false,
  onClick
}) => {
  // Configure initial and animate states based on animation type
  const getAnimationVariants = () => {
    switch (animation) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          hover: { opacity: 0.8 }
        };
        
      case 'slide-in': {
        const offset = 30;
        const directionMap = {
          up: { y: offset },
          down: { y: -offset },
          left: { x: offset },
          right: { x: -offset }
        };
        
        return {
          initial: { opacity: 0, ...directionMap[direction] },
          animate: { opacity: 1, x: 0, y: 0 },
          hover: { 
            ...directionMap[direction],
            scale: 0.98,
            transition: { duration: 0.2 } 
          }
        };
      }
      
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          hover: { scale: 1.05 }
        };
        
      case 'bounce':
        return {
          initial: { opacity: 0, y: 50 },
          animate: { 
            opacity: 1, 
            y: 0,
            transition: { 
              type: "spring", 
              stiffness: 300, 
              damping: 15 
            } 
          },
          hover: { 
            y: -5,
            transition: { 
              type: "spring", 
              stiffness: 500, 
              damping: 10 
            } 
          }
        };
        
      case 'rotate':
        return {
          initial: { opacity: 0, rotate: -30 },
          animate: { opacity: 1, rotate: 0 },
          hover: { rotate: 5 }
        };
        
      default:
        return {
          initial: {},
          animate: {},
          hover: {}
        };
    }
  };
  
  const variants = getAnimationVariants();
  
  return (
    <motion.div
      className={cn(onClick ? 'cursor-pointer' : '', className)}
      initial="initial"
      animate="animate"
      whileHover={hover ? "hover" : undefined}
      variants={variants}
      transition={{ 
        duration,
        delay,
        ease: "easeOut"
      }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedElement;