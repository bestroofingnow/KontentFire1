import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type AnimatedTextProps = {
  children: string;
  className?: string;
  effect?: 'wave' | 'typewriter' | 'highlight' | 'bounce' | 'gradient';
  duration?: number;
  delay?: number;
  color?: string;
  highlightColor?: string;
  charactersDelay?: number;
  hoverTrigger?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

/**
 * AnimatedText - Component for fancy text animations
 * 
 * @example
 * <AnimatedText effect="wave">Hello World!</AnimatedText>
 */
export const AnimatedText: React.FC<AnimatedTextProps> = ({
  children,
  className,
  effect = 'wave',
  duration = 0.5,
  delay = 0,
  color = '#FF5B2E', // Primary brand color 
  highlightColor = 'rgba(255, 91, 46, 0.3)', // Primary with transparency
  charactersDelay = 0.05,
  hoverTrigger = false,
  onMouseEnter,
  onMouseLeave
}) => {
  const [isHovering, setIsHovering] = useState(false);
  
  // Split text into individual characters for character-by-character animations
  const characters = children.split('');
  
  // Handle hover events
  const handleMouseEnter = () => {
    setIsHovering(true);
    if (onMouseEnter) onMouseEnter();
  };
  
  const handleMouseLeave = () => {
    setIsHovering(false);
    if (onMouseLeave) onMouseLeave();
  };
  
  // Base animation should trigger if not hover-dependent or if currently hovering
  const shouldAnimate = !hoverTrigger || (hoverTrigger && isHovering);
  
  // Configuration for different effects
  const getAnimationEffect = () => {
    switch (effect) {
      case 'wave':
        return {
          container: {},
          character: (index: number) => ({
            initial: { y: 0 },
            animate: shouldAnimate ? { 
              y: [0, -10, 0],
              transition: { 
                delay: delay + index * charactersDelay,
                repeat: hoverTrigger ? 0 : Infinity,
                repeatDelay: hoverTrigger ? 0 : 3,
                duration: 0.5, 
                ease: "easeInOut" 
              }
            } : { y: 0 }
          })
        };
      
      case 'typewriter':
        return {
          container: {
            initial: { width: '0%' },
            animate: shouldAnimate ? { 
              width: '100%',
              transition: { 
                duration: characters.length * charactersDelay,
                ease: "easeOut",
                delay 
              }
            } : { width: '0%' }
          },
          character: () => ({
            initial: { opacity: 0 },
            animate: shouldAnimate ? { 
              opacity: 1,
              transition: { duration: 0.1 } 
            } : { opacity: 0 }
          })
        };
      
      case 'highlight':
        return {
          container: {
            initial: { 
              backgroundImage: `linear-gradient(transparent 0%, transparent 100%)` 
            },
            animate: shouldAnimate ? { 
              backgroundImage: `linear-gradient(transparent 0%, transparent 60%, ${highlightColor} 60%, ${highlightColor} 85%, transparent 85%)`,
              transition: { 
                duration,
                delay 
              }
            } : { 
              backgroundImage: `linear-gradient(transparent 0%, transparent 100%)` 
            }
          },
          character: () => ({})
        };
      
      case 'bounce':
        return {
          container: {},
          character: (index: number) => ({
            initial: { y: 0, opacity: 1 },
            animate: shouldAnimate ? { 
              y: [0, -15, 0],
              transition: { 
                delay: delay + index * charactersDelay,
                type: "spring",
                stiffness: 300,
                damping: 10
              }
            } : { y: 0 }
          })
        };
      
      case 'gradient':
        return {
          container: {
            initial: { 
              backgroundImage: `linear-gradient(90deg, #000 0%, #000 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            },
            animate: shouldAnimate ? { 
              backgroundImage: `linear-gradient(90deg, ${color} 0%, #000 100%)`,
              transition: { 
                repeat: hoverTrigger ? 0 : Infinity, 
                repeatType: "reverse" as const,
                duration: 2,
                ease: "easeInOut"
              }
            } : { 
              backgroundImage: `linear-gradient(90deg, #000 0%, #000 100%)` 
            }
          },
          character: () => ({})
        };
      
      default:
        return {
          container: {},
          character: () => ({})
        };
    }
  };
  
  const animations = getAnimationEffect();
  
  // For effects like 'highlight' and 'gradient' that animate the whole text
  if (effect === 'highlight' || effect === 'gradient') {
    return (
      <motion.span
        className={cn('inline-block', className)}
        initial={animations.container.initial}
        animate={animations.container.animate}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </motion.span>
    );
  }
  
  // For typewriter effect
  if (effect === 'typewriter') {
    return (
      <motion.div
        className={cn('overflow-hidden inline-block whitespace-nowrap', className)}
        initial={animations.container.initial}
        animate={animations.container.animate}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </motion.div>
    );
  }
  
  // For effects that animate each character individually
  return (
    <span
      className={cn('inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {characters.map((char, index) => (
        <motion.span
          key={index}
          variants={animations.character(index)}
          initial="initial"
          animate="animate"
          style={{ display: 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
};

export default AnimatedText;