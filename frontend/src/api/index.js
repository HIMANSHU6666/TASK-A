import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lead_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear stored auth and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('lead_token');
      localStorage.removeItem('lead_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
};

// ── Leads
export const leadsAPI = {
  list:         (params) => api.get('/leads', { params }),
  get:          (id)     => api.get(`/leads/${id}`),
  create:       (data)   => api.post('/leads', data),
  updateStatus: (id, status) => api.patch(`/leads/${id}/status`, { status }),
  assign:       (id, userId) => api.patch(`/leads/${id}/assign`, { userId }),
  addNote:      (id, text)   => api.post(`/leads/${id}/notes`, { text }),
  getActivity:  (id)         => api.get(`/leads/${id}/activity`),
};

// ── Users (admin only)
export const usersAPI = {
  list: () => api.get('/users'),
};

export default api;
