import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Clock, AlertCircle, CheckCircle2, ArrowRightCircle } from 'lucide-react';

const getPriorityIcon = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return <AlertCircle size={14} className="text-red-400" />;
    case 'medium':
      return <Clock size={14} className="text-yellow-400" />;
    case 'low':
      return <CheckCircle2 size={14} className="text-accent-green" />;
    default:
      return <Clock size={14} className="text-text-muted" />;
  }
};

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'todo':
    case 'to do':
    case 'backlog':
      return <Badge variant="purple">To Do</Badge>;
    case 'in progress':
      return <Badge variant="blue" glow>In Progress</Badge>;
    case 'review':
    case 'in review':
      return <Badge variant="yellow">In Review</Badge>;
    case 'done':
    case 'completed':
      return <Badge variant="green">Done</Badge>;
    default:
      return <Badge>{status || 'Unknown'}</Badge>;
  }
};

const JiraTicketCard = ({
  id,
  summary,
  status,
  priority = 'medium',
  assignee = null,
  dueDate = null,
  onClick,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card 
        variant="blue" 
        className="cursor-pointer hover:translate-y-0 transform transition-transform duration-300 hover:-translate-y-1"
        onClick={onClick}
        animate={false}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-accent-blue-light font-mono text-sm">{id}</span>
            {getStatusBadge(status)}
          </div>
          <div className="flex items-center space-x-1">
            {getPriorityIcon(priority)}
            <span className="text-xs text-text-secondary capitalize">{priority}</span>
          </div>
        </div>
        
        <h3 className="text-text-primary font-medium mb-4 line-clamp-2">{summary}</h3>
        
        <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/5">
          {assignee ? (
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded-full bg-background-lighter border border-white/10 flex items-center justify-center overflow-hidden text-xs">
                {assignee.avatar || assignee.initials || '?'}
              </div>
              <span className="text-xs text-text-secondary">{assignee.name}</span>
            </div>
          ) : (
            <span className="text-xs text-text-muted">Unassigned</span>
          )}
          
          {dueDate && (
            <div className="flex items-center text-xs text-text-secondary">
              <Clock size={12} className="mr-1" />
              <span>{new Date(dueDate).toLocaleDateString()}</span>
            </div>
          )}
          
          <ArrowRightCircle size={16} className="text-accent-blue-light ml-auto" />
        </div>
      </Card>
    </motion.div>
  );
};

export default JiraTicketCard; 