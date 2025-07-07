// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JIRA_DOMAIN = process.env.JIRA_DOMAIN;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

const encodedCreds = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString(
  "base64"
);

// GET Jira issues
app.get("/api/jira", async (req, res) => {
  try {
    const response = await fetch(
      `https://${JIRA_DOMAIN}/rest/api/3/search?jql=project=ECS`,
      {
        headers: {
          Authorization: `Basic ${encodedCreds}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    // 🔍 Check if data.issues exists
    if (!Array.isArray(data.issues)) {
      console.error("Jira response error:", data);
      return res.status(400).json({ error: "Invalid Jira response", data });
    }

    res.json(
      data.issues.map((issue) => ({
        id: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        priority: issue.fields.priority?.name || "Medium",
        assignee: issue.fields.assignee
          ? {
              name: issue.fields.assignee.displayName,
              avatar: issue.fields.assignee.avatarUrls["16x16"],
              initials: issue.fields.assignee.displayName
                .split(" ")
                .map((n) => n[0])
                .join(""),
            }
          : null,
        dueDate: issue.fields.duedate || null,
      }))
    );
    
  } catch (err) {
    console.error("Error fetching from Jira:", err);
    res.status(500).json({ error: "Failed to connect to Jira" });
  }
});

// POST Jira issue
app.post("/api/jira/create", async (req, res) => {
  const { summary, description, projectKey } = req.body;

  try {
    const response = await fetch(`https://${JIRA_DOMAIN}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${encodedCreds}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          project: { key: "ECS" },
          summary,
          description: {
            type: "doc",
            version: 1,
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "description",
                  },
                ],
              },
            ],
          },
          issuetype: { name: "Task" },
        },
      }),
    });

    const data = await response.json();

    if (data.key) {
      res.json({ success: true, issueKey: data.key });
    } else {
      res.status(400).json({ success: false, error: data });
    }
  } catch (err) {
    console.error("Error creating Jira ticket:", err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

//github
app.get("/api/github/issues", async (req, res) => {
  const repo = req.query.repo || "vercel/next.js"; // fallback public repo
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/issues`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("GitHub fetch error:", err);
    res.status(500).json({ error: "Failed to fetch GitHub issues" });
  }
});

app.get("/api/github/summary", async (req, res) => {
  const repo = req.query.repo;
  if (!repo) return res.status(400).json({ error: "Missing repo parameter" });

  try {
    const headers = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
    };

    const [repoInfoRes, issuesRes, pullsRes, commitsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repo}`, { headers }),
      fetch(`https://api.github.com/repos/${repo}/issues`, { headers }),
      fetch(`https://api.github.com/repos/${repo}/pulls`, { headers }),
      fetch(`https://api.github.com/repos/${repo}/commits`, { headers }),
    ]);

    const [repoInfo, issues, pulls, commits] = await Promise.all([
      repoInfoRes.json(),
      issuesRes.json(),
      pullsRes.json(),
      commitsRes.json(),
    ]);

    res.json({
      repo: repoInfo,
      issues: issues.filter((i) => !i.pull_request),
      pulls,
      commits: commits.slice(0, 5).map((commit) => ({
        sha: commit.sha,
        message: commit.commit?.message || "No message",
        author:
          commit.author?.login || commit.commit?.author?.name || "Unknown",
        date: commit.commit?.author?.date || null,
      })),
    });
  } catch (err) {
    console.error("GitHub summary fetch error:", err);
    res.status(500).json({ error: "Failed to fetch GitHub summary" });
  }
});

//AI
app.post("/api/devcoach", async (req, res) => {
  const { message, context } = req.body;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-70b-8192", 
          messages: [
            {
              role: "system",
              content: "You are a helpful developer assistant.",
            },
            {
              role: "user",
              content: `${context ? `Context:\n${context}\n\n` : ""}${message}`,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    const reply = data.choices?.[0]?.message?.content || "No reply";
    res.json({ reply }); 
  } catch (err) {
    console.error("Groq AI request failed:", err);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

// Add Jira 'myself' proxy endpoint for connection testing
app.get("/api/jira-proxy/myself", async (req, res) => {
  const auth = req.query.auth;
  if (!auth) {
    return res.status(400).json({ error: "Missing auth parameter" });
  }
  try {
    const response = await fetch(
      `https://${JIRA_DOMAIN}/rest/api/3/myself`,
      {
        headers: {
          Authorization: decodeURIComponent(auth),
          Accept: "application/json",
        },
      }
    );
    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      res.status(response.status).json({ error: data });
    }
  } catch (err) {
    console.error("Error fetching Jira myself:", err);
    res.status(500).json({ error: "Failed to connect to Jira" });
  }
});

app.get("/api/github/repos", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.github.com/user/repos?sort=updated&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );
    const data = await response.json();
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "Invalid GitHub response", data });
    }
    // Optionally, map to only needed fields for frontend
    res.json(
      data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        open_issues_count: repo.open_issues_count,
        language: repo.language,
        updated_at: repo.updated_at,
        private: repo.private,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
        },
      }))
    );
  } catch (err) {
    console.error("GitHub repos fetch error:", err);
    res.status(500).json({ error: "Failed to fetch GitHub repositories" });
  }
});

// --- Confluence Proxy Endpoints ---
const CONFLUENCE_EMAIL = process.env.JIRA_EMAIL;
const CONFLUENCE_API_TOKEN = process.env.JIRA_API_TOKEN;
const CONFLUENCE_DOMAIN = process.env.JIRA_DOMAIN;
const CONFLUENCE_BASE = `https://${CONFLUENCE_DOMAIN}/wiki/rest/api`;
const CONFLUENCE_AUTH_HEADER = 'Basic ' + Buffer.from(`${CONFLUENCE_EMAIL}:${CONFLUENCE_API_TOKEN}`).toString('base64');

// Get Confluence spaces
app.get('/api/confluence/spaces', async (req, res) => {
  try {
    const response = await fetch(`${CONFLUENCE_BASE}/space`, {
      headers: {
        'Authorization': CONFLUENCE_AUTH_HEADER,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Confluence fetch spaces error:', err);
    res.status(500).json({ error: 'Failed to fetch Confluence spaces' });
  }
});

// Get Confluence pages in a space
app.get('/api/confluence/pages', async (req, res) => {
  const { spaceKey } = req.query;
  if (!spaceKey) return res.status(400).json({ error: 'Missing spaceKey parameter' });
  try {
    const response = await fetch(`${CONFLUENCE_BASE}/content?spaceKey=${spaceKey}&expand=body.storage`, {
      headers: {
        'Authorization': CONFLUENCE_AUTH_HEADER,
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Confluence fetch pages error:', err);
    res.status(500).json({ error: 'Failed to fetch Confluence pages' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`Jira proxy server running on port ${PORT}`)
);