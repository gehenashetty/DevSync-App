import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Github, AlertCircle, Link } from 'lucide-react';
import Button from '../ui/Button';

const AddRepoForm = ({ onSubmit, onCancel }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const validateAndExtractRepo = (url) => {
    // Clear previous errors
    setError('');
    
    // Handle empty input
    if (!url.trim()) {
      setError('Repository URL or name is required');
      return null;
    }
    
    try {
      // Handle direct owner/repo format
      if (url.split('/').length === 2 && !url.includes('github.com')) {
        return url.trim();
      }
      
      // Handle full GitHub URLs
      const githubUrlRegex = /github\.com\/([^\/]+)\/([^\/]+)/;
      const match = url.match(githubUrlRegex);
      
      if (match) {
        const [, owner, repo] = match;
        // Remove .git extension if present
        const cleanRepo = repo.replace(/\.git$/, '');
        return `${owner}/${cleanRepo}`;
      }
      
      setError('Invalid GitHub repository format. Please use owner/repo or a GitHub URL');
      return null;
    } catch (err) {
      setError('Could not parse repository information');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    
    try {
      const repoPath = validateAndExtractRepo(repoUrl);
      
      if (!repoPath) {
        setIsValidating(false);
        return;
      }
      
      onSubmit(repoPath);
    } catch (err) {
      setError('An error occurred while processing your request');
    } finally {
      setIsValidating(false);
    }
  };

  const formVariants = {
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
        <h3 className="text-lg font-medium text-text-primary">Add GitHub Repository</h3>
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
        <div>
          <label htmlFor="repoUrl" className="block text-sm text-text-secondary mb-1">
            Repository URL or Name*
          </label>
          <div className="relative">
            <Github size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted" />
            <input
              id="repoUrl"
              type="text"
              value={repoUrl}
              onChange={(e) => {
                setRepoUrl(e.target.value);
                if (error) setError('');
              }}
              className="w-full bg-background p-2 pl-10 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
              placeholder="owner/repo or https://github.com/owner/repo"
              disabled={isValidating}
            />
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Examples: "vercel/next.js" or "https://github.com/facebook/react"
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isValidating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isValidating}
            icon={<Link size={16} />}
            iconPosition="left"
          >
            Connect Repository
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddRepoForm; 