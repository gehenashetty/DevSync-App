import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import AuthForm from "./components/AuthForm";
import Dashboard from "./components/Dashboard";
import { motion } from "framer-motion";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ThemeProvider from './components/ThemeProvider';
import { ToastProvider } from './components/ui/ToastProvider';
import './App.css';

// Error boundary component to catch and display errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="glass-card p-8 max-w-md w-full text-center">
            <div className="h-16 w-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-display font-bold text-red-400 mb-2">Something went wrong</h2>
            <p className="text-text-secondary mb-4">{this.state.error && this.state.error.toString()}</p>
            <button 
              className="px-4 py-2 bg-accent-blue text-white rounded-lg"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="h-16 w-16 mx-auto mb-4">
            <svg className="animate-spin h-full w-full text-accent-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-text-secondary text-lg">Loading DevSync...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="h-16 w-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-display font-bold text-red-400 mb-2">Authentication Error</h2>
          <p className="text-text-secondary">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <Router>
            <Routes>
              <Route 
                path="/" 
                element={user ? <Navigate to="/dashboard" /> : <AuthForm />} 
              />
              <Route 
                path="/dashboard" 
                element={user ? <Dashboard /> : <Navigate to="/" />} 
              />
            </Routes>
          </Router>
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
