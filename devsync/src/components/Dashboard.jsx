/*
DEVSYNC - Unified Developer Dashboard with GitHub Repo Summary
Now fetches: Repo Info + Issues + Pull Requests + Commits
*/

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { signOut, updateProfile } from "firebase/auth";
import { FaGithub } from "react-icons/fa";
import { FiCheckSquare } from "react-icons/fi";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import CreateJiraTicketForm from "./CreateJiraTicketForm";
import JiraTicketModal from "./jira/JiraTicketModal";
import "./Dashboard.css";
import DashboardLayout from "../layouts/DashboardLayout";
import StatCard from "./dashboard/StatCard";
import JiraTicketCard from "./jira/JiraTicketCard";
import RepoCard from "./github/RepoCard";
import TaskCard from "./tasks/TaskCard";
import Card from "./ui/Card";
import Button from "./ui/Button";
import CreateActionButton from "./ui/CreateActionButton";
import { useToast } from "./ui/ToastProvider";
import TaskForm from "./tasks/TaskForm";
import AddRepoForm from "./github/AddRepoForm";
import DevCoach from "../pages/DevCoach";
import GitHubService from "../services/GitHubService";
import JiraService from "../services/JiraService";
import CredentialService from "../services/CredentialService";
import GitHubCredentialsForm from "./settings/GitHubCredentialsForm";
import JiraCredentialsForm from "./settings/JiraCredentialsForm";
import Documentation from './knowledge/Documentation';

import {
  LayoutDashboard,
  FileCode2,
  CheckSquare,
  Activity,
  GitPullRequest,
  AlertCircle,
  Plus,
  RefreshCw,
  ChevronRight,
  Calendar,
  Clock,
  Settings,
  User,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Search,
} from "lucide-react";
import { useTheme, useSound } from "./ThemeProvider";
import { Doughnut, Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend);

// Mock data - in a real app, this would come from API calls
const mockJiraTickets = [
  {
    id: "PROJ-123",
    summary: "Implement dark mode toggle",
    description:
      "Add a comprehensive dark mode toggle feature to the application with proper theme switching and persistence.",
    status: "In Progress",
    priority: "medium",
    assignee: {
      name: "John Doe",
      email: "john.doe@company.com",
      avatar: "JD",
    },
    created: "2024-01-15T10:30:00Z",
    updated: "2024-01-20T14:45:00Z",
    dueDate: "2024-02-01T17:00:00Z",
    comments: [
      {
        id: 1,
        content:
          "Started working on the dark mode implementation. The basic structure is in place.",
        author: "John Doe",
        timestamp: "2024-01-18T09:15:00Z",
        avatar: "JD",
      },
    ],
  },
  {
    id: "PROJ-124",
    summary: "Fix navigation responsiveness on mobile",
    description:
      "The navigation menu is not properly responsive on mobile devices. Need to implement a hamburger menu and improve touch interactions.",
    status: "To Do",
    priority: "high",
    assignee: {
      name: "Sarah Wilson",
      email: "sarah.wilson@company.com",
      avatar: "SW",
    },
    created: "2024-01-16T11:20:00Z",
    updated: "2024-01-16T11:20:00Z",
    dueDate: "2024-01-25T17:00:00Z",
    comments: [],
  },
  {
    id: "PROJ-125",
    summary: "Update user profile API endpoints",
    description:
      "The current user profile API endpoints are outdated and need to be updated to support new profile fields and improved security.",
    status: "In Review",
    priority: "medium",
    assignee: {
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      avatar: "MJ",
    },
    created: "2024-01-14T08:45:00Z",
    updated: "2024-01-19T16:30:00Z",
    dueDate: "2024-01-30T17:00:00Z",
    comments: [
      {
        id: 1,
        content: "API endpoints have been updated and are ready for review.",
        author: "Mike Johnson",
        timestamp: "2024-01-19T16:30:00Z",
        avatar: "MJ",
      },
    ],
  },
];

const mockRepos = [
  {
    name: "frontend-app",
    description: "Main frontend application repository",
    stars: 24,
    forks: 8,
    watchers: 15,
    language: "TypeScript",
    lastCommit: "2023-06-15",
    openIssues: 5,
    pullRequests: 2,
  },
  {
    name: "api-service",
    description: "Backend API service with authentication",
    stars: 18,
    forks: 5,
    watchers: 10,
    language: "JavaScript",
    lastCommit: "2023-06-10",
    openIssues: 3,
    pullRequests: 1,
  },
];

const mockTasks = [
  {
    title: "Update dashboard design",
    description: "Implement new UI components and layout",
    dueDate: "2023-06-20",
    priority: "high",
    status: "in_progress",
    tags: ["UI", "Design"],
    progress: 60,
  },
  {
    title: "Fix authentication issues",
    description: "Resolve token refresh problems in the auth flow",
    dueDate: "2023-06-18",
    priority: "high",
    status: "pending",
    tags: ["Auth", "Bug"],
    progress: 20,
  },
  {
    title: "Write documentation",
    description: "Create user guide for the new features",
    dueDate: "2023-06-25",
    priority: "medium",
    status: "pending",
    tags: ["Docs"],
    progress: 0,
  },
];

const Dashboard = () => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJiraTicket, setSelectedJiraTicket] = useState(null);
  const [showJiraModal, setShowJiraModal] = useState(false);
  const [jiraSearchTerm, setJiraSearchTerm] = useState("");
  const [jiraFilter, setJiraFilter] = useState("all");
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState([]);
  const [githubRepoInfo, setGithubRepoInfo] = useState(null);
  const [githubIssues, setGithubIssues] = useState([]);
  const [githubPRs, setGithubPRs] = useState([]);
  const [githubCommits, setGithubCommits] = useState([]);
  const [jiraData, setJiraData] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(() => {
    return localStorage.getItem("selectedRepo") || "gehenashetty/DevSync-App";
  });
  const [githubError, setGithubError] = useState(null);

  // Update initial GitHub data state to have proper structure
  const [githubData, setGithubData] = useState({
    repoInfo: null,
    issues: [],
    prs: [],
    commits: [],
  });

  // Add error state for API server
  const [apiServerError, setApiServerError] = useState(null);

  // Add initial loading states
  const [initialLoad, setInitialLoad] = useState(true);
  const [jiraLoading, setJiraLoading] = useState(true);

  // Add settings state
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem("devsync_settings");
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          darkMode: true,
          notifications: true,
          soundEffects: false,
        };
  });

  // Add state for create action modals
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [showCreateJiraForm, setShowCreateJiraForm] = useState(false);
  const [showAddRepoForm, setShowAddRepoForm] = useState(false);

  // Add state for connection status
  const [githubConnected, setGithubConnected] = useState(false);
  const [jiraConnected, setJiraConnected] = useState(false);
  
  // Add state for credential forms
  const [showGitHubForm, setShowGitHubForm] = useState(false);
  const [showJiraForm, setShowJiraForm] = useState(false);

  const [displayName, setDisplayName] = useState(user?.displayName || "User");

  // Get toast notification functionality
  const { showToast } = useToast();

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("devsync_settings", JSON.stringify(settings));
  }, [settings]);

  // Handle settings toggle
  const handleSettingToggle = (setting) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [setting]: !prev[setting] };
      return newSettings;
    });
  };

  // Get theme and sound controls
  const { isDark, toggleTheme } = useTheme();
  const {
    enabled: soundEnabled,
    volume,
    toggleSound,
    updateVolume,
    playSound,
  } = useSound();

  // Add click sound to buttons
  const handleButtonClick = (callback) => {
    return (...args) => {
      if (soundEnabled) {
        playSound("click");
      }
      callback(...args);
    };
  };

  // Handle GitHub disconnection
  const handleGitHubDisconnect = () => {
    try {
      // Reset GitHub service
      GitHubService.reset();
      // Remove stored credentials
      CredentialService.removeCredentials('github');
      // Update connection status
      setGithubConnected(false);
      // Clear GitHub data
      setGithubData({
        repoInfo: null,
        issues: [],
        prs: [],
        commits: [],
      });
      // Hide create repo form if open
      setShowCreateForm(false);
      // Show success message
      showToast('GitHub disconnected successfully', 'success');
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
      showToast('Failed to disconnect GitHub', 'error');
    }
  };

  // Handle Jira disconnection
  const handleJiraDisconnect = () => {
    try {
      // Reset Jira service
      JiraService.reset();
      // Remove stored credentials
      CredentialService.removeCredentials('jira');
      // Update connection status
      setJiraConnected(false);
      // Clear Jira data
      setJiraData([]);
      // Hide create form if open
      setShowCreateForm(false);
      // Show success message
      showToast('Jira disconnected successfully', 'success');
    } catch (error) {
      console.error('Error disconnecting Jira:', error);
      showToast('Failed to disconnect Jira', 'error');
    }
  };

  // Handle successful GitHub connection
  const handleGitHubConnectSuccess = (user) => {
    setGithubConnected(true);
    setShowGitHubForm(false);
    showToast('GitHub connected successfully', 'success');
    // Refresh GitHub data
    fetchGithubData();
  };

  // Handle successful Jira connection
  const handleJiraConnectSuccess = (user) => {
    setJiraConnected(true);
    setShowJiraForm(false);
    showToast('Jira connected successfully', 'success');
    // Refresh Jira data
    fetchJira();
  };

  useEffect(() => {
    console.log("Setting up tasks listener");
    const unsubscribe = onSnapshot(
      collection(db, "tasks"),
      (snapshot) => {
        console.log("Tasks snapshot received:", snapshot.size, "documents");
        const taskList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Ensure all required fields exist
          title: doc.data().title || doc.data().content || "Untitled Task",
          description: doc.data().description || "",
          status: doc.data().status || "pending",
          priority: doc.data().priority || "medium",
          tags: doc.data().tags || [],
          progress: doc.data().progress || 0,
        }));
        console.log("Processed tasks:", taskList);
        setTasks(taskList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Check connection status on component mount
  useEffect(() => {
    // Check if credentials exist and initialize services
    const githubCredentials = CredentialService.getCredentials('github');
    const jiraCredentials = CredentialService.getCredentials('jira');
    
    if (githubCredentials) {
      try {
        GitHubService.initialize(githubCredentials);
        setGithubConnected(true);
      } catch (error) {
        console.error('Failed to initialize GitHub service:', error);
        setGithubConnected(false);
      }
    } else {
      setGithubConnected(false);
    }
    
    if (jiraCredentials) {
      try {
        JiraService.initialize(jiraCredentials);
        setJiraConnected(true);
      } catch (error) {
        console.error('Failed to initialize Jira service:', error);
        setJiraConnected(false);
      }
    } else {
      setJiraConnected(false);
    }
  }, []);

  // Load initial data when component mounts
  useEffect(() => {
    console.log("Initial data load");
    const loadInitialData = async () => {
      try {
        setInitialLoad(true);
        await Promise.all([fetchGithubData(), fetchJira()]);
      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        setInitialLoad(false);
      }
    };

    loadInitialData();
  }, []);

  // Update GitHub data fetching function
  const fetchGithubData = async () => {
    if (!selectedRepo) {
      console.log("No repository selected");
      return;
    }

    console.log("Fetching GitHub data for repo:", selectedRepo);
    setLoading(true);
    setGithubError(null);
    setApiServerError(null);

    try {
      // Try to fetch from the backend server first
      const response = await fetch(
        `http://localhost:3001/api/github/summary?repo=${selectedRepo}`
      );
      console.log("GitHub API response:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("GitHub data received:", data);

        if (data.error) {
          throw new Error(data.error);
        }

        // Update all GitHub data at once with proper null checks
        setGithubData({
          repoInfo: data.repo
            ? {
                name: data.repo.name,
                description: data.repo.description,
                stars: data.repo.stargazers_count,
                forks: data.repo.forks_count,
                watchers: data.repo.watchers_count,
                language: data.repo.language,
                lastCommit: data.repo.updated_at,
                openIssues: data.repo.open_issues_count,
                pullRequests: data.repo.open_issues_count, // This will be updated separately
                html_url: data.repo.html_url,
              }
            : null,
          issues: Array.isArray(data.issues) ? data.issues : [],
          prs: Array.isArray(data.pulls) ? data.pulls : [],
          commits: Array.isArray(data.commits) ? data.commits : [],
        });
      } else {
        // If backend server is not available, use mock data
        console.log("Backend server not available, using mock data");
        setGithubData({
          repoInfo: {
            name: selectedRepo.split("/")[1] || "repository",
            description: "Mock repository data - backend server not running",
            stars: 0,
            forks: 0,
            watchers: 0,
            language: "JavaScript",
            lastCommit: new Date().toISOString(),
            openIssues: 0,
            pullRequests: 0,
            html_url: `https://github.com/${selectedRepo}`,
          },
          issues: [],
          prs: [],
          commits: [],
        });
      }
    } catch (error) {
      console.error("Error fetching GitHub data:", error);
      // Use mock data as fallback
      setGithubData({
        repoInfo: {
          name: selectedRepo.split("/")[1] || "repository",
          description: "Mock repository data - unable to fetch from server",
          stars: 0,
          forks: 0,
          watchers: 0,
          language: "JavaScript",
          lastCommit: new Date().toISOString(),
          openIssues: 0,
          pullRequests: 0,
          html_url: `https://github.com/${selectedRepo}`,
        },
        issues: [],
        prs: [],
        commits: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Update Jira fetch function
  const fetchJira = async () => {
    try {
      console.log("Fetching Jira data");
      setJiraLoading(true);
      const res = await fetch("http://localhost:3001/api/jira");
      if (res.ok) {
        const data = await res.json();
        console.log("Jira data received:", data);
        setJiraData(Array.isArray(data) ? data : []);
      } else {
        // If backend server is not available, use mock data
        console.log("Backend server not available, using mock Jira data");
        setJiraData(mockJiraTickets);
      }
    } catch (error) {
      console.error("Error fetching Jira data:", error);
      // Use mock data as fallback
      setJiraData(mockJiraTickets);
    } finally {
      setJiraLoading(false);
    }
  };

  // Update refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchGithubData(), fetchJira()]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Update GitHub useEffect to use fetchGithubData
  useEffect(() => {
    if (selectedRepo) {
      fetchGithubData();
    }
  }, [selectedRepo]);

  // Add error boundary for GitHub data
  useEffect(() => {
    if (!githubData || typeof githubData !== "object") {
      console.log("Resetting invalid GitHub data");
      setGithubData({
        repoInfo: null,
        issues: [],
        prs: [],
        commits: [],
      });
    }
  }, [githubData]);

  const handleAddTask = async (taskData) => {
    try {
      console.log("Adding new task:", taskData);
      await addDoc(collection(db, "tasks"), {
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        status: "pending",
        tags: taskData.tags,
        progress: 0,
        user: auth.currentUser.email,
        createdAt: new Date().toISOString(),
      });
      console.log("Task added successfully");
      setShowCreateTaskForm(false);
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task: " + error.message);
    }
  };

  const handleAddRepo = async (repoUrl) => {
    try {
      console.log("Adding new repo:", repoUrl);

      // Validate repo URL format
      if (!repoUrl.includes("/") || repoUrl.split("/").length !== 2) {
        throw new Error("Please enter repository in format: owner/repository");
      }

      // Try to add via backend if available
      try {
        const response = await fetch(
          "http://localhost:3001/api/github/add-repo",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ repoUrl }),
          }
        );

        if (response.ok) {
          console.log("Repository added via backend");
        }
      } catch (backendError) {
        console.log("Backend not available, using local storage only");
      }

      setSelectedRepo(repoUrl);
      localStorage.setItem("selectedRepo", repoUrl);
      handleRefresh();
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error adding repository:", error);
      alert("Failed to add repository: " + error.message);
    }
  };

  const handleTabChange = (tabId) => {
    console.log("Changing tab to:", tabId);
    console.log("Current githubData:", githubData);
    console.log("Current loading state:", loading);
    console.log("Current initialLoad state:", initialLoad);
    setActiveTab(tabId);
  };

  const handleJiraTicketClick = (ticket) => {
    setSelectedJiraTicket(ticket);
    setShowJiraModal(true);
  };

  const handleCloseJiraModal = () => {
    setShowJiraModal(false);
    setSelectedJiraTicket(null);
  };

  const handleJiraStatusChange = (ticketId, newStatus) => {
    setJiraData((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      )
    );
  };

  const handleJiraPriorityChange = (ticketId, newPriority) => {
    setJiraData((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, priority: newPriority } : ticket
      )
    );
  };

  const handleJiraTicketUpdate = async (ticketId, updateData) => {
    try {
      // In a real app, this would make an API call to update the ticket
      console.log("Updating ticket:", ticketId, updateData);

      setJiraData((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                ...updateData,
                updated: new Date().toISOString(), // Update the timestamp
              }
            : ticket
        )
      );

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("Ticket updated successfully");
    } catch (error) {
      console.error("Error updating ticket:", error);
      throw error;
    }
  };

  // Filter and search Jira tickets
  const getFilteredJiraTickets = () => {
    let filtered = jiraData;

    // Apply search filter
    if (jiraSearchTerm) {
      const searchLower = jiraSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.summary?.toLowerCase().includes(searchLower) ||
          ticket.description?.toLowerCase().includes(searchLower) ||
          ticket.id?.toLowerCase().includes(searchLower) ||
          ticket.assignee?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    switch (jiraFilter) {
      case "assigned":
        filtered = filtered.filter((ticket) => ticket.assignee?.name);
        break;
      case "recent":
        // Show tickets updated in the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(
          (ticket) => ticket.updated && new Date(ticket.updated) > weekAgo
        );
        break;
      case "high-priority":
        filtered = filtered.filter(
          (ticket) => ticket.priority?.toLowerCase() === "high"
        );
        break;
      case "in-progress":
        filtered = filtered.filter(
          (ticket) => ticket.status?.toLowerCase() === "in progress"
        );
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered;
  };

  // Filter and search tasks
  const getFilteredTasks = () => {
    let filtered = tasks;

    // Apply search filter
    if (taskSearchTerm) {
      const searchLower = taskSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title?.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    switch (taskFilter) {
      case "in-progress":
        filtered = filtered.filter((task) => task.status === "in-progress");
        break;
      case "completed":
        filtered = filtered.filter((task) => task.status === "completed");
        break;
      case "pending":
        filtered = filtered.filter((task) => task.status === "pending");
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered;
  };

  const renderDashboardContent = () => (
    <>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            boxShadow:
              "0 0 16px rgba(59, 130, 246, 0.5), 0 0 32px rgba(59, 130, 246, 0.3)", // Always active
          }}
          whileHover={{
            scale: 1.03,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="shine-effect pulse-blue rounded-xl"
        >
          <StatCard
            title="Open Tickets"
            value={jiraData.length || "0"}
            icon={<FileCode2 size={18} className="text-accent-blue" />}
            trend={{ value: 8, positive: false }}
            variant="blue"
            delay={0.1}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            boxShadow:
              "0 0 16px rgba(59, 130, 246, 0.5), 0 0 32px rgba(59, 130, 246, 0.3)", // Always active
          }}
          whileHover={{
            scale: 1.03,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="shine-effect pulse-blue rounded-xl"
        >
          <StatCard
            title="Completed Tasks"
            value={tasks.filter((t) => t.status === "completed").length || "0"}
            icon={<CheckSquare size={18} className="text-accent-green" />}
            trend={{ value: 20, positive: true }}
            variant="green"
            delay={0.2}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            boxShadow:
              "0 0 16px rgba(59, 130, 246, 0.5), 0 0 32px rgba(59, 130, 246, 0.3)", // Always active
          }}
          whileHover={{
            scale: 1.03,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="shine-effect pulse-blue rounded-xl"
        >
          <StatCard
            title="Pull Requests"
            value={githubData.prs?.length || "0"}
            icon={<GitPullRequest size={18} className="text-accent-purple" />}
            trend={{ value: 12, positive: true }}
            variant="purple"
            delay={0.3}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            boxShadow:
              "0 0 16px rgba(59, 130, 246, 0.5), 0 0 32px rgba(59, 130, 246, 0.3)", // Always active
          }}
          whileHover={{
            scale: 1.03,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="shine-effect pulse-blue rounded-xl"
        >
          <StatCard
            title="Open Issues"
            value={githubData.issues?.length || "0"}
            icon={<Activity size={18} className="text-accent-blue" />}
            trend={{ value: 3, positive: true }}
            variant="blue"
            delay={0.4}
          />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Jira Card */}
        <motion.div
          whileHover={{
            scale: 1.06,
            rotate: 0.5,
          }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            boxShadow:
              "0 0 16px rgba(59, 130, 246, 0.5), 0 0 32px rgba(59, 130, 246, 0.3)",
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 25,
          }}
          className="bg-background-lighter border border-white/10 rounded-xl p-6 shadow-xl shine-blue pulse-blue"
        >
          <h3 className="text-lg font-semibold mb-2 text-accent-blue flex items-center gap-2">
            <img
              src="https://cdn.worldvectorlogo.com/logos/jira-1.svg"
              alt="Jira Logo"
              className="w-5 h-5"
            />
            Jira Tickets
          </h3>

          <p className="text-sm text-text-secondary mb-4">
            {jiraData.length} tickets available
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab("jira")}
            className="border border-accent-blue text-accent-blue border-accent-blue-light hover:text-accent-blue-light"
          >
            View Jira
          </Button>
        </motion.div>

        {/* GitHub Card */}
        <motion.div
          whileHover={{
            scale: 1.06,
            rotate: 0.5,
          }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            boxShadow:
              "0 0 16px rgba(59, 130, 246, 0.5), 0 0 32px rgba(59, 130, 246, 0.3)",
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 25,
          }}
          className="bg-background-lighter border border-white/10 rounded-xl p-6 shadow-xl shine-blue pulse-blue"
        >
          <h3 className="text-lg font-semibold mb-2 text-accent-purple flex items-center gap-2">
            <FaGithub size={20} />
            GitHub Repo
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            {selectedRepo} — {githubData.commits?.length || 0} recent commits
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab("github")}
            className="border border-accent-blue text-accent-blue border-accent-blue-light hover:text-accent-blue-light"
          >
            View GitHub
          </Button>
        </motion.div>

        {/* Tasks Card */}
        <motion.div
          whileHover={{
            scale: 1.06,
            rotate: 0.5,
          }}
          whileTap={{ scale: 0.96 }}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            boxShadow:
              "0 0 16px rgba(59, 130, 246, 0.5), 0 0 32px rgba(59, 130, 246, 0.3)",
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 25,
          }}
          className="bg-background-lighter border border-white/10 rounded-xl p-6 shadow-xl shine-blue pulse-blue"
        >
          <h3 className="text-lg font-semibold mb-2 text-accent-green flex items-center gap-2">
            <FiCheckSquare size={20} />
            Tasks
          </h3>

          <p className="text-sm text-text-secondary mb-4">
            <ul className="text-sm text-text-secondary mb-4">
              {tasks.slice(0, 1).map((t) => (
                <li key={t.id}>• {t.title}</li>
              ))}
            </ul>
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab("tasks")}
            className="border border-accent-blue text-accent-blue border-accent-blue-light hover:text-accent-blue-light"
          >
            View All Tasks
          </Button>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold flex items-center text-text-primary">
            <Activity size={18} className="mr-2 text-accent-blue" />
            Recent Activity
          </h2>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="dashboard-table w-full">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {githubData.commits?.length > 0 ? (
                  githubData.commits.slice(0, 4).map((commit) => (
                    <tr key={commit.sha}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="status-badge status-badge-info">
                          Commit
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{commit.message}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center text-accent-green text-sm">
                          <CheckSquare size={14} className="mr-1" /> Committed
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">
                        {new Date(commit.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center py-4 text-text-secondary"
                    >
                      No recent activity found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );

  const renderJiraContent = () => (
    <>
      <div className="mb-6">
        <motion.h1
          className="text-2xl font-display font-bold gradient-text-blue mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Jira Tickets
        </motion.h1>
        <motion.p
          className="text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Manage and track your Jira tickets
        </motion.p>
      </div>
      {jiraConnected && (
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-background-lighter via-background to-background-darker border border-white/10 rounded-2xl shadow-2xl p-8 flex flex-col md:flex-row gap-10 items-center hover:shadow-accent-blue/30 transition-all duration-300"
          >
            {/* Status Donut Chart */}
            <div className="flex-1 min-w-[220px] flex flex-col items-center justify-center max-w-[180px] mx-auto">
              <h3 className="font-semibold mb-2 text-text-primary">Status Breakdown</h3>
              <Doughnut
                data={{
                  labels: ['To Do', 'In Progress', 'In Review', 'Done'],
                  datasets: [{
                    data: [
                      jiraData.filter(t => t.status === 'To Do').length,
                      jiraData.filter(t => t.status === 'In Progress').length,
                      jiraData.filter(t => t.status === 'In Review').length,
                      jiraData.filter(t => t.status === 'Done').length,
                    ],
                    backgroundColor: [
                      '#7dd3fc', // To Do
                      '#fbbf24', // In Progress
                      '#a78bfa', // In Review
                      '#4ade80', // Done
                    ],
                    borderWidth: 2,
                  }],
                }}
                options={{
                  cutout: '75%',
                  plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                  },
                  maintainAspectRatio: false,
                }}
                className="w-32 h-32 max-w-[140px] max-h-[140px] transition-all duration-300 hover:scale-105"
                style={{ maxWidth: '140px', maxHeight: '140px' }}
              />
              <div className="flex flex-wrap justify-center gap-2 mt-2 text-xs text-text-secondary">
                <span>To Do: {jiraData.filter(t => t.status === 'To Do').length}</span>
                <span>In Progress: {jiraData.filter(t => t.status === 'In Progress').length}</span>
                <span>In Review: {jiraData.filter(t => t.status === 'In Review').length}</span>
                <span>Done: {jiraData.filter(t => t.status === 'Done').length}</span>
              </div>
            </div>
            {/* Priority Pie Chart */}
            <div className="flex-1 min-w-[220px] flex flex-col items-center justify-center max-w-[180px] mx-auto">
              <h3 className="font-semibold mb-2 text-text-primary">Priority Breakdown</h3>
              <Pie
                data={{
                  labels: ['High', 'Medium', 'Low'],
                  datasets: [{
                    data: [
                      jiraData.filter(t => t.priority?.toLowerCase() === 'high').length,
                      jiraData.filter(t => t.priority?.toLowerCase() === 'medium').length,
                      jiraData.filter(t => t.priority?.toLowerCase() === 'low').length,
                    ],
                    backgroundColor: [
                      '#f87171', // High
                      '#fbbf24', // Medium
                      '#60a5fa', // Low
                    ],
                    borderWidth: 2,
                  }],
                }}
                options={{
                  plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                  },
                  maintainAspectRatio: false,
                }}
                className="w-32 h-32 max-w-[140px] max-h-[140px] transition-all duration-300 hover:scale-105"
                style={{ maxWidth: '140px', maxHeight: '140px' }}
              />
              <div className="flex flex-wrap justify-center gap-2 mt-2 text-xs text-text-secondary">
                <span>High: {jiraData.filter(t => t.priority?.toLowerCase() === 'high').length}</span>
                <span>Medium: {jiraData.filter(t => t.priority?.toLowerCase() === 'medium').length}</span>
                <span>Low: {jiraData.filter(t => t.priority?.toLowerCase() === 'low').length}</span>
              </div>
            </div>
            {/* Recent Activity */}
            <div className="flex-1 min-w-[220px]">
              <h3 className="font-semibold mb-2 text-text-primary">Recent Activity</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {jiraData
                  .slice()
                  .sort((a, b) => new Date(b.updated) - new Date(a.updated))
                  .slice(0, 5)
                  .map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i, duration: 0.4 }}
                      className="bg-background p-4 rounded-xl border border-white/10 shadow-md flex flex-col gap-1 hover:bg-background-lighter transition-all duration-200"
                    >
                      <span className="font-medium text-accent-blue">{t.summary}</span>
                      <span className="text-xs text-text-secondary">{t.status} • {t.priority} • Updated {new Date(t.updated).toLocaleString()}</span>
                    </motion.div>
                  ))}
                {jiraData.length === 0 && <div className="text-text-secondary text-sm">No recent activity</div>}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {!jiraConnected ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-sm">
            <strong>Not connected to Jira.</strong> Please connect your Jira account in Settings to view and manage tickets.
          </div>
        </div>
      ) : (
        <>
          {/* Search and Filter Section */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search tickets by title, description, ID, or assignee..."
                  value={jiraSearchTerm}
                  onChange={(e) => setJiraSearchTerm(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-lg py-2 px-4 pl-10 text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-blue"
                />
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
                />
              </div>
              {jiraSearchTerm && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setJiraSearchTerm("")}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button
                  variant={jiraFilter === "all" ? "primary" : "secondary"}
                  onClick={() => setJiraFilter("all")}
                >
                  All Tickets
                </Button>
                <Button
                  variant={jiraFilter === "assigned" ? "primary" : "secondary"}
                  onClick={() => setJiraFilter("assigned")}
                >
                  Assigned to Me
                </Button>
                <Button
                  variant={jiraFilter === "recent" ? "primary" : "secondary"}
                  onClick={() => setJiraFilter("recent")}
                >
                  Recent
                </Button>
                <Button
                  variant={jiraFilter === "high-priority" ? "primary" : "secondary"}
                  onClick={() => setJiraFilter("high-priority")}
                >
                  High Priority
                </Button>
                <Button
                  variant={jiraFilter === "in-progress" ? "primary" : "secondary"}
                  onClick={() => setJiraFilter("in-progress")}
                >
                  In Progress
                </Button>
              </div>
              <Button 
                variant="primary" 
                icon={<Plus size={16} />}
                onClick={() => setShowCreateJiraForm(true)}
              >
                Create Ticket
              </Button>
            </div>

            {/* Results Summary */}
            {jiraSearchTerm || jiraFilter !== "all" ? (
              <div className="text-sm text-text-secondary">
                Showing {getFilteredJiraTickets().length} of {jiraData.length}{" "}
                tickets
                {jiraSearchTerm && ` matching "${jiraSearchTerm}"`}
                {jiraFilter !== "all" && ` (${jiraFilter.replace("-", " ")})`}
              </div>
            ) : null}
          </div>

          {jiraLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
            </div>
          ) : (
            <>
              {jiraData === mockJiraTickets && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg text-sm">
                  <strong>Note:</strong> Using mock Jira data. To connect to real
                  Jira, start the backend server.
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredJiraTickets().map((ticket, index) => (
                  <JiraTicketCard
                    key={`${ticket.id}-${index}`}
                    {...ticket}
                    delay={0.1 + index * 0.05}
                    onClick={() => handleJiraTicketClick(ticket)}
                  />
                ))}

                {getFilteredJiraTickets().length === 0 && (
                  <div className="col-span-3 text-center py-8 text-text-secondary">
                    No Jira tickets found. Create one to get started!
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  );

  const renderGithubContent = () => {
    if (!githubConnected) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-sm">
            <strong>Not connected to GitHub.</strong> Please connect your GitHub account in Settings to view and manage repositories.
          </div>
        </div>
      );
    }
    try {
      console.log("Rendering GitHub content", {
        loading,
        error: githubError,
        apiError: apiServerError,
        githubData,
        initialLoad,
      });

      // Safely destructure githubData with fallbacks
      const repoInfo = githubData?.repoInfo || null;
      const issues = githubData?.issues || [];
      const prs = githubData?.prs || [];
      const commits = githubData?.commits || [];

      // If no data at all, show a message
      if (
        !repoInfo &&
        issues.length === 0 &&
        prs.length === 0 &&
        commits.length === 0
      ) {
        return (
          <div className="min-h-screen p-6">
            <div className="mb-6">
              <motion.h1
                className="text-2xl font-display font-bold gradient-text-purple mb-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                GitHub Repositories
              </motion.h1>
              <motion.p
                className="text-text-secondary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Monitor and manage your GitHub repositories
              </motion.p>
            </div>

            <div className="text-center py-12">
              <div className="bg-background-lighter p-8 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">
                  No Repository Selected
                </h3>
                <p className="text-text-secondary mb-4">
                  Add a GitHub repository to get started with monitoring and
                  management.
                </p>
                <Button
                  variant="primary"
                  onClick={() => setShowAddRepoForm(true)}
                >
                  Add Your First Repository
                </Button>
              </div>
            </div>
          </div>
        );
      }

      if (initialLoad || loading) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-purple"></div>
          </div>
        );
      }

      if (apiServerError) {
        return (
          <div className="min-h-screen p-6">
            <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">
                Backend Server Not Available
              </h3>
              <p>Using mock data. To get real GitHub data:</p>
              <div className="mt-4 p-4 bg-background-lighter rounded-lg">
                <p className="text-sm mb-2">
                  To enable real GitHub integration:
                </p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Open a new terminal</li>
                  <li>Navigate to the jiraproxy directory</li>
                  <li>Run `npm install` if you haven't already</li>
                  <li>Create a .env file with your GitHub token</li>
                  <li>Run `npm start` to start the API server</li>
                  <li>Click the refresh button above</li>
                </ol>
              </div>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={handleRefresh}
              >
                Try Again
              </Button>
            </div>
          </div>
        );
      }

      if (githubError) {
        return (
          <div className="min-h-screen p-6">
            <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Using Mock Data</h3>
              <p>
                Unable to fetch real GitHub data. Displaying mock repository
                information.
              </p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={handleRefresh}
              >
                Try Again
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen pb-8">
          <div className="mb-6">
            <motion.h1
              className="text-2xl font-display font-bold gradient-text-purple mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              GitHub Repositories
            </motion.h1>
            <motion.p
              className="text-text-secondary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Monitor and manage your GitHub repositories
            </motion.p>
          </div>

          {githubConnected && (
            <div className="mb-6 flex flex-col gap-2">
              <input
                type="text"
                className="p-2 rounded border border-white/10 bg-background w-full max-w-md"
                placeholder="Search repositories by name..."
                value={repoSearch}
                onChange={e => setRepoSearch(e.target.value)}
              />
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full items-stretch">
              {githubRepos
                .filter(repo =>
                  repo.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
                  repo.full_name.toLowerCase().includes(repoSearch.toLowerCase())
                )
                .map(repo => (
                  <Card key={repo.id} className="p-5 flex flex-col gap-2 hover:bg-background-lighter transition-all duration-200 cursor-pointer group" onClick={() => handleRepoTileClick(repo)}>
                    <div className="flex items-center gap-2 mb-2">
                      <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-7 h-7 rounded-full" />
                      <span className="font-semibold text-accent-blue truncate max-w-[140px] group-hover:underline" title={repo.full_name}>{repo.full_name}</span>
                    </div>
                    <div className="text-sm text-text-secondary mb-1 truncate max-w-full" title={repo.description}>{repo.description || 'No description'}</div>
                    <div className="flex gap-4 text-xs text-text-secondary mt-auto">
                      <span>⭐ {repo.stargazers_count}</span>
                      <span>🍴 {repo.forks_count}</span>
                      <span>🛠 {repo.language || 'N/A'}</span>
                    </div>
                    <div className="text-xs text-text-secondary mt-1 truncate">Updated {new Date(repo.updated_at).toLocaleDateString()}</div>
                  </Card>
                ))}
              {githubRepos.length === 0 && (
                <div className="col-span-full text-center py-8 text-text-secondary">
                  No repositories found. Add one to get started!
                </div>
              )}
            </div>
          </motion.div>
        </div>
      );
    } catch (error) {
      console.error("Error rendering GitHub content:", error);
      return (
        <div className="min-h-screen p-6">
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Error Loading GitHub Content</h3>
            <p>
              Something went wrong while loading the GitHub tab. Please try
              refreshing the page.
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={handleRefresh}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }
  };

  // Add this state at the top of your component
  const [activeFilter, setActiveFilter] = useState("all");

  const renderTasksContent = () => {
    const filteredTasks = getFilteredTasks();

    return (
      <>
        <div className="mb-6">
          <motion.h1
            className="text-2xl font-display font-bold gradient-text-green mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Task Management
          </motion.h1>
          <motion.p
            className="text-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Organize and track your development tasks
          </motion.p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search tasks by title, description, or tags..."
                value={taskSearchTerm}
                onChange={(e) => setTaskSearchTerm(e.target.value)}
                className="w-full bg-background border border-white/10 rounded-lg py-2 px-4 pl-10 text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent-green"
              />
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
              />
            </div>
            {taskSearchTerm && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTaskSearchTerm("")}
              >
                Clear
              </Button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                variant={taskFilter === "all" ? "primary" : "secondary"}
                onClick={() => setTaskFilter("all")}
              >
                All Tasks
              </Button>
              <Button
                variant={taskFilter === "pending" ? "primary" : "secondary"}
                onClick={() => setTaskFilter("pending")}
              >
                Pending
              </Button>
              <Button
                variant={taskFilter === "in-progress" ? "primary" : "secondary"}
                onClick={() => setTaskFilter("in-progress")}
              >
                In Progress
              </Button>
              <Button
                variant={taskFilter === "completed" ? "primary" : "secondary"}
                onClick={() => setTaskFilter("completed")}
              >
                Completed
              </Button>
            </div>
          </div>

          {/* Results Summary */}
          {taskSearchTerm || taskFilter !== "all" ? (
            <div className="text-sm text-text-secondary">
              Showing {filteredTasks.length} of {tasks.length}{" "}
              tasks
              {taskSearchTerm && ` matching "${taskSearchTerm}"`}
              {taskFilter !== "all" && ` (${taskFilter.replace("-", " ")})`}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task, index) => (
            <TaskCard
              key={task.id}
              {...task}
              delay={0.1 + index * 0.05}
              onClick={() => alert(`Viewing details for task: ${task.title}`)}
              onStatusChange={(newStatus) => {
                // Update task status in Firebase
                const taskRef = doc(db, "tasks", task.id);
                updateDoc(taskRef, { status: newStatus });
              }}
            />
          ))}
          {filteredTasks.length === 0 && (
            <div className="col-span-3 text-center py-8 text-text-secondary">
              {taskFilter === "all" && !taskSearchTerm
                ? "No tasks found. Create one to get started!"
                : `No tasks found matching your criteria.`}
            </div>
          )}
        </div>
      </>
    );
  };

  const renderSettingsContent = () => (
    <>
      <div className="mb-6">
        <motion.h1
          className="text-2xl font-display font-bold gradient-text-blue mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Settings
        </motion.h1>
        <motion.p
          className="text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Customize your DevSync experience
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User size={20} className="mr-2 text-accent-blue" />
            Profile Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Display Name
              </label>
              <input
                type="text"
                className="w-full bg-background-lighter border border-white/10 rounded-lg py-2 px-3"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full bg-background-lighter border border-white/10 rounded-lg py-2 px-3"
                defaultValue={user?.email || "user@example.com"}
                disabled
              />
            </div>
            <Button
              variant="primary"
              onClick={handleButtonClick(handleDisplayNameUpdate)}
            >
              Update Profile
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Settings size={20} className="mr-2 text-accent-purple" />
            App Settings
          </h2>
          <div className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Theme</span>
                <p className="text-sm text-text-secondary">
                  Switch between dark and light mode
                </p>
              </div>
              <button
                onClick={handleButtonClick(toggleTheme)}
                className="theme-toggle-btn"
                aria-label={
                  isDark ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {isDark ? (
                  <Sun size={20} className="text-yellow-400" />
                ) : (
                  <Moon size={20} className="text-purple-400" />
                )}
              </button>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Sound Effects</span>
                <p className="text-sm text-text-secondary">
                  Enable interface sounds
                </p>
              </div>
              <button
                onClick={handleButtonClick(toggleSound)}
                className="theme-toggle-btn"
                aria-label={soundEnabled ? "Disable sounds" : "Enable sounds"}
              >
                {soundEnabled ? (
                  <Volume2 size={20} className="text-accent-blue" />
                ) : (
                  <VolumeX size={20} className="text-text-secondary" />
                )}
              </button>
            </div>

            {/* Volume Slider */}
            {soundEnabled && (
              <div className="space-y-2">
                <label className="block text-sm text-text-secondary">
                  Sound Volume
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => updateVolume(parseFloat(e.target.value))}
                  className="w-full accent-accent-blue"
                />
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>0%</span>
                  <span>{Math.round(volume * 100)}%</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                variant="primary"
                onClick={handleButtonClick(() => {
                  playSound("success");
                  alert("Settings saved successfully!");
                })}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-text-primary">
            <FileCode2 size={20} className="mr-2 text-accent-green" />
            Integration Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-white/10 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Jira Integration</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  jiraConnected 
                    ? 'bg-accent-green/20 text-accent-green-light' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {jiraConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-3">
                {jiraConnected ? 'Connected to Jira Cloud' : 'Not connected to Jira'}
              </p>
              {jiraConnected ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleButtonClick(handleJiraDisconnect)}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleButtonClick(() => setShowJiraForm(true))}
                >
                  Connect
                </Button>
              )}
            </div>
            <div className="p-4 border border-white/10 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">GitHub Integration</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  githubConnected 
                    ? 'bg-accent-green/20 text-accent-green-light' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {githubConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-3">
                {githubConnected ? 'Connected to GitHub' : 'Not connected to GitHub'}
              </p>
              {githubConnected ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleButtonClick(handleGitHubDisconnect)}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleButtonClick(() => setShowGitHubForm(true))}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );

  const renderDocumentationContent = () => (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Documentation</h1>
      <p className="text-text-secondary mb-4">Store and refer to your project documentation here.</p>
      <Documentation />
    </div>
  );

  const renderContent = () => {
    console.log("Rendering content for tab:", activeTab);
    console.log("Current state:", {
      loading,
      initialLoad,
      githubData,
      githubError,
      apiServerError,
    });
    try {
      switch (activeTab) {
        case "jira":
          console.log("Rendering Jira content");
          return renderJiraContent();
        case "github":
          console.log("Rendering GitHub content");
          return renderGithubContent();
        case "tasks":
          console.log("Rendering Tasks content");
          return renderTasksContent();
        case "documentation":
          console.log("Rendering Documentation content");
          return renderDocumentationContent();
        case "settings":
          console.log("Rendering Settings content");
          return renderSettingsContent();
        case "ai":
          console.log("Rendering DevCoach (AI Assistant)");
          return <DevCoach />; // ✅ Add this line
        default:
          console.log("Rendering Dashboard content");
          return renderDashboardContent();
      }    
    } catch (error) {
      console.error("Error rendering content:", error);
      return (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Error displaying content</h3>
          <p>{error.message}</p>
          <Button variant="secondary" className="mt-4" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      );
    }
  };

  const renderModals = () => (
    <>
      {/* Jira Ticket Modal */}
      <JiraTicketModal
        ticket={selectedJiraTicket}
        isOpen={showJiraModal}
        onClose={handleCloseJiraModal}
        onStatusChange={handleJiraStatusChange}
        onPriorityChange={handleJiraPriorityChange}
        onTicketUpdate={handleJiraTicketUpdate}
      />

      {showCreateTaskForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-lighter p-6 rounded-lg w-full max-w-lg">
            <TaskForm
              onSubmit={handleAddTask}
              onCancel={() => setShowCreateTaskForm(false)}
            />
          </div>
        </div>
      )}

      {showCreateJiraForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-lighter p-6 rounded-lg w-full max-w-lg">
            <CreateJiraTicketForm 
              onTicketCreated={() => {
                setShowCreateJiraForm(false);
                handleRefresh();
              }}
              onCancel={() => setShowCreateJiraForm(false)}
              jiraConnected={jiraConnected}
            />
          </div>
        </div>
      )}

      {showAddRepoForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-lighter p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">
              Add GitHub Repository
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const repoUrl = e.target.repoUrl.value;
                handleAddRepo(repoUrl);
              }}
            >
              <input
                type="text"
                name="repoUrl"
                placeholder="owner/repository"
                className="w-full bg-background border border-white/10 rounded-lg py-2 px-3 mb-4"
                required
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Add Repository
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GitHub Credentials Form Modal */}
      {showGitHubForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-lighter rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <GitHubCredentialsForm
              onSuccess={handleGitHubConnectSuccess}
              onCancel={() => setShowGitHubForm(false)}
            />
          </div>
        </div>
      )}

      {/* Jira Credentials Form Modal */}
      {showJiraForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-lighter rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <JiraCredentialsForm
              onSuccess={handleJiraConnectSuccess}
              onCancel={() => setShowJiraForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );

  // Handle create task action
  const handleCreateTask = () => {
    setShowCreateTaskForm(true);
  };

  // Handle create Jira ticket action
  const handleCreateJiraTicket = () => {
    setShowCreateJiraForm(true);
  };

  // Handle add GitHub repo action
  const handleAddGithubRepo = () => {
    setShowAddRepoForm(true);
  };

  // Handle task submission
  const handleTaskSubmit = async (taskData) => {
    try {
      await addDoc(collection(db, "tasks"), taskData);
      setShowCreateTaskForm(false);
      showToast("Task created successfully!", "success");
    } catch (error) {
      console.error("Error adding task:", error);
      showToast("Failed to create task", "error");
    }
  };

  // Handle Jira ticket submission
  const handleJiraTicketSubmit = () => {
    setShowCreateJiraForm(false);
    showToast("Jira ticket created successfully!", "success");
  };

  // Handle GitHub repo submission
  const handleRepoSubmit = async (repoPath) => {
    try {
      localStorage.setItem("selectedRepo", repoPath);
      setSelectedRepo(repoPath);
      setShowAddRepoForm(false);
      // Fetch details for the manually added repo and add to githubRepos
      const res = await fetch(`/api/github/summary?repo=${repoPath}`);
      const data = await res.json();
      if (data && data.repo) {
        setGithubRepos(prev => {
          // Avoid duplicates
          if (prev.some(r => r.full_name === data.repo.full_name)) return prev;
          return [data.repo, ...prev];
        });
      }
      await fetchGithubData();
      showToast(
        `GitHub repository "${repoPath}" connected successfully!`,
        "success"
      );
    } catch (error) {
      console.error("Error adding repo:", error);
      showToast("Failed to connect GitHub repository", "error");
    }
  };

  // Handle scroll lock for modals
  useEffect(() => {
    if (showCreateTaskForm || showCreateJiraForm || showAddRepoForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCreateTaskForm, showCreateJiraForm, showAddRepoForm]);

  // Handle keyboard events for modals
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showCreateTaskForm) setShowCreateTaskForm(false);
        if (showCreateJiraForm) setShowCreateJiraForm(false);
        if (showAddRepoForm) setShowAddRepoForm(false);
      }
    };

    if (showCreateTaskForm || showCreateJiraForm || showAddRepoForm) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCreateTaskForm, showCreateJiraForm, showAddRepoForm]);



  // Render modals for create actions
  const renderCreateModals = () => (
    <AnimatePresence>
      {showCreateTaskForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowCreateTaskForm(false)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <TaskForm
              onSubmit={handleTaskSubmit}
              onCancel={() => setShowCreateTaskForm(false)}
            />
          </div>
        </motion.div>
      )}

      {showCreateJiraForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowCreateJiraForm(false)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CreateJiraTicketForm 
              onTicketCreated={handleJiraTicketSubmit}
              onCancel={() => setShowCreateJiraForm(false)}
              jiraConnected={jiraConnected}
            />
          </div>
        </motion.div>
      )}

      {showAddRepoForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowAddRepoForm(false)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <AddRepoForm
              onSubmit={handleRepoSubmit}
              onCancel={() => setShowAddRepoForm(false)}
              onOpenGlobalRepoSearch={() => setShowGlobalRepoSearch(true)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Update display name handler
  const handleDisplayNameUpdate = async () => {
    try {
      await updateProfile(auth.currentUser, { displayName });
      showToast("Display name updated!", "success");
    } catch (error) {
      showToast("Failed to update display name", "error");
    }
  };

  const [globalRepoQuery, setGlobalRepoQuery] = useState("");
  const [globalRepoResults, setGlobalRepoResults] = useState([]);
  const [globalRepoLoading, setGlobalRepoLoading] = useState(false);
  const [showGlobalRepoResults, setShowGlobalRepoResults] = useState(false);

  const handleGlobalRepoSearch = async () => {
    if (!globalRepoQuery.trim()) return;
    setGlobalRepoLoading(true);
    setShowGlobalRepoResults(true);
    // TODO: Replace with real API call
    setTimeout(() => {
      setGlobalRepoResults([
        {
          id: 1,
          full_name: "facebook/react",
          description: "A declarative, efficient, and flexible JavaScript library for building user interfaces.",
          stargazers_count: 210000,
          html_url: "https://github.com/facebook/react",
        },
        {
          id: 2,
          full_name: "vercel/next.js",
          description: "The React Framework",
          stargazers_count: 120000,
          html_url: "https://github.com/vercel/next.js",
        },
      ]);
      setGlobalRepoLoading(false);
    }, 1000);
  };

  // Add state for all repos and search
  const [githubRepos, setGithubRepos] = useState([]);
  const [repoSearch, setRepoSearch] = useState("");

  // Fetch all repos after connecting
  useEffect(() => {
    if (githubConnected) {
      fetch("/api/github/repos")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setGithubRepos(data);
        });
    }
  }, [githubConnected]);

  const [selectedRepoSummary, setSelectedRepoSummary] = useState(null);
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [repoModalLoading, setRepoModalLoading] = useState(false);

  const handleRepoTileClick = async (repo) => {
    setRepoModalLoading(true);
    setShowRepoModal(true);
    try {
      const res = await fetch(`/api/github/summary?repo=${repo.full_name}`);
      const data = await res.json();
      setSelectedRepoSummary({ ...data, ...repo });
    } catch (e) {
      setSelectedRepoSummary({ error: 'Failed to fetch repo details.' });
    } finally {
      setRepoModalLoading(false);
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={() => signOut(auth)}
      user={user}
    >
      <div className="dashboard-container mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <motion.h1
            className="text-3xl font-display font-bold gradient-text-blue mb-1"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Welcome back, {user?.displayName || "Developer"}
          </motion.h1>
          <motion.p
            className="text-text-secondary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Here's your development activity overview
          </motion.p>
        </div>

        <motion.div
          className="flex space-x-3 mt-4 lg:mt-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button
            variant="secondary"
            icon={
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            }
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          {activeTab === "jira" && (
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowCreateJiraForm(true)}
            >
              New Ticket
            </Button>
          )}
          {activeTab === "github" && (
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowAddRepoForm(true)}
            >
              Add Repository
            </Button>
          )}
          {activeTab === "tasks" && (
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowCreateTaskForm(true)}
            >
              New Task
            </Button>
          )}
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="dashboard-content"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>

      {/* Render modals */}
      {renderModals()}

      {/* Create action button and modals */}
      {activeTab !== "github" && (
        <CreateActionButton
          onCreateTask={handleCreateTask}
          onCreateJiraTicket={handleCreateJiraTicket}
          onAddGithubRepo={handleAddGithubRepo}
        />
      )}
      {renderCreateModals()}

      {showGlobalRepoResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-lighter rounded-lg w-full max-w-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Global GitHub Repository Search</h2>
            <div className="mb-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 rounded border border-white/10 bg-background"
                  placeholder="Global GitHub repository search (e.g. react, next.js, owner/repo)"
                  value={globalRepoQuery}
                  onChange={e => setGlobalRepoQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleGlobalRepoSearch(); }}
                />
                <Button variant="primary" onClick={handleGlobalRepoSearch} isLoading={globalRepoLoading}>
                  Search
                </Button>
                {showGlobalRepoResults && (
                  <Button variant="secondary" onClick={() => setShowGlobalRepoResults(false)}>
                    Close
                  </Button>
                )}
              </div>
              {showGlobalRepoResults && (
                <div className="bg-background-lighter border border-white/10 rounded-lg mt-2 p-4 max-h-96 overflow-y-auto shadow-lg z-40">
                  {globalRepoLoading && <div>Loading...</div>}
                  {!globalRepoLoading && globalRepoResults.length === 0 && <div className="text-text-secondary">No results yet.</div>}
                  {!globalRepoLoading && globalRepoResults.map(repo => (
                    <div key={repo.id} className="p-4 rounded bg-background border border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                      <div>
                        <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-blue hover:underline">{repo.full_name}</a>
                        <div className="text-sm text-text-secondary">{repo.description}</div>
                      </div>
                      <div className="text-xs text-text-secondary">⭐ {repo.stargazers_count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRepoModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" style={{overflowY: 'auto'}}>
          <div className="bg-background-lighter rounded-2xl shadow-2xl w-full max-w-2xl p-8 relative animate-fadeIn" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-text-secondary hover:text-text-primary" onClick={() => { setShowRepoModal(false); setSelectedRepoSummary(null); }}>&times;</button>
            {repoModalLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">Loading...</div>
            ) : selectedRepoSummary && !selectedRepoSummary.error ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <img src={selectedRepoSummary.owner?.avatar_url} alt={selectedRepoSummary.owner?.login} className="w-10 h-10 rounded-full" />
                  <div>
                    <a href={selectedRepoSummary.html_url} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-accent-blue hover:underline block">
                      {selectedRepoSummary.full_name}
                    </a>
                    <div className="text-sm text-text-secondary">{selectedRepoSummary.description}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 mb-4">
                  <div><b>Language:</b> {selectedRepoSummary.language || 'N/A'}</div>
                  <div><b>Stars:</b> {selectedRepoSummary.stargazers_count}</div>
                  <div><b>Forks:</b> {selectedRepoSummary.forks_count}</div>
                  <div><b>Open Issues:</b> {selectedRepoSummary.issues?.length ?? selectedRepoSummary.open_issues_count}</div>
                  <div><b>Pull Requests:</b> {selectedRepoSummary.pulls?.length ?? 0}</div>
                  <div><b>Last Updated:</b> {new Date(selectedRepoSummary.updated_at).toLocaleString()}</div>
                </div>
                <div className="mb-2 font-semibold">Recent Commits:</div>
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {selectedRepoSummary.commits && selectedRepoSummary.commits.length > 0 ? selectedRepoSummary.commits.map(commit => (
                    <div key={commit.sha} className="bg-background p-2 rounded text-xs text-text-secondary">
                      <span className="font-mono">{commit.sha.substring(0, 7)}</span>: {commit.message}
                      <span className="ml-2">by {commit.author}</span>
                      <span className="ml-2">{commit.date ? new Date(commit.date).toLocaleString() : ''}</span>
                    </div>
                  )) : <div className="text-text-secondary text-xs">No recent commits</div>}
                </div>
                <div className="mb-2 font-semibold">Open Issues:</div>
                <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                  {selectedRepoSummary.issues && selectedRepoSummary.issues.length > 0 ? selectedRepoSummary.issues.map(issue => (
                    <div key={issue.id} className="bg-background p-2 rounded text-xs text-text-secondary">
                      <a href={issue.html_url} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">{issue.title}</a>
                      <span className="ml-2">#{issue.number}</span>
                      <span className="ml-2">by {issue.user?.login}</span>
                    </div>
                  )) : <div className="text-text-secondary text-xs">No open issues</div>}
                </div>
                <div className="mb-2 font-semibold">Pull Requests:</div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedRepoSummary.pulls && selectedRepoSummary.pulls.length > 0 ? selectedRepoSummary.pulls.map(pr => (
                    <div key={pr.id} className="bg-background p-2 rounded text-xs text-text-secondary">
                      <a href={pr.html_url} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">{pr.title}</a>
                      <span className="ml-2">#{pr.number}</span>
                      <span className="ml-2">by {pr.user?.login}</span>
                    </div>
                  )) : <div className="text-text-secondary text-xs">No pull requests</div>}
                </div>
              </>
            ) : (
              <div className="text-red-400">{selectedRepoSummary?.error || 'Failed to load repository details.'}</div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
