import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Calendar, Clock, CheckCircle, Circle, User, Tag } from 'lucide-react';

const TaskCard = ({
  title,
  description,
  dueDate,
  priority = 'medium',
  status = 'pending',
  tags = [],
  assignee = null,
  progress = 0,
  onClick,
  onStatusChange,
  delay = 0,
}) => {
  const getPriorityColor = () => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'blue';
    }
  };
  
  const getStatusIcon = () => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle size={18} className="text-accent-green" />;
      case 'in_progress':
        return <motion.div 
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Circle size={18} className="text-accent-blue" />
        </motion.div>;
      default:
        return <Circle size={18} className="text-text-muted" />;
    }
  };
  
  const isOverdue = dueDate && new Date(dueDate) < new Date();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card 
        variant="green" 
        className="cursor-pointer hover:translate-y-0 transform transition-transform duration-300 hover:-translate-y-1"
        onClick={onClick}
        animate={false}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange && onStatusChange(status === 'completed' ? 'pending' : 'completed');
              }}
              className="p-1 hover:bg-white/5 rounded-full transition-colors"
            >
              {getStatusIcon()}
            </button>
            <h3 className={`font-medium ${status === 'completed' ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
              {title}
            </h3>
          </div>
          
          <Badge variant={getPriorityColor()} size="sm">
            {priority}
          </Badge>
        </div>
        
        {description && (
          <p className="text-text-secondary text-sm ml-7 mb-3 line-clamp-2">{description}</p>
        )}
        
        {progress > 0 && progress < 100 && (
          <div className="ml-7 mb-3">
            <div className="h-1.5 w-full bg-background-lighter rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, delay: delay + 0.3 }}
                className="h-full bg-gradient-to-r from-accent-green to-accent-green-light rounded-full"
              />
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-xs text-text-secondary">{progress}%</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-1.5 ml-7 mb-3">
          {tags.map((tag, index) => (
            <div 
              key={index}
              className="flex items-center px-2 py-0.5 rounded-full bg-background-lighter text-xs text-text-secondary"
            >
              <Tag size={10} className="mr-1" />
              {tag}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-auto ml-7 pt-2 border-t border-white/5">
          {dueDate && (
            <div className={`flex items-center text-xs ${isOverdue ? 'text-red-400' : 'text-text-secondary'}`}>
              <Calendar size={12} className="mr-1" />
              <span>{new Date(dueDate).toLocaleDateString()}</span>
              {isOverdue && <span className="ml-1">(Overdue)</span>}
            </div>
          )}
          
          {assignee && (
            <div className="flex items-center space-x-1.5">
              <div className="h-5 w-5 rounded-full bg-background-lighter border border-white/10 flex items-center justify-center overflow-hidden text-xs">
                {assignee.avatar || assignee.initials || <User size={12} />}
              </div>
              <span className="text-xs text-text-secondary">{assignee.name}</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default TaskCard; 