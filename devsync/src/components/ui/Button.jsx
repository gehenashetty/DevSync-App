import React from 'react';
import { motion } from 'framer-motion';
import { useSound } from '../ThemeProvider';
import { Loader2 } from 'lucide-react';

const Button = ({
  children,
  className = '',
  variant = 'primary', // primary, secondary, success, danger, outline
  size = 'md', // sm, md, lg
  icon,
  iconPosition = 'left',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  soundEffect = 'click',
  ...props
}) => {
  const { enabled: soundEnabled, playSound } = useSound();

  const handleClick = (e) => {
    if (soundEnabled && !disabled && !isLoading) {
      playSound(soundEffect);
    }
    onClick?.(e);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-accent-blue to-accent-blue-light text-white hover:shadow-glow-blue';
      case 'secondary':
        return 'bg-background-lighter text-text-primary border border-white/10 hover:border-white/20';
      case 'success':
        return 'bg-gradient-to-r from-accent-green to-accent-green-light text-white hover:shadow-glow-green';
      case 'danger':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-md';
      case 'outline':
        return 'bg-transparent border border-accent-blue text-accent-blue hover:bg-accent-blue/10';
      default:
        return 'bg-gradient-to-r from-accent-blue to-accent-blue-light text-white hover:shadow-glow-blue';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  const baseClasses = 'rounded-lg font-medium transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed hover:transform-none' : 'cursor-pointer';
  const buttonClasses = `${baseClasses} ${getVariantClasses()} ${getSizeClasses()} ${disabledClasses} ${className}`;

  const buttonContent = (
    <>
      {isLoading && (
        <Loader2 size={size === 'sm' ? '14' : size === 'md' ? '16' : '20'} className="animate-spin mr-2" />
      )}
      {icon && iconPosition === 'left' && !isLoading && <span className="mr-2">{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </>
  );

  return (
    <motion.button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || isLoading}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
};

export default Button; 