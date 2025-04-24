import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Info, AlertTriangle } from 'lucide-react';
import { Toast, ToastClose } from '@/components/ui/toast';

interface AnimatedToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}

/**
 * AnimatedToast - A visually enhanced toast notification with animations
 */
export const AnimatedToast: React.FC<AnimatedToastProps> = ({
  title,
  description,
  variant = 'default',
  onClose,
}) => {
  // Determine icon based on variant
  const getIcon = () => {
    switch (variant) {
      case 'success': return <Check className="h-5 w-5 text-green-500" />;
      case 'error': return <X className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      default: return null;
    }
  };

  // Animation variants
  const toastVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 20 
      }
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95,
      transition: { 
        duration: 0.2 
      }
    }
  };

  // Icon animation
  const iconVariants = {
    hidden: { scale: 0, rotate: -20 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: 'spring', 
        stiffness: 500, 
        damping: 15,
        delay: 0.2
      }
    }
  };

  // Get background color based on variant
  const getBackgroundColor = () => {
    switch (variant) {
      case 'success': return 'bg-green-50 dark:bg-green-900/10';
      case 'error': return 'bg-red-50 dark:bg-red-900/10';
      case 'warning': return 'bg-amber-50 dark:bg-amber-900/10';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/10';
      default: return '';
    }
  };

  // Get border color based on variant
  const getBorderColor = () => {
    switch (variant) {
      case 'success': return 'border-green-200 dark:border-green-800';
      case 'error': return 'border-red-200 dark:border-red-800';
      case 'warning': return 'border-amber-200 dark:border-amber-800';
      case 'info': return 'border-blue-200 dark:border-blue-800';
      default: return '';
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={toastVariants}
      layout
    >
      <Toast className={`flex gap-3 ${getBackgroundColor()} ${getBorderColor()} border-l-4`}>
        {getIcon() && (
          <motion.div 
            variants={iconVariants}
            initial="hidden"
            animate="visible"
            className="flex-shrink-0 mt-1"
          >
            {getIcon()}
          </motion.div>
        )}
        
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="font-medium text-foreground">{title}</h3>
          </motion.div>
          
          {description && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-sm text-muted-foreground">{description}</p>
            </motion.div>
          )}
        </div>
        
        <ToastClose 
          onClick={onClose} 
          asChild
        >
          <motion.button
            whileHover={{ scale: 1.2, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="rounded-full p-1 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </ToastClose>
      </Toast>
    </motion.div>
  );
};

export default AnimatedToast;