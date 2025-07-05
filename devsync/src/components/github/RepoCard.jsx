import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Star, GitFork, Eye, GitBranch, GitCommit, Code } from 'lucide-react';

const RepoCard = ({
  name,
  description,
  stars,
  forks,
  watchers,
  language,
  lastCommit,
  openIssues,
  pullRequests,
  onClick,
  delay = 0,
}) => {
  const getLanguageColor = (lang) => {
    const colors = {
      javascript: 'bg-yellow-400',
      typescript: 'bg-blue-400',
      python: 'bg-accent-blue',
      java: 'bg-red-500',
      'c#': 'bg-accent-green',
      php: 'bg-accent-purple',
      go: 'bg-cyan-400',
      rust: 'bg-orange-500',
      ruby: 'bg-red-400',
      default: 'bg-gray-400',
    };
    
    return colors[lang?.toLowerCase()] || colors.default;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card 
        variant="purple" 
        className="cursor-pointer hover:translate-y-0 transform transition-transform duration-300 hover:-translate-y-1"
        onClick={onClick}
        animate={false}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-text-primary font-medium flex items-center">
            <Code size={16} className="mr-2 text-accent-purple-light" />
            {name}
          </h3>
          
          {language && (
            <div className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-1.5 ${getLanguageColor(language)}`}></div>
              <span className="text-xs text-text-secondary">{language}</span>
            </div>
          )}
        </div>
        
        {description && (
          <p className="text-text-secondary text-sm mb-4 line-clamp-2">{description}</p>
        )}
        
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-background-lighter">
            <Star size={14} className="text-yellow-400 mb-1" />
            <span className="text-xs text-text-secondary">{stars || 0}</span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-background-lighter">
            <GitFork size={14} className="text-accent-blue mb-1" />
            <span className="text-xs text-text-secondary">{forks || 0}</span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-background-lighter">
            <Eye size={14} className="text-accent-green mb-1" />
            <span className="text-xs text-text-secondary">{watchers || 0}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-auto pt-2 border-t border-white/5">
          {lastCommit && (
            <div className="flex items-center text-xs text-text-secondary">
              <GitCommit size={12} className="mr-1" />
              <span>{new Date(lastCommit).toLocaleDateString()}</span>
            </div>
          )}
          
          <div className="flex space-x-2">
            {openIssues > 0 && (
              <Badge variant="red" size="sm">
                {openIssues} {openIssues === 1 ? 'issue' : 'issues'}
              </Badge>
            )}
            
            {pullRequests > 0 && (
              <Badge variant="green" size="sm">
                {pullRequests} {pullRequests === 1 ? 'PR' : 'PRs'}
              </Badge>
            )}
          </div>
          
          <GitBranch size={16} className="text-accent-purple-light ml-auto" />
        </div>
      </Card>
    </motion.div>
  );
};

export default RepoCard; 