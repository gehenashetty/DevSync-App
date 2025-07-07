// ConfluenceService.js
// Service for interacting with backend proxy for Confluence Cloud REST API

async function fetchSpaces() {
  const res = await fetch('/api/confluence/spaces');
  if (!res.ok) throw new Error('Failed to fetch spaces');
  return res.json();
}

async function fetchPages(spaceKey) {
  const res = await fetch(`/api/confluence/pages?spaceKey=${spaceKey}`);
  if (!res.ok) throw new Error('Failed to fetch pages');
  return res.json();
}

async function fetchPageContent(pageId) {
  const res = await fetch(`${API_BASE}/wiki/rest/api/content/${pageId}?expand=body.storage`, {
    headers: {
      'Authorization': getAuthHeader(),
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error('Failed to fetch page content');
  return res.json();
}

export default {
  fetchSpaces,
  fetchPages,
  fetchPageContent,
}; 