/// <reference types="vite/client" />
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: (data: any) => api.post('/api/auth/register', data),
  login: (data: any) => api.post('/api/auth/login', data),
};

export const taskApi = {
  getAll: () => api.get('/api/tasks'),
  create: (data: any) => api.post('/api/tasks', data),
  complete: (id: number, validationData: any) => api.post(`/api/tasks/${id}/complete`, { validationData }),
};

export const goalApi = {
  getAll: () => api.get('/api/goals'),
  create: (data: any) => api.post('/api/goals', data),
};

export const adminApi = {
  getConfig: () => api.get('/api/admin/config'),
  updateConfig: (data: any) => api.post('/api/admin/config', data),
  getUsers: () => api.get('/api/admin/users'),
  updateUser: (id: number, data: any) => api.post(`/api/admin/users/${id}`, data),
};

export const aiApi = {
  getSuggestions: () => api.get('/api/ai/suggestions'),
};

export default api;
