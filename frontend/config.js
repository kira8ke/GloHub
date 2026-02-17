/**
 * GloHub Frontend Configuration
 * Production Environment Setup
 */

// =====================================================
// BACKEND URL CONFIGURATION
// =====================================================
// This constant is used throughout the frontend for API calls and WebSocket connections

window.BACKEND_URL = 'https://glohub.onrender.com';

// Auto-detect development environment
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('localhost');

// Override for development
if (isDevelopment) {
  window.BACKEND_URL = 'http://localhost:4000';
  console.log('[Config] Development mode detected. Using backend:', window.BACKEND_URL);
} else {
  console.log('[Config] Production mode. Using backend:', window.BACKEND_URL);
}

// =====================================================
// API HELPER FUNCTIONS
// =====================================================

/**
 * Make an API call to the backend
 * @param {string} endpoint - The API endpoint (e.g., '/charades/create')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>}
 */
window.apiCall = async function(endpoint, options = {}) {
  const url = `${window.BACKEND_URL}${endpoint}`;
  
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    credentials: 'include'
  };

  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, finalOptions);
    if (!response.ok) {
      console.error(`API call failed: ${endpoint}`, response.status, response.statusText);
    }
    return response;
  } catch (error) {
    console.error(`API call error: ${endpoint}`, error);
    throw error;
  }
};

/**
 * Create a WebSocket connection to the backend
 * @param {object} options - WebSocket options
 * @returns {WebSocket}
 */
window.createWebSocket = function(options = {}) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const backendUrl = window.BACKEND_URL;
  
  // Convert https:// to wss:// and http:// to ws://
  let wsUrl = backendUrl.replace('https://', 'wss://').replace('http://', 'ws://');
  
  console.log('[WebSocket] Connecting to:', wsUrl);
  
  const ws = new WebSocket(wsUrl);
  
  if (options.onopen) ws.onopen = options.onopen;
  if (options.onmessage) ws.onmessage = options.onmessage;
  if (options.onerror) ws.onerror = options.onerror;
  if (options.onclose) ws.onclose = options.onclose;
  
  return ws;
};

console.log('[GloHub Config] Loaded successfully');
