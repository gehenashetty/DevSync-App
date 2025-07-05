import React from 'react';
import { motion } from 'framer-motion';

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }
};

const Card = ({
  children,
  className = '',
  variant = 'default', // default, blue, green, purple
  glowOnHover = false,
  animate = true,
  delay = 0,
  onClick,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'blue':
        return 'border-accent-blue/20 hover:border-accent-blue/40' + (glowOnHover ? ' hover:shadow-glow-blue' : '');
      case 'green':
        return 'border-accent-green/20 hover:border-accent-green/40' + (glowOnHover ? ' hover:shadow-glow-green' : '');
      case 'purple':
        return 'border-accent-purple/20 hover:border-accent-purple/40' + (glowOnHover ? ' hover:shadow-glow-purple' : '');
      default:
        return 'border-white/10 hover:border-white/20';
    }
  };

  const baseClasses = 'glass-card p-5 bg-background-card backdrop-blur-md border rounded-xl transition-all duration-300';
  const cardClasses = `${baseClasses} ${getVariantClasses()} ${className}`;

  return animate ? (
    <motion.div
      className={cardClasses}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={variants}
      transition={{ duration: 0.3, delay }}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  ) : (
    <div
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card; 