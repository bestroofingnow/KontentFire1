import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type AnimatedLoadingProps = {
  className?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'progress' | 'skeleton';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  textPosition?: 'top' | 'bottom' | 'left' | 'right';
  fullscreen?: boolean;
  progress?: number; // For progress variant (0-100)
  hideText?: boolean;
};

/**
 * AnimatedLoading - Component for loading animations
 * 
 * @example
 * <AnimatedLoading variant="spinner" text="Loading..." />
 */
export const AnimatedLoading: React.FC<AnimatedLoadingProps> = ({
  className,
  variant = 'spinner',
  size = 'md',
  color,
  text = 'Loading...',
  textPosition = 'bottom',
  fullscreen = false,
  progress = 0,
  hideText = false
}) => {
  // Size variants
  const sizeMap = {
    sm: {
      container: 'h-6 w-6',
      dot: 'h-1.5 w-1.5',
      text: 'text-xs',
      bar: 'h-1'
    },
    md: {
      container: 'h-10 w-10',
      dot: 'h-2 w-2',
      text: 'text-sm',
      bar: 'h-2'
    },
    lg: {
      container: 'h-14 w-14',
      dot: 'h-3 w-3',
      text: 'text-base',
      bar: 'h-3'
    }
  };
  
  // Container styling based on position and fullscreen
  const containerClassName = cn(
    'flex items-center justify-center',
    fullscreen ? 'fixed inset-0 bg-background/80 z-50' : 'relative',
    textPosition === 'left' || textPosition === 'right' ? 'flex-row' : 'flex-col',
    textPosition === 'top' ? 'flex-col-reverse' : '',
    textPosition === 'left' ? 'flex-row-reverse' : '',
    className
  );
  
  // Text styling based on position
  const textClassName = cn(
    sizeMap[size].text,
    'text-muted-foreground',
    textPosition === 'top' || textPosition === 'bottom' ? 'mt-2' : 'mx-3'
  );
  
  // Render spinner variant
  const renderSpinner = () => (
    <motion.div
      className={cn("text-primary", sizeMap[size].container)}
      style={{ color }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    >
      <Loader2 className="w-full h-full" />
    </motion.div>
  );
  
  // Render dots variant
  const renderDots = () => (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn("rounded-full bg-primary", sizeMap[size].dot)}
          style={{ backgroundColor: color }}
          animate={{ 
            y: [0, -10, 0],
            opacity: [0.3, 1, 0.3]
          }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity, 
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
  
  // Render pulse variant
  const renderPulse = () => (
    <motion.div
      className={cn("rounded-full bg-primary", sizeMap[size].container)}
      style={{ backgroundColor: color }}
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.8, 0.3]
      }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
  
  // Render progress variant
  const renderProgress = () => {
    const clampedProgress = Math.min(100, Math.max(0, progress));
    
    return (
      <div className="w-40 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn("bg-primary", sizeMap[size].bar)}
          style={{ backgroundColor: color }}
          initial={{ width: '0%' }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.5 }}
        />
        {!hideText && (
          <div className="mt-1 text-center text-xs">
            {clampedProgress.toFixed(0)}%
          </div>
        )}
      </div>
    );
  };
  
  // Render skeleton variant
  const renderSkeleton = () => (
    <div className="space-y-2 w-full max-w-md">
      <motion.div
        className="h-4 bg-muted rounded-md"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.div
        className="h-4 bg-muted rounded-md w-3/4"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="h-4 bg-muted rounded-md w-1/2"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  );
  
  // Render loading indicator based on variant
  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'dots':
        return renderDots();
      case 'pulse':
        return renderPulse();
      case 'progress':
        return renderProgress();
      case 'skeleton':
        return renderSkeleton();
      default:
        return renderSpinner();
    }
  };
  
  return (
    <div className={containerClassName}>
      {renderLoadingIndicator()}
      {!hideText && variant !== 'progress' && variant !== 'skeleton' && (
        <div className={textClassName}>{text}</div>
      )}
    </div>
  );
};

export default AnimatedLoading;