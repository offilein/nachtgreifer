const BASE = '/api';

const getToken = () => localStorage.getItem('ng_token');
const getUser = () => JSON.parse(localStorage.getItem('ng_user') || 'null');
const setAuth = (token, user) => {
  localStorage.setItem('ng_token', token);
  localStorage.setItem('ng_user', JSON.stringify(user));
};
const clearAuth = () => {
  localStorage.removeItem('ng_token');
  localStorage.removeItem('ng_user');
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  if (res.status === 204) return null;
  if (res.status === 401 && !path.startsWith('/auth/')) {
    clearAuth();
    location.href = '/login.html';
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  me: () => request('/auth/me'),

  // Posts
  getPosts: (page = 1, sort = 'newest', q = '') => {
    const params = new URLSearchParams({ page, sort });
    if (q) params.set('q', q);
    return request(`/posts?${params}`);
  },
  getPost: (id) => request(`/posts/${id}`),
  createPost: (formData) => request('/posts', { method: 'POST', body: formData }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),

  // Comments
  getComments: (postId) => request(`/posts/${postId}/comments`),
  createComment: (postId, content) => request(`/posts/${postId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }),
  deleteComment: (id) => request(`/posts/comments/${id}`, { method: 'DELETE' }),

  // Ratings
  ratePost: (postId, value) => request(`/posts/${postId}/rate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value }) }),
  removeRating: (postId) => request(`/posts/${postId}/rate`, { method: 'DELETE' }),

  // Users
  getUser: (id) => request(`/users/${id}`),
  updateAvatar: (formData) => request('/users/me/avatar', { method: 'PUT', body: formData }),
};

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const avatarUrl = (url, username) =>
  url || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1e1e2e&color=cdd6f4&size=64`;
