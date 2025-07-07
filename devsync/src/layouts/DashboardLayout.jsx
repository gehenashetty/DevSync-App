import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "../firebase";
import { FaGithub } from "react-icons/fa";
import { SiJira } from "react-icons/si";
import {
  LayoutDashboard,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  Search,
  Bell,
  User,
  Bot,
  X,
  ChevronUp,
  ChevronDown,
  FileText
} from "lucide-react";
import { useSound } from "../components/ThemeProvider";
import { signOut } from "firebase/auth";

const DashboardLayout = ({
  children,
  activeTab = "dashboard",
  onTabChange,
  user,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const { enabled: soundEnabled, playSound } = useSound();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { id: "jira", label: "Jira", icon: <SiJira size={20} /> },
    { id: "github", label: "GitHub", icon: <FaGithub size={20} /> },
    { id: "tasks", label: "Tasks", icon: <CheckSquare size={20} /> },
    {
      id: "documentation",
      label: "Documentation",
      icon: <FileText size={20} />,
    },
    {
      id: "ai",
      label: "DevCoach",
      icon: <Bot size={20}  />,
    },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  const handleLogout = async () => {
    if (soundEnabled) playSound("click");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleTabClick = (tabId) => {
    if (soundEnabled) playSound("whoosh");
    if (onTabChange) onTabChange(tabId);
  };

  // Global search functionality
  const performSearch = (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results = [];
    const searchRegex = new RegExp(term, 'gi');
    
    // Search through all text content in the main content area
    const mainContent = document.querySelector('main');
    if (mainContent) {
      const walker = document.createTreeWalker(
        mainContent,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      let nodeIndex = 0;
      while (node = walker.nextNode()) {
        const text = node.textContent;
        const matches = text.match(searchRegex);
        
        if (matches) {
          const parentElement = node.parentElement;
          if (parentElement && parentElement.offsetParent !== null) { // Check if element is visible
            results.push({
              element: parentElement,
              text: text,
              matches: matches.length,
              nodeIndex: nodeIndex
            });
          }
        }
        nodeIndex++;
      }
    }

    setSearchResults(results);
    setCurrentResultIndex(0);
    setIsSearching(false);
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    performSearch(term);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setCurrentResultIndex(0);
    setIsSearching(false);
  };

  const navigateToResult = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentResultIndex + 1) % searchResults.length;
    } else {
      newIndex = currentResultIndex === 0 ? searchResults.length - 1 : currentResultIndex - 1;
    }
    
    setCurrentResultIndex(newIndex);
    
    // Scroll to the result
    const result = searchResults[newIndex];
    if (result && result.element) {
      result.element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Highlight the element temporarily
      result.element.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
      setTimeout(() => {
        result.element.style.backgroundColor = '';
      }, 2000);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+F to focus search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      
      // Enter to navigate through results
      if (e.key === 'Enter' && searchTerm && searchResults.length > 0) {
        e.preventDefault();
        navigateToResult('next');
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && searchTerm) {
        e.preventDefault();
        clearSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, searchResults, currentResultIndex]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-background text-text-primary flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            onMouseEnter={() => setIsSidebarHovered(true)}
            onMouseLeave={() => setIsSidebarHovered(false)}
            className={`fixed h-screen z-50 transition-all duration-300 ease-in-out
            ${isSidebarHovered ? "w-64" : "w-16"}
            bg-background-lighter border-r border-white/10 flex flex-col justify-between`}
          >
            {/* Top section: Logo + Nav */}
            <div className="flex flex-col h-full overflow-hidden">
              {/* Logo */}
              <div className="flex items-center justify-center p-4 border-b border-white/10">
                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                  <span className="text-white font-bold">DS</span>
                </div>
                {isSidebarHovered && (
                  <h1 className="ml-2 text-xl font-display font-bold gradient-text-blue whitespace-nowrap">
                    DevSync
                  </h1>
                )}
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-2 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? "bg-accent-blue/20 text-accent-blue-light"
                        : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                    }`}
                    onClick={() => handleTabClick(item.id)}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {isSidebarHovered && <span>{item.label}</span>}
                  </motion.button>
                ))}
              </nav>
            </div>

            {/* Bottom: Sign Out */}
            <div className="absolute bottom-0 left-0 right-0 bg-background-lighter">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <LogOut size={20} className="mr-2" />
                {isSidebarHovered && <span>Sign Out</span>}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content - Fixed to respond to sidebar state and hover */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? (isSidebarHovered ? "ml-64" : "ml-16") : "ml-0"
        }`}
      >
        {/* Header */}
        <header className="h-16 border-b border-white/10 backdrop-blur-md bg-background/80 sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="mr-4 text-text-secondary hover:text-text-primary transition-colors"
              >
                <Menu size={20} />
              </button>
            )}

            {/* Search */}
            <div className="relative">
              <div
                className={`flex items-center bg-background-lighter rounded-lg px-3 py-1.5 transition-all ${
                  searchFocused ? "ring-2 ring-accent-blue/50 w-80" : "w-64"
                }`}
              >
                <Search size={18} className="text-text-muted mr-2" />
                <input
                  id="global-search-input"
                  type="text"
                  placeholder="Search (Ctrl+F)..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="bg-transparent border-none outline-none text-sm w-full text-text-primary placeholder:text-text-muted"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                
                {searchTerm && (
                  <div className="flex items-center space-x-1">
                    {searchResults.length > 0 && (
                      <div className="flex items-center text-xs text-text-secondary">
                        <span>{currentResultIndex + 1}</span>
                        <span>/</span>
                        <span>{searchResults.length}</span>
                      </div>
                    )}
                    
                    {searchResults.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => navigateToResult('prev')}
                          className="p-1 hover:bg-white/10 rounded text-text-secondary hover:text-text-primary"
                          title="Previous result"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => navigateToResult('next')}
                          className="p-1 hover:bg-white/10 rounded text-text-secondary hover:text-text-primary"
                          title="Next result"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    )}
                    
                    <button
                      onClick={clearSearch}
                      className="p-1 hover:bg-white/10 rounded text-text-secondary hover:text-text-primary"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Search results indicator */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-1 bg-background-lighter border border-white/10 rounded-lg px-3 py-2 text-xs text-text-secondary">
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button
              className="relative text-text-secondary hover:text-text-primary transition-colors"
              onClick={() => alert("Notifications feature coming soon!")}
            >
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent-blue flex items-center justify-center text-[10px]">
                3
              </span>
            </button>

            {/* User Avatar with Dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                className="h-8 w-8 rounded-full bg-background-lighter border border-white/10 flex items-center justify-center overflow-hidden"
                onClick={() => setProfileMenuOpen((open) => !open)}
              >
                <User size={16} />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-background-lighter border border-white/10 rounded-lg shadow-lg z-50 p-3">
                  <div className="mb-2 px-2 py-1 text-sm text-text-primary font-semibold">
                    {user?.displayName || 'User'}
                  </div>
                  <div className="mb-2 px-2 py-1 text-xs text-text-secondary truncate">
                    {user?.email || ''}
                  </div>
                  <button
                    className="w-full text-left px-2 py-2 rounded hover:bg-accent-blue/10 text-text-primary text-sm"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onTabChange && onTabChange('settings');
                    }}
                  >
                    Settings
                  </button>
                  <button
                    className="w-full text-left px-2 py-2 rounded hover:bg-red-500/10 text-red-400 text-sm"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout && onLogout();
                    }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
