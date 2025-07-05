import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Tag, Calendar, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

const TaskForm = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    
    const taskData = {
      title,
      description,
      dueDate: dueDate || null,
      priority,
      tags,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    
    onSubmit(taskData);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        staggerChildren: 0.07
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={formVariants}
      className="bg-background-lighter border border-white/10 rounded-lg p-5"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-text-primary">Create New Task</h3>
        <motion.button
          onClick={onCancel}
          className="text-text-secondary hover:text-text-primary"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X size={18} />
        </motion.button>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center text-sm text-red-300"
        >
          <AlertCircle size={16} className="mr-2" />
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div variants={itemVariants}>
          <label htmlFor="title" className="block text-sm text-text-secondary mb-1">
            Title*
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            className="w-full bg-background p-2 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            placeholder="Task title"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor="description" className="block text-sm text-text-secondary mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-background p-2 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 min-h-[80px]"
            placeholder="Task description"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor="dueDate" className="block text-sm text-text-secondary mb-1">
            Due Date
          </label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-background p-2 pl-10 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor="priority" className="block text-sm text-text-secondary mb-1">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full bg-background p-2 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor="tags" className="block text-sm text-text-secondary mb-1">
            Tags
          </label>
          <div className="flex items-center">
            <div className="relative flex-1">
              <Tag size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-background p-2 pl-10 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                placeholder="Add tags"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddTag}
              className="ml-2"
            >
              Add
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center bg-background px-2 py-1 rounded-full text-xs text-text-secondary"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-text-muted hover:text-text-primary"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="flex justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="success"
          >
            Create Task
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default TaskForm; 