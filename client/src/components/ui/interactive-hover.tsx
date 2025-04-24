import React, { ReactNode, useState, useEffect } from 'react';
import { motion, MotionProps, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { primaryRgba } from '@/lib/color-utils';

export type HoverEffectType = 
  | 'scale' 
  | 'glow' 
  | 'lift' 
  | 'tilt' 
  | 'float' 
  | 'bounce' 
  | 'magnetic' 
  | 'highlight' 
  | 'pulse'
  | 'none';

type InteractiveHoverProps = {
  children: ReactNode;
  className?: string;
  effect: HoverEffectType;
  intensity?: 'light' | 'medium' | 'strong';
  disabled?: boolean;
  glowColor?: string;
  highlightColor?: string;
  delay?: number;
  onClick?: () => void;
} & Omit<MotionProps, 'variants' | 'animate' | 'initial' | 'whileHover' | 'whileTap'>;

const InteractiveHover: React.FC<InteractiveHoverProps> = ({
  children,
  className = '',
  effect = 'scale',
  intensity = 'medium',
  disabled = false,
  glowColor,
  highlightColor,
  delay = 0,
  onClick,
  ...motionProps
}) => {
  // Generate colors from primary color to avoid CSS variable issues
  const [actualGlowColor, setActualGlowColor] = useState(glowColor || 'rgba(255, 91, 46, 0.5)');
  const [actualHighlightColor, setActualHighlightColor] = useState(highlightColor || 'rgba(255, 91, 46, 0.1)');
  
  // Update colors on client-side to get actual computed values
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActualGlowColor(glowColor || primaryRgba(0.5));
      setActualHighlightColor(highlightColor || primaryRgba(0.1));
    }
  }, [glowColor, highlightColor]);
  
  const [isHovered, setIsHovered] = useState(false);
  const [magnetPosition, setMagnetPosition] = useState({ x: 0, y: 0 });

  // Scale for different intensity levels
  const intensityScales = {
    scale: {
      light: 1.02,
      medium: 1.05,
      strong: 1.1
    },
    lift: {
      light: -3,
      medium: -6,
      strong: -10
    },
    tilt: {
      light: 5,
      medium: 10,
      strong: 15
    },
    float: {
      light: 3,
      medium: 6, 
      strong: 10
    },
    magnetic: {
      light: 5,
      medium: 15,
      strong: 30
    },
    pulse: {
      light: 0.98,
      medium: 0.95,
      strong: 0.9
    }
  };

  // Handle magnetic effect mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (effect !== 'magnetic' || disabled) return;
    
    const { clientX, clientY } = e;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate distance from center
    const moveX = (clientX - centerX) / 8;
    const moveY = (clientY - centerY) / 8;
    
    // Adjust for intensity
    const intensityMultiplier = intensityScales.magnetic[intensity];
    const adjustedX = moveX * (intensityMultiplier / 15);
    const adjustedY = moveY * (intensityMultiplier / 15);
    
    setMagnetPosition({ x: adjustedX, y: adjustedY });
  };

  // Reset magnetic position when mouse leaves
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMagnetPosition({ x: 0, y: 0 });
  };

  // Define variants for different effects
  const hoverVariants: Record<HoverEffectType, Variants> = {
    scale: {
      initial: {
        scale: 1,
        transition: { 
          type: 'spring', 
          stiffness: 300, 
          damping: 20, 
          delay 
        }
      },
      hover: {
        scale: intensityScales.scale[intensity],
        transition: { 
          type: 'spring', 
          stiffness: 300, 
          damping: 15, 
          delay 
        }
      }
    },
    glow: {
      initial: {
        boxShadow: `0 0 0px rgba(0, 0, 0, 0)`,
        transition: { delay }
      },
      hover: {
        boxShadow: `0 0 20px ${actualGlowColor}`,
        transition: { delay }
      }
    },
    lift: {
      initial: {
        y: 0,
        boxShadow: '0 0 0px rgba(0, 0, 0, 0)',
        transition: { 
          type: 'spring', 
          stiffness: 300, 
          damping: 20, 
          delay 
        }
      },
      hover: {
        y: intensityScales.lift[intensity],
        boxShadow: `0 ${Math.abs(intensityScales.lift[intensity]) * 0.8}px ${Math.abs(intensityScales.lift[intensity]) * 1.5}px rgba(0, 0, 0, 0.1)`,
        transition: { 
          type: 'spring', 
          stiffness: 300, 
          damping: 15, 
          delay 
        }
      }
    },
    tilt: {
      initial: {
        rotateX: 0,
        rotateY: 0,
        transition: { 
          type: 'spring', 
          stiffness: 300, 
          damping: 20, 
          delay 
        }
      },
      hover: {
        rotateX: intensityScales.tilt[intensity] / 2,
        rotateY: intensityScales.tilt[intensity],
        transition: { 
          type: 'spring', 
          stiffness: 300, 
          damping: 15, 
          delay 
        }
      }
    },
    float: {
      initial: {
        y: 0,
        transition: { 
          type: 'spring', 
          stiffness: 300, 
          damping: 20, 
          delay 
        }
      },
      hover: {
        y: [-intensityScales.float[intensity], 0, -intensityScales.float[intensity] / 2],
        transition: { 
          repeat: Infinity,
          repeatType: "mirror" as "mirror" | "loop" | "reverse" | undefined,
          duration: 2, 
          ease: "easeInOut", 
          delay 
        }
      }
    },
    bounce: {
      initial: {
        y: 0,
        transition: { delay }
      },
      hover: {
        y: [0, -5, 0],
        transition: { 
          repeat: Infinity,
          repeatType: "mirror" as "mirror" | "loop" | "reverse" | undefined,
          duration: 0.5, 
          ease: "easeInOut", 
          delay 
        }
      }
    },
    magnetic: {
      initial: {
        x: 0,
        y: 0,
        transition: { 
          type: 'spring', 
          stiffness: 300, 
          damping: 20, 
          delay 
        }
      },
      hover: {
        x: magnetPosition.x,
        y: magnetPosition.y,
        transition: { 
          type: 'spring', 
          stiffness: 350, 
          damping: 15, 
          delay 
        }
      }
    },
    highlight: {
      initial: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        transition: { delay }
      },
      hover: {
        backgroundColor: actualHighlightColor,
        transition: { delay }
      }
    },
    pulse: {
      initial: {
        scale: 1,
        transition: { delay }
      },
      hover: {
        scale: [1, intensityScales.pulse[intensity], 1],
        transition: { 
          repeat: Infinity,
          repeatType: "mirror" as "mirror" | "loop" | "reverse" | undefined,
          duration: 1.5, 
          ease: "easeInOut", 
          delay 
        }
      }
    },
    none: {
      initial: {},
      hover: {}
    }
  };

  // Special handling for magnetic effect which needs mouse position tracking
  if (effect === 'magnetic') {
    return (
      <motion.div
        className={cn("interactive-hover", className)}
        variants={hoverVariants[effect]}
        animate={isHovered ? 'hover' : 'initial'}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={disabled ? undefined : onClick}
        style={{ 
          cursor: disabled ? 'default' : 'pointer',
          perspective: '1000px',
          transformStyle: 'preserve-3d'
        }}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn("interactive-hover", className)}
      variants={hoverVariants[effect]}
      initial="initial"
      whileHover={disabled ? undefined : "hover"}
      onClick={disabled ? undefined : onClick}
      style={{ 
        cursor: disabled ? 'default' : 'pointer',
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default InteractiveHover;