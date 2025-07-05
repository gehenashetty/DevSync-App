import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FileText, Github, CheckSquare } from 'lucide-react';
import Button from './Button';
import { useSound } from '../ThemeProvider';
import './CreateActionButton.css';

const CreateActionButton = ({ onCreateTask, onCreateJiraTicket, onAddGithubRepo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { playSound, enabled: soundEnabled } = useSound();

  const handleOpen = () => {
    setIsOpen(true);
    if (soundEnabled) playSound('whoosh');
  };

  const handleClose = () => {
    setIsOpen(false);
    if (soundEnabled) playSound('whoosh');
  };

  const handleAction = (action) => {
    if (soundEnabled) playSound('click');
    setIsOpen(false);
    
    switch(action) {
      case 'task':
        onCreateTask();
        break;
      case 'jira':
        onCreateJiraTicket();
        break;
      case 'github':
        onAddGithubRepo();
        break;
      default:
        break;
    }
  };

  // Button animation variants
  const buttonVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    hover: { scale: 1.05, boxShadow: '0 0 25px rgba(96, 165, 250, 0.5)' },
    tap: { scale: 0.95 }
  };

  // Modal animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: -20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 400,
        damping: 25
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  // Action item animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: i => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        type: 'spring',
        stiffness: 300,
        damping: 24
      }
    }),
    hover: { 
      scale: 1.02,
      backgroundColor: 'rgba(255, 255, 255, 0.07)',
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  // Overlay animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const actionItems = [
    { 
      id: 'task', 
      icon: <CheckSquare size={24} className="text-accent-green" />,
      title: 'Create New Task',
      description: 'Add a new task to your personal task list',
      gradient: 'from-accent-green/10 to-accent-green-light/10'
    },
    { 
      id: 'jira', 
      icon: <FileText size={24} className="text-accent-blue" />,
      title: 'Create Jira Ticket',
      description: 'Create a new ticket in your Jira project',
      gradient: 'from-accent-blue/10 to-accent-blue-light/10'
    },
    { 
      id: 'github', 
      icon: <Github size={24} className="text-accent-purple" />,
      title: 'Add GitHub Repository',
      description: 'Connect and monitor a GitHub repository',
      gradient: 'from-accent-purple/10 to-accent-purple-light/10'
    }
  ];

  return (
    <>
      <motion.div
        className="fixed bottom-8 right-8 z-40"
        initial="initial"
        animate="animate"
        variants={buttonVariants}
      >
        <motion.button
          onClick={handleOpen}
          className="create-button w-16 h-16 rounded-full bg-gradient-to-r from-accent-blue to-accent-blue-light text-white flex items-center justify-center shadow-lg float"
          whileHover="hover"
          whileTap="tap"
          variants={buttonVariants}
        >
          <Plus size={28} />
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={overlayVariants}
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
            >
              <div className="bg-background-lighter border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                  <h3 className="text-xl font-semibold text-text-primary">Create New</h3>
                  <motion.button
                    onClick={handleClose}
                    className="p-1 rounded-full hover:bg-white/10 text-text-secondary"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={20} />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="space-y-3">
                    {actionItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        variants={itemVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => handleAction(item.id)}
                        className={`create-modal-item p-4 rounded-lg cursor-pointer border border-white/5 flex items-center space-x-4 transition-all bg-gradient-to-r ${item.gradient}`}
                      >
                        <div className="create-modal-icon p-3 rounded-lg bg-background-darker">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="text-text-primary font-medium">{item.title}</h4>
                          <p className="text-text-secondary text-sm">{item.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateActionButton; 