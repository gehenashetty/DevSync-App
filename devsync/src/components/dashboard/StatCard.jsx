import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';

const StatCard = ({
  title,
  value,
  icon,
  trend = null, // { value: number, positive: boolean }
  variant = 'default',
  glowOnHover = true,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="stat-card"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="stat-card-title">{title}</h3>
        <div className={`p-2 rounded-lg bg-${variant === 'default' ? 'background-lighter' : `accent-${variant}/10`}`}>
          {icon}
        </div>
      </div>
      
      <div className="flex items-end justify-between mt-auto">
        <div className="stat-card-value">
          {value}
        </div>
        
        {trend && (
          <div className={`stat-card-trend ${trend.positive ? 'stat-card-trend-positive' : 'stat-card-trend-negative'}`}>
            <span>{trend.positive ? '↑' : '↓'}</span>
            <span className="ml-1">{trend.value}%</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard; 