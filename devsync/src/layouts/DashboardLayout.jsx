import React, { useState } from "react";
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
} from "lucide-react";
import { useSound } from "../components/ThemeProvider";
import { signOut } from "firebase/auth";

const DashboardLayout = ({
  children,
  activeTab = "dashboard",
  onTabChange,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { enabled: soundEnabled, playSound } = useSound();

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    { id: "jira", label: "Jira", icon: <SiJira size={20} /> },
    { id: "github", label: "GitHub", icon: <FaGithub size={20} /> },
    { id: "tasks", label: "Tasks", icon: <CheckSquare size={20} /> },
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
                  searchFocused ? "ring-2 ring-accent-blue/50 w-64" : "w-48"
                }`}
              >
                <Search size={18} className="text-text-muted mr-2" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm w-full text-text-primary placeholder:text-text-muted"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </div>
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

            {/* User Avatar */}
            <button
              className="h-8 w-8 rounded-full bg-background-lighter border border-white/10 flex items-center justify-center overflow-hidden"
              onClick={() => handleTabClick("settings")}
            >
              <User size={16} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
