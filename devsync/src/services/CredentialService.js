// Credential Management Service for Jira and GitHub
class CredentialService {
  constructor() {
    this.storageKey = 'devsync_credentials';
  }

  // Store credentials securely
  storeCredentials(provider, credentials) {
    const allCredentials = this.getAllCredentials();
    allCredentials[provider] = {
      ...credentials,
      timestamp: Date.now()
    };
    
    localStorage.setItem(this.storageKey, JSON.stringify(allCredentials));
  }

  // Get credentials for a specific provider
  getCredentials(provider) {
    const allCredentials = this.getAllCredentials();
    return allCredentials[provider] || null;
  }

  // Get all stored credentials
  getAllCredentials() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading credentials:', error);
      return {};
    }
  }

  // Check if credentials exist for a provider
  hasCredentials(provider) {
    const credentials = this.getCredentials(provider);
    return credentials !== null;
  }

  // Remove credentials for a provider
  removeCredentials(provider) {
    const allCredentials = this.getAllCredentials();
    delete allCredentials[provider];
    localStorage.setItem(this.storageKey, JSON.stringify(allCredentials));
  }

  // Clear all credentials
  clearAllCredentials() {
    localStorage.removeItem(this.storageKey);
  }

  // Validate Jira credentials format
  validateJiraCredentials(credentials) {
    const required = ['domain', 'email', 'apiToken'];
    return required.every(field => credentials[field] && credentials[field].trim() !== '');
  }

  // Validate GitHub credentials format
  validateGitHubCredentials(credentials) {
    const required = ['token'];
    return required.every(field => credentials[field] && credentials[field].trim() !== '');
  }

  // Get Jira base URL from domain
  getJiraBaseUrl(domain) {
    // Remove protocol if present
    const cleanDomain = domain.replace(/^https?:\/\//, '');
    return `https://${cleanDomain}`;
  }
}

export default new CredentialService(); 