import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global Fetch Interceptor for JWT HTTP-only credentials and 401 handling
const originalFetch = window.fetch;
window.fetch = async (input, init = {}) => {
  let url = '';
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input && typeof input === 'object' && 'url' in input) {
    url = input.url;
  }

  const isBackendRequest = url.startsWith('http://localhost:3001') || url.startsWith('/api') || url.startsWith('api/');
  
  if (isBackendRequest) {
    init.credentials = 'include';
  }

  const skipGlobalToast = init.skipGlobalToast;

  // Clean up our custom option before passing to originalFetch
  let fetchOptions = init;
  if (init && 'skipGlobalToast' in init) {
    const { skipGlobalToast: _, ...rest } = init;
    fetchOptions = rest;
  }

  let response;
  try {
    response = await originalFetch(input, fetchOptions);
  } catch (err) {
    if (isBackendRequest && !skipGlobalToast) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Network error or server is unreachable. Please verify your connection.', type: 'error' }
      }));
    }
    throw err;
  }

  if (response.status === 401 && isBackendRequest) {
    const isAuthRoute = url.includes('/api/auth/login') || url.includes('/api/auth/session');
    if (!isAuthRoute) {
      window.dispatchEvent(new CustomEvent('auth-unauthorized'));
    }
  }

  if (!response.ok && isBackendRequest && !skipGlobalToast) {
    let errMsg = `Request failed with status ${response.status}`;
    try {
      const cloned = response.clone();
      const data = await cloned.json();
      errMsg = data.message || data.error || errMsg;
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('show-toast', {
      detail: { message: errMsg, type: 'error' }
    }));
  }

  return response;
};


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
