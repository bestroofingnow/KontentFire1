import React from 'react';
import { motion } from 'framer-motion';

type LoadingVariant = 'spinner' | 'dots' | 'pulse' | 'bars' | 'grid';

interface AnimatedLoadingProps {
  variant?: LoadingVariant;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullScreen?: boolean;
  text?: string;
}

/**
 * AnimatedLoading - Provides animated loading indicators
 */
export const AnimatedLoading: React.FC<AnimatedLoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  color = 'currentColor',
  fullScreen = false,
  text,
}) => {
  // Size mapping
  const sizeMap = {
    sm: {
      container: 'w-6 h-6',
      spinner: 'w-6 h-6 border-2',
      dot: 'w-1.5 h-1.5',
      bar: 'w-1 h-6',
      pulseCircle: 'w-6 h-6',
      gridItem: 'w-1.5 h-1.5',
      text: 'text-sm',
    },
    md: {
      container: 'w-10 h-10',
      spinner: 'w-10 h-10 border-3',
      dot: 'w-2.5 h-2.5',
      bar: 'w-1.5 h-10',
      pulseCircle: 'w-10 h-10',
      gridItem: 'w-2 h-2',
      text: 'text-base',
    },
    lg: {
      container: 'w-16 h-16',
      spinner: 'w-16 h-16 border-4',
      dot: 'w-4 h-4',
      bar: 'w-2 h-16',
      pulseCircle: 'w-16 h-16',
      gridItem: 'w-3 h-3',
      text: 'text-lg',
    },
  };

  // Wrapper for fullscreen or inline loading
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (fullScreen) {
      return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-background/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center justify-center gap-4"
          >
            {children}
          </motion.div>
        </div>
      );
    }
    
    return <div className="flex flex-col items-center justify-center gap-2">{children}</div>;
  };

  // Renders spinner loading animation
  const renderSpinner = () => (
    <motion.div
      className={`${sizeMap[size].spinner} rounded-full border-solid border-primary/30 border-t-primary`}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      style={{ color }}
    />
  );

  // Renders dots loading animation
  const renderDots = () => (
    <div className="flex gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${sizeMap[size].dot} rounded-full`}
          animate={{ y: [0, -10, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ 
            repeat: Infinity,
            duration: 0.6,
            delay: i * 0.15,
          }}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );

  // Renders pulse loading animation
  const renderPulse = () => (
    <motion.div
      className={`${sizeMap[size].pulseCircle} rounded-full`}
      animate={{ 
        scale: [1, 1.1, 1], 
        opacity: [0.5, 1, 0.5],
        boxShadow: [
          '0 0 0 0 rgba(var(--color-primary), 0.7)', 
          '0 0 0 10px rgba(var(--color-primary), 0)', 
          '0 0 0 0 rgba(var(--color-primary), 0)'
        ] 
      }}
      transition={{ repeat: Infinity, duration: 1.5 }}
      style={{ backgroundColor: color }}
    />
  );

  // Renders bars loading animation
  const renderBars = () => (
    <div className="flex gap-1.5 items-end">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className={`${sizeMap[size].bar} rounded-full`}
          style={{ backgroundColor: color }}
          animate={{ height: [
            `${(i+1) * 20}%`,
            `${100 - (i * 10)}%`,
            `${(i+1) * 20}%`,
          ]}}
          transition={{ 
            repeat: Infinity,
            duration: 1,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );

  // Renders grid loading animation
  const renderGrid = () => (
    <div className="grid grid-cols-3 gap-1.5">
      {[...Array(9)].map((_, i) => (
        <motion.div
          key={i}
          className={`${sizeMap[size].gridItem} rounded-sm`}
          style={{ backgroundColor: color }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1, 0.8] }}
          transition={{ 
            repeat: Infinity,
            duration: 0.8,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );

  // Select the appropriate loading animation based on variant
  const renderLoading = () => {
    switch (variant) {
      case 'dots': return renderDots();
      case 'pulse': return renderPulse();
      case 'bars': return renderBars();
      case 'grid': return renderGrid();
      default: return renderSpinner();
    }
  };

  return (
    <Wrapper>
      {renderLoading()}
      {text && (
        <motion.p 
          className={`text-muted-foreground ${sizeMap[size].text}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </Wrapper>
  );
};

export default AnimatedLoading;