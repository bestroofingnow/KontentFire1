import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type AnimatedBadgeProps = {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
  effect?: 'pulse' | 'bounce' | 'shake' | 'tada' | 'none';
  animate?: boolean;
  duration?: number;
  repeatCount?: number | 'infinite';
  size?: 'default' | 'sm' | 'lg';
  onClick?: () => void;
};

/**
 * AnimatedBadge - Badge with playful animation effects
 * 
 * @example
 * <AnimatedBadge effect="pulse" animate={true}>New</AnimatedBadge>
 */
export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  children,
  className,
  variant = 'default',
  effect = 'pulse',
  animate = false,
  duration = 1.5,
  repeatCount = 'infinite',
  size = 'default',
  onClick
}) => {
  const controls = useAnimation();
  
  // Different animation effects
  const getAnimationVariants = () => {
    switch (effect) {
      case 'pulse':
        return {
          initial: { scale: 1 },
          animate: { scale: [1, 1.1, 1], transition: { duration: 0.8, repeat: repeatCount === 'infinite' ? Infinity : Number(repeatCount), repeatType: "loop" as const } }
        };
      case 'bounce':
        return {
          initial: { y: 0 },
          animate: { y: [0, -5, 0], transition: { duration: 0.5, repeat: repeatCount === 'infinite' ? Infinity : Number(repeatCount), repeatType: "loop" as const } }
        };
      case 'shake':
        return {
          initial: { x: 0 },
          animate: { x: [0, -2, 2, -2, 0], transition: { duration: 0.4, repeat: repeatCount === 'infinite' ? Infinity : Number(repeatCount), repeatType: "loop" as const } }
        };
      case 'tada':
        return {
          initial: { scale: 1, rotate: 0 },
          animate: { 
            scale: [1, 0.9, 1.1, 1.1, 1.1, 1.1, 1.1, 1.1, 1],
            rotate: [0, -3, 3, -3, 3, -3, 3, -3, 0],
            transition: { duration: 1, repeat: repeatCount === 'infinite' ? Infinity : Number(repeatCount), repeatType: "loop" as const, repeatDelay: 1 } 
          }
        };
      default:
        return {
          initial: {},
          animate: {}
        };
    }
  };
  
  // Size variants
  const sizeVariants = {
    default: '',
    sm: 'px-2 py-0.5 text-xs',
    lg: 'px-3 py-1.5 text-base'
  };
  
  // Animation for when the badge appears
  const appearAnimation = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      transition: { type: 'spring', stiffness: 500, damping: 20, duration: 0.3 } 
    }
  };
  
  const variants = getAnimationVariants();
  
  // Start animation when the 'animate' prop changes
  useEffect(() => {
    if (animate && effect !== 'none') {
      controls.start(variants.animate);
    } else {
      controls.stop();
      controls.set(variants.initial);
    }
  }, [animate, effect, controls, variants]);
  
  return (
    <motion.div
      className="inline-block"
      initial={appearAnimation.initial}
      animate={appearAnimation.animate}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        initial={variants.initial}
        animate={controls}
      >
        <Badge 
          className={cn(sizeVariants[size], className)}
          variant={variant}
          onClick={onClick}
        >
          {children}
        </Badge>
      </motion.div>
    </motion.div>
  );
};

// Success and other custom variants
const variantClasses = {
  success: 'bg-green-500 hover:bg-green-600 text-white',
};

type CustomBadgeProps = React.ComponentProps<typeof Badge> & {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
};

export const CustomBadge: React.FC<CustomBadgeProps> = ({ 
  className, 
  variant = 'default', 
  ...props 
}) => {
  const customVariantClass = variant in variantClasses 
    ? variantClasses[variant as keyof typeof variantClasses] 
    : '';
  
  return (
    <Badge 
      className={cn(customVariantClass, className)} 
      {...props} 
    />
  );
};

export default AnimatedBadge;