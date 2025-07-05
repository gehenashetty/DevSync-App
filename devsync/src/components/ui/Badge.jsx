import React from 'react';
import { motion } from 'framer-motion';

const Badge = ({
  children,
  className = '',
  variant = 'default', // default, blue, green, purple, yellow, red
  size = 'md', // sm, md, lg
  glow = false,
  pulse = false,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'blue':
        return `bg-accent-blue/20 text-accent-blue-light border-accent-blue/30 ${glow ? 'shadow-glow-blue' : ''}`;
      case 'green':
        return `bg-accent-green/20 text-accent-green-light border-accent-green/30 ${glow ? 'shadow-glow-green' : ''}`;
      case 'purple':
        return `bg-accent-purple/20 text-accent-purple-light border-accent-purple/30 ${glow ? 'shadow-glow-purple' : ''}`;
      case 'yellow':
        return `bg-yellow-500/20 text-yellow-300 border-yellow-500/30 ${glow ? 'shadow-md' : ''}`;
      case 'red':
        return `bg-red-500/20 text-red-300 border-red-500/30 ${glow ? 'shadow-md' : ''}`;
      default:
        return `bg-gray-500/20 text-gray-300 border-gray-500/30 ${glow ? 'shadow-md' : ''}`;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'lg':
        return 'text-sm px-3 py-1';
      default:
        return 'text-xs px-2.5 py-0.5';
    }
  };

  const baseClasses = 'inline-flex items-center justify-center rounded-full border font-medium';
  const pulseClasses = pulse ? 'animate-pulse-glow' : '';
  const badgeClasses = `${baseClasses} ${getVariantClasses()} ${getSizeClasses()} ${pulseClasses} ${className}`;

  return (
    <motion.span
      className={badgeClasses}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.span>
  );
};

export default Badge; 