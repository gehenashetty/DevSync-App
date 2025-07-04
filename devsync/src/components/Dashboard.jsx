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
  const [githubIssues, setGithubIssues] = useState([]);
  const [jiraData, setJiraData] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tasks"), (snapshot) => {
      setTasks(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    fetch(
      "http://localhost:5000/api/github/issues?repo=gehenashetty/DevSync-App"
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("GitHub Issues Response:", data); // 👈 ADD THIS
        if (Array.isArray(data)) setGithubIssues(data);
      });
    fetchJira();
  }, []);
  

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
          {/* 🎯 Create Form First */}
          <h2
            style={{ fontSize: "18px", color: "#1d4ed8", marginBottom: "10px" }}
          >
            ➕ Create Jira Ticket
          </h2>
          <CreateJiraTicketForm onTicketCreated={fetchJira} />

          {/* 🗂 Then Display Tickets */}
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

      {/* 🐙 GitHub Issues */}
      {activeTab === "github" && (
        <div className="section">
          <h2>🐙 GitHub Issues</h2>
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
