# 🚀 DevSync — Unified Developer Dashboard

DevSync is a sleek and powerful developer dashboard that integrates:

- ✅ GitHub (Issues, Pull Requests, Commits)
- 📌 Jira (Create + View Tickets)
- 📝 Firebase Tasks (Real-time task manager)
- 🌗 Dark mode + Activity logging
- ⚙️ Designed for hackathons & dev teams

---

## ✨ Features

| Feature               | Description |
|----------------------|-------------|
| 🔐 Auth              | Firebase email/password authentication |
| 🔄 Real-time Tasks   | Add tasks with Firestore sync |
| 🐙 GitHub            | Issues, PRs, and commits from selected repo |
| 🧾 Jira              | Create + View Jira issues via secure proxy |
| 🎨 UI/UX             | Futuristic glass UI + Tab-based layout |
| 🌓 Dark Mode         | Persistent theme toggle |
| 📋 Activity Log      | Auto-tracks actions in timeline |
| 📈 Extendable        | Built for future AI plugins, charts, etc |

---

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS (or plain CSS)
- **Backend (proxy)**: Express.js + Node.js
- **Auth/DB**: Firebase Auth & Firestore
- **APIs**: GitHub REST API & Jira Cloud API

---

## ⚙️ Setup Instructions

### 1. 🔧 Frontend Setup & Run

```bash
git clone https://github.com/gehenashetty/DevSync-App.git
cd devsync
npm install
npm run dev
```

### 2. 🔧 Backend Setup & Run

```bash
git clone https://github.com/gehenashetty/DevSync-App.git
cd gitjiraproxy
npm install
npm start
