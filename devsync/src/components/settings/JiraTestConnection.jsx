import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import Button from '../ui/Button';
import JiraService from '../../services/JiraService';

const JiraTestConnection = ({ credentials, onSuccess, onError }) => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Initialize Jira service with credentials
      JiraService.initialize(credentials);
      
      // Test connection
      const testResult = await JiraService.testConnection();
      
      setResult({ success: true, data: testResult });
      if (onSuccess) onSuccess(testResult);
      
    } catch (error) {
      console.error('Connection test failed:', error);
      setResult({ success: false, error: error.message });
      if (onError) onError(error);
    } finally {
      setTesting(false);
    }
  };

  if (testing) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader className="animate-spin mr-2" size={20} />
        <span>Testing connection...</span>
      </div>
    );
  }

  if (result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4"
      >
        {result.success ? (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle size={20} />
            <span>Connection successful! Welcome, {result.data.user.displayName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-400">
            <XCircle size={20} />
            <span>Connection failed: {result.error}</span>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <Button
      onClick={testConnection}
      variant="secondary"
      size="sm"
      className="w-full"
    >
      Test Connection
    </Button>
  );
};

export default JiraTestConnection; 