import CredentialService from './CredentialService';

class GitHubService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.authHeader = null;
  }

  // Initialize with credentials
  initialize(credentials) {
    if (!CredentialService.validateGitHubCredentials(credentials)) {
      throw new Error('Invalid GitHub credentials format');
    }

    this.authHeader = `Bearer ${credentials.token}`;
  }

  // Get authenticated headers
  getHeaders() {
    if (!this.authHeader) {
      throw new Error('GitHub not initialized. Please provide credentials first.');
    }

    return {
      'Authorization': this.authHeader,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  // Test connection
  async testConnection() {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.baseUrl}/user`, { headers });

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.statusText}`);
      }

      const user = await response.json();
      return { success: true, user };
    } catch (error) {
      console.error('GitHub connection test failed:', error);
      throw error;
    }
  }

  // Get user information
  async getUser() {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.baseUrl}/user`, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching GitHub user:', error);
      throw error;
    }
  }

  // Get user's repositories
  async getRepositories() {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.baseUrl}/user/repos?sort=updated&per_page=100`, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      throw error;
    }
  }

  // Get repository information
  async getRepository(owner, repo) {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch repository: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching GitHub repository:', error);
      throw error;
    }
  }

  // Get repository issues
  async getIssues(owner, repo, state = 'open') {
    try {
      const headers = this.getHeaders();
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/issues?state=${state}&per_page=100`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch issues: ${response.statusText}`);
      }

      const issues = await response.json();
      return issues.map(issue => this.transformIssue(issue));
    } catch (error) {
      console.error('Error fetching GitHub issues:', error);
      throw error;
    }
  }

  // Get repository pull requests
  async getPullRequests(owner, repo, state = 'open') {
    try {
      const headers = this.getHeaders();
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch pull requests: ${response.statusText}`);
      }

      const prs = await response.json();
      return prs.map(pr => this.transformPullRequest(pr));
    } catch (error) {
      console.error('Error fetching GitHub pull requests:', error);
      throw error;
    }
  }

  // Get repository commits
  async getCommits(owner, repo, branch = 'main') {
    try {
      const headers = this.getHeaders();
      const response = await fetch(
        `${this.baseUrl}/repos/${owner}/${repo}/commits?sha=${branch}&per_page=50`,
        { headers }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch commits: ${response.statusText}`);
      }

      const commits = await response.json();
      return commits.map(commit => this.transformCommit(commit));
    } catch (error) {
      console.error('Error fetching GitHub commits:', error);
      throw error;
    }
  }

  // Get repository branches
  async getBranches(owner, repo) {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/branches`, { headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch branches: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching GitHub branches:', error);
      throw error;
    }
  }

  // Create an issue
  async createIssue(owner, repo, issueData) {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: issueData.title,
          body: issueData.body,
          labels: issueData.labels || []
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create issue: ${response.statusText}`);
      }

      const issue = await response.json();
      return this.transformIssue(issue);
    } catch (error) {
      console.error('Error creating GitHub issue:', error);
      throw error;
    }
  }

  // Update issue status
  async updateIssueStatus(owner, repo, issueNumber, state) {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ state })
      });

      if (!response.ok) {
        throw new Error(`Failed to update issue status: ${response.statusText}`);
      }

      const issue = await response.json();
      return this.transformIssue(issue);
    } catch (error) {
      console.error('Error updating GitHub issue status:', error);
      throw error;
    }
  }

  // Add comment to issue
  async addComment(owner, repo, issueNumber, comment) {
    try {
      const headers = this.getHeaders();
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ body: comment })
      });

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding GitHub comment:', error);
      throw error;
    }
  }

  // Get repository summary (repo info + issues + PRs + commits)
  async getRepositorySummary(owner, repo) {
    try {
      const [repoInfo, issues, prs, commits] = await Promise.all([
        this.getRepository(owner, repo),
        this.getIssues(owner, repo),
        this.getPullRequests(owner, repo),
        this.getCommits(owner, repo)
      ]);

      return {
        repoInfo: this.transformRepository(repoInfo),
        issues,
        prs,
        commits
      };
    } catch (error) {
      console.error('Error fetching repository summary:', error);
      throw error;
    }
  }

  // Transform repository data
  transformRepository(repo) {
    return {
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      language: repo.language,
      lastCommit: repo.updated_at,
      openIssues: repo.open_issues_count,
      pullRequests: repo.open_issues_count, // Will be updated separately
      html_url: repo.html_url,
      default_branch: repo.default_branch
    };
  }

  // Transform issue data
  transformIssue(issue) {
    return {
      id: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      user: {
        login: issue.user.login,
        avatar_url: issue.user.avatar_url
      },
      created_at: issue.created_at,
      updated_at: issue.updated_at,
      closed_at: issue.closed_at,
      labels: issue.labels.map(label => label.name),
      assignees: issue.assignees.map(assignee => ({
        login: assignee.login,
        avatar_url: assignee.avatar_url
      })),
      comments: issue.comments,
      html_url: issue.html_url
    };
  }

  // Transform pull request data
  transformPullRequest(pr) {
    return {
      id: pr.number,
      title: pr.title,
      body: pr.body,
      state: pr.state,
      user: {
        login: pr.user.login,
        avatar_url: pr.user.avatar_url
      },
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      closed_at: pr.closed_at,
      merged_at: pr.merged_at,
      labels: pr.labels.map(label => label.name),
      assignees: pr.assignees.map(assignee => ({
        login: assignee.login,
        avatar_url: assignee.avatar_url
      })),
      comments: pr.comments,
      review_comments: pr.review_comments,
      commits: pr.commits,
      additions: pr.additions,
      deletions: pr.deletions,
      changed_files: pr.changed_files,
      html_url: pr.html_url
    };
  }

  // Transform commit data
  transformCommit(commit) {
    return {
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        date: commit.commit.author.date
      },
      committer: {
        name: commit.commit.committer.name,
        email: commit.commit.committer.email,
        date: commit.commit.committer.date
      },
      html_url: commit.html_url
    };
  }

  // Check if initialized
  isInitialized() {
    return this.authHeader !== null;
  }

  // Reset (disconnect)
  reset() {
    this.authHeader = null;
  }
}

export default new GitHubService(); 