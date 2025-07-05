/*
DEVSYNC - Unified Developer Dashboard with GitHub Repo Summary
Now fetches: Repo Info + Issues + Pull Requests + Commits
*/

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedJiraTicket, setSelectedJiraTicket] = useState(null);
  const [showJiraModal, setShowJiraModal] = useState(false);
  const [jiraSearchTerm, setJiraSearchTerm] = useState("");
  const [jiraFilter, setJiraFilter] = useState("all");
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
        `http://localhost:5000/api/github/summary?repo=${selectedRepo}`
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
      const res = await fetch("http://localhost:5000/api/jira");
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
      setShowCreateForm(false);
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
          "http://localhost:5000/api/github/add-repo",
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

  const renderDashboardContent = () => (
    <>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Open Tickets"
          value={jiraData.length || "0"}
          icon={<FileCode2 size={18} className="text-accent-blue" />}
          trend={{ value: 8, positive: false }}
          variant="blue"
          delay={0.1}
        />

        <StatCard
          title="Completed Tasks"
          value={tasks.filter((t) => t.status === "completed").length || "0"}
          icon={<CheckSquare size={18} className="text-accent-green" />}
          trend={{ value: 20, positive: true }}
          variant="green"
          delay={0.2}
        />

        <StatCard
          title="Pull Requests"
          value={githubData.prs?.length || "0"}
          icon={<GitPullRequest size={18} className="text-accent-purple" />}
          trend={{ value: 12, positive: true }}
          variant="purple"
          delay={0.3}
        />

        <StatCard
          title="Open Issues"
          value={githubData.issues?.length || "0"}
          icon={<Activity size={18} className="text-accent-blue" />}
          trend={{ value: 3, positive: true }}
          variant="blue"
          delay={0.4}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Jira Card */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-background-lighter border border-white/10 rounded-xl p-6 shadow hover:shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-2 text-accent-blue">
            🧾 Jira Tickets
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            {jiraData.length} tickets available
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab("jira")}
          >
            View Jira
          </Button>
        </motion.div>

        {/* GitHub Card */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-background-lighter border border-white/10 rounded-xl p-6 shadow hover:shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-2 text-accent-purple">
            💻 GitHub Repo
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            {selectedRepo} — {githubData.commits?.length || 0} recent commits
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab("github")}
          >
            View GitHub
          </Button>
        </motion.div>

        {/* Tasks Card */}
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-background-lighter border border-white/10 rounded-xl p-6 shadow hover:shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-2 text-accent-green">
            📋 Tasks
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            <ul className="text-sm text-text-secondary mb-4">
              {tasks.slice(0, 2).map((t) => (
                <li key={t.id}>• {t.title}</li>
              ))}
            </ul>
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActiveTab("tasks")}
          >
            View Tasks
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
          {/* <Button 
            variant="primary" 
            icon={<Plus size={16} />}
            onClick={() => setShowCreateForm(true)}
          >
            Create Ticket
          </Button> */}
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
  );

  const renderGithubContent = () => {
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

            <div className="flex justify-between mb-6">
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Refresh"}
                </Button>
              </div>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={() => setShowCreateForm(true)}
              >
                Add Repository
              </Button>
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
                  onClick={() => setShowCreateForm(true)}
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

          <div className="flex justify-between mb-6">
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
            {/* <Button 
              variant="primary" 
              icon={<Plus size={16} />}
              onClick={() => setShowCreateForm(true)}
            >
              Add Repository
            </Button> */}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repoInfo ? (
                <RepoCard
                  name={repoInfo.name}
                  description={repoInfo.description}
                  stars={repoInfo.stars}
                  forks={repoInfo.forks}
                  watchers={repoInfo.watchers}
                  language={repoInfo.language}
                  lastCommit={repoInfo.lastCommit}
                  openIssues={repoInfo.openIssues}
                  pullRequests={repoInfo.pullRequests}
                  delay={0.1}
                  onClick={() =>
                    window.open(`https://github.com/${selectedRepo}`, "_blank")
                  }
                />
              ) : (
                <div className="col-span-2 text-center py-8 text-text-secondary">
                  No repositories found. Add one to get started!
                </div>
              )}
            </div>

            {repoInfo && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">
                  Repository Activity
                </h2>

                {/* Pull Requests */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <GitPullRequest
                      size={18}
                      className="mr-2 text-accent-purple"
                    />
                    Pull Requests
                  </h3>
                  <div className="space-y-2">
                    {Array.isArray(prs) && prs.length > 0 ? (
                      prs.map((pr) => (
                        <Card
                          key={pr.id}
                          className="p-4 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center">
                            <GitPullRequest
                              size={16}
                              className="text-accent-purple mr-2"
                            />
                            <a
                              href={pr.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-accent-purple"
                            >
                              {pr.title || "Untitled PR"}
                            </a>
                          </div>
                          <div className="text-sm text-text-secondary mt-1">
                            #{pr.number || "Unknown"} opened by{" "}
                            {typeof pr.user === "object"
                              ? pr.user?.login || "Unknown"
                              : pr.user || "Unknown"}
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-4 text-text-secondary">
                        No pull requests found
                      </div>
                    )}
                  </div>
                </div>

                {/* Issues */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <AlertCircle size={18} className="mr-2 text-accent-blue" />
                    Issues
                  </h3>
                  <div className="space-y-2">
                    {Array.isArray(issues) && issues.length > 0 ? (
                      issues.map((issue) => (
                        <Card
                          key={issue.id}
                          className="p-4 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center">
                            <AlertCircle
                              size={16}
                              className="text-accent-blue mr-2"
                            />
                            <a
                              href={issue.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-accent-blue"
                            >
                              {issue.title || "Untitled Issue"}
                            </a>
                          </div>
                          <div className="text-sm text-text-secondary mt-1">
                            #{issue.number || "Unknown"} opened by{" "}
                            {typeof issue.user === "object"
                              ? issue.user?.login || "Unknown"
                              : issue.user || "Unknown"}
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-4 text-text-secondary">
                        No issues found
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Commits */}
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <FileCode2 size={18} className="mr-2 text-accent-green" />
                    Recent Commits
                  </h3>
                  <div className="space-y-2">
                    {Array.isArray(commits) && commits.length > 0 ? (
                      commits.map((commit) => (
                        <Card
                          key={commit.sha}
                          className="p-4 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center">
                            <FileCode2
                              size={16}
                              className="text-accent-green mr-2"
                            />
                            <span className="font-mono text-sm">
                              {commit.sha?.substring(0, 7) || "Unknown"}
                            </span>
                            <span className="mx-2">-</span>
                            <span>{commit.message || "No message"}</span>
                          </div>
                          <div className="text-sm text-text-secondary mt-1">
                            by{" "}
                            {typeof commit.author === "object"
                              ? commit.author?.login || "Unknown"
                              : commit.author || "Unknown"}{" "}
                            on{" "}
                            {commit.date
                              ? new Date(commit.date).toLocaleDateString()
                              : "Unknown date"}
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-4 text-text-secondary">
                        No commits found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
    // Filter tasks based on active filter
    const filteredTasks = tasks.filter((task) => {
      switch (activeFilter) {
        case "in-progress":
          return task.status === "in-progress";
        case "completed":
          return task.status === "completed";
        case "all":
        default:
          return true;
      }
    });

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

        <div className="flex justify-between mb-6">
          <div className="flex space-x-2">
            <Button
              variant={activeFilter === "all" ? "primary" : "secondary"}
              onClick={() => setActiveFilter("all")}
            >
              All Tasks
            </Button>
            {/* <Button
              variant={activeFilter === "in-progress" ? "primary" : "secondary"}
              onClick={() => setActiveFilter("in-progress")}
            >
              In Progress
            </Button> */}
            <Button
              variant={activeFilter === "completed" ? "primary" : "secondary"}
              onClick={() => setActiveFilter("completed")}
            >
              Completed
            </Button>
          </div>
          {/* <Button 
          variant="primary" 
          icon={<Plus size={16} />}
          onClick={() => setShowCreateForm(true)}
        >
          Add Task
        </Button> */}
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
              {activeFilter === "all"
                ? "No tasks found. Create one to get started!"
                : `No ${
                    activeFilter === "in-progress" ? "in progress" : "completed"
                  } tasks found.`}
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
                defaultValue={user?.displayName || "User"}
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
              onClick={handleButtonClick(() => alert("Profile updated!"))}
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
                <span className="px-2 py-0.5 text-xs bg-accent-green/20 text-accent-green-light rounded-full">
                  Connected
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-3">
                Connected to Jira Cloud
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleButtonClick(() => alert("Jira disconnected!"))}
              >
                Disconnect
              </Button>
            </div>
            <div className="p-4 border border-white/10 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">GitHub Integration</h3>
                <span className="px-2 py-0.5 text-xs bg-accent-green/20 text-accent-green-light rounded-full">
                  Connected
                </span>
              </div>
              <p className="text-sm text-text-secondary mb-3">
                Connected to GitHub
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleButtonClick(() => alert("GitHub disconnected!"))}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
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
        case "settings":
          console.log("Rendering Settings content");
          return renderSettingsContent();
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

      {showCreateForm && activeTab === "jira" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-lighter p-6 rounded-lg w-full max-w-lg">
            <CreateJiraTicketForm
              onTicketCreated={() => {
                setShowCreateForm(false);
                handleRefresh();
              }}
            />
            <Button
              variant="secondary"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {showCreateForm && activeTab === "github" && (
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

      {showCreateForm && activeTab === "tasks" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-lighter p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTask({
                  title: e.target.title.value,
                  description: e.target.description.value,
                  dueDate: e.target.dueDate.value,
                  priority: e.target.priority.value,
                  tags: e.target.tags.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                });
              }}
            >
              <div className="space-y-4">
                <input
                  type="text"
                  name="title"
                  placeholder="Task title"
                  className="w-full bg-background border border-white/10 rounded-lg py-2 px-3"
                  required
                />
                <textarea
                  name="description"
                  placeholder="Task description"
                  className="w-full bg-background border border-white/10 rounded-lg py-2 px-3"
                  required
                />
                <input
                  type="date"
                  name="dueDate"
                  className="w-full bg-background border border-white/10 rounded-lg py-2 px-3"
                  required
                />
                <select
                  name="priority"
                  className="w-full bg-background border border-white/10 rounded-lg py-2 px-3"
                  required
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <input
                  type="text"
                  name="tags"
                  placeholder="Tags (comma-separated)"
                  className="w-full bg-background border border-white/10 rounded-lg py-2 px-3"
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    Create Task
                  </Button>
                </div>
              </div>
            </form>
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

  // Render modals for create actions
  const renderCreateModals = () => (
    <AnimatePresence>
      {showCreateTaskForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg">
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg">
            <CreateJiraTicketForm onTicketCreated={handleJiraTicketSubmit} />
          </div>
        </motion.div>
      )}

      {showAddRepoForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-lg">
            <AddRepoForm
              onSubmit={handleRepoSubmit}
              onCancel={() => setShowAddRepoForm(false)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

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

          {(activeTab === "jira" ||
            activeTab === "github" ||
            activeTab === "tasks") && (
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowCreateForm(true)}
            >
              {activeTab === "jira"
                ? "New Ticket"
                : activeTab === "github"
                ? "Add Repo"
                : activeTab === "tasks"
                ? "New Task"
                : "New Item"}
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
      <CreateActionButton
        onCreateTask={handleCreateTask}
        onCreateJiraTicket={handleCreateJiraTicket}
        onAddGithubRepo={handleAddGithubRepo}
      />
      {renderCreateModals()}
    </DashboardLayout>
  );
};

export default Dashboard;
