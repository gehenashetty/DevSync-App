import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Toast from './Toast';
import { useSound } from '../ThemeProvider';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const { playSound, enabled: soundEnabled } = useSound();

  const showToast = useCallback((message, type = 'success', duration = 2000) => {
    const id = uuidv4();
    
    // Play sound based on toast type
    if (soundEnabled) {
      switch (type) {
        case 'success':
          playSound('success');
          break;
        case 'error':
          playSound('error');
          break;
        case 'info':
          playSound('notification');
          break;
        default:
          playSound('notification');
      }
    }
    
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, [playSound, soundEnabled]);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      
      {/* Render all active toasts */}
      <div className="fixed top-4 left-0 right-0 pointer-events-none flex justify-center z-50">
        <div className="flex flex-col items-center gap-2">
          {toasts.map((toast, index) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              isVisible={true}
              onClose={() => hideToast(toast.id)}
              duration={toast.duration}
              index={index}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider; 