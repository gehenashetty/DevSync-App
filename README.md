# DevSync App

A full-stack application that integrates with Jira and GitHub APIs.

## Setup Instructions

### 1. Install Dependencies

First, install all dependencies for the main project, frontend, and backend:

```bash
npm run install:all
```

Or install them separately:

```bash
# Main project
npm install

# Frontend
cd devsync
npm install

# Backend
cd jiraproxy
npm install
```

### 2. Environment Variables

Create a `.env` file in the `jiraproxy` directory with the following variables:

```
JIRA_DOMAIN=your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token
GITHUB_TOKEN=your-github-token
PORT=5000
```

### 3. Running the Application

You can run both frontend and backend together:

```bash
npm run dev
```

Or run them separately:

```bash
# Frontend
cd devsync
npm run dev

# Backend
cd jiraproxy
npm start
```

The frontend will be available at http://localhost:5173 and the backend at http://localhost:5000. 
