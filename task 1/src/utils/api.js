import { getOrCreateDeviceId } from './device';

const API_BASE_URL = 'http://localhost:5001/api';

/**
 * Universal API Request Handler
 * Automatically appends stored JWT token and unique deviceId headers
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = localStorage.getItem('meetflow_token');
  const deviceId = getOrCreateDeviceId();

  const headers = {
    'Content-Type': 'application/json',
    'x-device-id': deviceId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (!err.status) {
      // Network / connectivity issue
      err.message = 'Unable to connect to MeetFlow server. Please ensure the backend is running.';
    }
    throw err;
  }
}

export const api = {
  get: (url, options) => apiRequest(url, { ...options, method: 'GET' }),
  post: (url, body, options) => apiRequest(url, { ...options, method: 'POST', body }),
  put: (url, body, options) => apiRequest(url, { ...options, method: 'PUT', body }),
  patch: (url, body, options) => apiRequest(url, { ...options, method: 'PATCH', body }),
  delete: (url, options) => apiRequest(url, { ...options, method: 'DELETE' }),
};

export default api;
