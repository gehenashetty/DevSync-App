import CredentialService from './CredentialService';
import ProxyService from './ProxyService';

class JiraService {
  constructor() {
    this.baseUrl = null;
    this.authHeader = null;
  }

  // Initialize with credentials
  initialize(credentials) {
    if (!CredentialService.validateJiraCredentials(credentials)) {
      throw new Error('Invalid Jira credentials format');
    }

    this.baseUrl = CredentialService.getJiraBaseUrl(credentials.domain);
    this.authHeader = `Basic ${btoa(`${credentials.email}:${credentials.apiToken}`)}`;
  }

  // Get authenticated headers
  getHeaders() {
    if (!this.authHeader) {
      throw new Error('Jira not initialized. Please provide credentials first.');
    }

    return {
      'Authorization': this.authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  // Test connection
  async testConnection() {
    try {
      const headers = this.getHeaders();
      console.log('Testing Jira connection to:', `${this.baseUrl}/rest/api/3/myself`);
      console.log('Headers:', headers);
      
      // Try local proxy server first
      try {
        const authHeader = headers['Authorization'];
        const response = await fetch(`http://localhost:3001/api/jira-proxy/myself?auth=${encodeURIComponent(authHeader)}`);
        
        console.log('Local proxy response status:', response.status);
        
        if (response.ok) {
          const user = await response.json();
          console.log('Jira user data (via local proxy):', user);
          return { success: true, user };
        } else {
          const errorData = await response.json();
          console.log('Local proxy error:', errorData);
          throw new Error(errorData.error || `Local proxy failed: ${response.status}`);
        }
      } catch (localProxyError) {
        console.log('Local proxy failed, trying external proxies...');
        
        // Reset proxy to start with direct connection
        ProxyService.reset();
        
        const response = await ProxyService.fetch(`${this.baseUrl}/rest/api/3/myself`, {
          method: 'GET',
          headers
        });

        console.log('External proxy response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Jira API error response:', errorText);
          throw new Error(`Connection failed: ${response.status} ${response.statusText}`);
        }

        const user = await response.json();
        console.log('Jira user data (via external proxy):', user);
        return { success: true, user };
      }
    } catch (error) {
      console.error('Jira connection test failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        baseUrl: this.baseUrl
      });
      throw error;
    }
  }

  // Get projects
  async getProjects() {
    try {
      const headers = this.getHeaders();
      const response = await ProxyService.fetch(`${this.baseUrl}/rest/api/3/project`, {
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Jira projects:', error);
      throw error;
    }
  }

  // Get issues from a project
  async getIssues(projectKey, maxResults = 50) {
    try {
      const headers = this.getHeaders();
      const jql = projectKey ? `project = ${projectKey}` : '';
      
      const response = await ProxyService.fetch(
        `${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=summary,description,status,priority,assignee,created,updated,duedate,comment`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch issues: ${response.statusText}`);
      }

      const data = await response.json();
      return data.issues.map(issue => this.transformIssue(issue));
    } catch (error) {
      console.error('Error fetching Jira issues:', error);
      throw error;
    }
  }

  // Get a specific issue
  async getIssue(issueKey) {
    try {
      const headers = this.getHeaders();
      const response = await fetch(
        `${this.baseUrl}/rest/api/3/issue/${issueKey}?fields=summary,description,status,priority,assignee,created,updated,duedate,comment`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch issue: ${response.statusText}`);
      }

      const issue = await response.json();
      return this.transformIssue(issue);
    } catch (error) {
      console.error('Error fetching Jira issue:', error);
      throw error;
    }
  }

  // Create a new issue
  async createIssue(issueData) {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.baseUrl}/rest/api/3/issue`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fields: {
            project: { key: issueData.projectKey },
            summary: issueData.summary,
            description: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: issueData.description }]
                }
              ]
            },
            issuetype: { name: 'Task' },
            priority: { name: issueData.priority || 'Medium' }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create issue: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Jira issue:', error);
      throw error;
    }
  }

  // Update issue status
  async updateIssueStatus(issueKey, newStatus) {
    try {
      const headers = this.getHeaders();
      
      // First get available transitions
      const transitionsResponse = await fetch(
        `${this.baseUrl}/rest/api/3/issue/${issueKey}/transitions`,
        { headers }
      );

      if (!transitionsResponse.ok) {
        throw new Error(`Failed to get transitions: ${transitionsResponse.statusText}`);
      }

      const transitionsData = await transitionsResponse.json();
      const transition = transitionsData.transitions.find(t => 
        t.to.name.toLowerCase() === newStatus.toLowerCase()
      );

      if (!transition) {
        throw new Error(`Transition to status "${newStatus}" not available`);
      }

      // Perform the transition
      const response = await fetch(
        `${this.baseUrl}/rest/api/3/issue/${issueKey}/transitions`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            transition: { id: transition.id }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update issue status: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating Jira issue status:', error);
      throw error;
    }
  }

  // Add comment to issue
  async addComment(issueKey, comment) {
    try {
      const headers = this.getHeaders();
      const response = await fetch(
        `${this.baseUrl}/rest/api/3/issue/${issueKey}/comment`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            body: {
              type: 'doc',
              version: 1,
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: comment }]
                }
              ]
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding Jira comment:', error);
      throw error;
    }
  }

  // Transform Jira issue to our format
  transformIssue(issue) {
    return {
      id: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
      status: issue.fields.status?.name || 'Unknown',
      priority: issue.fields.priority?.name || 'Medium',
      assignee: issue.fields.assignee ? {
        name: issue.fields.assignee.displayName,
        email: issue.fields.assignee.emailAddress,
        avatar: issue.fields.assignee.displayName?.substring(0, 2).toUpperCase()
      } : null,
      created: issue.fields.created,
      updated: issue.fields.updated,
      dueDate: issue.fields.duedate,
      comments: issue.fields.comment?.comments?.map(comment => ({
        id: comment.id,
        content: comment.body?.content?.[0]?.content?.[0]?.text || '',
        author: comment.author.displayName,
        timestamp: comment.created,
        avatar: comment.author.displayName?.substring(0, 2).toUpperCase()
      })) || []
    };
  }

  // Check if initialized
  isInitialized() {
    return this.baseUrl !== null && this.authHeader !== null;
  }

  // Reset (disconnect)
  reset() {
    this.baseUrl = null;
    this.authHeader = null;
  }
}

export default new JiraService(); 