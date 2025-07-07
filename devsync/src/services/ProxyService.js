// Proxy Service to handle CORS issues
class ProxyService {
  constructor() {
    // List of CORS proxies to try (starting with direct connection)
    this.proxies = [
      null, // Direct connection (no proxy) - try first
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
      'https://thingproxy.freeboard.io/fetch/',
      'https://cors-anywhere.herokuapp.com/' // Last resort
    ];
    this.currentProxyIndex = 0;
  }

  // Get current proxy URL
  getCurrentProxy() {
    return this.proxies[this.currentProxyIndex];
  }

  // Try next proxy
  nextProxy() {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
    return this.getCurrentProxy();
  }

  // Make a proxied request
  async fetch(url, options = {}) {
    const proxy = this.getCurrentProxy();
    
    if (!proxy) {
      // Direct request
      return fetch(url, options);
    }

    // Proxied request
    const proxyUrl = proxy + encodeURIComponent(url);
    console.log('Trying proxy:', proxy, 'for URL:', url);
    
    try {
      const response = await fetch(proxyUrl, {
        ...options,
        headers: {
          ...options.headers,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (response.ok) {
        console.log('Proxy request successful');
        return response;
      } else {
        throw new Error(`Proxy request failed: ${response.status}`);
      }
    } catch (error) {
      console.log('Proxy failed, trying next one...');
      this.nextProxy();
      throw error;
    }
  }

  // Reset to first proxy
  reset() {
    this.currentProxyIndex = 0;
  }
}

export default new ProxyService(); 