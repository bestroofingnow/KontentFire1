import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type AnimatedIconProps = {
  icon: React.ReactNode;
  className?: string;
  animation?: 'pulse' | 'rotate' | 'bounce' | 'shake' | 'hover-bounce' | 'none';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  duration?: number;
  repeatDelay?: number;
  continuous?: boolean;
  onClick?: () => void;
};

/**
 * AnimatedIcon - Component for animated icons
 * 
 * @example
 * <AnimatedIcon icon={<Zap />} animation="pulse" />
 */
export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  icon,
  className,
  animation = 'none',
  size = 'md',
  color,
  duration = 1,
  repeatDelay = 0,
  continuous = false,
  onClick
}) => {
  // Size variants
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10'
  };
  
  // Animation variants
  const getAnimationVariants = () => {
    switch (animation) {
      case 'pulse':
        return {
          animate: { 
            scale: [1, 1.1, 1],
            opacity: [1, 0.8, 1],
            transition: { 
              duration,
              repeat: continuous ? Infinity : 0,
              repeatType: "loop" as const,
              repeatDelay
            }
          }
        };
        
      case 'rotate':
        return {
          animate: { 
            rotate: 360,
            transition: { 
              duration,
              ease: "linear",
              repeat: continuous ? Infinity : 0,
              repeatType: "loop" as const,
              repeatDelay
            }
          }
        };
        
      case 'bounce':
        return {
          animate: { 
            y: [0, -5, 0],
            transition: { 
              duration: duration * 0.5,
              repeat: continuous ? Infinity : 0,
              repeatType: "loop" as const,
              repeatDelay
            }
          }
        };
        
      case 'shake':
        return {
          animate: { 
            x: [0, -3, 3, -3, 0],
            transition: { 
              duration: duration * 0.5,
              repeat: continuous ? Infinity : 0,
              repeatType: "loop" as const,
              repeatDelay
            }
          }
        };
        
      case 'hover-bounce':
        return {
          initial: { y: 0 },
          hover: { 
            y: -5,
            transition: { 
              type: "spring",
              stiffness: 300,
              damping: 10
            }
          }
        };
        
      default:
        return {
          animate: {}
        };
    }
  };
  
  const variants = getAnimationVariants();
  
  // Handle click animation
  const handleClick = () => {
    if (onClick) onClick();
  };
  
  return (
    <motion.div
      className={cn(
        sizeMap[size],
        onClick ? 'cursor-pointer' : '',
        className
      )}
      style={{ color }}
      variants={variants}
      animate={animation !== 'hover-bounce' ? 'animate' : undefined}
      initial={animation === 'hover-bounce' ? 'initial' : undefined}
      whileHover={animation === 'hover-bounce' ? 'hover' : undefined}
      whileTap={onClick ? { scale: 0.9 } : undefined}
      onClick={handleClick}
    >
      {icon}
    </motion.div>
  );
};

export default AnimatedIcon;