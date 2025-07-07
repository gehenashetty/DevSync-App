import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import Button from '../ui/Button';
import GitHubService from '../../services/GitHubService';
import CredentialService from '../../services/CredentialService';

const GitHubCredentialsForm = ({ onSuccess, onCancel }) => {
  const [credentials, setCredentials] = useState({
    token: ''
  });
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate credentials
      if (!CredentialService.validateGitHubCredentials(credentials)) {
        throw new Error('Please enter your GitHub Personal Access Token');
      }

      // Initialize GitHub service
      GitHubService.initialize(credentials);

      // Test connection
      const result = await GitHubService.testConnection();
      
      if (result.success) {
        // Store credentials
        CredentialService.storeCredentials('github', credentials);
        setSuccess(true);
        
        // Call success callback
        if (onSuccess) {
          onSuccess(result.user);
        }
      }
    } catch (error) {
      console.error('GitHub connection failed:', error);
      setError(error.message || 'Failed to connect to GitHub');
      GitHubService.reset(); // Reset on failure
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-6"
      >
        <CheckCircle size={48} className="text-accent-green mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          GitHub Connected Successfully!
        </h3>
        <p className="text-text-secondary">
          You can now access your GitHub data in real-time.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Connect to GitHub
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Personal Access Token *
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={credentials.token}
              onChange={(e) => handleInputChange('token', e.target.value)}
              placeholder="Enter your GitHub Personal Access Token"
              className="w-full bg-background-lighter border border-white/10 rounded-lg py-2 px-3 pr-10 text-text-primary"
              required
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Generate a Personal Access Token from your GitHub account settings
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <XCircle size={16} />
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Connecting...' : 'Connect to GitHub'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-background-lighter rounded-lg">
        <h4 className="text-sm font-medium text-text-primary mb-2">
          How to get your Personal Access Token:
        </h4>
        <ol className="text-xs text-text-secondary space-y-1">
          <li>1. Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">GitHub Settings → Developer settings → Personal access tokens</a></li>
          <li>2. Click "Generate new token (classic)"</li>
          <li>3. Give it a name (e.g., "DevSync")</li>
          <li>4. Select scopes: <code className="bg-background px-1 rounded">repo</code>, <code className="bg-background px-1 rounded">user</code></li>
          <li>5. Click "Generate token" and copy it</li>
        </ol>
        <p className="text-xs text-text-secondary mt-2">
          <strong>Note:</strong> The token will only be shown once. Make sure to copy it immediately!
        </p>
      </div>
    </motion.div>
  );
};

export default GitHubCredentialsForm; 