/*
DEVSYNC - Unified Developer Dashboard with GitHub Repo Summary
Now fetches: Repo Info + Issues + Pull Requests + Commits
*/

import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import CreateJiraTicketForm from "./CreateJiraTicketForm";
import "./Dashboard.css";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("jira");
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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tasks"), (snapshot) => {
      setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedRepo) return;

    // fetch GitHub data (issues + PRs + commits + metadata)
    fetch(`http://localhost:5000/api/github/summary?repo=${selectedRepo}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.repo) setGithubRepoInfo(data.repo);
        if (Array.isArray(data.issues)) setGithubIssues(data.issues);
        if (Array.isArray(data.pulls)) setGithubPRs(data.pulls);
        if (Array.isArray(data.commits)) setGithubCommits(data.commits);
      });

    fetchJira();
  }, [selectedRepo]);

  const fetchJira = async () => {
    const res = await fetch("http://localhost:5000/api/jira");
    const data = await res.json();
    setJiraData(data);
  };

  const handleAdd = async () => {
    if (!task.trim()) return;
    await addDoc(collection(db, "tasks"), {
      content: task,
      user: auth.currentUser.email,
    });
    setTask("");
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🚀 DevSync Dashboard</h1>
        <button onClick={() => signOut(auth)}>Logout</button>
      </div>

      {/* 🔘 Tabs */}
      <div className="tab-nav">
        <button
          onClick={() => setActiveTab("jira")}
          className={activeTab === "jira" ? "active" : ""}
        >
          Jira
        </button>
        <button
          onClick={() => setActiveTab("github")}
          className={activeTab === "github" ? "active" : ""}
        >
          GitHub
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={activeTab === "tasks" ? "active" : ""}
        >
          Tasks
        </button>
      </div>

      {/* 📌 Jira Section */}
      {activeTab === "jira" && (
        <div className="section">
          <h2
            style={{ fontSize: "18px", color: "#1d4ed8", marginBottom: "10px" }}
          >
            ➕ Create Jira Ticket
          </h2>
          <CreateJiraTicketForm onTicketCreated={fetchJira} />

          <div style={{ marginTop: "30px" }}>
            <h2
              style={{
                fontSize: "18px",
                color: "#1d4ed8",
                marginBottom: "10px",
              }}
            >
              📋 All Jira Tickets
            </h2>
            {jiraData.length > 0 ? (
              <ul>
                {jiraData.map((item) => (
                  <li key={item.id}>
                    <strong>{item.id}</strong>: {item.summary}{" "}
                    <span className="ticket-status">({item.status})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No tickets found.</p>
            )}
          </div>
        </div>
      )}

      {/* 🐙 GitHub Section */}
      {activeTab === "github" && (
        <div className="section">
          <h2>🐙 GitHub Summary</h2>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontWeight: "bold", marginRight: "10px" }}>
              🔽 Select GitHub Repo:
            </label>
            <input
              type="text"
              value={selectedRepo}
              onChange={(e) => {
                const val = e.target.value.trim();
                setSelectedRepo(val);
                localStorage.setItem("selectedRepo", val);
              }}
              placeholder="e.g. vercel/next.js"
              style={{
                padding: "6px 10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "14px",
                width: "250px",
              }}
            />
          </div>

          {/* Repo Info */}
          {githubRepoInfo && (
            <div style={{ marginBottom: "20px" }}>
              <h3>{githubRepoInfo.full_name}</h3>
              <p>{githubRepoInfo.description}</p>
              <p>
                🌟 {githubRepoInfo.stargazers_count} | 🍴{" "}
                {githubRepoInfo.forks_count} | 👁 {githubRepoInfo.watchers_count}
              </p>
            </div>
          )}

          {/* PRs */}
          <div style={{ marginBottom: "20px" }}>
            <h3>🔁 Pull Requests</h3>
            <ul>
              {githubPRs.map((pr) => (
                <li key={pr.id}>
                  <a href={pr.html_url} target="_blank" rel="noreferrer">
                    #{pr.number}: {pr.title}
                  </a>{" "}
                  - by {pr.user.login}
                </li>
              ))}
            </ul>
          </div>

          {/* Issues */}
          <div style={{ marginBottom: "20px" }}>
            <h3>🐞 Issues</h3>
            <ul>
              {githubIssues.map((item) => (
                <li key={item.id}>
                  <a href={item.html_url} target="_blank" rel="noreferrer">
                    #{item.number}: {item.title}
                  </a>
                  <p>By {item.user.login}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Commits */}
          <div>
            <h3>🧑‍💻 Recent Commits</h3>
            <ul>
              {githubCommits.map((commit) => (
                <li key={commit.sha}>
                  <a href={commit.html_url} target="_blank" rel="noreferrer">
                    {commit.commit.message}
                  </a>{" "}
                  -{" "}
                  {commit.author
                    ? commit.author.login
                    : commit.commit.author.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ✅ Tasks */}
      {activeTab === "tasks" && (
        <div className="section">
          <h2>📝 Live Tasks</h2>
          <div className="task-section">
            <input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Enter new task"
            />
            <button onClick={handleAdd}>Add Task</button>
          </div>
          <ul>
            {tasks.map((t) => (
              <li key={t.id}>
                <span>{t.content}</span>
                <span className="user-email">{t.user}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
