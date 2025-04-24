import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedIconProps {
  icon: React.ReactNode;
  animation?: 'spin' | 'pulse' | 'bounce' | 'shake' | 'wiggle' | 'ping';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  onClick?: () => void;
  isButton?: boolean;
  hoverAnimation?: boolean;
  continuous?: boolean;
  duration?: number;
  delay?: number;
}

/**
 * AnimatedIcon - Component for animated icons with various effects
 */
export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  icon,
  animation = 'pulse',
  size = 'md',
  color,
  className = '',
  onClick,
  isButton = false,
  hoverAnimation = true,
  continuous = false,
  duration = 1,
  delay = 0,
}) => {
  // Size mappings
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  // Animation variants
  const getAnimationVariant = () => {
    const variants = {
      spin: {
        animate: { 
          rotate: 360,
          transition: { 
            repeat: continuous ? Infinity : 0,
            duration,
            delay,
            ease: 'linear',
          }
        },
        hover: { rotate: 360, transition: { duration: 0.6 } },
      },
      pulse: {
        animate: { 
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
          transition: { 
            repeat: continuous ? Infinity : 0,
            duration,
            delay,
          }
        },
        hover: { scale: 1.2, transition: { duration: 0.3 } },
      },
      bounce: {
        animate: { 
          y: [0, -5, 0],
          transition: { 
            repeat: continuous ? Infinity : 0,
            duration,
            delay,
          }
        },
        hover: { y: -5, transition: { type: 'spring', stiffness: 300 } },
      },
      shake: {
        animate: { 
          rotate: [0, -3, 3, -3, 0],
          transition: { 
            repeat: continuous ? Infinity : 0,
            duration,
            delay,
          }
        },
        hover: { rotate: [-3, 3, -3, 0], transition: { duration: 0.4 } },
      },
      wiggle: {
        animate: { 
          rotate: [0, -10, 10, -10, 0],
          transition: { 
            repeat: continuous ? Infinity : 0,
            duration,
            delay,
          }
        },
        hover: { rotate: 15, transition: { duration: 0.2 } },
      },
      ping: {
        animate: { 
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
          transition: { 
            repeat: continuous ? Infinity : 0,
            duration: duration / 2,
            delay,
            repeatDelay: duration / 2,
          }
        },
        hover: { scale: 1.3, transition: { duration: 0.2 } },
      },
    };

    return variants[animation];
  };

  // Get the appropriate variant
  const variant = getAnimationVariant();

  return (
    <motion.div
      className={cn(
        sizeClasses[size],
        isButton && 'cursor-pointer',
        className
      )}
      style={{ color, display: 'inline-flex' }}
      animate={continuous ? variant.animate : undefined}
      whileHover={hoverAnimation ? variant.hover : undefined}
      whileTap={isButton ? { scale: 0.9 } : undefined}
      onClick={onClick}
    >
      {icon}
    </motion.div>
  );
};

export default AnimatedIcon;