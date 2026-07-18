import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { apiUrl, API_URL } from './api.js'

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

  const isBackendRequest = url.startsWith(API_URL) || url.startsWith('/api') || url.startsWith('api/');
  const requestInput = (url.startsWith('/api') || url.startsWith('api/'))
    ? apiUrl(url)
    : input;
  
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
    response = await originalFetch(requestInput, fetchOptions);
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
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
