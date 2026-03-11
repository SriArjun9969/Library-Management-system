// public/js/api.js - API communication layer
const API_BASE = '/api';

// ─── HTTP Client ──────────────────────────────────────────────────────────────
const api = {
  async request(method, endpoint, data = null) {
    const token = localStorage.getItem('token');
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (data) options.body = JSON.stringify(data);

    const res = await fetch(`${API_BASE}${endpoint}`, options);
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || 'Request failed');
    return json;
  },

  get: (endpoint) => api.request('GET', endpoint),
  post: (endpoint, data) => api.request('POST', endpoint, data),
  put: (endpoint, data) => api.request('PUT', endpoint, data),
  delete: (endpoint) => api.request('DELETE', endpoint),
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/password', data),
};

// ─── Books API ────────────────────────────────────────────────────────────────
const booksAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/books${qs ? '?' + qs : ''}`);
  },
  getOne: (id) => api.get(`/books/${id}`),
  add: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
  getCategories: () => api.get('/books/categories'),
};

// ─── Issues API ───────────────────────────────────────────────────────────────
const issuesAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/issues${qs ? '?' + qs : ''}`);
  },
  getMy: () => api.get('/issues/my'),
  getOverdue: () => api.get('/issues/overdue'),
  getStats: () => api.get('/issues/stats'),
  issue: (data) => api.post('/issues', data),
  return: (id, data) => api.put(`/issues/${id}/return`, data),
};

// ─── Users API ────────────────────────────────────────────────────────────────
const usersAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/users${qs ? '?' + qs : ''}`);
  },
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateProfile: (data) => api.put('/users/profile', data),
  toggle: (id) => api.put(`/users/${id}/toggle`),
};
