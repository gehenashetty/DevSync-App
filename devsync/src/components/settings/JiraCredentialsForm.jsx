import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import Button from '../ui/Button';
import JiraService from '../../services/JiraService';
import CredentialService from '../../services/CredentialService';
import JiraTestConnection from './JiraTestConnection';

const JiraCredentialsForm = ({ onSuccess, onCancel }) => {
  const [credentials, setCredentials] = useState({
    domain: '',
    email: '',
    apiToken: ''
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
      if (!CredentialService.validateJiraCredentials(credentials)) {
        throw new Error('Please fill in all required fields');
      }

      // Initialize Jira service
      JiraService.initialize(credentials);

      // Test connection
      const result = await JiraService.testConnection();
      
      if (result.success) {
        // Store credentials
        CredentialService.storeCredentials('jira', credentials);
        setSuccess(true);
        
        // Call success callback
        if (onSuccess) {
          onSuccess(result.user);
        }
      }
    } catch (error) {
      console.error('Jira connection failed:', error);
      setError(error.message || 'Failed to connect to Jira');
      JiraService.reset(); // Reset on failure
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
          Jira Connected Successfully!
        </h3>
        <p className="text-text-secondary">
          You can now access your Jira data in real-time.
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
        Connect to Jira
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Jira Domain *
          </label>
          <input
            type="text"
            value={credentials.domain}
            onChange={(e) => handleInputChange('domain', e.target.value)}
            placeholder="your-domain.atlassian.net"
            className="w-full bg-background-lighter border border-white/10 rounded-lg py-2 px-3 text-text-primary"
            required
          />
          <p className="text-xs text-text-secondary mt-1">
            Your Jira Cloud domain (e.g., mycompany.atlassian.net)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={credentials.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your-email@company.com"
            className="w-full bg-background-lighter border border-white/10 rounded-lg py-2 px-3 text-text-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            API Token *
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={credentials.apiToken}
              onChange={(e) => handleInputChange('apiToken', e.target.value)}
              placeholder="Enter your Jira API token"
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
            Generate an API token from your Atlassian account settings
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <XCircle size={16} />
            {error}
          </div>
        )}

        <div className="space-y-3 pt-4">
          <JiraTestConnection
            credentials={credentials}
            onSuccess={(result) => {
              console.log('Test connection successful:', result);
            }}
            onError={(error) => {
              console.log('Test connection failed:', error);
            }}
          />
          
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Connecting...' : 'Connect to Jira'}
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
        </div>
      </form>

      <div className="mt-6 p-4 bg-background-lighter rounded-lg">
        <h4 className="text-sm font-medium text-text-primary mb-2">
          How to get your API Token:
        </h4>
        <ol className="text-xs text-text-secondary space-y-1">
          <li>1. Go to <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">Atlassian Account Settings</a></li>
          <li>2. Click "Create API token"</li>
          <li>3. Give it a name (e.g., "DevSync")</li>
          <li>4. Copy the generated token</li>
        </ol>
      </div>
    </motion.div>
  );
};

export default JiraCredentialsForm; 