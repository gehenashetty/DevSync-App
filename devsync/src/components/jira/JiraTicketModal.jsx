import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Calendar,
  MessageSquare,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Edit3,
  MoreHorizontal,
  Save,
  X as CloseIcon
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const getPriorityIcon = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return <AlertCircle size={16} className="text-red-400" />;
    case 'medium':
      return <Clock size={16} className="text-yellow-400" />;
    case 'low':
      return <CheckCircle2 size={16} className="text-accent-green" />;
    default:
      return <Clock size={16} className="text-text-muted" />;
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

const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'text-red-400 bg-red-400/10 border-red-400/20';
    case 'medium':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'low':
      return 'text-accent-green bg-accent-green/10 border-accent-green/20';
    default:
      return 'text-text-muted bg-background-lighter border-white/10';
  }
};

const JiraTicketModal = ({ 
  ticket, 
  isOpen, 
  onClose, 
  onStatusChange,
  onPriorityChange,
  onTicketUpdate
}) => {
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    comments: false,
    activity: false
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [comments, setComments] = useState(ticket?.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      if (onTicketUpdate) {
        await onTicketUpdate(ticket.id, editData);
      }
      setIsEditing(false);
      showToast('Ticket updated successfully!');
    } catch (error) {
      console.error('Error saving ticket:', error);
      showToast('Failed to save ticket. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData({
      summary: ticket.summary || '',
      description: ticket.description || '',
      priority: ticket.priority || 'medium',
      status: ticket.status || 'To Do'
    });
    setIsEditing(false);
  };

  // Initialize edit data when ticket changes
  useEffect(() => {
    if (ticket) {
      setEditData({
        summary: ticket.summary || '',
        description: ticket.description || '',
        priority: ticket.priority || 'medium',
        status: ticket.status || 'To Do'
      });
      setComments(ticket.comments || []);
    }
  }, [ticket]);

  // Handle body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    } else {
      // Restore background scrolling
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        onClose();
      }
      
      // Save on Ctrl+S
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (isEditing) {
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditing, onClose]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleStatusChange = async (newStatus) => {
    setIsSubmitting(true);
    try {
      if (onStatusChange) {
        await onStatusChange(ticket.id, newStatus);
      }
      // Update local state immediately for better UX
      setEditData(prev => ({ ...prev, status: newStatus }));
    } catch (error) {
      console.error('Error updating status:', error);
      // Could add toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriorityChange = async (newPriority) => {
    setIsSubmitting(true);
    try {
      if (onPriorityChange) {
        await onPriorityChange(ticket.id, newPriority);
      }
      setEditData(prev => ({ ...prev, priority: newPriority }));
    } catch (error) {
      console.error('Error updating priority:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const comment = {
        id: Date.now(),
        content: newComment.trim(),
        author: 'Current User', // In real app, get from auth context
        timestamp: new Date().toISOString(),
        avatar: 'CU'
      };
      
      const updatedComments = [...comments, comment];
      setComments(updatedComments);
      setNewComment('');
      
      // In real app, save to backend
      if (onTicketUpdate) {
        await onTicketUpdate(ticket.id, { comments: updatedComments });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTicketId = () => {
    navigator.clipboard.writeText(ticket.id);
    showToast('Ticket ID copied to clipboard!');
  };

  const formatRelativeTime = (timeString) => {
    if (!timeString) return 'Unknown';
    
    const now = new Date();
    const time = new Date(timeString);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return time.toLocaleDateString();
  };

  if (!ticket) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-background-lighter rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-accent-blue-light font-mono text-lg font-semibold">
                    {ticket.id}
                  </span>
                  <button
                    onClick={copyTicketId}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Copy ticket ID"
                  >
                    <Copy size={14} className="text-text-secondary" />
                  </button>
                </div>
                {getStatusBadge(editData.status || ticket.status)}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<ExternalLink size={16} />}
                  onClick={() => {
                    const jiraUrl ='https://gehenah1101.atlassian.net';
                    window.open(`${jiraUrl}/browse/${ticket.id}`, '_blank');
                  }}
                >
                  Open in Jira
                </Button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={20} className="text-text-secondary" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex h-[calc(90vh-120px)]">
              {/* Main Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6">
                  {/* Title and Priority */}
                  <div className="mb-6">
                    {isEditing ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editData.summary}
                          onChange={(e) => setEditData(prev => ({ ...prev, summary: e.target.value }))}
                          className="w-full text-2xl font-semibold bg-background border border-white/10 rounded-lg px-3 py-2 text-text-primary"
                          placeholder="Ticket summary"
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getPriorityColor(editData.priority)}`}>
                              {getPriorityIcon(editData.priority)}
                              <select
                                value={editData.priority}
                                onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value }))}
                                className="bg-transparent border-none text-sm font-medium capitalize focus:outline-none"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Save size={16} />}
                              onClick={handleSave}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<CloseIcon size={16} />}
                              onClick={handleCancelEdit}
                              disabled={isSubmitting}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-2xl font-semibold text-text-primary mb-4">
                          {editData.summary || ticket.summary}
                        </h1>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getPriorityColor(editData.priority || ticket.priority)}`}>
                              {getPriorityIcon(editData.priority || ticket.priority)}
                              <span className="text-sm font-medium capitalize">{editData.priority || ticket.priority}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Edit3 size={16} />}
                              onClick={handleEdit}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<MoreHorizontal size={16} />}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-secondary">Status</span>
                        <select
                          value={editData.status || ticket.status}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          disabled={isSubmitting}
                          className="bg-background border border-white/10 rounded px-2 py-1 text-sm"
                        >
                          <option value="To Do">To Do</option>
                          <option value="In Progress">In Progress</option>
                          <option value="In Review">In Review</option>
                          <option value="Done">Done</option>
                        </select>
                      </div>
                      <div className="text-lg font-semibold">{editData.status || ticket.status}</div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-secondary">Priority</span>
                        <select
                          value={editData.priority || ticket.priority}
                          onChange={(e) => handlePriorityChange(e.target.value)}
                          disabled={isSubmitting}
                          className="bg-background border border-white/10 rounded px-2 py-1 text-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div className="text-lg font-semibold capitalize">{editData.priority || ticket.priority}</div>
                    </Card>
                  </div>

                  {/* Description */}
                  <Card className="mb-6">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => toggleSection('description')}
                    >
                      <h3 className="text-lg font-semibold flex items-center">
                        <MessageSquare size={18} className="mr-2 text-accent-blue" />
                        Description
                      </h3>
                      {expandedSections.description ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                    
                    <AnimatePresence>
                      {expandedSections.description && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4">
                            {isEditing ? (
                              <textarea
                                value={editData.description}
                                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full bg-background border border-white/10 rounded-lg p-3 text-text-primary placeholder-text-secondary resize-none"
                                rows={6}
                                placeholder="Enter ticket description..."
                              />
                            ) : (
                              <div className="text-text-primary whitespace-pre-wrap">
                                {editData.description || ticket.description || 'No description provided.'}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>

                  {/* Comments */}
                  <Card className="mb-6">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => toggleSection('comments')}
                    >
                      <h3 className="text-lg font-semibold flex items-center">
                        <MessageSquare size={18} className="mr-2 text-accent-green" />
                        Comments ({comments.length})
                      </h3>
                      {expandedSections.comments ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                    
                    <AnimatePresence>
                      {expandedSections.comments && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-4">
                            {comments.length > 0 ? (
                              comments.map((comment) => (
                                <div key={comment.id} className="flex space-x-3">
                                  <div className="h-8 w-8 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center text-sm font-medium text-accent-blue">
                                    {comment.avatar}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-medium text-text-primary">{comment.author}</span>
                                      <span className="text-xs text-text-secondary">
                                        {formatRelativeTime(comment.timestamp)}
                                      </span>
                                    </div>
                                    <div className="text-text-primary bg-background rounded-lg p-3">
                                      {comment.content}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-text-secondary">
                                No comments yet. Be the first to comment!
                              </div>
                            )}
                            
                            <div className="mt-4">
                              <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full bg-background border border-white/10 rounded-lg p-3 text-text-primary placeholder-text-secondary resize-none"
                                rows={3}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) {
                                    handleAddComment();
                                  }
                                }}
                              />
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-text-secondary">
                                  Press Ctrl+Enter to submit
                                </span>
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  onClick={handleAddComment}
                                  disabled={!newComment.trim() || isSubmitting}
                                >
                                  {isSubmitting ? 'Adding...' : 'Add Comment'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-80 border-l border-white/10 bg-background overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Assignee */}
                  <div>
                    <h4 className="text-sm font-medium text-text-secondary mb-3">Assignee</h4>
                    <div className="flex items-center space-x-3 p-3 bg-background-lighter rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center text-sm font-medium text-accent-blue">
                        {ticket.assignee?.avatar || ticket.assignee?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">{ticket.assignee?.name || 'Unassigned'}</div>
                        <div className="text-xs text-text-secondary">{ticket.assignee?.email || 'No email'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <h4 className="text-sm font-medium text-text-secondary mb-3">Due Date</h4>
                    <div className="flex items-center space-x-2 p-3 bg-background-lighter rounded-lg">
                      <Calendar size={16} className="text-accent-blue" />
                      <span className="text-text-primary">
                        {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'No due date'}
                      </span>
                    </div>
                  </div>

                  {/* Created/Updated */}
                  <div>
                    <h4 className="text-sm font-medium text-text-secondary mb-3">Timeline</h4>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-text-secondary">Created:</span>
                        <span className="text-text-primary ml-2">
                          {ticket.created ? formatRelativeTime(ticket.created) : 'Unknown'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-text-secondary">Updated:</span>
                        <span className="text-text-primary ml-2">
                          {ticket.updated ? formatRelativeTime(ticket.updated) : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-60 ${
              toast.type === 'error' 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default JiraTicketModal; 