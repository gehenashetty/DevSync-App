// OAuth 2.0 Service for Jira and GitHub Integration
class OAuthService {
  constructor() {
    // OAuth configuration
    this.config = {
      jira: {
        clientId: process.env.REACT_APP_JIRA_CLIENT_ID || 'your-jira-client-id',
        clientSecret: process.env.REACT_APP_JIRA_CLIENT_SECRET || 'your-jira-client-secret',
        redirectUri: `${window.location.origin}/oauth/jira/callback`,
        authUrl: 'https://auth.atlassian.com/authorize',
        tokenUrl: 'https://auth.atlassian.com/oauth/token',
        scope: 'read:jira-work write:jira-work read:jira-user'
      },
      github: {
        clientId: process.env.REACT_APP_GITHUB_CLIENT_ID || 'your-github-client-id',
        clientSecret: process.env.REACT_APP_GITHUB_CLIENT_SECRET || 'your-github-client-secret',
        redirectUri: `${window.location.origin}/oauth/github/callback`,
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scope: 'repo user'
      }
    };
  }

  // Generate OAuth URL for authorization
  generateAuthUrl(provider, state = null) {
    const config = this.config[provider];
    if (!config) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: 'code',
      state: state || this.generateState()
    });

    return `${config.authUrl}?${params.toString()}`;
  }

  // Generate random state for CSRF protection
  generateState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(provider, code) {
    const config = this.config[provider];
    
    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code: code,
          redirect_uri: config.redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error exchanging code for token (${provider}):`, error);
      throw error;
    }
  }

  // Refresh access token
  async refreshToken(provider, refreshToken) {
    const config = this.config[provider];
    
    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error refreshing token (${provider}):`, error);
      throw error;
    }
  }

  // Store OAuth tokens securely
  storeTokens(provider, tokens) {
    const key = `oauth_${provider}_tokens`;
    const data = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_in ? Date.now() + (tokens.expires_in * 1000) : null,
      scope: tokens.scope
    };
    
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Get stored tokens
  getTokens(provider) {
    const key = `oauth_${provider}_tokens`;
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    const tokens = JSON.parse(data);
    
    // Check if token is expired
    if (tokens.expires_at && Date.now() > tokens.expires_at) {
      this.clearTokens(provider);
      return null;
    }
    
    return tokens;
  }

  // Clear stored tokens
  clearTokens(provider) {
    const key = `oauth_${provider}_tokens`;
    localStorage.removeItem(key);
  }

  // Check if user is authenticated
  isAuthenticated(provider) {
    const tokens = this.getTokens(provider);
    return tokens && tokens.access_token;
  }

  // Get access token (with refresh if needed)
  async getAccessToken(provider) {
    const tokens = this.getTokens(provider);
    
    if (!tokens) {
      throw new Error(`No tokens found for ${provider}`);
    }

    // Check if token is expired and refresh if needed
    if (tokens.expires_at && Date.now() > tokens.expires_at) {
      if (tokens.refresh_token) {
        try {
          const newTokens = await this.refreshToken(provider, tokens.refresh_token);
          this.storeTokens(provider, newTokens);
          return newTokens.access_token;
        } catch (error) {
          this.clearTokens(provider);
          throw new Error(`Token refresh failed for ${provider}`);
        }
      } else {
        this.clearTokens(provider);
        throw new Error(`Token expired for ${provider}`);
      }
    }

    return tokens.access_token;
  }
}

export default new OAuthService(); 