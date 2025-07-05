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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Jira proxy server running on port ${PORT}`)
);
