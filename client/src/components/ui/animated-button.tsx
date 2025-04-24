import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonProps {
  animationType?: 'bounce' | 'scale' | 'pulse' | 'ripple';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  iconAnimation?: 'spin' | 'bounce' | 'slide' | 'none';
  loadingAnimation?: 'pulse' | 'spinner' | 'dots';
  successAnimation?: boolean;
  className?: string;
  isLoading?: boolean;
  isSuccess?: boolean;
}

/**
 * AnimatedButton - Enhanced button with micro-animations
 */
export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  animationType = 'scale',
  iconLeft,
  iconRight,
  iconAnimation = 'none',
  loadingAnimation = 'spinner',
  successAnimation = true,
  className = '',
  isLoading = false,
  isSuccess = false,
  ...props
}) => {
  const [rippleEffect, setRippleEffect] = useState({ x: 0, y: 0, visible: false });

  // Handle ripple effect
  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    
    // Calculate ripple position based on click location
    setRippleEffect({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true
    });
    
    // Reset ripple after animation completes
    setTimeout(() => {
      setRippleEffect(prev => ({ ...prev, visible: false }));
    }, 500);
  };

  // Button animation variants
  const buttonVariants = {
    bounce: {
      tap: { scale: 0.95, y: 2 },
      hover: { scale: 1.02, y: -2, transition: { type: 'spring', stiffness: 400 } },
    },
    scale: {
      tap: { scale: 0.95 },
      hover: { scale: 1.05 },
    },
    pulse: {
      tap: { scale: 0.95 },
      hover: { 
        scale: [1, 1.03, 1], 
        transition: { 
          repeat: Infinity, 
          repeatType: 'mirror',
          duration: 1 
        } 
      },
    },
    ripple: {
      tap: { scale: 0.98 },
      hover: { scale: 1.02 },
    },
  };

  // Icon animation variants
  const iconVariants = {
    spin: {
      initial: { rotate: 0 },
      hover: { rotate: 360, transition: { duration: 0.5 } },
    },
    bounce: {
      initial: { y: 0 },
      hover: { y: [-2, 2, -2], transition: { repeat: Infinity, duration: 0.6 } },
    },
    slide: {
      initial: { x: 0 },
      hover: iconLeft ? { x: 3 } : { x: -3 },
    },
    none: {
      initial: {},
      hover: {},
    },
  };

  // Loading animation
  const renderLoadingIndicator = () => {
    switch (loadingAnimation) {
      case 'pulse':
        return (
          <motion.div
            className="w-4 h-4 bg-current rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        );
      case 'dots':
        return (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-current rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ 
                  repeat: Infinity,
                  duration: 0.6,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        );
      default: // spinner
        return (
          <motion.div
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
          />
        );
    }
  };

  // Success animation
  const renderSuccessIndicator = () => {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        className="text-green-500"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </motion.div>
    );
  };

  // Determine what content to render inside the button
  const renderButtonContent = () => {
    if (isLoading) {
      return renderLoadingIndicator();
    } else if (isSuccess && successAnimation) {
      return renderSuccessIndicator();
    } else {
      return (
        <div className="flex items-center gap-2">
          {iconLeft && (
            <motion.span
              variants={iconVariants[iconAnimation]}
              initial="initial"
              whileHover="hover"
              className="flex-shrink-0"
            >
              {iconLeft}
            </motion.span>
          )}
          <span>{children}</span>
          {iconRight && (
            <motion.span
              variants={iconVariants[iconAnimation]}
              initial="initial"
              whileHover="hover"
              className="flex-shrink-0"
            >
              {iconRight}
            </motion.span>
          )}
        </div>
      );
    }
  };

  return (
    <motion.div
      whileHover={buttonVariants[animationType].hover}
      whileTap={buttonVariants[animationType].tap}
      className="relative inline-block"
    >
      <Button
        className={cn(
          "relative overflow-hidden",
          className
        )}
        onClick={(e) => {
          if (animationType === 'ripple') {
            handleRipple(e);
          }
          props.onClick && props.onClick(e);
        }}
        disabled={isLoading || isSuccess || props.disabled}
        {...props}
      >
        {/* Ripple effect */}
        {animationType === 'ripple' && rippleEffect.visible && (
          <motion.span
            className="absolute rounded-full bg-white/30 dark:bg-white/10"
            initial={{ width: 0, height: 0, opacity: 0.5, x: rippleEffect.x, y: rippleEffect.y }}
            animate={{ width: 200, height: 200, opacity: 0, x: rippleEffect.x - 100, y: rippleEffect.y - 100 }}
            transition={{ duration: 0.5 }}
            style={{ 
              transformOrigin: 'center',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}
        
        {/* Button content with loading/success states */}
        <motion.div
          className="relative z-10 flex items-center justify-center"
          animate={{ 
            opacity: isLoading || (isSuccess && successAnimation) ? 0.8 : 1,
          }}
        >
          {renderButtonContent()}
        </motion.div>
      </Button>
    </motion.div>
  );
};

export default AnimatedButton;