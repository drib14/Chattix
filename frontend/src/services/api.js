const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// This lets us dynamically fetch the token from Clerk if it expires,
// rather than relying only on a potentially stale localStorage value.
let getClerkTokenCallback = null;

export const setTokenProvider = (getToken) => {
  getClerkTokenCallback = getToken;
};

const getHeaders = async () => {
  let token = localStorage.getItem('token');

  if (getClerkTokenCallback) {
    try {
      const freshToken = await getClerkTokenCallback();
      if (freshToken) {
        token = freshToken;
        localStorage.setItem('token', token);
      }
    } catch (e) {
      console.warn("Failed to get fresh Clerk token", e);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  get: async (endpoint) => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'API request failed');
    }
    return res.json();
  },

  post: async (endpoint, body) => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'API request failed');
    }
    return res.json();
  },

  put: async (endpoint, body) => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'API request failed');
    }
    return res.json();
  },

  delete: async (endpoint) => {
    const headers = await getHeaders();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'API request failed');
    }
    return res.json();
  },

  upload: async (endpoint, formData, onProgress) => {
    let token = localStorage.getItem('token');

    if (getClerkTokenCallback) {
      try {
        const freshToken = await getClerkTokenCallback();
        if (freshToken) token = freshToken;
      } catch (e) {}
    }
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}${endpoint}`);
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
      
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.message || 'Upload failed'));
          } catch (e) {
            reject(new Error('Upload failed'));
          }
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
  },
};

export default api;
