import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Jira proxy endpoint
app.get('/api/jira-proxy/*', async (req, res) => {
  try {
    const jiraPath = req.params[0];
    const url = `https://prateekk1103.atlassian.net/rest/api/3/${jiraPath}`;
    
    // Get auth header from query params
    const authHeader = req.query.auth;
    
    if (!authHeader) {
      return res.status(400).json({ error: 'Authorization header required' });
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `Jira API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Jira proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GitHub proxy endpoint
app.get('/api/github-proxy/*', async (req, res) => {
  try {
    const githubPath = req.params[0];
    const url = `https://api.github.com/${githubPath}`;
    
    // Get auth header from query params
    const authHeader = req.query.auth;
    
    if (!authHeader) {
      return res.status(400).json({ error: 'Authorization header required' });
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `GitHub API error: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('GitHub proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DevSync proxy server is running' });
});

app.listen(PORT, () => {
  console.log(`DevSync proxy server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /api/health - Health check');
  console.log('  GET /api/jira-proxy/* - Jira API proxy');
  console.log('  GET /api/github-proxy/* - GitHub API proxy');
}); 