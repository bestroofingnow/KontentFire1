import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type HoverHighlightProps = {
  children: React.ReactNode;
  className?: string;
  highlightColor?: string;
  effect?: 'lift' | 'glow' | 'border' | 'background' | 'scale';
  duration?: number;
  onClick?: () => void;
  disabled?: boolean;
};

/**
 * HoverHighlight - Component that adds playful hover effects to any element
 * 
 * @example
 * <HoverHighlight effect="glow">
 *   <div>Hover over me!</div>
 * </HoverHighlight>
 */
export const HoverHighlight: React.FC<HoverHighlightProps> = ({
  children,
  className,
  highlightColor = 'rgba(255, 91, 46, 0.1)', // Default to primary brand color with transparency
  effect = 'lift',
  duration = 0.2,
  onClick,
  disabled = false
}) => {
  // Different animation effects
  const getAnimationEffect = () => {
    switch (effect) {
      case 'lift':
        return {
          rest: { y: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' },
          hover: { 
            y: -5, 
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
            transition: { 
              type: 'spring', 
              stiffness: 400, 
              damping: 17,
              duration 
            } 
          }
        };
      case 'glow':
        return {
          rest: { boxShadow: '0 0 0 rgba(0,0,0,0)' },
          hover: { 
            boxShadow: `0 0 20px ${highlightColor}`,
            transition: { duration } 
          }
        };
      case 'border':
        return {
          rest: { borderColor: 'transparent', boxShadow: '0 0 0 0 transparent' },
          hover: { 
            boxShadow: `0 0 0 2px ${highlightColor}`,
            transition: { duration } 
          }
        };
      case 'background':
        return {
          rest: { backgroundColor: 'transparent' },
          hover: { 
            backgroundColor: highlightColor,
            transition: { duration } 
          }
        };
      case 'scale':
        return {
          rest: { scale: 1 },
          hover: { 
            scale: 1.05,
            transition: { 
              type: 'spring', 
              stiffness: 400, 
              damping: 10,
              duration 
            } 
          }
        };
      default:
        return {
          rest: {},
          hover: {}
        };
    }
  };

  // These are the animations that happen when clicking
  const tapEffect = {
    lift: { y: 0, scale: 0.98 },
    glow: { boxShadow: `0 0 10px ${highlightColor}`, scale: 0.98 },
    border: { scale: 0.98 },
    background: { backgroundColor: `${highlightColor}dd`, scale: 0.98 }, // Slightly darker with opacity
    scale: { scale: 0.98 }
  };

  const animation = getAnimationEffect();

  return (
    <motion.div
      className={cn(
        'transition-all relative',
        disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      initial="rest"
      whileHover={disabled ? {} : "hover"}
      whileTap={disabled || !onClick ? {} : tapEffect[effect]}
      variants={animation}
      onClick={disabled ? undefined : onClick}
    >
      {children}
    </motion.div>
  );
};

export default HoverHighlight;