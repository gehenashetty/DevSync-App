import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const Toast = ({ 
  message, 
  type = 'success', 
  isVisible, 
  onClose, 
  duration = 2000,
  index = 0
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} className="text-accent-green" />;
      case 'error':
        return <AlertCircle size={24} className="text-red-500" />;
      case 'info':
        return <Info size={24} className="text-accent-blue" />;
      default:
        return <CheckCircle size={24} className="text-accent-green" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-accent-green/20 to-accent-green-light/20 border-accent-green/30';
      case 'error':
        return 'bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/30';
      case 'info':
        return 'bg-gradient-to-r from-accent-blue/20 to-accent-blue-light/20 border-accent-blue/30';
      default:
        return 'bg-gradient-to-r from-accent-green/20 to-accent-green-light/20 border-accent-green/30';
    }
  };

  const variants = {
    hidden: { 
      opacity: 0,
      scale: 0.9,
      y: -20
    },
    visible: { 
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
        delay: index * 0.1
      }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: { 
        duration: 0.2,
        ease: 'easeOut'
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="pointer-events-auto max-w-md w-full"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
        >
          <div className={`flex items-center p-4 rounded-lg shadow-lg backdrop-blur-md border ${getBackgroundColor()} bg-background-lighter/80`}>
            <div className="mr-3 text-center">
              {getIcon()}
            </div>
            <div className="flex-1">
              <p className="text-base font-medium text-text-primary">{message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast; 