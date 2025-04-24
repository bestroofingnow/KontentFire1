import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardProps } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends CardProps {
  hoverEffect?: 'lift' | 'glow' | 'border' | 'scale' | 'rotate' | 'none';
  clickEffect?: 'press' | 'pulse' | 'shake' | 'none';
  isInteractive?: boolean;
  intensity?: 'low' | 'medium' | 'high';
  animate?: boolean;
  entrance?: 'fade' | 'slide' | 'scale' | 'none';
  delay?: number;
  duration?: number;
  children: React.ReactNode;
}

/**
 * AnimatedCard - An enhanced card component with interactive animations
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  hoverEffect = 'lift',
  clickEffect = 'press',
  isInteractive = true,
  intensity = 'medium',
  animate = true,
  entrance = 'fade',
  delay = 0,
  duration = 0.3,
  className,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);

  // Map intensity levels to animation values
  const intensityMap = {
    low: {
      lift: 2,
      scale: 1.01,
      rotate: 0.5,
      glow: [0, 1, 4],
      press: 0.98,
      border: '1px',
    },
    medium: {
      lift: 4,
      scale: 1.03,
      rotate: 1,
      glow: [0, 2, 8],
      press: 0.97,
      border: '2px',
    },
    high: {
      lift: 8,
      scale: 1.05,
      rotate: 2,
      glow: [0, 4, 12],
      press: 0.95,
      border: '3px',
    },
  };

  // Card hover animations
  const getHoverAnimation = () => {
    if (!isInteractive) return {};

    switch (hoverEffect) {
      case 'lift':
        return { y: -intensityMap[intensity].lift };
      case 'glow':
        return { 
          boxShadow: `0 0 ${intensityMap[intensity].glow[2]}px ${intensityMap[intensity].glow[1]}px rgba(var(--color-primary), 0.3)` 
        };
      case 'border':
        return { 
          boxShadow: `inset 0 0 0 ${intensityMap[intensity].border} rgba(var(--color-primary), 0.5)`,
          scale: 1.01
        };
      case 'scale':
        return { scale: intensityMap[intensity].scale };
      case 'rotate':
        return { rotate: intensityMap[intensity].rotate };
      default:
        return {};
    }
  };

  // Card click animations
  const getClickAnimation = () => {
    if (!isInteractive || !isPressed) return {};

    switch (clickEffect) {
      case 'press':
        return { scale: intensityMap[intensity].press };
      case 'pulse':
        return { 
          scale: [intensityMap[intensity].press, 1.02, 1],
          transition: { duration: 0.4 }
        };
      case 'shake':
        return { 
          x: [0, -2, 3, -2, 0],
          transition: { duration: 0.4 }
        };
      default:
        return {};
    }
  };

  // Entrance animations
  const getEntranceAnimation = () => {
    if (!animate) return {};

    switch (entrance) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
        };
      case 'slide':
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
        };
      default:
        return {};
    }
  };

  const entranceAnimation = getEntranceAnimation();

  return (
    <motion.div
      initial={entranceAnimation.initial}
      animate={entranceAnimation.animate}
      transition={{ 
        duration, 
        delay,
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
    >
      <motion.div
        whileHover={getHoverAnimation()}
        animate={getClickAnimation()}
        transition={{ 
          type: 'spring', 
          stiffness: 400, 
          damping: 15
        }}
        onMouseDown={() => isInteractive && setIsPressed(true)}
        onMouseUp={() => isInteractive && setIsPressed(false)}
        onMouseLeave={() => isInteractive && setIsPressed(false)}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        <Card
          className={cn(
            "transition-colors duration-200",
            isInteractive && "cursor-pointer",
            className
          )}
          {...props}
        >
          {children}
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AnimatedCard;