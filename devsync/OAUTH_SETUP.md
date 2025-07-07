# OAuth 2.0 Setup Guide

This guide will help you set up OAuth 2.0 authentication for Jira and GitHub integrations.

## Prerequisites

1. A GitHub account
2. A Jira Cloud account (or Atlassian account)
3. Node.js and npm installed

## Step 1: Create Environment Variables

Create a `.env` file in the root directory of your project with the following variables:

```env
# Jira OAuth App Credentials
REACT_APP_JIRA_CLIENT_ID=your-jira-client-id
REACT_APP_JIRA_CLIENT_SECRET=your-jira-client-secret

# GitHub OAuth App Credentials
REACT_APP_GITHUB_CLIENT_ID=your-github-client-id
REACT_APP_GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Step 2: Set up GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the following details:
   - **Application name**: DevSync
   - **Homepage URL**: `http://localhost:5174` (or your development URL)
   - **Authorization callback URL**: `http://localhost:5174/oauth/github/callback`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret** to your `.env` file

## Step 3: Set up Jira OAuth App

1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Click "Create app"
3. Choose "OAuth 2.0 (3LO)" integration
4. Fill in the following details:
   - **App name**: DevSync
   - **App description**: Developer dashboard integration
5. In the "Authorization" section:
   - Add redirect URL: `http://localhost:5174/oauth/jira/callback`
   - Add scopes:
     - **Jira Platform REST API** (Classic scopes):
       - `read:jira-work` (View Jira issue data)
       - `write:jira-work` (Create and manage issues)
       - `read:jira-user` (View user profiles)
       - `manage:jira-project` (Manage project settings)
6. Click "Create"
7. Copy the **Client ID** and **Client Secret** to your `.env` file

## Step 4: Update OAuth Configuration

The OAuth URLs are configured in `src/services/OAuthService.js`. If you're using a different port or domain, update the `redirectUri` in the config:

```javascript
redirectUri: `${window.location.origin}/oauth/jira/callback`
redirectUri: `${window.location.origin}/oauth/github/callback`
```

## Step 5: Start the Application

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Open your browser to `http://localhost:5174`
4. Sign in to your account
5. Go to Settings tab
6. Click "Connect to Jira" or "Connect to GitHub"

## Features

Once connected, you'll have access to:

### Jira Integration
- View all your Jira sites and projects
- Browse and filter issues
- Create new issues
- Update issue status
- Add comments
- Real-time data synchronization

### GitHub Integration
- View repository information
- Browse issues and pull requests
- View commit history
- Create new issues
- Update issue status
- Add comments
- Real-time data synchronization

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Make sure the redirect URL in your OAuth app matches exactly
   - Check that you're using the correct port number

2. **"Client ID not found" error**
   - Verify your environment variables are set correctly
   - Restart your development server after changing `.env`

3. **"Scope not allowed" error**
   - Make sure you've added the required scopes in your OAuth app settings

4. **CORS errors**
   - The OAuth flow should handle CORS automatically
   - If you're still getting errors, check your browser's developer console

### Security Notes

- Never commit your `.env` file to version control
- Keep your client secrets secure
- Use environment variables for production deployments
- Consider using a proxy server for production OAuth flows

## Production Deployment

For production deployment:

1. Update the redirect URLs in your OAuth apps to use your production domain
2. Set up proper environment variables on your hosting platform
3. Consider using a backend proxy for OAuth token exchange (more secure)
4. Implement proper error handling and logging
5. Set up monitoring for OAuth failures

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify your OAuth app configuration
3. Ensure your environment variables are set correctly
4. Check that the redirect URLs match exactly 