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

  const response = await originalFetch(input, init);

  if (response.status === 401 && isBackendRequest) {
    const isAuthRoute = url.includes('/api/auth/login') || url.includes('/api/auth/session');
    if (!isAuthRoute) {
      window.dispatchEvent(new CustomEvent('auth-unauthorized'));
    }
  }

  return response;
};


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
