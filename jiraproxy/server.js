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
      `https://${JIRA_DOMAIN}/rest/api/3/search?jql=project=MBA`,
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
          project: { key: "MBA" },
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Jira proxy server running on port ${PORT}`)
);
