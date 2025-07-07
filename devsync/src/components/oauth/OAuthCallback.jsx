import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import OAuthService from '../../services/OAuthService';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const provider = window.location.pathname.includes('jira') ? 'jira' : 'github';

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          return;
        }

        setMessage('Exchanging authorization code for access token...');

        // Exchange code for token
        const tokens = await OAuthService.exchangeCodeForToken(provider, code);
        
        // Store tokens
        OAuthService.storeTokens(provider, tokens);

        setStatus('success');
        setMessage(`${provider === 'jira' ? 'Jira' : 'GitHub'} connected successfully!`);

        // Redirect back to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(`Authentication failed: ${error.message}`);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader size={48} className="animate-spin text-accent-blue" />;
      case 'success':
        return <CheckCircle size={48} className="text-accent-green" />;
      case 'error':
        return <XCircle size={48} className="text-red-500" />;
      default:
        return <Loader size={48} className="animate-spin text-accent-blue" />;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-accent-blue/10';
      case 'success':
        return 'bg-accent-green/10';
      case 'error':
        return 'bg-red-500/10';
      default:
        return 'bg-accent-blue/10';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-md w-full p-8 rounded-xl border ${getBackgroundColor()} border-white/10`}
      >
        <div className="text-center">
          <div className="mb-6">
            {getIcon()}
          </div>
          
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            {status === 'processing' && 'Processing Authentication'}
            {status === 'success' && 'Authentication Successful'}
            {status === 'error' && 'Authentication Failed'}
          </h2>
          
          <p className="text-text-secondary mb-6">
            {message}
          </p>
          
          {status === 'error' && (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue-dark transition-colors"
            >
              Return to Dashboard
            </button>
          )}
          
          {status === 'processing' && (
            <div className="text-sm text-text-secondary">
              Please wait while we complete the authentication...
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OAuthCallback; 