import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, Check, AlertTriangle, Info, BellRing } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'notification';

type AnimatedToastProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  className?: string;
  showIcon?: boolean;
  showCloseButton?: boolean;
  action?: React.ReactNode;
};

/**
 * AnimatedToast - Enhanced toast notifications with animations
 * 
 * @example
 * <AnimatedToast 
 *   open={isOpen} 
 *   onClose={() => setIsOpen(false)}
 *   title="Success!"
 *   description="Your changes have been saved."
 *   type="success"
 * />
 */
export const AnimatedToast: React.FC<AnimatedToastProps> = ({
  open,
  onClose,
  title,
  description,
  type = 'info',
  duration = 5000,
  position = 'top-right',
  className,
  showIcon = true,
  showCloseButton = true,
  action
}) => {
  // Auto-close toast after specified duration
  React.useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);
  
  // Position styles
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };
  
  // Toast type styles and icons
  const typeStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-500',
      icon: <Check className="h-5 w-5" />
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      iconColor: 'text-red-500',
      icon: <X className="h-5 w-5" />
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      iconColor: 'text-amber-500',
      icon: <AlertTriangle className="h-5 w-5" />
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-500',
      icon: <Info className="h-5 w-5" />
    },
    notification: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      iconColor: 'text-purple-500',
      icon: <BellRing className="h-5 w-5" />
    }
  };
  
  // Animation variants for the toast
  const toastVariants = {
    initial: {
      opacity: 0,
      y: position.includes('top') ? -20 : 20,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    },
    exit: {
      opacity: 0,
      x: position.includes('left') ? -10 : position.includes('right') ? 10 : 0,
      scale: 0.95,
      transition: { duration: 0.2, ease: 'easeOut' }
    }
  };
  
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={cn(
            'fixed z-50 max-w-md min-w-[300px] rounded-lg border shadow-lg',
            positionStyles[position],
            typeStyles[type].bg,
            typeStyles[type].border,
            className
          )}
          variants={toastVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <div className="flex p-4">
            {showIcon && (
              <div className={cn('mr-3 flex-shrink-0', typeStyles[type].iconColor)}>
                {typeStyles[type].icon}
              </div>
            )}
            
            <div className="flex-1">
              <div className="font-medium mb-1">{title}</div>
              {description && (
                <div className="text-sm text-muted-foreground">{description}</div>
              )}
              {action && (
                <div className="mt-2">
                  {action}
                </div>
              )}
            </div>
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-3 flex-shrink-0 text-muted-foreground hover:text-foreground rounded-full p-1 
                           hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Progress bar */}
          {duration > 0 && (
            <motion.div
              className={cn('h-1 rounded-b-lg', typeStyles[type].iconColor.replace('text', 'bg'))}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Hook for easier toast usage with animations
 */
export const useAnimatedToast = () => {
  const { toast } = useToast();
  
  const showToast = React.useCallback(
    ({ title, description, type = 'info', duration = 5000, action }: Omit<AnimatedToastProps, 'open' | 'onClose'>) => {
      toast({
        title,
        description,
        variant: type === 'success' ? 'default' : type === 'error' ? 'destructive' : 'default',
        duration,
        action
      });
    },
    [toast]
  );
  
  return { showToast };
};

export default AnimatedToast;