// Vite exposes only VITE_* variables to browser code. Keep this value free of
// a trailing slash so callers can safely append API paths.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export const apiUrl = (path) => `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
